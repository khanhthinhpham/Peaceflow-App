alter table notifications add column if not exists group_key varchar(255);
create index if not exists idx_notifications_group_key on notifications(group_key) where is_read = false;
