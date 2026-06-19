-- Lưu thêm mã BIN ngân hàng (VietQR) cho phương thức nhận thanh toán của chuyên gia.
-- Dùng cho tra cứu tên chủ tài khoản & tạo QR chi trả về sau.
alter table experts add column if not exists payout_bank_bin varchar(20);
