# Whisper

A website to secretly share secrets or passwords temporarily.

## Features

- 🔐 **Client-side Encryption**: Secrets are encrypted in your browser before transmission
- 🔥 **Burn on Read**: Secrets can self-destruct after being viewed
- ⏱️ **Time-Limited**: Set expiration times (1 hour to 7 days)
- 👁️ **View Limits**: Control how many times a secret can be accessed
- 🚫 **Zero Knowledge**: Server never sees your unencrypted data
- 🎨 **Modern UI**: Clean, responsive interface

## Deployment Options

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/andripetur/Whisper)

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

**Important**: You'll need to add Redis (KV) storage for persistence. See [STORAGE_SETUP.md](./STORAGE_SETUP.md) for setup instructions.

### Deploy to Ubuntu VPS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying to a traditional VPS.

## Local Development

### Prerequisites

- Node.js 20+ and npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/andripetur/Whisper.git
cd Whisper
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Run the development servers:

**Terminal 1 - Backend:**
```bash
cd server
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

4. Open http://localhost:5173 in your browser

## Technology Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion
- **Backend**: Express.js (local) / Vercel Serverless Functions (production)
- **Storage**: In-memory (local) / Vercel KV (production)
- **Encryption**: Web Crypto API (AES-GCM)

## How It Works

1. User enters a secret message
2. A random encryption key is generated in the browser
3. The message is encrypted using AES-GCM
4. Encrypted data is sent to the server
5. Server stores encrypted data with expiration/view limits
6. User receives a shareable link containing the decryption key in the URL fragment
7. Recipient opens the link and the key (from URL fragment) decrypts the message client-side
8. Secret is deleted after viewing or expiration

**Security Note**: The decryption key never leaves the browser and is not sent to the server.

## License

MIT

## Author

Made by [Andri Petur](https://andri.is)
