import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { buildUserContext, invalidateContext } from './ai.context.js';
import { getRecommendedTask, getWeeklyInsight, getChatReply, getStoredUserInsight, generateUserInsight, MAX_CHAT_HISTORY } from './ai.service.js';
import { estimateCostUsd, USD_TO_VND } from './ai.usage.js';
import { createAiRateLimit } from './ai.ratelimit.js';

const router = Router();

// Giới hạn: mỗi user tối đa 20 lần gọi AI / 1 giờ.
// Đếm trong DB, KHÔNG dùng express-rate-limit nữa: memory store mặc định của nó đếm riêng
// trên từng serverless container của Vercel nên giới hạn cũ không có tác dụng toàn cục —
// xem ai.ratelimit.js.
const aiRateLimit = createAiRateLimit(20);

// GET /me/ai-context — trả về dữ liệu context thô (debug / frontend dùng)
router.get('/me/ai-context', requireAuth, async (req, res) => {
    try {
        const ctx = await buildUserContext(req.user.sub);
        return res.json({ success: true, data: ctx });
    } catch (error) {
        console.error('[AI] context error:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải dữ liệu context.' });
    }
});

function serializeInsight(insight) {
    if (!insight) return null;
    return {
        summary: insight.summary,
        generated_at: insight.generatedAt,
        changed: insight.changed ?? null,
        exercises: (insight.exercises || []).map((t) => ({
            id: t.id,
            title: t.title,
            category: t.category,
            difficulty: t.difficulty,
            duration_minutes: t.duration_minutes,
            xp_reward: t.xp_reward,
            icon: t.icon,
            reason: t.reason
        }))
    };
}

// GET /ai/insight — đọc lời khuyên đã lưu lần trước. KHÔNG gọi AI, không tốn token.
// Dashboard dùng cái này lúc mở trang để hiển thị lại lời khuyên cũ.
router.get('/ai/insight', requireAuth, async (req, res) => {
    try {
        const insight = await getStoredUserInsight(req.user.sub);
        return res.json({ success: true, data: serializeInsight(insight) });
    } catch (error) {
        console.error('[AI] get insight error:', error);
        return res.status(500).json({ success: false, message: 'Không tải được lời khuyên.' });
    }
});

// POST /ai/insight — người dùng bấm nút xin lời khuyên.
// Dữ liệu chưa thay đổi đáng kể so với lần chạy gần nhất => trả lại đúng lời khuyên cũ
// (changed = false, không gọi AI). Đã thay đổi => gọi AI sinh mới (changed = true).
router.post('/ai/insight', requireAuth, aiRateLimit, async (req, res) => {
    try {
        const insight = await generateUserInsight(req.user.sub);
        return res.json({ success: true, data: serializeInsight(insight) });
    } catch (error) {
        console.error('[AI] generate insight error:', error);
        return res.status(500).json({ success: false, message: 'Không thể tạo lời khuyên lúc này.' });
    }
});

// POST /ai/recommend-task — gợi ý bài tập phù hợp hôm nay
router.post('/ai/recommend-task', requireAuth, aiRateLimit, async (req, res) => {
    try {
        const recommendation = await getRecommendedTask(req.user.sub);
        return res.json({ success: true, data: recommendation });
    } catch (error) {
        console.error('[AI] recommend-task error:', error);
        return res.status(500).json({ success: false, message: 'Không thể tạo gợi ý lúc này.' });
    }
});

// POST /ai/weekly-insight — nhận xét tuần
router.post('/ai/weekly-insight', requireAuth, aiRateLimit, async (req, res) => {
    try {
        const insight = await getWeeklyInsight(req.user.sub);
        return res.json({ success: true, data: { insight } });
    } catch (error) {
        console.error('[AI] weekly-insight error:', error);
        return res.status(500).json({ success: false, message: 'Không thể tạo nhận xét lúc này.' });
    }
});

const MAX_CHAT_MESSAGE_LENGTH = 500;

