import { apiClient } from './api-client.js';
import { auth } from './auth.js';

export const dashboard = {
    async init() {
        try {
            const user = auth.getUser();
            if (user) {
                this.updateUserInfo(user);
            }

            const [summaryData, tasksData, moodData, progressData] = await Promise.all([
                this.fetchSummary(),
                this.fetchRecommendedTasks(),
                this.fetchLatestMood(),
                this.fetchProgress()
            ]);

            this.renderStats(progressData, moodData);
            this.renderStressIndex(summaryData);
            this.renderRecommendations(tasksData);
        } catch (error) {
            console.error('Dashboard init error:', error);
        }
    },

    async fetchSummary() {
        return await apiClient.get('/reports/summary').catch(() => null);
    },

    async fetchRecommendedTasks() {
        return await apiClient.get('/tasks/recommended').catch(() => []);
    },

    async fetchLatestMood() {
        return await apiClient.get('/moods/latest').catch(() => null);
    },

    async fetchProgress() {
        return await apiClient.get('/progress').catch(() => null);
    },

    updateUserInfo(user) {
        // Cập nhật tên user trên UI
        document.querySelectorAll('.user-name').forEach(el => el.innerText = user.full_name || user.display_name);
        
        // Cập nhật Avatar (nếu có)
        if (user.avatar_url) {
            document.querySelectorAll('.user-avatar-mini').forEach(el => {
                el.style.backgroundImage = `url('${user.avatar_url}')`;
                el.style.backgroundSize = 'cover';
                el.innerText = ''; 
            });
        }
    },

    renderStats(progress, mood) {
        // 1. Cập nhật XP & Level (Empty State = 0 XP, Level 1)
        const xp = progress ? progress.xp : 0;
        const level = progress ? progress.level : 1;
        document.querySelectorAll('.user-level').forEach(el => el.innerText = `⭐ ${xp} XP · Level ${level}`);
        
        // 2. Cập nhật Tâm trạng hôm nay (Empty State = --)
        const moodEl = document.getElementById('stat-mood');
        const trendMood = document.getElementById('trend-mood');
        if (moodEl && trendMood) {
            if (mood && mood.score) {
                moodEl.innerText = mood.score;
                trendMood.innerText = 'Dữ liệu hôm nay';
                trendMood.style.color = 'var(--mint-dark)';
            } else {
                moodEl.innerText = '--';
                trendMood.innerText = 'Chưa có dữ liệu';
                trendMood.style.color = 'var(--text-light)';
            }
        }

        // 3. Cập nhật Streak (Empty State = 0)
        const streakEl = document.getElementById('stat-streak');
        const trendStreak = document.getElementById('trend-streak');
        if (streakEl && trendStreak) {
            const streak = progress ? progress.current_streak : 0;
            streakEl.innerText = streak;
            trendStreak.innerText = streak === 0 ? 'Bắt đầu ngay hôm nay!' : `Giữ vững nhịp độ!`;
            trendStreak.style.color = streak === 0 ? 'var(--text-light)' : 'var(--peach-dark)';
        }

        // 4. Cập nhật Nhiệm vụ tuần (Empty State = 0)
        const tasksEl = document.getElementById('stat-tasks');
        const trendTasks = document.getElementById('trend-tasks');
        if (tasksEl && trendTasks) {
            const completed = progress ? progress.weekly_tasks_completed : 0;
            tasksEl.innerText = completed;
            trendTasks.innerText = completed === 0 ? 'Chưa hoàn thành nhiệm vụ nào' : 'Tuyệt vời!';
            trendTasks.style.color = completed === 0 ? 'var(--text-light)' : 'var(--sky)';
        }
    },

    renderStressIndex(riskSummary) {
        const anxietyEl = document.getElementById('stat-anxiety');
        const trendAnxiety = document.getElementById('trend-anxiety');
        if (anxietyEl && trendAnxiety) {
            if (riskSummary && riskSummary.stress_index !== undefined) {
                anxietyEl.innerText = riskSummary.stress_index;
                trendAnxiety.innerText = 'Cập nhật từ báo cáo';
                trendAnxiety.style.color = 'var(--lavender)';
            } else {
                anxietyEl.innerText = '--';
                trendAnxiety.innerText = 'Chưa đủ dữ liệu';
                trendAnxiety.style.color = 'var(--text-light)';
            }
        }

        if (riskSummary && riskSummary.show_emergency_banner) {
            const banner = document.getElementById('emergencyBanner');
            if (banner) banner.style.display = 'block';
        }
    },

    renderRecommendations(tasks) {
        const taskContainer = document.getElementById('todayTasksContainer');
        if (!taskContainer) return;

        if (!tasks || tasks.length === 0) {
            taskContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Bạn chưa có nhiệm vụ nào! Hãy làm Check-in tâm trạng để hệ thống gợi ý bài tập phù hợp.</div>';
            return;
        }

        taskContainer.innerHTML = tasks.map(task => `
            <div class="task-card paper-card" onclick="location.href='task-detail.html?id=${task.id}'">
                <div class="task-icon-box ${task.difficulty ? task.difficulty.toLowerCase() : 'easy'}">${this.getTaskEmoji(task.category)}</div>
                <div class="task-info">
                    <div class="task-name">${task.title}</div>
                    <div class="task-meta"><span>⏱ ${task.duration_minutes} phút</span><span>🔴 ${task.difficulty || 'Dễ'}</span></div>
                </div>
                <span class="task-xp">+${task.xp_reward || 0} XP</span>
            </div>
            <div class="task-divider"></div>
        `).join('');
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

// Auto-init if on dashboard page
if (typeof document !== 'undefined' && window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', () => dashboard.init());
}
