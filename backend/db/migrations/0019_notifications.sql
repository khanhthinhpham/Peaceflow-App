create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  actor_name varchar(255),
  type varchar(50) not null,
  post_id uuid,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index on notifications(recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "allow anon read notifications"
  on notifications for select using (true);

alter publication supabase_realtime add table notifications;