// POST /ai/chat — chat nhiều lượt với PeaceCat AI (dùng chung rate limit AI hiện có)
router.post('/ai/chat', requireAuth, aiRateLimit, async (req, res) => {
    try {
        const message = String(req.body?.message || '').trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
        if (!message) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung.' });
        }

        // Lọc history do client gửi lên trước khi dùng:
        //  - Cắt độ dài TỪNG lượt bằng đúng mức của tin nhắn mới. Trước đây chỉ `message`
        //    bị cắt 500 ký tự, còn history thì không giới hạn gì (MAX_CHAT_HISTORY chỉ
        //    giới hạn SỐ lượt) — client gửi 6 lượt mỗi lượt vài chục KB là prompt phình,
        //    token nổ, tiền thật.
        //  - Chỉ giữ đúng role + text. Các cờ hadSuggestion/offeredTask client gửi kèm bị
        //    BỎ HẲN: server tự nhớ trong DB (xem readChatTurnState), vì client sửa cờ là
        //    tự mở khoá được danh sách bài tập.
        // Vẫn phải nhận nội dung history từ client vì app cố ý không lưu nội dung chat ở
        // server (xem getChatReply) — đánh đổi đã biết: client vẫn có thể bơm lượt "model"
        // giả vào ngữ cảnh.
        const history = (Array.isArray(req.body?.history) ? req.body.history : [])
            .slice(-MAX_CHAT_HISTORY)
            .filter((item) => item && typeof item.text === 'string' && item.text.trim())
            .map((item) => ({
                role: item.role === 'user' ? 'user' : 'model',
                text: item.text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH)
            }));

        const result = await getChatReply({ userId: req.user.sub, message, history });

        return res.json({
            success: true,
            data: {
                reply: result.reply,
                suggested_task: result.suggestedTask
                    ? {
                        id: result.suggestedTask.id,
                        title: result.suggestedTask.title,
                        category: result.suggestedTask.category,
                        duration_minutes: result.suggestedTask.duration_minutes,
                        xp_reward: result.suggestedTask.xp_reward,
                        icon: result.suggestedTask.icon
                    }
                    : null,
                suggested_expert: result.suggestedExpert
                    ? {
                        id: result.suggestedExpert.id,
                        name: result.suggestedExpert.full_name,
                        degree: result.suggestedExpert.degree,
                        rating: result.suggestedExpert.rating
                    }
                    : null,
                offered_task: result.offeredTask,
                // Server đã xác nhận có dấu hiệu tự hại/tự tử trong tin nhắn — client nào
                // cũng bật được UI khẩn cấp dựa vào cờ này, không chỉ dựa vào bộ từ khoá
                // riêng phía client.
                crisis: result.crisis,
                mood_analysis: result.moodAnalysis
            }
        });
    } catch (error) {
        console.error('[AI] chat error:', error);
        return res.status(500).json({ success: false, message: 'Không thể trả lời lúc này.' });
    }
});

// POST /ai/context/invalidate — xóa cache khi user update dữ liệu
router.post('/ai/context/invalidate', requireAuth, (req, res) => {
    invalidateContext(req.user.sub);
    return res.json({ success: true });
});

// ===================== ADMIN: QUẢN LÝ SỬ DỤNG AI =====================
// Dữ liệu lấy từ bảng ai_usage_logs (chỉ siêu dữ liệu + từ khóa chủ đề, KHÔNG có nội
// dung tin nhắn — xem giải thích ở migration 0044).

function requireAdmin(req, res) {
    if (!req.user.is_admin) {
        res.status(403).json({ success: false, message: 'Admin only' });
        return false;
    }
    return true;
}

function parseDays(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 30;
    return Math.min(365, Math.max(1, Math.round(n)));
}

