insert into public.assessments
(code, name, version, description, question_schema, scoring_rules, interpretation_rules, active)
values
(
  'MMSE',
  'Mini-Mental State Exam',
  '1.0',
  'Trắc nghiệm trạng thái tâm thần tối thiểu — đánh giá chức năng nhận thức (định hướng, trí nhớ, chú ý, ngôn ngữ)',
  '[
    {"key":"q1","label":"Hôm nay là thứ mấy?","type":"binary_0_1"},
    {"key":"q2","label":"Hôm nay là ngày bao nhiêu?","type":"binary_0_1"},
    {"key":"q3","label":"Tháng này là tháng mấy?","type":"binary_0_1"},
    {"key":"q4","label":"Năm nay là năm nào?","type":"binary_0_1"},
    {"key":"q5","label":"Mùa này là mùa gì?","type":"binary_0_1"},
    {"key":"q6","label":"Chỗ này là chỗ nào?","type":"binary_0_1"},
    {"key":"q7","label":"Khoa gì? Tầng mấy?","type":"binary_0_1"},
    {"key":"q8","label":"Tỉnh, thành phố?","type":"binary_0_1"},
    {"key":"q9","label":"Miền nào?","type":"binary_0_1"},
    {"key":"q10","label":"Nước nào?","type":"binary_0_1"},
    {"key":"q11","label":"Nhắc lại 3 từ vừa nghe (con mèo, cây lúa, đồng xu)","type":"scale_0_3"},
    {"key":"q12","label":"Làm phép trừ 7 liên tiếp từ 100 (100-93-86-79-72-65)","type":"scale_0_5"},
    {"key":"q13","label":"Nhớ lại 3 từ đã ghi nhận ở trên","type":"scale_0_3"},
    {"key":"q14","label":"Gọi tên 2 đồ vật (đồng hồ, cây viết)","type":"scale_0_2"},
    {"key":"q15","label":"Nhắc lại câu \"Không có nếu và hoặc nhưng mãi\"","type":"binary_0_1"},
    {"key":"q16","label":"Thực hiện mệnh lệnh 3 bước (cầm giấy - gấp đôi - đưa lại)","type":"scale_0_3"},
    {"key":"q17","label":"Đọc và làm theo mệnh lệnh viết \"Hãy nhắm mắt lại\"","type":"binary_0_1"},
    {"key":"q18","label":"Viết một câu có nghĩa","type":"binary_0_1"},
    {"key":"q19","label":"Vẽ lại 2 hình ngũ giác giao nhau","type":"binary_0_1"}
  ]'::jsonb,
  '{"method":"sum","range":[0,30]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":13,"label":"suy giảm nặng"},
      {"min":14,"max":19,"label":"suy giảm vừa"},
      {"min":20,"max":23,"label":"suy giảm nhẹ"},
      {"min":24,"max":30,"label":"không suy giảm nhận thức"}
    ],
    "higher_is_better":true
  }'::jsonb,
  true
),
(
  'ISI',
  'Insomnia Severity Index',
  '1.0',
  'Trắc nghiệm mức độ mất ngủ — đánh giá bản chất, mức độ nghiêm trọng và tác động của mất ngủ trong 1 tháng qua',
  '[
    {"key":"q1","label":"Khó vào giấc","type":"scale_0_4"},
    {"key":"q2","label":"Khó duy trì giấc","type":"scale_0_4"},
    {"key":"q3","label":"Tỉnh giấc quá sớm","type":"scale_0_4"},
    {"key":"q4","label":"Mức độ hài lòng với giấc ngủ hiện tại","type":"scale_0_4"},
    {"key":"q5","label":"Người khác nhận thấy giấc ngủ ảnh hưởng đến chất lượng cuộc sống của bạn","type":"scale_0_4"},
    {"key":"q6","label":"Mức độ lo lắng/căng thẳng với vấn đề giấc ngủ hiện tại","type":"scale_0_4"},
    {"key":"q7","label":"Mức độ ảnh hưởng đến hoạt động chức năng hằng ngày","type":"scale_0_4"}
  ]'::jsonb,
  '{"method":"sum","range":[0,28]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":7,"label":"không có mất ngủ"},
      {"min":8,"max":14,"label":"mất ngủ mức độ nhẹ"},
      {"min":15,"max":21,"label":"mất ngủ mức độ trung bình"},
      {"min":22,"max":28,"label":"mất ngủ mức độ nghiêm trọng"}
    ]
  }'::jsonb,
  true
),
(
  'IAT',
  'Internet Addiction Test',
  '1.0',
  'Trắc nghiệm đánh giá mức độ nghiện Internet trong tháng qua',
  '[
    {"key":"q1","type":"scale_0_5"},{"key":"q2","type":"scale_0_5"},{"key":"q3","type":"scale_0_5"},
    {"key":"q4","type":"scale_0_5"},{"key":"q5","type":"scale_0_5"},{"key":"q6","type":"scale_0_5"},
    {"key":"q7","type":"scale_0_5"},{"key":"q8","type":"scale_0_5"},{"key":"q9","type":"scale_0_5"},
    {"key":"q10","type":"scale_0_5"},{"key":"q11","type":"scale_0_5"},{"key":"q12","type":"scale_0_5"},
    {"key":"q13","type":"scale_0_5"},{"key":"q14","type":"scale_0_5"},{"key":"q15","type":"scale_0_5"},
    {"key":"q16","type":"scale_0_5"},{"key":"q17","type":"scale_0_5"},{"key":"q18","type":"scale_0_5"},
    {"key":"q19","type":"scale_0_5"},{"key":"q20","type":"scale_0_5"}
  ]'::jsonb,
  '{"method":"sum","range":[0,100]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":30,"label":"sử dụng internet bình thường"},
      {"min":31,"max":49,"label":"phụ thuộc mức độ nhẹ vào internet"},
      {"min":50,"max":79,"label":"phụ thuộc mức độ vừa vào internet"},
      {"min":80,"max":100,"label":"phụ thuộc nghiêm trọng vào internet"}
    ]
  }'::jsonb,
  true
),
(
  'AUDIT',
  'Alcohol Use Disorders Identification Test',
  '1.0',
  'Trắc nghiệm sàng lọc mức độ sử dụng rượu bia trong 12 tháng qua (WHO)',
  '[
    {"key":"q1","label":"Mức độ uống rượu/bia trong 12 tháng qua","type":"scale_0_4"},
    {"key":"q2","label":"Số đơn vị rượu/bia uống trong 1 ngày có uống","type":"scale_0_4"},
    {"key":"q3","label":"Tần suất uống từ 6 đơn vị rượu/bia trở lên trong 1 lần","type":"scale_0_4"},
    {"key":"q4","label":"Tần suất không thể tự dừng uống khi đã bắt đầu","type":"scale_0_4"},
    {"key":"q5","label":"Tần suất không làm được việc đã dự định vì uống rượu/bia","type":"scale_0_4"},
    {"key":"q6","label":"Tần suất cần uống ngay sau khi thức dậy","type":"scale_0_4"},
    {"key":"q7","label":"Tần suất cảm thấy áy náy/day dứt về việc uống rượu/bia","type":"scale_0_4"},
    {"key":"q8","label":"Tần suất không nhớ chuyện gì đã xảy ra sau khi uống","type":"scale_0_4"},
    {"key":"q9","label":"Từng bị thương do uống rượu/bia","type":"scale_0_2"},
    {"key":"q10","label":"Người thân/bác sĩ từng lo ngại và đề nghị giảm uống","type":"scale_0_2"}
  ]'::jsonb,
  '{"method":"sum","range":[0,36]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":7,"label":"uống rượu bia hợp lý, nguy cơ thấp"},
      {"min":8,"max":15,"label":"uống rượu bia ở mức nguy cơ"},
      {"min":16,"max":19,"label":"uống rượu bia ở mức có hại"},
      {"min":20,"max":36,"label":"nghiện hoặc lệ thuộc vào rượu bia"}
    ]
  }'::jsonb,
  true
)
on conflict (code) do update
set
  name = excluded.name,
  version = excluded.version,
  description = excluded.description,
  question_schema = excluded.question_schema,
  scoring_rules = excluded.scoring_rules,
  interpretation_rules = excluded.interpretation_rules,
  active = excluded.active;
