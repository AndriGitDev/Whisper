import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { once } from 'node:events';

process.env.NODE_ENV = 'test';
delete process.env.VERCEL;
const { checkRateLimit, trustedProxyPolicy } = await import('../api/_lib/security.js');

test('the default Node proxy policy resists forwarding-header spoofing over HTTP', async (t) => {
  assert.equal(trustedProxyPolicy({}), false);
  assert.deepEqual(trustedProxyPolicy({ TRUSTED_PROXIES: 'loopback, 192.0.2.0/24' }), ['loopback', '192.0.2.0/24']);
  const app = express();
  app.set('trust proxy', trustedProxyPolicy({}));
  app.get('/', async (req, res) => res.status(await checkRateLimit(req, 1) ? 429 : 200).end());
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/`;
  assert.equal((await fetch(url, { headers: { 'x-forwarded-for': '192.0.2.10', 'user-agent': 'a' } })).status, 200);
  assert.equal((await fetch(url, { headers: { 'x-forwarded-for': '192.0.2.11', 'user-agent': 'b' } })).status, 429);
});

test('rotating user agents and spoofed forwarding headers cannot reset a direct client quota', async () => {
  for (let i = 0; i < 3; i++) {
    const result = await checkRateLimit({
      headers: { 'user-agent': `agent-${i}`, 'x-real-ip': `192.0.2.${i}`, 'x-forwarded-for': `192.0.2.${i}` },
      socket: { remoteAddress: '198.51.100.1' },
    }, 2);
    if (i < 2) assert.equal(result, null);
    else assert.equal(result.error, 'Too many requests');
  }
  assert.equal(await checkRateLimit({ headers: {}, socket: { remoteAddress: '198.51.100.2' } }, 2), null);
});

test('Express client IP takes precedence over caller-supplied headers', async () => {
  assert.equal(await checkRateLimit({ ip: '203.0.113.1', headers: { 'x-real-ip': '192.0.2.1' } }, 1), null);
  assert.equal((await checkRateLimit({ ip: '203.0.113.1', headers: { 'x-real-ip': '192.0.2.2' } }, 1)).error, 'Too many requests');
});

test('Vercel client addresses share a quota across user agents', async () => {
  process.env.VERCEL = '1';
  try {
    assert.equal(await checkRateLimit({ headers: { 'x-forwarded-for': '203.0.113.2', 'user-agent': 'a' } }, 1), null);
    assert.equal((await checkRateLimit({ headers: { 'x-forwarded-for': '203.0.113.2', 'user-agent': 'b' } }, 1)).error, 'Too many requests');
  } finally {
    delete process.env.VERCEL;
  }
});
