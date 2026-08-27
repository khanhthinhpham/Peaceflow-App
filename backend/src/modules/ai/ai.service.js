import { env } from '../../config/env.js';
import { db } from '../../config/db.js';
import { buildUserContext } from './ai.context.js';
import { TRIGGER_CODES, formatTriggerList } from './taskTaxonomy.js';

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
2. task_trigger: chọn ĐÚNG 1 mã tình trạng cần nhắm tới nhất dựa trên kết quả test, từ danh sách sau (để trống nếu không rõ):
${formatTriggerList()}
3. task_query: mô tả bằng 1-2 câu tiếng Việt loại bài tập phù hợp nhất — nêu rõ MỤC ĐÍCH và CÁCH THỨC tác động (vd: "Bài tập điều hòa hơi thở chậm để làm dịu hệ thần kinh và giảm cảm giác bồn chồn"). Đây là mô tả để tìm kiếm, KHÔNG phải tên/mã bài tập cụ thể.
4. task_reason: 1 câu ngắn giải thích vì sao loại bài tập đó phù hợp (câu này sẽ hiện cho người dùng đọc).`;
}

const RECOMMENDATION_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        task_trigger: { type: 'string' },
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
// bài test tự đánh giá. AI chỉ mô tả loại bài tập cần, code tự tìm bài tập thật khớp
// nhất bằng embedding — đảm bảo link bấm vào được, không bịa ra bài tập không tồn tại.
export async function getAssessmentAiSummary({ assessmentName, totalScore, severity, dimensionScores }) {
    const dimensionLines = dimensionScores && typeof dimensionScores === 'object' && Object.keys(dimensionScores).length
        ? Object.entries(dimensionScores).map(([key, value]) => `- ${key}: ${formatDimensionValue(value)}`).join('\n')
        : '';

    // Chỉ chứa dữ liệu riêng của người dùng này — thay đổi mỗi lần gọi, không cache được.
    const userContent = `Bài test: "${assessmentName}".
Tổng điểm: ${totalScore}${severity ? `, mức độ: ${severity}` : ''}.
${dimensionLines ? `Điểm theo từng khía cạnh:\n${dimensionLines}` : ''}`;

    const parsed = await callGeminiJson(buildAssessmentSystemInstruction(), [{ parts: [{ text: userContent }] }], RECOMMENDATION_SCHEMA);

    const matchedTask = await findMatchingTaskByEmbedding(parsed.task_query, parsed.task_trigger);
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
                    task_trigger: { type: 'string' },
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
2. Đề xuất 1-2 bài tập trong mảng exercises. Với mỗi phần tử:
   - task_trigger: chọn ĐÚNG 1 mã tình trạng cần nhắm tới nhất từ danh sách sau (để trống nếu không rõ):
${formatTriggerList()}
   - task_query: mô tả bằng 1-2 câu loại bài tập phù hợp, nêu rõ MỤC ĐÍCH và CÁCH THỨC tác động (vd: "Bài tập vận động nhẹ ngoài trời để nâng năng lượng và cải thiện tâm trạng"). Đây là mô tả để tìm kiếm, KHÔNG phải tên/mã cụ thể.
   - reason: 1 câu ngắn giải thích vì sao phù hợp (hiện cho người dùng đọc).
Ưu tiên nhắm đúng vấn đề đang gặp: stress/lo âu cao thì ưu tiên bài làm dịu; năng lượng thấp thì ưu tiên bài nâng năng lượng nhẹ nhàng; đang ổn thì có thể gợi ý thử hướng mới.`;
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

    const parsed = await callGeminiJson(buildDailySystemInstruction(), [{ parts: [{ text: formatMoodContext(ctx) }] }], DAILY_MESSAGE_SCHEMA);

    // Loại trùng — 2 mô tả khác nhau (vd "bài thư giãn" và "hít thở") đôi khi khớp
    // cùng 1 bài tập thật, không nên hiện lặp lại cùng 1 bài trong danh sách gợi ý.
    const usedTaskIds = new Set();
    const matches = await Promise.all(
        (Array.isArray(parsed.exercises) ? parsed.exercises : []).map(async (ex) => {
            const task = await findMatchingTaskByEmbedding(ex.task_query, ex.task_trigger);
            return task ? { task, reason: ex.reason || '' } : null;
        })
    );
    const exercises = matches
        .filter(Boolean)
        .filter(({ task }) => {
            if (usedTaskIds.has(task.id)) return false;
            usedTaskIds.add(task.id);
            return true;
        })
        .map(({ task, reason }) => ({ ...task, reason }));

    return {
        recommendation: parsed.message || '',
        exercises
    };
}

