create table if not exists user_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  mood varchar(50),
  tags jsonb default '[]'::jsonb,
  is_private boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journals_user_id on user_journals(user_id);
