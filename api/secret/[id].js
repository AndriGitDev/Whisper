import { kv } from '@vercel/kv';

export default async (req, res) => {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        return res.status(500).json({ error: 'KV environment variables not set.' });
    }

    try {
        if (req.method === 'GET') {
            const { id } = req.query;
            const data = await kv.get(id);

            if (!data) {
                return res.status(404).json({ error: 'Secret not found or expired' });
            }
            const secret = typeof data === 'string' ? JSON.parse(data) : data;


            const responseData = {
                encryptedData: secret.encryptedData,
                iv: secret.iv,
                salt: secret.salt,
            };

            if (secret.viewsRemaining <= 1) {
                // Delete the secret if no views are remaining
                await kv.del(id);
            } else {
                secret.viewsRemaining -= 1;
                const ttl = await kv.ttl(id);
                await kv.set(id, JSON.stringify(secret), { ex: ttl });
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
