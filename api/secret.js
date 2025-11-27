import crypto from 'crypto';
import { setSecret } from './_lib/storage.js';
import { checkRateLimit, setCorsHeaders, setSecurityHeaders, validateSecretInput } from './_lib/security.js';

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res, req);

  // Set security headers
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // Rate limiting: 10 secrets per minute per client
      const rateLimitError = checkRateLimit(req, 10, 60000);
      if (rateLimitError) {
        return res.status(429).json(rateLimitError);
      }

      // Validate input
      const validationErrors = validateSecretInput(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }

      // Create a secret
      const { encryptedData, iv, salt, expiration, views } = req.body;

      const id = crypto.randomBytes(16).toString('hex');
      const now = Date.now();

      // Calculate expiration time
      let expirationTime = null;
      if (expiration) {
        expirationTime = now + (expiration * 1000);
      } else {
        expirationTime = now + (24 * 60 * 60 * 1000);
      }

      const secret = {
        encryptedData,
        iv,
        salt,
        expiration: expirationTime,
        viewsRemaining: views || 1
      };

      await setSecret(id, secret);

      return res.status(200).json({ id });
    } catch (error) {
      console.error('Error creating secret:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
