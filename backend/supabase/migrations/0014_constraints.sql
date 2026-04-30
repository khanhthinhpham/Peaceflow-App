-- =========================================================
-- 0014_constraints.sql
-- PeaceFlow - additional integrity constraints
-- Includes:
--   - missing CHECK constraints
--   - crisis_signals table
--   - recommendation_logs standardized table
-- =========================================================

-- =========================================================
-- USER PROFILES - DATA QUALITY CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_profiles_sleep_target_hours'
  ) then
    alter table public.user_profiles
      add constraint chk_user_profiles_sleep_target_hours
      check (
        sleep_target_hours is null
        or (sleep_target_hours >= 0 and sleep_target_hours <= 24)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_profiles_preferred_task_duration'
  ) then
    alter table public.user_profiles
      add constraint chk_user_profiles_preferred_task_duration
      check (
        preferred_task_duration is null
        or preferred_task_duration > 0
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_profiles_baseline_stress_score'
  ) then
    alter table public.user_profiles
      add constraint chk_user_profiles_baseline_stress_score
      check (
        baseline_stress_score is null
        or (baseline_stress_score >= 0 and baseline_stress_score <= 10)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_profiles_baseline_anxiety_score'
  ) then
    alter table public.user_profiles
      add constraint chk_user_profiles_baseline_anxiety_score
      check (
        baseline_anxiety_score is null
        or (baseline_anxiety_score >= 0 and baseline_anxiety_score <= 10)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_profiles_baseline_mood_score'
  ) then
    alter table public.user_profiles
      add constraint chk_user_profiles_baseline_mood_score
      check (
        baseline_mood_score is null
        or (baseline_mood_score >= 0 and baseline_mood_score <= 10)
      );
  end if;
end $$;

-- =========================================================
-- TASKS - DATA QUALITY CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_tasks_xp_reward_non_negative'
  ) then
    alter table public.tasks
      add constraint chk_tasks_xp_reward_non_negative
      check (xp_reward >= 0);
  end if;
end $$;

-- Optional normalization constraints for text fields
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_tasks_category_not_blank'
  ) then
    alter table public.tasks
      add constraint chk_tasks_category_not_blank
      check (length(trim(category)) > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_tasks_difficulty_not_blank'
  ) then
    alter table public.tasks
      add constraint chk_tasks_difficulty_not_blank
      check (length(trim(difficulty)) > 0);
  end if;
end $$;

-- =========================================================
-- USER TASK ASSIGNMENTS - CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_task_assignments_recommendation_score_non_negative'
  ) then
    alter table public.user_task_assignments
      add constraint chk_user_task_assignments_recommendation_score_non_negative
      check (
        recommendation_score is null
        or recommendation_score >= 0
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_task_assignments_due_after_assigned'
  ) then
    alter table public.user_task_assignments
      add constraint chk_user_task_assignments_due_after_assigned
      check (
        due_at is null
        or due_at >= assigned_at
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_task_assignments_completed_after_assigned'
  ) then
    alter table public.user_task_assignments
      add constraint chk_user_task_assignments_completed_after_assigned
      check (
        completed_at is null
        or completed_at >= assigned_at
      );
  end if;
end $$;

-- =========================================================
-- TASK COMPLETIONS - CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_task_completions_duration_actual_non_negative'
  ) then
    alter table public.task_completions
      add constraint chk_task_completions_duration_actual_non_negative
      check (
        duration_actual is null
        or duration_actual >= 0
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_task_completions_xp_earned_non_negative'
  ) then
    alter table public.task_completions
      add constraint chk_task_completions_xp_earned_non_negative
      check (xp_earned >= 0);
  end if;
end $$;

-- Optional: self_rating_after should not be wildly invalid (already 0..10 by column check)
-- No extra constraint needed here.

-- =========================================================
-- USER PROGRESS - CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_progress_total_xp_non_negative'
  ) then
    alter table public.user_progress
      add constraint chk_user_progress_total_xp_non_negative
      check (total_xp >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_progress_current_level_min'
  ) then
    alter table public.user_progress
      add constraint chk_user_progress_current_level_min
      check (current_level >= 1);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_progress_current_streak_non_negative'
  ) then
    alter table public.user_progress
      add constraint chk_user_progress_current_streak_non_negative
      check (current_streak >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_progress_longest_streak_non_negative'
  ) then
    alter table public.user_progress
      add constraint chk_user_progress_longest_streak_non_negative
      check (longest_streak >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_progress_badges_count_non_negative'
  ) then
    alter table public.user_progress
      add constraint chk_user_progress_badges_count_non_negative
      check (badges_count >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_user_progress_longest_streak_gte_current_streak'
  ) then
    alter table public.user_progress
      add constraint chk_user_progress_longest_streak_gte_current_streak
      check (longest_streak >= current_streak);
  end if;
