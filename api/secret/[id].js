import { getSecret, deleteSecret, decrementViews } from '../_lib/storage.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;
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
