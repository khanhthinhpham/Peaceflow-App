-- Hồ sơ y tế cũ (bệnh án, đơn thuốc, chỉ số thăm khám...) bệnh nhân đính kèm khi đặt lịch
-- để chuyên gia tham khảo. Lưu file mã hoá thật (AES-256-GCM ở tầng app, xem
-- src/common/services/crypto.service.js) — trước đây bước "Mô tả tình trạng" trong luồng
-- đặt lịch quảng cáo "mã hoá AES-256" nhưng cột notes chỉ là text thường, không mã hoá gì
-- cả. Bảng mới này làm đúng lời cam kết đó.
create table if not exists booking_medical_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references expert_bookings(id) on delete cascade,
  file bytea not null,          -- da ma hoa: iv(12) + authTag(16) + ciphertext
  filename varchar(255) not null,
  mime varchar(100) not null,
  file_size int not null,       -- kich thuoc file GOC (truoc ma hoa), de hien thi cho nguoi dung
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_medical_records_booking on booking_medical_records(booking_id);

-- Ghi chú chung cho cả bộ hồ sơ đính kèm (không phải mỗi file một ghi chú riêng).
-- Mã hoá cùng cơ chế, lưu dạng bytea giống file.
alter table expert_bookings add column if not exists medical_records_note bytea;
