-- Ô "chia sẻ thêm" (không bắt buộc) đi kèm lời xác nhận ở cuối phiếu đăng ký hỗ trợ.
alter table support_registrations
  add column if not exists confirm_note text;
