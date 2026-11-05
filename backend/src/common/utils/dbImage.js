import sharp from 'sharp';
import { db } from '../../config/db.js';
import { resolveSafeContentType } from './safeFileServe.js';

// Ảnh (avatar chuyên gia, ảnh bìa bài viết / nhiệm vụ) đang lưu dạng bytea trong Postgres
// (Supabase). Mỗi lần đọc ảnh là một lần kéo nguyên file từ DB qua mạng → tính vào Egress
// của gói Supabase. Hai việc ở file này để giảm phần đó:
//  1. Nén ảnh ngay lúc tải lên (thu nhỏ + mã hoá lại) → mỗi lần đọc nhẹ đi hàng chục lần.
//  2. Phục vụ ảnh có ETag: hỏi DB md5 của ảnh trước (vài chục byte); trình duyệt / CDN đã có
//     đúng bản đó thì trả 304, không đọc nội dung ảnh khỏi DB nữa.

export const IMAGE_PRESETS = {
  // ảnh đại diện: hiển thị tối đa ~120px → 320px đủ nét trên màn hình mật độ cao
  avatar: { size: 320, format: 'webp', quality: 80 },
  // ảnh bìa: JPEG (không dùng WebP/AVIF) vì bot xem trước link MXH (Facebook, Zalo…) đọc og:image ổn định nhất với JPEG
  cover: { size: 1200, format: 'jpeg', quality: 80 }
};

// Trả về { buffer, mime } đã nén, hoặc null nếu không nên đổi (GIF động, ảnh lỗi, bản nén không nhỏ hơn).
export async function compressImageBuffer(buffer, mime, preset) {
  if (!buffer?.length || mime === 'image/gif' || mime === 'image/svg+xml') return null;
  try {
    let img = sharp(buffer, { failOn: 'none' })
      .rotate() // xoay đúng theo EXIF của ảnh chụp điện thoại
      .resize({ width: preset.size, height: preset.size, fit: 'inside', withoutEnlargement: true });
    if (preset.format === 'jpeg') img = img.flatten({ background: '#ffffff' }).jpeg({ quality: preset.quality, mozjpeg: true });
    else img = img.webp({ quality: preset.quality });
    const out = await img.toBuffer();
    const outMime = preset.format === 'jpeg' ? 'image/jpeg' : 'image/webp';
    // AVIF bắt buộc đổi (bot MXH không đọc được); định dạng khác chỉ đổi khi thật sự nhẹ hơn
    if (out.length >= buffer.length && mime !== 'image/avif') return null;
    return { buffer: out, mime: outMime };
  } catch (_error) {
    return null; // không đọc được ảnh → giữ nguyên bản gốc, khâu kiểm tra mime lúc tải về sẽ xử lý
  }
}

// Middleware đặt ngay sau multer: nén req.file trước khi route ghi vào DB.
export function compressUpload(presetName) {
  const preset = IMAGE_PRESETS[presetName];
  return async (req, _res, next) => {
    if (req.file?.buffer) {
      const out = await compressImageBuffer(req.file.buffer, req.file.mimetype, preset);
      if (out) { req.file.buffer = out.buffer; req.file.mimetype = out.mime; req.file.size = out.buffer.length; }
    }
    next();
  };
}

// Gửi ảnh lưu trong DB kèm ETag (= md5 nội dung, Postgres tự tính, không gửi ảnh qua mạng).
// table / column là hằng số trong code (không lấy từ request) nên ghép chuỗi SQL an toàn.
// Trả về false nếu bản ghi không có ảnh để route tự trả 404.
export async function sendDbImage(req, res, { table, column, mimeColumn, id, cacheControl }) {
  const meta = await db.query(
    `select md5(${column}) as hash, ${mimeColumn} as mime from ${table} where id = $1 limit 1`,
    [id]
  );
  const hash = meta.rows[0]?.hash;
  if (!hash) return false;
  const etag = `"${hash}"`;
  res.set('ETag', etag);
  res.set('Cache-Control', cacheControl);
  const inm = req.headers['if-none-match'];
  if (inm && inm.split(',').some((t) => t.trim().replace(/^W\//, '') === etag)) {
    res.status(304).end();
    return true;
  }
  const r = await db.query(`select ${column} as data from ${table} where id = $1 limit 1`, [id]);
  let data = r.rows[0]?.data;
  if (!data) return false;
  let mime = meta.rows[0].mime;
  // Ảnh AVIF cũ (tải lên trước khi có bước nén): đổi sang JPEG cho bot MXH đọc được
  if (mime === 'image/avif') {
    const out = await compressImageBuffer(data, mime, IMAGE_PRESETS.cover);
    if (out) { data = out.buffer; mime = out.mime; }
  }
  const safe = await resolveSafeContentType(data, mime);
  res.set('Content-Type', safe.mime);
  res.set('Content-Disposition', safe.inline ? 'inline' : 'attachment; filename="image"');
  res.send(data);
  return true;
}
