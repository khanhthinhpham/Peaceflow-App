import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { buildUserContext, invalidateContext } from './ai.context.js';
import { getDailyMessage, getRecommendedTask, getWeeklyInsight } from './ai.service.js';

const router = Router();

// Giới hạn: mỗi user tối đa 20 lần gọi AI / 1 giờ
const aiRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.sub ?? req.ip,
    message: { success: false, message: 'Bạn đã gọi AI quá nhiều lần. Vui lòng thử lại sau.' },
    standardHeaders: true,
    legacyHeaders: false,
});

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

// key: userId → { result, contextHash }
// Chỉ gọi Gemini khi context thực sự thay đổi (không phụ thuộc ngày)
const _dailyMessageCache = new Map();

// POST /ai/daily-message — lời nhắn buổi sáng cá nhân hóa
router.post('/ai/daily-message', requireAuth, aiRateLimit, async (req, res) => {
    try {
        const ctx = await buildUserContext(req.user.sub);
        const contextHash = JSON.stringify(ctx);

        const cached = _ragCache.get(req.user.sub);
        if (cached && cached.contextHash === contextHash) {
            return res.json({ success: true, data: cached.result });
        }

        const result = await getDailyMessage(req.user.sub, ctx);
        _ragCache.set(req.user.sub, { result, contextHash });
        return res.json({ success: true, data: result });
    } catch (error) {
        console.error('[AI] daily-message error:', error);
        return res.status(500).json({ success: false, message: 'Không thể tạo lời nhắn lúc này.' });
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

// POST /ai/context/invalidate — xóa cache khi user update dữ liệu
router.post('/ai/context/invalidate', requireAuth, (req, res) => {
    invalidateContext(req.user.sub);
    return res.json({ success: true });
});

export default router;
