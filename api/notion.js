export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Basic Auth 검증
  const authHeader = req.headers['authorization'] || '';
  const base64 = authHeader.startsWith('Basic ') ? authHeader.slice(6) : '';
  let authed = false;
  if (base64) {
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const colonIdx = decoded.indexOf(':');
    const user = decoded.slice(0, colonIdx);
    const pass = decoded.slice(colonIdx + 1);
    authed = user === process.env.APP_USERNAME && pass === process.env.APP_PASSWORD;
  }
  if (!authed) return res.status(401).json({ error: 'Unauthorized' });

  const rawPath = req.query.path;
  const notionPath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

  if (!notionPath) return res.status(400).json({ error: 'path required' });

  // 로그인 검증 전용 엔드포인트 — DB ID 반환
  if (notionPath === '__auth__') {
    return res.status(200).json({ dbId: process.env.NOTION_DB_ID });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server not configured' });

  const url = `https://api.notion.com/v1/${notionPath}`;

  try {
    const fetchOpts = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    };

    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOpts);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
