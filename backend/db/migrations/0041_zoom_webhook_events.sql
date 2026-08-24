alter table expert_bookings
  add column if not exists zoom_last_event varchar(64),
  add column if not exists zoom_last_event_at timestamptz,
  add column if not exists zoom_started_at timestamptz,
  add column if not exists zoom_ended_at timestamptz;
