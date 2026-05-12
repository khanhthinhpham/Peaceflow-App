create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  occupation varchar(255),
  relationship_status varchar(100),
  sleep_target_hours numeric(4,2),
  preferred_task_duration int,
  stress_triggers jsonb not null default '[]'::jsonb,
  support_preferences jsonb not null default '{}'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  onboarding_answers jsonb not null default '{}'::jsonb,
  baseline_stress_score numeric(6,2),
  baseline_anxiety_score numeric(6,2),
  baseline_mood_score numeric(6,2),
  personalization_weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
