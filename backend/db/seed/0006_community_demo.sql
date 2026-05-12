insert into community_posts (
  author_name,
  author_avatar,
  content,
  category,
  tags,
  is_anonymous,
  is_positive,
  created_at
)
values
(
  'Bông hoa ẩn danh',
  '🌸',
  'Hôm nay mình đã hoàn thành bài thiền đầu tiên sau 2 tuần bỏ lỡ. Không hoàn hảo, tâm trí vẫn lang thang nhiều lần, nhưng mình đã ngồi xuống. Đó là điều quan trọng nhất. Cảm ơn cộng đồng này vì đã nhắc mình rằng bắt đầu lại không có nghĩa là thất bại.',
  'gratitude',
  '["#biếtơn"]'::jsonb,
  true,
  true,
  now() - interval '5 minutes'
),
(
  'Ngôi sao đêm',
  '🌙',
  'Mọi người có mẹo gì để giảm lo âu trước khi ngủ không? Mình đã thử bài thở 4-7-8 nhưng chỉ hiệu quả một chút. Nếu ai có cách nào nhẹ nhàng hơn, mình muốn thử.',
  'question',
  '["#hỏiđáp"]'::jsonb,
  true,
  true,
  now() - interval '3 hours'
),
(
  'Hoa mùa xuân',
  '🌺',
  'Mẹo nhỏ mình dùng khi stress đỉnh điểm là 5-4-3-2-1 grounding: 5 thứ nhìn thấy, 4 thứ nghe thấy, 3 thứ chạm vào, 2 thứ ngửi được và 1 thứ nếm được. Cách này kéo mình về hiện tại rất nhanh.',
  'tip',
  '["#mẹohay"]'::jsonb,
  true,
  true,
  now() - interval '5 hours'
)
on conflict do nothing;
