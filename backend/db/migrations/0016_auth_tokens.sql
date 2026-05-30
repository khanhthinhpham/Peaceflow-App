-- Allow Google OAuth users (no password)
alter table users alter column password_hash drop not null;

-- Email verification tokens
create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token varchar(128) unique not null,
  expires_at timestamptz not null default now() + interval '24 hours',
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Password reset tokens
create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token varchar(128) unique not null,
  expires_at timestamptz not null default now() + interval '1 hour',
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verification_tokens_token on email_verification_tokens(token);
create index if not exists idx_password_reset_tokens_token on password_reset_tokens(token);
