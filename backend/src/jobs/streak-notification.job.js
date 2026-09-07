import { db } from '../config/db.js';
import { sendPushToUser } from '../modules/notifications/notification.routes.js';

export async function runStreakWarningJob() {
  try {
    // Users có streak > 0 nhưng chưa hoạt động hôm nay — join users để lấy locale đã lưu
    // (job chạy nền qua cron, không có request nào của user để đọc x-locale).
    const result = await db.query(`
      select p.user_id, p.current_streak, u.locale
      from user_progress p
      join users u on u.id = p.user_id
      where p.current_streak > 0
        and (p.last_activity_date is null or p.last_activity_date < current_date)
    `);

    let sent = 0;
    for (const row of result.rows) {
      const isEn = row.locale === 'en';
      await sendPushToUser(
        row.user_id,
        isEn ? `🔥 Your ${row.current_streak}-day streak is about to end!` : `🔥 Streak ${row.current_streak} ngày sắp mất!`,
        isEn ? 'Complete 1 task or check in before midnight to keep your streak.' : 'Hoàn thành 1 nhiệm vụ hoặc check-in trước nửa đêm để giữ streak.',
        'pages/tasks.html'
      );
      sent++;
    }

    console.log(`[STREAK_WARNING_JOB] Sent warning to ${sent} users`);
    return { sent };
  } catch (error) {
    console.error('[STREAK_WARNING_JOB] Failed:', error.message);
    throw error;
  }
}

export async function runStreakLostNotificationJob() {
  try {
    // Users sắp bị reset streak (chưa hoạt động từ hôm qua trở về trước)
    const result = await db.query(`
      select p.user_id, p.current_streak, u.locale
      from user_progress p
      join users u on u.id = p.user_id
      where p.current_streak > 0
        and (p.last_activity_date is null or p.last_activity_date < current_date - interval '1 day')
    `);

    let sent = 0;
    for (const row of result.rows) {
      const isEn = row.locale === 'en';
      await sendPushToUser(
        row.user_id,
        isEn ? `💔 Your ${row.current_streak}-day streak is broken!` : `💔 Streak ${row.current_streak} ngày đã bị phá!`,
        isEn ? 'You missed yesterday. Start a new streak today!' : 'Bạn đã bỏ lỡ hôm qua. Hãy bắt đầu streak mới ngay hôm nay!',
        'pages/tasks.html'
      );
      sent++;
    }

    console.log(`[STREAK_LOST_JOB] Sent lost notification to ${sent} users`);
    return { sent };
  } catch (error) {
    console.error('[STREAK_LOST_JOB] Failed:', error.message);
    throw error;
  }
}
