create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) unique not null,
  title varchar(255) not null,
  category varchar(100) not null,
  difficulty varchar(50) not null,
  duration_minutes int not null check (duration_minutes > 0),
  xp_reward int not null default 0,
  description text,
  steps jsonb not null default '[]'::jsonb,
  safety_notes jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  triggers_supported jsonb not null default '[]'::jsonb,
  contraindications jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_task_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  assigned_reason text,
  recommendation_score numeric(8,2),
  priority_level priority_level not null default 'medium',
  status task_status not null default 'assigned',
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz
);

create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  assignment_id uuid references user_task_assignments(id) on delete set null,
  completion_notes text,
  self_rating_before int check (self_rating_before between 0 and 10),
  self_rating_after int check (self_rating_after between 0 and 10),
  duration_actual int,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);
