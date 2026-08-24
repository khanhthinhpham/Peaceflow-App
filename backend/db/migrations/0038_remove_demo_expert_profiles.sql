-- Remove the three unverified seed/demo expert profiles completely.
delete from experts e
where e.code in ('hai-yen', 'lan-anh', 'van-minh')
  and not exists (
    select 1 from expert_bookings b where b.expert_id = e.id
  );

-- If a future environment has dependent bookings, hide the demo profile
-- instead of deleting historical booking references.
update experts
set active = false, updated_at = now()
where code in ('hai-yen', 'lan-anh', 'van-minh');
