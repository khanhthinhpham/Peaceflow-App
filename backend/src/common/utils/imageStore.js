import crypto from 'crypto';
import sharp from 'sharp';
import { db } from '../../config/db.js';
import { isR2Configured, r2Put, r2Delete, r2PublicUrl, r2PublicBase } from '../services/r2.service.js';
import { sendDbImage } from './dbImage.js';

// Ảnh công khai lưu trên R2, mỗi ảnh có sẵn NHIỀU KÍCH CỠ NHẸ — màn hình nào dùng đúng cỡ đó:
//   cover : thumb 240px webp (icon danh sách) · card 640px webp (thẻ) · full 1200px jpeg (trang chi tiết, og:image)
//   avatar: sm 96px webp (danh sách, bình luận, chat) · md 256px webp (hồ sơ)
// DB chỉ giữ "gốc" của khoá (vd tasks/<id>/<hash>), tên từng bản = gốc + hậu tố.
// Chưa cấu hình R2 → giữ cách cũ (bytea trong DB) để không chặn việc tải ảnh.

export const VARIANTS = {
  cover: {
    thumb: { size: 240, format: 'webp', quality: 76 },
    card: { size: 640, format: 'webp', quality: 78 },
    full: { size: 1200, format: 'jpeg', quality: 80 }
  },
  avatar: {
    sm: { size: 96, format: 'webp', quality: 80, square: true },
    md: { size: 256, format: 'webp', quality: 82, square: true }
  }
};
const DEFAULT_SIZE = { cover: 'full', avatar: 'md' };
const EXT = { webp: 'webp', jpeg: 'jpg' };
const MIME = { webp: 'image/webp', jpeg: 'image/jpeg' };

// Bảng ảnh trong DB. table/cột là hằng số trong code (không lấy từ request).
export const IMAGE_TABLES = {
  tasks: { kind: 'cover', data: 'cover_image', mime: 'cover_image_mime', r2: 'cover_r2' },
  articles: { kind: 'cover', data: 'cover_image', mime: 'cover_image_mime', r2: 'cover_r2' },
  experts: { kind: 'avatar', data: 'avatar_photo', mime: 'avatar_photo_mime', r2: 'avatar_r2' }
};

export const variantKey = (base, kind, name) => `${base}-${name}.${EXT[VARIANTS[kind][name].format]}`;

export function imageUrls(kind, base) {
  if (!base || !r2PublicBase()) return null;
  return Object.fromEntries(Object.keys(VARIANTS[kind]).map((n) => [n, r2PublicUrl(variantKey(base, kind, n))]));
}

async function renderVariant(buffer, v) {
  let img = sharp(buffer, { failOn: 'none' }).rotate();
  img = v.square
    ? img.resize({ width: v.size, height: v.size, fit: 'cover', position: 'attention' })
    : img.resize({ width: v.size, height: v.size, fit: 'inside', withoutEnlargement: true });
  if (v.format === 'jpeg') img = img.flatten({ background: '#ffffff' }).jpeg({ quality: v.quality, mozjpeg: true });
  else img = img.webp({ quality: v.quality });
  return img.toBuffer();
}

// Tạo đủ các cỡ + đẩy lên R2. Trả về gốc khoá.
export async function uploadVariants(prefix, kind, buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const base = `${prefix}/${hash}`;
  for (const [name, v] of Object.entries(VARIANTS[kind])) {
    const out = await renderVariant(buffer, v);
    await r2Put(variantKey(base, kind, name), out, MIME[v.format]);
  }
  return base;
}

export async function deleteVariants(kind, base) {
  if (!base) return;
  await Promise.all(Object.keys(VARIANTS[kind]).map((n) => r2Delete(variantKey(base, kind, n)).catch((e) => {
    console.error('[R2] delete failed:', e.message);
  })));
}

// Sau khi route đã ghi ảnh mới (bytea) cho bản ghi: nếu có R2 thì chuyển lên R2 (đủ các cỡ),
// xoá bytea khỏi DB cho nhẹ, xoá bộ ảnh R2 cũ. Lỗi R2 → giữ nguyên bytea (ảnh vẫn hiện được).
export async function promoteImage(table, id, buffer) {
  const t = IMAGE_TABLES[table];
  if (!isR2Configured() || !buffer?.length) return false;
  try {
    const old = await db.query(`select ${t.r2} as base from ${table} where id = $1`, [id]);
    const base = await uploadVariants(`${table}/${id}`, t.kind, buffer);
    await db.query(`update ${table} set ${t.r2} = $2, ${t.data} = null, ${t.mime} = null where id = $1`, [id, base]);
    const oldBase = old.rows[0]?.base;
    if (oldBase && oldBase !== base) await deleteVariants(t.kind, oldBase);
    return true;
  } catch (e) {
    console.error(`[R2] promote ${table}/${id} failed:`, e.message);
    return false;
  }
}

// Xoá ảnh (cả bytea lẫn R2).
export async function removeImage(table, id) {
  const t = IMAGE_TABLES[table];
  const r = await db.query(
    `update ${table} t set ${t.data} = null, ${t.mime} = null, ${t.r2} = null
     from (select id, ${t.r2} as base from ${table} where id = $1) o
     where t.id = o.id returning o.base`,
    [id]
  );
  if (r.rows[0]?.base && isR2Configured()) await deleteVariants(t.kind, r.rows[0].base);
  return r.rowCount > 0;
}

// Phục vụ ảnh: có bản R2 → chuyển hướng tới đúng cỡ (?size=thumb|card|full, avatar: sm|md);
// chưa có → đọc từ DB như cũ. Bản chuyển hướng được CDN giữ 1 giờ nên hầu như không chạm DB.
export async function serveImage(req, res, table, id, { cacheControl }) {
  const t = IMAGE_TABLES[table];
  const r = await db.query(`select ${t.r2} as base from ${table} where id = $1 limit 1`, [id]);
  const base = r.rows[0]?.base;
  if (base && r2PublicBase()) {
    const size = VARIANTS[t.kind][req.query.size] ? req.query.size : DEFAULT_SIZE[t.kind];
    res.set('Cache-Control', cacheControl);
    res.redirect(302, r2PublicUrl(variantKey(base, t.kind, size)));
    return true;
  }
  return sendDbImage(req, res, { table, column: t.data, mimeColumn: t.mime, id, cacheControl });
}

// URL công khai của 1 bản avatar người dùng trên R2 → gốc khoá (để xoá cả bộ). Không phải ảnh R2 → null.
export function r2BaseFromAvatarUrl(url) {
  const pub = r2PublicBase();
  if (!pub || typeof url !== 'string' || !url.startsWith(`${pub}/`)) return null;
  const m = url.slice(pub.length + 1).match(/^(users\/[^?#]+)-(sm|md)\.webp$/);
  return m ? m[1] : null;
}
