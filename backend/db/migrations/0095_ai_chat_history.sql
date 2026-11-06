-- Lưu lịch sử trò chuyện với trợ lý AI PeaceCat để khách xem lại (mọi thiết bị).
-- Nội dung là Dữ liệu sức khỏe → MÃ HOÁ AES-256-GCM ở backend (crypto.service.js) trước khi ghi,
-- và CHỈ lưu khi khách đã bật "Đồng ý xử lý Dữ liệu sức khỏe" (users.consent_sensitive_data, Điều 7.1).
-- Khách xoá được từng cuộc hoặc toàn bộ; xoá tài khoản thì xoá theo (on delete cascade).
create table if not exists ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title bytea,                       -- mã hoá: câu đầu tiên của khách (rút gọn)
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_chat_sessions_user on ai_chat_sessions(user_id, updated_at desc);

create table if not exists ai_chat_messages (
  id bigserial primary key,
  session_id uuid not null references ai_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'bot')),
  content bytea not null,            -- mã hoá
  meta jsonb,                        -- gợi ý bài tập / chuyên gia kèm câu trả lời (không chứa nội dung chat)
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_chat_messages_session on ai_chat_messages(session_id, id);

alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;
