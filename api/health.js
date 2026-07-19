import { setSecurityHeaders } from './_lib/security.js';
import { isPersistentStorageConfigured } from './_lib/storage.js';

export default function handler(req, res) {
  // Set security headers
  setSecurityHeaders(res);

  const storageReady = isPersistentStorageConfigured();
  res.status(storageReady ? 200 : 503).json({
    status: storageReady ? 'ok' : 'degraded',
    storage: storageReady ? 'persistent' : 'unavailable',
  });
}
