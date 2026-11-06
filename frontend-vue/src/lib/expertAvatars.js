import { API_BASE_URL } from './apiClient';

// Ảnh đại diện chuyên gia, dùng chung cho cả app. Ảnh nằm trên R2 (nhiều cỡ) — dùng thẳng URL
// (server chuyển hướng tới đúng cỡ), trình duyệt + CDN tự cache; không tải blob qua JS nữa.
// Promise chỉ thành công khi ảnh tải được (chuyên gia chưa có ảnh → lỗi → giữ emoji mặc định).
const cache = new Map(); // `${id}:${size}` -> Promise<url>
const bust = new Map();  // id -> mốc thời gian vừa đổi ảnh

export function expertAvatarSrc(expertId, size = 'sm') {
  const v = bust.get(expertId);
  return `${API_BASE_URL}/experts/${expertId}/avatar?size=${size}${v ? `&v=${v}` : ''}`;
}

// size: sm (96px — danh sách, chat) | md (256px — hồ sơ)
export function getExpertAvatarUrl(expertId, { fresh = false, size = 'sm' } = {}) {
  if (fresh) forgetExpertAvatar(expertId);
  const key = `${expertId}:${size}`;
  if (cache.has(key)) return cache.get(key);
  const url = expertAvatarSrc(expertId, size);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('avatar not available'));
    img.src = url;
  });
  p.catch(() => { if (cache.get(key) === p) cache.delete(key); });
  cache.set(key, p);
  return p;
}

// gọi sau khi tải lên / xoá ảnh để lần hiển thị sau lấy bản mới
export function forgetExpertAvatar(expertId) {
  bust.set(expertId, Date.now());
  for (const k of [...cache.keys()]) if (k.startsWith(`${expertId}:`)) cache.delete(k);
}
