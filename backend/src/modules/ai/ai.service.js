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

export async function fetchActiveTasks() {
    const res = await db.query(
        `select id, code, title, category, difficulty, duration_minutes, xp_reward, description, metadata->>'icon' as icon
         from tasks where active = true order by code`
    );
    return res.rows;
}

// `contents` nhận trực tiếp mảng theo format Gemini ([{role?, parts:[{text}]}]) để hỗ
// trợ cả 1 lượt (các tính năng cũ) và nhiều lượt hội thoại thật (chat) trong cùng 1 hàm.
async function callGeminiJson(systemInstruction, contents, schema, options = {}) {
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
                contents,
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                    ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {})
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

// Không nhét cả danh sách bài tập vào prompt (từng ~6.700 token, dễ khiến model chọn
// nhầm/sinh mã lỗi khi phải chọn đúng 1 mã trong danh sách dài). Thay vào đó AI chỉ mô
// tả NGẮN loại bài tập cần bằng chữ thường, code tự so khớp với dữ liệu thật bên dưới
// (findBestMatchingTask) — giống cách đã áp dụng cho chat.
function buildAssessmentSystemInstruction() {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi tên bài test tự đánh giá và điểm số của họ.
Nhiệm vụ:
1. Viết một đoạn nhận xét ngắn (3-5 câu) bằng tiếng Việt, giọng văn ấm áp, dễ hiểu, không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. Mô tả NGẮN (3-8 từ tiếng Việt) loại bài tập phù hợp nhất với kết quả test này vào task_query (vd: "bài tập giảm lo âu", "thư giãn trước khi ngủ") — đây là mô tả để tìm kiếm, KHÔNG phải tên/mã cụ thể.
3. Viết 1 câu ngắn giải thích vì sao loại bài tập đó phù hợp.`;
}

const RECOMMENDATION_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        task_query: { type: 'string' },
        task_reason: { type: 'string' }
    },
    required: ['summary', 'task_query', 'task_reason']
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

    const parsed = await callGeminiJson(buildAssessmentSystemInstruction(), [{ parts: [{ text: userContent }] }], RECOMMENDATION_SCHEMA);

    const matchedTask = parsed.task_query ? findBestMatchingTask(availableTasks, parsed.task_query) : null;
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
                    task_query: { type: 'string' },
                    reason: { type: 'string' }
                },
                required: ['task_query', 'reason']
            }
        }
    },
    required: ['message', 'exercises']
};

// Không nhét cả danh sách bài tập vào prompt nữa (xem giải thích ở buildAssessmentSystemInstruction).
function buildDailySystemInstruction() {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi dữ liệu tổng hợp về tâm trạng, mức độ lo âu/stress/năng lượng gần đây, streak hoạt động và các bài tập họ từng thích.
Nhiệm vụ:
1. Viết một lời nhắn buổi sáng ngắn gọn (2-4 câu) bằng tiếng Việt, giọng văn ấm áp, cá nhân hóa dựa trên xu hướng tâm trạng gần đây — không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. Mô tả 1-2 loại bài tập phù hợp nhất (mỗi loại 3-8 từ tiếng Việt, vào task_query) — ưu tiên loại giúp cải thiện đúng vấn đề người dùng đang gặp (vd: stress cao thì ưu tiên "bài thư giãn hít thở"; năng lượng thấp thì ưu tiên "bài tập nhẹ nhàng"; đang tốt thì có thể gợi ý "thử thể loại mới"). Đây là mô tả để tìm kiếm, KHÔNG phải tên/mã cụ thể.
3. Với mỗi loại bài tập, viết 1 câu ngắn giải thích vì sao phù hợp.`;
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

    const parsed = await callGeminiJson(buildDailySystemInstruction(), [{ parts: [{ text: formatMoodContext(ctx) }] }], DAILY_MESSAGE_SCHEMA);

    // Loại trùng — 2 mô tả khác nhau (vd "bài thư giãn" và "hít thở") đôi khi khớp
    // cùng 1 bài tập thật, không nên hiện lặp lại cùng 1 bài trong danh sách gợi ý.
    const usedTaskIds = new Set();
    const exercises = Array.isArray(parsed.exercises)
        ? parsed.exercises
            .map((ex) => {
                const task = ex.task_query ? findBestMatchingTask(availableTasks, ex.task_query) : null;
                if (!task || usedTaskIds.has(task.id)) return null;
                usedTaskIds.add(task.id);
                return { ...task, reason: ex.reason || '' };
            })
            .filter(Boolean)
        : [];

    return {
        recommendation: parsed.message || '',
        exercises
    };
}

