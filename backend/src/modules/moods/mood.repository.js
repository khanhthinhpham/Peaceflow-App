import { db } from '../../config/db.js';

/**
 * Tạo mood check-in mới
 */
export async function create(userId, data) {
  const result = await db.query(
    `INSERT INTO mood_checkins
      (user_id, mood_score, anxiety_score, stress_score, energy_score,
       sleep_quality_score, dominant_emotion, triggers, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      data.mood_score,
      data.anxiety_score,
      data.stress_score,
      data.energy_score,
      data.sleep_quality_score,
      data.dominant_emotion || null,
      JSON.stringify(data.triggers || []),
      data.notes || null
    ]
  );
  return result.rows[0];
}

/**
 * Lấy danh sách mood check-ins (mới nhất trước)
 */
export async function findByUser(userId, limit = 100) {
  const result = await db.query(
    `SELECT * FROM mood_checkins
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Lấy mood check-in gần nhất
 */
export async function findLatest(userId) {
  const result = await db.query(
    `SELECT * FROM mood_checkins
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Lấy mood check-in theo ID
 */
export async function findById(userId, id) {
  const result = await db.query(
    `SELECT * FROM mood_checkins
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

/**
 * Xóa mood check-in
 */
export async function deleteById(userId, id) {
  const result = await db.query(
    `DELETE FROM mood_checkins
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );
  return result.rowCount > 0;
}