// GET /admin/ai/overview?days=30 — thẻ số liệu + biểu đồ theo ngày + tách theo tính năng
router.get('/admin/ai/overview', requireAuth, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const days = parseDays(req.query.days);
        const since = `${days} days`;

        const [totalsRes, byFeatureRes, byDayRes, byModelRes] = await Promise.all([
            db.query(
                `select
                   count(*)::int as calls,
                   count(*) filter (where success = false)::int as errors,
                   count(*) filter (where from_cache)::int as cache_hits,
                   count(distinct user_id)::int as users,
                   coalesce(sum(prompt_tokens), 0)::bigint as prompt_tokens,
                   coalesce(sum(output_tokens), 0)::bigint as output_tokens,
                   coalesce(sum(cached_tokens), 0)::bigint as cached_tokens,
                   coalesce(round(avg(latency_ms)), 0)::int as avg_latency_ms
                 from ai_usage_logs
                 where created_at >= now() - $1::interval`,
                [since]
            ),
            db.query(
                `select feature,
                        count(*)::int as calls,
                        count(*) filter (where success = false)::int as errors,
                        coalesce(sum(prompt_tokens), 0)::bigint as prompt_tokens,
                        coalesce(sum(output_tokens), 0)::bigint as output_tokens,
                        coalesce(sum(cached_tokens), 0)::bigint as cached_tokens,
                        coalesce(round(avg(latency_ms)), 0)::int as avg_latency_ms
                 from ai_usage_logs
                 where created_at >= now() - $1::interval
                 group by feature
                 order by calls desc`,
                [since]
            ),
            db.query(
                `select d::date as day,
                        coalesce(l.calls, 0)::int as calls,
                        coalesce(l.errors, 0)::int as errors,
                        coalesce(l.prompt_tokens, 0)::bigint as prompt_tokens,
                        coalesce(l.output_tokens, 0)::bigint as output_tokens,
                        coalesce(l.cached_tokens, 0)::bigint as cached_tokens
                 from generate_series(
                        (now() - $1::interval) at time zone 'Asia/Ho_Chi_Minh',
                        now() at time zone 'Asia/Ho_Chi_Minh',
                        interval '1 day'
                      ) as d
                 left join (
                   select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
                          count(*)::int as calls,
                          count(*) filter (where success = false)::int as errors,
                          sum(prompt_tokens)::bigint as prompt_tokens,
                          sum(output_tokens)::bigint as output_tokens,
                          sum(cached_tokens)::bigint as cached_tokens
                   from ai_usage_logs
                   where created_at >= now() - $1::interval
                   group by 1
                 ) l on l.day = d::date
                 order by day asc`,
                [since]
            ),
            db.query(
                `select coalesce(model, '(không rõ)') as model,
                        count(*)::int as calls,
                        coalesce(sum(prompt_tokens), 0)::bigint as prompt_tokens,
                        coalesce(sum(output_tokens), 0)::bigint as output_tokens,
                        coalesce(sum(cached_tokens), 0)::bigint as cached_tokens
                 from ai_usage_logs
                 where created_at >= now() - $1::interval
                 group by 1
                 order by calls desc`,
                [since]
            )
        ]);

        const withCost = (row) => {
            const usd = estimateCostUsd({
                model: row.model,
                promptTokens: Number(row.prompt_tokens || 0),
                outputTokens: Number(row.output_tokens || 0),
                cachedTokens: Number(row.cached_tokens || 0)
            });
            return { ...row, cost_usd: Number(usd.toFixed(6)), cost_vnd: Math.round(usd * USD_TO_VND) };
        };

        // Chi phí tổng tính theo từng model rồi cộng lại (mỗi model một mức giá khác nhau).
        const modelRows = byModelRes.rows.map(withCost);
        const totalUsd = modelRows.reduce((sum, r) => sum + r.cost_usd, 0);
        const totals = totalsRes.rows[0] || {};

        // Tiết kiệm nhờ cache: mỗi lượt lấy từ cache tốn 0 token, nên phần tiết kiệm được
        // ước tính bằng (số lượt cache) × (chi phí trung bình của 1 lượt gọi AI thật).
        const paidCalls = Number(totals.calls || 0) - Number(totals.cache_hits || 0);
        const avgCostVnd = paidCalls > 0 ? (totalUsd * USD_TO_VND) / paidCalls : 0;
        const savedVnd = Math.round(Number(totals.cache_hits || 0) * avgCostVnd);

        return res.json({
            success: true,
            data: {
                days,
                totals: {
                    ...totals,
                    error_rate: totals.calls ? Number(((totals.errors / totals.calls) * 100).toFixed(1)) : 0,
                    cache_rate: totals.calls ? Number(((totals.cache_hits / totals.calls) * 100).toFixed(1)) : 0,
                    saved_vnd: savedVnd,
                    cost_usd: Number(totalUsd.toFixed(6)),
                    cost_vnd: Math.round(totalUsd * USD_TO_VND)
                },
                by_feature: byFeatureRes.rows.map((r) => withCost({ ...r, model: null })),
                by_day: byDayRes.rows,
                by_model: modelRows
            }
        });
    } catch (error) {
        console.error('[AI] admin overview error:', error);
        return res.status(500).json({ success: false, message: 'Không tải được số liệu AI.' });
    }
});

