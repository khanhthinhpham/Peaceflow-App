create table if not exists experts (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) unique not null,
  full_name varchar(255) not null,
  degree text not null,
  avatar_emoji varchar(16) not null default '👩‍⚕️',
  status varchar(20) not null default 'offline' check (status in ('online', 'busy', 'offline')),
  rating numeric(3,2) not null default 0,
  sessions_count int not null default 0,
  satisfaction_rate numeric(5,2) not null default 0,
  base_price int not null default 0,
  location varchar(255),
  experience_years int not null default 0,
  specialties jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  bio text,
  credentials jsonb not null default '[]'::jsonb,
  approaches jsonb not null default '[]'::jsonb,
  next_slot_label varchar(255),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expert_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  expert_id uuid not null references experts(id) on delete cascade,
  session_type varchar(20) not null check (session_type in ('chat', 'voice', 'video', 'inperson')),
  starts_at timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  price int not null default 0,
  notes text,
  status varchar(20) not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experts_active_status on experts(active, status);
create index if not exists idx_expert_bookings_user_start on expert_bookings(user_id, starts_at);
create index if not exists idx_expert_bookings_expert_start on expert_bookings(expert_id, starts_at);
