insert into public.badges (code, name, description, criteria, icon, rarity)
values
('first_task', 'Mầm Non', 'Hoàn thành nhiệm vụ đầu tiên', '{"type":"task_count","value":1}', '🌱', 'common'),
('streak_7', 'Cây Con', 'Duy trì streak 7 ngày', '{"type":"streak","value":7}', '🌿', 'uncommon'),
('streak_30', 'Cây Lớn', 'Duy trì streak 30 ngày', '{"type":"streak","value":30}', '🌳', 'rare'),
('meditate_10', 'Thiền Sư Giấy', 'Hoàn thành 10 bài thiền', '{"type":"task_tag_count","tag":"meditation","value":10}', '🧘', 'rare'),
('hard_5', 'Chiến Binh', 'Hoàn thành 5 nhiệm vụ khó', '{"type":"task_difficulty_count","difficulty":"hard","value":5}', '💪', 'rare'),
('kind_10', 'Người Tử Tế', 'Làm 10 hành động tử tế', '{"type":"task_tag_count","tag":"kindness","value":10}', '❤️', 'uncommon'),
('crisis_over', 'Người Leo Núi', 'Vượt qua giai đoạn khủng hoảng', '{"type":"crisis_recovery","value":1}', '🏔️', 'epic'),
('xp_500', 'Ngôi Sao', 'Đạt 500 XP', '{"type":"xp","value":500}', '🌟', 'rare')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  criteria = excluded.criteria,
  icon = excluded.icon,
  rarity = excluded.rarity;
