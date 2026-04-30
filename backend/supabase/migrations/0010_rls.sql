-- =========================================================
-- 0010_rls.sql
-- Row Level Security policies for PeaceFlow on Supabase
-- =========================================================

-- =========================================================
-- ENABLE RLS
-- =========================================================
alter table public.users enable row level security;
alter table public.refresh_tokens enable row level security;
alter table public.user_profiles enable row level security;
alter table public.mood_checkins enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_results enable row level security;
alter table public.tasks enable row level security;
alter table public.user_task_assignments enable row level security;
alter table public.task_completions enable row level security;
alter table public.user_progress enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.journal_entries enable row level security;
alter table public.risk_snapshots enable row level security;
alter table public.emergency_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.recommendation_logs enable row level security;

-- =========================================================
-- CLEAN OLD POLICIES
-- =========================================================

-- users
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;

-- refresh_tokens
drop policy if exists "refresh_tokens_select_own" on public.refresh_tokens;
drop policy if exists "refresh_tokens_insert_own" on public.refresh_tokens;
drop policy if exists "refresh_tokens_update_own" on public.refresh_tokens;
drop policy if exists "refresh_tokens_delete_own" on public.refresh_tokens;

-- user_profiles
drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;

-- mood_checkins
drop policy if exists "mood_checkins_select_own" on public.mood_checkins;
drop policy if exists "mood_checkins_insert_own" on public.mood_checkins;
drop policy if exists "mood_checkins_update_own" on public.mood_checkins;
drop policy if exists "mood_checkins_delete_own" on public.mood_checkins;

-- assessments
drop policy if exists "assessments_select_authenticated" on public.assessments;

-- assessment_results
drop policy if exists "assessment_results_select_own" on public.assessment_results;
drop policy if exists "assessment_results_insert_own" on public.assessment_results;
drop policy if exists "assessment_results_update_own" on public.assessment_results;
drop policy if exists "assessment_results_delete_own" on public.assessment_results;

-- tasks
drop policy if exists "tasks_select_authenticated" on public.tasks;

-- user_task_assignments
drop policy if exists "user_task_assignments_select_own" on public.user_task_assignments;
drop policy if exists "user_task_assignments_insert_own" on public.user_task_assignments;
drop policy if exists "user_task_assignments_update_own" on public.user_task_assignments;
drop policy if exists "user_task_assignments_delete_own" on public.user_task_assignments;

-- task_completions
drop policy if exists "task_completions_select_own" on public.task_completions;
drop policy if exists "task_completions_insert_own" on public.task_completions;
drop policy if exists "task_completions_update_own" on public.task_completions;
drop policy if exists "task_completions_delete_own" on public.task_completions;

-- user_progress
drop policy if exists "user_progress_select_own" on public.user_progress;
drop policy if exists "user_progress_insert_own" on public.user_progress;
drop policy if exists "user_progress_update_own" on public.user_progress;

-- badges
drop policy if exists "badges_select_authenticated" on public.badges;

-- user_badges
drop policy if exists "user_badges_select_own" on public.user_badges;
drop policy if exists "user_badges_insert_own" on public.user_badges;

-- journal_entries
drop policy if exists "journal_entries_select_own" on public.journal_entries;
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
drop policy if exists "journal_entries_update_own" on public.journal_entries;
drop policy if exists "journal_entries_delete_own" on public.journal_entries;

-- risk_snapshots
drop policy if exists "risk_snapshots_select_own" on public.risk_snapshots;
drop policy if exists "risk_snapshots_insert_own" on public.risk_snapshots;

-- emergency_logs
drop policy if exists "emergency_logs_select_own" on public.emergency_logs;
drop policy if exists "emergency_logs_insert_own" on public.emergency_logs;

-- audit_logs
drop policy if exists "audit_logs_select_own" on public.audit_logs;
drop policy if exists "audit_logs_insert_own" on public.audit_logs;

-- recommendation_logs
drop policy if exists "recommendation_logs_select_own" on public.recommendation_logs;
drop policy if exists "recommendation_logs_insert_own" on public.recommendation_logs;

-- =========================================================
-- USERS
-- =========================================================
create policy "users_select_own"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "users_update_own"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Không cho user tự insert/delete public.users trực tiếp.
-- Record được tạo qua trigger từ auth.users.

-- =========================================================
-- REFRESH TOKENS
-- =========================================================
create policy "refresh_tokens_select_own"
on public.refresh_tokens
for select
to authenticated
using (auth.uid() = user_id);

create policy "refresh_tokens_insert_own"
on public.refresh_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "refresh_tokens_update_own"
on public.refresh_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "refresh_tokens_delete_own"
on public.refresh_tokens
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- USER PROFILES
-- =========================================================
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================
-- MOOD CHECKINS
-- =========================================================
create policy "mood_checkins_select_own"
on public.mood_checkins
for select
to authenticated
using (auth.uid() = user_id);

