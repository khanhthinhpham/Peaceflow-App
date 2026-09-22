// Group 2 — new standardized tests sourced from the official Vietnamese MOH clinical
// procedure guideline (docx sections 08_YMRS, 09_ZAI, 11_HADS, 12_SCAS).
// Only tests that cleanly fit the app's standard { questions/likertOptions/scoring } shape
// with fully-verifiable source cutoffs are included here: ZAI and HADS.
// YMRS and SCAS were intentionally NOT written here — see group2_meta.md for why
// (missing/unreliable cutoff data in the extracted source, not a shape problem).
// Shape/key-order matches frontend-vue/src/lib/assessmentTests.js exactly.

export const TESTS = {
    zai: {
        name: 'ZAI', fullname: 'Zung Self-Rating Anxiety Inventory (Trắc nghiệm Lo âu Zung)',
        icon: '😟', iconBg: 'var(--rose-light)', iconBorder: 'var(--rose)',
        timeRef: '1 tuần qua', totalQ: 20, maxScore: 100,
        subscales: ['anxiety'],
        questions: [
            { text: 'Tôi cảm thấy nóng nảy và lo âu hơn thường lệ', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy sợ vô cớ', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi dễ bối rối và cảm thấy hoảng sợ', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy như bị ngã và vỡ ra từng mảnh', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy mọi thứ đều tốt và không có điều gì xấu sẽ xảy ra', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '😊', label: 'Không có', score: 4 },
                { emoji: '😐', label: 'Đôi khi', score: 3 },
                { emoji: '😟', label: 'Thường xuyên', score: 2 },
                { emoji: '😰', label: 'Luôn luôn', score: 1 }
            ] },
            { text: 'Tay và chân tôi lắc lư, run lên', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi đang khó chịu vì đau đầu, đau cổ, đau lưng', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy yếu và dễ mệt mỏi', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi cảm thấy bình tĩnh và có thể ngồi yên một cách dễ dàng', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '😊', label: 'Không có', score: 4 },
                { emoji: '😐', label: 'Đôi khi', score: 3 },
                { emoji: '😟', label: 'Thường xuyên', score: 2 },
                { emoji: '😰', label: 'Luôn luôn', score: 1 }
            ] },
            { text: 'Tôi cảm thấy tim mình đập nhanh', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi đang khó chịu vì cơn hoa mắt chóng mặt', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi bị ngất và có lúc cảm thấy gần như thế', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi có thể thở ra, hít vào một cách dễ dàng', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '😊', label: 'Không có', score: 4 },
                { emoji: '😐', label: 'Đôi khi', score: 3 },
                { emoji: '😟', label: 'Thường xuyên', score: 2 },
                { emoji: '😰', label: 'Luôn luôn', score: 1 }
            ] },
            { text: 'Tôi cảm thấy tê buốt, như có kiến bò ở đầu ngón tay, ngón chân', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi đang khó chịu vì đau dạ dày và đầy bụng', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi luôn cần phải đi đái', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Bàn tay tôi thường khô và ấm', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '😊', label: 'Không có', score: 4 },
                { emoji: '😐', label: 'Đôi khi', score: 3 },
                { emoji: '😟', label: 'Thường xuyên', score: 2 },
                { emoji: '😰', label: 'Luôn luôn', score: 1 }
            ] },
            { text: 'Mặt tôi thường nóng và đỏ', cat: 'anxiety', catLabel: 'Lo âu' },
            { text: 'Tôi ngủ dễ dàng và luôn có một giấc ngủ tốt', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '😊', label: 'Không có', score: 4 },
                { emoji: '😐', label: 'Đôi khi', score: 3 },
                { emoji: '😟', label: 'Thường xuyên', score: 2 },
                { emoji: '😰', label: 'Luôn luôn', score: 1 }
            ] },
            { text: 'Tôi thường có ác mộng', cat: 'anxiety', catLabel: 'Lo âu' }
        ],
        likertOptions: [
            { emoji: '😊', label: 'Không có', score: 1 },
            { emoji: '😐', label: 'Đôi khi', score: 2 },
            { emoji: '😟', label: 'Thường xuyên', score: 3 },
            { emoji: '😰', label: 'Luôn luôn', score: 4 }
        ],
        scoring: {
            anxiety: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], multiplier: 1.25, levels: [
                { max: 44, 'label': 'Không có lo âu bệnh lý', 'class': 'level-0' },
                { max: 59, 'label': 'Lo âu mức độ nhẹ đến trung bình', 'class': 'level-1' },
                { max: 74, 'label': 'Lo âu mức độ nặng', 'class': 'level-2' },
                { max: 999, 'label': 'Lo âu mức độ rất nặng', 'class': 'level-3' }
            ] }
        },
        prevScores: null
    },
    hads: {
        name: 'HADS', fullname: 'Hospital Anxiety and Depression Scale (Trắc nghiệm Lo âu - Trầm cảm)',
        icon: '🏥', iconBg: 'var(--gold-light)', iconBorder: 'var(--gold)',
        timeRef: '1-2 tuần qua', totalQ: 14, maxScore: 42,
        subscales: ['anxiety', 'depression'],
        questions: [
            { text: 'Tôi cảm thấy căng thẳng hoặc bực dọc', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Không bao giờ', score: 0 },
                { emoji: '😐', label: 'Thỉnh thoảng', score: 1 },
                { emoji: '😟', label: 'Thường xuyên', score: 2 },
                { emoji: '😰', label: 'Phần lớn thời gian', score: 3 }
            ] },
            { text: 'Tôi hài lòng về mọi điều như trước kia', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Vâng, hoàn toàn như vậy', score: 0 },
                { emoji: '😐', label: 'Không hoàn toàn', score: 1 },
                { emoji: '😟', label: 'Chỉ một ít', score: 2 },
                { emoji: '😰', label: 'Hầu như không nữa', score: 3 }
            ] },
            { text: 'Tôi có một cảm giác sợ giống như điều khủng khiếp đang xảy ra', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Không một ít nào', score: 0 },
                { emoji: '😐', label: 'Hơi một chút, nhưng điều đó không làm tôi lo lắng', score: 1 },
                { emoji: '😟', label: 'Vâng, nhưng điều đó không đến nỗi vậy', score: 2 },
                { emoji: '😰', label: 'Vâng, rất rõ', score: 3 }
            ] },
            { text: 'Tôi cười dễ dàng và thấy khía cạnh tốt của mọi thứ', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Cũng như trước đây', score: 0 },
                { emoji: '😐', label: 'Không được như trước đây', score: 1 },
                { emoji: '😟', label: 'Hoàn toàn ít hơn trước', score: 2 },
                { emoji: '😰', label: 'Không còn gì cả', score: 3 }
            ] },
            { text: 'Tôi lo lắng', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Rất tình cờ', score: 0 },
                { emoji: '😐', label: 'Tình cờ', score: 1 },
                { emoji: '😟', label: 'Khá thường xuyên', score: 2 },
                { emoji: '😰', label: 'Rất thường xuyên', score: 3 }
            ] },
            { text: 'Tâm trạng tôi thoải mái', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Phần lớn thời gian', score: 0 },
                { emoji: '😐', label: 'Khá thường xuyên', score: 1 },
                { emoji: '😟', label: 'Rất hiếm khi', score: 2 },
                { emoji: '😰', label: 'Không bao giờ', score: 3 }
            ] },
            { text: 'Tôi có thể ngồi yên lặng, không làm gì hết và cảm giác thoải mái', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Vâng, dù điều gì đó xảy ra', score: 0 },
                { emoji: '😐', label: 'Vâng, nói chung là như vậy', score: 1 },
                { emoji: '😟', label: 'Hiếm khi', score: 2 },
                { emoji: '😰', label: 'Không bao giờ', score: 3 }
            ] },
            { text: 'Tôi có cảm giác hoạt động chậm lại', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Không bao giờ', score: 0 },
                { emoji: '😐', label: 'Đôi khi', score: 1 },
                { emoji: '😟', label: 'Rất thường xuyên', score: 2 },
                { emoji: '😰', label: 'Hầu như luôn luôn', score: 3 }
            ] },
            { text: 'Tôi cảm thấy những cảm giác sợ và dạ dày tắc lại', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Không bao giờ', score: 0 },
                { emoji: '😐', label: 'Đôi khi', score: 1 },
                { emoji: '😟', label: 'Khá thường xuyên', score: 2 },
                { emoji: '😰', label: 'Rất thường xuyên', score: 3 }
            ] },
            { text: 'Tôi không quan tâm nữa tới vẻ ngoài của tôi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Tôi để ý đến nó như trước kia', score: 0 },
                { emoji: '😐', label: 'Có thể là tôi cũng không chú ý đến nó nữa', score: 1 },
                { emoji: '😟', label: 'Tôi không biết ăn mặc, trang điểm cho phù hợp với hoàn cảnh nữa', score: 2 },
                { emoji: '😰', label: 'Không còn gì cả', score: 3 }
            ] },
            { text: 'Tôi cảm thấy bất ổn, đứng ngồi không yên', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Không một tí nào', score: 0 },
                { emoji: '😐', label: 'Không hoàn toàn', score: 1 },
                { emoji: '😟', label: 'Hơi một tí', score: 2 },
                { emoji: '😰', label: 'Vâng, hoàn toàn đúng như vậy', score: 3 }
            ] },
            { text: 'Tôi mừng khi định làm một việc gì đó', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Cũng như trước', score: 0 },
                { emoji: '😐', label: 'Hơi kém hơn trước', score: 1 },
                { emoji: '😟', label: 'Kém rõ rệt hơn trước', score: 2 },
                { emoji: '😰', label: 'Hầu như không bao giờ', score: 3 }
            ] },
            { text: 'Tôi cảm thấy những cảm giác đột nhiên hoảng sợ', cat: 'anxiety', catLabel: 'Lo âu', likertOptions: [
                { emoji: '🙂', label: 'Không bao giờ', score: 0 },
                { emoji: '😐', label: 'Thỉnh thoảng', score: 1 },
                { emoji: '😟', label: 'Khá thường xuyên', score: 2 },
                { emoji: '😰', label: 'Hoàn toàn rất thường xuyên', score: 3 }
            ] },
            { text: 'Tôi có thể hài lòng về một cuốn sách hoặc một buổi phát hay trên đài hoặc ti vi', cat: 'depression', catLabel: 'Trầm cảm', likertOptions: [
                { emoji: '🙂', label: 'Thường xuyên', score: 0 },
                { emoji: '😐', label: 'Đôi khi', score: 1 },
                { emoji: '😟', label: 'Hiếm khi', score: 2 },
                { emoji: '😰', label: 'Rất hiếm khi', score: 3 }
            ] }
        ],
        scoring: {
            anxiety: { indices: [0, 2, 4, 6, 8, 10, 12], multiplier: 1, levels: [{ max: 999, 'label': 'Lo âu', 'class': 'level-1' }] },
            depression: { indices: [1, 3, 5, 7, 9, 11, 13], multiplier: 1, levels: [{ max: 999, 'label': 'Trầm cảm', 'class': 'level-2' }] },
            total: { indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multiplier: 1, levels: [
                { max: 7, 'label': 'Trạng thái ổn định', 'class': 'level-0' },
                { max: 10, 'label': 'Trạng thái ranh giới', 'class': 'level-1' },
                { max: 999, 'label': 'Có trầm cảm - lo âu', 'class': 'level-3' }
            ] }
        },
        prevScores: null
    }
};


