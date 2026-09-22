import { db } from '../config/db.js';

// Don dep cac bang log/token noi bo cu, KHONG dung toi du lieu nguoi dung that (mood_checkins,
// journal_entries, task_completions, assessment_results, user_daily_visits...) - nhung bang do
// phai giu vinh vien de tinh bao cao/streak/lich su ca nhan.
const CLEANUP_TARGETS = [
  {
    label: 'risk_snapshots',
    sql: `delete from risk_snapshots where calculated_at < now() - interval '30 days'`
  },
  {
    label: 'recommendation_logs',
    sql: `delete from recommendation_logs where created_at < now() - interval '30 days'`
  },
  {
    label: 'refresh_tokens',
    sql: `delete from refresh_tokens
          where expires_at < now() - interval '30 days'
             or (revoked_at is not null and revoked_at < now() - interval '30 days')`
  },
  {
    label: 'email_verification_tokens',
    sql: `delete from email_verification_tokens
          where used_at is not null
             or expires_at < now() - interval '7 days'`
  },
  {
    label: 'ai_usage_logs',
    sql: `delete from ai_usage_logs where created_at < now() - interval '180 days'`
  }
];

export async function runCleanupJob() {
  const results = {};
  for (const target of CLEANUP_TARGETS) {
    try {
      const result = await db.query(target.sql);
      results[target.label] = result.rowCount;
    } catch (error) {
      console.error(`[CLEANUP_JOB] ${target.label} failed:`, error.message);
      results[target.label] = `error: ${error.message}`;
    }
  }
  console.log('[CLEANUP_JOB] Deleted rows:', results);
  return results;
}
