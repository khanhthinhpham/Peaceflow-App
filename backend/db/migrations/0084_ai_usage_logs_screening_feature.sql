-- Thêm feature 'screening_summary' (nhận xét AI cho phiếu sàng lọc trường học) vào danh
-- sách hợp lệ của ai_usage_logs — check constraint cũ (migration 0044) chỉ cho phép
-- 'chat', 'assessment_summary', 'daily_message'.
alter table ai_usage_logs drop constraint ai_usage_logs_feature_check;
alter table ai_usage_logs add constraint ai_usage_logs_feature_check
  check (feature in ('chat', 'assessment_summary', 'daily_message', 'screening_summary'));
