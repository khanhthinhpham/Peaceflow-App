// Metadata thẻ bài test — trích xuất nguyên văn từ frontend/pages/mood-assessment.html

export const ASSESSMENT_META = {
    dass21: {
        apiCode: 'DASS21',
        name: 'DASS-21',
        fullname: 'Depression Anxiety Stress Scales',
        icon: '📊',
        cardClass: 'dass',
        iconStyle: 'background:var(--peach-light);border-color:var(--peach);',
        desc: 'Đánh giá đồng thời 3 chiều: Trầm cảm, Lo âu và Căng thẳng.',
        badges: [
            { className: 'badge-peach', label: '21 câu hỏi' },
            { className: 'badge-mint', label: '~8 phút' },
            { style: 'background:var(--sky-light);color:#4a90aa;border:1.5px solid var(--sky);', label: '2 tuần/lần' }
        ]
    },
    gad7: {
        apiCode: 'GAD7',
        name: 'GAD-7',
        fullname: 'Generalized Anxiety Disorder 7-item',
        icon: '😰',
        cardClass: 'gad',
        iconStyle: 'background:var(--sky-light);border-color:var(--sky);',
        desc: 'Đánh giá mức độ lo âu tổng quát với thang đo ngắn, dễ lặp lại hàng tuần.',
        badges: [
            { className: 'badge-sky', label: '7 câu hỏi' },
            { className: 'badge-mint', label: '~3 phút' },
            { className: 'badge-mint', label: 'Hàng tuần' }
        ]
    },
    hars: {
        apiCode: 'HARS',
        name: 'HARS',
        fullname: 'Hamilton Anxiety Rating Scale',
        icon: '🧠',
        cardClass: 'hars',
        iconStyle: 'background:var(--lavender-light);border-color:var(--lavender);',
        desc: 'Đánh giá lo âu theo cả triệu chứng tâm lý lẫn thể chất.',
        badges: [
            { className: 'badge-lavender', label: '14 câu hỏi' },
            { className: 'badge-mint', label: '~6 phút' },
            { style: 'background:var(--lavender-light);color:#8a6aaa;border:1.5px solid var(--lavender);', label: 'Khi cần sâu' }
        ]
    },
    phq9: {
        apiCode: 'PHQ9',
        name: 'PHQ-9',
        fullname: 'Patient Health Questionnaire-9',
        icon: '🌧️',
        cardClass: 'phq',
        iconStyle: 'background:var(--mint-light);border-color:var(--mint);',
        desc: 'Sàng lọc và đánh giá mức độ trầm cảm theo thang đo tiêu chuẩn.',
        badges: [
            { className: 'badge-mint', label: '9 câu hỏi' },
            { className: 'badge-mint', label: '~4 phút' },
            { className: 'badge-peach', label: '2 tuần/lần' }
        ]
    },
    bdi: {
        apiCode: 'BDI',
        name: 'BDI',
        fullname: 'Thang Đánh Giá Trầm Cảm Beck',
        icon: '🌧️',
        cardClass: 'phq',
        iconStyle: 'background:var(--mint-light);border-color:var(--mint);',
        desc: 'Đánh giá chuyên sâu mức độ trầm cảm qua 21 khía cạnh — cảm xúc, thể chất, hành vi.',
        badges: [
            { className: 'badge-mint', label: '21 câu hỏi' },
            { className: 'badge-mint', label: '~8 phút' },
            { className: 'badge-peach', label: 'Khi cần' }
        ]
    },
    psqi: {
        apiCode: 'PSQI',
        name: 'PSQI',
        fullname: 'Pittsburgh Sleep Quality Index',
        icon: '😴',
        cardClass: 'psqi',
        iconStyle: 'background:var(--peach-light);border-color:var(--kraft);',
        desc: 'Đánh giá chất lượng giấc ngủ trong tháng gần nhất.',
        badges: [
            { className: 'badge-peach', label: '10 câu hỏi' },
            { className: 'badge-mint', label: '~5 phút' },
            { style: 'background:var(--kraft-light);color:var(--kraft-dark);border:1.5px solid var(--kraft);', label: 'Hàng tháng' }
        ]
    },
    pss: {
        apiCode: 'PSS',
        name: 'PSS',
        fullname: 'Perceived Stress Scale',
        icon: '😣',
        cardClass: 'pss',
        iconStyle: 'background:var(--coral-light);border-color:var(--coral);',
        desc: 'Đánh giá mức độ stress cảm nhận được trong 1 tháng gần đây.',
        badges: [
            { className: 'badge-peach', label: '10 câu hỏi' },
            { className: 'badge-mint', label: '~4 phút' },
            { style: 'background:var(--kraft-light);color:var(--kraft-dark);border:1.5px solid var(--kraft);', label: 'Hàng tháng' }
        ]
    },
    sdq25: {
        apiCode: 'SDQ25',
        name: 'SDQ-25',
        fullname: 'Bảng hỏi Điểm mạnh & Khó khăn (Tự đánh giá)',
        icon: '🧒',
        cardClass: 'sdq',
        iconStyle: 'background:var(--sky-light);border-color:var(--lavender);',
        desc: 'Sàng lọc điểm mạnh và khó khăn về cảm xúc, hành vi dành cho thanh thiếu niên.',
        badges: [
            { className: 'badge-sky', label: '25 câu hỏi' },
            { className: 'badge-mint', label: '~10 phút' },
            { className: 'badge-lavender', label: 'Thanh thiếu niên' }
        ]
    },
    mmse: {
        apiCode: 'MMSE',
        name: 'MMSE',
        fullname: 'Mini-Mental State Exam',
        icon: '🧠',
        cardClass: 'mmse',
        iconStyle: 'background:var(--lavender-light);border-color:var(--lavender);',
        desc: 'Đánh giá chức năng nhận thức: định hướng, trí nhớ, chú ý, ngôn ngữ — thường dùng cho người lớn tuổi.',
        badges: [
            { className: 'badge-lavender', label: '19 câu hỏi' },
            { className: 'badge-mint', label: '~10 phút' },
            { style: 'background:var(--lavender-light);color:#8a6aaa;border:1.5px solid var(--lavender);', label: 'Người lớn tuổi' }
        ]
    },
    isi: {
        apiCode: 'ISI',
        name: 'ISI',
        fullname: 'Insomnia Severity Index',
        icon: '😴',
        cardClass: 'isi',
        iconStyle: 'background:var(--peach-light);border-color:var(--peach);',
        desc: 'Đánh giá mức độ nghiêm trọng và tác động của chứng mất ngủ trong 1 tháng qua.',
        badges: [
            { className: 'badge-peach', label: '7 câu hỏi' },
            { className: 'badge-mint', label: '~3 phút' },
            { className: 'badge-peach', label: 'Hàng tháng' }
        ]
    },
    iat: {
        apiCode: 'IAT',
        name: 'IAT',
        fullname: 'Internet Addiction Test',
        icon: '📱',
        cardClass: 'iat',
        iconStyle: 'background:var(--sky-light);border-color:var(--sky);',
        desc: 'Đánh giá mức độ nghiện Internet trong tháng qua.',
        badges: [
            { className: 'badge-sky', label: '20 câu hỏi' },
            { className: 'badge-mint', label: '~7 phút' },
            { className: 'badge-sky', label: 'Hàng tháng' }
        ]
    },
    audit: {
        apiCode: 'AUDIT',
        name: 'AUDIT',
        fullname: 'Alcohol Use Disorders Identification Test',
        icon: '🍺',
        cardClass: 'audit',
        iconStyle: 'background:var(--kraft-light);border-color:var(--kraft);',
        desc: 'Sàng lọc mức độ sử dụng rượu bia trong 12 tháng qua (WHO).',
        badges: [
            { className: 'badge-peach', label: '10 câu hỏi' },
            { className: 'badge-mint', label: '~5 phút' },
            { style: 'background:var(--kraft-light);color:var(--kraft-dark);border:1.5px solid var(--kraft);', label: '12 tháng/lần' }
        ]
    }
};
