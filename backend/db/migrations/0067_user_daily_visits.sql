-- Nhat ky "ngay co mo app" cua tung nguoi dung.
--
-- Vi sao can bang nay: o GET /progress (progress.routes.js), current_streak duoc cong don chi
-- can goi API nay (tuc la mo app) - KHONG can lam nhiem vu/viet nhat ky/check-in tam trang.
-- Nhung lich mau o tab Streak trang Achievements truoc day lai suy tu MOT NGUON KHAC
-- (task_completions/journal_entries/mood_checkins), nen streak bao vd 30 ngay lien tuc ma lich
-- chi to xanh vai o rai rac - 2 cho hien thi 2 cau chuyen khac nhau tu 2 nguon du lieu khac nhau.
--
-- Bang nay ghi lai chinh xac nhung ngay da lam current_streak tang (cung dieu kien, cung mui gio
-- VN), de lich Achievements to mau tu DUNG nguon da tao ra con so streak, khong con lech nhau.
create table if not exists user_daily_visits (
  user_id uuid not null references users(id) on delete cascade,
  visit_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, visit_date)
);

alter table user_daily_visits enable row level security;
