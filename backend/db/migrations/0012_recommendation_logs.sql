create table if not exists recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  snapshot_id uuid references risk_snapshots(id) on delete set null,
  recommended_tasks jsonb not null, -- Array of task IDs and scores
  context jsonb not null default '{}'::jsonb, -- latest mood, etc.
  created_at timestamptz not null default now()
);
