import { env } from '../../config/env.js';
import { db } from '../../config/db.js';
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

// Danh sách bài tập — GIỮ NGUYÊN CHỮ giữa các lần gọi (chỉ đổi khi admin thêm/sửa,
// gần như tĩnh) nên để chung trong systemInstruction thay vì contents. Với ~122 bài
// tập hiện có (~6.700 token), phần này đủ lớn để Gemini có cơ hội tự cache lại
// (implicit caching) — nếu để trong contents như trước thì bị coi là "dữ liệu đổi
// mỗi lần" và không bao giờ cache được, dù nội dung 2 lần gọi kế tiếp thực chất
// giống hệt nhau tới 99%.
function formatTaskCatalog(availableTasks) {
    const taskLines = availableTasks
        .map((t) => `- ${t.code}: ${t.title} (${t.category}, ${t.duration_minutes} phút)${t.description ? ` — ${t.description}` : ''}`)
        .join('\n');
    return taskLines || '(không có bài tập nào)';
}

export async function fetchActiveTasks() {
    const res = await db.query(
        `select id, code, title, category, difficulty, duration_minutes, xp_reward, description, metadata->>'icon' as icon
         from tasks where active = true order by code`
    );
    return res.rows;
}

async function callGeminiJson(systemInstruction, userContent, schema) {
    if (!env.geminiApiKey) {
        throw new Error('GEMINI_API_KEY chưa được cấu hình');
    }

    const model = env.geminiModel;
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: userContent }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: schema
                }
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

    try {
        return JSON.parse(text);
    } catch {
        throw new Error('Gemini trả về JSON không hợp lệ');
    }
}

function buildAssessmentSystemInstruction(availableTasks) {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi tên bài test tự đánh giá và điểm số của họ.
Nhiệm vụ:
1. Viết một đoạn nhận xét ngắn (3-5 câu) bằng tiếng Việt, giọng văn ấm áp, dễ hiểu, không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. Chọn ĐÚNG 1 mã bài tập (task_code) phù hợp nhất với kết quả test này TỪ DANH SÁCH bài tập dưới đây — không được bịa ra mã không có trong danh sách.
3. Viết 1 câu ngắn giải thích vì sao bài tập đó phù hợp.

Danh sách bài tập có sẵn (chọn task_code từ đây):
${formatTaskCatalog(availableTasks)}`;
}

const RECOMMENDATION_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        task_code: { type: 'string' },
        task_reason: { type: 'string' }
    },
    required: ['summary', 'task_code', 'task_reason']
};

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

// Tổng kết nhận xét + gợi ý 1 bài tập phù hợp bằng Gemini, sau khi người dùng nộp 1
// bài test tự đánh giá. `availableTasks` là danh sách bài tập THẬT đang có trong app
// (bảng tasks) — bắt AI chọn trong danh sách này để đảm bảo link bấm vào được, tránh
// bịa ra bài tập không tồn tại.
export async function getAssessmentAiSummary({ assessmentName, totalScore, severity, dimensionScores, availableTasks = [] }) {
    const dimensionLines = dimensionScores && typeof dimensionScores === 'object' && Object.keys(dimensionScores).length
        ? Object.entries(dimensionScores).map(([key, value]) => `- ${key}: ${formatDimensionValue(value)}`).join('\n')
        : '';

    // Chỉ chứa dữ liệu riêng của người dùng này — thay đổi mỗi lần gọi, không cache được.
    const userContent = `Bài test: "${assessmentName}".
Tổng điểm: ${totalScore}${severity ? `, mức độ: ${severity}` : ''}.
${dimensionLines ? `Điểm theo từng khía cạnh:\n${dimensionLines}` : ''}`;

    const parsed = await callGeminiJson(buildAssessmentSystemInstruction(availableTasks), userContent, RECOMMENDATION_SCHEMA);

    const matchedTask = availableTasks.find((t) => t.code === parsed.task_code) || null;
    return {
        summary: parsed.summary || '',
        recommendedTask: matchedTask ? { ...matchedTask, reason: parsed.task_reason || '' } : null
    };
}

const DAILY_MESSAGE_SCHEMA = {
    type: 'object',
    properties: {
        message: { type: 'string' },
        exercises: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    task_code: { type: 'string' },
                    reason: { type: 'string' }
                },
                required: ['task_code', 'reason']
            }
        }
    },
    required: ['message', 'exercises']
};

function buildDailySystemInstruction(availableTasks) {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi dữ liệu tổng hợp về tâm trạng, mức độ lo âu/stress/năng lượng gần đây, streak hoạt động và các bài tập họ từng thích.
Nhiệm vụ:
1. Viết một lời nhắn buổi sáng ngắn gọn (2-4 câu) bằng tiếng Việt, giọng văn ấm áp, cá nhân hóa dựa trên xu hướng tâm trạng gần đây — không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. Chọn 1-2 bài tập (task_code) phù hợp nhất TỪ DANH SÁCH bài tập dưới đây, ưu tiên bài tập giúp cải thiện đúng vấn đề người dùng đang gặp (vd: stress cao thì ưu tiên bài thư giãn/hít thở; năng lượng thấp thì ưu tiên bài nhẹ nhàng; đang tốt thì có thể gợi ý thử thể loại chưa từng làm) — không được bịa mã không có trong danh sách.
3. Với mỗi bài tập chọn, viết 1 câu ngắn giải thích vì sao phù hợp.

Danh sách bài tập có sẵn (chọn task_code từ đây):
${formatTaskCatalog(availableTasks)}`;
}

