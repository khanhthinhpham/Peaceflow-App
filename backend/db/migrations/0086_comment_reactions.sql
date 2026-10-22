-- Thả cảm xúc cho TỪNG bình luận/reply (trước đây chỉ bài viết gốc mới thả được cảm xúc qua
-- community_reactions) — cùng 4 loại cảm xúc, cùng cấu trúc unique(comment, user, loại) để
-- toggle giống hệt cách đang làm với community_reactions.
create table if not exists comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references community_comments(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction_type varchar(20) not null check (reaction_type in ('heart', 'hug', 'strong', 'star')),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id, reaction_type)
);

create index if not exists idx_comment_reactions_comment on comment_reactions(comment_id);

alter table comment_reactions enable row level security;
