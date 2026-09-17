/**
 * Tạo ảnh bìa (cover) cho các bài viết Góc chia sẻ CHƯA có ảnh — không phải ảnh chụp thật,
 * mà là ảnh minh hoạ dạng gradient + icon theo đúng màu thương hiệu, gán riêng theo từng
 * danh mục, để không còn bài nào hiện icon 📖 mặc định trống trơn. Chỉ chạy cho bài chưa có
 * cover_image (không ghi đè ảnh thật admin đã tự upload).
 *
 * node src/scripts/generate-article-covers.js
 */

import sharp from 'sharp';
import { db } from '../config/db.js';

const CATEGORY_STYLES = {
  ky_nang_song: { icon: '🌱', from: '#C5E8D2', to: '#7BBF95' },
  cau_chuyen_that: { icon: '💬', from: '#FFE0C4', to: '#E8A876' },
  giam_cang_thang: { icon: '🧘', from: '#C5E8F5', to: '#6BBDD4' },
  suc_khoe_tinh_than: { icon: '🧠', from: '#DDD1EB', to: '#9B82C0' },
  khac: { icon: '✨', from: '#E8CBA7', to: '#B8895A' },
  giac_ngu: { icon: '🌙', from: '#C9D6F0', to: '#6B7FC4' }
};
const DEFAULT_STYLE = CATEGORY_STYLES.khac;

// Hash chuỗi -> số nguyên ổn định, dùng để lệch vị trí 2 vòng tròn trang trí theo từng bài
// (không thì mọi bài cùng danh mục sẽ có ảnh giống hệt nhau).
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildCoverSvg(category, seedKey) {
  const style = CATEGORY_STYLES[category] || DEFAULT_STYLE;
  const seed = hashSeed(seedKey);
  const c1x = 120 + (seed % 260);
  const c1y = 680 + ((seed >> 4) % 160);
  const c2x = 880 + ((seed >> 8) % 260);
  const c2y = 60 + ((seed >> 12) % 160);

  return `
<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${style.from}"/>
      <stop offset="100%" stop-color="${style.to}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${c1x}" cy="${c1y}" r="180" fill="white" opacity="0.10"/>
  <circle cx="${c2x}" cy="${c2y}" r="120" fill="white" opacity="0.08"/>
  <text x="600" y="530" font-size="340" text-anchor="middle" fill="white" opacity="0.9">${style.icon}</text>
</svg>`;
}

async function run() {
  const { rows } = await db.query(
    `select id, category from articles where status = 'published' and cover_image is null`
  );
  console.log(`Tìm thấy ${rows.length} bài viết chưa có ảnh bìa.`);

  let done = 0;
  for (const row of rows) {
    try {
      const svg = buildCoverSvg(row.category, row.id);
      const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
      await db.query(`update articles set cover_image = $2, cover_image_mime = 'image/png' where id = $1`, [row.id, png]);
      done++;
      console.log(`  [${done}/${rows.length}] OK — ${row.category} (${png.length} bytes)`);
    } catch (e) {
      console.error(`  LỖI tạo ảnh cho ${row.id}: ${e.message}`);
    }
  }

  console.log(`Hoàn tất: đã tạo ảnh bìa cho ${done}/${rows.length} bài.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Tạo ảnh bìa thất bại:', e);
  process.exit(1);
});
