-- Lưu nội dung chuyển khoản (memo) của từng đơn để hiển thị nhất quán.
alter table payments add column if not exists content varchar(140);
