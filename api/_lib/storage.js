// Storage abstraction layer. Production requires Vercel/Upstash KV so secrets,
// view counters, and rate limits remain consistent across instances.

let kv = null;
const inMemoryStore = new Map();

const hasKvConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

try {
  if (!hasKvConfig) throw new Error('KV environment variables are missing');
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
  console.log('Using Vercel KV for storage');
} catch {
  if (process.env.NODE_ENV === 'production') {
    console.error('Persistent KV storage is required in production');
  } else {
    console.warn('Using development-only in-memory storage');
  }
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
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Persistent secret storage is not configured');
    }
    inMemoryStore.set(id, secretData);
  }
}

export async function consumeSecret(id) {
  if (kv) {
    const value = await kv.eval(
      `
        local value = redis.call('GET', KEYS[1])
        if not value then return nil end
        local secret = cjson.decode(value)
        local ttl = redis.call('PTTL', KEYS[1])
        secret.viewsRemaining = secret.viewsRemaining - 1
        if secret.viewsRemaining <= 0 then
          redis.call('DEL', KEYS[1])
        elseif ttl > 0 then
          redis.call('SET', KEYS[1], cjson.encode(secret), 'PX', ttl)
        else
          redis.call('SET', KEYS[1], cjson.encode(secret))
        end
        return value
      `,
      [`${STORAGE_PREFIX}${id}`],
      []
    );
    if (!value) return null;
    return typeof value === 'string' ? JSON.parse(value) : value;
  } else {
    if (process.env.NODE_ENV === 'production') return null;
    const secret = inMemoryStore.get(id);
    if (!secret) return null;
    const consumed = { ...secret };
    if (secret.viewsRemaining <= 1) {
      inMemoryStore.delete(id);
    } else {
      inMemoryStore.set(id, { ...secret, viewsRemaining: secret.viewsRemaining - 1 });
    }
    return consumed;
  }
}

const developmentRateLimits = new Map();

export async function incrementRateLimit(key, windowMs) {
  if (kv) {
    const result = await kv.eval(
      `
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
        return { count, redis.call('PTTL', KEYS[1]) }
      `,
      [`whisper:ratelimit:${key}`],
      [String(windowMs)]
    );
    return { count: Number(result[0]), ttlMs: Number(result[1]) };
  }

  const now = Date.now();
  const current = developmentRateLimits.get(key);
  if (!current || now >= current.resetAt) {
    developmentRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { count: 1, ttlMs: windowMs };
  }
  current.count += 1;
  return { count: current.count, ttlMs: current.resetAt - now };
}

export function isPersistentStorageConfigured() {
  return Boolean(kv);
}
