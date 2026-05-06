import { apiClient } from './api-client.js';
import { TASKS } from './tasks-data.js';

export const tasks = {
    allTasks: [],
    currentTasks: [],
    recommendedTaskIds: [],

    normalizeTask(t) {
        // If it's already in the backend format, return as is
        if (t.title && t.category) return t;

        // Otherwise, map from static TASKS format
        let durationMinutes = 5;
        if (t.timerSec) {
            durationMinutes = Math.ceil(t.timerSec / 60);
        } else if (t.timer) {
            durationMinutes = Math.ceil(t.timer / 60);
        } else if (t.time) {
            const minMatch = t.time.match(/(\d+)/);
            if (minMatch) durationMinutes = parseInt(minMatch[1], 10);
        }

        return {
            ...t,
            title: t.title || t.name || 'Nhiệm vụ không tên',
            category: t.category || t.cat || 'easy',
            difficulty: t.difficulty || t.cat || 'easy',
            duration_minutes: t.duration_minutes || durationMinutes,
            xp_reward: t.xp_reward || t.xp || 0,
            description: t.description || t.desc || ''
        };
    },

    async init() {
        try {
            let fetchedTasks = [];
            let recommendedIds = [];

            try {
                const [tasksData, recommendedData] = await Promise.all([
                    this.fetchAllTasks(),
                    this.fetchRecommendedTasks()
                ]);
                fetchedTasks = tasksData || [];
                
                // Safe extraction of recommended IDs
                const recArray = Array.isArray(recommendedData) ? recommendedData : [];
                recommendedIds = recArray.map(t => t.id);
            } catch (apiError) {
                console.warn('API call failed, will use static fallback.', apiError);
            }
            
            // Fallback to static data if API returns nothing or fails
            if (!fetchedTasks || !Array.isArray(fetchedTasks) || fetchedTasks.length === 0) {
                console.log('API returned no tasks, using static fallback.');
                fetchedTasks = TASKS.map(t => this.normalizeTask(t));
            } else {
                fetchedTasks = fetchedTasks.map(t => this.normalizeTask(t));
            }

            this.allTasks = fetchedTasks;
            this.currentTasks = [...this.allTasks];
            this.recommendedTaskIds = recommendedIds;

            // Mark recommended tasks
            this.allTasks.forEach(t => {
                t.suggested = this.recommendedTaskIds.includes(t.id);
            });

            this.renderTaskGrid();
        } catch (error) {
            console.error('Tasks init error:', error);
            // Fallback to static data on error too
            console.log('Error fetching tasks, using static fallback.');
            this.allTasks = TASKS.map(t => this.normalizeTask(t));
            this.currentTasks = [...this.allTasks];
            this.renderTaskGrid();
        }
    },

    async fetchAllTasks() {
        return await apiClient.get('/tasks').catch(() => []);
    },

    async fetchRecommendedTasks() {
        return await apiClient.get('/tasks/recommended').catch(() => []);
    },

    filterTasks(cat, btn) {
        if (btn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        if (cat === 'all') this.currentTasks = this.allTasks;
        else if (cat === 'suggested') this.currentTasks = this.allTasks.filter(t => t.suggested);
        else if (cat === 'completed') this.currentTasks = this.allTasks.filter(t => t.completed); // Assuming backend returns completed status
        else this.currentTasks = this.allTasks.filter(t => (t.difficulty || '').toLowerCase() === cat || (t.category || '').toLowerCase() === cat);

        this.renderTaskGrid();
    },

    searchTasks(val) {
        if (!val) {
            this.currentTasks = this.allTasks;
        } else {
            const v = val.toLowerCase();
            this.currentTasks = this.allTasks.filter(t => 
                (t.title && t.title.toLowerCase().includes(v)) || 
                (t.description && t.description.toLowerCase().includes(v))
            );
        }
        this.renderTaskGrid();
    },

    scrollToSuggested() {
        this.filterTasks('suggested', null);
    },

    renderTaskGrid() {
        const sections = document.getElementById('taskSections');
        if (!sections) return;
        sections.innerHTML = '';

        if (this.currentTasks.length === 0) {
            this.renderEmptyState('Không tìm thấy nhiệm vụ nào.');
            return;
        }

        const CATS = [
            { id: 'emergency', name: '🔴 Khẩn Cấp (Cấp 0)', desc: 'Thực hiện ngay khi hoảng loạn', color: 'emergency', match: t => t.category === 'emergency' },
            { id: 'easy', name: '🟢 Dễ (Cấp 1)', desc: 'Xây dựng thói quen nhỏ hàng ngày', color: 'easy', match: t => t.difficulty === 'easy' },
            { id: 'medium', name: '🟡 Trung Bình (Cấp 2)', desc: 'Cần một chút thời gian và không gian tĩnh', color: 'medium', match: t => t.difficulty === 'medium' },
            { id: 'hard', name: '🟠 Khó (Cấp 3)', desc: 'Nhiệm vụ nâng cao đòi hỏi sự kiên trì', color: 'hard', match: t => t.difficulty === 'hard' },
            { id: 'community', name: '🔵 Cộng Đồng (Cấp 4)', desc: 'Kết nối và đóng góp cho cộng đồng', color: 'community', match: t => t.category === 'community' }
        ];

        let html = '';
        CATS.forEach(c => {
            const list = this.currentTasks.filter(c.match);
            if (list.length > 0) {
                html += `
                <div class="task-section">
                    <div class="section-header">
                        <div class="sh-icon ${c.color}">⭐</div>
                        <div class="sh-title">${c.name}</div>
                        <div class="sh-count">${list.length} bài tập</div>
                        <div class="sh-desc">${c.desc}</div>
                    </div>
                    <div class="task-grid">
            `;
                list.forEach(t => {
                    let btnColor = t.category === 'emergency' ? 'emergency' : '';
                    let onClick = `location.href='task-detail.html?id=${t.id}'`;
                    if (t.id === 'E2' || t.id === '2.5') onClick = `location.href='task-breathing.html'`;
                    if (t.id === '2.3') onClick = `location.href='task-meditation.html'`;

                    html += `
                    <div class="task-card paper-card cat-${t.difficulty ? t.difficulty.toLowerCase() : 'easy'} ${t.completed ? 'completed' : ''}" onclick="${onClick}">
                        <div class="tc-top">
                            <div class="tc-icon ${t.category ? t.category.toLowerCase() : 'easy'}">${this.getTaskEmoji(t.category)}</div>
                            <div class="tc-info">
                                <div class="tc-name">${t.title}</div>
                                <div class="tc-meta">
                                    <div class="tc-meta-item">⏱ ${t.duration_minutes}m</div>
                                    ${t.suggested ? `<div class="tc-meta-item" style="color:var(--gold-dark);">⭐ Gợi ý</div>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="tc-desc">${t.description || ''}</div>
                        <div class="tc-bottom">
                            <div class="tc-xp">+${t.xp_reward || 0} XP</div>
                            <button class="tc-start-btn ${btnColor}" onclick="event.stopPropagation();${onClick}">▶ Bắt đầu</button>
                        </div>
                    </div>
                `;
                });
                html += `</div></div>`;
            }
        });
        sections.innerHTML = html;
    },

    renderEmptyState(message) {
        const sections = document.getElementById('taskSections');
        if (sections) {
            sections.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);">${message} 🌿</div>`;
        }
    },

    getTaskEmoji(category) {
        if (!category) return '✨';
        const emojis = {
            'breathing': '💨',
            'meditation': '🧘',
            'journal': '✍️',
            'emergency': '🚨',
            'sleep': '😴',
            'reflection': '🙏'
        };
        return emojis[category.toLowerCase()] || '✨';
    }
};

// If we are directly on tasks page
if (typeof document !== 'undefined' && window.location.pathname.includes('tasks.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Will be called by HTML inline script or init here if needed
        // tasks.init(); 
    });
}
