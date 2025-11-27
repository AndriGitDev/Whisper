# Storage Setup Guide

This app requires **Redis (KV)** storage, NOT Blob storage. Here's why and how to set it up correctly.

## Blob vs KV: What's the Difference?

### ❌ Blob Storage (Don't use this)
- **Purpose**: Store files (images, videos, PDFs, etc.)
- **Like**: Amazon S3, Google Cloud Storage
- **Use cases**: User uploads, media files, documents
- **Package**: `@vercel/blob`

### ✅ KV Storage (Use this!)
- **Purpose**: Store key-value data (Redis)
- **Like**: Redis, Memcached
- **Use cases**: Sessions, cache, temporary data, secrets
- **Package**: `@vercel/kv`

**For Whisper secrets, we need KV (Redis), not Blob!**

## How to Set Up Redis Storage

### Option 1: Vercel Marketplace (Recommended)

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create** or **Connect Store**
4. Look for these options:
   - **KV** or **Redis**
   - Often provided by **Upstash**
5. Click to create/connect
6. Accept defaults and create
7. Vercel automatically adds environment variables
8. Go to **Deployments** → Click ⋯ on latest → **Redeploy**

### Option 2: Direct Upstash Setup

If you can't find KV in Vercel's storage options:

1. **Create Upstash Account**
   - Go to https://console.upstash.com/
   - Sign up (free tier available)

2. **Create Redis Database**
   - Click **Create Database**
   - Choose region closest to your Vercel deployment
   - Select **Free** tier (sufficient for most uses)
   - Click **Create**

3. **Get Credentials**
   - In Upstash dashboard, click your database
   - Scroll to **REST API** section
   - Copy:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

4. **Add to Vercel**
   - Go to Vercel project → **Settings** → **Environment Variables**
   - Add these variables:
     ```
     KV_REST_API_URL = [Your UPSTASH_REDIS_REST_URL]
     KV_REST_API_TOKEN = [Your UPSTASH_REDIS_REST_TOKEN]
     ```
   - Click **Save**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click ⋯ next to latest deployment
   - Click **Redeploy**

### Option 3: Other Redis Providers

The app works with any Redis instance that has a REST API. You can use:
- Upstash (recommended)
- Redis Cloud
- Railway Redis
- Any self-hosted Redis with REST proxy

Just set these environment variables:
- `KV_REST_API_URL` = Your Redis REST endpoint
- `KV_REST_API_TOKEN` = Your authentication token

## How to Verify It's Working

### Check Environment Variables

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Look for:
   - `KV_REST_API_URL` ✅
   - `KV_REST_API_TOKEN` ✅

### Check Function Logs

1. Create a secret on your deployed app
2. Go to Vercel → **Deployments** → Click latest deployment
3. Click **Functions** tab
4. Click on `api/secret.js` function
5. Look for log: `"Using Vercel KV for storage"` ✅

If you see `"Vercel KV not available, using in-memory storage"` ❌ then environment variables aren't set correctly.

### Test Secret Persistence

1. Create a secret, copy the link
2. Wait 5+ minutes (allows function cold starts)
3. Open the link - secret should still work ✅

If secret is gone, you're using in-memory storage (not persistent).

## Common Issues

### "I created a Blob store but secrets aren't persisting"

**Problem**: Blob is for files, not data.

**Solution**:
1. Go to Storage tab
2. Create a **KV/Redis** store (separate from Blob)
3. Redeploy

You can keep the Blob store (it won't interfere), but you need KV too.

### "I don't see KV option in Vercel Storage"

**Possible reasons**:
- Your region doesn't have KV marketplace option
- Free tier limitations
- Interface updated

**Solution**: Use Option 2 (Direct Upstash) above.

### "Environment variables are set but still using in-memory"

**Checklist**:
1. ✅ Variables are named exactly: `KV_REST_API_URL` and `KV_REST_API_TOKEN`
2. ✅ Variables are in **Production** environment (not just Preview)
3. ✅ You redeployed after adding variables
4. ✅ URL starts with `https://` and token is not empty
5. ✅ Package `@vercel/kv` is in `api/package.json`

### "Module '@vercel/kv' not found"

The `@vercel/kv` package should be in `/api/package.json`. If it's missing:

```bash
cd api
npm install @vercel/kv
git add api/package.json api/package-lock.json
git commit -m "Add @vercel/kv dependency"
git push
```

## Cost

### Upstash Free Tier
- 10,000 commands/day
- 256 MB storage
- Perfect for personal/small projects

### Upstash Pay-as-you-go
- $0.2 per 100K commands
- $0.25 per GB storage
- Only pay for what you use

Most Whisper deployments stay well within free tier.

## Need Help?

- **Upstash Docs**: https://docs.upstash.com/redis
- **Vercel Storage Docs**: https://vercel.com/docs/storage
- **@vercel/kv Docs**: https://www.npmjs.com/package/@vercel/kv
- **GitHub Issues**: https://github.com/andripetur/Whisper/issues
