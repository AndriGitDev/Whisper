# Quick Start - Vercel Deployment

Get your Whisper app running on Vercel in 5 minutes.

## Prerequisites

- A GitHub account
- A Vercel account (free tier works great)

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Vercel deployment support"
git push origin main
```

## Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your Whisper repository
4. Click "Import"
5. Vercel auto-detects settings from `vercel.json` - just click **Deploy**

That's it! Your app is now live. 🎉

## Step 3: Add Persistent Storage (Recommended)

Without this, secrets won't persist between serverless function restarts.

**IMPORTANT**: You need **KV/Redis** storage, NOT Blob storage!

> 📖 **Detailed setup guide**: See [STORAGE_SETUP.md](./STORAGE_SETUP.md)

### Option A: Via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click **Storage** tab
3. Click **Create** or **Connect Store**
4. Look for **KV** or **Redis** (NOT Blob!)
5. Select a Redis provider (like Upstash)
6. Follow setup and Vercel auto-connects it
7. Redeploy: **Deployments** → ⋯ → **Redeploy**

### Option B: Direct Upstash (if KV not available)

1. Go to https://console.upstash.com/
2. Create new Redis database (free tier available)
3. Get REST API credentials
4. In Vercel: **Settings** → **Environment Variables** → Add:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
5. Redeploy

Done! Your secrets now persist properly.

## Step 4: (Optional) Add Custom Domain

1. Go to **Settings** → **Domains**
2. Enter your domain
3. Follow DNS configuration instructions
4. Wait a few minutes for DNS propagation

## Vercel CLI (Alternative Method)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, then visit the provided URL
```

## What You Get

✅ Automatic HTTPS
✅ Global CDN
✅ Auto-scaling
✅ Instant deployments on git push
✅ Preview deployments for PRs
✅ Zero-downtime deploys

## Cost

- **Free tier**: 100GB bandwidth/month, plenty for most use cases
- **Pro**: $20/month for more bandwidth and features
- **Enterprise**: Custom pricing

Most personal/small business use cases fit in the free tier.

## Next Steps

- Read [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed configuration
- Read [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) to understand what changed
- Enable Vercel Analytics for visitor insights
- Set up environment variables if needed

## Troubleshooting

**Secrets not persisting?**
→ See [STORAGE_SETUP.md](./STORAGE_SETUP.md) for detailed storage setup

**Build failed?**
→ Check logs in Vercel Dashboard → Deployments → Click failed deployment

**Need help?**
→ Check [Vercel Documentation](https://vercel.com/docs) or open an issue

---

Made with ❤️ by [Andri Petur](https://andri.is)
