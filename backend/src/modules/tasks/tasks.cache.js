import { db } from '../../config/db.js';

// Danh mục bài tập active gần như tĩnh (chỉ đổi qua script import/backfill chạy tay,
// không có endpoint ghi trực tiếp) — cache lại tránh việc mọi request tới /tasks,
// /tasks/public-emergency, /tasks/recommended đều SELECT * nguyên bảng.
// Lưu ý: backend chạy serverless (Vercel) nên cache theo instance, reset khi cold start —
// vẫn giảm được tải trong lúc instance đang "ấm" (nhiều request liên tiếp).
const CACHE_TTL_MS = 5 * 60 * 1000;

let cached = null;
let cachedAt = 0;

export async function getActiveTasks() {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }
  // Không select `embedding` (vector 768 chiều, chỉ dùng nội bộ cho tìm kiếm ngữ nghĩa trong
  // ai.service.js) — không consumer nào ở đây cần, và nó chiếm phần lớn kích thước response.
  const { rows } = await db.query(
    `select id, code, title, category, difficulty, duration_minutes, xp_reward, description,
            steps, safety_notes, tags, triggers_supported, contraindications, active,
            metadata, created_at, updated_at
     from tasks where active = true`
  );
  cached = rows;
  cachedAt = Date.now();
  return cached;
}
