// Danh sách nhiệm vụ khẩn cấp dự phòng khi API /tasks/public-emergency lỗi hoặc trống —
// trích xuất nguyên văn từ frontend/pages/tasks.html (giống task-detail.html, chỉ khác field 'route').
//
// File thuần JS không có quyền truy cập i18n trực tiếp (không phải component), nên
// buildGuestEmergencyTasksFallback() nhận `t` từ nơi gọi (TasksView.vue/TaskDetailView.vue,
// đã có qua useI18n()) để dựng lại toàn bộ text theo ngôn ngữ hiện tại — giống pattern đã
// dùng ở dashboardHelpers.js.

const TASK_KEYS = ['E1_SEPARATE_ENV', 'E2_DEEP_BREATHING', 'E4_SLOW_SPEAKING'];

const TASK_BASE = {
    E1_SEPARATE_ENV: {
        category: 'emergency',
        difficulty: 'easy',
        duration_minutes: 5,
        xp_reward: 10,
        tags: ['emergency', 'grounding', 'sensory_overload'],
        icon: '🚨'
    },
    E2_DEEP_BREATHING: {
        category: 'emergency',
        difficulty: 'easy',
        duration_minutes: 2,
        xp_reward: 10,
        tags: ['breathing', 'micro_task', 'emergency'],
        icon: '💨'
    },
    E4_SLOW_SPEAKING: {
        category: 'emergency',
        difficulty: 'easy',
        duration_minutes: 2,
        xp_reward: 10,
        tags: ['mindfulness', 'speech_regulation', 'micro_task'],
        icon: '🗣️'
    }
};

export function buildGuestEmergencyTasksFallback(t, tm) {
    return TASK_KEYS.map((key) => {
        const base = TASK_BASE[key];
        const i18nKey = (suffix) => `guestEmergencyTasks.${key}.${suffix}`;
        return {
            id: key,
            code: key,
            title: t(i18nKey('title')),
            description: t(i18nKey('description')),
            category: base.category,
            difficulty: base.difficulty,
            duration_minutes: base.duration_minutes,
            xp_reward: base.xp_reward,
            steps: tm(i18nKey('steps')),
            safety_notes: tm(i18nKey('safetyNotes')),
            tags: base.tags,
            metadata: {
                icon: base.icon,
                objective: t(i18nKey('objective')),
                benefits: tm(i18nKey('benefits')),
                preparation: tm(i18nKey('preparation')),
                quote: t(i18nKey('quote'))
            }
        };
    });
}
