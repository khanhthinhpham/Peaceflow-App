import { apiClient } from './api-client.js';
import { auth } from './auth.js';

// ─── Level System Constants ───
const LEVEL_NAMES = [
    'Người mới bắt đầu',   // Level 1: 0–99
    'Người khám phá',       // Level 2: 100–299
    'Người đồng hành',      // Level 3: 300–599
    'Chiến binh bình yên',  // Level 4: 600–999
    'Bậc thầy tĩnh tâm',   // Level 5: 1000+
];

function getLevelFromXp(xp) {
    if (xp >= 1000) return 5;
    if (xp >= 600) return 4;
    if (xp >= 300) return 3;
    if (xp >= 100) return 2;
    return 1;
}

function getLevelRange(level) {
    const ranges = {
        1: [0, 100],
        2: [100, 300],
        3: [300, 600],
        4: [600, 1000],
        5: [1000, 2000]
    };
    return ranges[level] || [0, 100];
}

export const dashboard = {
    async init() {
        try {
            await auth.waitForAuth();

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

            // ← MỚI: Render các widget động
            this.renderXpCard(progressData);
            this.renderStreakCard(progressData);
            this.renderRadarChart(summaryData);
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
        const name = user.display_name || user.full_name || 'Người dùng';
        document.querySelectorAll('.user-name').forEach(el => el.innerText = name);
        
        if (user.avatar_url) {
            document.querySelectorAll('.user-avatar-mini').forEach(el => {
                el.style.backgroundImage = `url('${user.avatar_url}')`;
                el.style.backgroundSize = 'cover';
                el.innerText = ''; 
            });
        }
    },

    renderStats(progress, mood) {
        const xp = progress ? (progress.total_xp || progress.xp || 0) : 0;
        const level = progress ? (progress.current_level || progress.level || getLevelFromXp(xp)) : 1;
        document.querySelectorAll('.user-level').forEach(el => el.innerText = `⭐ ${xp} XP · Level ${level}`);
        
        // Mood card
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

        // Streak stat card
        const streakEl = document.getElementById('stat-streak');
        const trendStreak = document.getElementById('trend-streak');
        if (streakEl && trendStreak) {
            const streak = progress ? (progress.current_streak || 0) : 0;
            streakEl.innerText = streak;
            trendStreak.innerText = streak === 0 ? 'Bắt đầu ngay hôm nay!' : `Giữ vững nhịp độ!`;
            trendStreak.style.color = streak === 0 ? 'var(--text-light)' : 'var(--peach-dark)';
        }

        // Tasks stat card
        const tasksEl = document.getElementById('stat-tasks');
        const trendTasks = document.getElementById('trend-tasks');
        if (tasksEl && trendTasks) {
            const completed = progress ? (progress.weekly_tasks_completed || 0) : 0;
            tasksEl.innerText = completed;
            trendTasks.innerText = completed === 0 ? 'Chưa hoàn thành nhiệm vụ nào' : 'Tuyệt vời!';
            trendTasks.style.color = completed === 0 ? 'var(--text-light)' : 'var(--sky)';
        }
    },

    // ─── XP CARD WIDGET ───
    renderXpCard(progress) {
        const xp = progress ? (progress.total_xp || progress.xp || 0) : 0;
        const level = progress ? (progress.current_level || progress.level || getLevelFromXp(xp)) : 1;
        const [rangeMin, rangeMax] = getLevelRange(level);
        const levelName = LEVEL_NAMES[Math.min(level, 5) - 1] || LEVEL_NAMES[0];

        // XP progress percentage within current level
        const rangeSize = rangeMax - rangeMin;
        const xpInRange = Math.max(0, xp - rangeMin);
        const pct = rangeSize > 0 ? Math.min(100, (xpInRange / rangeSize) * 100) : 0;
        const remaining = Math.max(0, rangeMax - xp);

        // Update DOM
        const el = (id) => document.getElementById(id);
        if (el('xp-level-circle')) el('xp-level-circle').innerText = level;
        if (el('xp-level-name'))   el('xp-level-name').innerText = levelName;
        if (el('xp-level-range'))  el('xp-level-range').innerText = `${rangeMin} – ${rangeMax} XP`;
        if (el('xp-total'))        el('xp-total').innerText = `${xp} XP`;
        if (el('xp-bar-fill'))     el('xp-bar-fill').style.width = `${pct}%`;
        if (el('xp-bar-left'))     el('xp-bar-left').innerText = `${rangeMin} XP`;
        if (el('xp-bar-right'))    el('xp-bar-right').innerText = `${rangeMax} XP`;

        if (el('xp-bar-remaining')) {
            if (xp === 0) {
                el('xp-bar-remaining').innerText = 'Hãy hoàn thành nhiệm vụ để nhận XP!';
            } else if (remaining > 0) {
                el('xp-bar-remaining').innerText = `Còn ${remaining} XP → Level ${level + 1} 🎉`;
            } else {
                el('xp-bar-remaining').innerText = `Đã đạt Level ${level}! 🏅`;
            }
        }

        // Mobile topbar
        if (el('mobile-xp-badge')) el('mobile-xp-badge').innerText = `⭐ ${xp} XP`;
    },

    // ─── STREAK CARD WIDGET ───
    renderStreakCard(progress) {
        const streak = progress ? (progress.current_streak || 0) : 0;
        const lastActivity = progress ? progress.last_activity_date : null;

        // Update streak number
        const streakNum = document.getElementById('streak-number');
        if (streakNum) streakNum.innerText = streak;

        // Build streak days grid
        const grid = document.getElementById('streak-days-grid');
        if (!grid) return;

        const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const today = new Date();
        const todayDow = today.getDay(); // 0=Sun, 1=Mon, ...
        // Convert to Monday-based index: Mon=0, ..., Sun=6
        const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

        // Calculate which days in the current week have streak activity
        let doneCount = 0;
        if (lastActivity && streak > 0) {
            // Last activity was today or before → streak covers up to today
            const lastDate = new Date(lastActivity);
            const lastDow = lastDate.getDay();
            const lastIdx = lastDow === 0 ? 6 : lastDow - 1;
            
            // If last activity is today, streak goes back from today
            // If last activity is before today, streak might be broken
            const isToday = lastDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
            const endIdx = isToday ? todayIdx : lastIdx;
            
            doneCount = Math.min(streak, endIdx + 1);
        }

        grid.innerHTML = dayNames.map((name, i) => {
            let cls = 'empty';
            if (i === todayIdx) {
                cls = doneCount > 0 && i <= todayIdx && i >= (todayIdx - doneCount + 1) ? 'today' : 'empty';
            } else if (i < todayIdx && i >= (todayIdx - doneCount + 1)) {
                cls = 'done';
            } else if (i > todayIdx && doneCount > todayIdx + 1) {
                // Wrap-around: streak from previous week
                const wrapDays = doneCount - (todayIdx + 1);
                if (i >= 7 - wrapDays) cls = 'done';
            }
            return `<div class="streak-day ${cls}">${name}</div>`;
        }).join('');
    },

    // ─── RADAR CHART WIDGET ───
    renderRadarChart(summary) {
        // Try to extract health scores from summary
        // Expected: summary.health_scores = { emotion, social, physical, sleep, stress, anxiety }
        // or summary.radar = [emotion, social, physical, sleep, stress, anxiety]
        let scores = [0, 0, 0, 0, 0, 0];
        let hasData = false;

        if (summary) {
            if (summary.health_scores) {
                const hs = summary.health_scores;
                scores = [
                    hs.emotion || 0,
                    hs.social || 0,
                    hs.physical || 0,
                    hs.sleep || 0,
                    hs.stress || 0,
                    hs.anxiety || 0
                ];
                hasData = scores.some(s => s > 0);
            } else if (summary.radar && Array.isArray(summary.radar)) {
                scores = summary.radar.map(v => v || 0);
                hasData = scores.some(s => s > 0);
            }
        }

        // Update legend values
        for (let i = 0; i < 6; i++) {
            const valEl = document.getElementById(`radar-val-${i}`);
            if (valEl) {
                valEl.innerText = hasData ? scores[i].toFixed(1) : '--';
            }
        }

        if (!hasData) return;

        // Calculate polygon points from scores (0-10 scale)
        // Hexagon center = (80,80), max radius = 60
        const cx = 80, cy = 80, maxR = 60;
        const angles = [
            -Math.PI / 2,         // top (Cảm xúc)
            -Math.PI / 6,         // top-right (Xã hội)
            Math.PI / 6,          // bottom-right (Thể chất)
            Math.PI / 2,          // bottom (Giấc ngủ)
            5 * Math.PI / 6,      // bottom-left (Stress)
            7 * Math.PI / 6       // top-left (Lo âu)
        ];

        const points = scores.map((score, i) => {
            const r = (Math.min(score, 10) / 10) * maxR;
            const x = cx + r * Math.cos(angles[i]);
            const y = cy + r * Math.sin(angles[i]);
            return `${x.toFixed(0)},${y.toFixed(0)}`;
        });

        const polygon = document.getElementById('radar-polygon');
        if (polygon) polygon.setAttribute('points', points.join(' '));

        // Update dot positions
        scores.forEach((score, i) => {
            const dot = document.getElementById(`radar-dot-${i}`);
            if (dot) {
                const r = (Math.min(score, 10) / 10) * maxR;
                const x = cx + r * Math.cos(angles[i]);
                const y = cy + r * Math.sin(angles[i]);
                dot.setAttribute('cx', x.toFixed(0));
                dot.setAttribute('cy', y.toFixed(0));
            }
        });
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
