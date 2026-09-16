-- Thân chủ giờ được gửi hồ sơ tự do cho bất kỳ chuyên gia nào, không bắt buộc phải có
-- lịch hẹn đã xác nhận trước — bỏ ràng buộc NOT NULL trên booking_id.
alter table client_shared_records alter column booking_id drop not null;
