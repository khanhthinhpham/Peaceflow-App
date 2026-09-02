-- Cho phép một tài khoản có quyền admin CỘNG THÊM vào role chính (vd: role = 'expert' vẫn
-- giữ nguyên quyền chuyên gia, nhưng thêm is_admin = true để cũng có quyền admin) — không đổi
-- cột role hiện có (đang bị ràng buộc check role in ('user','expert','admin'), 1 giá trị duy nhất).
alter table users add column if not exists is_admin boolean not null default false;
