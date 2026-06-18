-- Thêm trạng thái 'awaiting_expert': đã thanh toán (admin xác nhận), chờ chuyên gia nhận/từ chối lịch.
alter table expert_bookings drop constraint if exists expert_bookings_status_check;
alter table expert_bookings add constraint expert_bookings_status_check
  check (status in ('pending_payment', 'pending', 'awaiting_expert', 'confirmed', 'completed', 'cancelled', 'expired'));
