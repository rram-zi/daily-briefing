import { put, list } from '@vercel/blob';

function isAuthed(req) {
  const b64 = (req.headers['authorization'] || '').replace(/^Basic /, '');
  if (!b64) return false;
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  return decoded.slice(0, idx) === process.env.APP_USERNAME &&
         decoded.slice(idx + 1) === process.env.APP_PASSWORD;
}

async function readBlob(key) {
  try {
    const { blobs } = await list({ prefix: key.replace('.json', '') });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].downloadUrl);
    return await res.json();
  } catch { return null; }
}

async function writeBlob(key, data) {
  await put(key, JSON.stringify(data), {
    access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const data = await readBlob('today-widget.json');
    return res.status(200).json(data || { date: '', tasks: [] });
  }

  if (req.method === 'POST') {
    await writeBlob('today-widget.json', req.body);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
