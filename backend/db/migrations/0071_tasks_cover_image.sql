-- Cho phep admin tu up anh cho nhiem vu tu tao qua UI (giong co che cover_image cua articles).
-- Anh cua 138 nhiem vu co san van la file tinh trong frontend-vue/public/task-images(-thumb)/
-- theo code.png — KHONG dong tren cot nay, van tiep tuc dung binh thuong. Cot nay chi danh
-- cho nhiem vu MOI tao qua admin, khong co san file tinh tuong ung.
alter table tasks add column if not exists cover_image bytea;
alter table tasks add column if not exists cover_image_mime varchar(100);