function formatMoodContext(ctx) {
    const mood = ctx.moodTrend || {};
    const assessment = ctx.assessmentTrend || {};
    const progress = ctx.progress || {};
    const lines = [];

    if (mood.checkin_count) {
        lines.push(`Tâm trạng 14 ngày qua: điểm tâm trạng trung bình ${mood.mood_avg ?? '?'}/5, lo âu ${mood.anxiety_avg ?? '?'}/5, stress ${mood.stress_avg ?? '?'}/5, năng lượng ${mood.energy_avg ?? '?'}/5 (${mood.checkin_count} lần check-in). Xu hướng gần đây: ${mood.trend}.`);
    } else {
        lines.push('Chưa có dữ liệu check-in tâm trạng gần đây.');
    }

    if (assessment.count) {
        lines.push(`Xu hướng kết quả các bài test tự đánh giá gần đây: ${assessment.trend} (${assessment.count} lần làm bài trong 60 ngày qua).`);
    }

    lines.push(`Streak hoạt động hiện tại: ${progress.current_streak ?? 0} ngày.`);

    if (ctx.taskPatterns?.favorite_category) {
        lines.push(`Thể loại bài tập hay làm nhất: ${ctx.taskPatterns.favorite_category}.`);
    }
    if (ctx.topRatedTasks?.length) {
        lines.push(`Bài tập từng được đánh giá cao: ${ctx.topRatedTasks.map((t) => t.title).join(', ')}.`);
    }
    if (ctx.untriedCategories?.length) {
        lines.push(`Thể loại chưa từng thử: ${ctx.untriedCategories.join(', ')}.`);
    }
    if (ctx.preferredTime) {
        lines.push(`Khung giờ hay hoạt động nhất: ${ctx.preferredTime}.`);
    }

    return lines.join('\n');
}

// Lời nhắn buổi sáng cá nhân hóa dựa trên xu hướng tâm trạng gần đây + gợi ý 1-2 bài
// tập phù hợp — dùng chung cơ chế chọn task_code thật với getAssessmentAiSummary.
export async function getDailyMessage(userId, ctx = null) {
    if (!ctx) ctx = await buildUserContext(userId);
    const availableTasks = await fetchActiveTasks();

    const parsed = await callGeminiJson(buildDailySystemInstruction(availableTasks), formatMoodContext(ctx), DAILY_MESSAGE_SCHEMA);

    const exercises = Array.isArray(parsed.exercises)
        ? parsed.exercises
            .map((ex) => {
                const task = availableTasks.find((t) => t.code === ex.task_code);
                return task ? { ...task, reason: ex.reason || '' } : null;
            })
            .filter(Boolean)
        : [];

    return {
        recommendation: parsed.message || '',
        exercises
    };
}
