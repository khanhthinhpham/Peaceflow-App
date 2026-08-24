-- Complete the existing expert profile linked to Cao Thi Trang's account.
update experts e
set
  full_name = 'BS. Cao Thị Trang',
  degree = 'Bác sĩ khoa Tâm thần — Bệnh viện Tâm thần Nghệ An · ĐH Y khoa Vinh (2020) · Đang học BSCKI — ĐH Y Dược Hải Phòng',
  avatar_emoji = '👩‍⚕️',
  status = 'offline',
  base_price = 300000,
  location = 'Nghệ An',
  experience_years = 6,
  specialties = '["Rối loạn tâm thần","Lo âu","Trầm cảm","Stress","Mất ngủ","Đau đầu","Động kinh","Đánh giá tâm lý"]'::jsonb,
  tags = '["mental_health","anxiety","depression","stress","sleep"]'::jsonb,
  bio = 'Bác sĩ khoa Tâm thần tại Bệnh viện Tâm thần Nghệ An, có 6 năm kinh nghiệm khám và điều trị người bệnh có các rối loạn tâm thần. Bác sĩ chuyên khám và điều trị các rối loạn tâm thần cấp và mạn tính, rối loạn tâm căn, lo âu, trầm cảm, stress; điều trị đau đầu, mất ngủ, động kinh và thực hiện đánh giá tâm lý.',
  credentials = '["🎓 Bác sĩ đa khoa — Đại học Y khoa Vinh (2020)","📚 Đang học Bác sĩ chuyên khoa I — Đại học Y Dược Hải Phòng","🏥 Thành viên Hội Tâm thần học Việt Nam","📋 Chứng chỉ các trắc nghiệm tâm lý","📜 Chứng chỉ tâm lý lâm sàng"]'::jsonb,
  approaches = '["Khám và điều trị rối loạn tâm thần cấp và mạn tính","Đánh giá tâm lý","Điều trị lo âu, trầm cảm và stress","Điều trị mất ngủ, đau đầu và động kinh"]'::jsonb,
  next_slot_label = 'Chưa cập nhật lịch',
  active = true,
  metadata = coalesce(metadata, '{}'::jsonb) || '{"hospital":"Bệnh viện Tâm thần Nghệ An","featured":false}'::jsonb,
  updated_at = now()
where e.user_id = (
  select u.id from users u
  where lower(u.email) = lower('caotrang22071994@gmail.com')
  limit 1
);
