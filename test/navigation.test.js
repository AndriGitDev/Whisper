import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
delete process.env.VERCEL;
for (const key of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) {
  delete process.env[key];
}
const { checkRateLimit, navigationRateLimit, trustedProxyPolicy } = await import('../api/_lib/security.js');

async function startApp(t, { maxRequests, windowMs, trustProxy = 'loopback' } = {}) {
  const dist = await mkdtemp(path.join(tmpdir(), 'whisper-navigation-'));
  await mkdir(path.join(dist, 'assets'));
  await writeFile(path.join(dist, 'index.html'), '<!doctype html><title>Navigation fixture</title>');
  await writeFile(path.join(dist, 'assets/app.js'), '/* static fixture */');
  const app = express();
  app.set('trust proxy', trustedProxyPolicy(trustProxy ? { TRUSTED_PROXIES: trustProxy } : {}));
  app.all('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(express.static(dist, { index: false }));
  app.use(navigationRateLimit({ maxRequests, windowMs }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(path.join(dist, 'index.html'));
  });
  app.use((_req, res) => res.status(404).end());
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
    await rm(dist, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

const headers = ip => ({ 'x-forwarded-for': ip });

test('SPA documents allow120 requests per client/window then return429 and Retry-After', async t => {
  const url = await startApp(t);
  const options = { headers: headers('203.0.113.40') };
  for (let i = 0; i < 120; i++) {
    const response = await fetch(`${url}/document/${i}`, options);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Navigation fixture/);
  }
  const blocked = await fetch(`${url}/document/again`, options);
  assert.equal(blocked.status, 429);
  assert.match(blocked.headers.get('retry-after'), /^\d+$/);
  assert.ok(Number(blocked.headers.get('retry-after')) >= 1);
  assert.equal(blocked.headers.get('cache-control'), 'no-store');
});

test('static assets and health checks remain available after a navigation quota is exhausted', async t => {
  const url = await startApp(t, { maxRequests: 1 });
  const options = { headers: headers('203.0.113.50') };
  assert.equal((await fetch(`${url}/`, options)).status, 200);
  assert.equal((await fetch(`${url}/`, options)).status, 429);
  for (let i = 0; i < 3; i++) {
    assert.equal((await fetch(`${url}/assets/app.js`, options)).status, 200);
    assert.equal((await fetch(`${url}/api/health`, options)).status, 200);
  }
  assert.equal((await fetch(`${url}/`, options)).status, 429);
  assert.equal((await fetch(`${url}/api/unknown`, options)).status, 404);
  assert.equal((await fetch(`${url}/unknown`, { ...options, method: 'POST' })).status, 404);
});

test('spoofed forwarding headers and rotating user agents cannot reset direct-client navigation quota', async t => {
  const url = await startApp(t, { maxRequests: 2, trustProxy: false });
  for (let i = 0; i < 3; i++) {
    const response = await fetch(`${url}/`, {
      headers: { 'x-forwarded-for': `192.0.2.${i}`, 'x-real-ip': `192.0.2.${i}`, 'user-agent': `agent-${i}` },
    });
    assert.equal(response.status, i < 2 ? 200 : 429);
  }
});

test('configured proxy trust preserves distinct client quotas without trusting user-agent identity', async t => {
  const url = await startApp(t, { maxRequests: 1 });
  assert.equal((await fetch(`${url}/`, { headers: headers('203.0.113.70') })).status, 200);
  assert.equal((await fetch(`${url}/`, { headers: { ...headers('203.0.113.70'), 'user-agent': 'changed' } })).status, 429);
  assert.equal((await fetch(`${url}/`, { headers: headers('203.0.113.71') })).status, 200);
});

test('a navigation quota resets after its window without changing API quotas', async t => {
  let now = Date.now() + 600000;
  t.mock.method(Date, 'now', () => now);
  const url = await startApp(t, { maxRequests: 1, windowMs: 1000 });
  const options = { headers: headers('203.0.113.60') };
  assert.equal((await fetch(`${url}/`, options)).status, 200);
  const blocked = await fetch(`${url}/`, options);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('retry-after'), '1');
  now += 1000;
  assert.equal((await fetch(`${url}/`, options)).status, 200);
});

test('navigation and existing10/minute and20/minute API budgets remain independent', async () => {
  const req = { ip: '203.0.113.80', headers: {} };
  for (let i = 0; i < 3; i++) {
    assert.equal(await checkRateLimit(req, 120, 60000, 'navigation'), null);
  }
  for (const [ip, budget] of [['203.0.113.80', 10], ['203.0.113.81', 20]]) {
    for (let i = 0; i < budget; i++) {
      assert.equal(await checkRateLimit({ ip, headers: {} }, budget, 60000), null);
    }
    assert.equal((await checkRateLimit({ ip, headers: {} }, budget, 60000)).error, 'Too many requests');
  }
});

test('limiter failures fail closed without exposing internal error details', async () => {
  const handler = navigationRateLimit();
  const req = { method: 'GET', path: '/', get ip() { throw new Error('private backend diagnostic fixture'); } };
  const response = {
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name, value); },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler(req, response, () => assert.fail('unlimited navigation must not continue'));
  assert.equal(response.statusCode, 503);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.deepEqual(response.body, { error: 'Navigation rate limiting unavailable' });
});


test('production navigation requires shared storage while preserving the existing API helper', async t => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { process.env.NODE_ENV = before; });
  const handler = navigationRateLimit();
  const req = { method: 'GET', path: '/', ip: '203.0.113.99', headers: {} };
  const response = {
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name, value); },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let nextCalls = 0;
  await handler(req, response, () => { nextCalls++; });
  assert.equal(nextCalls, 0);
  assert.equal(response.statusCode, 503);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.deepEqual(response.body, { error: 'Navigation rate limiting unavailable' });
  assert.equal(await checkRateLimit(req, 10, 60000), null, 'existing API fallback behavior is unchanged');
});
