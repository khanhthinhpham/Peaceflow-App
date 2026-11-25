-- Hồ sơ thân chủ bên chuyên gia tự cập nhật: từ nay khách tick "đồng ý chia sẻ" khi đặt lịch là bật luôn chia sẻ
-- check-in, bài test và nhật ký cho chuyên gia đó (expert.routes.js, lúc tạo lịch). Migration này làm điều tương tự
-- cho các cặp khách–chuyên gia ĐÃ có lịch hẹn (trừ lịch huỷ / hết hạn / bị từ chối).
-- Chỉ thêm cho cặp CHƯA có dòng nào trong client_expert_shares: cặp đã có dòng là khách từng tự chỉnh công tắc
-- (có thể đã cố ý tắt mục nào đó) → giữ nguyên lựa chọn của khách.
insert into client_expert_shares (client_id, expert_id, share_mood, share_assessments, share_journal, updated_at)
select distinct b.user_id, b.expert_id, true, true, true, now()
from expert_bookings b
where b.status not in ('cancelled', 'expired', 'rejected')
  and b.user_id is not null
on conflict (client_id, expert_id) do nothing;
