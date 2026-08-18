// Nguồn duy nhất quyết định một tài khoản có được phép dùng app hay không.
//
// Trước đây login chỉ chặn ['suspended','deleted','inactive'] nên 'pending' đăng nhập
// được, trong khi requireAuth và refreshSession lại đòi đúng 'active'. Hệ quả là người
// dùng đăng nhập thành công rồi bị 401 ngay ở request kế tiếp và bị đá về trang login,
// lặp vô hạn mà không có thông báo nào giải thích.
//
// Migration 0029 đã chuyển toàn bộ chuyên gia 'pending' sang 'active' và bỏ việc dùng
// users.status để khoá đăng nhập, nên 'active' là trạng thái dùng được duy nhất.
export const USABLE_STATUS = 'active';

export function isUsableStatus(status) {
  return status === USABLE_STATUS;
}

export function describeBlockedStatus(status) {
  if (status === 'pending') {
    return 'Tài khoản đang chờ kích hoạt. Vui lòng liên hệ hỗ trợ để được kích hoạt.';
  }
  return 'Tài khoản hiện đang bị vô hiệu hóa.';
}
