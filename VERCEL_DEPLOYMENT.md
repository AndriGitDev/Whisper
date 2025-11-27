# Vercel Deployment Guide

This guide explains how to deploy Whisper to Vercel.

## Quick Start

### Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration from `vercel.json`
6. Click "Deploy"

### Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel
```

## Add Redis Storage (Production)

For production use, add Redis storage to persist secrets across serverless function invocations.

### Option 1: Vercel KV (Recommended)

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create** or **Connect Store**
4. Select **KV** or **Redis** (powered by Upstash)
5. Follow the setup wizard
6. Vercel automatically adds required environment variables
7. Redeploy: Deployments → ⋯ → Redeploy

### Option 2: Direct Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST API credentials
4. In Vercel Dashboard → Settings → Environment Variables, add:
   - `KV_REST_API_URL` = Your Upstash REST URL
   - `KV_REST_API_TOKEN` = Your Upstash REST token
5. Redeploy your project

## Custom Domain

1. Go to your project → **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions

## Environment Variables

Required for persistent storage (automatically set when using Vercel KV):

- `KV_REST_API_URL` - Redis REST API URL
- `KV_REST_API_TOKEN` - Redis REST API token

## Local Development

The original Express.js server can still be used for local development:

```bash
# Terminal 1: Backend
cd server
npm install
node server.js

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

## Troubleshooting

### Secrets not persisting

Add Redis storage following the steps above, then redeploy.

### Build failures

1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Try running `npm run build` locally in the client directory

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Documentation](https://docs.upstash.com/redis)
