function isAuthed(req) {
  const b64 = (req.headers['authorization'] || '').replace(/^Basic /, '');
  if (!b64) return false;
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  return decoded.slice(0, idx) === process.env.APP_USERNAME &&
         decoded.slice(idx + 1) === process.env.APP_PASSWORD;
}

async function notionTaskExists(eventId) {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: '구글캘린더ID', rich_text: { equals: eventId } },
        page_size: 1,
      }),
    }
  );
  const data = await res.json();
  return (data.results || []).length > 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).end();

  const { eventId, title, date, description } = req.body || {};
  if (!eventId || !title || !date) {
    return res.status(400).json({ error: 'Missing required fields: eventId, title, date' });
  }

  // eventId 기준 중복 확인
  if (await notionTaskExists(eventId)) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const properties = {
    '이름':         { title:     [{ text: { content: title } }] },
    '마감일':       { date:      { start: date } },
    '우선순위':     { select:    { name: '보통' } },
    '상태':         { status:    { name: 'Not started' } },
    '소스':         { rich_text: [{ text: { content: '구글캘린더' } }] },
    '구글캘린더ID': { rich_text: [{ text: { content: eventId } }] },
  };
  if (description) {
    properties['메모'] = { rich_text: [{ text: { content: description.slice(0, 2000) } }] };
  }

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties,
    }),
  });

  if (!notionRes.ok) {
    const err = await notionRes.json();
    return res.status(500).json({ error: 'Notion API error', detail: err });
  }

  return res.status(200).json({ ok: true });
}
