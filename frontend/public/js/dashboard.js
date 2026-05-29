import { apiClient } from './api-client.js';
import { auth } from './auth.js';

const dashboard = window.__peaceflowDashboardController || {
    state: {
        data: null,
        chartPeriod: '7d',
        loading: false,
        initialized: false
    },

    async init() {
        if (this.state.initialized) return;
        this.state.initialized = true;

        try {
            await auth.waitForAuth();
            await this.refresh();
        } catch (error) {
            console.error('Dashboard init error:', error);
            this.renderFetchError();
            this.state.initialized = false;
        }
    },

    async refresh(force = false) {
        if (this.state.loading && !force) return;
        this.state.loading = true;

        try {
            const data = await apiClient.get('/dashboard');
            this.state.data = data;

            if (data?.user) {
                this.syncUser(data.user);
            } else {
                const user = auth.getUser();
                if (user) this.updateUserInfo(user);
            }

            this.render();
            localStorage.removeItem('peaceflow_dashboard_refresh');
        } finally {
            this.state.loading = false;
        }
    },

    syncUser(user) {
        const current = auth.getUser() || {};
        const isSameUser = current.id && user.id ? current.id === user.id : true;
        const merged = isSameUser ? { ...current, ...user } : { ...user };
        if (merged.display_name && (!merged.full_name || merged.full_name === current.full_name)) {
            merged.full_name = merged.display_name;
        }
        localStorage.setItem('user', JSON.stringify(merged));
        this.updateUserInfo(merged);
        window.dispatchEvent(new Event('user-profile-updated'));
    },

    updateUserInfo(user) {
        const name = user.full_name || user.display_name || 'Người dùng';
        document.querySelectorAll('.user-name').forEach((el) => {
            el.innerText = user.display_name || user.full_name || name;
        });

        if (user.avatar_url) {
            document.querySelectorAll('.user-avatar-mini').forEach((el) => {
                el.style.backgroundImage = `url('${user.avatar_url}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.innerText = '';
            });
        }
    },

    render() {
        const { data, chartPeriod } = this.state;
        if (!data) return;

        this.renderStats(data.progress, data.latest_mood, data.summary);
        this.renderEmergencyBanner(Boolean(data.summary?.show_emergency_banner));
        this.renderChart(chartPeriod);
        this.renderInsight(data.insight);
        this.renderRadar(data.wellness?.radar || []);
        this.renderGarden(data.wellness?.garden || [], data.summary?.risk_level);
        this.renderXP(data.progress);
        this.renderStreak(data.progress);
        this.renderChallenge(data.challenge);
        this.renderExpertCard(data.expert_session, data.summary);
        this.renderRecommendations(data.tasks || []);
    },

    renderStats(progress, mood, summary) {
        const xp = progress?.xp ?? 0;
        const level = progress?.level ?? progress?.current_level ?? 1;
        document.querySelectorAll('.user-level').forEach((el) => {
            el.innerText = `⭐ ${xp} XP · Level ${level}`;
        });

        this.setText('stat-mood', mood?.mood_score ?? '--');
        this.setText('trend-mood', mood?.mood_score !== undefined && mood?.mood_score !== null ? 'Dữ liệu mới nhất từ DB' : 'Chưa có dữ liệu');
        this.setStyle('trend-mood', 'color', mood?.mood_score !== undefined && mood?.mood_score !== null ? 'var(--mint-dark)' : 'var(--text-light)');

        const streak = progress?.current_streak ?? progress?.streak ?? 0;
        this.setText('stat-streak', streak);
        this.setText('trend-streak', streak > 0 ? 'Đang duy trì nhịp tốt' : 'Bắt đầu một chuỗi mới hôm nay');
        this.setStyle('trend-streak', 'color', streak > 0 ? 'var(--peach-dark)' : 'var(--text-light)');

        const weeklyTasks = progress?.weekly_tasks_completed ?? 0;
        this.setText('stat-tasks', weeklyTasks);
        this.setText('trend-tasks', weeklyTasks > 0 ? `Đã hoàn thành ${weeklyTasks} nhiệm vụ trong 7 ngày` : 'Chưa có nhiệm vụ hoàn thành trong tuần');
        this.setStyle('trend-tasks', 'color', weeklyTasks > 0 ? 'var(--sky)' : 'var(--text-light)');

        const anxietyAverage = summary?.anxiety_average_14d;
        const hasAnxietyAverage = anxietyAverage !== null && anxietyAverage !== undefined;
        this.setText('stat-anxiety', hasAnxietyAverage ? anxietyAverage : '--');
        this.setText('trend-anxiety', hasAnxietyAverage ? 'Trung bình 14 ngày gần nhất' : 'Chưa đủ dữ liệu');
        this.setStyle('trend-anxiety', 'color', hasAnxietyAverage ? 'var(--lavender)' : 'var(--text-light)');
    },

    renderEmergencyBanner(show) {
        const banner = document.getElementById('emergencyBanner');
        if (banner) banner.style.display = show ? 'block' : 'none';
    },

    renderChart(period) {
        const card = document.querySelector('.chart-card');
        const chartData = this.state.data?.mood_chart?.[period];
        if (!card) return;

        card.innerHTML = `
            <div class="chart-header">
                <div class="chart-title">📈 Biểu đồ tâm trạng</div>
                <div class="chart-tabs">
                    ${this.renderChartTab('7d', '7 ngày', period)}
                    ${this.renderChartTab('30d', '30 ngày', period)}
                    ${this.renderChartTab('3m', '3 tháng', period)}
                </div>
            </div>
            <div class="mood-chart-area">
                ${this.renderChartSvg(chartData)}
            </div>
            <div class="chart-labels">
                ${this.renderChartLabels(chartData)}
            </div>
        `;
    },

    renderChartTab(period, label, currentPeriod) {
        const activeClass = currentPeriod === period ? 'active' : '';
        return `<button class="chart-tab ${activeClass}" data-chart-period="${period}" onclick="switchTab(this,'${period}')">${label}</button>`;
    },

    renderChartSvg(chartData) {
        const points = chartData?.points || [];
        const numericPoints = points.filter((point) => point.value !== null && point.value !== undefined);

        if (!numericPoints.length) {
            return `
                <div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--text-light);padding:0 18px;">
                    Chưa có đủ dữ liệu mood check-in để vẽ biểu đồ.
                </div>
            `;
        }

        const width = 500;
        const height = 140;
        const left = 30;
        const right = 470;
        const bottom = 130;
        const top = 18;
        const step = points.length > 1 ? (right - left) / (points.length - 1) : 0;

        const plotted = points.map((point, index) => {
            const value = point.value === null || point.value === undefined ? null : Number(point.value);
            const x = left + (step * index);
            const y = value === null ? null : bottom - (((value - 1) / 9) * (bottom - top));
            return { ...point, x, y, value };
        });

        const filled = plotted.map((point, index) => {
            if (point.y !== null) return point;
            const prev = [...plotted].slice(0, index).reverse().find((item) => item.y !== null);
            const next = plotted.slice(index + 1).find((item) => item.y !== null);
            return { ...point, y: prev?.y ?? next?.y ?? bottom };
        });

        const linePoints = filled.map((point) => `${point.x},${point.y}`).join(' ');
        const areaPoints = `${linePoints} ${right},${bottom} ${left},${bottom}`;
        const lastPoint = plotted.filter((point) => point.value !== null).slice(-1)[0];

        return `
            <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <line x1="0" y1="28" x2="${width}" y2="28" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4" />
                <line x1="0" y1="70" x2="${width}" y2="70" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4" />
                <line x1="0" y1="112" x2="${width}" y2="112" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4" />
                <text x="4" y="26" font-size="10" fill="#A89585" font-family="Nunito">10</text>
                <text x="4" y="68" font-size="10" fill="#A89585" font-family="Nunito">5</text>
                <text x="4" y="110" font-size="10" fill="#A89585" font-family="Nunito">1</text>
                <defs>
                    <linearGradient id="moodGradDynamic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#A8D5BA" stop-opacity="0.4" />
                        <stop offset="100%" stop-color="#A8D5BA" stop-opacity="0.05" />
                    </linearGradient>
                </defs>
                <polygon points="${areaPoints}" fill="url(#moodGradDynamic)" />
                <polyline points="${linePoints}" fill="none" stroke="#7BBF95" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                ${plotted.map((point) => {
                    if (point.value === null) return '';
                    const isLast = lastPoint && lastPoint.date === point.date;
                    return `<circle cx="${point.x}" cy="${point.y}" r="${isLast ? 6 : 5}" fill="${isLast ? '#FFCBA4' : '#7BBF95'}" stroke="${isLast ? '#E8A876' : 'white'}" stroke-width="2" />`;
                }).join('')}
                ${lastPoint ? `
                    <rect x="${Math.max(0, lastPoint.x - 26)}" y="${Math.max(0, lastPoint.y - 22)}" width="52" height="18" rx="6" fill="#4A3728" opacity="0.85" />
                    <text x="${lastPoint.x}" y="${Math.max(12, lastPoint.y - 10)}" font-size="10" fill="white" font-family="Nunito" font-weight="700" text-anchor="middle">${lastPoint.value}/10</text>
                ` : ''}
            </svg>
        `;
    },

    renderChartLabels(chartData) {
        const points = chartData?.points || [];
        if (!points.length) {
            return '<span>Chưa có dữ liệu</span>';
        }
        return points.map((point) => `<span>${this.escapeHtml(point.label || '--')}</span>`).join('');
    },

    renderInsight(insight) {
        const card = document.getElementById('insightCard');
        if (!card) return;

        const tags = insight?.tags?.length
            ? insight.tags.map((tag, index) => {
                const classes = ['badge-mint', 'badge-peach', 'badge-lavender'];
                return `<span class="badge-pill ${classes[index % classes.length]}">${this.escapeHtml(tag)}</span>`;
            }).join('')
            : '<span class="badge-pill badge-mint">Đang chờ dữ liệu</span>';

        card.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon">🤖</div>
                <div class="insight-title">${this.escapeHtml(insight?.title || 'Insight từ dữ liệu của bạn')}</div>
                <span class="badge-pill badge-mint" style="margin-left:auto;">DB</span>
            </div>
            <div class="insight-text">${this.escapeHtml(insight?.body || 'Chưa có phân tích.').replace(/\n/g, '<br>')}</div>
            <div class="insight-tags">${tags}</div>
        `;
    },

    renderRadar(metrics) {
        const card = document.getElementById('radarCard');
        if (!card) return;

        if (!metrics.length) {
            card.innerHTML = this.renderEmptySection('🕸️ Sức khỏe tổng thể', 'Chưa có đủ dữ liệu để tổng hợp các chỉ số.');
            return;
        }

        const svg = this.buildRadarSvg(metrics);
        const legend = metrics.map((metric) => `
            <div class="rl-item">
                <div class="rl-dot" style="background:${metric.color}"></div>
                <span class="rl-label">${this.escapeHtml(metric.label)}</span>
                <span class="rl-val">${metric.value ?? '--'}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="section-title">
                <span class="st-icon">🕸️</span> Sức khỏe tổng thể
            </div>
            <div class="radar-wrap">
                <div class="radar-svg-wrap">${svg}</div>
                <div class="radar-legend">${legend}</div>
            </div>
        `;
    },

    renderGarden(gardenMetrics, riskLevel) {
        const card = document.getElementById('gardenCard');
        if (!card) return;

        if (!gardenMetrics.length) {
            card.innerHTML = this.renderEmptySection('🌳 Khu vườn tâm hồn', 'Chưa có đủ dữ liệu để nuôi khu vườn.');
            return;
        }

        const treePositions = ['10%', '32%', '56%', '79%'];
        const trees = gardenMetrics.map((metric, index) => {
            const tone = this.getGardenTone(metric.status);
            const size = 20 + Math.round((Number(metric.value || 0) / 10) * 18);
            const trunk = 16 + Math.round((Number(metric.value || 0) / 10) * 10);
            return `
                <div class="garden-tree" style="left:${treePositions[index]};">
                    <div class="gt-top" style="border-left-width:${Math.round(size / 2)}px;border-right-width:${Math.round(size / 2)}px;border-bottom-width:${size}px;border-bottom-color:${tone};"></div>
                    <div class="gt-trunk" style="width:8px;height:${trunk}px;"></div>
                    <div class="gt-flower" style="top:-${size + 10}px;left:4px;">${this.escapeHtml(metric.emoji)}</div>
                </div>
            `;
        }).join('');

        const legend = gardenMetrics.map((metric) => `
            <div class="gl-item">
                <div class="gl-dot" style="background:${metric.color}"></div>
                ${this.escapeHtml(metric.label)} — ${this.escapeHtml(metric.status_text)} ${this.escapeHtml(metric.emoji)}
            </div>
        `).join('');

        card.innerHTML = `
            <div class="section-title">
                <span class="st-icon">🌳</span> Khu vườn tâm hồn
                <span class="badge-pill ${this.getRiskBadgeClass(riskLevel)}" style="margin-left:auto;">${this.escapeHtml(this.getRiskLabel(riskLevel))}</span>
            </div>
            <div class="garden-scene">
                <div class="garden-sky">
                    <div class="g-sun"></div>
                    <div class="g-cloud g-cloud-1"></div>
                    <div class="g-cloud g-cloud-2"></div>
                    <div class="g-rainbow ${riskLevel === 'low' || riskLevel === 'moderate' ? 'show' : ''}" id="gardenRainbow"></div>
                    <div class="g-butterfly g-butterfly-1">🦋</div>
                    <div class="g-butterfly g-butterfly-2">🦋</div>
                </div>
                ${trees}
                <div class="g-mascot">${riskLevel === 'critical' ? '🫶' : '🐱'}</div>
            </div>
            <div class="garden-legend">${legend}</div>
        `;
    },

    renderXP(progress) {
        const card = document.getElementById('xpCard');
        if (!card) return;

        const xp = progress?.xp ?? 0;
        const levelInfo = progress?.level_info || this.getLevelInfo(xp);
        const percent = levelInfo?.progress_percent ?? this.getLevelProgress(xp);
        const currentLevel = progress?.level ?? progress?.current_level ?? levelInfo.level;
        const maxXP = levelInfo?.maxXP ?? levelInfo.maxXP;
        const minXP = levelInfo?.minXP ?? levelInfo.minXP;
        const xpToNext = levelInfo?.xp_to_next ?? (maxXP === Infinity ? 0 : Math.max(0, maxXP - xp));
        const nextLabel = maxXP === Infinity ? 'Bạn đang ở cấp cao nhất hiện tại' : `Còn ${xpToNext} XP → Level ${currentLevel + 1}`;

        card.innerHTML = `
            <div class="xp-header">
                <div class="xp-level-badge">
                    <div class="xp-level-circle">${currentLevel}</div>
                    <div class="xp-level-info">
                        <div class="xl-name">${this.escapeHtml(levelInfo.title || 'Hành trình đang tiếp tục')}</div>
                        <div class="xl-range">${minXP} – ${maxXP === Infinity ? '∞' : maxXP} XP</div>
                    </div>
                </div>
                <div class="xp-total">${xp} XP</div>
            </div>
            <div class="xp-bar-wrap">
                <div class="xp-bar-fill" style="width:${percent}%"></div>
            </div>
            <div class="xp-bar-labels">
                <span>${minXP} XP</span>
                <span>${this.escapeHtml(nextLabel)}</span>
                <span>${maxXP === Infinity ? '∞' : `${maxXP} XP`}</span>
            </div>
        `;
    },

    renderStreak(progress) {
        const card = document.getElementById('streakCard');
        if (!card) return;

        const streak = progress?.current_streak ?? progress?.streak ?? 0;
        const days = this.buildStreakDays(streak);

        card.innerHTML = `
            <div class="streak-fire">🔥</div>
            <div class="streak-number">${streak}</div>
            <div class="streak-label">ngày streak liên tục</div>
            <div class="streak-days">
                ${days.map((day) => `<div class="streak-day ${day.className}">${day.label}</div>`).join('')}
            </div>
        `;
    },

    renderChallenge(challenge) {
        const card = document.getElementById('challengeCard');
        if (!card) return;

        if (!challenge) {
            card.innerHTML = this.renderEmptySection('🏆 Mục tiêu tuần', 'Chưa có dữ liệu mục tiêu tuần này.');
            return;
        }

        card.innerHTML = `
            <div class="challenge-header">
                <span style="font-size:1.3rem;">🏆</span>
                <div class="challenge-title">${this.escapeHtml(challenge.title)}</div>
                <span class="badge-pill badge-peach" style="margin-left:auto;">${challenge.days_left} ngày còn lại</span>
            </div>
            <div class="challenge-desc">${this.escapeHtml(challenge.description)}</div>
            <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width:${challenge.progress_percent}%"></div>
            </div>
            <div class="challenge-meta">
                <span>${challenge.completed}/${challenge.goal} nhiệm vụ</span>
                <span>${this.escapeHtml(challenge.reward_label)}</span>
            </div>
        `;
    },

    renderExpertCard(expertSession, summary) {
        const card = document.getElementById('expertCard');
        if (!card) return;

        if (expertSession) {
            card.innerHTML = `
                <div style="padding:14px 18px 8px;font-size:0.85rem;font-weight:700;border-bottom:1px solid var(--kraft-light);">
                    🩺 Phiên tư vấn sắp tới
                </div>
                <div class="expert-mini-card">
                    <div class="expert-avatar">👩‍⚕️</div>
                    <div class="expert-info">
                        <div class="expert-name">${this.escapeHtml(expertSession.expert_name)}</div>
                        <div class="expert-type">${this.escapeHtml(expertSession.session_type || 'Tư vấn trực tuyến')}</div>
                        <div class="expert-time">${this.escapeHtml(expertSession.starts_at)}</div>
                    </div>
                    <a class="btn-outline" style="font-size:0.72rem;padding:6px 12px;" href="experts.html">Xem</a>
                </div>
            `;
            return;
        }

        const helperText = ['high', 'critical'].includes(summary?.risk_level)
            ? 'Bạn đang ở vùng cần ưu tiên hồi phục. Nếu cần thêm hỗ trợ, hãy cân nhắc kết nối chuyên gia.'
            : 'Hiện chưa có lịch tư vấn nào được lưu trong hệ thống.';

        card.innerHTML = `
            <div style="padding:14px 18px 8px;font-size:0.85rem;font-weight:700;border-bottom:1px solid var(--kraft-light);">
                🩺 Phiên tư vấn sắp tới
            </div>
            <div style="padding:18px;">
                <div style="font-size:0.9rem;font-weight:800;margin-bottom:6px;">Chưa có lịch tư vấn</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:14px;">${this.escapeHtml(helperText)}</div>
                <a href="experts.html" class="btn-outline" style="font-size:0.78rem;">Xem chuyên gia</a>
            </div>
        `;
    },

    renderRecommendations(tasks) {
        const card = document.getElementById('todayTasksCard');
        if (!card) return;

        const header = `
            <div style="padding:16px 18px;border-bottom:2px solid var(--kraft-light);display:flex;align-items:center;justify-content:space-between;">
                <div class="section-title" style="margin-bottom:0;">
                    <span class="st-icon">🎯</span> Nhiệm vụ hôm nay
                </div>
                <a href="tasks.html" class="st-link" style="font-size:0.75rem;color:var(--mint-dark);font-weight:600;text-decoration:none;">Xem tất cả →</a>
            </div>
        `;

        if (!tasks.length) {
            card.innerHTML = `${header}
                <div style="padding:20px;text-align:center;color:var(--text-secondary);">
                    Chưa có nhiệm vụ được đề xuất từ DB. Hãy hoàn thành mood check-in để hệ thống gợi ý phù hợp hơn.
                </div>
            `;
            return;
        }

        const items = tasks.map((task) => `
            <div class="task-card paper-card" style="border:none;border-radius:0;box-shadow:none;cursor:pointer;"
                onclick="location.href='task-detail.html?id=${task.id}'">
                <div class="task-icon-box ${this.escapeHtml((task.difficulty || 'easy').toLowerCase())}">${this.getTaskEmoji(task.category)}</div>
                <div class="task-info">
                    <div class="task-name">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span>⏱ ${task.duration_minutes || 0} phút</span>
                        <span>🔴 ${this.escapeHtml(task.difficulty || 'Dễ')}</span>
                    </div>
                </div>
                <span class="task-xp">+${task.xp_reward || 0} XP</span>
            </div>
            <div class="task-divider"></div>
        `).join('');

        card.innerHTML = `${header}${items}`;
    },

    renderFetchError() {
        const chartCard = document.querySelector('.chart-card');
        if (chartCard) {
            chartCard.innerHTML = `
                <div class="chart-header">
                    <div class="chart-title">📈 Biểu đồ tâm trạng</div>
                </div>
                <div style="padding:12px 0;color:var(--coral);">
                    Không tải được dashboard từ API.
                </div>
            `;
        }
    },

    switchChart(period, button) {
        this.state.chartPeriod = period;
        document.querySelectorAll('.chart-tab').forEach((tab) => {
            tab.classList.toggle('active', tab === button);
        });
        this.renderChart(period);
    },

    buildRadarSvg(metrics) {
        const centerX = 80;
        const centerY = 80;
        const radius = 58;
        const axisCount = metrics.length;
        const gridLevels = [1, 0.75, 0.5];

        const polarPoint = (index, scale) => {
            const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / axisCount);
            return {
                x: centerX + (Math.cos(angle) * radius * scale),
                y: centerY + (Math.sin(angle) * radius * scale)
            };
        };

        const grid = gridLevels.map((level, levelIndex) => {
            const points = metrics.map((_, index) => {
                const point = polarPoint(index, level);
                return `${point.x},${point.y}`;
            }).join(' ');
            return `<polygon points="${points}" fill="none" stroke="#E8CBA7" stroke-width="${levelIndex === 0 ? 1.5 : 1}" />`;
        }).join('');

        const axes = metrics.map((_, index) => {
            const point = polarPoint(index, 1);
            return `<line x1="${centerX}" y1="${centerY}" x2="${point.x}" y2="${point.y}" stroke="#E8CBA7" stroke-width="1" />`;
        }).join('');

        const polygonPoints = metrics.map((metric, index) => {
            const normalized = metric.value === null || metric.value === undefined ? 0.2 : Math.max(0.1, Number(metric.value) / 10);
            const point = polarPoint(index, normalized);
            return `${point.x},${point.y}`;
        }).join(' ');

        const dots = metrics.map((metric, index) => {
            const normalized = metric.value === null || metric.value === undefined ? 0.2 : Math.max(0.1, Number(metric.value) / 10);
            const point = polarPoint(index, normalized);
            return `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${metric.color}" />`;
        }).join('');

        const labels = metrics.map((metric, index) => {
            const point = polarPoint(index, 1.18);
            let anchor = 'middle';
            if (point.x < centerX - 8) anchor = 'end';
            if (point.x > centerX + 8) anchor = 'start';
            return `<text x="${point.x}" y="${point.y}" text-anchor="${anchor}" font-size="9" fill="#7A6555" font-family="Nunito" font-weight="700">${this.escapeHtml(metric.label)}</text>`;
        }).join('');

        return `
            <svg width="160" height="160" viewBox="0 0 160 160">
                ${grid}
                ${axes}
                <polygon points="${polygonPoints}" fill="rgba(168,213,186,0.35)" stroke="#7BBF95" stroke-width="2.5" />
                ${dots}
                ${labels}
            </svg>
        `;
    },

    buildStreakDays(streak) {
        const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const today = new Date().getDay();
        const activeIndexes = new Set();

        for (let offset = 0; offset < Math.min(streak, 7); offset += 1) {
            activeIndexes.add((today - offset + 7) % 7);
        }

        return labels.map((label, index) => {
            let className = '';
            if (activeIndexes.has(index)) className = 'done';
            if (index === today) className = streak > 0 ? 'today done' : 'today';
            return { label, className };
        });
    },

    getTaskEmoji(category) {
        if (!category) return '✨';
        const emojis = {
            breathing: '💨',
            meditation: '🧘',
            journal: '✍️',
            emergency: '🚨',
            sleep: '😴',
            reflection: '🙏'
        };
        return emojis[String(category).toLowerCase()] || '✨';
    },

    getGardenTone(status) {
        if (status === 'excellent') return '#7BBF95';
        if (status === 'good') return '#A8D5BA';
        if (status === 'fair') return '#C5E8D2';
        if (status === 'needs-care') return '#FFCBA4';
        return '#E8CBA7';
    },

    getRiskLabel(level) {
        if (level === 'critical') return 'Rủi ro rất cao';
        if (level === 'high') return 'Rủi ro cao';
        if (level === 'moderate') return 'Cần theo dõi';
        return 'Ổn định';
    },

    getRiskBadgeClass(level) {
        if (level === 'critical' || level === 'high') return 'badge-coral';
        if (level === 'moderate') return 'badge-peach';
        return 'badge-mint';
    },

    getLevelInfo(xp) {
        const levels = [
            { level: 1, title: 'Người Bắt Đầu', minXP: 0, maxXP: 100 },
            { level: 2, title: 'Người Khám Phá', minXP: 100, maxXP: 300 },
            { level: 3, title: 'Người Kiên Cường', minXP: 300, maxXP: 600 },
            { level: 4, title: 'Người Truyền Cảm Hứng', minXP: 600, maxXP: 1000 },
            { level: 5, title: 'Bậc Thầy Bình Yên', minXP: 1000, maxXP: Infinity }
        ];
        return levels.slice().reverse().find((level) => xp >= level.minXP) || levels[0];
    },

    getLevelProgress(xp) {
        const level = this.getLevelInfo(xp);
        if (level.maxXP === Infinity) return 100;
        return Math.max(0, Math.min(100, Math.round(((xp - level.minXP) / (level.maxXP - level.minXP)) * 100)));
    },

    renderEmptySection(title, message) {
        return `
            <div class="section-title">
                <span class="st-icon">${title.split(' ')[0]}</span> ${this.escapeHtml(title.replace(/^[^\s]+\s/, ''))}
            </div>
            <div style="padding:12px 0;color:var(--text-secondary);">${this.escapeHtml(message)}</div>
        `;
    },

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.innerText = value;
    },

    setStyle(id, property, value) {
        const element = document.getElementById(id);
        if (element) element.style[property] = value;
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};

window.switchTab = (button, period) => {
    dashboard.switchChart(period, button);
};

window.__peaceflowDashboardController = dashboard;

export { dashboard };

function isDashboardPage() {
    return Boolean(
        document.getElementById('insightCard')
        && document.getElementById('radarCard')
        && document.getElementById('gardenCard')
        && document.getElementById('todayTasksCard')
        && document.getElementById('xpCard')
    );
}

function isDashboardRoute(pageSpec = window.__peaceflowCurrentPageSpec || '') {
    return String(pageSpec || '').startsWith('dashboard.html');
}

function waitForDashboardPage(maxAttempts = 8, delayMs = 80) {
    return new Promise((resolve) => {
        let attempts = 0;

        const check = () => {
            if (isDashboardPage()) {
                resolve(true);
                return;
            }
            attempts += 1;
            if (attempts >= maxAttempts) {
                resolve(false);
                return;
            }
            setTimeout(check, delayMs);
        };

        check();
    });
}

async function handleDashboardRouteActivation(forceRefresh = false) {
    const hasDashboardDom = await waitForDashboardPage();
    if (!hasDashboardDom) return;

    if (!dashboard.state.initialized) {
        await dashboard.init();
        return;
    }

    if (forceRefresh) {
        await dashboard.refresh(true);
    }
}

if (typeof document !== 'undefined') {
    const triggerDashboardRefresh = () => {
        dashboard.refresh(true).catch((error) => {
            console.error('Dashboard realtime refresh failed:', error);
        });
    };

    if (!window.__peaceflowDashboardBindingsInstalled) {
        window.__peaceflowDashboardBindingsInstalled = true;

        window.addEventListener('pageshow', () => {
            if (!isDashboardRoute()) return;
            if (localStorage.getItem('peaceflow_dashboard_refresh') === '1') {
                triggerDashboardRefresh();
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (!isDashboardRoute()) return;
            if (document.visibilityState !== 'visible') return;
            if (localStorage.getItem('peaceflow_dashboard_refresh') === '1') {
                triggerDashboardRefresh();
            }
        });
        window.addEventListener('storage', (event) => {
            if (event.key === 'peaceflow_dashboard_refresh' && event.newValue === '1') {
                triggerDashboardRefresh();
            }
        });
        window.addEventListener('peaceflow-dashboard-refresh', triggerDashboardRefresh);
        window.addEventListener('peaceflow:route-mounted', async (event) => {
            if (!isDashboardRoute(event.detail?.page)) return;
            try {
                await handleDashboardRouteActivation(true);
            } catch (error) {
                console.error('Dashboard route activation failed:', error);
            }
        });
    }

    if (isDashboardPage() || isDashboardRoute()) {
        handleDashboardRouteActivation(true).catch((error) => {
            console.error('Dashboard initial activation failed:', error);
        });
    }
}
