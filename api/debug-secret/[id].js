export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      // Check if KV is available
      let kvAvailable = false;
      let kv = null;

      try {
        const kvModule = await import('@vercel/kv');
        kv = kvModule.kv;
        kvAvailable = true;
      } catch (error) {
        kvAvailable = false;
      }

      if (!kvAvailable) {
        return res.status(500).json({
          error: 'KV not available',
          details: 'Vercel KV is not configured'
        });
      }

      // Try to get the raw data from KV
      const STORAGE_PREFIX = 'whisper:secret:';
      const rawData = await kv.get(`${STORAGE_PREFIX}${id}`);

      // List all keys with this prefix
      const keys = await kv.keys(`${STORAGE_PREFIX}*`);

      return res.status(200).json({
        requestedId: id,
        fullKey: `${STORAGE_PREFIX}${id}`,
        rawDataType: typeof rawData,
        rawData: rawData,
        allKeys: keys,
        keyExists: keys.includes(`${STORAGE_PREFIX}${id}`)
      });
    } catch (error) {
      console.error('Debug error:', error);
      return res.status(500).json({
        error: 'Debug failed',
        message: error.message,
        stack: error.stack
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