// GET /admin/ai/top-users?days=30&limit=10 — ai dùng AI nhiều nhất
router.get('/admin/ai/top-users', requireAuth, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const days = parseDays(req.query.days);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

        const { rows } = await db.query(
            `select l.user_id,
                    coalesce(u.display_name, u.full_name, u.email, '(đã xoá)') as name,
                    u.email,
                    count(*)::int as calls,
                    count(*) filter (where l.success = false)::int as errors,
                    coalesce(sum(l.prompt_tokens), 0)::bigint as prompt_tokens,
                    coalesce(sum(l.output_tokens), 0)::bigint as output_tokens,
                    coalesce(sum(l.cached_tokens), 0)::bigint as cached_tokens,
                    max(l.created_at) as last_used_at
             from ai_usage_logs l
             left join users u on u.id = l.user_id
             where l.created_at >= now() - $1::interval
             group by l.user_id, u.display_name, u.full_name, u.email
             order by calls desc
             limit $2`,
            [`${days} days`, limit]
        );

        return res.json({
            success: true,
            data: {
                days,
                users: rows.map((r) => {
                    const usd = estimateCostUsd({
                        promptTokens: Number(r.prompt_tokens || 0),
                        outputTokens: Number(r.output_tokens || 0),
                        cachedTokens: Number(r.cached_tokens || 0)
                    });
                    return { ...r, cost_vnd: Math.round(usd * USD_TO_VND) };
                })
            }
        });
    } catch (error) {
        console.error('[AI] admin top-users error:', error);
        return res.status(500).json({ success: false, message: 'Không tải được danh sách người dùng.' });
    }
});

// GET /admin/ai/topics?days=30&limit=20 — chủ đề được hỏi nhiều nhất
router.get('/admin/ai/topics', requireAuth, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const days = parseDays(req.query.days);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const { rows } = await db.query(
            `select topic, count(*)::int as count, count(distinct user_id)::int as users
             from (
               select jsonb_array_elements_text(topics) as topic, user_id
               from ai_usage_logs
               where created_at >= now() - $1::interval
                 and jsonb_array_length(topics) > 0
             ) t
             group by topic
             order by count desc
             limit $2`,
            [`${days} days`, limit]
        );

        return res.json({ success: true, data: { days, topics: rows } });
    } catch (error) {
        console.error('[AI] admin topics error:', error);
        return res.status(500).json({ success: false, message: 'Không tải được chủ đề.' });
    }
});

// GET /admin/ai/logs?limit=25&offset=0&feature=chat&status=error&q=<ten hoac email>
// Log chi tiết từng lần gọi. Tham số q để tra một người cụ thể đã dùng AI làm những gì.
router.get('/admin/ai/logs', requireAuth, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

        const conditions = [];
        const params = [];
        if (req.query.feature) {
            params.push(req.query.feature);
            conditions.push(`l.feature = $${params.length}`);
        }
        if (req.query.status === 'error') conditions.push('l.success = false');
        if (req.query.status === 'success') conditions.push('l.success = true');

        const search = String(req.query.q || '').trim();
        if (search) {
            // Tìm theo tên hiển thị / tên đầy đủ / email.
            // Escape \, % và _ để người gõ "a_b" hay "giảm 50%" không bị LIKE hiểu thành
            // ký tự đại diện (nếu không, gõ "%" sẽ khớp toàn bộ log).
            const escaped = search.replace(/[\\%_]/g, (ch) => `\\${ch}`);
            params.push(`%${escaped}%`);
            const p = params.length;
            conditions.push(
                `(u.display_name ilike $${p} escape '\\'
                  or u.full_name ilike $${p} escape '\\'
                  or u.email ilike $${p} escape '\\')`
            );
        }
        const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

        // Câu đếm cũng phải join users, vì điều kiện tìm kiếm tham chiếu tới u.*
        const countRes = await db.query(
            `select count(*)::int as total
             from ai_usage_logs l
             left join users u on u.id = l.user_id
             ${where}`,
            params
        );

        params.push(limit);
        params.push(offset);
        const { rows } = await db.query(
            `select l.id, l.feature, l.model, l.prompt_tokens, l.output_tokens, l.cached_tokens,
                    l.latency_ms, l.success, l.error_message, l.topics, l.created_at,
                    coalesce(u.display_name, u.full_name, u.email, '(đã xoá)') as user_name,
                    u.email as user_email
             from ai_usage_logs l
             left join users u on u.id = l.user_id
             ${where}
             order by l.created_at desc
             limit $${params.length - 1} offset $${params.length}`,
            params
        );

        return res.json({
            success: true,
            data: {
                total: countRes.rows[0]?.total || 0,
                limit,
                offset,
                logs: rows.map((r) => {
                    const usd = estimateCostUsd({
                        model: r.model,
                        promptTokens: Number(r.prompt_tokens || 0),
                        outputTokens: Number(r.output_tokens || 0),
                        cachedTokens: Number(r.cached_tokens || 0)
                    });
                    return { ...r, cost_vnd: Math.round(usd * USD_TO_VND) };
                })
            }
        });
    } catch (error) {
        console.error('[AI] admin logs error:', error);
        return res.status(500).json({ success: false, message: 'Không tải được log AI.' });
    }
});

export default router;
