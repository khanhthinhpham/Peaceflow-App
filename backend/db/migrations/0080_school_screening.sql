-- Phiếu khảo sát/sàng lọc đầu năm cho học sinh/sinh viên (HSSV) — theo mẫu Google Form
-- "GF01_KhaoSatNhuCauHoTroHocSinhDauNam_TVHD_NgheAn" nhà trường gửi. Form công khai, không
-- cần đăng nhập (học sinh có thể chưa có tài khoản PeaceFlow).

-- Danh sách trường tham gia — quản lý qua trang admin, nhà trường sẽ bổ sung dần.
create table if not exists screening_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Mỗi lượt học sinh nộp phiếu — gộp cả phần tự khai (Phần 1-5) và phiếu đăng ký hỗ trợ
-- (Phần 6-7) vì trên form gốc là MỘT luồng liên tục, cùng 1 người điền.
create table if not exists screening_responses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references screening_schools(id) on delete set null,
  user_id uuid references users(id) on delete set null, -- có thể null (chưa đăng nhập)

  -- Phần 1: thông tin chung
  student_name text,
  grade text,         -- "Khối" (6-12)
  class_name text,    -- "Lớp"
  gender text,        -- 'male' | 'female' | 'unspecified'
  contact text,        -- SĐT/email liên hệ (tuỳ chọn)

  -- Phần 2: 6 câu Likert 1-5 — cảm nhận chung về học tập/cuộc sống. Điểm càng CAO = càng
  -- ổn (mỗi câu đã diễn đạt theo chiều tích cực, giống bản gốc).
  wellbeing_scores jsonb not null default '[]'::jsonb, -- [5,4,3,5,2,4]
  wellbeing_total int not null default 0,               -- tổng 6 câu, 6-30 điểm
  -- Xếp màu theo NGƯỠNG trường cho: <=10 đỏ (cần ưu tiên), 11-19 vàng (cần quan tâm),
  -- 20-30 xanh (mức nhẹ) — tính server-side, không nhận từ client.
  risk_band text not null default 'xanh' check (risk_band in ('xanh', 'vang', 'do')),

  -- Phần 3: khó khăn đang gặp (chọn nhiều, key cố định + "khác" tự do)
  difficulties jsonb not null default '[]'::jsonb,
  difficulties_other text,

  -- Phần 4: nhu cầu hỗ trợ mong muốn (chọn nhiều + "khác")
  support_needs jsonb not null default '[]'::jsonb,
  support_needs_other text,

  -- Phần 5: chia sẻ thêm + đồng ý được liên hệ
  share_note text,
  consent_contact boolean not null default false,

  -- Phần 6: phiếu đăng ký hỗ trợ (học sinh tự chọn vấn đề + mức độ theo mô tả gợi ý)
  referral_categories jsonb not null default '[]'::jsonb, -- hoc_tap/huong_nghiep/giao_tiep/phat_trien_ban_than
  referral_risk_level text check (referral_risk_level in ('xanh', 'vang', 'do')),
  referral_support_format jsonb not null default '[]'::jsonb, -- tai_lieu/tu_van_truong/ket_noi_chuyen_gia/ho_tro_khan
  referral_phone text,
  referral_description text,

  -- Phần 7: xác nhận + chia sẻ thêm (nếu có)
  confirm_note text,

  created_at timestamptz not null default now()
);

create index if not exists idx_screening_responses_school on screening_responses(school_id, created_at desc);
create index if not exists idx_screening_responses_risk on screening_responses(risk_band);

-- 6 trường trong ảnh mẫu nhà trường gửi — bổ sung/sửa qua trang admin, đây chỉ là seed khởi điểm.
insert into screening_schools (name) values
  ('THCS Diễn Tháp'),
  ('THCS Hạnh Thiết'),
  ('THCS Hiến Sơn'),
  ('THPT Cửa Lò 2'),
  ('THPT Con Cuông'),
  ('THPT Kỳ Sơn')
on conflict do nothing;
