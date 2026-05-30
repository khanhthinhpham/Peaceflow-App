alter table community_posts add column if not exists reports_count int not null default 0;
alter table community_posts add column if not exists is_hidden boolean not null default false;

create table if not exists community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reason varchar(100) not null default 'inappropriate',
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists idx_community_reports_post on community_reports(post_id);
