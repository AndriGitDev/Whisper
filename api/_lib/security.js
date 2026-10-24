// Security middleware for API endpoints

import { createHash } from 'node:crypto';
import { incrementRateLimit } from './storage.js';

export function trustedProxyPolicy(env = process.env) {
  const proxies = (env.TRUSTED_PROXIES || '').split(',').map(value => value.trim()).filter(Boolean);
  return proxies.length ? proxies : false;
}

/**
 * Rate limiting middleware
 * @param {Request} req - Request object
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object|null} - Returns error response if rate limited, null otherwise
 */
export async function checkRateLimit(req, maxRequests = 10, windowMs = 60000) {
  // A caller-controlled user agent must not create a fresh rate-limit bucket.
  const identifier = getClientIdentifier(req);
  const key = createHash('sha256').update(identifier).digest('hex');
  const rateData = await incrementRateLimit(key, windowMs);
  if (rateData.count > maxRequests) {
    // Rate limit exceeded
    return {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.max(1, Math.ceil(rateData.ttlMs / 1000))
    };
  }

  return null;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req) {
  // Express resolves req.ip using the server's configured proxy trust policy.
  if (req.ip) return req.ip;
  // Vercel replaces this header at its edge. Direct Node requests must use the
  // socket address rather than trusting arbitrary forwarding headers.
  if (process.env.VERCEL === '1') {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * CORS middleware with configurable origins
 * @param {Response} res - Response object
 * @param {Request} req - Request object
 */
export function setCorsHeaders(res, req) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const sameOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;

  if (origin && (origin === sameOrigin || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Get allowed origins from environment or default to current host only
 */
function getAllowedOrigins() {
  // In production, set ALLOWED_ORIGINS env var to comma-separated list of domains
  // Example: "https://yourdomain.com,https://www.yourdomain.com"
  const envOrigins = process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }

  // Development: allow localhost
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  }

  // Production defaults to same-origin only. Add explicit HTTPS origins with ALLOWED_ORIGINS.
  return []; // Empty array means same-origin only
}

/**
 * Set security headers
 */
export function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self';"
  );
}

/**
 * Validate secret creation input
 */
export function validateSecretInput(body) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['Request body must be a JSON object'];
  }

  // Check required fields (salt is optional for backward compatibility)
  if (!body.encryptedData || !body.iv) {
    errors.push('Missing required fields: encryptedData or iv');
  }

  // Validate encryptedData size (max 100KB base64 encoded)
  if (body.encryptedData && body.encryptedData.length > 100 * 1024) {
    errors.push('Encrypted data too large (max 100KB)');
  }

  // Validate IV format (should be base64)
  if (body.iv && !isValidBase64(body.iv)) {
    errors.push('Invalid IV format');
  }

  // Validate salt format only if provided and not a placeholder
  if (body.salt && body.salt !== 'unused-in-this-version' && !isValidBase64(body.salt)) {
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
  if (typeof str !== 'string' || str.length === 0 || str.length % 4 !== 0) return false;
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}
