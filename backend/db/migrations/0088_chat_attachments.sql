-- Đính kèm ảnh/voice/file trong chat — bytes tách riêng bảng chat_attachments (KHÔNG nằm
-- trong publication supabase_realtime) để tránh broadcast dữ liệu nhị phân nặng qua WebSocket
-- mỗi lần gửi tin có file; chat_messages chỉ giữ FK + metadata nhẹ (mime/filename), đủ để
-- realtime payload gọn và client biết cách render mà không cần tải bytes ngay.
create table if not exists chat_attachments (
  id uuid primary key default gen_random_uuid(),
  data bytea not null,
  created_at timestamptz not null default now()
);

alter table chat_messages
  add column if not exists attachment_id uuid references chat_attachments(id) on delete set null,
  add column if not exists attachment_mime varchar(100),
  add column if not exists attachment_filename varchar(255);

alter table chat_messages alter column content set default '';

alter table chat_attachments enable row level security;
