-- Bảng giá riêng của từng chuyên gia, chuyên gia tự nhập trong "Hồ sơ chuyên gia".
-- Dạng {"new_client": {"quick": 300000, "standard": 500000}, "returning_client": {"quick": 150000, "standard": 200000}};
-- ô nào không có (hoặc cả cột null) thì dùng bảng giá chung SESSION_PRICING trong expert.routes.js.
alter table experts add column if not exists session_pricing jsonb;