const CHAT_SCHEMA = {
    type: 'object',
    properties: {
        reply: { type: 'string' },
        suggested_task_trigger: { type: 'string' },
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
5. Nếu việc gợi ý một bài tập là phù hợp với đoạn hội thoại, hãy điền:
   - suggested_task_trigger: ĐÚNG 1 mã tình trạng cần nhắm tới nhất từ danh sách sau (để trống nếu không rõ):
${formatTriggerList()}
   - suggested_task_query: mô tả bằng 1-2 câu loại bài tập phù hợp, nêu rõ MỤC ĐÍCH và CÁCH THỨC tác động (vd: "Bài tập điều hòa hơi thở chậm để làm dịu hệ thần kinh và giảm bồn chồn").
   Nếu không cần gợi ý bài tập thì để trống cả hai.
   Tương tự, nếu người dùng cần tìm chuyên gia thì mô tả chuyên môn cần tìm vào suggested_expert_query (vd: "chuyên gia về lo âu và rối loạn giấc ngủ") — để trống nếu không cần.
   Tất cả đều là mô tả để tìm kiếm, KHÔNG phải tên/mã cụ thể.
6. Luôn kèm theo mood_analysis: ước lượng (0-100) dựa trên toàn bộ cuộc trò chuyện tính đến tin nhắn này — anxiety (lo âu), stress, mood (tâm trạng, càng cao càng tích cực), depression (dấu hiệu trầm cảm). Đây chỉ là ước lượng tham khảo để hiển thị cho người dùng tự theo dõi, KHÔNG phải chẩn đoán y khoa. Kèm tối đa 5 từ khóa cảm xúc nổi bật (keywords) rút ra từ lời người dùng vừa nói (ví dụ: "mất ngủ", "áp lực công việc", "cô đơn") — không lặp lại từ khóa đã có nếu không còn phù hợp.

--- Thông tin về người dùng đang chat (dùng để trả lời phù hợp, không đọc lại nguyên văn số liệu cho người dùng) ---
${formatMoodContext(ctx)}`;
}

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMENSIONS = 768;
// Khoảng cách cosine tối đa để chấp nhận là "khớp" — hiệu chỉnh thực nghiệm: câu hỏi
// liên quan thật ra khoảng cách ~0.24-0.31 với bài tập/chuyên gia phù hợp, còn câu hỏi
// không liên quan gì (vd hỏi về lập trình) ra ~0.42+. Để trống (null) an toàn hơn là
// ép nhận 1 kết quả không thật sự liên quan.
const MAX_MATCH_DISTANCE = 0.35;

async function embedText(text, taskType) {
    if (!text || !env.geminiApiKey) return null;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${env.geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text }] },
                    outputDimensionality: EMBED_DIMENSIONS,
                    taskType
                })
            }
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.embedding?.values || null;
    } catch {
        return null;
    }
}

// Tìm bài tập phù hợp theo 2 lớp:
//   1) LỌC XÁC ĐỊNH theo tình trạng (triggers_supported / contraindications — đã được
//      gán nhãn sẵn bằng `node src/scripts/label-task-triggers.js`). Đây là lớp quan
//      trọng nhất: nó loại bỏ hẳn các bài PHẢN TÁC DỤNG, thứ mà embedding không làm
//      được (vd bài "tự vấn/suy ngẫm trước khi ngủ" nghe rất giống chủ đề giấc ngủ
//      nhưng lại làm mất ngủ nặng thêm).
//   2) Trong nhóm đã lọc, dùng embedding chọn bài gần nghĩa nhất với mô tả AI đưa ra.
// Nếu AI không xác định được tình trạng, bỏ qua lớp 1 và chỉ dùng embedding.
async function queryClosestTask(vectorLiteral, trigger, requireSupported) {
    const params = [vectorLiteral];
    let filter = '';
    if (trigger) {
        params.push(JSON.stringify([trigger]));
        // Điều kiện "không chống chỉ định" LUÔN được áp dụng khi đã biết tình trạng —
        // không bao giờ nới lỏng, vì đây chính là thứ chặn các bài phản tác dụng.
        filter = ` and not (contraindications @> $2::jsonb)`;
        if (requireSupported) filter += ` and triggers_supported @> $2::jsonb`;
    }

    const { rows } = await db.query(
        `select id, code, title, category, difficulty, duration_minutes, xp_reward, description,
                metadata->>'icon' as icon, embedding <=> $1::vector as distance
         from tasks
         where active = true and embedding is not null${filter}
         order by distance asc
         limit 1`,
        params
    );
    const best = rows[0];
    return best && best.distance <= MAX_MATCH_DISTANCE ? best : null;
}

async function findMatchingTaskByEmbedding(queryText, targetTrigger = null) {
    if (!queryText) return null;
    const vector = await embedText(queryText, 'RETRIEVAL_QUERY');
    if (!vector) return null;

    const vectorLiteral = `[${vector.join(',')}]`;
    const trigger = TRIGGER_CODES.includes(targetTrigger) ? targetTrigger : null;

    // Ưu tiên bài được gán nhãn hỗ trợ đúng tình trạng này.
    const preferred = await queryClosestTask(vectorLiteral, trigger, true);
    if (preferred) return preferred;

    // Không có bài nào vừa hỗ trợ đúng tình trạng vừa đủ gần nghĩa — nới lỏng yêu cầu
    // "phải hỗ trợ", nhưng vẫn loại các bài chống chỉ định với tình trạng đó.
    return queryClosestTask(vectorLiteral, trigger, false);
}

async function findMatchingExpertByEmbedding(queryText) {
    if (!queryText) return null;
    const vector = await embedText(queryText, 'RETRIEVAL_QUERY');
    if (!vector) return null;

    const { rows } = await db.query(
        `select id, code, full_name, degree, specialties, rating, experience_years, bio,
                embedding <=> $1::vector as distance
         from experts
         where active = true and embedding is not null
         order by distance asc
         limit 1`,
        [`[${vector.join(',')}]`]
    );
    const best = rows[0];
    return best && best.distance <= MAX_MATCH_DISTANCE ? best : null;
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

    const parsed = await callGeminiJson(buildChatSystemInstruction(ctx), contents, CHAT_SCHEMA, { maxOutputTokens: 300 });

    const [matchedTask, matchedExpert] = await Promise.all([
        findMatchingTaskByEmbedding(parsed.suggested_task_query, parsed.suggested_task_trigger),
        findMatchingExpertByEmbedding(parsed.suggested_expert_query)
    ]);
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
