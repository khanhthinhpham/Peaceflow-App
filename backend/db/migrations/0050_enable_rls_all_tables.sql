-- Bật Row Level Security cho toàn bộ bảng public đang hở qua PostgREST của Supabase.
-- Không thêm policy nào (deny-by-default với anon/authenticated PostgREST) — vì:
--   1) Backend Express kết nối trực tiếp bằng quyền chủ sở hữu bảng (connection pooler
--      postgres.<ref>) — RLS KHÔNG áp dụng cho chủ sở hữu bảng, nên hành vi backend không đổi.
--   2) Ứng dụng không dùng PostgREST/anon key để đọc/ghi bất kỳ bảng nào ở đây — chỉ dùng
--      Supabase Realtime cho bảng `notifications` (đã có RLS + policy riêng từ trước).
alter table ai_summary_cache enable row level security;
alter table ai_usage_logs enable row level security;
alter table ai_user_insights enable row level security;
alter table assessment_result_shares enable row level security;
alter table assessment_results enable row level security;
alter table assessments enable row level security;
alter table audit_logs enable row level security;
alter table badges enable row level security;
alter table booking_medical_records enable row level security;
alter table community_comments enable row level security;
alter table community_posts enable row level security;
alter table community_reactions enable row level security;
alter table community_reports enable row level security;
alter table email_verification_tokens enable row level security;
alter table emergency_logs enable row level security;
alter table expert_applications enable row level security;
alter table expert_availability enable row level security;
alter table expert_bookings enable row level security;
alter table expert_ledger enable row level security;
alter table expert_payouts enable row level security;
alter table expert_reviews enable row level security;
alter table experts enable row level security;
alter table journal_entries enable row level security;
alter table mood_checkins enable row level security;
alter table password_reset_tokens enable row level security;
alter table payments enable row level security;
alter table push_subscriptions enable row level security;
alter table recommendation_logs enable row level security;
alter table refresh_tokens enable row level security;
alter table risk_snapshots enable row level security;
alter table schema_migrations enable row level security;
alter table task_completions enable row level security;
alter table tasks enable row level security;
alter table user_badges enable row level security;
alter table user_journals enable row level security;
alter table user_profiles enable row level security;
alter table user_progress enable row level security;
alter table user_task_assignments enable row level security;
alter table users enable row level security;
alter table wallet_transactions enable row level security;
