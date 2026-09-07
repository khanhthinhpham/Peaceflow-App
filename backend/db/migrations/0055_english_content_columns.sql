-- Thêm nội dung tiếng Anh song song cho dữ liệu tĩnh lưu trong DB (badge, bài test tự
-- đánh giá, thư viện nhiệm vụ) — để người dùng nước ngoài / chọn English trong app thấy
-- được nội dung, thay vì luôn nhận bản tiếng Việt bất kể locale.
--
-- Cách làm: thêm cột *_en riêng, GIỮ NGUYÊN cột gốc tiếng Việt làm mặc định/fallback.
-- Route đọc dữ liệu sẽ chọn cột theo req.locale, dùng bản tiếng Việt nếu bản tiếng Anh
-- chưa có (null) — không có rủi ro breaking gì với dữ liệu/code cũ.

alter table badges add column if not exists name_en varchar(255);
alter table badges add column if not exists description_en text;

alter table assessments add column if not exists name_en varchar(255);
alter table assessments add column if not exists description_en text;

alter table tasks add column if not exists title_en varchar(255);
alter table tasks add column if not exists description_en text;
alter table tasks add column if not exists steps_en jsonb;
alter table tasks add column if not exists safety_notes_en jsonb;
-- Phần tiếng Anh của metadata (benefits/preparation/objective/quote) — giữ cùng shape với
-- cột `metadata` gốc để route chỉ cần merge đè lên khi có bản dịch, thay vì tách nhiều cột.
alter table tasks add column if not exists metadata_en jsonb;

-- ===== Dữ liệu tiếng Anh cho badge (8 dòng, cố định) =====
update badges set name_en = 'Sprout', description_en = 'Completed your first task' where code = 'first_task';
update badges set name_en = 'Sapling', description_en = 'Kept a 7-day streak' where code = 'streak_7';
update badges set name_en = 'Tall Tree', description_en = 'Kept a 30-day streak' where code = 'streak_30';
update badges set name_en = 'Novice Monk', description_en = 'Completed 10 meditation sessions' where code = 'meditate_10';
update badges set name_en = 'Warrior', description_en = 'Completed 5 hard tasks' where code = 'hard_5';
update badges set name_en = 'Kind Soul', description_en = 'Did 10 acts of kindness' where code = 'kind_10';
update badges set name_en = 'Mountain Climber', description_en = 'Made it through a crisis period' where code = 'crisis_over';
update badges set name_en = 'Star', description_en = 'Reached 500 XP' where code = 'xp_500';

-- ===== Dữ liệu tiếng Anh cho bài test tự đánh giá =====
-- `name` các bài test vốn đã là tên tiếng Anh chuẩn (DASS-21, PHQ-9...) nên không cần
-- name_en riêng — route fallback dùng lại `name` khi name_en null. Chỉ description cần dịch.
update assessments set description_en = 'Screening test for alcohol use over the past 12 months (WHO)' where code = 'AUDIT';
update assessments set description_en = 'Beck Depression Inventory — 21 items, self-report' where code = 'BDI';
update assessments set description_en = 'Autism severity rating scale — 15 domains, scored from a clinician''s observation' where code = 'CARS';
update assessments set description_en = 'Screening scale for stress, anxiety, and depression' where code = 'DASS21';
update assessments set description_en = 'Screens anxiety severity over the past 2 weeks' where code = 'GAD7';
update assessments set description_en = 'Anxiety severity assessment across multiple dimensions' where code = 'HARS';
update assessments set description_en = 'Screening test for internet addiction over the past month' where code = 'IAT';
update assessments set description_en = 'Insomnia severity test — assesses the nature, severity, and impact of insomnia over the past month' where code = 'ISI';
update assessments set description_en = 'Mini-Mental State Exam — assesses cognitive function (orientation, memory, attention, language)' where code = 'MMSE';
update assessments set description_en = 'Screens depressive symptoms over the past 2 weeks' where code = 'PHQ9';
update assessments set description_en = 'Assesses sleep quality' where code = 'PSQI';
update assessments set description_en = 'Scale measuring perceived stress over the past month' where code = 'PSS';
update assessments set description_en = 'Raven''s Coloured Progressive Matrices — 36 items, self-scored raw score converted to age-based IQ (ages 4-11) using the 2008 Raven Colour Score Key for Children' where code = 'RAVEN_CPM';
update assessments set description_en = 'Strengths and Difficulties Questionnaire — self-report version for adolescents' where code = 'SDQ25';
update assessments set description_en = 'Strengths and Difficulties Questionnaire — observer version, scored by a psychology professional based on observation' where code = 'SDQ25_OBS';
