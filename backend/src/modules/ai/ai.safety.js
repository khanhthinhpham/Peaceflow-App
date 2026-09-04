import { db } from '../../config/db.js';

// ===== Lưới an toàn PHÍA SERVER cho dấu hiệu khủng hoảng trong chat =====
//
// Vì sao cần, khi frontend đã có sẵn phần này (DANGER_KEYWORDS trong MoodChatView.vue)?
//   1. Kiểm tra ở client là kiểm tra tự nguyện: gọi API trực tiếp, app mobile sau này,
//      hay client bị sửa đều bỏ qua được — server thì không ai bỏ qua được.
//   2. Client phát hiện xong chỉ mở popup rồi thôi, KHÔNG ghi lại gì. Risk engine đếm
//      emergency_logs 7 ngày gần nhất (risk-engine.service.js:184) nên nếu không ghi thì
//      người dùng có thể nói ra ý định tự hại trong chat mà chỉ số rủi ro vẫn bằng 0 —
//      tín hiệu mạnh nhất trong app lại là tín hiệu không dẫn tới hành động nào.
//   3. Câu trả lời của AI có kèm nguồn trợ giúp hay không hiện phụ thuộc hoàn toàn vào
//      việc model tuân prompt. Model bỏ sót một lần là hậu quả thật, nên phải có lớp bảo
//      đảm bằng code.
// Client vẫn giữ phần kiểm tra của nó (phản hồi tức thì, không phải chờ mạng); phần dưới
// đây là lớp bảo đảm, không phải lớp thay thế.
//
// CỐ Ý ưu tiên BẮT SÓT ÍT hơn là BẮT NHẦM ÍT (recall > precision): bắt nhầm thì người
// dùng đọc thêm một câu về nguồn trợ giúp — bất tiện nhẹ; bắt sót thì mất một cơ hội
// giúp người đang có ý định tự hại.
const CRISIS_PHRASES = [
    'tự tử', 'tự sát', 'tự kết liễu',
    'muốn chết', 'chết đi cho rồi', 'chết cho xong', 'thà chết',
    'không muốn sống', 'ko muốn sống', 'chẳng muốn sống', 'không thiết sống',
    'sống không còn ý nghĩa', 'sống vô nghĩa', 'không còn lý do để sống',
    'chẳng còn lý do để sống', 'không còn thiết gì nữa',
    'tự hại', 'tự làm đau', 'cắt tay', 'rạch tay',
    'kết thúc tất cả', 'kết thúc cuộc đời', 'kết thúc mọi thứ',
    'muốn biến mất', 'biến mất mãi mãi', 'biến mất khỏi thế giới',
    'tuyệt vọng hoàn toàn', 'không lối thoát', 'bế tắc hoàn toàn'
];

// Bản không dấu — người Việt gõ chat rất hay bỏ dấu. CHỈ nhận những cụm mà khi bỏ dấu
// vẫn KHÔNG trùng nghĩa vô hại nào.
// LƯU Ý QUAN TRỌNG: cố ý KHÔNG có 'tu tu' trong danh sách này, vì "từ từ" (rất phổ biến:
// "từ từ thôi", "để từ từ") bỏ dấu cũng thành "tu tu" — thêm vào là bắt nhầm liên tục.
// Cũng không có 'tu hai' ("từ hai ngày trước" -> "tu hai ngay truoc").
const CRISIS_PHRASES_NO_DIACRITICS = [
    'tu sat', 'muon chet', 'tha chet',
    'khong muon song', 'ko muon song', 'chang muon song',
    'khong con ly do de song', 'song khong con y nghia',
    'ket thuc cuoc doi', 'ket thuc tat ca',
    'muon bien mat', 'bien mat mai mai'
];

// NFD tách nguyên âm khỏi dấu rồi xoá dấu (U+0300..U+036F). Riêng "đ" không phân rã
// bằng NFD nên phải thay tay.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function stripDiacritics(text) {
    return text.normalize('NFD').replace(COMBINING_MARKS, '').replace(/đ/g, 'd');
}

// Trả về mảng các cụm khớp (rỗng = không có dấu hiệu). Trả mảng thay vì boolean để ghi
// lại được ĐÃ khớp vì cụm nào — phục vụ việc rà lại chất lượng bộ từ khoá về sau.
export function detectCrisisSignals(text) {
    const raw = String(text || '').toLowerCase();
    if (!raw.trim()) return [];

    const matched = new Set();
    for (const phrase of CRISIS_PHRASES) {
        if (raw.includes(phrase)) matched.add(phrase);
    }

    const plain = stripDiacritics(raw);
    for (const phrase of CRISIS_PHRASES_NO_DIACRITICS) {
        if (plain.includes(stripDiacritics(phrase))) matched.add(phrase);
    }

    return [...matched];
}

