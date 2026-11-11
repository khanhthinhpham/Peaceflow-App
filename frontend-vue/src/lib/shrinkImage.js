// Thu nhỏ ảnh NGAY TRÊN MÁY trước khi tải lên. Máy chủ (Vercel) chặn request lớn hơn ~4,5MB và
// khi bị chặn trình duyệt chỉ thấy lỗi mạng ("Không kết nối được máy chủ") — ảnh tạo bằng AI / chụp
// màn hình dạng PNG thường 3–8MB nên hay dính. Server vẫn nén + tạo các cỡ nhẹ sau đó.
// Trả về File JPEG (cạnh dài tối đa maxSize). Ảnh đã nhỏ / GIF / SVG / không đọc được → giữ nguyên.
export async function shrinkImageFile(file, { maxSize = 1600, quality = 0.86, skipUnderBytes = 900 * 1024 } = {}) {
  if (!file || !file.type?.startsWith('image/') || /gif|svg/.test(file.type)) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (_e) {
    return file; // định dạng trình duyệt không đọc được (vd HEIC) → để server báo lỗi rõ ràng
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= skipUnderBytes) { bitmap.close?.(); return file; }
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // nền trắng cho ảnh PNG trong suốt khi đổi sang JPEG
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob || blob.size >= file.size) return file;
  const name = (file.name || 'image').replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
