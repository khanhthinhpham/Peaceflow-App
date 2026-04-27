-- Chỉ dùng cho local/dev
-- Thay YOUR_USER_UUID bằng UUID thật từ auth.users.id

insert into public.user_profiles (
  user_id,
  occupation,
  sleep_target_hours,
  preferred_task_duration,
  stress_triggers,
  support_preferences,
  goals,
  onboarding_answers,
  baseline_stress_score,
  baseline_anxiety_score,
  baseline_mood_score
)
values (
  'YOUR_USER_UUID',
  'Viễn thông',
  7.5,
  5,
  '["workload","sleep_loss","sensory_overload"]'::jsonb,
  '{"tone":"gentle","prefer_micro_tasks":true}'::jsonb,
  '["reduce_stress","improve_sleep","increase_resilience"]'::jsonb,
  '{"main_concern":"stress","energy_pattern":"low_evening"}'::jsonb,
  55,
  48,
  62
)
on conflict (user_id) do update
set
  occupation = excluded.occupation,
  sleep_target_hours = excluded.sleep_target_hours,
  preferred_task_duration = excluded.preferred_task_duration,
  stress_triggers = excluded.stress_triggers,
  support_preferences = excluded.support_preferences,
  goals = excluded.goals,
  onboarding_answers = excluded.onboarding_answers,
  baseline_stress_score = excluded.baseline_stress_score,
  baseline_anxiety_score = excluded.baseline_anxiety_score,
  baseline_mood_score = excluded.baseline_mood_score;
