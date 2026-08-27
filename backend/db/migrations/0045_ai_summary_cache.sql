-- Cache KẾT QUẢ nhận xét AI cho bài test tự đánh giá.
--
-- Lý do: đầu vào của tính năng này chỉ gồm (tên bài test, tổng điểm, mức độ, điểm từng
-- khía cạnh) — KHÔNG chứa gì riêng tư của người dùng. Nên 2 người cùng làm 1 bài test và
-- ra cùng điểm thì đầu vào y hệt nhau, hoàn toàn dùng lại được kết quả AI cũ, tốn 0 token.
-- Đo trên dữ liệu thật: 871 lượt nộp bài nhưng chỉ 302 tổ hợp khác nhau => ~65% lượt gọi
-- có thể dùng lại. Đây là cách tiết kiệm hiệu quả hơn context caching của Gemini (model
-- flash-lite không hỗ trợ cache, và prompt hiện tại ~3.000 token cũng dưới ngưỡng 4.096).
--
-- cache_key = sha256 của (phiên bản prompt + tên bài test + điểm + mức độ + điểm khía cạnh).
-- Đổi PROMPT_VERSION trong ai.service.js sẽ tự động vô hiệu toàn bộ cache cũ (vì lời văn
-- AI sinh ra theo prompt mới sẽ khác) — không cần xoá bảng thủ công.
create table if not exists ai_summary_cache (
  cache_key varchar(64) primary key,
  feature varchar(40) not null default 'assessment_summary',
  summary text not null,
  tasks jsonb not null default '[]'::jsonb,
  hit_count int not null default 0,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists idx_ai_summary_cache_last_used on ai_summary_cache(last_used_at desc);

-- Đánh dấu lượt gọi được phục vụ từ cache (0 token) để admin thấy được mức tiết kiệm.
alter table ai_usage_logs add column if not exists from_cache boolean not null default false;
