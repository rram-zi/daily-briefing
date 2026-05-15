export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Notion-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'path required' });

  const notionPath = Array.isArray(path) ? path.join('/') : path;
  const token = req.headers['x-notion-token'] || process.env.NOTION_TOKEN;

  if (!token) {
    return res.status(401).json({ error: 'Notion token required' });
  }

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
