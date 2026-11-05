-- Đảo "Khu vườn tâm hồn" do người dùng tự trang trí: chỉ lưu PHẦN KHÁC so với đảo mặc định
-- (đồ có sẵn bị ẩn / dời chỗ, đồ tự thêm từ kho) — vài KB mỗi người.
create table if not exists user_garden_layouts (
  user_id uuid primary key references users(id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- backend kết nối bằng quyền chủ bảng nên không bị RLS chặn; bật RLS để PostgREST/anon không đọc được (xem 0050)
alter table user_garden_layouts enable row level security;
