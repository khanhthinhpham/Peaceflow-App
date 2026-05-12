create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ENUMS
do $$ begin
  create type user_status as enum ('active', 'inactive', 'suspended', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('assigned', 'in_progress', 'completed', 'skipped', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crisis_level as enum ('low', 'moderate', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type emergency_event_type as enum ('hotline_view', 'breathing_tool', 'panic_mode', 'trusted_contact', 'expert_request', 'crisis_flag');
exception when duplicate_object then null; end $$;
