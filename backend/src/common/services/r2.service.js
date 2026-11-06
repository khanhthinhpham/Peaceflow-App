import { AwsClient } from 'aws4fetch';

// Cloudflare R2 (tương thích S3) — nơi lưu ẢNH CÔNG KHAI (bìa bài viết, bìa nhiệm vụ, avatar
// chuyên gia, avatar người dùng). Không tính phí băng thông tải ra, ảnh phục vụ thẳng từ CDN
// của Cloudflare → không đi qua backend / DB Supabase.
// KHÔNG dùng cho dữ liệu nhạy cảm (hồ sơ y tế, file đính kèm bài test…) — những thứ đó vẫn ở DB, mã hoá.
//
// Biến môi trường cần có:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
//   R2_PUBLIC_URL  (vd https://cdn.peaceflow.vn hoặc https://pub-xxxx.r2.dev — không có / cuối)

let client = null;

export function isR2Configured() {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    && process.env.R2_BUCKET && process.env.R2_PUBLIC_URL);
}

function getClient() {
  if (!client) {
    client = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      service: 's3',
      region: 'auto'
    });
  }
  return client;
}

function objectUrl(key) {
  const k = String(key).split('/').map(encodeURIComponent).join('/');
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${k}`;
}

export function r2PublicBase() {
  return String(process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
}

export function r2PublicUrl(key) {
  return `${r2PublicBase()}/${key}`;
}

// Tên file có mã băm nội dung → nội dung không bao giờ đổi dưới cùng một URL → cache "vĩnh viễn".
export async function r2Put(key, buffer, contentType) {
  const res = await getClient().fetch(objectUrl(key), {
    method: 'PUT',
    body: buffer,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
  if (!res.ok) throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text().catch(() => '')}`);
}

export async function r2Delete(key) {
  const res = await getClient().fetch(objectUrl(key), { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${key} failed: ${res.status}`);
}
