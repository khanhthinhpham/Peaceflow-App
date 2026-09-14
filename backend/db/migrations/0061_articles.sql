create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  category varchar(50) not null default 'khac',
  content text not null,
  cover_image bytea,
  cover_image_mime varchar(100),
  status varchar(20) not null default 'draft',
  author_name varchar(120) not null default 'Đội ngũ PeaceFlow',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_articles_status_published on articles(status, published_at desc);
create index if not exists idx_articles_category on articles(category);
