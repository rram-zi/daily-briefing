function isAuthed(req) {
  const b64 = (req.headers['authorization'] || '').replace(/^Basic /, '');
  if (!b64) return false;
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  return decoded.slice(0, idx) === process.env.APP_USERNAME &&
         decoded.slice(idx + 1) === process.env.APP_PASSWORD;
}

function todayKST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DB_ID;
  if (!token || !dbId) return res.status(500).json({ error: 'Server not configured' });

  const today = todayKST();

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: '오늘날짜', date: { equals: today } },
        sorts: [{ property: '순서', direction: 'ascending' }],
      }),
    });

    const data = await response.json();
    const tasks = (data.results || []).map(page => {
      const props = page.properties || {};
      const titleArr = props['이름']?.title || [];
      const title = titleArr.map(t => t.plain_text).join('');
      const status = props['상태']?.status?.name || '';
      const done = status === 'Done';
      return { id: page.id, title, done };
    });

    return res.status(200).json({ date: today, tasks });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
