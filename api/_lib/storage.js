// Storage abstraction layer for Vercel deployment
// Supports both Vercel KV (Redis) and in-memory fallback

let kv = null;
const inMemoryStore = new Map();

// Try to import Vercel KV
try {
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
  console.log('Using Vercel KV for storage');
} catch {
  console.warn('Vercel KV not available, using in-memory storage (not recommended for production)');
}

const STORAGE_PREFIX = 'whisper:secret:';

export async function setSecret(id, secretData) {
  if (kv) {
    // Use Vercel KV with expiration
    const ttl = Math.ceil((secretData.expiration - Date.now()) / 1000);
    // Vercel KV automatically serializes objects, no need to stringify
    await kv.set(`${STORAGE_PREFIX}${id}`, secretData, {
      ex: Math.max(ttl, 1) // At least 1 second
    });
  } else {
    // Fallback to in-memory
    inMemoryStore.set(id, secretData);
  }
}

export async function getSecret(id) {
  if (kv) {
    // Vercel KV automatically deserializes objects, no need to parse
    const data = await kv.get(`${STORAGE_PREFIX}${id}`);
    return data || null;
  } else {
    return inMemoryStore.get(id) || null;
  }
}

export async function deleteSecret(id) {
  if (kv) {
    await kv.del(`${STORAGE_PREFIX}${id}`);
  } else {
    inMemoryStore.delete(id);
  }
}

export async function decrementViews(id) {
  if (kv) {
    const secret = await getSecret(id);
    if (!secret) return null;

    secret.viewsRemaining -= 1;

    if (secret.viewsRemaining <= 0) {
      await deleteSecret(id);
    } else {
      await setSecret(id, secret);
    }

    return secret;
  } else {
    const secret = inMemoryStore.get(id);
    if (!secret) return null;

    secret.viewsRemaining -= 1;

    if (secret.viewsRemaining <= 0) {
      inMemoryStore.delete(id);
    }

    return secret;
  }
}
