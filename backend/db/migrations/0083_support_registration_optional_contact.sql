-- Email/SĐT giờ chỉ bắt buộc khi người điền là cha mẹ/giáo viên — học sinh tự điền thì
-- không bắt buộc (xem logic ở support-registration.routes.js).
alter table support_registrations
  alter column email drop not null,
  alter column phone drop not null;
