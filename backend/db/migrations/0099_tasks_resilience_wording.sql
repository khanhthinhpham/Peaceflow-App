-- Bỏ chữ "chữa lành / healing" khỏi nội dung hiển thị, thay bằng "khả năng phục hồi / resilience".
-- Nhiệm vụ 1.38 (bản tiếng Anh, thêm ở 0056): "helps that child heal" → "helps that child recover", khớp bản tiếng
-- Việt ("giúp bạn hồi phục tâm lý cho đứa trẻ này"). Chỉ đổi đúng cụm đó; chạy lại không đổi gì thêm.
update tasks
set title_en = replace(title_en, 'helps that child heal,', 'helps that child recover,')
where code = '1.38'
  and title_en like '%helps that child heal,%';
