-- Thu thach cong dong (banner "Cung nhau thien 1.000 phut") truoc gio la 1 thu thach CO
-- DINH, hardcode trong code. Gio cho admin tu quan ly hang doi nhieu thu thach — het thu
-- thach nay (dat 100% muc tieu) thi TU DONG chuyen sang thu thach tiep theo trong hang doi,
-- neu chua dat thi giu nguyen (khong tu doi khi het tuan). Admin cung co the tu tay doi
-- ngay sang 1 thu thach khac (activate-now), bo qua thu tu hang doi.
create table if not exists community_weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  description text,
  icon varchar(16) not null default '🧘',
  -- metric_type: loai du lieu de do tien do — xem challenge-metrics.js de biet cach tinh
  -- tung loai. 'meditation_minutes' | 'journal_entries' | 'task_completions'.
  metric_type varchar(40) not null default 'meditation_minutes',
  unit_label varchar(40) not null default 'phút',
  goal_amount int not null,
  reward_xp int not null default 100,
  -- Nguong dong gop CA NHAN toi thieu (cung do theo metric_type) de nguoi da "tham gia"
  -- duoc thuong rieng — de trong (null) nghia la khong gioi han, ai tham gia cung duoc
  -- thuong ngay khi thu thach chung hoan thanh.
  personal_threshold int,
  queue_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Singleton: chi 1 dong duy nhat luu thu thach dang active + thoi diem no bat dau (de tinh
-- tien do TU LUC NAY, khong tinh du lieu tu truoc do cua thu thach cu).
create table if not exists community_weekly_challenge_state (
  id boolean primary key default true check (id),
  current_challenge_id uuid references community_weekly_challenges(id),
  started_at timestamptz not null default now()
);

alter table community_weekly_challenges enable row level security;
alter table community_weekly_challenge_state enable row level security;

-- Seed: giu nguyen dung thu thach dang chay hien tai (1.000 phut thien/tho) lam thu thach
-- dau tien trong hang doi, va set no la thu thach active ngay — khong lam gian doan trai
-- nghiem nguoi dung dang co.
insert into community_weekly_challenges (title, description, icon, metric_type, unit_label, goal_amount, reward_xp, personal_threshold, queue_order, active)
values (
  '🧘 Cùng nhau thiền 1,000 phút trong tuần này!',
  'Vào mục Nhiệm vụ, làm bài "Thiền" hoặc "Thở" — mỗi phút luyện tập thật của bạn sẽ cộng thẳng vào mục tiêu chung của cộng đồng.',
  '🧘', 'meditation_minutes', 'phút', 1000, 100, 30, 0, true
)
on conflict do nothing;

-- started_at = dau tuan nay (khong phai now()) de khong lam mat tien do cong dong da tich
-- luy tu dau tuan theo cach tinh cu (date_trunc('week', now())).
insert into community_weekly_challenge_state (id, current_challenge_id, started_at)
select true, (select id from community_weekly_challenges where metric_type = 'meditation_minutes' order by created_at asc limit 1), date_trunc('week', now())
where not exists (select 1 from community_weekly_challenge_state);
