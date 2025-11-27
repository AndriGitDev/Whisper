// Security middleware for API endpoints

// Rate limiting using in-memory store (for serverless, consider using KV store for production)
const rateLimitStore = new Map();

// Clean up old rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param {Request} req - Request object
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object|null} - Returns error response if rate limited, null otherwise
 */
export function checkRateLimit(req, maxRequests = 10, windowMs = 60000) {
  // Use IP address or a combination of IP and user agent for identification
  const identifier = getClientIdentifier(req);
  const now = Date.now();

  const rateData = rateLimitStore.get(identifier);

  if (!rateData) {
    // First request from this identifier
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return null;
  }

  if (now > rateData.resetTime) {
    // Window has expired, reset
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return null;
  }

  if (rateData.count >= maxRequests) {
    // Rate limit exceeded
    return {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateData.resetTime - now) / 1000)
    };
  }

  // Increment count
  rateData.count++;
  return null;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req) {
  // Try to get real IP from various headers (Vercel specific)
  const ip = req.headers['x-real-ip'] ||
             req.headers['x-forwarded-for']?.split(',')[0] ||
             req.socket?.remoteAddress ||
             'unknown';

  // Combine with user agent for better uniqueness
  const userAgent = req.headers['user-agent'] || 'unknown';
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * CORS middleware with configurable origins
 * @param {Response} res - Response object
 * @param {Request} req - Request object
 */
export function setCorsHeaders(res, req) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // If no origin header is present, it's a same-origin request - allow it
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard allowed
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes(origin)) {
    // Origin is in whitelist
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (allowedOrigins.length === 0) {
    // No whitelist configured - allow the request origin (same-origin policy)
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    // Origin not allowed - still need to set a CORS header to avoid errors
    // Use wildcard for better compatibility (can be restricted via ALLOWED_ORIGINS env var)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Get allowed origins from environment or default to permissive for ease of use
 */
function getAllowedOrigins() {
  // In production, set ALLOWED_ORIGINS env var to comma-separated list of domains
  // Example: "https://yourdomain.com,https://www.yourdomain.com"
  // Or set to "*" to allow all origins
  const envOrigins = process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }

  // Default: Allow all origins for ease of use
  // For stricter security, set ALLOWED_ORIGINS environment variable
  return ['*'];
}

/**
 * Set security headers
 */
export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );
}

/**
 * Validate secret creation input
 */
export function validateSecretInput(body) {
  const errors = [];

  // Check required fields
  if (!body.encryptedData || !body.iv || !body.salt) {
    errors.push('Missing required fields: encryptedData, iv, or salt');
  }

  // Validate encryptedData size (max 100KB base64 encoded)
  if (body.encryptedData && body.encryptedData.length > 100 * 1024) {
    errors.push('Encrypted data too large (max 100KB)');
  }

  // Validate IV format (should be base64)
  if (body.iv && !isValidBase64(body.iv)) {
    errors.push('Invalid IV format');
  }

  // Validate salt format
  if (body.salt && !isValidBase64(body.salt)) {
    errors.push('Invalid salt format');
  }

  // Validate expiration (max 30 days)
  if (body.expiration) {
    const exp = Number(body.expiration);
    if (isNaN(exp) || exp < 0 || exp > 30 * 24 * 60 * 60) {
      errors.push('Invalid expiration (must be 0-30 days in seconds)');
    }
  }

  // Validate views (1-100)
  if (body.views !== undefined) {
    const views = Number(body.views);
    if (isNaN(views) || views < 1 || views > 100) {
      errors.push('Invalid views count (must be 1-100)');
    }
  }

  return errors;
}

/**
 * Check if string is valid base64
 */
function isValidBase64(str) {
  if (typeof str !== 'string') return false;
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}
