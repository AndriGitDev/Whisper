import { getSecret, deleteSecret, decrementViews } from '../_lib/storage.js';
import { checkRateLimit, setCorsHeaders, setSecurityHeaders } from '../_lib/security.js';

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res, req);

  // Set security headers
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Rate limiting: 20 retrievals per minute per client (higher than creation)
      const rateLimitError = checkRateLimit(req, 20, 60000);
      if (rateLimitError) {
        return res.status(429).json(rateLimitError);
      }

      const { id } = req.query;

      // Validate ID format (should be 32 hex characters)
      if (!id || !/^[a-f0-9]{32}$/i.test(id)) {
        return res.status(400).json({ error: 'Invalid secret ID format' });
      }

      const secret = await getSecret(id);

      if (!secret) {
        return res.status(404).json({ error: 'Secret not found or expired' });
      }

      // Check expiration
      if (secret.expiration && Date.now() > secret.expiration) {
        await deleteSecret(id);
        return res.status(404).json({ error: 'Secret not found or expired' });
      }

      const responseData = {
        encryptedData: secret.encryptedData,
        iv: secret.iv,
        salt: secret.salt
      };

      // Decrement views and delete if needed
      await decrementViews(id);

      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Error retrieving secret:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
