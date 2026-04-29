-- Bật RLS cho tất cả bảng
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.mood_checkins enable row level security;
-- ... tương tự cho tất cả bảng

-- Ví dụ policy cơ bản
create policy "Users can only see their own data"
  on public.mood_checkins for all
  using (auth.uid() = user_id);