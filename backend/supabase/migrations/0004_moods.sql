create table if not exists mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  mood_score int not null check (mood_score between 0 and 10),
  anxiety_score int check (anxiety_score between 0 and 10),
  stress_score int check (stress_score between 0 and 10),
  energy_score int check (energy_score between 0 and 10),
  sleep_quality_score int check (sleep_quality_score between 0 and 10),
  dominant_emotion varchar(100),
  triggers jsonb not null default '[]'::jsonb,
  notes text,
  source varchar(50) default 'manual',
  created_at timestamptz not null default now()
);
