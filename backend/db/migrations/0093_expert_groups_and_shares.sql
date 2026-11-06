-- (1) Điều 2.4–2.5 Điều khoản: hồ sơ chuyên gia ghi rõ thuộc nhóm nào + phạm vi dịch vụ được phép;
--     "Người hành nghề" phải có giấy phép + tên cơ sở khám bệnh, chữa bệnh hiển thị trước khi đặt lịch.
--     Do PeaceFlow (admin) xác minh và nhập — chuyên gia không tự sửa được (Điều 3.1).
alter table experts add column if not exists expert_group text;
alter table experts add column if not exists service_scope text;
alter table experts add column if not exists license_number text;
alter table experts add column if not exists clinic_name text;
alter table experts add column if not exists classified_at timestamptz;
do $$ begin
  alter table experts add constraint experts_group_chk check (expert_group in ('counselor', 'practitioner'));
exception when duplicate_object then null; end $$;
-- Chuyên gia hiện có: mặc định nhóm hạn chế hơn ("Chuyên gia tư vấn tâm lý" — không chẩn đoán/kê đơn/điều trị).
-- Admin nâng lên "Người hành nghề" sau khi kiểm tra giấy phép + cơ sở.
update experts set expert_group = 'counselor' where expert_group is null;
alter table experts alter column expert_group set default 'counselor';
alter table experts alter column expert_group set not null;

-- (2) Điều 7.3: check-in tâm trạng / kết quả sàng lọc chỉ chia sẻ cho CHUYÊN GIA CỤ THỂ khách đã bật.
--     Thay cho công tắc toàn cục user_profiles.share_mood_with_experts / share_assessments_with_experts.
create table if not exists client_expert_shares (
  client_id uuid not null references users(id) on delete cascade,
  expert_id uuid not null references experts(id) on delete cascade,
  share_mood boolean not null default false,
  share_assessments boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (client_id, expert_id)
);
create index if not exists idx_client_expert_shares_expert on client_expert_shares(expert_id);
alter table client_expert_shares enable row level security;

-- Giữ đúng phạm vi khách đã đồng ý trước đây: ai đã bật công tắc chung thì chỉ chuyển thành chia sẻ cho
-- những chuyên gia lúc đó ĐANG xem được (có lịch confirmed/completed) — không mở rộng thêm ai.
insert into client_expert_shares (client_id, expert_id, share_mood, share_assessments)
select distinct b.user_id, b.expert_id,
       coalesce(p.share_mood_with_experts, false), coalesce(p.share_assessments_with_experts, false)
from expert_bookings b
join user_profiles p on p.user_id = b.user_id
where b.status in ('confirmed', 'completed')
  and (coalesce(p.share_mood_with_experts, false) or coalesce(p.share_assessments_with_experts, false))
on conflict (client_id, expert_id) do nothing;

-- Đồng ý chia sẻ theo từng chuyên gia cũng được ghi vào nhật ký đồng ý.
alter table user_consents drop constraint if exists user_consents_kind_check;
alter table user_consents add constraint user_consents_kind_check
  check (kind in ('terms', 'sensitive_data', 'booking', 'share_record', 'expert_share'));
