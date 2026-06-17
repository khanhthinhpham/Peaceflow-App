import { db } from '../config/db.js';

export async function runStreakJob() {
  try {
    const result = await db.query(`
      update user_progress
      set current_streak = 0
      where current_streak > 0
        and (
          last_activity_date is null
          or last_activity_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date - interval '1 day'
        )
      returning user_id
    `);
    console.log(`[STREAK_JOB] Reset streak for ${result.rowCount} users`);
  } catch (error) {
    console.error('[STREAK_JOB] Failed:', error.message);
    throw error;
  }
}
