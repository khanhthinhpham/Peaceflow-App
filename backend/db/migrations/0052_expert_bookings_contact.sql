-- Số điện thoại + link Facebook/Threads (tuỳ chọn) của bệnh nhân khi đặt lịch — để admin và
-- chuyên gia được nhận lịch chủ động liên hệ trước, không chỉ trông chờ vào chat/Zoom.
alter table expert_bookings
  add column if not exists contact_phone varchar(30),
  add column if not exists contact_social varchar(255);
