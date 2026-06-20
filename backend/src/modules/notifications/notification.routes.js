import { Router } from 'express';
import webpush from 'web-push';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';

const router = Router();

let vapidReady = false;
if (env.vapidPrivateKey && env.vapidPublicKey) {
  try {
    webpush.setVapidDetails(env.vapidEmail, env.vapidPublicKey, env.vapidPrivateKey);
    vapidReady = true;
  } catch (e) {
    console.error('[VAPID] setVapidDetails failed:', e.message);
  }
}

// GET /notifications — in-app notifications tính từ dữ liệu hiện có
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const isTest = req.query.test === 'true';
    const notifications = [];

    const [moodRes, progressRes, badgesRes, communityCommentRes, communityReactionRes, communityNotifsRes] = await Promise.all([
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
         where ub.user_id = $1
         order by ub.earned_at desc limit 3`,
        [userId]
      ).catch(() => ({ rows: [] })),
      db.query(
        `select count(*)::int as total, max(c.created_at) as latest
         from community_comments c
         join community_posts p on p.id = c.post_id
         where p.user_id = $1 and c.user_id != $1
           and c.created_at >= now() - interval '24 hours'`,
        [userId]
      ).catch(() => ({ rows: [] })),
      db.query(
        `select count(*)::int as total, max(r.created_at) as latest
         from community_reactions r
         join community_posts p on p.id = r.post_id
         where p.user_id = $1 and r.user_id != $1
           and r.created_at >= now() - interval '24 hours'`,
        [userId]
      ).catch(() => ({ rows: [] })),
      db.query(
        `select group_key, type, post_id, message, count(*)::int as total,
                max(created_at) as latest, min(actor_name) as actor_name
         from notifications
         where recipient_id = $1 and is_read = false
         group by group_key, type, post_id, message
         order by max(created_at) desc limit 10`,
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

    // Streak sắp bị phá — chỉ hiện từ 20h VN và chưa hoạt động hôm nay
    const progress = progressRes.rows[0];
    if (progress && progress.current_streak >= 1) {
      const lastActivity = progress.last_activity_date ? new Date(progress.last_activity_date) : null;
      const daysSince = lastActivity
        ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000)
        : 999;
      const vnHour = (new Date().getUTCHours() + 7) % 24;
      if (isTest || (daysSince >= 1 && vnHour >= 20)) {
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

    // Nhắc check-in tâm trạng — chỉ hiện khi chưa check-in 22 giờ qua
    const lastMood = moodRes.rows[0];
    const hoursSinceMood = lastMood
      ? (Date.now() - new Date(lastMood.created_at).getTime()) / 3600000
      : Infinity;

    if (isTest || hoursSinceMood > 22) {
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

    // Tương tác cộng đồng từ bảng notifications (đã gộp theo group_key)
    communityNotifsRes.rows.forEach((row) => {
      // Kết quả duyệt hồ sơ chuyên gia
      if (row.type === 'expert_approved' || row.type === 'expert_rejected') {
        const approved = row.type === 'expert_approved';
        notifications.push({
          id: `expert-${row.group_key || new Date(row.latest).getTime()}`,
          type: 'expert',
          icon: approved ? '✅' : '📋',
          title: approved ? 'Hồ sơ đã được duyệt' : 'Kết quả hồ sơ chuyên gia',
          body: row.message,
          action: approved ? 'expert/app.html?page=dashboard.html' : 'expert/apply.html',
          created_at: row.latest
        });
        return;
      }
      // Thông báo lịch hẹn chuyên gia
      if (row.type === 'booking_new' || row.type === 'booking_update') {
        notifications.push({
          id: `booking-${row.group_key || new Date(row.latest).getTime()}`,
          type: 'booking',
          icon: '📅',
          title: row.type === 'booking_new' ? 'Lịch hẹn mới' : 'Cập nhật lịch hẹn',
          body: row.message,
          action: row.type === 'booking_new' ? 'expert/app.html?page=dashboard.html' : 'experts.html',
          created_at: row.latest
        });
        return;
      }
      const isComment = row.type === 'comment';
      const count = row.total;
      const title = isComment
        ? (count > 1 ? `${count} bình luận mới` : 'Bình luận mới')
        : (count > 1 ? `${count} cảm xúc mới` : 'Cảm xúc mới');
      const body = count > 1
        ? `${row.actor_name} và ${count - 1} người khác đã ${isComment ? 'bình luận' : 'thả cảm xúc'} bài viết của bạn.`
        : row.message;
      notifications.push({
        id: `notif-${row.group_key}`,
        type: 'community',
        icon: isComment ? '💬' : '❤️',
        title,
        body,
        action: 'community.html',
        created_at: row.latest
      });
    });

    // Fallback: nếu chưa có data trong bảng notifications (test mode)
    if (isTest && communityNotifsRes.rows.length === 0) {
      const commentCount = communityCommentRes.rows[0]?.total || 0;
      const reactionCount = communityReactionRes.rows[0]?.total || 0;
      if (commentCount > 0) notifications.push({ id: 'test-comments', type: 'community', icon: '💬', title: `${commentCount} bình luận mới`, body: 'Ai đó vừa bình luận bài viết của bạn.', action: 'community.html', created_at: new Date().toISOString() });
      if (reactionCount > 0) notifications.push({ id: 'test-reactions', type: 'community', icon: '❤️', title: `${reactionCount} cảm xúc mới`, body: 'Bài viết của bạn vừa nhận cảm xúc mới.', action: 'community.html', created_at: new Date().toISOString() });
    }

    // Sắp xếp: badge → community → streak warning → reminder
    notifications.sort((a, b) => {
      const order = { booking: 0, achievement: 1, community: 2, warning: 3, reminder: 4 };
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
  if (!vapidReady) return;
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
