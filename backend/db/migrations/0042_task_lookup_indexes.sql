create index if not exists idx_task_completions_user_task on task_completions(user_id, task_id);
create index if not exists idx_user_task_assignments_user_task on user_task_assignments(user_id, task_id);
