-- Dữ liệu thô (chưa ghép câu) cho các thông báo có chèn nội dung động (tên người, số
-- tiền, trạng thái...) — trước đây các notify()/insertNotification() ghép sẵn thành 1
-- câu tiếng Việt hoàn chỉnh rồi lưu vào `message`, không thể dịch lại được nữa vì phần
-- biến và phần chữ đã trộn lẫn. Giờ lưu thêm `params` (vd {code, clientName, amount...}),
-- để lúc ĐỌC (GET /notifications) mới ghép câu theo đúng req.locale.
--
-- `message` vẫn giữ nguyên làm fallback cho: thông báo cũ đã tạo trước migration này (không
-- có params), và các type/code chưa được liệt kê trong notification-messages.js.
alter table notifications add column if not exists params jsonb;
