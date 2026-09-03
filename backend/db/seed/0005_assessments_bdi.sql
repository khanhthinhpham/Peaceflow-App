insert into public.assessments
(code, name, version, description, question_schema, scoring_rules, interpretation_rules, active)
values
(
  'BDI',
  'Beck Depression Inventory',
  '1.0',
  'Thang đánh giá trầm cảm Beck — 21 câu, tự đánh giá',
  '[
    {"key":"q1","label":"Cảm xúc buồn","type":"scale_0_3"},
    {"key":"q2","label":"Bi quan về tương lai","type":"scale_0_3"},
    {"key":"q3","label":"Cảm giác thất bại","type":"scale_0_3"},
    {"key":"q4","label":"Mất hứng thú và khả năng cảm nhận sự hài lòng","type":"scale_0_3"},
    {"key":"q5","label":"Cảm giác có lỗi","type":"scale_0_3"},
    {"key":"q6","label":"Cảm giác bị trừng phạt","type":"scale_0_3"},
    {"key":"q7","label":"Không hài lòng với bản thân","type":"scale_0_3"},
    {"key":"q8","label":"Tự phê phán bản thân","type":"scale_0_3"},
    {"key":"q9","label":"Ý nghĩ về cái chết hoặc tự sát","type":"scale_0_3"},
    {"key":"q10","label":"Khóc","type":"scale_0_3"},
    {"key":"q11","label":"Dễ cáu gắt","type":"scale_0_3"},
    {"key":"q12","label":"Mất hứng thú với người khác","type":"scale_0_3"},
    {"key":"q13","label":"Khó khăn trong việc ra quyết định","type":"scale_0_3"},
    {"key":"q14","label":"Thay đổi về ngoại hình","type":"scale_0_3"},
    {"key":"q15","label":"Khả năng làm việc","type":"scale_0_3"},
    {"key":"q16","label":"Giấc ngủ","type":"scale_0_3"},
    {"key":"q17","label":"Mệt mỏi","type":"scale_0_3"},
    {"key":"q18","label":"Cảm giác thèm ăn","type":"scale_0_3"},
    {"key":"q19","label":"Thay đổi cân nặng","type":"scale_0_3"},
    {"key":"q20","label":"Lo lắng về sức khỏe","type":"scale_0_3"},
    {"key":"q21","label":"Hứng thú tình dục","type":"scale_0_3"}
  ]'::jsonb,
  '{"method":"sum","range":[0,63]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":10,"label":"normal"},
      {"min":11,"max":16,"label":"mild_mood_disturbance"},
      {"min":17,"max":20,"label":"borderline_clinical"},
      {"min":21,"max":30,"label":"moderate"},
      {"min":31,"max":40,"label":"severe"},
      {"min":41,"max":63,"label":"extreme"}
    ],
    "critical_item":"q9"
  }'::jsonb,
  true
)
on conflict (code) do nothing;
