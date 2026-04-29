import { db } from '../../config/db.js';

/**
 * Lấy lịch sử risk snapshots của user
 */
export async function getRiskHistory(userId, limit = 20) {
  const result = await db.query(
    `SELECT id, current_stress_index, current_anxiety_index,
            sleep_risk_index, burnout_risk_index,
            crisis_risk_level, explanation, calculated_at
     FROM risk_snapshots
     WHERE user_id = $1
     ORDER BY calculated_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Lấy snapshot gần nhất
 */
export async function getLatestSnapshot(userId) {
  const result = await db.query(
    `SELECT *
     FROM risk_snapshots
     WHERE user_id = $1
     ORDER BY calculated_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Lấy lịch sử recommendation logs
 */
export async function getRecommendationHistory(userId, limit = 10) {
  const result = await db.query(
    `SELECT rl.*, rs.current_stress_index, rs.crisis_risk_level
     FROM recommendation_logs rl
     LEFT JOIN risk_snapshots rs ON rs.id = rl.snapshot_id
     WHERE rl.user_id = $1
     ORDER BY rl.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}
