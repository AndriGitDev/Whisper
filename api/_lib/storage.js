// Storage abstraction layer. Production requires Upstash Redis so secrets,
// view counters, and rate limits remain consistent across function instances.

import { Redis } from '@upstash/redis';

let redis = null;
const inMemoryStore = new Map();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (redisUrl && redisToken) {
  redis = new Redis({ url: redisUrl, token: redisToken });
} else {
  if (process.env.NODE_ENV === 'production') {
    console.error('Upstash Redis is required in production');
  } else {
    console.warn('Using development-only in-memory storage');
  }
}

const STORAGE_PREFIX = 'whisper:secret:';

export async function setSecret(id, secretData) {
  if (redis) {
    const ttl = Math.ceil((secretData.expiration - Date.now()) / 1000);
    await redis.set(`${STORAGE_PREFIX}${id}`, secretData, {
      ex: Math.max(ttl, 1)
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Persistent secret storage is not configured');
    }
    inMemoryStore.set(id, secretData);
  }
}

export async function consumeSecret(id) {
  if (redis) {
    const value = await redis.eval(
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
  if (redis) {
    const result = await redis.eval(
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
  return Boolean(redis);
}
