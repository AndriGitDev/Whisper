export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  let kvStatus = 'Not configured';
  if (hasKV) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set('test-key', 'test-value', { ex: 60 });
      const value = await kv.get('test-key');
      kvStatus = value === 'test-value' ? 'Working!' : 'Not working';
      await kv.del('test-key');
    } catch (error) {
      kvStatus = `Error: ${error.message}`;
    }
  }

  res.json({
    kvConfigured: hasKV,
    kvStatus,
    envVars: {
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN
    }
  });
}
