alter table chat_messages
  add column if not exists reply_to_message_id uuid references chat_messages(id) on delete set null;

create index if not exists idx_chat_messages_reply_to on chat_messages(reply_to_message_id);
