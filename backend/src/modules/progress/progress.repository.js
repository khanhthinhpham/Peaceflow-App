import { db } from '../../config/db.js';

/**
 * Lấy progress theo user ID
 */
export async function findByUserId(userId) {
  const result = await db.query(
    `SELECT * FROM user_progress WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Tạo progress ban đầu nếu chưa có
 */
export async function ensureExists(userId) {
  const result = await db.query(
    `INSERT INTO user_progress (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId]
  );
  // Nếu insert thành công trả row mới, nếu đã tồn tại query lại
  if (result.rows[0]) return result.rows[0];
  return findByUserId(userId);
}

/**
 * Lấy leaderboard (top users theo XP)
 */
export async function getLeaderboard(limit = 10) {
  const result = await db.query(
    `SELECT up.user_id, up.total_xp, up.current_level, up.current_streak,
            up.longest_streak, up.badges_count,
            u.display_name, u.avatar_url
     FROM user_progress up
     JOIN users u ON u.id = up.user_id
     ORDER BY up.total_xp DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
