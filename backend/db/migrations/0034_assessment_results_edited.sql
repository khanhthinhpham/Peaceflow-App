-- Cho phép chuyên gia sửa lại kết quả đã nộp (đánh nhầm câu trả lời, sai điểm...).
-- Lưu lại người sửa + thời điểm sửa để có dấu vết chỉnh sửa trên hồ sơ.
alter table assessment_results
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid references users(id);
