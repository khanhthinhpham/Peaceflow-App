// Group 5 — thang đánh giá lâm sàng do bác sĩ/nhà tâm lý thực hiện (nguồn: tài liệu quy trình
// kỹ thuật khám chữa bệnh chuyên khoa Tâm thần, Bộ Y tế).
//
// CHỈ 3/5 thang được mã hóa ở đây: aims, hachinski, himmelbach.
// `barnes` và `ciwa` KHÔNG được mã hóa (xem group5_meta.md để biết lý do và cấu trúc đầy đủ):
// cả hai đều trộn các mục có thang điểm tối đa khác nhau trong cùng một bài test, trong khi
// engine hiện tại (TESTS[x].likertOptions dùng chung cho mọi câu) chỉ áp dụng đúng khi mọi mục
// dùng chung MỘT thang điểm số. Ép các thang này vào khuôn chuẩn sẽ cho phép chấm điểm sai
// (vd. mục Định hướng của CIWA chỉ có thang 0-4 nhưng sẽ bị lộ thang 0-7 dùng chung) — có thể
// dẫn đến đánh giá sai mức độ cai rượu/bồn chồn bất an, là vấn đề an toàn lâm sàng thực sự.
//
// Đối với `hachinski` và `himmelbach`: mỗi mục vốn là một tiêu chí có/không (trắc nghiệm sàng
// lọc) với TRỌNG SỐ điểm khác nhau theo mục (1, 2 hoặc 3 điểm nếu "Có"). Vì engine chỉ cộng
// answers[idx] theo từng phần tử của mảng `indices` (không nhân theo mục), ta lặp lại chỉ số
// của một câu N lần trong mảng `indices` để mục đó đóng góp đúng N điểm khi trả lời "Có" — đây
// là phép biến đổi CHÍNH XÁC về mặt toán học (không phải xấp xỉ), không làm sai lệch điểm.

