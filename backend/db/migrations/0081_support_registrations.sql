-- "Phiếu đăng ký hỗ trợ" — form RIÊNG BIỆT với phiếu khảo sát/sàng lọc đầu năm (bảng
-- screening_responses ở migration 0080). Form này cho học sinh/phụ huynh/giáo viên chủ
-- động đăng ký hỗ trợ cụ thể cho 1 học sinh, không phải khảo sát định kỳ toàn trường.
-- Công khai, không cần đăng nhập. Dùng chung bảng screening_schools cho danh sách trường.

create table if not exists support_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null, -- có thể null (chưa đăng nhập)

  email text not null,
  informant text not null check (informant in ('hoc_sinh', 'cha_me', 'giao_vien', 'khac')),
  informant_other text,

  school_id uuid references screening_schools(id) on delete set null,
  school_other text, -- khi chọn "Khác" thay vì 1 trong danh sách

  grade text,         -- '6'..'12'
  grade_other text,
  class_name text not null,
  student_name text not null, -- "Họ tên học sinh cần hỗ trợ" — có thể khác người điền

  issue_categories jsonb not null default '[]'::jsonb, -- hoc_tap/huong_nghiep/giao_tiep/phat_trien_ban_than
  issue_categories_other text,
  issue_description text not null,

  risk_level text check (risk_level in ('xanh', 'vang', 'do', 'khac')),
  risk_level_other text,

  support_format jsonb not null default '[]'::jsonb, -- tai_lieu/tu_van_truong/ket_noi_chuyen_gia/ho_tro_khan
  support_format_other text,

  phone text not null,
  consent boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_support_registrations_school on support_registrations(school_id, created_at desc);
create index if not exists idx_support_registrations_risk on support_registrations(risk_level);
