create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title varchar(255),
  content text not null,
  mood_before int check (mood_before between 0 and 10),
  mood_after int check (mood_after between 0 and 10),
  sentiment_score numeric(6,2),
  tags jsonb not null default '[]'::jsonb,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  current_stress_index numeric(6,2) not null default 0,
  current_anxiety_index numeric(6,2) not null default 0,
  sleep_risk_index numeric(6,2) not null default 0,
  burnout_risk_index numeric(6,2) not null default 0,
  crisis_risk_level crisis_level not null default 'low',
  recommendation_profile jsonb not null default '{}'::jsonb,
  explanation jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now()
);

create table if not exists emergency_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  event_type emergency_event_type not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action varchar(100) not null,
  entity_type varchar(100),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
