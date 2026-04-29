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

            const me = meRes.data?.data || {};
            const summaryWrap = summaryRes.data?.data || {};
            const trend = trendRes.data?.data || [];
            const breakdown = breakdownRes.data?.data || {};
            const assessments = assessmentRes.data?.data || [];
            const radar = radarRes.data?.data || {};
            const insights = insightsRes.data?.data || [];

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
                await this.loadAll();
            });
        });
    },

    bindExportButtons() {
        const exportJsonBtn = document.querySelector('[data-report-export-json]');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', async () => {
                const res = await apiClient.get(`/reports/export.json?period=${this.period}`);
                const data = res.data?.data || {};
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `peaceflow-report-${this.period}.json`;
                a.click();
                URL.revokeObjectURL(url);
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
        this.setText('[data-summary-avg-mood-delta]', this.formatDelta(deltas.avg_mood, 'so kỳ trước'));

        this.setText('[data-summary-completed-tasks]', summary.completed_tasks || 0);
        this.setText('[data-summary-completed-tasks-delta]', this.formatDelta(deltas.completed_tasks, 'so kỳ trước'));

        this.setText('[data-summary-avg-anxiety]', this.formatNum(summary.avg_anxiety));
        this.setText('[data-summary-avg-anxiety-delta]', this.formatDelta(deltas.avg_anxiety, 'so kỳ trước', true));

        this.setText('[data-summary-journal-entries]', summary.journal_entries || 0);
        this.setText('[data-summary-journal-entries-delta]', this.formatDelta(deltas.journal_entries, 'so kỳ trước'));

        this.setText('[data-summary-xp-earned]', summary.xp_earned || 0);
        this.setText('[data-summary-xp-earned-delta]', this.formatDelta(deltas.xp_earned, 'so kỳ trước'));

        this.setText('[data-summary-current-streak]', `${summary.current_streak || 0} ngày`);
        this.setText('[data-summary-longest-streak]', `Kỷ lục: ${summary.longest_streak || 0} ngày`);
    },

    renderQuickStats(summary) {
        this.setText('[data-report-good-mood-days]', summary.good_mood_days || 0);
        this.setText('[data-report-meditation-minutes]', `${summary.meditation_minutes || 0} phút`);
        this.setText('[data-report-risk-level]', summary.crisis_risk_level || 'low');
        this.setText('[data-report-stress-index]', this.formatNum(summary.current_stress_index));
    },

    renderMoodTrend(trend) {
        const container = document.querySelector('[data-report-mood-trend]');
        if (!container) return;

        if (!trend.length) {
            container.innerHTML = '<div class="empty-state">Chưa có dữ liệu mood trend.</div>';
            return;
        }

        container.innerHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Mood</th>
            <th>Lo âu</th>
            <th>Stress</th>
          </tr>
        </thead>
        <tbody>
          ${trend.map(item => `
            <tr>
              <td>${item.label}</td>
              <td>${this.formatNum(item.mood)}</td>
              <td>${this.formatNum(item.anxiety)}</td>
              <td>${this.formatNum(item.stress)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    },

    renderTaskBreakdown(breakdown) {
        this.setText('[data-task-easy]', breakdown.easy || 0);
        this.setText('[data-task-medium]', breakdown.medium || 0);
        this.setText('[data-task-hard]', breakdown.hard || 0);
        this.setText('[data-task-community]', breakdown.community || 0);
        this.setText('[data-task-emergency]', breakdown.emergency || 0);
    },

    renderAssessmentHistory(items) {
        const container = document.querySelector('[data-report-assessment-history]');
        if (!container) return;

        if (!items.length) {
            container.innerHTML = '<div class="empty-state">Chưa có lịch sử bài đánh giá.</div>';
            return;
        }

        container.innerHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>Bài test</th>
            <th>Ngày</th>
            <th>Điểm</th>
            <th>Mức độ</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.code} - ${item.name}</td>
              <td>${this.formatDate(item.created_at)}</td>
              <td>${item.total_score}</td>
              <td>${item.severity || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    },

    renderRadar(radar) {
        const container = document.querySelector('[data-report-radar]');
        if (!container) return;

        if (!radar?.labels?.length) {
            container.innerHTML = '<div class="empty-state">Chưa có dữ liệu radar.</div>';
            return;
        }

        container.innerHTML = `
      <div class="radar-list">
        ${radar.labels.map((label, idx) => `
          <div class="radar-item">
            <span>${label}</span>
            <strong>${radar.values[idx]}%</strong>
          </div>
        `).join('')}
      </div>
    `;
    },

    renderInsights(insights) {
        const container = document.querySelector('[data-report-insights]');
        if (!container) return;

        if (!insights.length) {
            container.innerHTML = '<div class="empty-state">Chưa có insight.</div>';
            return;
        }

        container.innerHTML = `
      <ul class="insight-list">
        ${insights.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
    },

    setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    },

    formatNum(value) {
        if (value == null || Number.isNaN(Number(value))) return '0';
        return Number(value).toFixed(1);
    },

    formatDelta(value, suffix = '', invertColorLogic = false) {
        if (value == null || Number.isNaN(Number(value))) return '—';
        const n = Number(value);
        const prefix = n > 0 ? '+' : '';
        return `${prefix}${n} ${suffix}`.trim();
    },

    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
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
});
