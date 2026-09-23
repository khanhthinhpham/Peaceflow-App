-- Truoc day "tham gia"/"thuong" thu thach cong dong duoc khoa theo TUAN LICH (week_start) —
-- gio thu thach chuyen sang co che hang doi, 1 thu thach co the ket thuc som hon hoac keo
-- dai hon 1 tuan lich, nen phai khoa theo TUNG LAN THU THACH CU THE DUOC KICH HOAT (challenge
-- id + thoi diem no bat dau — community_weekly_challenge_state.started_at) thay vi tuan lich.
alter table community_challenge_participants add column if not exists challenge_id uuid references community_weekly_challenges(id);
alter table community_challenge_participants add column if not exists cycle_started_at timestamptz;
alter table community_challenge_rewards add column if not exists challenge_id uuid references community_weekly_challenges(id);
alter table community_challenge_rewards add column if not exists cycle_started_at timestamptz;

create unique index if not exists community_challenge_participants_instance_uk
  on community_challenge_participants (user_id, challenge_id, cycle_started_at);
create unique index if not exists community_challenge_rewards_instance_uk
  on community_challenge_rewards (user_id, challenge_id, cycle_started_at);
