-- Cho phép ghi nhận ai là người thực hiện chấm điểm khi bài đánh giá không phải
-- do chính client tự làm (vd CARS, SDQ25 bản quan sát do chuyên gia nhập điểm).
alter table assessment_results
  add column if not exists administered_by uuid references users(id),
  add column if not exists booking_id uuid references expert_bookings(id);
