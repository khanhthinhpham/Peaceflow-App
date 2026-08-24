alter table expert_bookings
  add column if not exists zoom_meeting_id varchar(64),
  add column if not exists zoom_join_url text,
  add column if not exists zoom_start_url text,
  add column if not exists zoom_password varchar(64);

create unique index if not exists idx_expert_bookings_zoom_meeting_id
  on expert_bookings(zoom_meeting_id)
  where zoom_meeting_id is not null;
