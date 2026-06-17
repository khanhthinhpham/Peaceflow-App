-- Expert (chuyên gia) registration & admin approval

-- 1) Cho phép trạng thái 'pending' cho tài khoản chuyên gia đang chờ duyệt
alter type user_status add value if not exists 'pending';

-- 2) Vai trò người dùng
alter table users add column if not exists role varchar(20) not null default 'user';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table users add constraint users_role_check
      check (role in ('user', 'expert', 'admin'));
  end if;
end $$;

-- 3) Liên kết chuyên gia với tài khoản đăng nhập
alter table experts add column if not exists user_id uuid references users(id) on delete set null;
alter table experts add column if not exists phone varchar(30);
create unique index if not exists idx_experts_user_id on experts(user_id) where user_id is not null;

-- 4) Hồ sơ đăng ký chuyên gia chờ duyệt
create table if not exists expert_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name varchar(255) not null,
  phone varchar(30) not null,
  degree text not null,
  specialties jsonb not null default '[]'::jsonb,
  experience_years int not null default 0,
  location varchar(255),
  bio text,
  credential_file bytea not null,
  credential_filename varchar(255) not null,
  credential_mime varchar(100) not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approval_token varchar(128) not null unique,
  reviewed_at timestamptz,
  expert_id uuid references experts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_expert_applications_status on expert_applications(status);
create index if not exists idx_expert_applications_user on expert_applications(user_id);
