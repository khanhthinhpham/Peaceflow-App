-- Gỡ phiếu Tiêm chủng mở rộng (TCMR) khỏi hệ thống khảo sát hài lòng.
-- Nội dung phiếu TCMR ở 0097 là bản nháp do hệ thống tự soạn, không phải mẫu chính thức của Bộ Y tế → xoá.
-- Khi có mẫu phiếu TCMR chính thức sẽ thêm lại bằng migration mới.
delete from ks_responses where form_code = 'tcmr' or round_id in (select id from ks_rounds where kind = 'tcmr');
delete from ks_links where form_code = 'tcmr';
delete from ks_rounds where kind = 'tcmr'; -- ks_links, ks_improvements của đợt TCMR xoá theo (on delete cascade)
delete from ks_forms where code = 'tcmr';
-- Trạm y tế chỉ dùng cho TCMR → ngừng hoạt động (giữ bản ghi)
update ks_units set active = false where type = 'tyt';

alter table ks_rounds drop constraint if exists ks_rounds_kind_check;
alter table ks_rounds add constraint ks_rounds_kind_check check (kind = 'quy');
