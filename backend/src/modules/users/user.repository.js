import { db } from '../../config/db.js';

/**
 * Lấy user theo ID
 */
export async function findById(userId) {
  const result = await db.query(
    `SELECT id, email, full_name, display_name, phone, gender,
            avatar_url, city, country, status, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Cập nhật thông tin user
 */
export async function update(userId, data) {
  const result = await db.query(
    `UPDATE users
     SET display_name = COALESCE($2, display_name),
         phone = COALESCE($3, phone),
         gender = COALESCE($4, gender),
         avatar_url = COALESCE($5, avatar_url),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, full_name, display_name, phone, gender,
               avatar_url, city, country, status`,
    [userId, data.display_name, data.phone, data.gender, data.avatar_url]
  );
  return result.rows[0] || null;
}
