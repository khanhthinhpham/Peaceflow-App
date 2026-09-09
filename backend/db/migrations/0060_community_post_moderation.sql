-- Mọi bài đăng Cộng đồng mới phải qua admin duyệt trước khi hiển thị công khai. Bài CŨ (đã
-- tồn tại trước migration này) mặc định 'approved' để không bị ẩn hàng loạt — chỉ bài MỚI từ
-- nay trở đi mới được code insert với 'pending' tường minh.
alter table community_posts add column if not exists moderation_status varchar(20) not null default 'approved';
alter table community_posts add column if not exists moderated_at timestamptz;
alter table community_posts add column if not exists moderated_by uuid references users(id);

create index if not exists idx_community_posts_moderation_status on community_posts(moderation_status);
