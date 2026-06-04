import { db } from '../config/db.js';

export async function runReportCacheJob() {
  try {
    const result = await db.query(`
      with badge_stats as (
        select user_id, count(*)::int as badges_count
        from user_badges
        group by user_id
      )
      update user_progress up
      set badges_count = coalesce(bs.badges_count, 0)
      from badge_stats bs
      where up.user_id = bs.user_id
      returning up.user_id
    `);
    console.log(`[REPORT_CACHE_JOB] Refreshed badge counts for ${result.rowCount} users`);
  } catch (error) {
    console.error('[REPORT_CACHE_JOB] Failed:', error.message);
    throw error;
  }
}
