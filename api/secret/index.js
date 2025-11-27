const crypto = require('crypto');
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { encryptedData, iv, salt, expiration, views } = req.body;

            if (!encryptedData || !iv || !salt) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const id = crypto.randomBytes(16).toString('hex');

            const secret = {
                encryptedData,
                iv,
                salt,
                viewsRemaining: views || 1, // Default to 1 view
            };

            const ttl = expiration || 24 * 60 * 60; // Default to 24 hours in seconds

            await kv.set(id, secret, { ex: ttl });

            res.json({ id });
        } else {
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error creating secret:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
