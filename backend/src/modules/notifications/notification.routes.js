import { Router } from 'express';
import webpush from 'web-push';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';

const router = Router();

if (env.vapidPrivateKey) {
  webpush.setVapidDetails(env.vapidEmail, env.vapidPublicKey, env.vapidPrivateKey);
}

// GET /notifications — in-app notifications tính từ dữ liệu hiện có
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const notifications = [];

    const [moodRes, progressRes, badgesRes] = await Promise.all([
      db.query(
        `select created_at from mood_checkins where user_id = $1 order by created_at desc limit 1`,
        [userId]
      ).catch(() => ({ rows: [] })),
      db.query(
        `select current_streak, last_activity_date from user_progress where user_id = $1 limit 1`,
        [userId]
      ).catch(() => ({ rows: [] })),
      db.query(
        `select b.name, b.icon, ub.earned_at
         from user_badges ub
         join badges b on b.id = ub.badge_id
         where ub.user_id = $1 and ub.earned_at >= now() - interval '7 days'
         order by ub.earned_at desc limit 5`,
        [userId]
      ).catch(() => ({ rows: [] }))
    ]);

    // Badge mới unlock
    badgesRes.rows.forEach((badge) => {
      notifications.push({
        id: `badge-${badge.name}-${new Date(badge.earned_at).getTime()}`,
        type: 'achievement',
        icon: badge.icon || '🏅',
        title: `Huy hiệu mới: ${badge.name}`,
        body: 'Bạn vừa mở khóa huy hiệu mới!',
        action: 'achievements.html',
        created_at: badge.earned_at
      });
    });

    // Streak sắp bị phá
    const progress = progressRes.rows[0];
    if (progress && progress.current_streak >= 2 && progress.last_activity_date) {
      const lastActivity = new Date(progress.last_activity_date);
      const daysSince = Math.floor((Date.now() - lastActivity.getTime()) / 86400000);
      if (daysSince >= 1) {
        notifications.push({
          id: 'streak-warning',
          type: 'warning',
          icon: '🔥',
          title: `Streak ${progress.current_streak} ngày sắp bị phá!`,
          body: 'Hoàn thành ít nhất 1 nhiệm vụ hoặc check-in hôm nay.',
          action: 'tasks.html',
          created_at: new Date().toISOString()
        });
      }
    }

    // Nhắc check-in tâm trạng
    const lastMood = moodRes.rows[0];
    const hoursSinceMood = lastMood
      ? (Date.now() - new Date(lastMood.created_at).getTime()) / 3600000
      : Infinity;

    if (hoursSinceMood > 22) {
      notifications.push({
        id: 'checkin-reminder',
        type: 'reminder',
        icon: '💭',
        title: hoursSinceMood === Infinity ? 'Check-in tâm trạng đầu tiên' : 'Đã đến giờ check-in!',
        body: 'Ghi nhận tâm trạng mỗi ngày giúp hệ thống gợi ý chính xác hơn.',
        action: 'mood-checkin.html',
        created_at: new Date().toISOString()
      });
    }

    // Sắp xếp: badge → streak warning → reminder
    notifications.sort((a, b) => {
      const order = { achievement: 0, warning: 1, reminder: 2 };
      return (order[a.type] ?? 3) - (order[b.type] ?? 3);
    });

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Notifications error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch notifications' });
  }
});

// GET /notifications/vapid-public-key — trả public key cho frontend
router.get('/notifications/vapid-public-key', (req, res) => {
  return res.json({ success: true, data: { publicKey: env.vapidPublicKey } });
});

// POST /notifications/subscribe — lưu push subscription
router.post('/notifications/subscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' });
    }

    await db.query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id, endpoint) do update
         set p256dh = excluded.p256dh, auth = excluded.auth`,
      [req.user.sub, endpoint, keys.p256dh, keys.auth, req.headers['user-agent'] || null]
    );

    return res.json({ success: true, data: { subscribed: true } });
  } catch (error) {
    console.error('Push subscribe error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not save subscription' });
  }
});

// DELETE /notifications/unsubscribe
router.delete('/notifications/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await db.query(
      `delete from push_subscriptions where user_id = $1 and endpoint = $2`,
      [req.user.sub, endpoint || '']
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

// Helper export để các module khác gọi push notification
export async function sendPushToUser(userId, title, body, url = '/') {
  if (!env.vapidPrivateKey) return;
  try {
    const subs = await db.query(
      `select endpoint, p256dh, auth from push_subscriptions where user_id = $1`,
      [userId]
    );
    const payload = JSON.stringify({ title, body, url, icon: '/favicon.png' });
    await Promise.allSettled(
      subs.rows.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        ).catch((err) => {
          if (err.statusCode === 410) {
            db.query(`delete from push_subscriptions where endpoint = $1`, [sub.endpoint]).catch(() => {});
          }
        })
      )
    );
  } catch (error) {
    console.error('sendPushToUser error:', error.message);
  }
}

export default router;
