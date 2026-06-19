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

const NOTION_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DB_ID;
  if (!token || !dbId) return res.status(500).json({ error: 'Server not configured' });

  const today = todayKST();

  // GET — 오늘의 할 일 목록
  if (req.method === 'GET') {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: NOTION_HEADERS(token),
      body: JSON.stringify({
        filter: { property: '오늘날짜', date: { equals: today } },
        sorts: [{ property: '순서', direction: 'ascending' }],
      }),
    });
    const data = await response.json();
    const tasks = (data.results || []).map(page => {
      const props = page.properties || {};
      const title = (props['이름']?.title || []).map(t => t.plain_text).join('');
      const done  = props['상태']?.status?.name === 'Done';
      return { id: page.id, title, done };
    });
    return res.status(200).json({ date: today, tasks });
  }

  // POST — 새 할 일 추가 (위젯에서 빠른 추가)
  if (req.method === 'POST') {
    const { title } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ error: 'title required' });
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: NOTION_HEADERS(token),
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          '이름':     { title:  [{ text: { content: title.trim() } }] },
          '마감일':   { date:   { start: today } },
          '우선순위': { select: { name: '보통' } },
          '상태':     { status: { name: 'Not started' } },
          '오늘날짜': { date:   { start: today } },
        },
      }),
    });
    const page = await response.json();
    return res.status(response.ok ? 200 : 500).json({ ok: response.ok, id: page.id });
  }

  // PATCH — 할 일 완료 처리 (위젯에서 탭)
  if (req.method === 'PATCH') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: NOTION_HEADERS(token),
      body: JSON.stringify({
        properties: {
          '상태':  { status: { name: 'Done' } },
          '완료일': { date: { start: today } },
        },
      }),
    });
    return res.status(response.ok ? 200 : 500).json({ ok: response.ok });
  }

  return res.status(405).end();
}
