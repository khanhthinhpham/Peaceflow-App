-- Ngôn ngữ ưa thích của người dùng, lưu bền trong DB — cần cho các tác vụ KHÔNG có sẵn
-- request hiện tại để đọc x-locale (email giao dịch, push notification gửi từ webhook
-- thanh toán/cron nhắc nhở...). Khác với locale ở request (chỉ có khi user đang thao tác
-- trực tiếp), cột này là nơi duy nhất backend biết được ngôn ngữ của một user offline.
--
-- Điền lần đầu = locale suy đoán theo IP lúc đăng ký (detectLocale() trong
-- auth.controller.js); sau đó user tự đổi ở LanguageSwitcher sẽ ghi đè qua PATCH /me/locale.
alter table users add column if not exists locale varchar(5);
