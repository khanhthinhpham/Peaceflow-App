-- Chuyên gia chờ duyệt giờ vẫn đăng nhập & dùng app user bình thường.
-- Trạng thái duyệt được theo dõi qua expert_applications + bảng experts,
-- không khoá đăng nhập bằng users.status nữa.
update users set status = 'active'
where status = 'pending' and role = 'expert';