export async function fetchActiveExperts() {
    const res = await db.query(
        `select id, code, full_name, degree, specialties, rating, experience_years, bio
         from experts where active = true order by rating desc nulls last, code`
    );
    return res.rows;
}

const CHAT_SCHEMA = {
    type: 'object',
    properties: {
        reply: { type: 'string' },
        suggested_task_query: { type: 'string' },
        suggested_expert_query: { type: 'string' },
        mood_analysis: {
            type: 'object',
            properties: {
                anxiety: { type: 'integer' },
                stress: { type: 'integer' },
                mood: { type: 'integer' },
                depression: { type: 'integer' },
                keywords: { type: 'array', items: { type: 'string' } }
            },
            required: ['anxiety', 'stress', 'mood', 'depression', 'keywords']
        }
    },
    required: ['reply', 'mood_analysis']
};

const MAX_CHAT_HISTORY = 6;

// Không nhét cả danh sách bài tập/chuyên gia vào đây nữa (từng gây ~7.500 token/lần và
// khiến model thỉnh thoảng sinh mã lỗi khi phải chọn đúng 1 mã từ danh sách dài). Thay
// vào đó Gemini chỉ mô tả NGẮN bằng chữ thường loại bài tập/chuyên gia cần — code tự so
// khớp với dữ liệu thật bên dưới (findBestMatchingTask/Expert). Giảm ~99% token, không
// còn khả năng bịa mã vì đầu ra không còn là 1 mã cụ thể để model "chọn nhầm/gõ nhầm".
function buildChatSystemInstruction(ctx) {
    return `Bạn là PeaceCat AI — trợ lý tâm lý đồng hành của app PeaceFlow, trò chuyện bằng tiếng Việt, giọng văn ấm áp, đồng cảm, tự nhiên như một người bạn lắng nghe.

QUY TẮC BẮT BUỘC:
1. CHỈ trò chuyện về: cảm xúc, tâm trạng, sức khỏe tâm thần, stress/lo âu/trầm cảm, các bài tập/nhiệm vụ trong app, thông tin chuyên gia tâm lý trên hệ thống, và dữ liệu cá nhân của người dùng trong app (tâm trạng, tiến độ, lịch sử hoạt động...).
2. Nếu người dùng hỏi chủ đề KHÔNG liên quan (lập trình, thời sự, giải trí, kiến thức chung, chuyện của người khác...), hãy từ chối lịch sự và mời họ quay lại chủ đề tâm lý — không trả lời nội dung ngoài phạm vi này.
3. Trả lời NGẮN GỌN — tối đa 2-4 câu, không lan man, không liệt kê dài dòng, không dùng markdown.
4. Không đưa ra chẩn đoán y khoa. Nếu phát hiện dấu hiệu nguy cấp (ý định tự hại/tự tử), khuyên người dùng liên hệ hotline hoặc chuyên gia ngay trong câu trả lời.
5. Nếu phù hợp, mô tả NGẮN (3-8 từ tiếng Việt) loại bài tập nên gợi ý vào suggested_task_query (vd: "bài tập giúp ngủ ngon", "thở giảm lo âu") — để trống nếu không cần. Tương tự, nếu phù hợp thì mô tả NGẮN chuyên môn chuyên gia cần tìm vào suggested_expert_query (vd: "chuyên gia về lo âu mất ngủ") — để trống nếu không cần. Đây chỉ là mô tả để tìm kiếm, KHÔNG phải tên/mã cụ thể.
6. Luôn kèm theo mood_analysis: ước lượng (0-100) dựa trên toàn bộ cuộc trò chuyện tính đến tin nhắn này — anxiety (lo âu), stress, mood (tâm trạng, càng cao càng tích cực), depression (dấu hiệu trầm cảm). Đây chỉ là ước lượng tham khảo để hiển thị cho người dùng tự theo dõi, KHÔNG phải chẩn đoán y khoa. Kèm tối đa 5 từ khóa cảm xúc nổi bật (keywords) rút ra từ lời người dùng vừa nói (ví dụ: "mất ngủ", "áp lực công việc", "cô đơn") — không lặp lại từ khóa đã có nếu không còn phù hợp.

--- Thông tin về người dùng đang chat (dùng để trả lời phù hợp, không đọc lại nguyên văn số liệu cho người dùng) ---
${formatMoodContext(ctx)}`;
}

