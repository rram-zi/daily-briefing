import { put, list } from '@vercel/blob';

function blobKey(type) {
  return type === 'morning' ? 'push-subscriptions-morning.json' : 'push-subscriptions.json';
}

async function readSubscriptions(type) {
  try {
    const prefix = type === 'morning' ? 'push-subscriptions-morning' : 'push-subscriptions.json';
    const { blobs } = await list({ prefix });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].downloadUrl);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs, type) {
  await put(blobKey(type), JSON.stringify(subs), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

function isAuthed(req) {
  const b64 = (req.headers['authorization'] || '').replace(/^Basic /, '');
  if (!b64) return false;
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  return decoded.slice(0, idx) === process.env.APP_USERNAME &&
         decoded.slice(idx + 1) === process.env.APP_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  const type = req.query.type === 'morning' ? 'morning' : 'deadline';

  if (req.method === 'DELETE') {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
    const subs = await readSubscriptions(type);
    const filtered = subs.filter(s => s.endpoint !== endpoint);
    if (filtered.length !== subs.length) await writeSubscriptions(filtered, type);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });

  const subs = await readSubscriptions(type);
  const idx = subs.findIndex(s => s.endpoint === sub.endpoint);
  if (idx >= 0) subs[idx] = sub; else subs.push(sub);
  await writeSubscriptions(subs, type);

  return res.status(200).json({ ok: true });
}
