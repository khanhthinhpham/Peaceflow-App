-- Expert session management, availability & reviews

-- 1) Cho phép trạng thái 'pending' (chờ chuyên gia xác nhận) cho booking
alter table expert_bookings drop constraint if exists expert_bookings_status_check;
alter table expert_bookings add constraint expert_bookings_status_check
  check (status in ('pending', 'confirmed', 'completed', 'cancelled'));

-- 2) Khung giờ rảnh hằng tuần của chuyên gia (client chọn để đặt lịch)
create table if not exists expert_availability (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references experts(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists idx_expert_availability_expert on expert_availability(expert_id, weekday);

-- 3) Đánh giá sau buổi tư vấn
create table if not exists expert_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references expert_bookings(id) on delete cascade,
  expert_id uuid not null references experts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_expert_reviews_expert on expert_reviews(expert_id);
