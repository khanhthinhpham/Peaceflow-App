-- Thông báo người dùng VUỐT ẨN thủ công trên panel chuông — ẩn trên MỌI thiết bị đã đăng
-- nhập (khác với "đã đọc", chỉ dùng để tắt badge số). Dùng bảng riêng, khóa theo id THÔ mà
-- client đang thấy (vd 'booking-<group_key>', 'badge-<tên>-<ts>', 'checkin-reminder'...)
-- thay vì sửa bảng `notifications` hiện có, vì nhiều loại thông báo (nhắc check-in, streak,
-- huy hiệu) không có dòng thật nào trong đó để gắn cờ — xem giải thích ở migration 0054.
--
-- Hệ quả CHẤP NHẬN ĐƯỢC của cách làm này: id một số loại đổi theo dữ liệu mới nhất trong
-- nhóm (vd có hoạt động mới thì group lại có created_at/id mới) — nghĩa là ẩn 1 thông báo
-- nhóm sẽ tự "hết hạn" nếu sau đó nhóm có HOẠT ĐỘNG MỚI thật sự. Đây là hành vi ĐÚNG mong
-- muốn: thông tin mới thì nên hiện lại, không nên bị ẩn vĩnh viễn theo nhầm 1 id cũ.
create table if not exists notification_hidden (
  user_id uuid not null references users(id) on delete cascade,
  notif_id text not null,
  hidden_at timestamptz not null default now(),
  primary key (user_id, notif_id)
);

create index on notification_hidden(user_id);

alter table notification_hidden enable row level security;