export const GROUP5_TESTS = {
    aims: {
        name: 'AIMS', fullname: 'Trắc nghiệm vận động bất thường (Abnormal Involuntary Movement Scale)',
        icon: '🕺', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: 'Hiện tại', totalQ: 10, maxScore: 40,
        subscales: ['orofacial', 'extremity', 'trunk', 'global'],
        questions: [
            { text: 'Các cơ thể hiện nét mặt: chuyển động của trán, lông mày, vùng quanh mắt, má… bao gồm cau mày, chớp mắt, nhăn mặt', cat: 'orofacial', catLabel: 'Mặt và miệng' },
            { text: 'Môi và vùng quanh miệng: nhăn nhó, bĩu môi…', cat: 'orofacial', catLabel: 'Mặt và miệng' },
            { text: 'Hàm: cắn, nghiến, nhai, há miệng, chuyển động ngang…', cat: 'orofacial', catLabel: 'Mặt và miệng' },
            { text: 'Lưỡi: tăng chuyển động cả trong và ngoài miệng, không có khả năng duy trì chuyển động', cat: 'orofacial', catLabel: 'Mặt và miệng' },
            { text: 'Chi trên (cánh tay, cổ tay, bàn tay, ngón tay): bao gồm các động tác múa giật (nhanh, không mục đích, không thường xuyên) hoặc múa vờn (chậm, không đều, phức tạp, uốn éo); không bao gồm run', cat: 'extremity', catLabel: 'Vận động quá mức' },
            { text: 'Chi dưới (chân, đầu gối, mắt cá chân, ngón chân): cử động đầu gối sang bên, gõ bàn chân, hạ gót chân, vặn vẹo bàn chân, đảo ngược và chuyển hướng bàn chân', cat: 'extremity', catLabel: 'Vận động quá mức' },
            { text: 'Cổ, vai, hông: đung đưa, vặn người, vặn vẹo, xoay vùng chậu; bao gồm chuyển động của cơ hoành', cat: 'trunk', catLabel: 'Chuyển động thân' },
            { text: 'Mức độ nghiêm trọng chung của các cử động bất thường, dựa trên số điểm đơn cao nhất của các mục trên', cat: 'global', catLabel: 'Đánh giá chung' },
            { text: 'Mức độ mất khả năng (ảnh hưởng chức năng) do các cử động bất thường gây ra (0: Không có/bình thường, 1: Tối thiểu, 2: Nhẹ, 3: Vừa phải, 4: Nghiêm trọng)', cat: 'global', catLabel: 'Đánh giá chung' },
            { text: 'Nhận thức của bệnh nhân về các cử động bất thường và mức độ đau khổ liên quan (0: Không nhận biết, 1: Nhận biết - không đau khổ, 2: Nhận biết - đau khổ nhẹ, 3: Nhận biết - đau khổ vừa phải, 4: Nhận biết - đau khổ nghiêm trọng)', cat: 'global', catLabel: 'Đánh giá chung' }
        ],
        likertOptions: [
            { emoji: '✅', label: 'Không có', score: 0 },
            { emoji: '🟡', label: 'Tối thiểu', score: 1 },
            { emoji: '🟠', label: 'Nhẹ', score: 2 },
            { emoji: '🔴', label: 'Trung bình', score: 3 },
            { emoji: '🚨', label: 'Nghiêm trọng', score: 4 }
        ],
        scoring: {
            orofacial: { indices: [0, 1, 2, 3], multiplier: 1, levels: [{ max: 999, 'label': 'Mặt và miệng', 'class': 'level-1' }] },
            extremity: { indices: [4, 5], multiplier: 1, levels: [{ max: 999, 'label': 'Vận động quá mức (chi)', 'class': 'level-2' }] },
            trunk: { indices: [6], multiplier: 1, levels: [{ max: 999, 'label': 'Chuyển động thân', 'class': 'level-3' }] },
            global: { indices: [7, 8, 9], multiplier: 1, levels: [{ max: 999, 'label': 'Đánh giá chung', 'class': 'level-4' }] },
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], multiplier: 1, levels: [{ max: 999, 'label': 'Điểm tổng AIMS (theo dõi diễn tiến lâm sàng — nguồn không nêu ngưỡng phân loại mức độ)', 'class': 'level-1' }] }
        },
        prevScores: null
    },
    hachinski: {
        name: 'HACHINSKI', fullname: 'Trắc nghiệm điểm thiếu máu cục bộ Hachinski (Hachinski Ischemic Score)',
        icon: '🩸', iconBg: 'var(--coral-light)', iconBorder: 'var(--coral)',
        timeRef: 'Hiện tại', totalQ: 13, maxScore: 18,
        subscales: ['ischemic'],
        questions: [
            { text: 'Triệu chứng xuất hiện đột ngột', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Tiến triển nặng dần kiểu bậc thang (ví dụ: suy giảm - ổn định - suy thoái)', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Tiến triển dao động', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Lú lẫn về đêm', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Nhân cách tương đối ít thay đổi', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Trầm cảm', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Phàn nàn về cơ thể (ví dụ: đau nhức cơ thể, đau ngực)', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Rối loạn cảm xúc', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Tiền sử tăng huyết áp', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Tiền sử đột quỵ', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Bằng chứng về xơ vữa động mạch cùng tồn tại (ví dụ: bệnh động mạch ngoại vi - PAD, nhồi máu cơ tim - MI)', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Các triệu chứng thần kinh khu trú (ví dụ: liệt nửa người, bán manh đồng danh, mất ngôn ngữ)', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' },
            { text: 'Dấu hiệu thần kinh khu trú (ví dụ: yếu một bên, mất cảm giác, phản xạ không đối xứng, dấu hiệu Babinski)', cat: 'ischemic', catLabel: 'Thiếu máu cục bộ' }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Không có', score: 0 },
            { emoji: '✅', label: 'Có', score: 1 }
        ],
        scoring: {
            // Trọng số theo nguồn: mục 0,2,9,11,12 = 2 điểm; các mục còn lại = 1 điểm.
            // Chỉ số được lặp lại N lần = trọng số N của mục đó (xem ghi chú đầu file).
            ischemic: { indices: [0, 0, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12], multiplier: 1, levels: [{ max: 3, 'label': 'Gợi ý sa sút trí tuệ nguyên phát (kiểu Alzheimer)', 'class': 'level-0' }, { max: 7, 'label': 'Không xác định / Sa sút trí tuệ hỗn hợp', 'class': 'level-2' }, { max: 999, 'label': 'Gợi ý sa sút trí tuệ mạch máu', 'class': 'level-4' }] }
        },
        prevScores: null
    },
    himmelbach: {
        name: 'HIMMELBACH', fullname: 'Trắc nghiệm mức độ nghiện Himmelbach (Himmelbach Withdrawal Scale)',
        icon: '💉', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: 'Hiện tại', totalQ: 12, maxScore: 24,
        subscales: ['withdrawal'],
        questions: [
            { text: 'Ngáp', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Chảy nước mắt, nước mũi', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Tăng thân nhiệt', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Toát mồ hôi, ớn lạnh, nổi da gà', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Thèm chất ma túy', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Đau mỏi các khớp, co cứng cơ bụng', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Mất ngủ', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Ỉa chảy', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Mạch nhanh (> 90 chu kỳ/phút)', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Buồn nôn, nôn', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Dị cảm (cảm giác dòi bò trong xương)', cat: 'withdrawal', catLabel: 'Hội chứng cai' },
            { text: 'Dãn đồng tử', cat: 'withdrawal', catLabel: 'Hội chứng cai' }
        ],
        likertOptions: [
            { emoji: '❌', label: 'Không có', score: 0 },
            { emoji: '✅', label: 'Có', score: 1 }
        ],
        scoring: {
            // Trọng số theo nguồn: mục 0,1,2 = 1 điểm; mục 3-8 = 2 điểm; mục 9,10,11 = 3 điểm.
            // Chỉ số được lặp lại N lần = trọng số N của mục đó (xem ghi chú đầu file).
            withdrawal: { indices: [0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11], multiplier: 1, levels: [{ max: 7, 'label': 'Nghiện nhẹ', 'class': 'level-1' }, { max: 16, 'label': 'Nghiện trung bình', 'class': 'level-2' }, { max: 999, 'label': 'Nghiện nặng', 'class': 'level-3' }] }
        },
        prevScores: null
    }
};


