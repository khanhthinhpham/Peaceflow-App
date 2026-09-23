-- Thu thach tuan "Cung nhau thien 1.000 phut" o dau trang Community truoc day chi hien thi
-- (mem "Da tham gia" luu localStorage, dong "Phan thuong: +100 XP + huy hieu cong dong" chi
-- la text trang tri) - khong co co che nao thuc su cong XP/trao thuong. Them 2 bang de lam
-- that: participants ghi lai AI da bam "Tham gia" theo TUNG TUAN (key theo week_start), con
-- rewards ghi lai AI da thuc su duoc thuong (chi thuong 1 lan/tuan/nguoi, tranh cong trung).
create table if not exists community_challenge_participants (
  user_id uuid not null references users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create table if not exists community_challenge_rewards (
  user_id uuid not null references users(id) on delete cascade,
  week_start date not null,
  xp_awarded int not null default 100,
  awarded_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table community_challenge_participants enable row level security;
alter table community_challenge_rewards enable row level security;
