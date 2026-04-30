import { apiClient } from './api-client.js';

const reportPage = {
    period: 'week',

    async init() {
        try {
            this.bindPeriodButtons();
            this.bindExportButtons();
            await this.loadAll();
        } catch (error) {
            console.error(error);
            this.showError('Không thể tải báo cáo động.');
        }
    },

    async loadAll() {
        try {
            this.showLoading(true);

            const [meRes, summaryRes, trendRes, breakdownRes, assessmentRes, radarRes, insightsRes] = await Promise.all([
                apiClient.get('/me'),
                apiClient.get(`/reports/summary?period=${this.period}`),
                apiClient.get(`/reports/mood-trend?period=${this.period}`),
                apiClient.get(`/reports/task-breakdown?period=${this.period}`),
                apiClient.get('/reports/assessment-history'),
                apiClient.get(`/reports/radar?period=${this.period}`),
                apiClient.get(`/reports/insights?period=${this.period}`)
            ]);

            const me = meRes.data?.data || meRes || {};
            const summaryWrap = summaryRes.data?.data || summaryRes || {};
            const trend = trendRes.data?.data || trendRes || [];
            const breakdown = breakdownRes.data?.data || breakdownRes || {};
            const assessments = assessmentRes.data?.data || assessmentRes || [];
            const radar = radarRes.data?.data || radarRes || {};
            const insights = insightsRes.data?.data || insightsRes || [];

            this.renderUser(me, summaryWrap.summary);
            this.renderSummary(summaryWrap);
            this.renderQuickStats(summaryWrap.summary);
            this.renderMoodTrend(trend);
            this.renderTaskBreakdown(breakdown);
            this.renderAssessmentHistory(assessments);
            this.renderRadar(radar);
            this.renderInsights(insights);
        } catch (error) {
            console.error(error);
            this.showError('Không thể tải dữ liệu báo cáo.');
        } finally {
            this.showLoading(false);
        }
    },

    bindPeriodButtons() {
        document.querySelectorAll('[data-report-period]').forEach(btn => {
            btn.addEventListener('click', async () => {
                this.period = btn.getAttribute('data-report-period');
                document.querySelectorAll('[data-report-period]').forEach(x => x.classList.remove('active'));
                btn.classList.add('active');
                
                // Update period label UI
                const labelEl = document.getElementById('periodLabel');
                if (labelEl) {
                    if (this.period === 'month') labelEl.textContent = 'Tháng này';
                    else if (this.period === 'quarter' || this.period === '3month') labelEl.textContent = '3 tháng gần đây';
                    else labelEl.textContent = 'Tuần này';
                }

                await this.loadAll();
            });
        });
    },

    bindExportButtons() {
        const exportJsonBtn = document.querySelector('[data-report-export-json]');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', async () => {
                try {
                    const res = await apiClient.get(`/reports/export.json?period=${this.period}`);
                    const data = res.data?.data || res || {};
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `peaceflow-report-${this.period}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                } catch (err) {
                    alert('Lỗi xuất dữ liệu JSON');
                }
            });
        }
    },

    renderUser(me, summary) {
        const user = me.user || me;
        const displayName = user?.display_name || user?.full_name || 'Người dùng';

        const nameEl = document.querySelector('[data-report-user-name]');
        const levelEl = document.querySelector('[data-report-user-level]');
        const xpEl = document.querySelector('[data-report-user-xp]');

        if (nameEl) nameEl.textContent = displayName;
        if (levelEl) levelEl.textContent = `Level ${summary?.current_level || 1}`;
        if (xpEl) xpEl.textContent = `${summary?.total_xp || 0} XP`;
    },

    renderSummary(summaryWrap) {
        const summary = summaryWrap.summary || {};
        const deltas = summaryWrap.deltas || {};

        this.setText('[data-summary-avg-mood]', this.formatNum(summary.avg_mood));
        this.setDelta('[data-summary-avg-mood-delta]', deltas.avg_mood, 'so kỳ trước');

        this.setText('[data-summary-completed-tasks]', summary.completed_tasks || 0);
        this.setDelta('[data-summary-completed-tasks-delta]', deltas.completed_tasks, 'so kỳ trước');

        this.setText('[data-summary-avg-anxiety]', this.formatNum(summary.avg_anxiety));
        this.setDelta('[data-summary-avg-anxiety-delta]', deltas.avg_anxiety, 'so kỳ trước', true);

        this.setText('[data-summary-journal-entries]', summary.journal_entries || 0);
        this.setDelta('[data-summary-journal-entries-delta]', deltas.journal_entries, 'so kỳ trước');

        this.setText('[data-summary-xp-earned]', summary.xp_earned || 0);
        this.setDelta('[data-summary-xp-earned-delta]', deltas.xp_earned, 'so kỳ trước');

        this.setText('[data-summary-current-streak]', `${summary.current_streak || 0} ngày`);
        this.setText('[data-summary-longest-streak]', `${summary.longest_streak || 0} ngày`);
    },

    renderQuickStats(summary) {
        this.setText('[data-report-good-mood-days]', summary.good_mood_days || 0);
        this.setText('[data-report-meditation-minutes]', `${summary.meditation_minutes || 0} phút`);
        this.setText('[data-report-risk-level]', (summary.crisis_risk_level || 'low').toUpperCase());
        this.setText('[data-report-stress-index]', this.formatNum(summary.current_stress_index));
    },

    renderMoodTrend(trend) {
        const svg = document.getElementById('moodChart');
        const labels = document.getElementById('chartDayLabels');
        if (!svg || !trend || trend.length === 0) return;

        // Ported SVG Drawing Logic
        const W = 600, H = 180;
        const padL = 40, padR = 20, padT = 20, padB = 30;
        const chartW = W - padL - padR, chartH = H - padT - padB;
        const n = trend.length;
        const xStep = n > 1 ? chartW / (n - 1) : chartW;

        const pathD = (key) => trend.map((item, i) => {
            const val = Number(item[key] || 0);
            const x = padL + i * xStep;
            const y = padT + chartH - (val / 10) * chartH;
            return (i === 0 ? 'M' : 'L') + `${x} ${y}`;
        }).join(' ');

        let gridLines = '';
        for (let i = 0; i <= 5; i++) {
            const y = padT + (chartH / 5) * i;
            gridLines += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4"/>`;
            gridLines += `<text x="${padL - 4}" y="${y + 4}" font-size="9" fill="#A89585" text-anchor="end">${10 - i * 2}</text>`;
        }

        const moodPath = pathD('mood');
        const anxPath = pathD('anxiety');
        const stressPath = pathD('stress');

        const moodArea = trend.map((item, i) => {
            const val = Number(item.mood || 0);
            const x = padL + i * xStep;
            const y = padT + chartH - (val / 10) * chartH;
            return (i === 0 ? 'M' : 'L') + `${x} ${y}`;
        }).join(' ') + ` L${padL + (n - 1) * xStep} ${padT + chartH} L${padL} ${padT + chartH} Z`;

        svg.innerHTML = `
            <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#7BBF95" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#7BBF95" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            ${gridLines}
            <path d="${moodArea}" fill="url(#moodGrad)"/>
            <path d="${moodPath}" fill="none" stroke="#7BBF95" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="${anxPath}" fill="none" stroke="#E8A876" stroke-width="1.5" stroke-dasharray="5,3" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="${stressPath}" fill="none" stroke="#C3AED6" stroke-width="1.5" stroke-dasharray="3,3" stroke-linejoin="round" stroke-linecap="round"/>
            ${trend.map((item, i) => {
                const val = Number(item.mood || 0);
                const x = padL + i * xStep;
                const y = padT + chartH - (val / 10) * chartH;
                return `<circle cx="${x}" cy="${y}" r="3.5" fill="#7BBF95" stroke="white" stroke-width="1.5"/>`;
            }).join('')}
        `;

        if (labels) {
            labels.innerHTML = trend.map((item) => `
                <div style="flex:1;text-align:center;font-size:0.62rem;color:var(--text-light);font-weight:600;">${item.label}</div>
            `).join('');
        }
    },

    renderTaskBreakdown(breakdown) {
        this.setText('[data-task-easy]', breakdown.easy || 0);
        this.setText('[data-task-medium]', breakdown.medium || 0);
        this.setText('[data-task-hard]', breakdown.hard || 0);
        this.setText('[data-task-community]', breakdown.community || 0);
        this.setText('[data-task-emergency]', breakdown.emergency || 0);

        // Update bars
        const max = Math.max(...Object.values(breakdown), 5);
        const updateBar = (selector, val) => {
            const el = document.querySelector(selector);
            if (el) el.style.width = `${(val / max) * 100}%`;
        };

        updateBar('.tb-item:nth-child(1) .tbi-bar', breakdown.easy);
        updateBar('.tb-item:nth-child(2) .tbi-bar', breakdown.medium);
        updateBar('.tb-item:nth-child(3) .tbi-bar', breakdown.hard);
        updateBar('.tb-item:nth-child(4) .tbi-bar', breakdown.community);
        updateBar('.tb-item:nth-child(5) .tbi-bar', breakdown.emergency);
    },

    renderAssessmentHistory(items) {
        const container = document.querySelector('[data-report-assessment-history]');
        if (!container) return;

        if (!items || !items.length) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);">Chưa có lịch sử bài đánh giá.</div>';
            return;
        }

        container.innerHTML = items.map(item => {
            const severityClass = this.getSeverityClass(item.severity);
            return `
                <div class="assessment-item" style="display:flex;align-items:center;padding:12px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--border-radius-sm);margin-bottom:8px;">
                    <div class="ai-icon" style="width:40px;height:40px;background:var(--lavender-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-right:12px;">📋</div>
                    <div class="ai-info" style="flex:1;">
                        <div class="ai-name" style="font-weight:700;font-size:0.85rem;">${item.code} - ${item.name}</div>
                        <div class="ai-date" style="font-size:0.7rem;color:var(--text-light);">📅 ${this.formatDate(item.created_at)}</div>
                    </div>
                    <div class="ai-score" style="text-align:right;">
                        <div class="ai-score-num" style="font-weight:800;font-size:0.9rem;color:var(--text-primary);">${item.total_score}</div>
                        <div class="ai-score-label ${severityClass}" style="font-size:0.65rem;font-weight:700;">${item.severity || 'N/A'}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderRadar(radar) {
        const svg = document.getElementById('radarChart');
        const legend = document.getElementById('radarLegend');
        if (!svg || !radar?.labels?.length) return;

        const d = radar;
        const cx = 110, cy = 110, r = 80;
        const n = d.labels.length;
        const colors = ['#FF8B8B', '#C3AED6', '#FFCBA4', '#A8D5BA', '#A8D8EA', '#FFD93D'];

        const polar = (angle, radius) => {
            const a = (angle - 90) * Math.PI / 180;
            return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
        };

        let grid = '';
        for (let level = 1; level <= 5; level++) {
            const pts = Array.from({ length: n }, (_, i) => {
                const p = polar(i * (360 / n), r * (level / 5));
                return `${p.x},${p.y}`;
            }).join(' ');
            grid += `<polygon points="${pts}" fill="none" stroke="#E8CBA7" stroke-width="${level === 5 ? 1.5 : 0.8}"/>`;
        }

        let axes = '';
        d.labels.forEach((_, i) => {
            const p = polar(i * (360 / n), r);
            axes += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#E8CBA7" stroke-width="1"/>`;
        });

        const dataPts = d.values.map((v, i) => {
            const p = polar(i * (360 / n), r * (v / 100));
            return `${p.x},${p.y}`;
        }).join(' ');

        let labelsSVG = '';
        d.labels.forEach((lbl, i) => {
            const p = polar(i * (360 / n), r + 18);
            labelsSVG += `<text x="${p.x}" y="${p.y}" font-size="9" fill="#7A6555" text-anchor="middle" dominant-baseline="middle" font-family="Nunito" font-weight="700">${lbl}</text>`;
        });

        let dots = '';
        d.values.forEach((v, i) => {
            const p = polar(i * (360 / n), r * (v / 100));
            dots += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${colors[i % colors.length]}" stroke="white" stroke-width="1.5"/>`;
        });

        svg.innerHTML = `
            ${grid}
            ${axes}
            <polygon points="${dataPts}" fill="rgba(168,213,186,0.25)" stroke="#7BBF95" stroke-width="2"/>
            ${labelsSVG}
            ${dots}
        `;

        if (legend) {
            legend.innerHTML = d.labels.map((l, i) => `
                <div style="display:flex;align-items:center;gap:3px;font-size:0.6rem;color:var(--text-secondary);">
                    <div style="width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]};"></div>
                    <span>${l}: ${d.values[i]}%</span>
                </div>
            `).join('');
        }
    },

    renderInsights(insights) {
        const container = document.querySelector('[data-report-insights]');
        if (!container) return;

        if (!insights || !insights.length) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);">Đang tổng hợp insight...</div>';
            return;
        }

        container.innerHTML = insights.map(item => `
            <div class="insight-item" style="padding:12px;background:var(--warm-white);border-left:4px solid var(--mint);margin-bottom:10px;border-radius:0 8px 8px 0;box-shadow:var(--shadow-paper);">
                <div class="ii-text" style="font-size:0.8rem;line-height:1.5;">💡 ${item}</div>
            </div>
        `).join('');
    },

    setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    },

    setDelta(selector, value, suffix = '', invertColorLogic = false) {
        const el = document.querySelector(selector);
        if (!el) return;

        if (value == null || Number.isNaN(Number(value))) {
            el.textContent = '—';
            el.className = 'sc-change neutral';
            return;
        }

        const n = Number(value);
        const prefix = n > 0 ? '+' : '';
        el.textContent = `${prefix}${n} ${suffix}`;

        let isPositive = n > 0;
        if (invertColorLogic) isPositive = n < 0; // Lower is better for anxiety/stress

        if (n === 0) el.className = 'sc-change neutral';
        else el.className = `sc-change ${isPositive ? 'up' : 'down'}`;
    },

    formatNum(value) {
        if (value == null || Number.isNaN(Number(value))) return '0';
        return Number(value).toFixed(1);
    },

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    },

    getSeverityClass(severity) {
        const s = String(severity || '').toLowerCase();
        if (['severe', 'moderately_severe', 'high', 'critical'].includes(s)) return 'text-red';
        if (['moderate', 'medium'].includes(s)) return 'text-orange';
        return 'text-green';
    },

    showLoading(isLoading) {
        const el = document.querySelector('[data-report-loading]');
        if (el) el.style.display = isLoading ? 'block' : 'none';
    },

    showError(message) {
        const el = document.querySelector('[data-report-error]');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    reportPage.init();
    
    // Refresh data when user profile is updated
    window.addEventListener('user-updated', () => {
        reportPage.loadAll();
    });
});
