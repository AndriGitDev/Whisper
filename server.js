import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import secretHandler from './api/secret.js';
import secretByIdHandler from './api/secret/[id].js';
import healthHandler from './api/health.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

app.disable('x-powered-by');
app.set('trust proxy', 2);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31_536_000, includeSubDomains: false },
}));
app.use(morgan('combined', { skip: (req) => req.path === '/api/health' }));
app.use('/api', express.json({ limit: '150kb', strict: true }));

app.all('/api/health', healthHandler);
app.all('/api/secret', secretHandler);
app.all('/api/secret/:id', secretByIdHandler);

app.use(express.static(dist, {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.sendFile(path.join(dist, 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(port, '0.0.0.0', () => {
  console.log(`Whisper listening on port ${port}`);
});
