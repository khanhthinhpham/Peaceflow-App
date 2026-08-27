-- Phần nhận xét bài test giờ trả về 2 nội dung: lời khuyên (summary) và phán đoán hỗ trợ
-- thêm về tình trạng (interpretation) — không còn gợi ý bài tập nữa. Thêm cột để cache
-- lưu được phần phán đoán. Cột này để trống với các dòng cache của tính năng lời khuyên
-- hằng ngày (daily_message) vì tính năng đó không có phần phán đoán.
alter table ai_summary_cache add column if not exists interpretation text;
