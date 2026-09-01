# Vercel Serverless Deployment Guide

Whisper deploys as a static Vite frontend plus three Node.js Functions under `api/`. Production state lives in Upstash Redis; no application server or persistent filesystem is required.

## Quick Start

### Deploy via GitHub (Recommended)

1. Push the code to the Git repository connected to Vercel.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), choose **Add New Project**.
3. Import the Whisper repository.
4. Keep the repository root as the project root. `vercel.json` supplies the build command and output directory.
5. Deploy once to create the project, then add Redis before using it in production.

### Deploy via CLI

```bash
npx vercel
```

## Add Upstash Redis (Required in Production)

Redis stores encrypted payloads, expiration metadata, atomic view counters, and distributed rate limits across stateless Function instances.

### Vercel Marketplace (Recommended)

1. Open the project in Vercel and go to **Storage** or **Integrations**.
2. Add **Upstash for Redis** and connect a database to this project.
3. Confirm that credentials were added to Production and Preview environments.
4. Redeploy so the Functions receive the new environment variables.

The integration may provide either of these supported pairs:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL` and `KV_REST_API_TOKEN`

Using the CLI, the equivalent setup starts with:

```bash
npx vercel integration add upstash
```

### Existing Upstash Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST API credentials.
4. In Vercel **Settings → Environment Variables**, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
5. Redeploy your project

## Custom Domain

1. Go to your project → **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions

## Optional Environment Variable

- `ALLOWED_ORIGINS` — comma-separated HTTPS origins allowed to call the API in addition to the deployment's own origin. Leave unset for same-origin requests only.

## Local Development

Install and verify from the repository root:

```bash
npm install
npm test
npm run lint
npm run build
npm start
```

Without Redis credentials, local runs intentionally use an in-memory store. Production runs fail closed when persistent storage is absent.

## Verify the Deployment

1. Request `/api/health`. A configured deployment returns HTTP `200` with `{"status":"ok","storage":"persistent"}`.
2. Create a one-view secret in the UI.
3. Open its generated link and reveal it once.
4. Reload the link. The second retrieval must return the expired/not-found state.

## Troubleshooting

### Secrets not persisting

Check `/api/health`. If it returns `503`, connect Upstash Redis to the same Vercel project and deployment environment, then redeploy.

### Build failures

1. Check build logs in Vercel Dashboard
2. Run `npm install`, `npm test`, and `npm run build` from the repository root.
3. Ensure the Vercel project root is the repository root.

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Marketplace Storage](https://vercel.com/docs/marketplace-storage)
- [Upstash Documentation](https://docs.upstash.com/redis)
