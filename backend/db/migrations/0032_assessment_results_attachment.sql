-- Cho phép đính kèm 1 ảnh vào kết quả test (vd ảnh phiếu trả lời giấy của bài Raven)
-- để chuyên gia xem lại khi chấm điểm thủ công. Lưu trực tiếp trong DB (bytea), theo
-- đúng cách backend/db/migrations/0022_expert_applications.sql đã lưu file bằng cấp.
alter table assessment_results
  add column if not exists attachment_file bytea,
  add column if not exists attachment_filename varchar(255),
  add column if not exists attachment_mime varchar(100);
