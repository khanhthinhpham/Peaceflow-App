-- =========================================================
-- 0015_performance_indexes.sql
-- PeaceFlow - performance indexes for reporting, badges,
-- refresh tokens, crisis signals, recommendation logs
-- =========================================================

-- =========================================================
-- REFRESH TOKENS
-- =========================================================
create index if not exists idx_refresh_tokens_user_id
  on public.refresh_tokens(user_id);

create index if not exists idx_refresh_tokens_expires_at
  on public.refresh_tokens(expires_at);

create index if not exists idx_refresh_tokens_user_expires_at
  on public.refresh_tokens(user_id, expires_at);

-- Useful if you query only active tokens often
create index if not exists idx_refresh_tokens_user_active
  on public.refresh_tokens(user_id, created_at desc)
  where revoked_at is null;

-- =========================================================
-- ASSESSMENT RESULTS
-- =========================================================
create index if not exists idx_assessment_results_user_assessment_created
  on public.assessment_results(user_id, assessment_id, created_at desc);

create index if not exists idx_assessment_results_assessment_created
  on public.assessment_results(assessment_id, created_at desc);

create index if not exists idx_assessment_results_severity
  on public.assessment_results(severity);

-- =========================================================
-- USER BADGES
-- =========================================================
create index if not exists idx_user_badges_user_earned
  on public.user_badges(user_id, earned_at desc);

create index if not exists idx_user_badges_badge_id
  on public.user_badges(badge_id);

-- =========================================================
-- JOURNAL ENTRIES
-- =========================================================
create index if not exists idx_journal_entries_user_not_deleted_created
  on public.journal_entries(user_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_journal_entries_crisis_flags_gin
  on public.journal_entries using gin (crisis_flags);

-- =========================================================
-- USER PROGRESS
-- =========================================================
create index if not exists idx_user_progress_total_xp
  on public.user_progress(total_xp desc);

create index if not exists idx_user_progress_current_level
  on public.user_progress(current_level);

-- =========================================================
-- TASKS / COMPLETIONS / ASSIGNMENTS
-- =========================================================
create index if not exists idx_tasks_active_difficulty
  on public.tasks(active, difficulty);

create index if not exists idx_tasks_active_category
  on public.tasks(active, category);

create index if not exists idx_task_completions_user_task_created
  on public.task_completions(user_id, task_id, created_at desc);

create index if not exists idx_task_completions_assignment_id
  on public.task_completions(assignment_id);

create index if not exists idx_user_task_assignments_user_due_status
  on public.user_task_assignments(user_id, due_at, status);

create index if not exists idx_user_task_assignments_user_completed_at
  on public.user_task_assignments(user_id, completed_at desc);

-- =========================================================
-- MOOD CHECKINS / REPORTING
-- =========================================================
create index if not exists idx_mood_checkins_user_date
  on public.mood_checkins(user_id, created_at);

create index if not exists idx_mood_checkins_user_dominant_emotion
  on public.mood_checkins(user_id, dominant_emotion);

-- =========================================================
-- RISK SNAPSHOTS
-- =========================================================
create index if not exists idx_risk_snapshots_user_crisis_level
  on public.risk_snapshots(user_id, crisis_risk_level, calculated_at desc);

create index if not exists idx_risk_snapshots_crisis_level
  on public.risk_snapshots(crisis_risk_level);

-- =========================================================
-- EMERGENCY LOGS
-- =========================================================
create index if not exists idx_emergency_logs_event_type_created
  on public.emergency_logs(event_type, created_at desc);

-- =========================================================
-- AUDIT LOGS
-- =========================================================
create index if not exists idx_audit_logs_action_created
  on public.audit_logs(action, created_at desc);

create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id);

-- =========================================================
-- CRISIS SIGNALS
-- =========================================================
create index if not exists idx_crisis_signals_user_created
  on public.crisis_signals(user_id, created_at desc);

create index if not exists idx_crisis_signals_user_severity_created
  on public.crisis_signals(user_id, severity, created_at desc);

create index if not exists idx_crisis_signals_acknowledged
  on public.crisis_signals(acknowledged, created_at desc);

create index if not exists idx_crisis_signals_detected_keywords_gin
  on public.crisis_signals using gin (detected_keywords);

create index if not exists idx_crisis_signals_metadata_gin
  on public.crisis_signals using gin (metadata);

-- =========================================================
-- RECOMMENDATION LOGS
-- =========================================================
create index if not exists idx_recommendation_logs_user_created
  on public.recommendation_logs(user_id, created_at desc);

create index if not exists idx_recommendation_logs_source_event_created
  on public.recommendation_logs(source_event, created_at desc);

create index if not exists idx_recommendation_logs_context_snapshot_gin
  on public.recommendation_logs using gin (context_snapshot);

create index if not exists idx_recommendation_logs_recommendations_gin
  on public.recommendation_logs using gin (recommendations);

-- =========================================================
-- OPTIONAL REPORT-SPECIFIC HELPERS
-- =========================================================
create index if not exists idx_badges_code
  on public.badges(code);

create index if not exists idx_tasks_code
  on public.tasks(code);

create index if not exists idx_assessments_code_active
  on public.assessments(code, active);
