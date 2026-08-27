/**
 * Gán nhãn "bài tập này phù hợp với tình trạng gì / KHÔNG nên dùng khi nào" cho toàn bộ
 * bài tập đang active, lưu vào 2 cột vốn đang để rỗng: triggers_supported và
 * contraindications. Chạy 1 lần (và chạy lại khi thêm/sửa bài tập mới).
 *
 * node src/scripts/label-task-triggers.js
 */

import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { TRIGGER_CODES, formatTriggerList } from '../modules/ai/taskTaxonomy.js';

const CONCURRENCY = 5;

const SYSTEM_INSTRUCTION = `Bạn là chuyên gia tâm lý đang phân loại thư viện bài tập của app sức khỏe tâm thần PeaceFlow.

Người dùng sẽ gửi thông tin 1 bài tập. Hãy phân loại bài tập đó theo DANH SÁCH TÌNH TRẠNG cố định dưới đây:
${formatTriggerList()}

Nhiệm vụ:
1. triggers_supported: liệt kê ĐẦY ĐỦ các mã tình trạng mà bài tập này thực sự giúp cải thiện. Một bài tập tốt thường có NHIỀU tác dụng — đừng chỉ chọn 1 mã nếu nó thực sự giúp nhiều tình trạng.
2. contraindications: liệt kê các mã tình trạng mà cơ chế của bài tập này có thể làm NẶNG THÊM. Để mảng rỗng nếu không có chống chỉ định rõ ràng.

NGUYÊN TẮC PHÂN LOẠI (áp dụng cho mọi tình trạng, khách quan theo bằng chứng tâm lý học):
- Xét theo CƠ CHẾ TÁC ĐỘNG thật của bài tập (nó làm gì với cơ thể/tâm trí), KHÔNG xét theo từ ngữ bề mặt trong tên bài. Tên bài có chứa một từ khóa không tự động nghĩa là bài đó giúp tình trạng tương ứng.
- Ngược lại, một bài không nhắc tên tình trạng nào vẫn có thể giúp nhiều tình trạng, nếu cơ chế của nó phù hợp.
- Chỉ gán chống chỉ định khi có lý do cơ chế rõ ràng, không gán theo cảm tính.
- HIỆU CHỈNH ĐỘ CHỌN LỌC: chỉ gán một mã khi bài tập nhắm TRỰC TIẾP vào cơ chế của tình trạng đó, không gán chỉ vì "nhìn chung cũng có lợi cho sức khỏe tâm thần". Đây là app tâm lý nên hầu hết bài tập đều gián tiếp tốt cho căng thẳng/lo âu — nhưng nếu gán stress hay lo_au cho gần như MỌI bài thì nhãn trở nên vô dụng khi lọc. Một bài tập điển hình nhắm trực tiếp vào 2-5 tình trạng; vượt quá 6 là dấu hiệu bạn đang gán quá rộng.

Tham khảo cơ chế của một số nhóm bài tập (chỉ để minh họa cách suy luận, không phải danh sách đầy đủ):
- Điều hòa hô hấp / thiền / chánh niệm / giãn cơ: hạ hoạt hóa hệ thần kinh giao cảm → thường giúp nhiều tình trạng cùng lúc (lo âu, căng thẳng, khó tập trung, khó vào giấc, hạ nhịp khi khủng hoảng).
- Vận động thể chất, âm nhạc sôi động, hoạt động kích thích: nâng tâm trạng và năng lượng → giúp tâm trạng thấp, kiệt sức, giải tỏa tức giận; nhưng gây tỉnh táo/kích thích nên có thể phản tác dụng khi cần hạ nhịp để ngủ, hoặc khi đang khủng hoảng cấp cần làm dịu nhanh.
- Suy ngẫm, tự vấn, viết/phân tích bản thân: tăng nhận diện cảm xúc và lòng tự trọng → giúp tự tin thấp, tâm trạng thấp; nhưng kích hoạt suy nghĩ miên man nên có thể làm nặng thêm khi đầu óc đang quay cuồng (khó vào giấc, khủng hoảng cấp).
- Kết nối xã hội, giúp đỡ người khác: giảm cảm giác cô lập → giúp cô đơn, tâm trạng thấp; nhưng tiêu tốn năng lượng và cần khả năng giao tiếp nên có thể quá sức khi đang kiệt sức hoặc khủng hoảng.
- Điều chỉnh môi trường/thói quen (giảm ánh sáng, hạn chế thiết bị điện tử, sắp xếp không gian): tác động qua nhịp sinh học và giảm tải kích thích.

CHỈ dùng các mã có trong danh sách trên, không tự tạo mã mới.`;

const SCHEMA = {
    type: 'object',
    properties: {
        triggers_supported: { type: 'array', items: { type: 'string' } },
        contraindications: { type: 'array', items: { type: 'string' } }
    },
    required: ['triggers_supported', 'contraindications']
};

function sanitizeCodes(values) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.map((v) => String(v || '').trim()).filter((v) => TRIGGER_CODES.includes(v)))];
}

async function labelTask(task) {
    const benefits = Array.isArray(task.benefits) ? task.benefits.join('; ') : '';
    const userContent = `Tên bài tập: ${task.title}
Mô tả: ${task.description || '(không có)'}
Thể loại: ${task.category}, thời lượng ${task.duration_minutes} phút
Lợi ích được ghi sẵn: ${benefits || '(không có)'}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: [{ parts: [{ text: userContent }] }],
                generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    const parsed = JSON.parse(text);

    return {
        triggers: sanitizeCodes(parsed.triggers_supported),
        contraindications: sanitizeCodes(parsed.contraindications)
    };
}

async function main() {
    if (!env.geminiApiKey) {
        throw new Error('GEMINI_API_KEY chưa được cấu hình');
    }

    const { rows } = await db.query(
        `select id, title, description, category, duration_minutes, metadata->'benefits' as benefits
         from tasks where active = true order by code`
    );
    console.log(`Đang gán nhãn cho ${rows.length} bài tập (song song ${CONCURRENCY})...`);

    let done = 0;
    let failed = 0;
    const queue = [...rows];

    async function worker() {
        while (queue.length) {
            const task = queue.shift();
            try {
                const { triggers, contraindications } = await labelTask(task);
                await db.query(
                    `update tasks set triggers_supported = $1::jsonb, contraindications = $2::jsonb, updated_at = now() where id = $3`,
                    [JSON.stringify(triggers), JSON.stringify(contraindications), task.id]
                );
                done += 1;
                if (done % 20 === 0) console.log(`  ...${done}/${rows.length}`);
            } catch (error) {
                failed += 1;
                console.error(`  LỖI "${String(task.title).slice(0, 40)}": ${error.message}`);
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    console.log(`Hoàn tất: ${done} thành công, ${failed} lỗi.`);
}

main()
    .catch((error) => {
        console.error('Gán nhãn thất bại:', error.message);
        process.exitCode = 1;
    })
    .finally(() => db.end());
