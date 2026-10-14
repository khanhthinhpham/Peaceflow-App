-- Mở rộng mô hình chia sẻ với chuyên gia (đã làm cho mood check-in ở migration 0078):
-- 1) Bài test tự làm: công tắc TOÀN CỤC (giống mood) — bật 1 lần, áp dụng mọi kết quả
--    test tự làm sau này. Mặc định TẮT.
alter table user_profiles
  add column if not exists share_assessments_with_experts boolean not null default false;

-- 2) Nhật ký: chia sẻ TỪNG BÀI riêng lẻ (không phải công tắc toàn cục) — mỗi bài nhật ký
--    có cờ riêng, người dùng tự bật cho từng bài muốn chia sẻ. Mặc định TẮT.
alter table journal_entries
  add column if not exists shared_with_experts boolean not null default false;
