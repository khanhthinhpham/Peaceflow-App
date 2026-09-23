-- 0073 da them khoa moi (user_id, challenge_id, cycle_started_at) nhung KHOA CU (user_id,
-- week_start) van la primary key — 2 khoa chong nhau se gay xung dot khi 1 thu thach keo
-- dai qua nhieu tuan lich hoac chuyen thu thach giua tuan (cung user_id+week_start nhung
-- khac challenge_id). Bo khoa cu, dung han khoa moi lam duy nhat.
alter table community_challenge_participants drop constraint if exists community_challenge_participants_pkey;
alter table community_challenge_participants alter column week_start drop not null;
alter table community_challenge_rewards drop constraint if exists community_challenge_rewards_pkey;
alter table community_challenge_rewards alter column week_start drop not null;

alter table community_challenge_participants alter column challenge_id set not null;
alter table community_challenge_participants alter column cycle_started_at set not null;
alter table community_challenge_rewards alter column challenge_id set not null;
alter table community_challenge_rewards alter column cycle_started_at set not null;
