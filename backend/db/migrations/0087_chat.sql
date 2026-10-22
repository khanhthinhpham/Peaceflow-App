-- Chat 2 chiều giữa chuyên gia và thân chủ ĐÃ CÓ booking hợp lệ (confirmed/completed) với
-- nhau — xem giải thích đầy đủ trong plan "Tính năng Chat Expert ↔ Client". Realtime dùng lại
-- đúng cơ chế Supabase Realtime đang chạy cho bảng notifications (xem 0019_notifications.sql),
-- không dựng WebSocket server riêng vì backend chạy trên Vercel serverless (không giữ được
-- kết nối lâu dài).
create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references experts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  unique (expert_id, user_id)
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  sender_user_id uuid not null references users(id),
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_chat_messages_conversation on chat_messages(conversation_id, created_at);
create index if not exists idx_chat_conversations_user on chat_conversations(user_id, last_message_at desc);
create index if not exists idx_chat_conversations_expert on chat_conversations(expert_id, last_message_at desc);

alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;

-- Khớp policy đang có cho notifications ("allow anon read ... using (true)") — backend kết
-- nối bằng quyền owner nên RLS không áp dụng cho nó; policy này chỉ phục vụ kênh Supabase
-- Realtime (đọc qua anon key, lọc theo conversation_id ở phía client), không phải đường đọc
-- dữ liệu thật (đã có requireAuth ở backend).
create policy "allow anon read chat_messages" on chat_messages for select using (true);

alter publication supabase_realtime add table chat_messages;
