alter table public.journal_entries
  add column if not exists crisis_flags jsonb not null default '[]'::jsonb;

alter table public.journal_entries
  add column if not exists deleted_at timestamptz;

alter table public.journal_entries
  add column if not exists source varchar(50) default 'manual';

create index if not exists idx_journal_entries_user_created
  on public.journal_entries(user_id, created_at desc);

create index if not exists idx_journal_entries_tags_gin
  on public.journal_entries using gin (tags);

create index if not exists idx_journal_entries_crisis_flags_gin
  on public.journal_entries using gin (crisis_flags);
