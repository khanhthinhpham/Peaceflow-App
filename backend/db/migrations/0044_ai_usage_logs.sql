-- Log sử dụng AI (Gemini) để admin theo dõi lượng dùng, chi phí, chủ đề và lỗi.
--
-- QUYỀN RIÊNG TƯ: KHÔNG lưu nội dung tin nhắn của người dùng. Đây là app sức khỏe tâm
-- thần, người dùng tâm sự chuyện rất riêng tư — admin chỉ cần biết ai dùng bao nhiêu,
-- về chủ đề gì, có lỗi không. Vì vậy chỉ lưu siêu dữ liệu + từ khóa chủ đề do chính AI
-- rút ra (mood_analysis.keywords), tuyệt đối không lưu câu người dùng gõ hay câu AI trả.
create table if not exists ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  feature varchar(40) not null
    check (feature in ('chat', 'assessment_summary', 'daily_message')),
  model varchar(60),
  prompt_tokens int not null default 0,
  output_tokens int not null default 0,
  cached_tokens int not null default 0,
  latency_ms int,
  success boolean not null default true,
  error_message text,
  topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_logs_created on ai_usage_logs(created_at desc);
create index if not exists idx_ai_usage_logs_user on ai_usage_logs(user_id, created_at desc);
create index if not exists idx_ai_usage_logs_feature on ai_usage_logs(feature, created_at desc);
create index if not exists idx_ai_usage_logs_success on ai_usage_logs(success, created_at desc);
