-- Mã hồ sơ dễ đọc/tra cứu theo đúng tài liệu "Cổng dữ liệu số tư vấn học đường Nghệ An":
-- định dạng NA-TVHD-[Năm]-[Tháng]-[Số thứ tự], vd NA-TVHD-2026-05-001. Số thứ tự CHUNG cho
-- cả 2 loại phiếu (sàng lọc + đăng ký hỗ trợ), reset mỗi tháng — khớp đúng cách đánh số mẫu
-- trong tài liệu (1 không gian mã hồ sơ duy nhất cho toàn hệ thống, không tách theo loại).
create table if not exists case_code_counters (
  year_month text primary key, -- 'YYYY-MM'
  last_number int not null default 0
);

alter table screening_responses add column if not exists case_code text unique;
alter table support_registrations add column if not exists case_code text unique;
