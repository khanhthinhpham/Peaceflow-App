// users.avatar_url có 2 dạng: ảnh thật (http/https — ảnh tự tải lên R2, hoặc ảnh Google) hoặc biểu tượng "emoji:🐱".
// size 'sm': ảnh tự tải lên R2 có sẵn bản 96px (…-sm.webp) — dùng cho avatar nhỏ (sidebar, danh sách).
export function avatarPhotoUrl(url, size = 'md') {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return null;
  return size === 'sm' ? url.replace(/-md\.webp(?=$|[?#])/, '-sm.webp') : url;
}

export function avatarEmojiOf(url, fallback = '🐱') {
  return typeof url === 'string' && url.startsWith('emoji:') ? (url.slice(6) || fallback) : fallback;
}
