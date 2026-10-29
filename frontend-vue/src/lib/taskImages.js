import { API_BASE_URL } from './apiClient';

// Nhiệm vụ có sẵn dùng ảnh tĩnh trong public/; nhiệm vụ admin tự tạo qua UI (không có file
// tĩnh tương ứng) dùng ảnh lưu trong DB qua GET /tasks/:id/cover.
// Trả về '' khi không đủ thông tin để dựng đường dẫn ảnh.
function taskImageSrc(task, folder) {
  if (!task) return '';
  if (task.has_cover) return `${API_BASE_URL}/tasks/${task.id}/cover`;
  return task.code ? `/${folder}/${task.code}.png` : '';
}

// Ảnh vuông 120×120 cho icon nhỏ trong danh sách nhiệm vụ.
export function taskThumbSrc(task) {
  return taskImageSrc(task, 'task-images-thumb');
}

// Ảnh 640×360 (16:9) cho thẻ nhiệm vụ cỡ lớn, ví dụ trên Dashboard — dùng ảnh thumb ở đây
// sẽ bị phóng to và mờ. Bộ ảnh này sinh từ public/task-images (1280px), JPEG q80 ~50KB/ảnh;
// thêm nhiệm vụ có sẵn mới thì phải sinh lại ảnh tương ứng vào public/task-images-card.
export function taskCardSrc(task) {
  return taskImageSrc(task, 'task-images-card');
}
