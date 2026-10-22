import { fileTypeFromBuffer } from 'file-type';

// Chỉ những mime THẬT (dò theo magic bytes của chính file, không tin Content-Type client khai
// báo lúc upload) nằm trong danh sách này mới được phép trả về với Content-Disposition: inline.
// Mục đích: chặn kiểu tấn công upload SVG/HTML chứa <script> nhưng khai mime là "image/..." để
// vượt qua filter — nếu server trả inline theo đúng mime giả đó, trình duyệt sẽ render và THỰC
// THI script ngay trên domain của app (stored XSS) khi ai đó mở link file trực tiếp.
const INLINE_SAFE_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/x-wav', 'audio/flac',
  'application/pdf'
]);

/**
 * Dò mime thật của buffer, quyết định có an toàn để trả Content-Disposition: inline không.
 * Mọi file không khớp whitelist (kể cả không dò được chữ ký, như text/SVG) đều bị ép về
 * application/octet-stream + buộc tải xuống (attachment) thay vì render trực tiếp.
 */
export async function resolveSafeContentType(buffer, declaredMime) {
  const detected = await fileTypeFromBuffer(buffer).catch(() => null);
  const sniffed = detected?.mime || null;
  if (sniffed && INLINE_SAFE_MIMES.has(sniffed)) {
    return { mime: sniffed, inline: true };
  }
  // Ghi âm từ MediaRecorder (audio/webm) dùng chung container Matroska với video nên file-type
  // luôn báo nhầm thành 'video/webm' dù không có track hình — không có rủi ro thực thi script
  // qua container này nên vẫn cho inline, giữ nguyên mime audio người dùng khai báo lúc ghi.
  if (sniffed === 'video/webm' && (declaredMime || '').startsWith('audio/')) {
    return { mime: declaredMime, inline: true };
  }
  return { mime: 'application/octet-stream', inline: false };
}
