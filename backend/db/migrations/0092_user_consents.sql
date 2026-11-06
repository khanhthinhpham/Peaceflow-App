-- Nhật ký đồng ý điều khoản / xử lý dữ liệu của khách hàng — bằng chứng pháp lý.
-- Mỗi lần đồng ý ghi MỘT DÒNG MỚI (chỉ thêm, không sửa/xoá), kèm phiên bản văn bản, ngữ cảnh, IP, thiết bị.
--   kind = 'terms'          : Điều khoản phân định trách nhiệm (+ xác nhận đủ 18 tuổi / có người giám hộ đồng ý)
--          'sensitive_data' : đồng ý riêng xử lý Dữ liệu sức khỏe (Điều 7.1) — granted=false khi rút lại
--          'booking'        : điều khoản khi đặt lịch chuyên gia (context: expert_id, booking_id)
--          'share_record'   : đồng ý chia sẻ hồ sơ cho một chuyên gia cụ thể (context: expert_id, record_id, số mục)
create table if not exists user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('terms', 'sensitive_data', 'booking', 'share_record')),
  version text not null,
  granted boolean not null default true,
  context jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_consents_user_kind on user_consents(user_id, kind, created_at desc);

alter table user_consents enable row level security;
