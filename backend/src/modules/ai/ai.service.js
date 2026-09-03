import { createHash } from 'crypto';
import { env } from '../../config/env.js';
import { db } from '../../config/db.js';
import { buildUserContext } from './ai.context.js';
import { logAiUsage } from './ai.usage.js';

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
    const meta = data?.usageMetadata || {};
    const usage = {
        model,
        promptTokens: Number(meta.promptTokenCount || 0),
        outputTokens: Number(meta.candidatesTokenCount || 0),
        cachedTokens: Number(meta.cachedContentTokenCount || 0)
    };

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!text) {
        throw new Error('Gemini không trả về nội dung');
    }

    try {
        return { parsed: JSON.parse(text), usage };
    } catch {
        throw new Error('Gemini trả về JSON không hợp lệ');
    }
}

// ===== Tool tra cứu tài liệu chuyên môn (RAG service riêng, tenant peaceflow-kb) =====
// PeaceCat tự quyết định KHI NÀO cần gọi (Gemini function-calling) — không gọi cho mọi
// câu hỏi, chỉ khi model thấy cần kiến thức chuyên sâu (tên thang đo, định nghĩa...).
const KB_TOOL = {
    functionDeclarations: [{
        name: 'tra_cuu_tai_lieu_chuyen_mon',
        description: 'Tra cứu tài liệu chuyên môn sức khỏe tâm thần (thang đo PSS, CARS, SDQ-25, RAVEN...) khi người dùng hỏi khái niệm, định nghĩa, cách tính điểm, hoặc kiến thức chuyên sâu cụ thể. KHÔNG gọi khi họ chỉ đang tâm sự/chia sẻ cảm xúc thông thường.',
        parameters: {
            type: 'object',
            properties: { question: { type: 'string', description: 'Câu hỏi cần tra cứu, viết lại rõ ràng nếu cần' } },
            required: ['question']
        }
    }]
};

async function queryKnowledgeBase(question, sessionId) {
    if (!env.ragKbApiKey) return null; // chưa cấu hình -> tool coi như không khả dụng
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${env.ragKbBaseUrl}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': env.ragKbApiKey },
            body: JSON.stringify({ question, session_id: sessionId }),
            signal: controller.signal
        }).finally(() => clearTimeout(timeout));
        if (!response.ok) return null;
        const data = await response.json();
        return { answer: data.answer || '', sources: Array.isArray(data.sources) ? data.sources : [] };
    } catch (error) {
        // Timeout/lỗi mạng KHÔNG được phép làm sập cả cuộc trò chuyện — coi như không có
        // kết quả, để model tự trả lời bằng kiến thức chung.
        console.error('[AI] Tra cứu tài liệu chuyên môn thất bại:', error.message);
        return null;
    }
}

async function executeChatTool(name, args, sessionId) {
    if (name !== 'tra_cuu_tai_lieu_chuyen_mon') {
        return { found: false, note: 'Tool không xác định.' };
    }
    const result = await queryKnowledgeBase(args?.question || '', sessionId);
    if (!result) {
        return { found: false, note: 'Không tra cứu được lúc này — trả lời bằng kiến thức chung, đừng bịa nguồn tài liệu.' };
    }
    if (!result.answer || /don't know|không biết|no answer/i.test(result.answer)) {
        return { found: false, note: 'Tài liệu chuyên môn không đề cập nội dung này.' };
    }
    return { found: true, answer: result.answer, sources: result.sources };
}

// Giống callGeminiJson nhưng hỗ trợ 1 tool function-calling: nếu model quyết định gọi
// tool, thực thi rồi gửi lại kết quả cho model tổng hợp câu trả lời cuối (vẫn theo đúng
// schema). Gemini 3 series cho dùng `tools` + `responseSchema` cùng lúc — đã verify bằng
// request thật (model tự trả JSON ngay khi không cần tool, không tốn thêm lượt nào).
// Lưu ý: role gửi lại functionResponse phải là "USER_CONTEXT" — model này KHÔNG chấp nhận
// role "function" cổ điển (đã verify bằng lỗi 400 thực tế khi thử).
async function callGeminiWithTool(systemInstruction, contents, schema, sessionId, options = {}) {
    if (!env.geminiApiKey) {
        throw new Error('GEMINI_API_KEY chưa được cấu hình');
    }
    const model = env.geminiModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`;
    const buildBody = (currentContents) => ({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: currentContents,
        tools: [KB_TOOL],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {})
        }
    });

    let workingContents = contents;
    const usage = { model, promptTokens: 0, outputTokens: 0, cachedTokens: 0 };
    const MAX_TOOL_ROUNDS = 2; // lưới an toàn — không cho model gọi tool lặp vô hạn

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildBody(workingContents))
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini ${response.status}: ${err}`);
        }
        const data = await response.json();
        const meta = data?.usageMetadata || {};
        usage.promptTokens += Number(meta.promptTokenCount || 0);
        usage.outputTokens += Number(meta.candidatesTokenCount || 0);
        usage.cachedTokens += Number(meta.cachedContentTokenCount || 0);

        const modelTurn = data?.candidates?.[0]?.content;
        const functionCall = modelTurn?.parts?.find((p) => p.functionCall)?.functionCall;

        if (functionCall && round < MAX_TOOL_ROUNDS) {
            const toolResult = await executeChatTool(functionCall.name, functionCall.args, sessionId);
            workingContents = [
                ...workingContents,
                modelTurn,
                { role: 'USER_CONTEXT', parts: [{ functionResponse: { name: functionCall.name, response: toolResult } }] }
            ];
            continue;
        }

        const text = modelTurn?.parts?.map((p) => p.text || '').join('').trim();
        if (!text) {
            throw new Error('Gemini không trả về nội dung');
        }
        try {
            return { parsed: JSON.parse(text), usage };
        } catch {
            throw new Error('Gemini trả về JSON không hợp lệ');
        }
    }
    throw new Error('Gemini gọi tool quá nhiều lượt, không thể hoàn tất');
}

