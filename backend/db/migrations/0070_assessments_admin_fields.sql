-- Cho phep admin tu tao bai test moi qua UI (khong can lap trinh vien). Cac bai test "cu"
-- (GAD7, PHQ9, DASS21...) van duoc render tu file JS hardcoded trong frontend nhu truoc -
-- KHONG dong tren cac cot question_schema/scoring_rules/interpretation_rules da co san trong
-- bang nay (cac cot do truoc gio khong duoc app doc, chi la du lieu du). Bai test admin tao
-- moi (is_custom = true) se dung dung cac cot nay lam nguon that, va duoc render qua 1 engine
-- chung don gian hoa (1 thang diem duy nhat, dung chung 1 bo lua chon Likert cho moi cau).
alter table assessments add column if not exists icon varchar(16);
alter table assessments add column if not exists category varchar(40);
alter table assessments add column if not exists is_custom boolean not null default false;
