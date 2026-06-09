alter table community_comments
  add column if not exists parent_id uuid references community_comments(id) on delete cascade;
