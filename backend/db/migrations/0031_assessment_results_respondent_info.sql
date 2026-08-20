-- Cho phép ghi tên/tuổi/ghi chú của người TRỰC TIẾP làm bài test — cần khi một
-- chuyên gia đăng nhập tài khoản của mình và đưa máy cho khách hàng tự làm test
-- ngay tại chỗ (khách không có tài khoản riêng, nên không thể suy ra danh tính
-- từ user_id như bình thường).
alter table assessment_results
  add column if not exists respondent_name varchar(255),
  add column if not exists respondent_age int,
  add column if not exists note text;
