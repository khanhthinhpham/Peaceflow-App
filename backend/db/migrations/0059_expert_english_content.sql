-- Cho phép chuyên gia tự nhập bản tiếng Anh cho bio/specialties (nội dung tự viết, không thể
-- máy dịch chuẩn thuật ngữ tâm lý) — cùng pattern với 0055_english_content_columns.sql: thêm
-- cột *_en riêng, giữ nguyên cột gốc tiếng Việt làm mặc định/fallback khi chuyên gia chưa điền.

alter table experts add column if not exists bio_en text;
alter table experts add column if not exists specialties_en jsonb;
