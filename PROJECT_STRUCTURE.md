# Project Structure

```
Whisper/
├── .github/
│   └── workflows/
│       └── vercel-deploy.yml       # Optional GitHub Actions workflow
│
├── api/                             # ⭐ NEW: Vercel Serverless Functions
│   ├── _lib/
│   │   └── storage.js              # Storage abstraction (KV + fallback)
│   ├── secret/
│   │   └── [id].js                 # GET /api/secret/:id
│   ├── health.js                   # GET /health
│   ├── secret.js                   # POST /api/secret
│   └── package.json                # API dependencies
│
├── client/                          # Frontend (React + Vite)
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateSecret.jsx
│   │   │   └── ViewSecret.jsx
│   │   ├── utils/
│   │   │   └── cryptoUtils.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                          # Original Express server (for local dev)
│   ├── server.js
│   └── package.json
│
├── .env.example                     # ⭐ NEW: Environment variables example
├── .vercelignore                    # ⭐ NEW: Vercel ignore file
├── vercel.json                      # ⭐ NEW: Vercel configuration
├── package.json                     # ⭐ NEW: Root package.json
│
├── DEPLOYMENT.md                    # VPS deployment guide
├── VERCEL_DEPLOYMENT.md             # ⭐ NEW: Vercel deployment guide
├── QUICKSTART_VERCEL.md             # ⭐ NEW: Quick start guide
├── MIGRATION_SUMMARY.md             # ⭐ NEW: Migration details
├── PROJECT_STRUCTURE.md             # ⭐ This file
├── README.md                        # ⭐ Updated with deployment options
└── LICENSE

⭐ = New or updated files for Vercel support
```

## Key Files

### Configuration

- **vercel.json** - Vercel platform configuration
  - Build commands
  - Output directory
  - Routing rules (API + SPA)

- **.vercelignore** - Files excluded from deployment
  - node_modules
  - Original server/
  - Development files

### Serverless Functions (api/)

All files in `/api` become serverless endpoints:

- `api/health.js` → `/health`
- `api/secret.js` → `/api/secret`
- `api/secret/[id].js` → `/api/secret/:id` (dynamic route)

### Storage Layer

`api/_lib/storage.js` provides unified interface:

```javascript
// Auto-detects and uses:
1. Vercel KV (production) ← Persistent Redis
2. In-memory Map (fallback) ← For testing only
```

## Deployment Targets

### Vercel (Production)
```
api/          → Serverless Functions
client/dist/  → Static files on CDN
```

### VPS (Alternative)
```
server/       → Express.js + PM2
client/dist/  → Served by Nginx
```

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview and features |
| `QUICKSTART_VERCEL.md` | 5-minute Vercel deployment |
| `VERCEL_DEPLOYMENT.md` | Detailed Vercel guide |
| `DEPLOYMENT.md` | VPS deployment guide |
| `MIGRATION_SUMMARY.md` | What changed and why |
| `PROJECT_STRUCTURE.md` | This file |

## Development vs Production

### Local Development (No changes required)
```bash
# Terminal 1
cd server && node server.js

# Terminal 2  
cd client && npm run dev
```

### Vercel Production
```bash
# Just push to GitHub
git push origin main

# Or use CLI
vercel --prod
```

## Next Steps

1. Read [QUICKSTART_VERCEL.md](./QUICKSTART_VERCEL.md) for fast deployment
2. Read [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for details
3. Add Vercel KV storage for production persistence
