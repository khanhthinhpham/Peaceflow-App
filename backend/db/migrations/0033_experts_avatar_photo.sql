-- Cho phép chuyên gia có ảnh đại diện THẬT (bên cạnh avatar_emoji hiện có, dùng làm
-- fallback khi chưa có ảnh). Lưu trực tiếp trong DB (bytea), theo đúng cách đã lưu file
-- bằng cấp (0022_expert_applications.sql) và ảnh đính kèm kết quả test
-- (0032_assessment_results_attachment.sql).
alter table experts
  add column if not exists avatar_photo bytea,
  add column if not exists avatar_photo_mime varchar(100);