// Câu trả lời của model đã tự nêu nguồn trợ giúp CỤ THỂ chưa. Cố ý chỉ nhận các dấu hiệu
// cụ thể (số điện thoại, "đường dây nóng", "cấp cứu"...) — KHÔNG nhận mỗi chữ "chuyên gia",
// vì model nhắc "chuyên gia" gần như mọi lượt, dùng nó làm bằng chứng thì lớp bảo đảm này
// sẽ gần như không bao giờ chạy.
function replyHasConcreteHelp(reply) {
    const text = String(reply || '').toLowerCase();
    // 115/113 phải đứng riêng, KHÔNG được nằm lẫn trong một dãy số dài hơn. Nếu không:
    // model bịa số kiểu "1900115678" sẽ khớp phần "115" -> code tưởng model đã nêu nguồn
    // trợ giúp thật -> không nối số đúng vào -> người dùng chỉ thấy số bịa. Đã kiểm chứng
    // đúng ca này khi rà lại lưới an toàn.
    if (/(?<![0-9])(115|113)(?![0-9])/.test(text)) return true;
    return /0931773637|hotline|đường dây nóng|duong day nong|cấp cứu|cap cuu|khẩn cấp|khan cap/.test(text);
}

// Nguồn trợ giúp nối thêm vào câu trả lời khi model không tự nêu.
// KHI SỬA SỐ: đây là nơi thứ hai giữ số đường dây nóng (nơi thứ nhất là frontend —
// EmergencyView.vue, MoodChatView.vue và các trang có popup khẩn cấp). Sửa số thì phải
// sửa cả hai, nếu không người dùng sẽ đọc một số mà bấm gọi một số khác — chính lỗi đã
// từng tồn tại (hiển thị 0931773637 nhưng link tel: lại là 1800599920).
// Cả 2 số dưới đây đều là số thật của app: 0931773637 (đường dây nóng sức khỏe tâm thần)
// và 115 (cấp cứu y tế). CỐ Ý nêu số trực tiếp trong câu trả lời chứ không chỉ bảo "bấm
// nút": người đang khủng hoảng cần thấy ngay số để gọi, không phải thêm một bước bấm.
const MENTAL_HEALTH_HOTLINE = '0931773637';
const CRISIS_RESOURCE_TEXT = `Mình nói thẳng nhé: điều bạn vừa nói làm mình lo cho bạn thật sự. Nếu cảm giác này đang dâng lên ngay lúc này, bạn gọi ngay đường dây nóng sức khỏe tâm thần ${MENTAL_HEALTH_HOTLINE} (miễn phí, 24/7), hoặc 115 nếu cần cấp cứu. Bạn không phải chịu một mình chuyện này.`;

// Bảo đảm câu trả lời cuối cùng LUÔN có nguồn trợ giúp cụ thể khi phát hiện dấu hiệu.
export function ensureCrisisResources(reply) {
    const text = String(reply || '').trim();
    if (replyHasConcreteHelp(text)) return text;
    return text ? `${text}\n\n${CRISIS_RESOURCE_TEXT}` : CRISIS_RESOURCE_TEXT;
}

// Ghi nhận vào emergency_logs — cùng bảng/cùng event_type 'crisis_flag' mà
// emergency.routes.js đang dùng, nên: risk engine đếm được (làm tăng chỉ số rủi ro của
// người dùng), và /emergency/summary cũng thống kê được.
// Kiểu "bắn và quên" giống logAiUsage: việc ghi log KHÔNG được phép làm hỏng lượt chat.
export function logCrisisFlag(userId, matchedPhrases = []) {
    if (!userId) return;
    // Cùng định dạng cảnh báo với emergency.routes.js để admin lọc log theo một từ khoá.
    console.warn(`[CRISIS_FLAG] user_id=${userId} source=ai_chat matched=${matchedPhrases.length}`);
    db.query(
        `insert into emergency_logs (user_id, event_type, payload)
         values ($1, 'crisis_flag', $2::jsonb)`,
        [
            userId,
            // Chỉ lưu cụm từ khoá đã khớp (danh sách cố định do ta tự định nghĩa), KHÔNG
            // lưu câu người dùng gõ — giữ đúng nguyên tắc không lưu nội dung chat.
            JSON.stringify({ source: 'ai_chat', matched: matchedPhrases })
        ]
    ).catch((error) => {
        console.error('[AI] ghi crisis_flag thất bại:', error.message);
    });
}
