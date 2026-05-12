create index if not exists idx_users_email on users(email);
create index if not exists idx_mood_checkins_user_created on mood_checkins(user_id, created_at desc);
create index if not exists idx_assessment_results_user_created on assessment_results(user_id, created_at desc);
create index if not exists idx_user_task_assignments_user_status on user_task_assignments(user_id, status);
create index if not exists idx_task_completions_user_created on task_completions(user_id, created_at desc);
create index if not exists idx_journal_entries_user_created on journal_entries(user_id, created_at desc);
create index if not exists idx_risk_snapshots_user_created on risk_snapshots(user_id, calculated_at desc);
create index if not exists idx_emergency_logs_user_created on emergency_logs(user_id, created_at desc);
create index if not exists idx_audit_logs_user_created on audit_logs(user_id, created_at desc);
