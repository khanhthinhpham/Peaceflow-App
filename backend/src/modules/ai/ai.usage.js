import { db } from '../../config/db.js';

// Bảng giá Gemini (USD / 1 triệu token) — dùng để ước tính chi phí hiển thị cho admin.
// Đổi ở đây nếu Google thay giá hoặc app đổi model. Model không có trong bảng sẽ dùng
// mức của gemini-3.5-flash-lite (model mặc định của app).
const PRICING = {
    'gemini-3.5-flash-lite': { input: 0.30, output: 2.50, cached: 0.03 },
    'gemini-3.1-flash-lite': { input: 0.25, output: 1.50, cached: 0.025 },
    'gemini-3.5-flash': { input: 1.50, output: 9.00, cached: 0.15 },
    'gemini-3.6-flash': { input: 1.50, output: 7.50, cached: 0.15 },
    'gemini-3-flash-preview': { input: 0.50, output: 3.00, cached: 0.05 }
};
const DEFAULT_PRICING = PRICING['gemini-3.5-flash-lite'];

export const USD_TO_VND = 26000;

export function getPricing(model) {
    return PRICING[model] || DEFAULT_PRICING;
}

// Chi phí 1 lần gọi. Token đã cache tính giá rẻ hơn nên phải trừ ra khỏi token thường,
// nếu không sẽ tính trùng (promptTokenCount của Gemini đã BAO GỒM cả phần cached).
export function estimateCostUsd({ model, promptTokens = 0, outputTokens = 0, cachedTokens = 0 }) {
    const price = getPricing(model);
    const uncachedInput = Math.max(0, Number(promptTokens) - Number(cachedTokens));
    return (
        (uncachedInput * price.input) +
        (Number(cachedTokens) * price.cached) +
        (Number(outputTokens) * price.output)
    ) / 1e6;
}

// Ghi log 1 lần gọi AI. Chạy kiểu "bắn và quên": không await ở nơi gọi và tự nuốt lỗi,
// vì việc ghi log KHÔNG được phép làm hỏng tính năng chính của người dùng.
// LƯU Ý QUYỀN RIÊNG TƯ: chỉ nhận siêu dữ liệu + từ khóa chủ đề, không nhận nội dung chat.
export function logAiUsage({
    userId = null,
    feature,
    model = null,
    usage = null,
    latencyMs = null,
    success = true,
    errorMessage = null,
    topics = [],
    fromCache = false
}) {
    const safeTopics = Array.isArray(topics)
        ? topics.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 10)
        : [];

    db.query(
        `insert into ai_usage_logs
           (user_id, feature, model, prompt_tokens, output_tokens, cached_tokens,
            latency_ms, success, error_message, topics, from_cache)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)`,
        [
            userId,
            feature,
            model,
            Number(usage?.promptTokens || 0),
            Number(usage?.outputTokens || 0),
            Number(usage?.cachedTokens || 0),
            latencyMs === null ? null : Math.round(latencyMs),
            success,
            errorMessage ? String(errorMessage).slice(0, 500) : null,
            JSON.stringify(safeTopics),
            Boolean(fromCache)
        ]
    ).catch((error) => {
        console.error('[AI] logAiUsage failed:', error.message);
    });
}
