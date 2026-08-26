// Danh sách nhiệm vụ khẩn cấp dự phòng khi API /tasks/public-emergency lỗi hoặc trống —
// trích xuất nguyên văn từ frontend/pages/tasks.html (giống task-detail.html, chỉ khác field 'route').

export const GUEST_EMERGENCY_TASKS_FALLBACK = [
    {
        id: 'E1_SEPARATE_ENV',
        code: 'E1_SEPARATE_ENV',
        title: 'Tách biệt với môi trường hiện tại',
        description: 'Giảm quá tải cảm giác bằng cách rời khỏi nguồn kích thích hiện tại.',
        category: 'emergency',
        difficulty: 'easy',
        duration_minutes: 5,
        xp_reward: 10,
        steps: [
            'Dừng tương tác 10-20 giây',
            'Nhủ thầm: mình cần tách ra một chút để ổn định lại',
            'Rời khỏi nguồn căng thẳng nếu có thể',
            'Đặt hai chân chạm đất',
            'Hít vào 4 giây, thở ra 6 giây, lặp lại 5 lần'
        ],
        safety_notes: [
            'Đây là công cụ hỗ trợ tức thời, không thay thế chăm sóc y tế',
            'Nếu cảm thấy nguy cơ tự hại, hãy liên hệ hỗ trợ khẩn cấp ngay'
        ],
        tags: ['emergency', 'grounding', 'sensory_overload'],
        metadata: {
            icon: '🚨',
            objective: 'Tạo khoảng tách an toàn để cơ thể hạ nhịp trước khi tiếp tục xử lý tình huống.',
            benefits: [
                'Giảm cường độ kích thích tức thời',
                'Giúp cơ thể lấy lại cảm giác an toàn',
                'Tạo khoảng dừng trước khi phản ứng tiếp'
            ],
            preparation: [
                'Tìm một góc yên hơn hoặc rời khỏi tình huống nếu có thể',
                'Đặt điện thoại xuống hoặc giảm nguồn kích thích xung quanh'
            ],
            quote: 'Bạn không cần giải quyết mọi thứ ngay lập tức. Ổn định lại trước là bước đầu tiên.'
        }
    },
    {
        id: 'E2_DEEP_BREATHING',
        code: 'E2_DEEP_BREATHING',
        title: 'Hít thở sâu',
        description: 'Bài tập thở ngắn giúp hoạt hóa hệ thần kinh đối giao cảm.',
        category: 'emergency',
        difficulty: 'easy',
        duration_minutes: 2,
        xp_reward: 10,
        steps: [
            'Ngồi thẳng lưng',
            'Đặt tay lên bụng',
            'Hít vào 4 giây',
            'Giữ 4 giây',
            'Thở ra 4 giây',
            'Lặp lại 5 chu kỳ'
        ],
        safety_notes: [
            'Nếu chóng mặt, giảm tốc độ hoặc dừng lại',
            'Nếu đang có khó thở cấp tính, cần tìm hỗ trợ y tế'
        ],
        tags: ['breathing', 'micro_task', 'emergency'],
        metadata: {
            icon: '💨',
            objective: 'Dùng nhịp thở đều để hạ báo động của cơ thể và giảm cường độ hoảng loạn.',
            benefits: [
                'Làm chậm nhịp tim',
                'Giảm phản ứng hoảng loạn cấp',
                'Tăng cảm giác kiểm soát cơ thể'
            ],
            preparation: [
                'Tìm chỗ ngồi hoặc đứng ổn định',
                'Nới lỏng vai và hàm trước khi bắt đầu'
            ],
            quote: 'Chỉ cần một nhịp thở đủ sâu cũng có thể mở ra thêm khoảng trống để cơ thể bình tĩnh lại.'
        }
    },
    {
        id: 'E4_SLOW_SPEAKING',
        code: 'E4_SLOW_SPEAKING',
        title: 'Chú tâm nói chậm lại',
        description: 'Điều hòa nhịp thở thông qua việc giảm tốc độ nói.',
        category: 'emergency',
        difficulty: 'easy',
        duration_minutes: 2,
        xp_reward: 10,
        steps: [
            'Dừng 5 giây trước khi trả lời',
            'Nói chậm hơn bình thường 20-30%',
            'Ưu tiên câu ngắn',
            'Quan sát nhịp thở khi nói'
        ],
        safety_notes: [
            'Nếu đang tranh cãi căng thẳng, ưu tiên tách khỏi môi trường trước'
        ],
        tags: ['mindfulness', 'speech_regulation', 'micro_task'],
        metadata: {
            icon: '🗣️',
            objective: 'Giảm tốc độ phản ứng để cơ thể và lời nói cùng chậm lại.',
            benefits: [
                'Hạ cường độ xung đột',
                'Giảm nhịp thở gấp khi giao tiếp',
                'Tạo thêm thời gian để suy nghĩ trước khi phản ứng'
            ],
            preparation: [
                'Đặt hai chân vững trên mặt đất',
                'Hít một hơi sâu trước khi bắt đầu nói'
            ],
            quote: 'Khi lời nói chậm lại, cơ thể cũng có cơ hội hạ nhịp theo.'
        }
    }
];

export { GUEST_EMERGENCY_TASKS_FALLBACK as default };
