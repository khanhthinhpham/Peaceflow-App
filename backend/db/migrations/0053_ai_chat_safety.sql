-- Ba việc, phục vụ 3 lỗ hổng đã xác định trong module AI:
--
-- 1) ai_rate_limits — bộ đếm rate limit AI theo cửa sổ giờ, lưu trong DB.
--    Trước đây dùng express-rate-limit với memory store mặc định: trên Vercel mỗi
--    serverless container giữ bộ đếm riêng, nên "20 lần/giờ" KHÔNG phải giới hạn toàn
--    cục — người dùng gọi song song vào nhiều container là vượt được. Với tính năng
--    đốt tiền theo token thì đây là rủi ro chi phí thật.
--
-- 2) ai_chat_turn_state — trạng thái lượt chat trước của mỗi người dùng.
--    Trước đây 2 cờ này (đã hỏi ý gợi ý bài tập / đã gắn thẻ) do CLIENT gửi kèm history,
--    nên client chỉ cần sửa offeredTask = true là tự mở khoá được danh sách bài tập —
--    đúng thứ mà code đang cố "chặn cứng" ở server.
--    CỐ Ý chỉ lưu 2 cờ điều khiển luồng + thời điểm, KHÔNG lưu nội dung tin nhắn, giữ
--    đúng nguyên tắc "không lưu nội dung chat" của app (xem getChatReply trong
--    ai.service.js và migration 0044).
--
-- RLS: bật, không thêm policy — theo đúng lý do đã ghi ở migration 0050 (backend kết nối
-- bằng quyền chủ sở hữu bảng nên không bị RLS chặn; PostgREST/anon thì deny-by-default).

create table if not exists ai_rate_limits (
  user_id uuid not null references users(id) on delete cascade,
  -- Cửa sổ cố định, làm tròn về đầu giờ (date_trunc('hour', now())).
  window_start timestamptz not null,
  count int not null default 0,
  primary key (user_id, window_start)
);

-- Phục vụ việc dọn các cửa sổ đã hết hạn.
create index if not exists idx_ai_rate_limits_window on ai_rate_limits (window_start);

create table if not exists ai_chat_turn_state (
  user_id uuid primary key references users(id) on delete cascade,
  -- Lượt trước AI đã HỎI "bạn có muốn mình gợi ý một việc nhỏ không?" hay chưa.
  offered_task boolean not null default false,
  -- Lượt trước AI đã gắn thẻ bài tập/chuyên gia hay chưa.
  had_suggestion boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table ai_rate_limits enable row level security;
alter table ai_chat_turn_state enable row level security;
