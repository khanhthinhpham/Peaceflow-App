import { db } from '../../config/db.js';

/**
 * Tạo journal entry mới
 */
export async function create(userId, data) {
  const result = await db.query(
    `INSERT INTO journal_entries (user_id, content, mood, tags)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, data.content, data.mood || null, JSON.stringify(data.tags || [])]
  );
  return result.rows[0];
}

/**
 * Lấy danh sách journal entries (chưa xóa)
 */
export async function findByUser(userId, limit = 50) {
  const result = await db.query(
    `SELECT * FROM journal_entries
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Lấy journal entry theo ID
 */
export async function findById(userId, id) {
  const result = await db.query(
    `SELECT * FROM journal_entries
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [id, userId]
  );
  return result.rows[0] || null;
}

/**
 * Cập nhật journal entry
 */
export async function update(userId, id, data) {
  const result = await db.query(
    `UPDATE journal_entries
     SET content = COALESCE($3, content),
         mood = COALESCE($4, mood),
         tags = CASE WHEN $5::jsonb IS NULL THEN tags ELSE $5::jsonb END,
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [
      id,
      userId,
      data.content || null,
      data.mood || null,
      data.tags ? JSON.stringify(data.tags) : null
    ]
  );
  return result.rows[0] || null;
}

/**
 * Soft-delete journal entry
 */
export async function softDelete(userId, id) {
  const result = await db.query(
    `UPDATE journal_entries
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, userId]
  );
  return result.rowCount > 0;
}
