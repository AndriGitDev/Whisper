import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';

const { default: createSecret } = await import('../api/secret.js');
const { default: getSecret } = await import('../api/secret/[id].js');
const { default: health } = await import('../api/health.js');

function request({ method = 'GET', body, query = {}, headers = {} } = {}) {
  return {
    method,
    body,
    query,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function response() {
  return {
    body: undefined,
    headers: new Map(),
    statusCode: 200,
    setHeader(name, value) {
      this.headers.set(name.toLowerCase(), value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('creates and atomically consumes a one-view secret', async () => {
  const createResponse = response();
  await createSecret(request({
    method: 'POST',
    body: {
      encryptedData: 'Y2lwaGVydGV4dA==',
      iv: 'MTIzNDU2Nzg5MDEy',
      salt: 'unused-in-this-version',
      expiration: 3600,
      views: 1,
    },
  }), createResponse);

  assert.equal(createResponse.statusCode, 200);
  assert.match(createResponse.body.id, /^[a-f0-9]{32}$/);
  assert.equal(createResponse.headers.get('cache-control'), 'no-store');

  const firstRead = response();
  await getSecret(request({ query: { id: createResponse.body.id } }), firstRead);
  assert.equal(firstRead.statusCode, 200);
  assert.deepEqual(firstRead.body, {
    encryptedData: 'Y2lwaGVydGV4dA==',
    iv: 'MTIzNDU2Nzg5MDEy',
    salt: 'unused-in-this-version',
  });

  const secondRead = response();
  await getSecret(request({ query: { id: createResponse.body.id } }), secondRead);
  assert.equal(secondRead.statusCode, 404);
});

test('rejects malformed JSON bodies without throwing', async () => {
  const result = response();
  await createSecret(request({ method: 'POST', body: null }), result);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.body.details, ['Request body must be a JSON object']);
});

test('rejects invalid secret identifiers', async () => {
  const result = response();
  await getSecret(request({ query: { id: '../invalid' } }), result);

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.body, { error: 'Invalid secret ID format' });
});

test('reports degraded health without production storage credentials', () => {
  const result = response();
  health(request(), result);

  assert.equal(result.statusCode, 503);
  assert.deepEqual(result.body, { status: 'degraded', storage: 'unavailable' });
});
