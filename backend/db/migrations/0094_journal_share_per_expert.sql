-- Điều 7.3–7.4: nhật ký cũng chỉ chia sẻ cho CHUYÊN GIA CỤ THỂ khách đã bật.
-- Chuyên gia đọc được một bài nhật ký khi CẢ HAI: bài đó được khách đánh dấu chia sẻ
-- (journal_entries.shared_with_experts) VÀ khách đã bật "Nhật ký" cho đúng chuyên gia đó.
alter table client_expert_shares add column if not exists share_journal boolean not null default false;

-- Giữ đúng phạm vi cũ: khách đã có bài nhật ký được chia sẻ thì chỉ bật cho những chuyên gia
-- lúc này ĐANG đọc được (có lịch confirmed/completed) — không mở rộng thêm ai.
insert into client_expert_shares (client_id, expert_id, share_journal)
select distinct b.user_id, b.expert_id, true
from expert_bookings b
where b.status in ('confirmed', 'completed')
  and exists (select 1 from journal_entries j where j.user_id = b.user_id and j.shared_with_experts = true)
on conflict (client_id, expert_id) do update set share_journal = true;
