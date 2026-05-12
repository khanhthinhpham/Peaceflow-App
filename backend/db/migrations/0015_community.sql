create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  author_name varchar(255),
  author_avatar varchar(16) not null default '🌿',
  content text not null,
  category varchar(50) not null default 'story' check (category in ('gratitude', 'story', 'milestone', 'question', 'tip')),
  tags jsonb not null default '[]'::jsonb,
  is_anonymous boolean not null default true,
  is_positive boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  author_name varchar(255),
  author_avatar varchar(16) not null default '🌿',
  content text not null,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction_type varchar(20) not null check (reaction_type in ('heart', 'hug', 'strong', 'star')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);

create index if not exists idx_community_posts_created_at on community_posts(created_at desc);
create index if not exists idx_community_comments_post_created on community_comments(post_id, created_at asc);
create index if not exists idx_community_reactions_post on community_reactions(post_id);