create policy "mood_checkins_insert_own"
on public.mood_checkins
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "mood_checkins_update_own"
on public.mood_checkins
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "mood_checkins_delete_own"
on public.mood_checkins
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- ASSESSMENTS (catalog/system data)
-- =========================================================
create policy "assessments_select_authenticated"
on public.assessments
for select
to authenticated
using (active = true);

-- Không cho user thường insert/update/delete assessments.

-- =========================================================
-- ASSESSMENT RESULTS
-- =========================================================
create policy "assessment_results_select_own"
on public.assessment_results
for select
to authenticated
using (auth.uid() = user_id);

create policy "assessment_results_insert_own"
on public.assessment_results
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "assessment_results_update_own"
on public.assessment_results
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "assessment_results_delete_own"
on public.assessment_results
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- TASKS (catalog/system data)
-- =========================================================
create policy "tasks_select_authenticated"
on public.tasks
for select
to authenticated
using (active = true);

-- Không cho user thường insert/update/delete tasks.

-- =========================================================
-- USER TASK ASSIGNMENTS
-- =========================================================
create policy "user_task_assignments_select_own"
on public.user_task_assignments
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_task_assignments_insert_own"
on public.user_task_assignments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_task_assignments_update_own"
on public.user_task_assignments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_task_assignments_delete_own"
on public.user_task_assignments
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- TASK COMPLETIONS
-- =========================================================
create policy "task_completions_select_own"
on public.task_completions
for select
to authenticated
using (auth.uid() = user_id);

create policy "task_completions_insert_own"
on public.task_completions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "task_completions_update_own"
on public.task_completions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "task_completions_delete_own"
on public.task_completions
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- USER PROGRESS
-- =========================================================
create policy "user_progress_select_own"
on public.user_progress
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_progress_insert_own"
on public.user_progress
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_progress_update_own"
on public.user_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================
-- BADGES (catalog/system data)
-- =========================================================
create policy "badges_select_authenticated"
on public.badges
for select
to authenticated
using (true);

-- Không cho user thường insert/update/delete badges.

-- =========================================================
-- USER BADGES
-- =========================================================
create policy "user_badges_select_own"
on public.user_badges
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_badges_insert_own"
on public.user_badges
for insert
to authenticated
with check (auth.uid() = user_id);

-- Thường không cho user update/delete badge trực tiếp.

-- =========================================================
-- JOURNAL ENTRIES
-- =========================================================
create policy "journal_entries_select_own"
on public.journal_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "journal_entries_insert_own"
on public.journal_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "journal_entries_update_own"
on public.journal_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "journal_entries_delete_own"
on public.journal_entries
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- RISK SNAPSHOTS
-- =========================================================
create policy "risk_snapshots_select_own"
on public.risk_snapshots
for select
to authenticated
using (auth.uid() = user_id);

create policy "risk_snapshots_insert_own"
on public.risk_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

-- Không mở update/delete cho user thường để tránh sửa lịch sử tính toán risk.

-- =========================================================
-- EMERGENCY LOGS
-- =========================================================
create policy "emergency_logs_select_own"
on public.emergency_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "emergency_logs_insert_own"
on public.emergency_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Không mở update/delete cho user thường.

-- =========================================================
-- AUDIT LOGS
-- =========================================================
create policy "audit_logs_select_own"
on public.audit_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "audit_logs_insert_own"
on public.audit_logs
for insert
to authenticated
with check (
  user_id is null
  or auth.uid() = user_id
);

-- Không mở update/delete audit logs.

-- =========================================================
-- RECOMMENDATION LOGS
-- =========================================================
create policy "recommendation_logs_select_own"
on public.recommendation_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "recommendation_logs_insert_own"
on public.recommendation_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Không mở update/delete recommendation logs.

-- =========================================================
-- OPTIONAL: REVOKE ANON ACCESS SAFER DEFAULT
-- =========================================================
revoke all on public.users from anon;
revoke all on public.refresh_tokens from anon;
revoke all on public.user_profiles from anon;
revoke all on public.mood_checkins from anon;
revoke all on public.assessment_results from anon;
revoke all on public.user_task_assignments from anon;
revoke all on public.task_completions from anon;
revoke all on public.user_progress from anon;
revoke all on public.user_badges from anon;
revoke all on public.journal_entries from anon;
revoke all on public.risk_snapshots from anon;
revoke all on public.emergency_logs from anon;
revoke all on public.audit_logs from anon;
revoke all on public.recommendation_logs from anon;

-- catalog tables:
revoke all on public.assessments from anon;
revoke all on public.tasks from anon;
revoke all on public.badges from anon;
