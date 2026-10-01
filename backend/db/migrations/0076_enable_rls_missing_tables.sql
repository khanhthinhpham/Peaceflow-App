-- Bật RLS cho các bảng tạo sau migration 0050 nhưng bị bỏ sót — Supabase Security Advisor
-- báo "RLS Disabled in Public". Không thêm policy (giống 0050): backend kết nối bằng quyền
-- chủ sở hữu bảng nên RLS không ảnh hưởng hành vi hiện tại, chỉ chặn truy cập PostgREST/anon.
alter table articles enable row level security;
alter table article_categories enable row level security;
alter table client_shared_records enable row level security;
alter table client_shared_record_responses enable row level security;
