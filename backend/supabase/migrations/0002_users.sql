create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) unique not null,
  phone varchar(30),
  full_name varchar(255) not null,
  display_name varchar(255),
  avatar_url text,
  date_of_birth date,
  gender gender_type default 'prefer_not_to_say',
  city varchar(100),
  country varchar(100) default 'Vietnam',
  status user_status not null default 'active',
  role varchar(50) not null default 'user',
  email_verified boolean not null default false,
  consent_privacy boolean not null default false,
  consent_terms boolean not null default false,
  consent_sensitive_data boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  device_info jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
