create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) unique not null,
  name varchar(255) not null,
  version varchar(50),
  description text,
  question_schema jsonb not null default '[]'::jsonb,
  scoring_rules jsonb not null default '{}'::jsonb,
  interpretation_rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  raw_answers jsonb not null default '{}'::jsonb,
  total_score numeric(8,2) not null,
  severity varchar(50),
  dimension_scores jsonb not null default '{}'::jsonb,
  interpreted_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
