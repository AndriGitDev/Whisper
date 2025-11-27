import crypto from 'crypto';
import { kv as vercelKv } from '@vercel/kv';
import { kv as mockKv } from '../kv-mock.js';

const kv = process.env.NODE_ENV === 'development' ? mockKv : vercelKv;

export default async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { encryptedData, iv, expiration, views } = req.body;

            if (!encryptedData || !iv) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const id = crypto.randomBytes(16).toString('hex');

            const secret = {
                encryptedData,
                iv,
                viewsRemaining: views || 1, // Default to 1 view
            };

            const ttl = expiration || 24 * 60 * 60; // Default to 24 hours in seconds

            await kv.set(id, JSON.stringify(secret), { ex: ttl });

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
