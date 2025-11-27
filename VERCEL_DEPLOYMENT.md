# Whisper - Vercel Deployment Guide

This guide explains how to deploy the Whisper application to Vercel.

## Architecture Overview

The project has been restructured for Vercel deployment:
- **Frontend**: React + Vite app (served as static files)
- **Backend**: Vercel Serverless Functions (in the `/api` directory)
- **Storage**: Vercel KV (Redis) for persistent storage (recommended) with in-memory fallback

## Quick Start

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration from `vercel.json`
6. Click "Deploy"

#### Option B: Deploy via CLI

```bash
# From the project root
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Accept default settings
```

### 3. Add Redis Storage (Recommended for Production)

**IMPORTANT**: The serverless functions will work with an in-memory fallback, but for production use, you should add Redis storage to persist secrets across function invocations.

**Note**: You need **KV (Redis)** storage, NOT Blob storage. Blob is for files; KV is for data.

> 📖 **Confused about storage options?** See [STORAGE_SETUP.md](./STORAGE_SETUP.md) for detailed setup instructions and troubleshooting.

#### Option A: Vercel KV (Powered by Upstash Redis)

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the "Storage" tab
3. Click "Create" or "Connect Store"
4. Look for **KV** or **Redis** options (may be listed in Marketplace)
5. Select a Redis provider (Upstash is commonly available)
6. Follow the setup wizard
7. Vercel will automatically add the required environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
8. Redeploy your project: Deployments → ⋯ → Redeploy

#### Option B: Direct Upstash Redis

If Vercel KV is not available in your region or plan:

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST API credentials
4. In Vercel Dashboard → Settings → Environment Variables, add:
   - `KV_REST_API_URL` = Your Upstash REST URL
   - `KV_REST_API_TOKEN` = Your Upstash REST token
5. Redeploy your project

The application will automatically detect and use Redis when these environment variables are present.

## Project Structure

```
.
├── api/                      # Vercel Serverless Functions
│   ├── _lib/
│   │   └── storage.js        # Storage abstraction (KV or in-memory)
│   ├── health.js             # Health check endpoint
│   ├── secret.js             # POST /api/secret
│   └── secret/
│       └── [id].js           # GET /api/secret/:id
├── client/                   # React frontend
│   ├── src/
│   ├── dist/                 # Built files (generated)
│   └── package.json
├── server/                   # Original Express server (kept for local dev)
├── vercel.json               # Vercel configuration
├── package.json              # Root package.json
└── .vercelignore             # Files to ignore during deployment
```

## API Endpoints

All API endpoints are automatically available at `/api/*`:

- `GET /health` - Health check
- `POST /api/secret` - Create a new secret
- `GET /api/secret/:id` - Retrieve a secret

## Environment Variables

Optional environment variables (automatically set when using Vercel KV):

- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV REST API token
- `KV_REST_API_READ_ONLY_TOKEN` - Vercel KV read-only token

## Local Development

The original development setup still works:

```bash
# Terminal 1: Start backend (Express server)
cd server
npm install
node server.js

# Terminal 2: Start frontend (Vite dev server)
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the Express server running on port 3000.

## Custom Domain

To add a custom domain:

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Domains"
3. Add your domain and follow DNS configuration instructions

## Monitoring and Logs

- **Logs**: View function logs in Vercel Dashboard → Your Project → Deployments → Click on deployment → Functions tab
- **Analytics**: Enable Vercel Analytics in Project Settings for visitor insights
- **Monitoring**: Consider enabling Vercel Speed Insights

## Troubleshooting

### Secrets not persisting

If secrets aren't persisting between requests, you likely haven't set up Vercel KV:
1. Add Vercel KV storage (see step 3 above)
2. Redeploy your project

### CORS errors

The API functions include CORS headers. If you still experience issues:
- Check that you're using relative URLs (`/api/secret`) in frontend code
- Verify your domain is correctly configured

### Build failures

If the build fails:
1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Try running `npm run build` locally in the `client` directory

## Security Considerations

1. **Client-side encryption**: All secrets are encrypted client-side before transmission
2. **HTTPS**: Vercel automatically provides SSL certificates
3. **Serverless isolation**: Each function invocation is isolated
4. **KV storage**: Secrets stored in Vercel KV are encrypted at rest

## Scaling

Vercel automatically scales serverless functions based on demand:
- Functions scale to zero when not in use (no cost)
- Automatic scaling during high traffic
- 10-second execution limit per function
- Check [Vercel Pricing](https://vercel.com/pricing) for limits on your plan

## Migration from VPS

If you were previously running on a VPS:

1. The Vercel deployment uses the same frontend and API interface
2. No changes needed to client code
3. Secrets stored in the old VPS will not transfer (they're ephemeral by design)
4. Update DNS to point to your Vercel deployment
5. You can keep the VPS setup in the `server/` directory for local development

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
