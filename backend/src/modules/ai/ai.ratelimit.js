import { db } from '../../config/db.js';

// ===== Rate limit AI đếm trong DB =====
//
// Thay cho express-rate-limit với memory store mặc định: backend chạy trên Vercel dạng
// serverless, mỗi container giữ bộ đếm RAM riêng và bị xoá mỗi lần container mới sinh ra,
// nên "20 lần/giờ" trước đây KHÔNG phải giới hạn toàn cục — gọi song song vào nhiều
// container là vượt được. Với tính năng tốn tiền theo token thì đó là rủi ro chi phí thật.
//
// Cửa sổ CỐ ĐỊNH theo giờ (date_trunc('hour')) thay vì cửa sổ trượt: đơn giản, chỉ cần 1
// câu lệnh nguyên tử, và đủ đúng cho mục đích chặn lạm dụng. Đánh đổi đã biết: người dùng
// có thể dùng 20 lượt cuối giờ này rồi 20 lượt đầu giờ sau.
const DEFAULT_MAX_PER_HOUR = 20;

// Xác suất dọn rác mỗi request (1%) — đủ để bảng không phình mà không cần cron riêng.
const CLEANUP_PROBABILITY = 0.01;

function cleanupOldWindows() {
    db.query(`delete from ai_rate_limits where window_start < now() - interval '1 day'`)
        .catch((error) => console.error('[AI] dọn ai_rate_limits thất bại:', error.message));
}

export function createAiRateLimit(max = DEFAULT_MAX_PER_HOUR) {
    return async function aiRateLimit(req, res, next) {
        const userId = req.user?.sub;
        // Mọi route AI đều đứng sau requireAuth nên bình thường luôn có userId. Không có
        // thì bỏ qua việc đếm (bảng khoá ngoại tới users, không lưu được theo IP) —
        // requireAuth mới là lớp chặn đúng cho trường hợp này.
        if (!userId) return next();

        let count;
        try {
            const { rows } = await db.query(
                `insert into ai_rate_limits (user_id, window_start, count)
                 values ($1, date_trunc('hour', now()), 1)
                 on conflict (user_id, window_start)
                   do update set count = ai_rate_limits.count + 1
                 returning count`,
                [userId]
            );
            count = Number(rows[0]?.count || 0);
        } catch (error) {
            // CỐ Ý fail-open: bộ đếm lỗi thì cho đi tiếp, không chặn người dùng.
            // Lý do: đây là app sức khỏe tâm thần — chặn người đang cần nói chuyện vì sự
            // cố hạ tầng của chính mình thì tệ hơn là chịu thêm ít chi phí token. Cũng
            // không phải bước lùi so với trước: memory store cũ vốn đã "hở" trên serverless.
            console.error('[AI] rate limit không đếm được, tạm cho qua:', error.message);
            return next();
        }

        if (Math.random() < CLEANUP_PROBABILITY) cleanupOldWindows();

        const remaining = Math.max(0, max - count);
        // Cùng bộ header với express-rate-limit (standardHeaders) để client/monitor cũ
        // vẫn đọc được.
        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', remaining);
        // Số giây còn lại tới đầu giờ kế tiếp.
        const now = new Date();
        const resetSeconds = 3600 - (now.getMinutes() * 60 + now.getSeconds());
        res.setHeader('RateLimit-Reset', resetSeconds);

        if (count > max) {
            return res.status(429).json({
                success: false,
                message: 'Bạn đã gọi AI quá nhiều lần. Vui lòng thử lại sau.'
            });
        }

        return next();
    };
}
