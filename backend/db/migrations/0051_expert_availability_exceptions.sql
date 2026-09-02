-- Ngoại lệ bận theo NGÀY CỤ THỂ (nghỉ lễ, nghỉ phép, bận đột xuất) — cộng thêm vào lịch bận
-- lặp lại hàng tuần (expert_availability), không thay thế. Ví dụ: bình thường Chủ nhật rảnh cả
-- ngày, nhưng riêng ngày 2026-09-20 muốn nghỉ hẳn → thêm 1 dòng ở đây cho đúng ngày đó.
create table if not exists expert_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references experts(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  reason varchar(200),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists idx_expert_availability_exceptions_expert_date on expert_availability_exceptions(expert_id, date);
alter table expert_availability_exceptions enable row level security;
