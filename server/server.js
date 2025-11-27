const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const { kv } = require('@vercel/kv');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a secret
app.post('/api/secret', async (req, res) => {
    try {
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

        // Use Vercel KV's time-to-live (TTL) feature for expiration
        const ttl = expiration || 24 * 60 * 60; // Default to 24 hours in seconds

        await kv.set(id, secret, { ex: ttl });

        res.json({ id });
    } catch (error) {
        console.error('Error creating secret:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Retrieve a secret
app.get('/api/secret/:id', async (req, res) => {
    try {
        const { id } = req.params;
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
    } catch (error) {
        console.error('Error retrieving secret:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
