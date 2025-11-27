import crypto from 'crypto';
import { setSecret } from './_lib/storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // Create a secret
      const { encryptedData, iv, salt, expiration, views } = req.body;

      if (!encryptedData || !iv || !salt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

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
