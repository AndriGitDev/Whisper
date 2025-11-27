# Vercel Migration Summary

This document summarizes the changes made to support Vercel deployment while maintaining backward compatibility with the original VPS deployment.

## What Changed

### New Files Created

1. **`/vercel.json`** - Vercel configuration file
   - Defines build commands and output directory
   - Configures routing for API and SPA

2. **`/api/` directory** - Serverless functions for Vercel
   - `api/health.js` - Health check endpoint
   - `api/secret.js` - Create secret endpoint (POST /api/secret)
   - `api/secret/[id].js` - Retrieve secret endpoint (GET /api/secret/:id)
   - `api/_lib/storage.js` - Storage abstraction layer (Vercel KV + in-memory fallback)
   - `api/package.json` - Dependencies for serverless functions

3. **`/package.json`** - Root package.json for convenience scripts

4. **`/.vercelignore`** - Files to exclude from Vercel deployment

5. **`/.env.example`** - Example environment variables for Vercel KV

6. **`/VERCEL_DEPLOYMENT.md`** - Comprehensive Vercel deployment guide

7. **`/.github/workflows/vercel-deploy.yml`** - Optional GitHub Actions workflow

8. **Updated `/README.md`** - Added deployment options and better documentation

## Architecture Changes

### Before (VPS Deployment)
```
┌─────────────────┐
│   Nginx         │ (Reverse proxy)
│   Port 80/443   │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼────┐  ┌──▼──────┐
│ Static │  │ Express │
│ Files  │  │  API    │
│ (dist) │  │ (PM2)   │
└────────┘  └─────────┘
            In-Memory
            Storage
```

### After (Vercel Deployment)
```
┌──────────────────────┐
│   Vercel Edge CDN    │
└──────────┬───────────┘
           │
      ┌────┴─────┐
      │          │
┌─────▼───┐  ┌──▼──────────────┐
│ Static  │  │  Serverless     │
│ Files   │  │  Functions      │
│ (CDN)   │  │  (auto-scale)   │
└─────────┘  └─────────┬───────┘
                       │
                  ┌────▼─────┐
                  │ Vercel   │
                  │ KV/Redis │
                  └──────────┘
```

## Key Differences

### Storage
- **VPS**: In-memory Map (lost on restart)
- **Vercel**: Vercel KV (persistent Redis) with in-memory fallback

### Scaling
- **VPS**: Single server, manual scaling
- **Vercel**: Auto-scaling serverless functions, global edge network

### Deployment
- **VPS**: Manual git pull, build, PM2 restart
- **Vercel**: Automatic deployment on git push, instant rollbacks

### Cost
- **VPS**: Fixed monthly cost regardless of traffic
- **Vercel**: Pay per use (generous free tier)

## What Stayed the Same

1. **Frontend code** - No changes required
2. **API interface** - Same endpoints and request/response formats
3. **Encryption logic** - Client-side encryption unchanged
4. **Development workflow** - Can still use Express server locally
5. **Original server/** - Kept intact for local development

## Backward Compatibility

The original Express.js server in `/server` is still fully functional:
- Use for local development
- Can still deploy to VPS using DEPLOYMENT.md
- No breaking changes to existing deployments

## Migration Path

### For New Deployments
1. Follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
2. Add Vercel KV for persistence
3. Deploy from GitHub or Vercel CLI

### For Existing VPS Deployments
1. Keep existing deployment running
2. Test Vercel deployment in parallel
3. Update DNS to point to Vercel when ready
4. No data migration needed (secrets are ephemeral)

## Storage Implementation Details

The storage layer (`api/_lib/storage.js`) automatically detects available storage:

```javascript
// Priority:
1. Vercel KV (if environment variables present)
2. In-memory Map (fallback)
```

### With Vercel KV (Production)
- Secrets persist across function invocations
- Automatic expiration via Redis TTL
- Shared state across all serverless function instances

### Without Vercel KV (Development/Fallback)
- In-memory storage (not recommended for production)
- Secrets may be lost between function cold starts
- Each function instance has isolated storage

## Environment Variables

The following variables are automatically set when you add Vercel KV:

- `KV_REST_API_URL` - KV endpoint
- `KV_REST_API_TOKEN` - Write token
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only token

No manual configuration required!

## Testing Locally

### Test with original Express server:
```bash
cd server && npm install && node server.js
cd client && npm install && npm run dev
```

### Test Vercel functions locally (requires Vercel CLI):
```bash
vercel dev
```

This starts a local Vercel development server that simulates the serverless environment.

## Next Steps

1. Deploy to Vercel (see VERCEL_DEPLOYMENT.md)
2. Add Vercel KV storage for production
3. (Optional) Configure custom domain
4. (Optional) Enable Vercel Analytics

## Support

- For Vercel-specific issues: [Vercel Documentation](https://vercel.com/docs)
- For VPS deployment: See DEPLOYMENT.md
- For general issues: [GitHub Issues](https://github.com/andripetur/Whisper/issues)
