import webpush from 'web-push';
import { put, list } from '@vercel/blob';

async function readSubscriptions() {
  try {
    const { blobs } = await list({ prefix: 'push-subscriptions.json' });
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
    title: '오늘 할 일 확인',
    body: '오늘 할 일을 다 했는지 확인해 보세요!',
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
