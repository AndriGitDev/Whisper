import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) {
  delete process.env[key];
}
const { incrementRateLimit } = await import('../api/_lib/storage.js');

test('fallback rate storage bounds new keys, preserves active quotas and reclaims expired keys', async t => {
  let now = Date.now() + 600000;
  t.mock.method(Date, 'now', () => now);
  for (let i = 0; i < 10000; i++) {
    assert.equal((await incrementRateLimit(`bounded-fixture-${i}`, 60000)).count, 1);
  }
  const refused = await incrementRateLimit('overflow-fixture', 60000);
  assert.equal(refused.count, Number.MAX_SAFE_INTEGER);
  assert.equal(refused.ttlMs, 1000);
  assert.equal((await incrementRateLimit('bounded-fixture-0', 60000)).count, 2);
  now += 60000;
  assert.equal((await incrementRateLimit('overflow-fixture', 60000)).count, 1);
  assert.equal((await incrementRateLimit('bounded-fixture-0', 60000)).count, 1);
});
