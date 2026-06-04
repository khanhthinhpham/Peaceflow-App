import { db } from '../config/db.js';

export async function runTaskExpiryJob() {
  try {
    const result = await db.query(`
      update user_task_assignments
      set status = 'expired'
      where status = 'in_progress'
        and assigned_at < now() - interval '48 hours'
      returning id
    `);
    console.log(`[TASK_EXPIRY_JOB] Expired ${result.rowCount} stale task assignments`);
  } catch (error) {
    console.error('[TASK_EXPIRY_JOB] Failed:', error.message);
    throw error;
  }
}
