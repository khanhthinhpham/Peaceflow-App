create index if not exists idx_users_email
  on public.users(email);

create index if not exists idx_mood_checkins_user_created
  on public.mood_checkins(user_id, created_at desc);

create index if not exists idx_assessment_results_user_created
  on public.assessment_results(user_id, created_at desc);

create index if not exists idx_user_task_assignments_user_status
  on public.user_task_assignments(user_id, status);

create index if not exists idx_task_completions_user_created
  on public.task_completions(user_id, created_at desc);

create index if not exists idx_journal_entries_user_created
  on public.journal_entries(user_id, created_at desc);

create index if not exists idx_risk_snapshots_user_created
  on public.risk_snapshots(user_id, calculated_at desc);

create index if not exists idx_emergency_logs_user_created
  on public.emergency_logs(user_id, created_at desc);

create index if not exists idx_audit_logs_user_created
  on public.audit_logs(user_id, created_at desc);

-- GIN indexes cho JSONB truy vấn nhiều
create index if not exists idx_mood_checkins_triggers_gin
  on public.mood_checkins using gin (triggers);

create index if not exists idx_journal_entries_tags_gin
  on public.journal_entries using gin (tags);

create index if not exists idx_tasks_tags_gin
  on public.tasks using gin (tags);

create index if not exists idx_tasks_triggers_supported_gin
  on public.tasks using gin (triggers_supported);

create index if not exists idx_user_profiles_stress_triggers_gin
  on public.user_profiles using gin (stress_triggers);

create index if not exists idx_user_profiles_goals_gin
  on public.user_profiles using gin (goals);
