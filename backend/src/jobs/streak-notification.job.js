import { db } from '../config/db.js';
import { sendPushToUser } from '../modules/notifications/notification.routes.js';

export async function runStreakWarningJob() {
  try {
    // Users có streak > 0 nhưng chưa hoạt động hôm nay
    const result = await db.query(`
      select user_id, current_streak
      from user_progress
      where current_streak > 0
        and (last_activity_date is null or last_activity_date < current_date)
    `);

    let sent = 0;
    for (const row of result.rows) {
      await sendPushToUser(
        row.user_id,
        `🔥 Streak ${row.current_streak} ngày sắp mất!`,
        'Hoàn thành 1 nhiệm vụ hoặc check-in trước nửa đêm để giữ streak.',
        'tasks.html'
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
      select user_id, current_streak
      from user_progress
      where current_streak > 0
        and (last_activity_date is null or last_activity_date < current_date - interval '1 day')
    `);

    let sent = 0;
    for (const row of result.rows) {
      await sendPushToUser(
        row.user_id,
        `💔 Streak ${row.current_streak} ngày đã bị phá!`,
        'Bạn đã bỏ lỡ hôm qua. Hãy bắt đầu streak mới ngay hôm nay!',
        'tasks.html'
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
