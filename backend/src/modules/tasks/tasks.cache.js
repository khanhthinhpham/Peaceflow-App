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
            metadata, created_at, updated_at,
            title_en, description_en, steps_en, safety_notes_en, metadata_en
     from tasks where active = true`
  );
  cached = rows;
  cachedAt = Date.now();
  return cached;
}

// Chọn bản tiếng Anh khi có (locale === 'en') và cột *_en đã có dữ liệu, fallback về bản
// tiếng Việt gốc nếu chưa dịch — an toàn với các task chưa kịp có bản dịch.
// Không đổi shape/tên field trả về (title/description/steps/safety_notes/metadata) để
// frontend không cần biết có bản dịch hay không.
export function localizeTask(task, locale) {
  if (locale !== 'en') return task;
  const { title_en, description_en, steps_en, safety_notes_en, metadata_en, ...rest } = task;
  return {
    ...rest,
    title: title_en || task.title,
    description: description_en || task.description,
    steps: steps_en || task.steps,
    safety_notes: safety_notes_en || task.safety_notes,
    metadata: metadata_en ? { ...task.metadata, ...metadata_en } : task.metadata
  };
}
