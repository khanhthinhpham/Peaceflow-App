insert into public.tasks
(code, title, category, difficulty, duration_minutes, xp_reward, description, steps, safety_notes, tags, triggers_supported, contraindications, active, metadata)
values
(
  'E1_SEPARATE_ENV',
  'Tách biệt với môi trường hiện tại',
  'emergency',
  'easy',
  5,
  10,
  'Giảm quá tải cảm giác bằng cách rời khỏi nguồn kích thích hiện tại.',
  '[
    "Dừng tương tác 10–20 giây",
    "Nhủ thầm: mình cần tách ra một chút để ổn định lại",
    "Rời khỏi nguồn căng thẳng nếu có thể",
    "Đặt hai chân chạm đất",
    "Hít vào 4 giây, thở ra 6 giây, lặp lại 5 lần"
  ]'::jsonb,
  '[
    "Đây là công cụ hỗ trợ tức thời, không thay thế chăm sóc y tế",
    "Nếu cảm thấy nguy cơ tự hại, hãy liên hệ hỗ trợ khẩn cấp ngay"
  ]'::jsonb,
  '["emergency","grounding","sensory_overload"]'::jsonb,
  '["sensory_overload","conflict","panic","crowd"]'::jsonb,
  '[]'::jsonb,
  true,
  '{"source":"tasks-data.js","legacy_code":"E1"}'::jsonb
),
(
  'E2_DEEP_BREATHING',
  'Hít thở sâu',
  'breathing',
  'easy',
  2,
  10,
  'Bài tập thở ngắn giúp hoạt hóa hệ thần kinh đối giao cảm.',
  '[
    "Ngồi thẳng lưng",
    "Đặt tay lên bụng",
    "Hít vào 4 giây",
    "Giữ 4 giây",
    "Thở ra 4 giây",
    "Lặp lại 5 chu kỳ"
  ]'::jsonb,
  '[
    "Nếu chóng mặt, giảm tốc độ hoặc dừng lại",
    "Nếu đang có khó thở cấp tính, cần tìm hỗ trợ y tế"
  ]'::jsonb,
  '["breathing","micro_task","emergency"]'::jsonb,
  '["anxiety","panic","overwhelm"]'::jsonb,
  '[]'::jsonb,
  true,
  '{"source":"tasks-data.js","legacy_code":"E2"}'::jsonb
),
(
  'E4_SLOW_SPEAKING',
  'Chú tâm nói chậm lại',
  'mindfulness',
  'easy',
  2,
  10,
  'Điều hòa nhịp thở thông qua việc giảm tốc độ nói.',
  '[
    "Dừng 5 giây trước khi trả lời",
    "Nói chậm hơn bình thường 20–30%",
    "Ưu tiên câu ngắn",
    "Quan sát nhịp thở khi nói"
  ]'::jsonb,
  '["Nếu đang tranh cãi căng thẳng, ưu tiên tách khỏi môi trường trước"]'::jsonb,
  '["mindfulness","speech_regulation","micro_task"]'::jsonb,
  '["anxiety","anger","conflict"]'::jsonb,
  '[]'::jsonb,
  true,
  '{"source":"tasks-data.js","legacy_code":"E4"}'::jsonb
),
(
  'S1_NO_SCREEN_BEFORE_SLEEP',
  'Tránh thiết bị trước khi ngủ',
  'sleep',
  'easy',
  15,
  15,
  'Giảm kích thích não bộ và ánh sáng xanh trước giờ ngủ.',
  '[
    "Tắt điện thoại hoặc để xa khỏi giường",
    "Ngừng màn hình ít nhất 15 phút",
    "Chuyển sang ánh sáng dịu",
    "Nghe nhạc nhẹ hoặc đọc vài trang sách"
  ]'::jsonb,
  '["Không cần hoàn hảo, chỉ cần tốt hơn hôm qua"]'::jsonb,
  '["sleep","digital_hygiene"]'::jsonb,
  '["sleep_loss","fatigue","night_anxiety"]'::jsonb,
  '[]'::jsonb,
  true,
  '{"source":"tasks-data.js","legacy_code":"S1"}'::jsonb
),
(
  'R1_SELF_REFLECTION',
  'Tự phản tư ngắn trước khi ngủ',
  'reflection',
  'easy',
  5,
  12,
  'Viết ngắn 3 điều trong ngày để giảm nhiễu tâm trí trước khi ngủ.',
  '[
    "Hôm nay điều gì khiến mình mệt?",
    "Điều gì mình đã làm đủ tốt?",
    "Ngày mai mình chỉ cần cải thiện một điều gì?"
  ]'::jsonb,
  '["Nếu nội dung gợi khủng hoảng mạnh, nên chuyển sang bài thở hoặc liên hệ người tin tưởng"]'::jsonb,
  '["reflection","journal","sleep_support"]'::jsonb,
  '["self_criticism","night_overthinking","stress"]'::jsonb,
  '[]'::jsonb,
  true,
  '{"source":"normalized_seed"}'::jsonb
),
(
  'M1_WARM_SHOWER',
  'Tắm nước ấm thư giãn',
  'sleep',
  'medium',
  10,
  20,
  'Thư giãn cơ thể, hỗ trợ chuyển trạng thái trước giấc ngủ.',
  '[
    "Chuẩn bị nước ấm vừa phải",
    "Tập trung cảm nhận nhiệt độ dễ chịu",
    "Kết thúc bằng 2 phút hít thở chậm"
  ]'::jsonb,
  '["Không dùng nước quá nóng", "Không áp dụng nếu cơ thể đang mệt kiệt sức hoặc chóng mặt"]'::jsonb,
  '["sleep","body_relax","recovery"]'::jsonb,
  '["sleep_loss","body_tension","stress"]'::jsonb,
  '[]'::jsonb,
  true,
  '{"source":"normalized_seed"}'::jsonb
)
on conflict (code) do update
set
  title = excluded.title,
  category = excluded.category,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  xp_reward = excluded.xp_reward,
  description = excluded.description,
  steps = excluded.steps,
  safety_notes = excluded.safety_notes,
  tags = excluded.tags,
  triggers_supported = excluded.triggers_supported,
  contraindications = excluded.contraindications,
  active = excluded.active,
  metadata = excluded.metadata,
  updated_at = now();
