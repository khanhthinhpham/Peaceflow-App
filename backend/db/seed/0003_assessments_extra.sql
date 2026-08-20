insert into public.assessments
(code, name, version, description, question_schema, scoring_rules, interpretation_rules, active)
values
(
  'PSS',
  'Perceived Stress Scale',
  '1.0',
  'Thang đo mức độ stress cảm nhận trong 1 tháng gần đây',
  '[
    {"key":"q1","label":"Buồn phiền vì điều gì đó bất ngờ xảy ra","type":"scale_0_4"},
    {"key":"q2","label":"Cảm thấy không thể kiểm soát được những việc quan trọng trong cuộc sống","type":"scale_0_4"},
    {"key":"q3","label":"Cảm thấy lo lắng và căng thẳng","type":"scale_0_4"},
    {"key":"q4","label":"Tự tin về khả năng xử lý các vấn đề cá nhân","type":"scale_0_4","reverse":true},
    {"key":"q5","label":"Cảm thấy mọi việc diễn ra theo ý mình","type":"scale_0_4","reverse":true},
    {"key":"q6","label":"Cảm thấy không thể đương đầu với tất cả những việc phải làm","type":"scale_0_4"},
    {"key":"q7","label":"Kiểm soát được những cơn cáu gắt trong cuộc sống","type":"scale_0_4","reverse":true},
    {"key":"q8","label":"Cảm thấy mình đang ở trên đỉnh của mọi thứ","type":"scale_0_4","reverse":true},
    {"key":"q9","label":"Tức giận vì những việc xảy ra ngoài tầm kiểm soát","type":"scale_0_4"},
    {"key":"q10","label":"Cảm thấy khó khăn chồng chất đến mức không thể vượt qua","type":"scale_0_4"}
  ]'::jsonb,
  '{"method":"sum_with_reverse_items","reverse_items":["q4","q5","q7","q8"],"range":[0,40]}'::jsonb,
  '{
    "bands":[
      {"min":0,"max":13,"label":"thấp"},
      {"min":14,"max":26,"label":"trung bình"},
      {"min":27,"max":40,"label":"nghiêm trọng"}
    ]
  }'::jsonb,
  true
),
(
  'SDQ25',
  'SDQ-25 (Tự đánh giá)',
  '1.0',
  'Bảng hỏi Điểm mạnh và Khó khăn — dành cho thanh thiếu niên tự đánh giá',
  '[
    {"key":"q1","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q2","dimension":"hyperactivity","type":"scale_0_2"},
    {"key":"q3","dimension":"emotional","type":"scale_0_2"},
    {"key":"q4","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q5","dimension":"conduct","type":"scale_0_2"},
    {"key":"q6","dimension":"peer","type":"scale_0_2"},
    {"key":"q7","dimension":"conduct","type":"scale_0_2","reverse":true},
    {"key":"q8","dimension":"emotional","type":"scale_0_2"},
    {"key":"q9","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q10","dimension":"hyperactivity","type":"scale_0_2"},
    {"key":"q11","dimension":"peer","type":"scale_0_2","reverse":true},
    {"key":"q12","dimension":"conduct","type":"scale_0_2"},
    {"key":"q13","dimension":"emotional","type":"scale_0_2"},
    {"key":"q14","dimension":"peer","type":"scale_0_2","reverse":true},
    {"key":"q15","dimension":"hyperactivity","type":"scale_0_2"},
    {"key":"q16","dimension":"emotional","type":"scale_0_2"},
    {"key":"q17","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q18","dimension":"conduct","type":"scale_0_2"},
    {"key":"q19","dimension":"peer","type":"scale_0_2"},
    {"key":"q20","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q21","dimension":"hyperactivity","type":"scale_0_2","reverse":true},
    {"key":"q22","dimension":"conduct","type":"scale_0_2"},
    {"key":"q23","dimension":"peer","type":"scale_0_2","reverse":true},
    {"key":"q24","dimension":"emotional","type":"scale_0_2"},
    {"key":"q25","dimension":"hyperactivity","type":"scale_0_2","reverse":true}
  ]'::jsonb,
  '{"method":"sdq_dimension_sum"}'::jsonb,
  '{
    "dimensions":["emotional","conduct","hyperactivity","peer","prosocial"],
    "total_excludes":["prosocial"],
    "cutoffs":{"emotional":4,"conduct":3,"hyperactivity":6,"peer":3,"prosocial_low":5}
  }'::jsonb,
  true
),
(
  'SDQ25_OBS',
  'SDQ-25 (Bản quan sát)',
  '1.0',
  'Bảng hỏi Điểm mạnh và Khó khăn — dành cho cán bộ tâm lý/chuyên gia chấm dựa trên quan sát',
  '[
    {"key":"q1","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q2","dimension":"hyperactivity","type":"scale_0_2"},
    {"key":"q3","dimension":"emotional","type":"scale_0_2"},
    {"key":"q4","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q5","dimension":"conduct","type":"scale_0_2"},
    {"key":"q6","dimension":"peer","type":"scale_0_2"},
    {"key":"q7","dimension":"conduct","type":"scale_0_2","reverse":true},
    {"key":"q8","dimension":"emotional","type":"scale_0_2"},
    {"key":"q9","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q10","dimension":"hyperactivity","type":"scale_0_2"},
    {"key":"q11","dimension":"peer","type":"scale_0_2","reverse":true},
    {"key":"q12","dimension":"conduct","type":"scale_0_2"},
    {"key":"q13","dimension":"emotional","type":"scale_0_2"},
    {"key":"q14","dimension":"peer","type":"scale_0_2","reverse":true},
    {"key":"q15","dimension":"hyperactivity","type":"scale_0_2"},
    {"key":"q16","dimension":"emotional","type":"scale_0_2"},
    {"key":"q17","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q18","dimension":"conduct","type":"scale_0_2"},
    {"key":"q19","dimension":"peer","type":"scale_0_2"},
    {"key":"q20","dimension":"prosocial","type":"scale_0_2"},
    {"key":"q21","dimension":"hyperactivity","type":"scale_0_2","reverse":true},
    {"key":"q22","dimension":"conduct","type":"scale_0_2"},
    {"key":"q23","dimension":"peer","type":"scale_0_2","reverse":true},
    {"key":"q24","dimension":"emotional","type":"scale_0_2"},
    {"key":"q25","dimension":"hyperactivity","type":"scale_0_2","reverse":true}
  ]'::jsonb,
  '{"method":"sdq_dimension_sum"}'::jsonb,
  '{
    "dimensions":["emotional","conduct","hyperactivity","peer","prosocial"],
    "total_excludes":["prosocial"],
    "cutoffs":{"emotional":4,"conduct":3,"hyperactivity":6,"peer":3,"prosocial_low":5},
    "administered_by_role":"expert"
  }'::jsonb,
  true
),
(
  'CARS',
  'Childhood Autism Rating Scale',
  '1.0',
  'Thang đánh giá mức độ tự kỷ — 15 lĩnh vực, do chuyên gia quan sát và chấm điểm',
  '[
    {"key":"d1","label":"Quan hệ với mọi người","type":"scale_1_4_half"},
    {"key":"d2","label":"Bắt chước","type":"scale_1_4_half"},
    {"key":"d3","label":"Đáp ứng cảm xúc","type":"scale_1_4_half"},
    {"key":"d4","label":"Động tác cơ thể","type":"scale_1_4_half"},
    {"key":"d5","label":"Sử dụng đồ vật","type":"scale_1_4_half"},
    {"key":"d6","label":"Thích nghi với sự thay đổi","type":"scale_1_4_half"},
    {"key":"d7","label":"Đáp ứng nhìn","type":"scale_1_4_half"},
    {"key":"d8","label":"Đáp ứng nghe","type":"scale_1_4_half"},
    {"key":"d9","label":"Nếm, ngửi và đáp ứng xúc giác","type":"scale_1_4_half"},
    {"key":"d10","label":"Sợ hãi và lo lắng","type":"scale_1_4_half"},
    {"key":"d11","label":"Giao tiếp có lời","type":"scale_1_4_half"},
    {"key":"d12","label":"Giao tiếp không lời","type":"scale_1_4_half"},
    {"key":"d13","label":"Mức độ hoạt động","type":"scale_1_4_half"},
    {"key":"d14","label":"Mức độ và sự ổn định của đáp ứng trí tuệ","type":"scale_1_4_half"},
    {"key":"d15","label":"Ấn tượng chung","type":"scale_1_4_half"}
  ]'::jsonb,
  '{"method":"sum","range":[15,60]}'::jsonb,
  '{
    "bands":[
      {"min":15,"max":29.5,"label":"không có tự kỷ"},
      {"min":30,"max":36.5,"label":"tự kỷ mức độ nhẹ và vừa"},
      {"min":37,"max":60,"label":"tự kỷ mức độ nặng"}
    ],
    "administered_by_role":"expert"
  }'::jsonb,
  true
),
(
  'RAVEN_CPM',
  'Coloured Progressive Matrices',
  '1.0',
  'Trắc nghiệm ma trận tiến bộ màu (Raven) — 36 câu, chưa hỗ trợ tự chấm điểm tự động',
  '[
    {"key":"raven_36_items","type":"image_choice","count":36,"note":"Xem question_schema chi tiết ở phía frontend (frontend/public/assets/raven)"}
  ]'::jsonb,
  '{"method":"none","note":"Cần chuyên gia đối chiếu đáp án gốc từ manual bản quyền để chấm điểm"}'::jsonb,
  '{"scored":false}'::jsonb,
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
