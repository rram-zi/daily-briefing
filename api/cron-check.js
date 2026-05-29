import webpush from 'web-push';
import { put, list } from '@vercel/blob';

async function readSubscriptions() {
  try {
    const { blobs } = await list({ prefix: 'push-subscriptions-check' });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].downloadUrl);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs) {
  await put('push-subscriptions-check.json', JSON.stringify(subs), {
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
    title: '점검 알림',
    body: '오늘 할 일을 잘 하고 있나요?',
    action: 'deadline',
  });

  const validSubs = [];
  await Promise.all(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(sub, payload);
        validSubs.push(sub);
      } catch (err) {
        if (err.statusCode !== 410) validSubs.push(sub);
      }
    })
  );

  if (validSubs.length !== subs.length) {
    await writeSubscriptions(validSubs);
  }

  return res.status(200).json({ sent: validSubs.length, total: subs.length });
}
