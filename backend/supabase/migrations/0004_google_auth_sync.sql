create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    email_verified,
    consent_privacy,
    consent_terms,
    consent_sensitive_data
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Người dùng mới'
    ),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.email_confirmed_at is not null, false),
    coalesce((new.raw_user_meta_data->>'consent_privacy')::boolean, false),
    coalesce((new.raw_user_meta_data->>'consent_terms')::boolean, false),
    coalesce((new.raw_user_meta_data->>'consent_sensitive_data')::boolean, false)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    email_verified = excluded.email_verified,
    updated_at = now();

  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
