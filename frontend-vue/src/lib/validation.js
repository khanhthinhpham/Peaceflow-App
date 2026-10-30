// Kiểm tra định dạng email trước khi gửi lên server. Chặt hơn mẫu cũ /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// (mẫu đó cho lọt "a@b.c", "ten@gmail.con1", "ten@@gmail.com", "ten@gmail..com"):
// - phần trước @: chữ/số và . _ % + - , không bắt đầu/kết thúc bằng dấu chấm, không có ".."
// - tên miền: các nhãn chữ/số/gạch ngang (không bắt đầu/kết thúc bằng "-"), cách nhau bằng dấu chấm
// - đuôi cuối (TLD) chỉ gồm chữ cái, tối thiểu 2 ký tự
const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function isValidEmail(value) {
  const email = String(value || '').trim();
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}
