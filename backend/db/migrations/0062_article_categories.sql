create table if not exists article_categories (
  id uuid primary key default gen_random_uuid(),
  key varchar(50) unique not null,
  label varchar(100) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into article_categories (key, label, sort_order) values
  ('giam_cang_thang', 'Giảm căng thẳng', 1),
  ('giac_ngu', 'Giấc ngủ', 2),
  ('cau_chuyen_that', 'Câu chuyện thật', 3),
  ('ky_nang_song', 'Kỹ năng sống', 4),
  ('suc_khoe_tinh_than', 'Sức khoẻ tinh thần', 5),
  ('khac', 'Khác', 99)
on conflict (key) do nothing;