// Không gửi danh sách bài tập trong prompt này nữa (tính năng không còn gợi ý bài tập),
// nhờ đó prompt nhẹ đi khoảng 1.600 token mỗi lượt gọi.
function buildAssessmentSystemInstruction() {
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi tên bài test tự đánh giá cùng điểm số của họ.
Trả về 2 nội dung:

1. summary — LỜI KHUYÊN (3-5 câu): nói với người dùng bằng giọng ấm áp, đồng cảm, ngôi thứ hai ("bạn"). Ghi nhận cảm giác họ có thể đang trải qua, rồi đưa ra hướng thiết thực họ có thể làm để dễ chịu hơn. Không dùng markdown, không dùng thuật ngữ chuyên môn khó hiểu.

2. interpretation — PHÁN ĐOÁN HỖ TRỢ VỀ TÌNH TRẠNG (3-5 câu): giúp người dùng hiểu kết quả này phản ánh điều gì. Nêu:
   - Mức điểm này thường đi cùng những biểu hiện nào trong đời sống hằng ngày (giấc ngủ, khả năng tập trung, năng lượng, các mối quan hệ...).
   - Những mặt nào có thể đang bị ảnh hưởng nhiều nhất, dựa trên điểm từng khía cạnh nếu có.
   - Dấu hiệu cần chú ý theo dõi thêm, và mốc nào thì nên gặp chuyên gia tâm lý/bác sĩ.

GIỚI HẠN BẮT BUỘC cho cả 2 phần:
- KHÔNG chẩn đoán bệnh, KHÔNG gọi tên bệnh lý cho người dùng (không viết kiểu "bạn bị trầm cảm/rối loạn lo âu"). Chỉ nói về BIỂU HIỆN và MỨC ĐỘ mà thang đo phản ánh.
- Diễn đạt bằng ngôn ngữ khả năng ("kết quả cho thấy có thể...", "thường đi cùng với..."), không nói chắc chắn về tình trạng y khoa.
- KHÔNG kê thuốc, không hướng dẫn dùng thuốc.
- Nếu điểm ở mức nặng/nghiêm trọng, nhắc rõ nên tìm chuyên gia tâm lý hoặc bác sĩ để được đánh giá đầy đủ — nhưng nói theo cách trấn an, không gây hoảng.
- Đây là thông tin tham khảo cho người dùng tự hiểu mình, không thay thế chẩn đoán chuyên môn.`;
}

const RECOMMENDATION_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        interpretation: { type: 'string' }
    },
    required: ['summary', 'interpretation']
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

// Đổi số này khi sửa prompt/schema — toàn bộ cache cũ sẽ tự bị vô hiệu (vì cache_key
// thay đổi), tránh việc người dùng nhận lời văn theo prompt cũ.
const ASSESSMENT_PROMPT_VERSION = 'v2';  // v2: bỏ gợi ý bài tập, thêm phán đoán tình trạng
const DAILY_PROMPT_VERSION = 'v2';  // v2: lời khuyên chỉ tập trung cảm xúc, bỏ streak/chỉ số
// Đổi số này khi muốn buộc TẤT CẢ người dùng được sinh lại lời khuyên ở lần bấm nút tiếp
// theo (vd sau khi sửa prompt hoặc sửa cách tính dấu vân tay dữ liệu).
const INSIGHT_PROMPT_VERSION = 'v2';  // v2: bỏ streak khỏi dấu vân tay

// ===== Cache kết quả AI (dùng chung cho nhận xét bài test & lời nhắn sáng) =====
// Chỉ dùng được cho các tính năng mà ĐẦU VÀO không chứa nội dung riêng tư do người dùng
// tự gõ. Chat KHÔNG dùng cache này — xem giải thích ở getChatReply.
async function readSummaryCache(cacheKey) {
    try {
        const { rows } = await db.query(
            `update ai_summary_cache
                set hit_count = hit_count + 1, last_used_at = now()
              where cache_key = $1
              returning summary, tasks, interpretation`,
            [cacheKey]
        );
        return rows[0] || null;
    } catch (error) {
        // Cache lỗi thì coi như không có, gọi AI như bình thường — cache không bao giờ
        // được phép làm sập tính năng chính.
        console.error('[AI] đọc cache thất bại:', error.message);
        return null;
    }
}

function writeSummaryCache(cacheKey, feature, summary, tasks = [], interpretation = null) {
    // Cần có nội dung dùng được mới đáng cache: nhận xét bài test cần phần phán đoán,
    // lời khuyên hằng ngày cần ít nhất 1 bài tập.
    if (!summary) return;
    if (!interpretation && !tasks.length) return;

    db.query(
        `insert into ai_summary_cache (cache_key, feature, summary, tasks, interpretation)
         values ($1, $2, $3, $4::jsonb, $5)
         on conflict (cache_key) do update
           set summary = excluded.summary,
               tasks = excluded.tasks,
               interpretation = excluded.interpretation,
               last_used_at = now()`,
        [
            cacheKey,
            feature,
            summary,
            JSON.stringify(tasks.map((t) => ({ task_code: t.code, reason: t.reason }))),
            interpretation
        ]
    ).catch((error) => console.error('[AI] ghi cache thất bại:', error.message));
}

// Đối chiếu mã bài tập trong cache với danh sách hiện tại — nếu admin đã tắt/xoá bài tập
// kể từ lúc cache được tạo thì bỏ ra, không trả link chết cho người dùng.
function resolveCachedTasks(catalog, tasks) {
    return (Array.isArray(tasks) ? tasks : [])
        .map((t) => {
            const task = catalog.taskByCode.get(t.task_code);
            return task ? { ...task, reason: t.reason || '' } : null;
        })
        .filter(Boolean);
}

function buildAssessmentCacheKey({ assessmentName, totalScore, severity, dimensionScores }) {
    // Sắp xếp key của dimensionScores để 2 object cùng nội dung nhưng khác thứ tự key
    // vẫn cho ra cùng 1 cache_key.
    const dims = dimensionScores && typeof dimensionScores === 'object'
        ? Object.keys(dimensionScores).sort().map((k) => `${k}=${JSON.stringify(dimensionScores[k])}`).join('&')
        : '';
    const raw = [ASSESSMENT_PROMPT_VERSION, assessmentName, String(totalScore), severity || '', dims].join('|');
    return createHash('sha256').update(raw).digest('hex');
}

// Lời khuyên + phán đoán hỗ trợ về tình trạng, sau khi người dùng nộp 1 bài test tự
// đánh giá. KHÔNG còn gợi ý bài tập (đã bỏ theo yêu cầu) nên prompt cũng không cần gửi
// danh sách bài tập — nhẹ hơn ~1.600 token mỗi lượt.
//
// Có cache kết quả: đầu vào không chứa gì riêng tư nên 2 người cùng bài test + cùng điểm
// dùng lại được kết quả của nhau, tốn 0 token (xem giải thích ở migration 0045).
export async function getAssessmentAiSummary({ userId = null, assessmentName, totalScore, severity, dimensionScores }) {
    const cacheKey = buildAssessmentCacheKey({ assessmentName, totalScore, severity, dimensionScores });

    // --- Thử lấy từ cache trước ---
    const cached = await readSummaryCache(cacheKey);
    if (cached) {
        logAiUsage({
            userId,
            feature: 'assessment_summary',
            model: null,
            latencyMs: 0,
            fromCache: true,
            topics: [assessmentName, severity].filter(Boolean)
        });
        return {
            summary: cached.summary || '',
            interpretation: cached.interpretation || ''
        };
    }

    const dimensionLines = dimensionScores && typeof dimensionScores === 'object' && Object.keys(dimensionScores).length
        ? Object.entries(dimensionScores).map(([key, value]) => `- ${key}: ${formatDimensionValue(value)}`).join('\n')
        : '';

    const userContent = `Bài test: "${assessmentName}".
Tổng điểm: ${totalScore}${severity ? `, mức độ: ${severity}` : ''}.
${dimensionLines ? `Điểm theo từng khía cạnh:\n${dimensionLines}` : ''}`;

    const startedAt = Date.now();
    let parsed;
    let usage;
    try {
        ({ parsed, usage } = await callGeminiJson(buildAssessmentSystemInstruction(), [{ parts: [{ text: userContent }] }], RECOMMENDATION_SCHEMA));
    } catch (error) {
        logAiUsage({
            userId,
            feature: 'assessment_summary',
            model: env.geminiModel,
            latencyMs: Date.now() - startedAt,
            success: false,
            errorMessage: error.message
        });
        throw error;
    }

    // Chủ đề = tên bài test (không phải nội dung riêng tư của người dùng).
    logAiUsage({
        userId,
        feature: 'assessment_summary',
        model: usage.model,
        usage,
        latencyMs: Date.now() - startedAt,
        topics: [assessmentName, severity].filter(Boolean)
    });

    const summary = parsed.summary || '';
    const interpretation = parsed.interpretation || '';
    writeSummaryCache(cacheKey, 'assessment_summary', summary, [], interpretation);
    return { summary, interpretation };
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
    return `Bạn là trợ lý tâm lý của app PeaceFlow. Người dùng sẽ gửi dữ liệu tổng hợp về trạng thái cảm xúc gần đây của họ.
Nhiệm vụ:
1. message: viết lời khuyên ngắn gọn (2-4 câu) bằng tiếng Việt, giọng văn ấm áp, đồng cảm.
   CHỈ NÓI VỀ CẢM XÚC VÀ TÂM TRẠNG của người dùng: họ đang cảm thấy thế nào, điều đó ảnh hưởng ra sao, và họ có thể làm gì để dễ chịu hơn.
   TUYỆT ĐỐI KHÔNG nhắc tới: chuỗi ngày liên tục (streak), điểm XP, cấp độ, số lần check-in, số bài test đã làm, tên thể loại bài tập, hay bất kỳ con số/chỉ số nào. Đây là những thứ về game hóa và thống kê, không phải cảm xúc — nhắc tới sẽ làm lời khuyên khô khan và lệch trọng tâm.
   Đừng đọc lại số liệu cho người dùng; hãy diễn đạt bằng cảm xúc (ví dụ nói "khoảng thời gian này khá nhiều áp lực với bạn" thay vì "điểm stress của bạn là 4/5").
   Không dùng thuật ngữ chuyên môn khó hiểu, không đưa ra chẩn đoán y khoa, không dùng markdown.
2. exercises: chọn 1-2 bài tập từ danh sách dưới đây. Mỗi phần tử gồm task_code (copy chính xác phần mã trước dấu |, không thêm bớt ký tự) và reason (1 câu ngắn giải thích vì sao phù hợp với cảm xúc hiện tại của họ). Không chọn trùng cùng 1 bài.
Ưu tiên nhắm đúng vấn đề cảm xúc đang gặp: stress/lo âu cao thì chọn bài làm dịu; năng lượng thấp thì chọn bài nhẹ nhàng nâng tinh thần; đang ổn thì có thể gợi ý hướng mới. Tránh bài có thể phản tác dụng với trạng thái hiện tại.

--- DANH SÁCH BÀI TẬP (định dạng: mã|tên|thời lượng) ---
${catalog.taskLines}`;
}

// Ngữ cảnh dành riêng cho lời khuyên: CHỈ gồm dữ liệu cảm xúc. Cố ý bỏ streak/XP và các
// chỉ số game hóa ra khỏi đây — AI không thấy thì không thể nhắc tới, chắc chắn hơn là
// chỉ dặn trong prompt. Phần sở thích bài tập được tách riêng và ghi rõ "chỉ dùng để chọn
// bài tập", tránh việc AI đem tên thể loại vào lời khuyên.
function formatInsightContext(ctx) {
    const mood = ctx.moodTrend || {};
    const assessment = ctx.assessmentTrend || {};
    const lines = [];

    if (mood.checkin_count) {
        lines.push(`Cảm xúc 14 ngày qua (thang 5): tâm trạng ${mood.mood_avg ?? '?'}, lo âu ${mood.anxiety_avg ?? '?'}, căng thẳng ${mood.stress_avg ?? '?'}, năng lượng ${mood.energy_avg ?? '?'}. Xu hướng gần đây: ${mood.trend}.`);
    } else {
        lines.push('Chưa có dữ liệu cảm xúc gần đây — hãy viết lời khuyên chung, nhẹ nhàng, mời gọi họ chú ý tới cảm xúc của mình.');
    }

    if (assessment.count) {
        lines.push(`Xu hướng mức độ qua các bài test tự đánh giá: ${assessment.trend}.`);
    }

    // Phần dưới đây CHỈ để chọn bài tập phù hợp, không được đưa vào lời khuyên.
    const prefs = [];
    if (ctx.taskPatterns?.favorite_category) prefs.push(`thường làm bài thuộc nhóm ${ctx.taskPatterns.favorite_category}`);
    if (ctx.topRatedTasks?.length) prefs.push(`từng thấy hiệu quả với: ${ctx.topRatedTasks.map((t) => t.title).join(', ')}`);
    if (ctx.untriedCategories?.length) prefs.push(`chưa thử nhóm: ${ctx.untriedCategories.join(', ')}`);
    if (prefs.length) {
        lines.push(`(Thông tin nội bộ chỉ để CHỌN bài tập, KHÔNG nhắc trong lời khuyên: ${prefs.join('; ')}.)`);
    }

    return lines.join('\n');
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
//
// Có cache kết quả theo NGỮ CẢNH (không theo user): ngữ cảnh chỉ gồm số liệu tổng hợp
// (điểm trung bình, streak, thể loại hay làm...) nên nhiều người có cùng ngữ cảnh sẽ dùng
// lại được kết quả của nhau. Đo trên dữ liệu thật: 173/235 người dùng (74%) chưa có dữ
// liệu nên ngữ cảnh giống hệt nhau. Cache này cũng khiến 1 người dùng chỉ tốn token 1 lần
// cho tới khi dữ liệu của họ đổi — kể cả khi dùng nhiều thiết bị hoặc server khởi động lại
// (khác với cache trong RAM ở route, vốn mất mỗi lần Vercel tạo container mới).
// Chi dung noi bo boi generateUserInsight (khong con route nao goi truc tiep).
async function getDailyMessage(userId, ctx = null) {
    if (!ctx) ctx = await buildUserContext(userId);
    const catalog = await getCatalog();

    const moodContext = formatInsightContext(ctx);
    const cacheKey = createHash('sha256')
        .update([DAILY_PROMPT_VERSION, moodContext].join('|'))
        .digest('hex');

    const cached = await readSummaryCache(cacheKey);
    if (cached) {
        logAiUsage({
            userId,
            feature: 'daily_message',
            model: null,
            latencyMs: 0,
            fromCache: true,
            topics: ctx.moodTrend?.trend && ctx.moodTrend.trend !== 'unknown'
                ? [`mood:${ctx.moodTrend.trend}`]
                : []
        });
        return {
            recommendation: cached.summary || '',
            exercises: resolveCachedTasks(catalog, cached.tasks)
        };
    }

    const startedAt = Date.now();
    let parsed;
    let usage;
    try {
        ({ parsed, usage } = await callGeminiJson(buildDailySystemInstruction(catalog), [{ parts: [{ text: moodContext }] }], DAILY_MESSAGE_SCHEMA));
    } catch (error) {
        logAiUsage({
            userId,
            feature: 'daily_message',
            model: env.geminiModel,
            latencyMs: Date.now() - startedAt,
            success: false,
            errorMessage: error.message
        });
        throw error;
    }

    // Chủ đề = xu hướng tâm trạng tổng hợp (không phải nội dung riêng tư).
    logAiUsage({
        userId,
        feature: 'daily_message',
        model: usage.model,
        usage,
        latencyMs: Date.now() - startedAt,
        // Bỏ qua trend 'unknown' (nghĩa là chưa đủ dữ liệu check-in) — đó không phải một
        // chủ đề, để vào sẽ làm nhiễu bảng "chủ đề được hỏi nhiều nhất" của admin.
        topics: ctx.moodTrend?.trend && ctx.moodTrend.trend !== 'unknown'
            ? [`mood:${ctx.moodTrend.trend}`]
            : []
    });

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

    const recommendation = parsed.message || '';
    writeSummaryCache(cacheKey, 'daily_message', recommendation, exercises);
    return { recommendation, exercises };
}

// ===================== LỜI KHUYÊN THEO YÊU CẦU (bấm nút mới chạy) =====================

// Dấu vân tay dữ liệu CẢM XÚC của người dùng. LÀM THÔ CÓ CHỦ Ý: làm tròn điểm về 0.5,
// chỉ lấy SỐ LƯỢNG theo nhóm thay vì số chính xác... để những dao động nhỏ (điểm trung
// bình lệch 0.1, thêm 1 lần check-in) KHÔNG bị coi là "thay đổi đáng kể" và không tốn
// token gọi lại AI. Cố ý KHÔNG tính streak: lời khuyên không nói về streak nữa nên
// streak đổi cũng không cần sinh lại. Đổi các mốc dưới đây nếu muốn nhạy hơn / thô hơn.
function bucketCount(value) {
    const n = Number(value || 0);
    if (n <= 0) return '0';
    if (n <= 3) return '1-3';
    if (n <= 10) return '4-10';
    return '11+';
}

function roundHalf(value) {
    if (value === null || value === undefined) return '?';
    return (Math.round(Number(value) * 2) / 2).toFixed(1);
}

function buildInsightSignature(ctx) {
    const mood = ctx.moodTrend || {};
    const assessment = ctx.assessmentTrend || {};

    const parts = [
        INSIGHT_PROMPT_VERSION,
        `mood=${roundHalf(mood.mood_avg)}`,
        `anx=${roundHalf(mood.anxiety_avg)}`,
        `str=${roundHalf(mood.stress_avg)}`,
        `enr=${roundHalf(mood.energy_avg)}`,
        `trend=${mood.trend || 'unknown'}`,
        `checkins=${bucketCount(mood.checkin_count)}`,
        `atrend=${assessment.trend || 'unknown'}`,
        `acount=${bucketCount(assessment.count)}`,
        `fav=${ctx.taskPatterns?.favorite_category || '-'}`,
        `untried=${(ctx.untriedCategories || []).length}`,
        `time=${ctx.preferredTime || '-'}`
    ];
    return createHash('sha256').update(parts.join('|')).digest('hex');
}

// Đọc lời khuyên đã lưu của người dùng — KHÔNG gọi AI, chỉ đọc DB. Dùng để Dashboard
// hiển thị lại lời khuyên lần trước ngay khi mở trang mà không tốn token.
export async function getStoredUserInsight(userId) {
    const catalog = await getCatalog();
    const { rows } = await db.query(
        `select signature, summary, tasks, generated_at from ai_user_insights where user_id = $1`,
        [userId]
    );
    const row = rows[0];
    if (!row) return null;

    return {
        summary: row.summary || '',
        exercises: resolveCachedTasks(catalog, row.tasks),
        generatedAt: row.generated_at,
        signature: row.signature
    };
}

// Sinh lời khuyên khi người dùng bấm nút.
//   - Dữ liệu chưa thay đổi đáng kể so với lần chạy gần nhất => trả lại ĐÚNG lời khuyên cũ,
//     không gọi AI (changed = false).
//   - Dữ liệu đã thay đổi => gọi AI, ghi đè, trả về lời khuyên mới (changed = true).
export async function generateUserInsight(userId) {
    const ctx = await buildUserContext(userId);
    const signature = buildInsightSignature(ctx);

    const stored = await getStoredUserInsight(userId);
    if (stored && stored.signature === signature) {
        logAiUsage({
            userId,
            feature: 'daily_message',
            model: null,
            latencyMs: 0,
            fromCache: true,
            topics: ctx.moodTrend?.trend && ctx.moodTrend.trend !== 'unknown'
                ? [`mood:${ctx.moodTrend.trend}`]
                : []
        });
        return { ...stored, changed: false };
    }

    // Dữ liệu đã đổi -> sinh mới. getDailyMessage vẫn có cache theo nội dung ngữ cảnh nên
    // nếu có người khác cùng ngữ cảnh thì vẫn không tốn token.
    const fresh = await getDailyMessage(userId, ctx);

    await db.query(
        `insert into ai_user_insights (user_id, signature, summary, tasks, generated_at, updated_at)
         values ($1, $2, $3, $4::jsonb, now(), now())
         on conflict (user_id) do update
           set signature = excluded.signature,
               summary = excluded.summary,
               tasks = excluded.tasks,
               generated_at = now(),
               updated_at = now()`,
        [
            userId,
            signature,
            fresh.recommendation || '',
            JSON.stringify((fresh.exercises || []).map((t) => ({ task_code: t.code, reason: t.reason })))
        ]
    );

    return {
        summary: fresh.recommendation || '',
        exercises: fresh.exercises || [],
        generatedAt: new Date().toISOString(),
        signature,
        changed: true
    };
}

const CHAT_SCHEMA = {
    type: 'object',
    properties: {
        reply: { type: 'string' },
        suggested_task_code: { type: 'string' },
        suggested_expert_code: { type: 'string' },
        offered_task: { type: 'boolean' },
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

function buildChatSystemInstruction(ctx, catalog, options = {}) {
    // Model không tự biết được các trạng thái này vì lịch sử gửi lên chỉ có phần chữ,
    // nên phải nói thẳng cho nó ở từng lượt.
    let turnNote;
    if (options.previousTurnSuggested) {
        turnNote = 'Lượt trước bạn đã gắn một thẻ bài tập rồi: lượt này BẮT BUỘC để trống suggested_task_code, không mời làm bài tập, không hỏi có muốn gợi ý nữa — quay lại lắng nghe và đi sâu hơn.';
    } else if (options.includeTaskList) {
        turnNote = 'Lượt trước bạn đã HỎI họ có muốn gợi ý bài tập không, nên lượt này bạn được cấp DANH SÁCH BÀI TẬP. Lời họ vừa nói đồng ý thì chọn một mã phù hợp cho suggested_task_code; họ từ chối hoặc lảng sang chuyện khác thì để trống và tuyệt đối không hỏi lại lần nữa.';
    } else {
        turnNote = 'Lượt này bạn KHÔNG có DANH SÁCH BÀI TẬP nên BẮT BUỘC để trống suggested_task_code (không tự nghĩ ra mã). Nếu thấy một bài tập có thể giúp thì chỉ HỎI xem họ có muốn gợi ý không, và đặt offered_task = true — thà không có thẻ còn hơn tự ý gửi.';
    }

    return `Bạn là PeaceCat — không phải trợ lý tư vấn, mà là người bạn thân đang ngồi cạnh người dùng. Nhắn tin tiếng Việt như người thật: ấm, thật lòng, không lên giọng chuyên gia.

NHIỆM VỤ SỐ 1 — GỌI TÊN VẤN ĐỀ CỐT LÕI BÊN TRONG HỌ:
Điều họ kể chỉ là bề mặt; bên dưới luôn có một mất mát, một nỗi sợ, một nhu cầu chưa được đáp ứng, hoặc một điều họ tự nghĩ xấu về bản thân. Ví dụ "thất tình, buồn quá" — cốt lõi có thể là sợ mình không đủ tốt để được yêu, hoặc trống rỗng vì mất chỗ dựa mỗi tối.
Mỗi lượt: đọc cả hội thoại, tìm điều đang làm họ đau nhất mà chính họ chưa nói ra được, rồi GỌI TÊN nó bằng lời cụ thể dưới dạng phỏng đoán nhẹ để họ xác nhận hoặc sửa lại ("Mình đoán cái làm bạn nặng nhất không hẳn là ... mà là ..., phải không?"). Chưa đủ dữ kiện thì hỏi MỘT câu cụ thể, đừng đoán bừa.
Gọi tên đúng cốt lõi quan trọng hơn mọi lời an ủi và mọi bài tập.

CẤM — đây là thứ làm câu trả lời nghe như máy:
- Sáo ngữ dán vào ai cũng đúng: "khoảng thời gian khó khăn", "hãy dịu dàng với chính mình", "cho bản thân thời gian", "mình luôn ở đây", "rồi sẽ ổn". Tự kiểm: câu nào gửi cho người lạ nào cũng đúng thì xóa.
- Lặp khuôn qua các lượt (đồng cảm → an ủi → mời làm bài tập). Điều đã nói rồi thì lượt này phải đi sâu thêm một bước.
- Giảng đạo, dạy lý thuyết tâm lý, liệt kê "bạn nên A, B, C". Nhắc điểm/streak/số liệu app.

GỢI Ý BÀI TẬP — LUÔN PHẢI HỎI TRƯỚC, KHÔNG BAO GIỜ TỰ Ý GỬI:
Không bao giờ điền suggested_task_code ở lượt bạn chưa hỏi ý họ trước — kể cả khi họ hỏi thẳng "nên làm gì". Nếu thấy một bài có thể giúp, hãy HỎI một câu tự nhiên ở cuối câu trả lời ("bạn có muốn mình gợi ý một việc nhỏ để làm không?") và đặt offered_task = true. Chỉ điền suggested_task_code ở đúng lượt kế tiếp, sau khi họ đã đồng ý. Không hỏi lúc họ đang trút lòng, không hỏi 2 lượt liền nhau, họ từ chối một lần thì thôi hẳn không hỏi lại.
LƯU Ý RIÊNG LƯỢT NÀY: ${turnNote}

QUY TẮC KHÁC:
1. Chỉ nói về cảm xúc, sức khỏe tâm thần, chuyện đời sống đang ảnh hưởng tinh thần họ, bài tập/chuyên gia trong app, dữ liệu cá nhân của họ. Hỏi ngoài phạm vi (lập trình, thời sự, kiến thức chung...) thì từ chối lịch sự, mời họ quay lại chuyện của mình.
2. Dài 2-5 câu, viết liền như một tin nhắn, không markdown, không gạch đầu dòng. Khi họ xin lời khuyên: đưa việc CỤ THỂ làm được ngay hôm nay, gắn đúng cái cốt lõi vừa nói ra, không nói "hãy chăm sóc bản thân".
3. Không chẩn đoán, không gọi tên bệnh lý cho họ. Có dấu hiệu tự hại/tự tử: nói thẳng sự lo lắng của bạn và khuyên liên hệ hotline hoặc chuyên gia ngay.
4. suggested_expert_code mặc định TRỐNG — chỉ điền khi họ hỏi về chuyên gia/muốn gặp người có chuyên môn, hoặc khi nguy cấp; đừng tự mời gặp chuyên gia lúc họ chỉ đang tâm sự. suggested_task_code copy chính xác phần mã trước dấu | trong DANH SÁCH BÀI TẬP, tránh bài phản tác dụng với tình trạng của họ.
5. Luôn kèm mood_analysis: anxiety, stress, mood (càng cao càng tích cực), depression — 0-100 dựa trên cả hội thoại, chỉ để tham khảo, không phải chẩn đoán. Kèm tối đa 5 keywords ưu tiên mô tả cốt lõi ("sợ không đủ tốt", "mất chỗ dựa") thay vì từ chung ("buồn").
6. Có tool tra_cuu_tai_lieu_chuyen_mon — chỉ gọi khi họ hỏi thẳng về khái niệm/thang đo/định nghĩa chuyên môn cụ thể (vd "PSS là gì", "thang CARS đánh giá gì"), KHÔNG gọi khi họ chỉ đang tâm sự. Nếu tool trả found=false thì đừng nhắc tới việc "đã tra cứu", trả lời bằng hiểu biết chung, không bịa nguồn.

--- Người dùng đang chat (dùng để hiểu họ, không đọc lại số liệu cho họ) ---
${formatMoodContext(ctx)}

${options.includeTaskList ? `--- DANH SÁCH BÀI TẬP (mã|tên|thời lượng) ---\n${catalog.taskLines}\n\n` : ''}--- DANH SÁCH CHUYÊN GIA (mã|tên|chuyên môn) ---
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
//
// CỐ Ý KHÔNG CACHE tính năng này, vì 3 lý do:
// 1. Quyền riêng tư: muốn cache thì phải lấy nội dung người dùng gõ làm khóa, và câu AI
//    trả lời thường nhắc lại chính điều họ vừa kể ("nghe bạn chia sẻ về áp lực deadline...").
//    Lưu những thứ đó vào một bảng cache dùng chung là đi ngược nguyên tắc "không lưu nội
//    dung tin nhắn" đã chọn cho app sức khỏe tâm thần này.
// 2. Trải nghiệm: hội thoại mà trả lời y hệt nhau thì mất tự nhiên — người dùng nói lại
//    một câu sẽ nhận đúng từng chữ câu trả lời cũ.
// 3. Hiệu quả gần như bằng 0: tin nhắn là văn bản tự do, cộng thêm lịch sử hội thoại và
//    dữ liệu cá nhân khác nhau ở mỗi người, nên gần như không bao giờ trùng khóa cache.
export async function getChatReply({ userId, message, history = [] }) {
    const trimmedHistory = history.slice(-MAX_CHAT_HISTORY);
    const [ctx, catalog] = await Promise.all([buildUserContext(userId), getCatalog()]);

    const contents = trimmedHistory
        .filter((item) => item && typeof item.text === 'string' && item.text.trim())
        .map((item) => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Model không tự biết được lượt trước đã làm gì (lịch sử gửi lên chỉ có phần chữ),
    // nên phải nói cho nó và chặn cứng ở code — không tin tưởng riêng vào việc nó tuân
    // prompt. Bài tập LUÔN phải hỏi trước rồi mới gợi ý (yêu cầu người dùng): lượt đã
    // gắn thẻ thì thôi; lượt trước hỏi ý thì lượt này mới được cấp danh sách 122 bài để
    // chọn theo câu trả lời của họ; các lượt khác hoàn toàn không thấy danh sách, nên
    // dù model có "muốn" gợi ý cũng không có mã nào để điền — không thể tự ý gửi.
    const lastModelTurn = [...trimmedHistory].reverse().find((item) => item && item.role !== 'user');
    const previousTurnSuggested = Boolean(lastModelTurn?.hadSuggestion);
    const previousTurnOffered = Boolean(lastModelTurn?.offeredTask) && !previousTurnSuggested;
    const includeTaskList = previousTurnOffered;

    const startedAt = Date.now();
    let parsed;
    let usage;
    try {
        ({ parsed, usage } = await callGeminiWithTool(
            buildChatSystemInstruction(ctx, catalog, { previousTurnSuggested, includeTaskList }),
            contents,
            CHAT_SCHEMA,
            `peacecat_${userId}`,
            { maxOutputTokens: 420 }
        ));
    } catch (error) {
        logAiUsage({
            userId,
            feature: 'chat',
            model: env.geminiModel,
            latencyMs: Date.now() - startedAt,
            success: false,
            errorMessage: error.message
        });
        throw error;
    }

    // Chủ đề = từ khóa do chính AI rút ra (vd "mất ngủ", "áp lực công việc") — KHÔNG lưu
    // câu người dùng gõ hay câu AI trả lời, xem giải thích ở migration 0044.
    logAiUsage({
        userId,
        feature: 'chat',
        model: usage.model,
        usage,
        latencyMs: Date.now() - startedAt,
        topics: parsed.mood_analysis?.keywords || []
    });

    // Chặn cứng: chỉ resolve mã bài tập khi lượt này thực sự được cấp danh sách (tức là
    // đã hỏi ý ở lượt trước và người dùng đang trả lời) — không tin riêng vào việc model
    // tuân prompt "phải hỏi trước". Không cấp danh sách thì dù parsed có trả về mã gì
    // cũng bỏ qua, không đi resolve (kể cả qua embedding fallback).
    const taskCode = includeTaskList && !previousTurnSuggested ? parsed.suggested_task_code : null;
    const [matchedTask, matchedExpert] = await Promise.all([
        resolveTask(catalog, taskCode, parsed.reply),
        resolveExpert(catalog, parsed.suggested_expert_code, parsed.reply)
    ]);
    const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));
    const analysis = parsed.mood_analysis || {};

    return {
        reply: parsed.reply || '',
        suggestedTask: matchedTask,
        suggestedExpert: matchedExpert,
        offeredTask: Boolean(parsed.offered_task) && !matchedTask,
        moodAnalysis: {
            anxiety: clampScore(analysis.anxiety),
            stress: clampScore(analysis.stress),
            mood: clampScore(analysis.mood),
            depression: clampScore(analysis.depression),
            keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5) : []
        }
    };
}
