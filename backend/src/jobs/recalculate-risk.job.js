import { db } from '../config/db.js';
import { RiskEngineService } from '../modules/risk/risk-engine.service.js';

export async function runRecalculateRiskJob() {
  try {
    const result = await db.query(`
      select distinct mc.user_id
      from mood_checkins mc
      join users u on u.id = mc.user_id
      where u.status = 'active'
        and mc.created_at >= now() - interval '30 days'
    `);

    let processed = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        await RiskEngineService.calculateStressIndex(row.user_id);
        processed++;
      } catch (e) {
        failed++;
        console.error(`[RISK_JOB] user_id=${row.user_id}:`, e.message);
      }
    }

    console.log(`[RISK_JOB] Done: ${processed} processed, ${failed} failed`);
  } catch (error) {
    console.error('[RISK_JOB] Failed:', error.message);
    throw error;
  }
}
