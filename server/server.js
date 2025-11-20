const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(morgan('dev'));

// In-memory storage
// Map<id, { encryptedData: string, iv: string, salt: string, expiration: number, viewsRemaining: number }>
const secrets = new Map();

// Cleanup job (runs every minute)
setInterval(() => {
  const now = Date.now();
  for (const [id, secret] of secrets.entries()) {
    if (secret.expiration && now > secret.expiration) {
      secrets.delete(id);
    }
  }
}, 60 * 1000);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a secret
app.post('/api/secret', (req, res) => {
  const { encryptedData, iv, salt, expiration, views } = req.body;

  if (!encryptedData || !iv || !salt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  
  // Calculate expiration time
  let expirationTime = null;
  if (expiration) {
      // expiration is in seconds
      expirationTime = now + (expiration * 1000);
  } else {
      // Default to 24 hours if not specified (safety net)
      expirationTime = now + (24 * 60 * 60 * 1000);
  }

  const secret = {
    encryptedData,
    iv,
    salt,
    expiration: expirationTime,
    viewsRemaining: views || 1 // Default to 1 view
  };

  secrets.set(id, secret);

  res.json({ id });
});

// Retrieve a secret
app.get('/api/secret/:id', (req, res) => {
  const { id } = req.params;
  const secret = secrets.get(id);

  if (!secret) {
    return res.status(404).json({ error: 'Secret not found or expired' });
  }

  // Check expiration
  if (secret.expiration && Date.now() > secret.expiration) {
    secrets.delete(id);
    return res.status(404).json({ error: 'Secret not found or expired' });
  }

  // Decrement views
  secret.viewsRemaining -= 1;
  
  // Return data BEFORE deleting if views are 0
  const responseData = {
    encryptedData: secret.encryptedData,
    iv: secret.iv,
    salt: secret.salt
  };

  if (secret.viewsRemaining <= 0) {
    secrets.delete(id);
  }

  res.json(responseData);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
