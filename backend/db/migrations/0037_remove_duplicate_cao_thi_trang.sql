-- Remove the temporary public duplicate; keep the account-linked expert profile.
delete from experts e
where e.code = 'cao-thi-trang'
  and e.user_id is null
  and not exists (
    select 1 from expert_bookings b where b.expert_id = e.id
  );
