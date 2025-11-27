import { setSecurityHeaders } from './_lib/security.js';

export default function handler(req, res) {
  // Set security headers
  setSecurityHeaders(res);

  res.status(200).json({ status: 'ok' });
}
