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

// ===== Catalog rút gọn gửi cho LLM =====
// Mục tiêu: LLM thấy TOÀN BỘ bài tập/chuyên gia thật để tự chọn, nhưng không tốn nhiều
// token. Chìa khóa là bỏ phần description dài: gửi đủ 122 bài chỉ tốn ~1.900 token thay
// vì ~6.200 token (trung vị tên bài chỉ 46 ký tự, chỉ 20/122 bài có tên dài).
const MAX_TITLE_CHARS = 70;
const CATALOG_TTL_MS = 5 * 60 * 1000;

let _catalogCache = null;

async function getCatalog() {
    if (_catalogCache && Date.now() - _catalogCache.at < CATALOG_TTL_MS) {
        return _catalogCache.data;
    }

    const [tasksRes, expertsRes] = await Promise.all([
        db.query(
            `select id, code, title, category, difficulty, duration_minutes, xp_reward, description,
                    metadata->>'icon' as icon
             from tasks where active = true order by code`
        ),
        db.query(
            `select id, code, full_name, degree, specialties, rating, experience_years, bio
             from experts where active = true order by rating desc nulls last, code`
        )
    ]);

    const tasks = tasksRes.rows;
    const experts = expertsRes.rows;

    const taskLines = tasks
        .map((t) => `${t.code}|${String(t.title).slice(0, MAX_TITLE_CHARS)}|${t.duration_minutes}p`)
        .join('\n');
    const expertLines = experts
        .map((e) => {
            const sp = Array.isArray(e.specialties) ? e.specialties.join(',') : (e.specialties || '');
            return `${e.code}|${e.full_name}|${sp}`;
        })
        .join('\n');

    const data = {
        tasks,
        experts,
        taskByCode: new Map(tasks.map((t) => [t.code, t])),
        expertByCode: new Map(experts.map((e) => [e.code, e])),
        taskLines,
        expertLines
    };
    _catalogCache = { at: Date.now(), data };
    return data;
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

function buildAssessmentSystemInstruction(catalog) {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi tên bài test tự đánh giá và điểm số của họ.
Nhiệm vụ:
1. summary: viết một đoạn nhận xét ngắn (3-5 câu) bằng tiếng Việt, giọng văn ấm áp, dễ hiểu, không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. tasks: chọn 2-3 bài tập phù hợp nhất với kết quả test này từ danh sách dưới đây, xếp theo mức độ phù hợp giảm dần. Mỗi phần tử gồm:
   - task_code: copy chính xác phần mã (trước dấu |), không thêm bớt ký tự nào.
   - reason: 1 câu ngắn giải thích vì sao bài đó phù hợp (hiện cho người dùng đọc).
   NGUYÊN TẮC CHỌN BÀI:
   - Xét theo VIỆC NGƯỜI DÙNG THỰC SỰ LÀM trong bài tập và tác động của việc đó, KHÔNG xét theo từ ngữ trong tên bài. Tên bài có nhắc tới một thời điểm hay một chủ đề không tự động nghĩa là bài đó phù hợp với tình trạng đang xét.
   - Loại bỏ bài có thể làm tình trạng NẶNG THÊM. Ví dụ: bài yêu cầu suy ngẫm/tự vấn/phân tích bản thân sẽ kích hoạt suy nghĩ miên man nên KHÔNG phù hợp với người mất ngủ, dù tên bài có chữ "trước khi ngủ"; bài vận động mạnh gây tỉnh táo cũng không phù hợp khi cần dễ ngủ.
   - Thà chỉ chọn 2 bài thật sự phù hợp còn hơn chọn đủ 3 bài mà có bài kém liên quan. Không chọn trùng cùng 1 bài.

--- DANH SÁCH BÀI TẬP (định dạng: mã|tên|thời lượng) ---
${catalog.taskLines}`;
}

const RECOMMENDATION_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        tasks: {
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
    required: ['summary', 'tasks']
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

// Tổng kết nhận xét + gợi ý 2-3 bài tập phù hợp bằng Gemini, sau khi người dùng nộp 1
// bài test tự đánh giá. LLM được xem toàn bộ danh sách bài tập thật (dạng rút gọn) và
// tự chọn mã; code chỉ đối chiếu mã đó với DB, kèm lưới an toàn bằng embedding nếu LLM
// trả về mã không tồn tại.
export async function getAssessmentAiSummary({ assessmentName, totalScore, severity, dimensionScores }) {
    const catalog = await getCatalog();
    const dimensionLines = dimensionScores && typeof dimensionScores === 'object' && Object.keys(dimensionScores).length
        ? Object.entries(dimensionScores).map(([key, value]) => `- ${key}: ${formatDimensionValue(value)}`).join('\n')
        : '';

    // Chỉ chứa dữ liệu riêng của người dùng này — thay đổi mỗi lần gọi, không cache được.
    const userContent = `Bài test: "${assessmentName}".
Tổng điểm: ${totalScore}${severity ? `, mức độ: ${severity}` : ''}.
${dimensionLines ? `Điểm theo từng khía cạnh:\n${dimensionLines}` : ''}`;

    const parsed = await callGeminiJson(buildAssessmentSystemInstruction(catalog), [{ parts: [{ text: userContent }] }], RECOMMENDATION_SCHEMA);

    const matches = await Promise.all(
        (Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 3) : []).map(async (item) => {
            const task = await resolveTask(catalog, item.task_code, item.reason);
            return task ? { task, reason: item.reason || '' } : null;
        })
    );

    // Loại trùng — LLM đôi khi chọn lặp, hoặc 2 mã sai cùng rơi về 1 bài qua lưới an toàn.
    const usedIds = new Set();
    const recommendedTasks = matches
        .filter(Boolean)
        .filter(({ task }) => {
            if (usedIds.has(task.id)) return false;
            usedIds.add(task.id);
            return true;
        })
        .map(({ task, reason }) => ({ ...task, reason }));

    return {
        summary: parsed.summary || '',
        recommendedTasks
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

function buildDailySystemInstruction(catalog) {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi dữ liệu tổng hợp về tâm trạng, mức độ lo âu/stress/năng lượng gần đây, streak hoạt động và các bài tập họ từng thích.
Nhiệm vụ:
1. message: viết một lời nhắn buổi sáng ngắn gọn (2-4 câu) bằng tiếng Việt, giọng văn ấm áp, cá nhân hóa dựa trên xu hướng tâm trạng gần đây — không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. exercises: chọn 1-2 bài tập từ danh sách dưới đây. Mỗi phần tử gồm task_code (copy chính xác phần mã trước dấu |, không thêm bớt ký tự) và reason (1 câu ngắn giải thích vì sao phù hợp, hiện cho người dùng đọc). Không chọn trùng cùng 1 bài.
Ưu tiên nhắm đúng vấn đề đang gặp: stress/lo âu cao thì chọn bài làm dịu; năng lượng thấp thì chọn bài nâng năng lượng nhẹ nhàng; đang ổn thì có thể gợi ý hướng mới. Tránh bài có thể phản tác dụng với tình trạng hiện tại.

--- DANH SÁCH BÀI TẬP (định dạng: mã|tên|thời lượng) ---
${catalog.taskLines}`;
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
    const catalog = await getCatalog();

    const parsed = await callGeminiJson(buildDailySystemInstruction(catalog), [{ parts: [{ text: formatMoodContext(ctx) }] }], DAILY_MESSAGE_SCHEMA);

    const matches = await Promise.all(
        (Array.isArray(parsed.exercises) ? parsed.exercises : []).map(async (ex) => {
            const task = await resolveTask(catalog, ex.task_code, ex.reason);
            return task ? { task, reason: ex.reason || '' } : null;
        })
    );

    // Loại trùng — LLM đôi khi chọn lặp, hoặc 2 mã sai cùng rơi về 1 bài qua lưới an toàn.
    const usedTaskIds = new Set();
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
        suggested_task_code: { type: 'string' },
        suggested_expert_code: { type: 'string' },
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

function buildChatSystemInstruction(ctx, catalog) {
    return `Bạn là PeaceCat AI — trợ lý tâm lý đồng hành của app PeaceFlow, trò chuyện bằng tiếng Việt, giọng văn ấm áp, đồng cảm, tự nhiên như một người bạn lắng nghe.

QUY TẮC BẮT BUỘC:
1. CHỈ trò chuyện về: cảm xúc, tâm trạng, sức khỏe tâm thần, stress/lo âu/trầm cảm, các bài tập/nhiệm vụ trong app, thông tin chuyên gia tâm lý trên hệ thống, và dữ liệu cá nhân của người dùng trong app (tâm trạng, tiến độ, lịch sử hoạt động...).
2. Nếu người dùng hỏi chủ đề KHÔNG liên quan (lập trình, thời sự, giải trí, kiến thức chung, chuyện của người khác...), hãy từ chối lịch sự và mời họ quay lại chủ đề tâm lý — không trả lời nội dung ngoài phạm vi này.
3. Trả lời NGẮN GỌN — tối đa 2-4 câu, không lan man, không liệt kê dài dòng, không dùng markdown.
4. Không đưa ra chẩn đoán y khoa. Nếu phát hiện dấu hiệu nguy cấp (ý định tự hại/tự tử), khuyên người dùng liên hệ hotline hoặc chuyên gia ngay trong câu trả lời.
5. Nếu việc gợi ý một bài tập là phù hợp với đoạn hội thoại, điền suggested_task_code = mã bài tập phù hợp nhất từ DANH SÁCH BÀI TẬP dưới đây (copy chính xác phần mã trước dấu |, không thêm bớt ký tự) — để trống nếu không cần gợi ý. Tránh chọn bài có thể phản tác dụng với tình trạng người dùng (vd người mất ngủ thì không nên chọn bài đòi suy ngẫm/phân tích nhiều hoặc vận động mạnh).
   Tương tự, nếu người dùng cần tìm chuyên gia, điền suggested_expert_code = mã chuyên gia phù hợp nhất từ DANH SÁCH CHUYÊN GIA — để trống nếu không cần.
6. Luôn kèm theo mood_analysis: ước lượng (0-100) dựa trên toàn bộ cuộc trò chuyện tính đến tin nhắn này — anxiety (lo âu), stress, mood (tâm trạng, càng cao càng tích cực), depression (dấu hiệu trầm cảm). Đây chỉ là ước lượng tham khảo để hiển thị cho người dùng tự theo dõi, KHÔNG phải chẩn đoán y khoa. Kèm tối đa 5 từ khóa cảm xúc nổi bật (keywords) rút ra từ lời người dùng vừa nói (ví dụ: "mất ngủ", "áp lực công việc", "cô đơn") — không lặp lại từ khóa đã có nếu không còn phù hợp.

--- Thông tin về người dùng đang chat (dùng để trả lời phù hợp, không đọc lại nguyên văn số liệu cho người dùng) ---
${formatMoodContext(ctx)}

--- DANH SÁCH BÀI TẬP (định dạng: mã|tên|thời lượng) ---
${catalog.taskLines}

--- DANH SÁCH CHUYÊN GIA (định dạng: mã|tên|chuyên môn) ---
${catalog.expertLines}`;
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

// Đối chiếu mã LLM chọn với dữ liệu thật. LLM đã được xem toàn bộ catalog nên gần như
// luôn trả về mã hợp lệ; 2 hàm dưới đây chỉ là lưới an toàn cho trường hợp nó gõ sai/bịa
// mã: khi đó dùng embedding tìm bài/chuyên gia gần nghĩa nhất với lý do nó vừa viết,
// thay vì mất luôn gợi ý.
function normalizeCode(value) {
    // LLM đôi khi trả kèm phần sau dấu | hoặc thêm khoảng trắng/dấu ngoặc.
    return String(value || '').split('|')[0].trim().replace(/^["'(\[]+|["')\]]+$/g, '');
}

async function resolveTask(catalog, rawCode, fallbackText) {
    const code = normalizeCode(rawCode);
    if (!code) return null;

    const exact = catalog.taskByCode.get(code);
    if (exact) return exact;

    const vector = await embedText(fallbackText, 'RETRIEVAL_QUERY');
    if (!vector) return null;
    const { rows } = await db.query(
        `select id, code, title, category, difficulty, duration_minutes, xp_reward, description,
                metadata->>'icon' as icon, embedding <=> $1::vector as distance
         from tasks
         where active = true and embedding is not null
         order by distance asc
         limit 1`,
        [`[${vector.join(',')}]`]
    );
    const best = rows[0];
    return best && best.distance <= MAX_MATCH_DISTANCE ? best : null;
}

async function resolveExpert(catalog, rawCode, fallbackText) {
    const code = normalizeCode(rawCode);
    if (!code) return null;

    const exact = catalog.expertByCode.get(code);
    if (exact) return exact;

    const vector = await embedText(fallbackText, 'RETRIEVAL_QUERY');
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
// độ...) và thấy toàn bộ danh sách bài tập/chuyên gia thật để tự chọn, giới hạn chỉ trò
// chuyện trong phạm vi tâm lý/tâm thần, trả lời ngắn.
export async function getChatReply({ userId, message, history = [] }) {
    const [ctx, catalog] = await Promise.all([buildUserContext(userId), getCatalog()]);

    const trimmedHistory = history.slice(-MAX_CHAT_HISTORY);
    const contents = trimmedHistory
        .filter((item) => item && typeof item.text === 'string' && item.text.trim())
        .map((item) => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const parsed = await callGeminiJson(buildChatSystemInstruction(ctx, catalog), contents, CHAT_SCHEMA, { maxOutputTokens: 300 });

    const [matchedTask, matchedExpert] = await Promise.all([
        resolveTask(catalog, parsed.suggested_task_code, parsed.reply),
        resolveExpert(catalog, parsed.suggested_expert_code, parsed.reply)
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
