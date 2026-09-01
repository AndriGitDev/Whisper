# Whisper

A secure web application for temporarily sharing secrets and passwords with client-side encryption.

## Features

- 🔐 **Client-side Encryption**: Secrets are encrypted in your browser before transmission
- 🔥 **Burn on Read**: Secrets can self-destruct after being viewed
- ⏱️ **Time-Limited**: Set expiration times (1 hour to 7 days)
- 👁️ **View Limits**: Control how many times a secret can be accessed
- 🚫 **Zero Knowledge**: Server never sees your unencrypted data
- 🎨 **Modern UI**: Clean, responsive interface

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

## Deployment

### Deploy to Vercel (Recommended)

1. Import this repository into Vercel.
2. Add an Upstash Redis database from the Vercel Marketplace and connect it to the project.
3. Deploy. `vercel.json` builds the Vite frontend and exposes the files in `api/` as Node.js Functions.

Persistent Redis storage is required in production so secrets, view counters, and rate limits remain consistent across stateless Function instances. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for the complete setup and verification steps.

### Deploy to Ubuntu VPS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying to a traditional VPS with Nginx and PM2.

## Local Development

### Prerequisites

- Node.js 22+ and npm

### Setup

1. Install dependencies from the repository root:
```bash
npm install
```

2. Run the frontend with hot reload:
```bash
npm run dev
```

For a complete local build with the API and development-only in-memory storage:
```bash
npm run build
npm start
```

Run the verification suite with:
```bash
npm test
npm run lint
npm run build
```

## Technology Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion
- **Backend**: Express.js (local) / Vercel Serverless Functions (production)
- **Storage**: In-memory (local) / Upstash Redis (production)
- **Encryption**: Web Crypto API (AES-GCM)

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Author

Made by [Andri Petur](https://andri.is)
