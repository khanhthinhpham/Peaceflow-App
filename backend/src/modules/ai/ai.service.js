import { env } from '../../config/env.js';
import { buildUserContext } from './ai.context.js';

async function callRAG(ctx, sessionId) {
    const response = await fetch(`${env.ragBaseUrl}/recommend`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': env.ragApiKey,
        },
        body: JSON.stringify({
            metrics: ctx,
            session_id: sessionId,
            language: 'vi',
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`RAG ${response.status}: ${err}`);
    }

    return response.json();
}

export async function getDailyMessage(userId, ctx = null) {
    if (!ctx) ctx = await buildUserContext(userId);
    const data = await callRAG(ctx, `peaceflow_daily_${userId}`);
    return {
        recommendation: data.recommendation ?? data.answer ?? data.result ?? data.text ?? data.message ?? '',
        exercises: Array.isArray(data.exercises) ? data.exercises : [],
    };
}

export async function getRecommendedTask(userId) {
    const ctx = await buildUserContext(userId);
    const raw = await callRAG(ctx, `peaceflow_task_${userId}`);
    try {
        const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        return JSON.parse(clean);
    } catch {
        return { category: 'meditation', reason: raw, duration_minutes: 10 };
    }
}

export async function getWeeklyInsight(userId) {
    const ctx = await buildUserContext(userId);
    return callRAG(ctx, `peaceflow_insight_${userId}`);
}

// Bài test nhiều khía cạnh (DASS21, Raven...) lưu dimension_scores dạng object lồng
// nhau (vd { score, severity } hoặc { score, max }) — phải trích giá trị đọc được,
// nếu không sẽ in ra "[object Object]" không có ý nghĩa gì trong prompt gửi AI.
function formatDimensionValue(value) {
    if (value === null || value === undefined) return String(value);
    if (typeof value !== 'object') return String(value);
    const parts = [];
    if (value.score !== undefined) parts.push(value.max !== undefined ? `${value.score}/${value.max}` : `${value.score}`);
    if (value.severity || value.label) parts.push(value.severity || value.label);
    return parts.length ? parts.join(' - ') : JSON.stringify(value);
}

// Phần hướng dẫn/vai trò AI — GIỮ NGUYÊN CHỮ, giống nhau cho mọi người dùng và mọi bài
// test. Để riêng trong systemInstruction (thay vì nhét chung vào 1 chuỗi prompt) để
// sau này Gemini có thể cache lại phần này (context caching) — chỉ phần dữ liệu riêng
// của từng người ở dưới (contents) mới thay đổi giữa các lần gọi.
const SYSTEM_INSTRUCTION = `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi tên bài test tự đánh giá cùng điểm số của họ.
Hãy viết một đoạn nhận xét ngắn (3-5 câu) bằng tiếng Việt, giọng văn ấm áp, dễ hiểu, không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa. Kết thúc bằng 1 gợi ý hành động nhỏ, thiết thực người dùng có thể làm hôm nay.`;

// Tổng kết nhận xét bằng Gemini sau khi người dùng nộp 1 bài test tự đánh giá.
export async function getAssessmentAiSummary({ assessmentName, totalScore, severity, dimensionScores }) {
    if (!env.geminiApiKey) {
        throw new Error('GEMINI_API_KEY chưa được cấu hình');
    }

    const dimensionLines = dimensionScores && typeof dimensionScores === 'object' && Object.keys(dimensionScores).length
        ? Object.entries(dimensionScores).map(([key, value]) => `- ${key}: ${formatDimensionValue(value)}`).join('\n')
        : '';

    // Chỉ chứa dữ liệu riêng của người dùng này — thay đổi mỗi lần gọi, không cache được.
    const userContent = `Bài test: "${assessmentName}".
Tổng điểm: ${totalScore}${severity ? `, mức độ: ${severity}` : ''}.
${dimensionLines ? `Điểm theo từng khía cạnh:\n${dimensionLines}` : ''}`;

    const model = env.geminiModel;
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: [{ parts: [{ text: userContent }] }]
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!text) {
        throw new Error('Gemini không trả về nội dung');
    }
    return text;
}
