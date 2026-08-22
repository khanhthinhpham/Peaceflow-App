-- Đánh dấu (bookmark) 1 kết quả để dễ tìm lại, và cho phép chuyên gia chia sẻ 1 kết quả
-- (bệnh nhân họ tự nhập khi khám) cho đồng nghiệp khác cùng xem — cả 2 bên đều giữ quyền
-- xem, không ai bị mất dữ liệu.
alter table assessment_results
  add column if not exists flagged boolean not null default false;

create table if not exists assessment_result_shares (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references assessment_results(id) on delete cascade,
  shared_with_user_id uuid not null references users(id) on delete cascade,
  shared_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  unique (result_id, shared_with_user_id)
);

create index if not exists idx_assessment_result_shares_shared_with
  on assessment_result_shares(shared_with_user_id);
