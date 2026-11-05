import { apiClient } from './apiClient';

// Ảnh đại diện thật của chuyên gia, dùng chung cho cả app (trang Chuyên gia, gợi ý chuyên gia,
// khung chat…). Trước đây mỗi màn hình tự tải lại và ép trình duyệt không cache → mỗi lần mở
// trang là kéo lại toàn bộ ảnh từ DB (tốn Egress Supabase). Giờ:
//  - mỗi chuyên gia chỉ tải 1 lần trong phiên (giữ object URL ở đây, không mất khi đổi trang);
//  - trình duyệt được cache theo header của server (1 giờ + ETag → 304 khi ảnh không đổi).
const cache = new Map(); // expertId -> Promise<objectURL>

// fresh = true: vừa đổi ảnh (trang quản trị / hồ sơ chuyên gia) → hỏi lại server bằng ETag
export function getExpertAvatarUrl(expertId, { fresh = false } = {}) {
  if (!fresh && cache.has(expertId)) return cache.get(expertId);
  const p = apiClient.getBlob(`/experts/${expertId}/avatar`, { cache: fresh ? 'no-cache' : 'default' })
    .then((blob) => URL.createObjectURL(blob));
  p.catch(() => { if (cache.get(expertId) === p) cache.delete(expertId); });
  cache.set(expertId, p);
  return p;
}

// gọi sau khi tải lên / xoá ảnh để lần hiển thị sau lấy bản mới
export function forgetExpertAvatar(expertId) {
  cache.delete(expertId);
}
