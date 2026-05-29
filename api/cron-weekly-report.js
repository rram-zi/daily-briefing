import webpush from 'web-push';
import { put, list } from '@vercel/blob';

async function readSubscriptions() {
  try {
    const { blobs } = await list({ prefix: 'push-subscriptions-weekly' });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].downloadUrl);
    return await res.json();
  } catch { return []; }
}

async function writeSubscriptions(subs) {
  await put('push-subscriptions-weekly.json', JSON.stringify(subs), {
    access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
}

async function queryNotion(filter) {
  const results = [];
  let cursor;
  do {
    const body = { filter, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const res = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subs = await readSubscriptions();
  if (!subs.length) return res.status(200).json({ sent: false, reason: 'No subscriptions' });

  // 일요일 KST 10시 실행 기준 — 월(6일 전) ~ 토(1일 전)
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const monday = new Date(kstNow);
  monday.setUTCDate(kstNow.getUTCDate() - 6);
  const saturday = new Date(kstNow);
  saturday.setUTCDate(kstNow.getUTCDate() - 1);
  const mondayStr   = monday.toISOString().slice(0, 10);
  const saturdayStr = saturday.toISOString().slice(0, 10);

  const pages = await queryNotion({
    and: [
      { property: '완료일', date: { on_or_after:  mondayStr   } },
      { property: '완료일', date: { on_or_before: saturdayStr } },
    ],
  });

  const tasks = pages.map(p => {
    const props = p.properties;
    const titleProp = Object.values(props).find(v => v.type === 'title');
    const title    = titleProp?.title?.[0]?.plain_text || '';
    const category = props['카테고리']?.select?.name || '';
    return { title, category };
  }).filter(t => t.title);

  const count = tasks.length;

  // 카테고리별 집계
  const catMap = {};
  for (const t of tasks) {
    if (t.category) catMap[t.category] = (catMap[t.category] || 0) + 1;
  }
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  let body;
  if (count === 0) {
    body = '이번 주는 완료한 할 일이 없어요.';
  } else {
    const catLine  = topCat ? `최다 카테고리: ${topCat[0]} (${topCat[1]}개)` : '';
    const preview  = tasks.slice(0, 4).map(t => t.title).join(', ');
    const more     = count > 4 ? ` 외 ${count - 4}개` : '';
    body = [catLine, preview + more].filter(Boolean).join('\n');
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const payload = JSON.stringify({
    title: `주간 레포트 · ${count}개 완료`,
    body,
    action: 'history',
  });

  const validSubs = [];
  await Promise.all(subs.map(async sub => {
    try {
      await webpush.sendNotification(sub, payload);
      validSubs.push(sub);
    } catch (err) {
      if (err.statusCode !== 410) validSubs.push(sub);
    }
  }));

  if (validSubs.length !== subs.length) await writeSubscriptions(validSubs);

  return res.status(200).json({ sent: validSubs.length, total: subs.length, count });
}
