/**
 * Dịch title/content tiếng Việt của các bài viết (Góc chia sẻ) đã đăng sang tiếng Anh, lưu
 * vào title_en/content_en — chỉ chạy 1 lần để đồng bộ các bài cũ. Bỏ qua bài đã có sẵn bản
 * dịch (không ghi đè bản dịch admin đã tự sửa qua nút "Dịch AI").
 *
 * node src/scripts/backfill-article-english.js
 */

import { db } from '../config/db.js';
import { translateToEnglish, isTranslateConfigured } from '../common/services/translate.service.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  if (!isTranslateConfigured()) {
    console.error('Dịch vụ dịch chưa sẵn sàng.');
    process.exit(1);
  }

  const { rows } = await db.query(
    `select id, title, content, title_en, content_en
     from articles
     where status = 'published'
       and (title_en is null or title_en = '' or content_en is null or content_en = '')
     order by created_at asc`
  );

  console.log(`Tìm thấy ${rows.length} bài viết cần dịch.`);

  let done = 0;
  let failed = 0;
  for (const row of rows) {
    const label = (row.title || '').slice(0, 60);
    try {
      const titleEn = row.title_en || (row.title?.trim() ? await translateToEnglish(row.title) : null);
      const contentEn = row.content_en || (row.content?.trim() ? await translateToEnglish(row.content) : null);

      await db.query(`update articles set title_en = $2, content_en = $3 where id = $1`, [row.id, titleEn, contentEn]);
      done++;
      console.log(`  [${done + failed}/${rows.length}] OK — "${label}"`);
    } catch (e) {
      failed++;
      console.error(`  [${done + failed}/${rows.length}] LỖI — "${label}": ${e.message} — bỏ qua, giữ fallback tiếng Việt.`);
    }
    // Giãn cách giữa các bài để tránh bị chặn tạm thời (endpoint Google Translate không
    // chính thức, không có API key để "xin" quota riêng).
    await sleep(400);
  }

  console.log(`Hoàn tất: đã dịch ${done}/${rows.length} bài (${failed} lỗi — chạy lại script để dịch nốt phần còn thiếu).`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Backfill thất bại:', e);
  process.exit(1);
});
