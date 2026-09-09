import { Router } from 'express';
import webpush from 'web-push';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { buildNotificationMessage } from './notification-messages.js';

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

// Đầu ngày theo giờ Việt Nam (UTC+7), trả về dạng ISO.
// Dùng làm created_at cho các lời nhắc được TỔNG HỢP tại đây. Trước đây chúng dùng
// `new Date().toISOString()` — tức mốc thời gian đổi mỗi lần gọi API, nên luôn mới hơn
// mốc "đã đọc" của người dùng và VĨNH VIỄN hiện là chưa đọc, badge không bao giờ về 0.
// Mốc theo ngày giúp: bấm đọc là hết trong hôm nay, sang ngày mới thì nhắc lại — đúng
// bản chất của một lời nhắc hằng ngày.
function startOfVnDay() {
    const nowVn = new Date(Date.now() + 7 * 3600000);
    return new Date(Date.UTC(nowVn.getUTCFullYear(), nowVn.getUTCMonth(), nowVn.getUTCDate()) - 7 * 3600000).toISOString();
}

// GET /notifications — in-app notifications tính từ dữ liệu hiện có
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const isTest = req.query.test === 'true';
    const notifications = [];

    const [moodRes, progressRes, badgesRes, communityCommentRes, communityReactionRes, communityNotifsRes, userRes] = await Promise.all([
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
      // CỐ Ý không lọc is_read = false: người dùng vẫn cần MỞ CHUÔNG XEM LẠI những thông
      // báo đã đọc (ai đã bình luận, lịch hẹn nào vừa đổi). Trả về cả đã đọc, kèm cờ
      // all_read để client biết cái nào còn mới — cái đã đọc không tính vào badge và không
      // bắn toast nữa. Giới hạn 30 ngày + 10 nhóm để danh sách không phình vô hạn.
      db.query(
        `select group_key, type, post_id, message, count(*)::int as total,
                max(created_at) as latest, min(actor_name) as actor_name,
                bool_and(is_read) as all_read,
                (array_agg(params order by created_at desc))[1] as params
         from notifications
         where recipient_id = $1
           and created_at >= now() - interval '30 days'
         group by group_key, type, post_id, message
         order by max(created_at) desc limit 10`,
        [userId]
      ).catch(() => ({ rows: [] })),
      // Mốc đã đọc, dùng để đánh dấu is_read cho các thông báo được TỔNG HỢP tại đây
      // (nhắc check-in, streak, huy hiệu) — những thứ không có hàng nào trong bảng
      // notifications nên không thể đánh dấu đọc theo từng dòng. Xem migration 0054.
      db.query(
        `select notifications_read_at from users where id = $1`,
        [userId]
      ).catch(() => ({ rows: [] }))
    ]);

    const locale = req.locale;
    const L = (vi, en) => (locale === 'en' ? en : vi);

    // Badge mới unlock
    badgesRes.rows.forEach((badge) => {
      notifications.push({
        id: `badge-${badge.name}-${new Date(badge.earned_at).getTime()}`,
        type: 'achievement',
        icon: badge.icon || '🏅',
        title: L(`Huy hiệu mới: ${badge.name}`, `New badge: ${badge.name}`),
        body: L('Bạn vừa mở khóa huy hiệu mới!', "You've just unlocked a new badge!"),
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
          title: L(`Streak ${progress.current_streak} ngày sắp bị phá!`, `Your ${progress.current_streak}-day streak is about to break!`),
          body: L('Hoàn thành ít nhất 1 nhiệm vụ hoặc check-in hôm nay.', 'Complete at least 1 task or check in today.'),
          action: 'tasks.html',
          // Mốc ỔN ĐỊNH theo NGÀY (không phải new Date() mỗi lần gọi API) — xem giải
          // thích ở startOfVnDay().
          created_at: startOfVnDay()
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
        title: hoursSinceMood === Infinity
          ? L('Check-in tâm trạng đầu tiên', 'Your first mood check-in')
          : L('Đã đến giờ check-in!', 'Time to check in!'),
        body: L('Ghi nhận tâm trạng mỗi ngày giúp hệ thống gợi ý chính xác hơn.', 'Logging your mood every day helps the system give you better suggestions.'),
        action: 'mood-checkin.html',
        // Mốc ỔN ĐỊNH = mốc MUỘN HƠN giữa "đến hạn" (22 giờ sau lần check-in gần nhất) và
        // "đầu ngày hôm nay".
        // Vì sao phải lấy cái muộn hơn: nếu chỉ lấy "đến hạn", người đã lâu không check-in
        // sẽ có mốc nằm ở quá khứ xa, đọc một lần là lời nhắc im VĨNH VIỄN, hôm sau không
        // nhắc nữa. Kẹp thêm đầu ngày thì mỗi ngày mốc lại mới hơn mốc đã đọc hôm trước →
        // nhắc lại mỗi ngày, và bấm đọc chỉ im trong hôm nay. Xem thêm startOfVnDay().
        created_at: new Date(Math.max(
          lastMood ? new Date(lastMood.created_at).getTime() + 22 * 3600000 : 0,
          Date.parse(startOfVnDay())
        )).toISOString()
      });
    }

    // Tương tác cộng đồng từ bảng notifications (đã gộp theo group_key)
    communityNotifsRes.rows.forEach((row) => {
      const params = row.params || null;
      // Có code nhận diện được (thông báo tạo sau migration 0058) -> ghép lại theo locale;
      // không có (thông báo cũ, hoặc code lạ) -> dùng nguyên message tiếng Việt đã lưu.
      const localizedBody = params?.code ? buildNotificationMessage(params.code, params, locale) : null;

      // Kết quả duyệt hồ sơ chuyên gia
      if (row.type === 'expert_approved' || row.type === 'expert_rejected') {
        const approved = row.type === 'expert_approved';
        notifications.push({
          id: `expert-${row.group_key || new Date(row.latest).getTime()}`,
          type: 'expert',
          icon: approved ? '✅' : '📋',
          title: approved ? L('Hồ sơ đã được duyệt', 'Application approved') : L('Kết quả hồ sơ chuyên gia', 'Expert application result'),
          body: localizedBody || row.message,
          action: approved ? 'expert/app.html?page=dashboard.html' : 'expert/apply.html',
          created_at: row.latest,
          // Dùng cờ đã đọc THẬT của nhóm (bool_and), không dùng mốc thời gian: loại này có
          // hàng thật trong bảng notifications nên đánh dấu theo dòng là chính xác nhất.
          is_read: Boolean(row.all_read)
        });
        return;
      }
      // Thông báo lịch hẹn chuyên gia
      if (row.type === 'booking_new' || row.type === 'booking_update') {
        notifications.push({
          id: `booking-${row.group_key || new Date(row.latest).getTime()}`,
          type: 'booking',
          icon: '📅',
          title: row.type === 'booking_new' ? L('Lịch hẹn mới', 'New booking') : L('Cập nhật lịch hẹn', 'Booking update'),
          body: localizedBody || row.message,
          action: row.type === 'booking_new' ? 'expert/app.html?page=dashboard.html' : 'experts.html',
          created_at: row.latest,
          is_read: Boolean(row.all_read)
        });
        return;
      }
      // Kết quả kiểm duyệt bài viết Cộng đồng của chính mình
      if (row.type === 'community_post_approved' || row.type === 'community_post_rejected') {
        const approved = row.type === 'community_post_approved';
        notifications.push({
          id: `community-mod-${row.group_key || new Date(row.latest).getTime()}`,
          type: 'community',
          icon: approved ? '✅' : '📝',
          title: approved ? L('Bài viết đã được duyệt', 'Post approved') : L('Bài viết chưa được duyệt', 'Post not approved'),
          body: localizedBody || row.message,
          action: 'community.html',
          created_at: row.latest,
          is_read: Boolean(row.all_read)
        });
        return;
      }
      // Bài viết mới đang chờ duyệt (gửi cho admin)
      if (row.type === 'community_post_pending') {
        notifications.push({
          id: `community-pending-${row.group_key || new Date(row.latest).getTime()}`,
          type: 'community',
          icon: '📝',
          title: L('Bài viết chờ duyệt', 'Post pending review'),
          body: row.message,
          action: '/admin/community',
          created_at: row.latest,
          is_read: Boolean(row.all_read)
        });
        return;
      }
      // Trả lời bình luận
      if (row.type === 'reply') {
        notifications.push({
          id: `notif-${row.group_key}`,
          type: 'community',
          icon: '↩️',
          title: L('Trả lời mới', 'New reply'),
          body: localizedBody || row.message,
          action: 'community.html',
          created_at: row.latest,
          is_read: Boolean(row.all_read)
        });
        return;
      }
      const isComment = row.type === 'comment';
      const count = row.total;
      const title = isComment
        ? (count > 1 ? L(`${count} bình luận mới`, `${count} new comments`) : L('Bình luận mới', 'New comment'))
        : (count > 1 ? L(`${count} cảm xúc mới`, `${count} new reactions`) : L('Cảm xúc mới', 'New reaction'));
      const body = count > 1
        ? L(
          `${row.actor_name} và ${count - 1} người khác đã ${isComment ? 'bình luận' : 'thả cảm xúc'} bài viết của bạn.`,
          `${row.actor_name} and ${count - 1} others ${isComment ? 'commented on' : 'reacted to'} your post.`
        )
        : (localizedBody || row.message);
      notifications.push({
        id: `notif-${row.group_key}`,
        type: 'community',
        icon: isComment ? '💬' : '❤️',
        title,
        body,
        action: 'community.html',
        created_at: row.latest,
        is_read: Boolean(row.all_read)
      });
    });

    // Fallback: nếu chưa có data trong bảng notifications (test mode)
    if (isTest && communityNotifsRes.rows.length === 0) {
      const commentCount = communityCommentRes.rows[0]?.total || 0;
      const reactionCount = communityReactionRes.rows[0]?.total || 0;
      if (commentCount > 0) notifications.push({ id: 'test-comments', type: 'community', icon: '💬', title: L(`${commentCount} bình luận mới`, `${commentCount} new comments`), body: L('Ai đó vừa bình luận bài viết của bạn.', 'Someone just commented on your post.'), action: 'community.html', created_at: new Date().toISOString() });
      if (reactionCount > 0) notifications.push({ id: 'test-reactions', type: 'community', icon: '❤️', title: L(`${reactionCount} cảm xúc mới`, `${reactionCount} new reactions`), body: L('Bài viết của bạn vừa nhận cảm xúc mới.', 'Your post just got a new reaction.'), action: 'community.html', created_at: new Date().toISOString() });
    }

    // Sắp xếp: badge → community → streak warning → reminder
    notifications.sort((a, b) => {
      const order = { booking: 0, achievement: 1, community: 2, warning: 3, reminder: 4 };
      return (order[a.type] ?? 3) - (order[b.type] ?? 3);
    });

    // Gắn is_read cho từng thông báo để client đếm badge cho đúng.
    // Các thông báo lấy từ bảng notifications đã được lọc is_read = false ở trên nên
    // đương nhiên là chưa đọc; phần tổng hợp (nhắc check-in, streak, huy hiệu) thì so với
    // mốc đã đọc của người dùng. CỐ Ý giữ nguyên shape MẢNG của response — chỉ thêm field
    // vào từng phần tử — để client cũ không bị vỡ.
    const readAtRaw = userRes?.rows?.[0]?.notifications_read_at;
    const readAt = readAtRaw ? new Date(readAtRaw).getTime() : 0;
    notifications.forEach((item) => {
      // Loại lấy từ bảng notifications đã tự mang cờ đã đọc thật -> KHÔNG ghi đè.
      if (typeof item.is_read === 'boolean') return;
      const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0;
      item.is_read = createdAt > 0 && createdAt <= readAt;
    });

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Notifications error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch notifications' });
  }
});

// POST /notifications/read — đánh dấu đã đọc toàn bộ thông báo hiện có.
// Client gọi khi người dùng mở panel thông báo. Trước đây client chỉ đặt unread = 0 trong
// bộ nhớ nên tải lại trang là badge hiện lại nguyên số cũ — cột is_read của bảng
// notifications có từ migration 0019 nhưng CHƯA BAO GIỜ được set true (cả code chỉ có một
// chỗ `where is_read = false`), nên mọi thông báo cộng đồng/lịch hẹn ở lại "chưa đọc"
// vĩnh viễn và bị trả về mọi lần tải trang.
router.post('/notifications/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    await Promise.all([
      // Thông báo có hàng thật trong DB: đánh dấu theo từng dòng.
      db.query(
        `update notifications set is_read = true
          where recipient_id = $1 and is_read = false`,
        [userId]
      ),
      // Thông báo tổng hợp (không có hàng nào): dùng mốc thời gian — xem migration 0054.
      db.query(
        `update users set notifications_read_at = now() where id = $1`,
        [userId]
      )
    ]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Notifications read error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not mark notifications read' });
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
