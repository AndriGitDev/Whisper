const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const { id } = req.query;
            const secret = await kv.get(id);

            if (!secret) {
                return res.status(404).json({ error: 'Secret not found or expired' });
            }

            // Decrement views
            secret.viewsRemaining -= 1;

            const responseData = {
                encryptedData: secret.encryptedData,
                iv: secret.iv,
                salt: secret.salt,
            };

            if (secret.viewsRemaining <= 0) {
                // Delete the secret if no views are remaining
                await kv.del(id);
            } else {
                // Otherwise, update the secret with the new view count
                const ttl = await kv.ttl(id);
                await kv.set(id, secret, { ex: ttl });
            }

            res.json(responseData);
        } else {
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error retrieving secret:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
