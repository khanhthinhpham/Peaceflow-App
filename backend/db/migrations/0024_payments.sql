-- Thanh toán giữ chỗ (pre-paid), ví hoàn tiền, doanh thu & chi trả chuyên gia

-- 1) Booking: thêm trạng thái chờ thanh toán / hết hạn + cột thanh toán & hủy
alter table expert_bookings drop constraint if exists expert_bookings_status_check;
alter table expert_bookings add constraint expert_bookings_status_check
  check (status in ('pending_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'expired'));

alter table expert_bookings add column if not exists amount int not null default 0;
alter table expert_bookings add column if not exists paid_at timestamptz;
alter table expert_bookings add column if not exists cancelled_at timestamptz;
alter table expert_bookings add column if not exists cancel_reason varchar(50);

-- 2) Đơn thanh toán (PayOS / VietQR)
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references expert_bookings(id) on delete cascade,
  order_code bigint not null unique,
  amount int not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'failed', 'cancelled')),
  provider varchar(30) not null default 'payos',
  provider_ref varchar(120),
  checkout_url text,
  qr_code text,
  raw jsonb,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_booking on payments(booking_id);

-- 3) Ví người dùng (hoàn tiền / số dư trong tài khoản)
alter table users add column if not exists wallet_balance int not null default 0;

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount int not null,
  type varchar(30) not null,
  booking_id uuid references expert_bookings(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_tx_user on wallet_transactions(user_id, created_at desc);

-- 4) Sổ doanh thu chuyên gia + số dư
alter table experts add column if not exists balance int not null default 0;

create table if not exists expert_ledger (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references experts(id) on delete cascade,
  booking_id uuid not null references expert_bookings(id) on delete cascade,
  gross int not null,
  platform_fee int not null,
  expert_earning int not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'payable', 'settled', 'reversed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_expert_ledger_expert on expert_ledger(expert_id, status);

-- 5) Đợt chi trả cho chuyên gia
create table if not exists expert_payouts (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references experts(id) on delete cascade,
  amount int not null,
  status varchar(20) not null default 'pending' check (status in ('pending', 'paid')),
  period_start date,
  period_end date,
  note text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