end $$;

-- =========================================================
-- BADGES - LIGHT CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_badges_code_not_blank'
  ) then
    alter table public.badges
      add constraint chk_badges_code_not_blank
      check (length(trim(code)) > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_badges_name_not_blank'
  ) then
    alter table public.badges
      add constraint chk_badges_name_not_blank
      check (length(trim(name)) > 0);
  end if;
end $$;

-- =========================================================
-- JOURNAL ENTRIES - CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_journal_entries_content_not_blank'
  ) then
    alter table public.journal_entries
      add constraint chk_journal_entries_content_not_blank
      check (length(trim(content)) > 0);
  end if;
end $$;

-- =========================================================
-- ASSESSMENT RESULTS - CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_assessment_results_total_score_non_negative'
  ) then
    alter table public.assessment_results
      add constraint chk_assessment_results_total_score_non_negative
      check (total_score >= 0);
  end if;
end $$;

-- =========================================================
-- RISK SNAPSHOTS - CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_risk_snapshots_current_stress_index_range'
  ) then
    alter table public.risk_snapshots
      add constraint chk_risk_snapshots_current_stress_index_range
      check (current_stress_index >= 0 and current_stress_index <= 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_risk_snapshots_current_anxiety_index_range'
  ) then
    alter table public.risk_snapshots
      add constraint chk_risk_snapshots_current_anxiety_index_range
      check (current_anxiety_index >= 0 and current_anxiety_index <= 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_risk_snapshots_sleep_risk_index_range'
  ) then
    alter table public.risk_snapshots
      add constraint chk_risk_snapshots_sleep_risk_index_range
      check (sleep_risk_index >= 0 and sleep_risk_index <= 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_risk_snapshots_burnout_risk_index_range'
  ) then
    alter table public.risk_snapshots
      add constraint chk_risk_snapshots_burnout_risk_index_range
      check (burnout_risk_index >= 0 and burnout_risk_index <= 100);
  end if;
end $$;

-- =========================================================
-- CRISIS SIGNALS TABLE
-- =========================================================

create table if not exists public.crisis_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source varchar(50) not null,
  severity crisis_level not null default 'low',
  signal_text text,
  detected_keywords jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_crisis_signals_source_not_blank'
  ) then
    alter table public.crisis_signals
      add constraint chk_crisis_signals_source_not_blank
      check (length(trim(source)) > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_crisis_signals_acknowledged_at_consistency'
  ) then
    alter table public.crisis_signals
      add constraint chk_crisis_signals_acknowledged_at_consistency
      check (
        (acknowledged = false and acknowledged_at is null)
        or
        (acknowledged = true and acknowledged_at is not null)
      );
  end if;
end $$;

-- =========================================================
-- RECOMMENDATION LOGS STANDARDIZATION
-- If table already exists, patch missing columns.
-- If not, create standardized version.
-- =========================================================

create table if not exists public.recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_event varchar(50),
  context_snapshot jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  engine_version varchar(50),
  created_at timestamptz not null default now()
);

alter table public.recommendation_logs
  add column if not exists source_event varchar(50);

alter table public.recommendation_logs
  add column if not exists context_snapshot jsonb not null default '{}'::jsonb;

alter table public.recommendation_logs
  add column if not exists recommendations jsonb not null default '[]'::jsonb;

alter table public.recommendation_logs
  add column if not exists engine_version varchar(50);

alter table public.recommendation_logs
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recommendation_logs'
      and column_name = 'user_id'
  ) then
    null;
  else
    alter table public.recommendation_logs
      add column user_id uuid references public.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_recommendation_logs_source_event_not_blank'
  ) then
    alter table public.recommendation_logs
      add constraint chk_recommendation_logs_source_event_not_blank
      check (
        source_event is null
        or length(trim(source_event)) > 0
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_recommendation_logs_engine_version_not_blank'
  ) then
    alter table public.recommendation_logs
      add constraint chk_recommendation_logs_engine_version_not_blank
      check (
        engine_version is null
        or length(trim(engine_version)) > 0
      );
  end if;
end $$;
