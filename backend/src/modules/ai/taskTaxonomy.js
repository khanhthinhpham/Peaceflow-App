// Bộ nhãn CỐ ĐỊNH mô tả "bài tập này dùng cho tình trạng gì" — dùng chung giữa script
// gán nhãn (label-task-triggers.js) và lúc chạy thật (ai.service.js).
//
// Lý do cần bộ nhãn cố định: bảng tasks vốn không có chỗ nào ghi mục đích thật của từng
// bài (tags giống hệt nhau cả 122 bài, triggers_supported/contraindications để rỗng,
// metadata.benefits chỉ có 11 giá trị copy-paste theo nhóm). Nếu để AI tự đặt nhãn tự do
// thì mỗi lần lại ra một cách gọi khác nhau, không lọc được. Danh sách này giữ nguyên để
// vừa gán nhãn 1 lần vào DB, vừa cho AI chọn lúc gợi ý → lọc xác định được.

export const TRIGGERS = [
    { code: 'mat_ngu', label: 'Mất ngủ, khó vào giấc, ngủ không sâu' },
    { code: 'lo_au', label: 'Lo âu, bồn chồn, hay lo lắng' },
    { code: 'stress', label: 'Căng thẳng, áp lực công việc/học tập' },
    { code: 'tram_cam', label: 'Tâm trạng thấp, buồn kéo dài, mất hứng thú' },
    { code: 'nang_luong_thap', label: 'Kiệt sức, thiếu năng lượng, mệt mỏi' },
    { code: 'tuc_gian', label: 'Tức giận, bức bối, khó kiểm soát cảm xúc' },
    { code: 'co_don', label: 'Cô đơn, thiếu kết nối xã hội' },
    { code: 'kho_tap_trung', label: 'Khó tập trung, đầu óc phân tán' },
    { code: 'tu_tin_thap', label: 'Thiếu tự tin, tự đánh giá thấp bản thân' },
    { code: 'khung_hoang', label: 'Khủng hoảng cấp tính, cần hạ nhịp ngay lập tức' }
];

export const TRIGGER_CODES = TRIGGERS.map((t) => t.code);

export function formatTriggerList() {
    return TRIGGERS.map((t) => `- ${t.code}: ${t.label}`).join('\n');
}
