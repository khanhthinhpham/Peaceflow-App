-- Công tắc "Chia sẻ check-in hàng ngày với chuyên gia" — mặc định TẮT. Khi bật, mọi
-- chuyên gia đang/đã có lịch hẹn (confirmed/completed) với user này có thể xem lịch sử
-- mood_checkins của họ qua GET /expert-portal/clients/:userId/mood-history.
alter table user_profiles
  add column if not exists share_mood_with_experts boolean not null default false;
