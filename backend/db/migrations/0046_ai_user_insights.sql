-- Lời khuyên AI theo yêu cầu của người dùng (bấm nút mới chạy, không tự động chạy nữa).
--
-- signature = dấu vân tay của dữ liệu người dùng tại thời điểm sinh ra lời khuyên. Khi
-- người dùng bấm nút, so signature hiện tại với signature đã lưu:
--   - Giống nhau  => dữ liệu chưa thay đổi đáng kể, TRẢ LẠI ĐÚNG lời khuyên cũ, không gọi AI.
--   - Khác nhau   => dữ liệu đã đổi, gọi AI sinh lời khuyên mới rồi ghi đè.
-- Signature được làm "thô" có chủ ý (làm tròn điểm, chia nhóm streak...) trong
-- buildInsightSignature() ở ai.service.js — để những dao động nhỏ (streak +1, điểm lệch
-- 0.1) không bị coi là thay đổi đáng kể và tốn token vô ích.
create table if not exists ai_user_insights (
  user_id uuid primary key references users(id) on delete cascade,
  signature varchar(64) not null,
  summary text not null,
  tasks jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
