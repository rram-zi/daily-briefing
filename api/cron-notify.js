import webpush from 'web-push';
import { put, list } from '@vercel/blob';

function getKSTDateStr() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function readSubscriptions() {
  try {
    const { blobs } = await list({ prefix: 'push-subscriptions' });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].downloadUrl);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs) {
  await put('push-subscriptions.json', JSON.stringify(subs), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = getKSTDateStr();

  // Notion에서 오늘 마감 + 미완료 태스크 조회
  const notionRes = await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: '마감일', date: { equals: today } },
            { property: '상태', status: { does_not_equal: '완료' } },
            { property: '상태', status: { does_not_equal: 'Done' } },
          ],
        },
        page_size: 1,
      }),
    }
  );

  const { results = [] } = await notionRes.json();
  if (results.length === 0) {
    return res.status(200).json({ sent: false, reason: 'No incomplete tasks due today' });
  }

  const subs = await readSubscriptions();
  if (!subs.length) {
    return res.status(200).json({ sent: false, reason: 'No push subscriptions' });
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const payload = JSON.stringify({
    title: '완료 처리가 필요한 할 일',
    body: '아직 완료 처리하지 않은 할 일이 있어요. 확인해 주세요!',
  });

  // 만료된 구독 제거하며 발송
  const validSubs = [];
  await Promise.all(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(sub, payload);
        validSubs.push(sub);
      } catch (err) {
        if (err.statusCode !== 410) validSubs.push(sub); // 410 Gone = 만료됨
      }
    })
  );

  if (validSubs.length !== subs.length) {
    await writeSubscriptions(validSubs);
  }

  return res.status(200).json({ sent: validSubs.length, total: subs.length });
}
