-- Cho phep 1 thu thach chi tinh dung nhung NHIEM VU CU THE admin chon (metric_type =
-- 'specific_tasks'), thay vi chi chon duoc 1 trong 3 loai co dinh truoc day.
alter table community_weekly_challenges add column if not exists task_ids uuid[];
