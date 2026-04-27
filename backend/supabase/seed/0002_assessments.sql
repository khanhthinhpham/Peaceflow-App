insert into public.assessments
(code, name, version, description, question_schema, scoring_rules, interpretation_rules, active)
values
(
  'GAD7',
  'Generalized Anxiety Disorder 7',
  '1.0',
  'Sàng lọc mức độ lo âu trong 2 tuần gần đây',
  '[
    {"key":"q1","label":"Cảm thấy lo lắng, bồn chồn hoặc căng thẳng","type":"scale_0_3"},
    {"key":"q2","label":"Không thể ngừng hoặc kiểm soát sự lo lắng","type":"scale_0_3"},
    {"key":"q3","label":"Lo lắng quá nhiều về nhiều việc khác nhau","type":"scale_0_3"},
    {"key":"q4","label":"Khó thư giãn","type":"scale_0_3"},
    {"key":"q5","label":"Bồn chồn đến mức khó ngồi yên","type":"scale_0_3"},
    {"key":"q6","label":"Dễ cáu gắt hoặc khó chịu","type":"scale_0_3"},
    {"key":"q7","label":"Cảm thấy sợ hãi như có điều tồi tệ sắp xảy ra","type":"scale_0_3"}
  ]'::jsonb,
  '{"method":"sum","range":[0,21]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":4,"label":"minimal"},
      {"min":5,"max":9,"label":"mild"},
      {"min":10,"max":14,"label":"moderate"},
      {"min":15,"max":21,"label":"severe"}
    ]
  }'::jsonb,
  true
),
(
  'PHQ9',
  'Patient Health Questionnaire 9',
  '1.0',
  'Sàng lọc triệu chứng trầm cảm trong 2 tuần gần đây',
  '[
    {"key":"q1","label":"Ít hứng thú hoặc ít niềm vui khi làm mọi việc","type":"scale_0_3"},
    {"key":"q2","label":"Cảm thấy buồn, chán nản hoặc tuyệt vọng","type":"scale_0_3"},
    {"key":"q3","label":"Khó ngủ, ngủ không yên hoặc ngủ quá nhiều","type":"scale_0_3"},
    {"key":"q4","label":"Cảm thấy mệt mỏi hoặc ít năng lượng","type":"scale_0_3"},
    {"key":"q5","label":"Ăn kém ngon hoặc ăn quá nhiều","type":"scale_0_3"},
    {"key":"q6","label":"Cảm thấy bản thân tệ, thất bại hoặc làm gia đình thất vọng","type":"scale_0_3"},
    {"key":"q7","label":"Khó tập trung vào việc đọc báo hoặc xem TV","type":"scale_0_3"},
    {"key":"q8","label":"Di chuyển/nói chậm bất thường hoặc bồn chồn hơn thường lệ","type":"scale_0_3"},
    {"key":"q9","label":"Có ý nghĩ rằng tốt hơn là nên chết đi hoặc tự làm hại bản thân","type":"scale_0_3"}
  ]'::jsonb,
  '{"method":"sum","range":[0,27]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":4,"label":"minimal"},
      {"min":5,"max":9,"label":"mild"},
      {"min":10,"max":14,"label":"moderate"},
      {"min":15,"max":19,"label":"moderately_severe"},
      {"min":20,"max":27,"label":"severe"}
    ],
    "critical_item":"q9"
  }'::jsonb,
  true
),
(
  'DASS21',
  'Depression Anxiety Stress Scales 21',
  '1.0',
  'Thang sàng lọc stress, lo âu và trầm cảm',
  '[
    {"key":"q1","dimension":"stress","type":"scale_0_3"},
    {"key":"q2","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q3","dimension":"depression","type":"scale_0_3"},
    {"key":"q4","dimension":"stress","type":"scale_0_3"},
    {"key":"q5","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q6","dimension":"depression","type":"scale_0_3"},
    {"key":"q7","dimension":"stress","type":"scale_0_3"},
    {"key":"q8","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q9","dimension":"depression","type":"scale_0_3"},
    {"key":"q10","dimension":"stress","type":"scale_0_3"},
    {"key":"q11","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q12","dimension":"depression","type":"scale_0_3"},
    {"key":"q13","dimension":"stress","type":"scale_0_3"},
    {"key":"q14","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q15","dimension":"depression","type":"scale_0_3"},
    {"key":"q16","dimension":"stress","type":"scale_0_3"},
    {"key":"q17","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q18","dimension":"depression","type":"scale_0_3"},
    {"key":"q19","dimension":"stress","type":"scale_0_3"},
    {"key":"q20","dimension":"anxiety","type":"scale_0_3"},
    {"key":"q21","dimension":"depression","type":"scale_0_3"}
  ]'::jsonb,
  '{"method":"sum_by_dimension_x2"}'::jsonb,
  '{
    "dimensions":["stress","anxiety","depression"]
  }'::jsonb,
  true
),
(
  'PSQI',
  'Pittsburgh Sleep Quality Index',
  '1.0',
  'Đánh giá chất lượng giấc ngủ',
  '[
    {"key":"sleep_duration","type":"number"},
    {"key":"sleep_latency","type":"number"},
    {"key":"sleep_disturbance","type":"scale_0_3"},
    {"key":"daytime_dysfunction","type":"scale_0_3"}
  ]'::jsonb,
  '{"method":"psqi_custom"}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":4,"label":"good"},
      {"min":5,"max":10,"label":"poor"},
      {"min":11,"max":21,"label":"very_poor"}
    ]
  }'::jsonb,
  true
),
(
  'HARS',
  'Hamilton Anxiety Rating Scale',
  '1.0',
  'Đánh giá mức độ lo âu dựa trên nhiều chiều',
  '[
    {"key":"q1","type":"scale_0_4"},
    {"key":"q2","type":"scale_0_4"},
    {"key":"q3","type":"scale_0_4"},
    {"key":"q4","type":"scale_0_4"},
    {"key":"q5","type":"scale_0_4"},
    {"key":"q6","type":"scale_0_4"},
    {"key":"q7","type":"scale_0_4"},
    {"key":"q8","type":"scale_0_4"},
    {"key":"q9","type":"scale_0_4"},
    {"key":"q10","type":"scale_0_4"},
    {"key":"q11","type":"scale_0_4"},
    {"key":"q12","type":"scale_0_4"},
    {"key":"q13","type":"scale_0_4"},
    {"key":"q14","type":"scale_0_4"}
  ]'::jsonb,
  '{"method":"sum","range":[0,56]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":17,"label":"mild"},
      {"min":18,"max":24,"label":"mild_to_moderate"},
      {"min":25,"max":30,"label":"moderate_to_severe"},
      {"min":31,"max":56,"label":"severe"}
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
