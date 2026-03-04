// In-memory rate limiting (resets on cold start, good enough for casual abuse)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // max submissions per IP per window

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const ALLOWED_ORIGINS = [
  'https://paramountrestoration.net',
  'https://www.paramountrestoration.net',
];

const MAX_FIELD_LENGTHS = {
  name: 200,
  phone: 30,
  email: 254,
  service_type: 50,
  message: 5000,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Origin check — only accept from our website
  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.some((o) => origin === o)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { name, phone, email, service_type, message, 'bot-field': botField } = req.body || {};

  // Server-side honeypot check
  if (botField) {
    // Silently accept but don't forward — bots think it worked
    return res.status(200).json({ ok: true });
  }

  if (!name || !phone || !service_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Input length validation
  for (const [field, max] of Object.entries(MAX_FIELD_LENGTHS)) {
    const val = req.body?.[field];
    if (val && typeof val === 'string' && val.length > max) {
      return res.status(400).json({ error: `${field} is too long` });
    }
  }

  try {
    const response = await fetch('https://crm.paramountrestoration.net/api/leads/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        data: { name, phone, email, service_type, message },
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream error' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Upstream error' });
  }
}
