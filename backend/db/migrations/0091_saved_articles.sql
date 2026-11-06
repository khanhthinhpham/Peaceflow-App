-- Bài viết người dùng đã lưu (trang Cảm hứng). Khách chưa đăng nhập vẫn đọc được mọi bài;
-- chỉ khi bấm "Lưu" mới cần đăng nhập.
create table if not exists saved_articles (
  user_id uuid not null references users(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create index if not exists idx_saved_articles_user_created on saved_articles(user_id, created_at desc);

-- backend kết nối bằng quyền chủ bảng nên không bị RLS chặn; bật để PostgREST/anon không đọc được (xem 0050)
alter table saved_articles enable row level security;
