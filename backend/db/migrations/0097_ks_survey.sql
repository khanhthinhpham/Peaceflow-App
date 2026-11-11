-- Khảo sát hài lòng người bệnh / nhân viên y tế / tiêm chủng mở rộng cho Sở Y tế Nghệ An
-- theo QĐ 56/QĐ-BYT (2024) và QĐ 3869/QĐ-BYT (2019). Module: src/modules/survey.
-- Giao diện là trang tĩnh riêng (dự án khao-sat-hai-long) gọi API /api/v1/survey/... bằng tài khoản PeaceFlow.
-- Mọi bảng tiền tố ks_. Dữ liệu người trả lời ẩn danh: không lưu tên; số điện thoại (nếu có) chỉ lưu
-- dạng băm SHA-256 có muối để phát hiện trùng; phiếu nhân viên y tế không lưu số điện thoại.

-- Cây đơn vị: bệnh viện / Trung tâm Y tế (đơn vị báo cáo) → trạm y tế (tyt, con của TTYT).
create table if not exists ks_units (
  id serial primary key,
  code text not null unique,
  name text not null,
  type text not null check (type in ('benh_vien', 'ttyt', 'tyt')),
  parent_id int references ks_units(id),
  sort int not null default 0,
  so_tyt int,                         -- số TYT khai báo (TTYT) khi chưa nhập danh sách TYT
  luot_noi_tru_ngay int,              -- quy mô dùng tính cỡ mẫu (QĐ 56 mục 2.2)
  luot_ngoai_tru_ngay int,
  luot_tiem_thang int,                -- TYT: lượt tiêm/tháng; TTYT: bình quân mỗi TYT
  so_nhan_vien int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_ks_units_parent on ks_units(parent_id);

-- Mẫu phiếu dạng JSON (sửa được khi Bộ Y tế ban hành mẫu chính thức). status: chinh_thuc | can_cap_nhat | ban_nhap
create table if not exists ks_forms (
  code text primary key,
  name text not null,
  title text not null,
  status text not null check (status in ('chinh_thuc', 'can_cap_nhat', 'ban_nhap')),
  note text,
  definition jsonb not null,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

-- Đợt khảo sát: quy = KCB + NVYT theo quý (period 1–4); tcmr = 2 đợt/năm (period 1: tháng 3–4, 2: tháng 9–10).
create table if not exists ks_rounds (
  id serial primary key,
  kind text not null check (kind in ('quy', 'tcmr')),
  year int not null,
  period int not null check (period between 1 and 4),
  name text not null,
  status text not null default 'nhap' check (status in ('nhap', 'mo', 'dong')),
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, year, period)
);

-- Link/QR công khai cho từng đơn vị × mẫu phiếu × đợt.
create table if not exists ks_links (
  id serial primary key,
  token text not null unique,
  round_id int not null references ks_rounds(id) on delete cascade,
  unit_id int not null references ks_units(id),
  form_code text not null references ks_forms(code),
  created_at timestamptz not null default now(),
  unique (round_id, unit_id, form_code)
);

-- Phiếu trả lời. answers = {mã câu: 0..5}; comp_counts = {A1: {pos, valid}, ...} tính sẵn khi lưu
-- (pos = số câu mức 4–5, valid = số câu mức 1–5, câu 0 "không sử dụng" bị loại).
create table if not exists ks_responses (
  id bigserial primary key,
  round_id int not null references ks_rounds(id),
  unit_id int not null references ks_units(id),      -- đơn vị báo cáo (BV/TTYT)
  tyt_id int references ks_units(id),                -- trạm y tế (TCMR) nếu có
  form_code text not null references ks_forms(code),
  form_version int not null default 1,
  mode text not null check (mode in ('tu_dien', 'phong_van', 'nhap_giay', 'doc_lap')),
  answers jsonb not null default '{}'::jsonb,
  comp_counts jsonb not null default '{}'::jsonb,
  demographics jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,           -- expect_pct (G1), return_intent (G2)
  comment text,
  phone_hash text,
  duration_sec int,
  flags jsonb not null default '[]'::jsonb,          -- qua_nhanh | tra_loi_mot_kieu | trung_so_dien_thoai
  excluded boolean not null default false,
  entered_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ks_responses_round_unit_form on ks_responses(round_id, unit_id, form_code);
create index if not exists idx_ks_responses_phone on ks_responses(round_id, unit_id, phone_hash) where phone_hash is not null;

-- Giải pháp cải tiến theo đợt (căn cứ chỉ tiêu "tỷ lệ cơ sở áp dụng kết quả đo lường").
create table if not exists ks_improvements (
  unit_id int not null references ks_units(id),
  round_id int not null references ks_rounds(id) on delete cascade,
  applied boolean not null default false,
  description text,
  so_tyt_thuc_hien int,                 -- TTYT chưa nhập danh sách TYT: số TYT đã khảo sát TCMR
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id) on delete set null,
  primary key (unit_id, round_id)
);

-- Vai trò của tài khoản PeaceFlow trong hệ thống khảo sát. Quản trị viên PeaceFlow mặc định là so_yte.
create table if not exists ks_members (
  id serial primary key,
  user_id uuid not null unique references users(id) on delete cascade,
  role text not null check (role in ('so_yte', 'don_vi')),
  unit_id int references ks_units(id),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (role = 'so_yte' or unit_id is not null)
);

alter table ks_units enable row level security;
alter table ks_forms enable row level security;
alter table ks_rounds enable row level security;
alter table ks_links enable row level security;
alter table ks_responses enable row level security;
alter table ks_improvements enable row level security;
alter table ks_members enable row level security;

-- 40 đơn vị theo mẫu báo cáo quý của Sở Y tế Nghệ An (NA01–NA20: bệnh viện + TT Huyết học; NA21–NA40: TTYT).
insert into ks_units (code, name, type, sort) values
  ('NA01', 'Bệnh viện Hữu nghị đa khoa Nghệ An', 'benh_vien', 1),
  ('NA02', 'Bệnh viện Sản nhi', 'benh_vien', 2),
  ('NA03', 'Bệnh viện Ung bướu', 'benh_vien', 3),
  ('NA04', 'Bệnh viện Tâm thần', 'benh_vien', 4),
  ('NA05', 'Bệnh viện Phổi', 'benh_vien', 5),
  ('NA06', 'Bệnh viện YHCT', 'benh_vien', 6),
  ('NA07', 'Bệnh viện Chấn thương chỉnh hình', 'benh_vien', 7),
  ('NA08', 'Bệnh viện PHCN', 'benh_vien', 8),
  ('NA09', 'Bệnh viện ĐKKV Tây Bắc', 'benh_vien', 9),
  ('NA10', 'Bệnh viện ĐKKV Tây Nam', 'benh_vien', 10),
  ('NA11', 'Bệnh viện Mắt', 'benh_vien', 11),
  ('NA12', 'Bệnh viện Nội tiết', 'benh_vien', 12),
  ('NA13', 'Bệnh viện ĐK TP Vinh', 'benh_vien', 13),
  ('NA14', 'Bệnh viện ĐK Diễn Châu', 'benh_vien', 14),
  ('NA15', 'Bệnh viện ĐK Nghi Lộc', 'benh_vien', 15),
  ('NA16', 'Bệnh viện ĐK Quỳnh Lưu', 'benh_vien', 16),
  ('NA17', 'Bệnh viện ĐK Đô Lương', 'benh_vien', 17),
  ('NA18', 'Bệnh viện ĐK Yên Thành', 'benh_vien', 18),
  ('NA19', 'Bệnh viện ĐK Thanh Chương', 'benh_vien', 19),
  ('NA20', 'TT Huyết học TM', 'benh_vien', 20),
  ('NA21', 'Trung tâm Y tế Kỳ Sơn', 'ttyt', 21),
  ('NA22', 'Trung tâm Y tế Tương Dương', 'ttyt', 22),
  ('NA23', 'Trung tâm Y tế Anh Sơn', 'ttyt', 23),
  ('NA24', 'Trung tâm Y tế Tân Kỳ', 'ttyt', 24),
  ('NA25', 'Trung tâm Y tế Quế Phong', 'ttyt', 25),
  ('NA26', 'Trung tâm Y tế Quỳ Châu', 'ttyt', 26),
  ('NA27', 'Trung tâm Y tế Quỳ Hợp', 'ttyt', 27),
  ('NA28', 'Trung tâm Y tế Nghĩa Đàn', 'ttyt', 28),
  ('NA29', 'Trung tâm Y tế Nam Đàn', 'ttyt', 29),
  ('NA30', 'Trung tâm Y tế thị xã Hoàng Mai', 'ttyt', 30),
  ('NA31', 'Trung tâm Y tế Hưng Nguyên', 'ttyt', 31),
  ('NA32', 'Trung tâm Y tế Con Cuông', 'ttyt', 32),
  ('NA33', 'Trung tâm Y tế Yên Thành', 'ttyt', 33),
  ('NA34', 'Trung tâm Y tế Đô Lương', 'ttyt', 34),
  ('NA35', 'Trung tâm Y tế Nghi Lộc', 'ttyt', 35),
  ('NA36', 'Trung tâm Y tế Quỳnh Lưu', 'ttyt', 36),
  ('NA37', 'Trung tâm Y tế thị xã Thái Hòa', 'ttyt', 37),
  ('NA38', 'Trung tâm Y tế Diễn Châu', 'ttyt', 38),
  ('NA39', 'Trung tâm Y tế Thanh Chương', 'ttyt', 39),
  ('NA40', 'Trung tâm Y tế thành phố Vinh', 'ttyt', 40)
on conflict (code) do nothing;

-- 4 mẫu phiếu: noi_tru (QĐ 3869 Mẫu 1, 31/36 tiêu chí — cần cập nhật), ngoai_tru (Mẫu 2, 31 — khớp QĐ 56),
-- nhan_vien (Mẫu 3, ẩn danh), tcmr (BẢN NHÁP 32 tiêu chí — thay bằng mẫu chính thức QĐ 56).
insert into ks_forms (code, name, title, status, note, definition) values
  ('noi_tru', 'Người bệnh nội trú', 'PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NỘI TRÚ', 'can_cap_nhat', 'Mẫu theo 3869 — QĐ 56 yêu cầu 36 tiêu chí (thiếu 2 ở A2, 2 ở A3, 1 ở A5); cập nhật khi có mẫu chính thức', '{"code":"noi_tru","name":"Người bệnh nội trú","kind":"kcb","title":"PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NỘI TRÚ","source":"QĐ 3869/QĐ-BYT — Mẫu số 1 (rút gọn)","status":"can_cap_nhat","note":"Mẫu theo 3869 — QĐ 56 yêu cầu 36 tiêu chí (thiếu 2 ở A2, 2 ở A3, 1 ở A5); cập nhật khi có mẫu chính thức","required_counts":{"A1":5,"A2":7,"A3":11,"A4":7,"A5":6},"intro":"Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh, đáp ứng sự hài lòng người bệnh, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu nguyện vọng người bệnh. Các ý kiến quý báu này sẽ giúp ngành y tế khắc phục khó khăn, từng bước cải tiến chất lượng để phục vụ người dân tốt hơn. Bộ Y tế bảo đảm giữ bí mật thông tin và không ảnh hưởng đến việc điều trị. Xin trân trọng cảm ơn!","consent":"Tôi đồng ý tham gia khảo sát. Tôi đã được biết: việc tham gia là tự nguyện, thông tin được giữ bí mật và chỉ dùng để cải tiến chất lượng dịch vụ; số điện thoại (nếu cung cấp) không được lưu dưới dạng đọc được (Nghị định 13/2023/NĐ-CP).","phone":true,"demographics":[{"code":"nguoi_tra_loi","label":"Người trả lời","type":"choice","required":true,"options":[{"v":1,"l":"Người bệnh"},{"v":2,"l":"Người nhà"}]},{"code":"khoa","label":"Tên khoa nằm điều trị trước ra viện","type":"text","required":false,"maxLength":120},{"code":"gioi_tinh","label":"Giới tính","type":"choice","required":true,"options":[{"v":1,"l":"Nam"},{"v":2,"l":"Nữ"}]},{"code":"tuoi","label":"Tuổi","type":"number","required":true,"min":18,"max":120,"hint":"Người trả lời phải từ 18 tuổi trở lên"},{"code":"so_ngay_nam_vien","label":"Tổng số ngày nằm viện","type":"number","required":false,"min":0,"max":365},{"code":"bhyt","label":"Ông/Bà có sử dụng thẻ BHYT cho lần điều trị này không?","type":"choice","required":true,"options":[{"v":1,"l":"Có"},{"v":2,"l":"Không"}]}],"groups":[{"component":"A1","code":"A","title":"Khả năng tiếp cận","items":[{"code":"A1","text":"Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm."},{"code":"A2","text":"Thời gian vào thăm người bệnh được thông báo rõ ràng."},{"code":"A3","text":"Các khối nhà, cầu thang, buồng bệnh được đánh số rõ ràng, dễ tìm."},{"code":"A4","text":"Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi."},{"code":"A5","text":"Người bệnh hỏi và gọi được nhân viên y tế khi cần thiết."}]},{"component":"A2","code":"B","title":"Sự minh bạch thông tin và thủ tục khám bệnh, điều trị","items":[{"code":"B1","text":"Quy trình, thủ tục nhập viện rõ ràng, công khai, thuận tiện."},{"code":"B2","text":"Được phổ biến về nội quy và những thông tin cần thiết khi nằm viện rõ ràng, đầy đủ."},{"code":"B3","text":"Được giải thích về tình trạng bệnh, phương pháp và thời gian dự kiến điều trị rõ ràng, đầy đủ."},{"code":"B4","text":"Được giải thích, tư vấn trước khi yêu cầu làm các xét nghiệm, thăm dò, kỹ thuật cao rõ ràng, đầy đủ."},{"code":"B5","text":"Được công khai và cập nhật thông tin về dùng thuốc và chi phí điều trị."}]},{"component":"A3","code":"C","title":"Cơ sở vật chất và phương tiện phục vụ người bệnh","items":[{"code":"C1","text":"Buồng bệnh nằm điều trị khang trang, sạch sẽ, có đầy đủ các thiết bị điều chỉnh nhiệt độ phù hợp như quạt, máy sưởi, hoặc điều hòa."},{"code":"C2","text":"Giường bệnh, ga, gối đầy đủ cho mỗi người một giường, an toàn, chắc chắn, sử dụng tốt."},{"code":"C3","text":"Nhà vệ sinh, nhà tắm thuận tiện, sạch sẽ, sử dụng tốt."},{"code":"C4","text":"Được bảo đảm an toàn, an ninh, trật tự, phòng ngừa trộm cắp, yên tâm khi nằm viện."},{"code":"C5","text":"Được cung cấp quần áo đầy đủ, sạch sẽ."},{"code":"C6","text":"Được cung cấp đầy đủ nước uống nóng, lạnh."},{"code":"C7","text":"Được bảo đảm sự riêng tư khi nằm viện như thay quần áo, khám bệnh, đi vệ sinh tại giường... có rèm che, vách ngăn hoặc nằm riêng."},{"code":"C8","text":"Căng-tin bệnh viện phục vụ ăn uống và nhu cầu sinh hoạt thiết yếu đầy đủ và chất lượng."},{"code":"C9","text":"Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp."}]},{"component":"A4","code":"D","title":"Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế","items":[{"code":"D1","text":"Bác sỹ, điều dưỡng có lời nói, thái độ, giao tiếp đúng mực."},{"code":"D2","text":"Nhân viên phục vụ (hộ lý, bảo vệ, kế toán...) có lời nói, thái độ, giao tiếp đúng mực."},{"code":"D3","text":"Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ."},{"code":"D4","text":"Bác sỹ, điều dưỡng hợp tác tốt và xử lý công việc thành thạo, kịp thời."},{"code":"D5","text":"Được bác sỹ thăm khám, động viên tại phòng điều trị."},{"code":"D6","text":"Được tư vấn chế độ ăn, vận động, theo dõi và phòng ngừa biến chứng."},{"code":"D7","text":"Nhân viên y tế không có biểu hiện gợi ý bồi dưỡng."}]},{"component":"A5","code":"E","title":"Kết quả cung cấp dịch vụ","items":[{"code":"E1","text":"Cấp phát thuốc và hướng dẫn sử dụng thuốc đầy đủ, chất lượng."},{"code":"E2","text":"Trang thiết bị, vật tư y tế đầy đủ, hiện đại, đáp ứng nguyện vọng."},{"code":"E3","text":"Kết quả điều trị đáp ứng được nguyện vọng."},{"code":"E4","text":"Ông/Bà đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế."},{"code":"E5","text":"Ông/Bà đánh giá mức độ hài lòng về giá cả dịch vụ y tế."}]}],"expect":{"code":"G1","label":"Đánh giá chung, bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà trước khi nằm viện? (điền số từ 0% đến 100% hoặc có thể điền trên 100% nếu bệnh viện điều trị tốt, vượt quá mong đợi của Ông/Bà)"},"return":{"code":"G2","label":"Nếu có nhu cầu khám, chữa những bệnh tương tự, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?","options":[{"v":1,"l":"Chắc chắn không bao giờ quay lại"},{"v":2,"l":"Không muốn quay lại nhưng có ít lựa chọn khác"},{"v":3,"l":"Muốn chuyển tuyến sang bệnh viện khác"},{"v":4,"l":"Có thể sẽ quay lại"},{"v":5,"l":"Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác"},{"v":6,"l":"Khác"}]},"comment":{"code":"H","label":"Ông/Bà có ý kiến gì khác, xin ghi rõ?"}}'::jsonb),
  ('ngoai_tru', 'Người bệnh ngoại trú', 'PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NGOẠI TRÚ', 'chinh_thuc', 'Số tiêu chí 5/10/8/4/4 = 31 khớp yêu cầu QĐ 56. Câu chữ theo Mẫu 2 QĐ 3869 (QĐ 56 đã bãi bỏ Mẫu 1, Mẫu 2 của QĐ 3869 — thay khi có mẫu phiếu mới).', '{"code":"ngoai_tru","name":"Người bệnh ngoại trú","kind":"kcb","title":"PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NGOẠI TRÚ","source":"QĐ 3869/QĐ-BYT — Mẫu số 2","status":"chinh_thuc","note":"Số tiêu chí 5/10/8/4/4 = 31 khớp yêu cầu QĐ 56. Câu chữ theo Mẫu 2 QĐ 3869 (QĐ 56 đã bãi bỏ Mẫu 1, Mẫu 2 của QĐ 3869 — thay khi có mẫu phiếu mới).","required_counts":{"A1":5,"A2":10,"A3":8,"A4":4,"A5":4},"intro":"Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh, đáp ứng sự hài lòng người bệnh, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu nguyện vọng người bệnh. Các ý kiến quý báu này sẽ giúp ngành y tế khắc phục khó khăn, từng bước cải tiến chất lượng để phục vụ người dân tốt hơn. Bộ Y tế bảo đảm giữ bí mật thông tin và không ảnh hưởng đến việc điều trị. Xin trân trọng cảm ơn!","consent":"Tôi đồng ý tham gia khảo sát. Tôi đã được biết: việc tham gia là tự nguyện, thông tin được giữ bí mật và chỉ dùng để cải tiến chất lượng dịch vụ; số điện thoại (nếu cung cấp) không được lưu dưới dạng đọc được (Nghị định 13/2023/NĐ-CP).","phone":true,"demographics":[{"code":"gioi_tinh","label":"Giới tính","type":"choice","required":true,"options":[{"v":1,"l":"Nam"},{"v":2,"l":"Nữ"}]},{"code":"tuoi","label":"Tuổi","type":"number","required":true,"min":18,"max":120,"hint":"Người trả lời phải từ 18 tuổi trở lên"},{"code":"khoang_cach_km","label":"Ước tính khoảng cách từ nơi sinh sống đến bệnh viện (km)","type":"number","required":false,"min":0,"max":2000},{"code":"bhyt","label":"Ông/Bà có sử dụng thẻ BHYT cho lần khám bệnh này không?","type":"choice","required":true,"options":[{"v":1,"l":"Có"},{"v":2,"l":"Không"}]}],"groups":[{"component":"A1","code":"A","title":"Khả năng tiếp cận","items":[{"code":"A1","text":"Các biển báo, chỉ dẫn đường đến bệnh viện rõ ràng, dễ nhìn, dễ tìm."},{"code":"A2","text":"Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm."},{"code":"A3","text":"Các khối nhà, cầu thang được đánh số rõ ràng, dễ tìm."},{"code":"A4","text":"Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi."},{"code":"A5","text":"Có thể tìm hiểu các thông tin và đăng ký khám qua điện thoại, trang tin điện tử của bệnh viện (website) thuận tiện."}]},{"component":"A2","code":"B","title":"Sự minh bạch thông tin và thủ tục khám bệnh, điều trị","items":[{"code":"B1","text":"Quy trình khám bệnh được niêm yết rõ ràng, công khai, dễ hiểu."},{"code":"B2","text":"Các quy trình, thủ tục khám bệnh được cải cách đơn giản, thuận tiện."},{"code":"B3","text":"Giá dịch vụ y tế niêm yết rõ ràng, công khai."},{"code":"B4","text":"Nhân viên y tế tiếp đón, hướng dẫn người bệnh làm các thủ tục niềm nở, tận tình."},{"code":"B5","text":"Được xếp hàng theo thứ tự trước sau khi làm các thủ tục đăng ký, nộp tiền, khám bệnh, xét nghiệm, chiếu chụp."},{"code":"B6","text":"Đánh giá thời gian chờ đợi làm thủ tục đăng ký khám."},{"code":"B7","text":"Đánh giá thời gian chờ tới lượt bác sỹ khám."},{"code":"B8","text":"Đánh giá thời gian được bác sỹ khám và tư vấn."},{"code":"B9","text":"Đánh giá thời gian chờ làm xét nghiệm, chiếu chụp."},{"code":"B10","text":"Đánh giá thời gian chờ nhận kết quả xét nghiệm, chiếu chụp."}]},{"component":"A3","code":"C","title":"Cơ sở vật chất và phương tiện phục vụ người bệnh","items":[{"code":"C1","text":"Có phòng/sảnh chờ khám sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông."},{"code":"C2","text":"Phòng chờ có đủ ghế ngồi cho người bệnh và sử dụng tốt."},{"code":"C3","text":"Phòng chờ có quạt (điều hòa) đầy đủ, hoạt động thường xuyên."},{"code":"C4","text":"Phòng chờ có các phương tiện giúp người bệnh có tâm lý thoải mái như ti-vi, tranh ảnh, tờ rơi, nước uống..."},{"code":"C5","text":"Được bảo đảm sự riêng tư khi khám bệnh, chiếu chụp, làm thủ thuật."},{"code":"C6","text":"Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ."},{"code":"C7","text":"Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp."},{"code":"C8","text":"Khu khám bệnh bảo đảm an ninh, trật tự, phòng ngừa trộm cắp cho người dân."}]},{"component":"A4","code":"D","title":"Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế","items":[{"code":"D1","text":"Nhân viên y tế (bác sỹ, điều dưỡng) có lời nói, thái độ, giao tiếp đúng mực."},{"code":"D2","text":"Nhân viên phục vụ (hộ lý, bảo vệ, kế toán...) có lời nói, thái độ, giao tiếp đúng mực."},{"code":"D3","text":"Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ."},{"code":"D4","text":"Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi."}]},{"component":"A5","code":"E","title":"Kết quả cung cấp dịch vụ","items":[{"code":"E1","text":"Kết quả khám bệnh đã đáp ứng được nguyện vọng của Ông/Bà."},{"code":"E2","text":"Các hóa đơn, phiếu thu, đơn thuốc và kết quả khám bệnh được cung cấp đầy đủ, rõ ràng, minh bạch và được giải thích nếu có thắc mắc."},{"code":"E3","text":"Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế."},{"code":"E4","text":"Đánh giá mức độ hài lòng về giá cả dịch vụ y tế."}]}],"expect":{"code":"F","label":"Đánh giá chung bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi trước khi tới khám bệnh? (điền số từ 0% đến 100% hoặc có thể điền trên 100% nếu bệnh viện điều trị tốt, vượt quá mong đợi của Ông/Bà)"},"return":{"code":"G","label":"Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?","options":[{"v":1,"l":"Chắc chắn không bao giờ quay lại"},{"v":2,"l":"Không muốn quay lại nhưng có ít lựa chọn khác"},{"v":3,"l":"Có thể sẽ quay lại"},{"v":4,"l":"Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác"},{"v":5,"l":"Khác"}]},"comment":{"code":"H","label":"Ông/Bà có ý kiến gì khác, xin ghi rõ?"}}'::jsonb),
  ('nhan_vien', 'Nhân viên y tế', 'PHIẾU KHẢO SÁT Ý KIẾN CỦA NHÂN VIÊN Y TẾ', 'chinh_thuc', 'Phiếu ẩn danh hoàn toàn: không ghi tên, không lưu số điện thoại, không lưu địa chỉ IP.', '{"code":"nhan_vien","name":"Nhân viên y tế","kind":"nvyt","title":"PHIẾU KHẢO SÁT Ý KIẾN CỦA NHÂN VIÊN Y TẾ","source":"QĐ 3869/QĐ-BYT — Mẫu số 3","status":"chinh_thuc","note":"Phiếu ẩn danh hoàn toàn: không ghi tên, không lưu số điện thoại, không lưu địa chỉ IP.","required_counts":{"A1":9,"A2":9,"A3":12,"A4":7,"A5":7},"intro":"Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh và cải tiến môi trường làm việc của nhân viên y tế, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu ý kiến nguyện vọng của nhân viên y tế. Bộ Y tế bảo đảm giữ bí mật thông tin. Rất mong Quý đồng nghiệp trả lời đầy đủ, khách quan, chính xác. Xin trân trọng cảm ơn!","consent":"Tôi đồng ý tham gia khảo sát. Phiếu ẩn danh: hệ thống không ghi tên, số điện thoại hay địa chỉ IP của người trả lời.","phone":false,"anonymous":true,"demographics":[{"code":"gioi_tinh","label":"A1. Giới tính","type":"choice","required":true,"options":[{"v":1,"l":"Nam"},{"v":2,"l":"Nữ"}]},{"code":"tuoi","label":"A2. Tuổi","type":"number","required":true,"min":18,"max":80},{"code":"chuyen_mon","label":"A3. Chuyên môn đào tạo chính","type":"choice","required":false,"options":[{"v":1,"l":"Bác sỹ"},{"v":2,"l":"Dược sỹ"},{"v":3,"l":"Điều dưỡng, hộ sinh"},{"v":4,"l":"Kỹ thuật viên"},{"v":5,"l":"Khác"}]},{"code":"bang_cap","label":"A4. Bằng cấp cao nhất của Ông/Bà","type":"choice","required":false,"options":[{"v":1,"l":"Trung cấp"},{"v":2,"l":"Cao đẳng"},{"v":3,"l":"Đại học"},{"v":4,"l":"Cao học, CKI"},{"v":5,"l":"Tiến sỹ, CKII"},{"v":6,"l":"Khác"}]},{"code":"nam_nganh","label":"A5. Số năm công tác trong ngành Y","type":"number","required":false,"min":0,"max":60},{"code":"nam_don_vi","label":"A6. Số năm công tác tại bệnh viện hiện nay","type":"number","required":false,"min":0,"max":60},{"code":"vi_tri","label":"A7. Vị trí công tác hiện tại","type":"choice","required":false,"options":[{"v":1,"l":"Lãnh đạo bệnh viện"},{"v":2,"l":"Trưởng khoa/phòng/trung tâm"},{"v":3,"l":"Phó khoa/phòng"},{"v":4,"l":"NV biên chế/hợp đồng dài hạn"},{"v":5,"l":"Hợp đồng ngắn hạn"},{"v":6,"l":"Khác"}]},{"code":"pham_vi","label":"A8. Phạm vi hoạt động chuyên môn","type":"choice","required":false,"options":[{"v":1,"l":"Khối hành chính"},{"v":2,"l":"Cận lâm sàng"},{"v":3,"l":"Nội"},{"v":4,"l":"Ngoại"},{"v":5,"l":"Sản"},{"v":6,"l":"Nhi"},{"v":7,"l":"Truyền nhiễm"},{"v":8,"l":"Chuyên khoa lẻ (mắt, TMH, RHM…)"},{"v":9,"l":"Các khoa không trực tiếp KCB"},{"v":10,"l":"Dược"},{"v":11,"l":"Dự phòng"},{"v":12,"l":"Khác"}]},{"code":"kiem_nhiem","label":"A9. Anh/Chị có được phân công kiêm nhiệm nhiều công việc không?","type":"choice","required":false,"options":[{"v":1,"l":"Không kiêm nhiệm"},{"v":2,"l":"Kiêm nhiệm 2 công việc"},{"v":3,"l":"Kiêm nhiệm từ 3 công việc trở lên"}]},{"code":"so_lan_truc","label":"A10. Trung bình Anh/Chị trực mấy lần trong một tháng?","type":"number","required":false,"min":0,"max":31}],"groups":[{"component":"A1","code":"A","title":"Sự hài lòng về môi trường làm việc","items":[{"code":"A1","text":"Phòng làm việc khang trang, sạch sẽ, thoáng mát."},{"code":"A2","text":"Trang thiết bị văn phòng, bàn ghế làm việc... đầy đủ, các thiết bị cũ, lạc hậu được thay thế kịp thời."},{"code":"A3","text":"Có bố trí phòng trực cho NVYT."},{"code":"A4","text":"Phân chia thời gian trực và làm việc ngoài giờ hành chính hợp lý."},{"code":"A5","text":"Các trang bị bảo hộ cho NVYT (quần áo, khẩu trang, găng tay..) đầy đủ, không bị cũ, nhàu nát, không bị hạn chế sử dụng."},{"code":"A6","text":"Môi trường học tập tạo điều kiện cho NVYT cập nhật kiến thức, nâng cao trình độ: thư viện, phòng đọc, tra cứu thông tin, truy cập internet..."},{"code":"A7","text":"Môi trường làm việc bảo đảm an toàn cho NVYT."},{"code":"A8","text":"Bệnh viện bảo đảm an ninh, trật tự cho NVYT làm việc."},{"code":"A9","text":"Người bệnh và người nhà có thái độ tôn trọng, hợp tác với NVYT trong quá trình điều trị."}]},{"component":"A2","code":"B","title":"Sự hài lòng về lãnh đạo trực tiếp, đồng nghiệp","items":[{"code":"B1","text":"Lãnh đạo có năng lực xử lý, điều hành, giải quyết công việc hiệu quả."},{"code":"B2","text":"Lãnh đạo phân công công việc phù hợp với chuyên môn đào tạo của nhân viên."},{"code":"B3","text":"Lãnh đạo quan tâm, tôn trọng, đối xử bình đẳng với các NVYT."},{"code":"B4","text":"Lãnh đạo lắng nghe và tiếp thu ý kiến đóng góp NVYT."},{"code":"B5","text":"Lãnh đạo động viên, khích lệ nhân viên khi hoàn thành tốt nhiệm vụ, có tiến bộ trong công việc."},{"code":"B6","text":"Đồng nghiệp có ý thức hợp tác để hoàn thành nhiệm vụ chung."},{"code":"B7","text":"Môi trường làm việc thân thiện, đoàn kết."},{"code":"B8","text":"Đồng nghiệp chia sẻ kinh nghiệm, giúp đỡ nhau trong công việc."},{"code":"B9","text":"Đồng nghiệp quan tâm, giúp đỡ nhau trong cuộc sống."}]},{"component":"A3","code":"C","title":"Sự hài lòng về quy chế nội bộ, tiền lương, phúc lợi","items":[{"code":"C1","text":"Các quy định, quy chế làm việc nội bộ của bệnh viện rõ ràng, thực tế và công khai."},{"code":"C2","text":"Môi trường làm việc tại khoa/phòng và bệnh viện dân chủ."},{"code":"C3","text":"Quy chế chi tiêu nội bộ công bằng, hợp lý, công khai."},{"code":"C4","text":"Việc phân phối quỹ phúc lợi công bằng, công khai."},{"code":"C5","text":"Mức lương tương xứng so với năng lực và cống hiến."},{"code":"C6","text":"Chế độ phụ cấp nghề và độc hại xứng đáng so với cống hiến."},{"code":"C7","text":"Thưởng và thu nhập tăng thêm ABC xứng đáng so với cống hiến."},{"code":"C8","text":"Cách phân chia thu nhập tăng thêm công bằng, khuyến khích nhân viên làm việc tích cực."},{"code":"C9","text":"Bảo đảm đóng BHXH, BHYT, khám sức khỏe định kỳ và các hình thức hỗ trợ ốm đau, thai sản đầy đủ."},{"code":"C10","text":"Tổ chức tham quan, nghỉ dưỡng đầy đủ."},{"code":"C11","text":"Có phong trào thể thao, văn nghệ tích cực."},{"code":"C12","text":"Công đoàn bệnh viện hoạt động tích cực."}]},{"component":"A4","code":"D","title":"Sự hài lòng về công việc, cơ hội học tập và thăng tiến","items":[{"code":"D1","text":"Khối lượng công việc được giao phù hợp."},{"code":"D2","text":"Công việc chuyên môn đáp ứng nguyện vọng bản thân."},{"code":"D3","text":"Bệnh viện tạo điều kiện cho NVYT nâng cao trình độ chuyên môn."},{"code":"D4","text":"Bệnh viện tạo điều kiện cho NVYT học tiếp các bậc cao hơn."},{"code":"D5","text":"Công khai các tiêu chuẩn cho các chức danh lãnh đạo."},{"code":"D6","text":"Bổ nhiệm các chức danh lãnh đạo dân chủ, công bằng."},{"code":"D7","text":"Có cơ hội thăng tiến khi nỗ lực làm việc."}]},{"component":"A5","code":"E","title":"Sự hài lòng chung về bệnh viện","items":[{"code":"E1","text":"Cảm thấy tự hào khi được làm việc tại bệnh viện."},{"code":"E2","text":"Đạt được những thành công cá nhân khi làm việc tại bệnh viện."},{"code":"E3","text":"Tin tưởng vào sự phát triển của bệnh viện, trong tương lai."},{"code":"E4","text":"Sẽ gắn bó làm việc tại khoa, phòng hiện tại lâu dài."},{"code":"E5","text":"Sẽ gắn bó làm việc tại bệnh viện lâu dài."},{"code":"E6","text":"Mức độ hài lòng nói chung về lãnh đạo bệnh viện."},{"code":"E7","text":"Tự đánh giá về mức độ hoàn thành công việc tại bệnh viện."}]}],"expect":null,"return":null,"comment":{"code":"G","label":"Anh/Chị có ý kiến hoặc đề xuất nào khác với Bộ Y tế và lãnh đạo bệnh viện?"}}'::jsonb),
  ('tcmr', 'Tiêm chủng mở rộng', 'PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI SỬ DỤNG DỊCH VỤ TIÊM CHỦNG MỞ RỘNG', 'ban_nhap', 'Bản nháp — thay bằng mẫu chính thức QĐ 56', '{"code":"tcmr","name":"Tiêm chủng mở rộng","kind":"tcmr","title":"PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI SỬ DỤNG DỊCH VỤ TIÊM CHỦNG MỞ RỘNG","source":"BẢN NHÁP do hệ thống soạn theo cấu trúc QĐ 56 (4/8/12/5/3 tiêu chí)","status":"ban_nhap","note":"Bản nháp — thay bằng mẫu chính thức QĐ 56","required_counts":{"A1":4,"A2":8,"A3":12,"A4":5,"A5":3},"intro":"Nhằm nâng cao chất lượng dịch vụ tiêm chủng mở rộng, ngành y tế tổ chức khảo sát ý kiến của phụ nữ mang thai đi tiêm phòng và người đưa trẻ đi tiêm chủng. Thông tin được giữ bí mật và không ảnh hưởng đến việc tiêm chủng. Xin trân trọng cảm ơn!","consent":"Tôi đồng ý tham gia khảo sát. Tôi đã được biết: việc tham gia là tự nguyện, thông tin được giữ bí mật và chỉ dùng để cải tiến chất lượng dịch vụ; số điện thoại (nếu cung cấp) không được lưu dưới dạng đọc được (Nghị định 13/2023/NĐ-CP).","phone":true,"demographics":[{"code":"nguoi_tra_loi","label":"Người trả lời","type":"choice","required":true,"options":[{"v":1,"l":"Phụ nữ mang thai đi tiêm phòng"},{"v":2,"l":"Người đưa trẻ đi tiêm chủng"}]},{"code":"gioi_tinh","label":"Giới tính","type":"choice","required":true,"options":[{"v":1,"l":"Nam"},{"v":2,"l":"Nữ"}]},{"code":"tuoi","label":"Tuổi","type":"number","required":true,"min":18,"max":120,"hint":"Người trả lời phải từ 18 tuổi trở lên"},{"code":"khoang_cach_km","label":"Ước tính khoảng cách từ nơi sinh sống đến trạm y tế (km)","type":"number","required":false,"min":0,"max":2000}],"groups":[{"component":"A1","code":"A","title":"Khả năng tiếp cận","items":[{"code":"A1","text":"Trạm y tế/điểm tiêm chủng dễ tìm, có biển báo, chỉ dẫn rõ ràng."},{"code":"A2","text":"Lịch tiêm chủng được thông báo kịp thời, đầy đủ (qua loa truyền thanh, tin nhắn, nhân viên y tế thôn bản...)."},{"code":"A3","text":"Thời gian tổ chức buổi tiêm chủng thuận tiện cho người dân."},{"code":"A4","text":"Có thể liên hệ, hỏi thông tin về tiêm chủng qua điện thoại hoặc nhân viên y tế khi cần."}]},{"component":"A2","code":"B","title":"Sự minh bạch thông tin và thủ tục tiêm chủng","items":[{"code":"B1","text":"Quy trình tiêm chủng (đón tiếp, khám sàng lọc, tiêm, theo dõi sau tiêm) được niêm yết rõ ràng, dễ hiểu."},{"code":"B2","text":"Thủ tục đăng ký, đón tiếp đơn giản, nhanh chóng."},{"code":"B3","text":"Được xếp lượt theo thứ tự trước sau."},{"code":"B4","text":"Được thông báo rõ loại vắc xin, bệnh được phòng ngừa và lịch tiêm mũi tiếp theo."},{"code":"B5","text":"Được khám sàng lọc và giải thích kết quả khám sàng lọc trước khi tiêm."},{"code":"B6","text":"Được tư vấn về phản ứng có thể gặp sau tiêm và cách theo dõi, xử trí tại nhà."},{"code":"B7","text":"Thông tin tiêm chủng được ghi đầy đủ vào sổ/phiếu tiêm chủng hoặc hệ thống tiêm chủng điện tử."},{"code":"B8","text":"Đánh giá thời gian chờ đợi từ khi đến đến khi được tiêm."}]},{"component":"A3","code":"C","title":"Cơ sở vật chất và phương tiện phục vụ","items":[{"code":"C1","text":"Khu vực chờ tiêm sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông."},{"code":"C2","text":"Khu vực chờ có đủ ghế ngồi và sử dụng tốt."},{"code":"C3","text":"Có khu vực theo dõi sau tiêm riêng, đủ chỗ ngồi."},{"code":"C4","text":"Có quạt (điều hòa) đầy đủ, hoạt động tốt."},{"code":"C5","text":"Được cung cấp đầy đủ nước uống sạch."},{"code":"C6","text":"Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ."},{"code":"C7","text":"Phòng tiêm sạch sẽ, gọn gàng, bảo đảm vô khuẩn."},{"code":"C8","text":"Có chỗ thay tã, cho trẻ bú hoặc chăm sóc trẻ."},{"code":"C9","text":"Tài liệu truyền thông (tờ rơi, áp phích) về tiêm chủng đầy đủ, dễ hiểu."},{"code":"C10","text":"Được bảo đảm sự riêng tư khi khám sàng lọc và tiêm."},{"code":"C11","text":"Môi trường trong khuôn viên trạm y tế xanh, sạch, đẹp."},{"code":"C12","text":"Bảo đảm an ninh, trật tự, có chỗ để xe an toàn."}]},{"component":"A4","code":"D","title":"Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế","items":[{"code":"D1","text":"Nhân viên y tế có lời nói, thái độ, giao tiếp đúng mực, thân thiện."},{"code":"D2","text":"Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ."},{"code":"D3","text":"Nhân viên y tế thực hiện tiêm thành thạo, nhẹ nhàng, đúng kỹ thuật."},{"code":"D4","text":"Nhân viên y tế sẵn sàng giải đáp thắc mắc."},{"code":"D5","text":"Nhân viên y tế không có biểu hiện gợi ý bồi dưỡng."}]},{"component":"A5","code":"E","title":"Kết quả cung cấp dịch vụ","items":[{"code":"E1","text":"Được tiêm đúng, đủ loại vắc xin theo lịch."},{"code":"E2","text":"Đánh giá mức độ tin tưởng về chất lượng, an toàn của vắc xin và dịch vụ tiêm chủng."},{"code":"E3","text":"Dịch vụ tiêm chủng mở rộng đáp ứng được mong đợi của Ông/Bà."}]}],"expect":{"code":"G1","label":"Đánh giá chung, dịch vụ tiêm chủng đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà? (0% đến 100%, có thể trên 100%)"},"return":{"code":"G2","label":"Ông/Bà có tiếp tục sử dụng dịch vụ tiêm chủng tại đây hoặc giới thiệu cho người khác không?","options":[{"v":1,"l":"Chắc chắn không"},{"v":2,"l":"Không muốn nhưng có ít lựa chọn khác"},{"v":3,"l":"Có thể sẽ tiếp tục"},{"v":4,"l":"Chắc chắn sẽ tiếp tục hoặc giới thiệu cho người khác"},{"v":5,"l":"Khác"}]},"comment":{"code":"H","label":"Ông/Bà có ý kiến gì khác, xin ghi rõ?"}}'::jsonb)
on conflict (code) do nothing;