// Từ đệm tiếng Việt phổ biến — loại bỏ để tránh khớp giả (vd 2 câu chỉ chung từ "và",
// "một", "cho" thì không nên tính là liên quan nhau).
const STOPWORDS = new Set(['và', 'của', 'cho', 'để', 'là', 'có', 'các', 'những', 'một', 'khi', 'này', 'với', 'từ', 'trong', 'về', 'bị', 'được', 'sẽ', 'đã', 'đang', 'rất', 'hay', 'nên', 'cần', 'nếu', 'thì']);

function normalizeWords(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[.,!?;:()"'–-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// So khớp từ khóa giữa mô tả AI đưa ra và tên+mô tả bài tập thật trong DB — thay cho
// việc bắt AI tự chọn đúng 1 mã từ danh sách dài dễ sai. Ưu tiên trùng từ trong TÊN bài
// tập (weight 2) hơn trong mô tả (weight 1), và yêu cầu điểm tối thiểu mới nhận là khớp
// — tránh gợi ý sai lệch chỉ vì trùng ngẫu nhiên 1 từ không thật sự liên quan.
const MIN_MATCH_SCORE = 3;

function findBestMatchingTask(availableTasks, queryText) {
    const queryWords = normalizeWords(queryText);
    if (!queryWords.length) return null;

    let best = null;
    let bestScore = 0;
    for (const task of availableTasks) {
        const titleWords = normalizeWords(task.title).join(' ');
        const descWords = normalizeWords(task.description || '').join(' ');
        const score = queryWords.reduce((sum, w) => {
            if (titleWords.includes(w)) return sum + 2;
            if (descWords.includes(w)) return sum + 1;
            return sum;
        }, 0);
        if (score > bestScore) {
            bestScore = score;
            best = task;
        }
    }
    return bestScore >= MIN_MATCH_SCORE ? best : null;
}

const MIN_EXPERT_MATCH_SCORE = 2;

function findBestMatchingExpert(availableExperts, queryText) {
    const queryWords = normalizeWords(queryText);
    if (!queryWords.length) return null;

    let best = null;
    let bestScore = 0;
    for (const expert of availableExperts) {
        const specialtyWords = normalizeWords(Array.isArray(expert.specialties) ? expert.specialties.join(' ') : (expert.specialties || '')).join(' ');
        const bioWords = normalizeWords(expert.bio || '').join(' ');
        const score = queryWords.reduce((sum, w) => {
            if (specialtyWords.includes(w)) return sum + 2;
            if (bioWords.includes(w)) return sum + 1;
            return sum;
        }, 0);
        if (score > bestScore) {
            bestScore = score;
            best = expert;
        }
    }
    return bestScore >= MIN_EXPERT_MATCH_SCORE ? best : null;
}

// Chat nhiều lượt với PeaceCat AI — biết dữ liệu cá nhân người dùng (tâm trạng, tiến
// độ...), giới hạn chỉ trò chuyện trong phạm vi tâm lý/tâm thần, trả lời ngắn. Gợi ý
// bài tập/chuyên gia bằng cách AI mô tả nhu cầu rồi code tự so khớp dữ liệu thật.
export async function getChatReply({ userId, message, history = [] }) {
    const ctx = await buildUserContext(userId);

    const trimmedHistory = history.slice(-MAX_CHAT_HISTORY);
    const contents = trimmedHistory
        .filter((item) => item && typeof item.text === 'string' && item.text.trim())
        .map((item) => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const [parsed, availableTasks, availableExperts] = await Promise.all([
        callGeminiJson(buildChatSystemInstruction(ctx), contents, CHAT_SCHEMA, { maxOutputTokens: 300 }),
        fetchActiveTasks(),
        fetchActiveExperts()
    ]);

    const matchedTask = parsed.suggested_task_query ? findBestMatchingTask(availableTasks, parsed.suggested_task_query) : null;
    const matchedExpert = parsed.suggested_expert_query ? findBestMatchingExpert(availableExperts, parsed.suggested_expert_query) : null;
    const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));
    const analysis = parsed.mood_analysis || {};

    return {
        reply: parsed.reply || '',
        suggestedTask: matchedTask,
        suggestedExpert: matchedExpert,
        moodAnalysis: {
            anxiety: clampScore(analysis.anxiety),
            stress: clampScore(analysis.stress),
            mood: clampScore(analysis.mood),
            depression: clampScore(analysis.depression),
            keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5) : []
        }
    };
}
