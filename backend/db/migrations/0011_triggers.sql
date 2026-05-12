-- triggers cập nhật updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on user_profiles;
create trigger trg_user_profiles_updated_at before update on user_profiles
for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at before update on tasks
for each row execute function set_updated_at();

drop trigger if exists trg_journal_entries_updated_at on journal_entries;
create trigger trg_journal_entries_updated_at before update on journal_entries
for each row execute function set_updated_at();

drop trigger if exists trg_user_progress_updated_at on user_progress;
create trigger trg_user_progress_updated_at before update on user_progress
for each row execute function set_updated_at();
