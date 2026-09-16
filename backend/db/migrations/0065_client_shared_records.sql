-- Thân chủ chủ động gửi nhật ký + kết quả test (snapshot tại thời điểm gửi) cho bác sĩ
-- đang có lịch hẹn đã xác nhận với mình. expert_id lưu trực tiếp users.id (không phải
-- experts.id) để khớp đúng đối tượng nhận thông báo/kê đơn, tránh phải join lại mỗi lần.
create table if not exists client_shared_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references expert_bookings(id) on delete cascade,
  client_id uuid not null references users(id) on delete cascade,
  expert_id uuid not null references users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  status varchar(20) not null default 'active' check (status in ('active', 'revoked')),
  sent_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_shared_records_expert on client_shared_records(expert_id, created_at desc);
create index if not exists idx_shared_records_client on client_shared_records(client_id, created_at desc);
create index if not exists idx_shared_records_booking on client_shared_records(booking_id);

-- Bác sĩ phản hồi/kê đơn theo từng lần gửi — cho phép nhiều dòng phản hồi theo thời gian
-- (không giới hạn chỉ 1 phản hồi duy nhất).
create table if not exists client_shared_record_responses (
  id uuid primary key default gen_random_uuid(),
  shared_record_id uuid not null references client_shared_records(id) on delete cascade,
  expert_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shared_record_responses_record on client_shared_record_responses(shared_record_id, created_at asc);
