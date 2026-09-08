/**
 * Dịch bio/specialties tiếng Việt hiện có của các chuyên gia sang tiếng Anh (Gemini), lưu vào
 * bio_en/specialties_en — chỉ chạy 1 lần để đồng bộ dữ liệu cũ (chuyên gia có thể tự sửa lại
 * bản dịch sau trong trang "Hồ sơ chuyên gia"). Bỏ qua các dòng đã có sẵn bio_en/specialties_en
 * (không ghi đè nội dung chuyên gia đã tự viết).
 *
 * node src/scripts/backfill-expert-english.js
 */

import { db } from '../config/db.js';
import { translateToEnglish, translateListToEnglish, isTranslateConfigured } from '../common/services/translate.service.js';

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function run() {
  if (!isTranslateConfigured()) {
    console.error('GEMINI_API_KEY chưa được cấu hình — không thể dịch.');
    process.exit(1);
  }

  const { rows } = await db.query(
    `select id, full_name, bio, specialties, bio_en, specialties_en
     from experts
     where (bio is not null and bio <> '' and (bio_en is null or bio_en = ''))
        or (specialties is not null and jsonb_array_length(coalesce(specialties, '[]'::jsonb)) > 0
            and (specialties_en is null or jsonb_array_length(specialties_en) = 0))`
  );

  console.log(`Tìm thấy ${rows.length} chuyên gia cần dịch.`);

  for (const row of rows) {
    const specialties = ensureArray(row.specialties);
    let bioEn = row.bio_en || null;
    let specialtiesEn = ensureArray(row.specialties_en);

    try {
      if (!bioEn && row.bio?.trim()) {
        bioEn = await translateToEnglish(row.bio);
        console.log(`  [${row.full_name}] bio -> dịch xong (${bioEn.length} ký tự)`);
      }
      if (!specialtiesEn.length && specialties.length) {
        specialtiesEn = await translateListToEnglish(specialties);
        console.log(`  [${row.full_name}] specialties -> [${specialtiesEn.join(', ')}]`);
      }

      await db.query(
        `update experts set bio_en = $2, specialties_en = $3::jsonb where id = $1`,
        [row.id, bioEn, JSON.stringify(specialtiesEn)]
      );
    } catch (e) {
      console.error(`  [${row.full_name}] LỖI dịch: ${e.message} — bỏ qua, giữ nguyên fallback tiếng Việt.`);
    }
  }

  console.log('Hoàn tất backfill.');
  process.exit(0);
}

run().catch((e) => {
  console.error('Backfill thất bại:', e);
  process.exit(1);
});
