<template>
  <div class="report-page">
    <div class="toast" :class="{ show: toastVisible }">{{ toastIcon }} <span>{{ toastText }}</span></div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <span>📊 Báo cáo sức khỏe</span>
      </div>

      <div class="page-header">
        <div>
          <div class="page-title">📊 Báo Cáo Sức Khỏe</div>
          <div class="page-subtitle">{{ subtitleText }}</div>
        </div>
        <button class="btn-primary" @click="exportPDF">📄 Xuất PDF</button>
      </div>

      <div class="period-selector">
        <button class="period-btn" :class="{ active: currentPeriod === 'week' }" @click="switchPeriod('week')">📅 Tuần này</button>
        <button class="period-btn" :class="{ active: currentPeriod === 'month' }" @click="switchPeriod('month')">📆 Tháng này</button>
        <button class="period-btn" :class="{ active: currentPeriod === '3month' }" @click="switchPeriod('3month')">📈 3 Tháng</button>
        <div class="period-nav">
          <button class="pn-btn" @click="navPeriod(-1)">‹</button>
          <div class="pn-label">{{ periodLabelText }}</div>
          <button class="pn-btn" @click="navPeriod(1)">›</button>
        </div>
      </div>

      <div class="summary-grid">
        <div v-for="(card, idx) in summaryCards" :key="idx" class="paper-card summary-card">
          <div class="sc-deco">{{ card.deco }}</div>
          <div class="sc-icon">{{ card.icon }}</div>
          <div class="sc-num" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="sc-label">{{ card.label }}</div>
          <div class="sc-change" :class="getChangeClass(card.delta || 0)">{{ card.change }}</div>
        </div>
      </div>

      <div class="report-layout">
        <div>
          <div class="paper-card chart-card">
            <div class="cc-header">
              <div class="cc-title">💭 Biểu đồ tâm trạng</div>
              <div class="cc-legend">
                <div class="cl-item"><div class="cl-dot" style="background:var(--mint-dark)"></div>Tâm trạng</div>
                <div class="cl-item"><div class="cl-dot" style="background:var(--peach-dark)"></div>Lo âu</div>
                <div class="cl-item"><div class="cl-dot" style="background:var(--lavender)"></div>Stress</div>
              </div>
            </div>
            <div class="chart-wrap">
              <svg class="mood-svg" viewBox="0 0 600 180" width="600" height="180" v-html="moodChartSvg"></svg>
            </div>
            <div style="display:flex;gap:4px;margin-top:8px;">
              <div v-if="!periodData.chartPoints.length" style="font-size:0.72rem;color:var(--text-light);">Chưa có dữ liệu mood.</div>
              <div v-for="(point, idx) in periodData.chartPoints" :key="idx" style="flex:1;text-align:center;font-size:0.62rem;color:var(--text-light);font-weight:600;">{{ point.label || '--' }}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div class="paper-card chart-card" style="margin-bottom:0;">
              <div class="cc-title" style="margin-bottom:10px;">🎯 Radar sức khỏe tổng thể</div>
              <div class="radar-wrap">
                <svg class="radar-svg" viewBox="0 0 220 220" width="220" height="220" v-html="radarChartSvg"></svg>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;justify-content:center;">
                <div v-if="!periodData.radar.length" style="font-size:0.7rem;color:var(--text-light);">Chưa có dữ liệu sức khỏe tổng thể.</div>
                <div v-for="(item, idx) in periodData.radar" :key="idx" style="display:flex;align-items:center;gap:3px;font-size:0.6rem;color:var(--text-secondary);">
                  <div style="width:8px;height:8px;border-radius:50%;" :style="{ background: item.color }"></div>
                  <span>{{ item.label }}: {{ item.value === null ? '--' : item.value }}/10</span>
                </div>
              </div>
            </div>
            <div class="paper-card chart-card" style="margin-bottom:0;">
              <div class="cc-title" style="margin-bottom:12px;">✅ Nhiệm vụ theo loại</div>
              <div class="task-breakdown">
                <div v-for="item in periodData.breakdown" :key="item.key" class="tb-item">
                  <div class="tbi-label">{{ item.label }}</div>
                  <div class="tbi-bar-wrap"><div class="tbi-bar" :style="{ width: Math.max(4, (item.count / taskBreakdownMax) * 100) + '%', background: item.color }"></div></div>
                  <div class="tbi-count">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="paper-card insight-card">
            <div class="ic-header">
              <span class="ic-mascot">🐱</span>
              <div>
                <div class="ic-title">PeaceCat phân tích hành trình của bạn</div>
                <div class="ic-subtitle">Dựa trên dữ liệu tâm trạng, nhiệm vụ và nhật ký</div>
              </div>
            </div>
            <div class="insight-list">
              <div v-for="(insight, idx) in insights" :key="idx" class="insight-item">
                <div class="ii-type" :class="insight.type">{{ insight.type === 'positive' ? '✅ Tích cực' : insight.type === 'warning' ? '⚠️ Lưu ý' : '💡 Gợi ý' }}</div>
                <div class="ii-text">{{ insight.text }}</div>
              </div>
            </div>
          </div>

          <div class="paper-card chart-card">
            <div class="cc-header">
              <div class="cc-title">🗓️ Bản đồ tâm trạng tháng</div>
              <div style="display:flex;gap:4px;align-items:center;">
                <span style="font-size:0.65rem;color:var(--text-light);">Thấp</span>
                <div style="width:10px;height:10px;border-radius:2px;background:var(--coral-light);"></div>
                <div style="width:10px;height:10px;border-radius:2px;background:var(--peach-light);"></div>
                <div style="width:10px;height:10px;border-radius:2px;background:var(--mint-light);"></div>
                <div style="width:10px;height:10px;border-radius:2px;background:var(--mint);"></div>
                <div style="width:10px;height:10px;border-radius:2px;background:var(--mint-dark);"></div>
                <span style="font-size:0.65rem;color:var(--text-light);">Cao</span>
              </div>
            </div>
            <div class="heatmap-grid">
              <div v-for="d in ['CN','T2','T3','T4','T5','T6','T7']" :key="d" class="hm-day-h">{{ d }}</div>
              <div v-for="n in heatmapLeadingBlanks" :key="`b${n}`" class="hm-cell empty"></div>
              <div
                v-for="(day, idx) in periodData.heatmap"
                :key="idx"
                class="hm-cell"
                :class="day.mood === null || day.mood === undefined ? 'empty' : `level-${moodLevel(day.mood)}`"
                :title="day.mood === null || day.mood === undefined ? `${day.date}: Không có dữ liệu` : `${day.date}: mood ${day.mood}/10`"
              ></div>
            </div>
          </div>

          <div class="paper-card chart-card">
            <div class="cc-title" style="margin-bottom:12px;">📋 Lịch sử bài kiểm tra tâm lý</div>
            <div>
              <div v-if="!assessments.length" style="padding:12px 0;color:var(--text-secondary);font-size:0.8rem;">Chưa có kết quả assessment nào được lưu trong DB.</div>
              <div v-for="(item, idx) in assessments" :key="idx" class="assessment-item">
                <div class="ai-icon" :style="{ background: assessmentBg(item.code) }">{{ assessmentIcon(item.code) }}</div>
                <div class="ai-info">
                  <div class="ai-name">{{ item.name || item.code }}</div>
                  <div class="ai-date">📅 {{ new Date(item.created_at).toLocaleDateString('vi-VN') }}</div>
                </div>
                <div class="ai-score">
                  <div class="ai-score-num" :class="severityClass(item.severity)">{{ item.total_score ?? '--' }}</div>
                  <div class="ai-score-label" :class="severityClass(item.severity)">{{ severityLabel(item.severity) }}</div>
                </div>
              </div>
            </div>
            <div style="font-size:0.7rem;color:var(--text-light);margin-top:8px;padding:8px 10px;background:var(--cream);border-radius:var(--radius-sm);line-height:1.5;">
              ⚠️ Đây là công cụ sàng lọc, không phải chẩn đoán y khoa. Nếu điểm số cao, hãy tham khảo ý kiến chuyên gia.
            </div>
          </div>
        </div>

        <div>
          <div class="paper-card export-card">
            <div class="export-icon">📄</div>
            <div class="export-title">Xuất báo cáo</div>
            <div class="export-desc">Chia sẻ với chuyên gia hoặc lưu lại hành trình của bạn</div>
            <div class="export-btns">
              <button class="export-btn eb-pdf" @click="exportPDF">📄 Xuất PDF báo cáo</button>
              <button class="export-btn eb-json" @click="exportJSON">📦 Xuất dữ liệu JSON</button>
              <button class="export-btn eb-share" @click="shareReport">🔗 Chia sẻ với chuyên gia</button>
            </div>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">📌 Tóm tắt kỳ này</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div v-for="(item, idx) in periodSummaryItems" :key="idx" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--radius-sm);">
                <span style="font-size:0.75rem;font-weight:700;">{{ item.icon }} {{ item.label }}</span>
                <span style="font-size:0.75rem;color:var(--mint-dark);font-weight:800;">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">📊 So sánh kỳ trước</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div v-for="(row, idx) in comparisonRows" :key="idx" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--radius-sm);">
                <span style="font-size:0.74rem;color:var(--text-secondary);">{{ row.label }}</span>
                <span style="font-size:0.74rem;font-weight:800;" :style="{ color: row.color }">{{ row.value }}</span>
              </div>
            </div>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">🔗 Hành động tiếp theo</div>
            <router-link to="/mood-checkin" class="quick-link"><span class="ql-icon">💭</span><span class="ql-text">Check-in tâm trạng</span><span class="ql-arrow">›</span></router-link>
            <router-link to="/tasks" class="quick-link"><span class="ql-icon">🎮</span><span class="ql-text">Làm nhiệm vụ hôm nay</span><span class="ql-arrow">›</span></router-link>
            <router-link to="/experts" class="quick-link"><span class="ql-icon">🩺</span><span class="ql-text">Tư vấn chuyên gia</span><span class="ql-arrow">›</span></router-link>
            <router-link to="/mood-assessment" class="quick-link"><span class="ql-icon">📋</span><span class="ql-text">Làm bài kiểm tra</span><span class="ql-arrow">›</span></router-link>
          </div>

          <div class="disclaimer-card">
            ⚠️ <strong>Lưu ý:</strong> Báo cáo này chỉ mang tính tham khảo, không phải chẩn đoán y khoa. Nếu bạn lo ngại về sức khỏe tâm thần, hãy liên hệ chuyên gia hoặc gọi <strong>0931773637</strong>.
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const REPORT_PERIODS = {
  week: { days: 7, bucket: 1, maxOffset: 11, label: '7 ngày gần đây' },
  month: { days: 30, bucket: 5, maxOffset: 2, label: '30 ngày gần đây' },
  '3month': { days: 90, bucket: 15, maxOffset: 0, label: '90 ngày gần đây' }
};

const auth = useAuthStore();

const reportData = ref(null);
const currentPeriod = ref('week');
const currentOffset = ref(0);
const toastVisible = ref(false);
const toastText = ref('');
const toastIcon = ref('📄');
let toastTimer = null;

function showToast(message, icon = '📄') {
  toastText.value = message;
  toastIcon.value = icon;
  toastVisible.value = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 2500);
}

function normalizeReportPayload(payload) {
  const raw = payload?.raw && typeof payload.raw === 'object' ? payload.raw : payload;
  const precomputedReport = payload?.report && typeof payload.report === 'object' ? payload.report : null;
  return { ...(raw && typeof raw === 'object' ? raw : {}), __precomputedReport: precomputedReport };
}

function getPrecomputedPeriodData(periodKey, offset = 0) {
  const precomputed = reportData.value?.__precomputedReport;
  if (!precomputed || offset !== 0) return null;

  const normalizedPrecomputedKey = precomputed.periodKey === '3month' ? '3month' : precomputed.periodKey === 'month' ? 'month' : 'week';
  if (normalizedPrecomputedKey !== periodKey) return null;

  return {
    periodKey,
    label: precomputed.label || REPORT_PERIODS[periodKey]?.label || '',
    dateLabel: precomputed.dateLabel || '',
    startDate: precomputed.startDate ? new Date(precomputed.startDate) : null,
    endDate: precomputed.endDate ? new Date(precomputed.endDate) : null,
    currentMood: Array.isArray(precomputed.currentMood) ? precomputed.currentMood : [],
    currentJournals: Array.isArray(precomputed.currentJournals) ? precomputed.currentJournals : [],
    currentTasks: Array.isArray(precomputed.currentTasks) ? precomputed.currentTasks : [],
    chartPoints: Array.isArray(precomputed.chartPoints) ? precomputed.chartPoints : [],
    heatmap: Array.isArray(precomputed.heatmap) ? precomputed.heatmap : [],
    metrics: precomputed.metrics || {},
    breakdown: Array.isArray(precomputed.breakdown) ? precomputed.breakdown : [],
    radar: Array.isArray(precomputed.radar) ? precomputed.radar : [],
    riskLevel: precomputed.riskLevel || reportData.value?.summary?.risk_level || 'low'
  };
}

function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date, days) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function toIsoDate(value) {
  if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}
function average(values) {
  const numbers = values.filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v))).map(Number);
  if (!numbers.length) return null;
  return Math.round((numbers.reduce((sum, v) => sum + v, 0) / numbers.length) * 10) / 10;
}
function sum(values) { return values.reduce((total, v) => total + Number(v || 0), 0); }
function formatCompactDate(value) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Bangkok' }).format(value);
}
function formatPeriodLabel(startDate, endDate) { return `${formatCompactDate(startDate)} – ${formatCompactDate(endDate)}`; }
function formatChartLabel(date, totalDays) {
  const target = new Date(date);
  if (totalDays <= 7) {
    const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return weekdayLabels[target.getDay()];
  }
  return formatCompactDate(target);
}
function formatRangeLabel(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const startLabel = formatCompactDate(start);
  const endLabel = formatCompactDate(end);
  return startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`;
}

function buildDaySeries(days, offset) {
  const endDate = addDays(startOfDay(new Date()), -(offset * days));
  const startDate = addDays(endDate, -(days - 1));
  const previousEnd = addDays(startDate, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return { startDate, endDate, previousStart, previousEnd };
}
function dateWithin(dateValue, startDate, endDate) {
  const value = startOfDay(new Date(dateValue)).getTime();
  return value >= startDate.getTime() && value <= endDate.getTime();
}

function getPeriodData(periodKey, offset = 0) {
  const precomputed = getPrecomputedPeriodData(periodKey, offset);
  if (precomputed) return precomputed;

  const config = REPORT_PERIODS[periodKey];
  const { startDate, endDate, previousStart, previousEnd } = buildDaySeries(config.days, offset);
  const moodHistory = reportData.value?.mood_history || [];
  const journalHistory = reportData.value?.journal_history || [];
  const taskHistory = reportData.value?.task_history || [];

  const currentMood = moodHistory.filter((e) => dateWithin(e.day, startDate, endDate));
  const previousMood = moodHistory.filter((e) => dateWithin(e.day, previousStart, previousEnd));
  const currentJournals = journalHistory.filter((e) => dateWithin(e.created_at, startDate, endDate));
  const previousJournals = journalHistory.filter((e) => dateWithin(e.created_at, previousStart, previousEnd));
  const currentTasks = taskHistory.filter((e) => dateWithin(e.created_at, startDate, endDate));
  const previousTasks = taskHistory.filter((e) => dateWithin(e.created_at, previousStart, previousEnd));

  const currentMoodAverage = average(currentMood.map((e) => e.mood_score));
  const previousMoodAverage = average(previousMood.map((e) => e.mood_score));
  const currentAnxietyAverage = average(currentMood.map((e) => e.anxiety_score));
  const previousAnxietyAverage = average(previousMood.map((e) => e.anxiety_score));
  const currentStressAverage = average(currentMood.map((e) => e.stress_score));
  const currentEnergyAverage = average(currentMood.map((e) => e.energy_score));
  const currentSleepAverage = average(currentMood.map((e) => e.sleep_quality_score));
  const journalWords = sum(currentJournals.map((e) => String(e.content || '').trim().split(/\s+/).filter(Boolean).length));
  const previousJournalWords = sum(previousJournals.map((e) => String(e.content || '').trim().split(/\s+/).filter(Boolean).length));
  const xpEarned = sum(currentTasks.map((e) => e.xp_earned)) + (currentJournals.length * 15);
  const previousXpEarned = sum(previousTasks.map((e) => e.xp_earned)) + (previousJournals.length * 15);
  const practiceMinutes = sum(currentTasks.map((e) => e.duration_actual || e.duration_minutes || 0));
  const previousPracticeMinutes = sum(previousTasks.map((e) => e.duration_actual || e.duration_minutes || 0));

  const moodMap = new Map(currentMood.map((e) => [toIsoDate(e.day), e]));
  const points = [];
  for (let index = 0; index < config.days; index += 1) {
    const date = addDays(startDate, index);
    const key = toIsoDate(date);
    const row = moodMap.get(key);
    points.push({
      date: key, label: formatChartLabel(date, config.days),
      mood: row?.mood_score ?? null, anxiety: row?.anxiety_score ?? null, stress: row?.stress_score ?? null
    });
  }

  const chartPoints = [];
  for (let index = 0; index < points.length; index += config.bucket) {
    const bucket = points.slice(index, index + config.bucket);
    chartPoints.push({
      date: bucket[bucket.length - 1]?.date || bucket[0]?.date,
      label: config.bucket === 1 ? bucket[0]?.label : formatRangeLabel(bucket[0]?.date, bucket[bucket.length - 1]?.date),
      mood: average(bucket.map((p) => p.mood)),
      anxiety: average(bucket.map((p) => p.anxiety)),
      stress: average(bucket.map((p) => p.stress))
    });
  }

  const breakdownBase = { emergency: 0, easy: 0, medium: 0, hard: 0 };
  currentTasks.forEach((task) => {
    if (task.category === 'emergency') { breakdownBase.emergency += 1; return; }
    if (task.difficulty === 'medium') breakdownBase.medium += 1;
    else if (task.difficulty === 'hard') breakdownBase.hard += 1;
    else breakdownBase.easy += 1;
  });

  const positiveDays = currentMood.filter((e) => Number(e.mood_score || 0) >= 7).length;
  const riskLevel = reportData.value?.summary?.risk_level || 'low';
  const consistencyScore = Math.min(10, Math.round(((currentTasks.length / Math.max(1, config.days)) * 10) * 10) / 10);
  const radar = [
    { label: 'Cảm xúc', value: currentMoodAverage, color: '#7BBF95' },
    { label: 'Bình tĩnh', value: currentStressAverage === null ? null : Math.max(0, 10 - currentStressAverage), color: '#FF8B8B' },
    { label: 'Độ an tâm', value: currentAnxietyAverage === null ? null : Math.max(0, 10 - currentAnxietyAverage), color: '#D4A574' },
    { label: 'Năng lượng', value: currentEnergyAverage, color: '#A8D8EA' },
    { label: 'Giấc ngủ', value: currentSleepAverage, color: '#C3AED6' },
    { label: 'Nhịp độ', value: consistencyScore, color: '#FFCBA4' }
  ];

  return {
    periodKey, label: config.label, dateLabel: formatPeriodLabel(startDate, endDate), startDate, endDate,
    currentMood, currentJournals, currentTasks, chartPoints, heatmap: points,
    metrics: {
      averageMood: currentMoodAverage, previousAverageMood: previousMoodAverage,
      averageAnxiety: currentAnxietyAverage, previousAverageAnxiety: previousAnxietyAverage,
      averageStress: currentStressAverage,
      completedTasks: currentTasks.length, previousCompletedTasks: previousTasks.length,
      journalEntries: currentJournals.length, previousJournalEntries: previousJournals.length,
      journalWords, previousJournalWords, xpEarned, previousXpEarned, positiveDays,
      practiceMinutes, previousPracticeMinutes,
      streak: reportData.value?.progress?.current_streak ?? reportData.value?.progress?.streak ?? 0
    },
    breakdown: [
      { key: 'emergency', label: '🔴 Khẩn cấp', count: breakdownBase.emergency, color: 'var(--coral)' },
      { key: 'easy', label: '🟢 Dễ', count: breakdownBase.easy, color: 'var(--mint-dark)' },
      { key: 'medium', label: '🟡 Trung bình', count: breakdownBase.medium, color: 'var(--peach-dark)' },
      { key: 'hard', label: '🟠 Nâng cao', count: breakdownBase.hard, color: 'var(--lavender)' }
    ],
    radar, riskLevel
  };
}

const periodData = computed(() => getPeriodData(currentPeriod.value, currentOffset.value));

function formatDelta(current, previous, suffix = '') {
  if (current === null || current === undefined) return 'Chưa đủ dữ liệu';
  if (previous === null || previous === undefined) return 'Chưa có kỳ trước để so sánh';
  const delta = Math.round((Number(current) - Number(previous)) * 10) / 10;
  if (delta === 0) return `Không đổi${suffix}`;
  return `${delta > 0 ? '+' : ''}${delta}${suffix}`;
}
function getChangeClass(delta) {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'neutral';
}

const summaryCards = computed(() => {
  const { metrics } = periodData.value;
  return [
    {
      icon: '😊', deco: '🌿', label: 'Tâm trạng TB', value: metrics.averageMood === null ? '--' : metrics.averageMood,
      delta: metrics.averageMood === null || metrics.previousAverageMood === null ? null : (metrics.averageMood - metrics.previousAverageMood),
      change: formatDelta(metrics.averageMood, metrics.previousAverageMood, ' so với kỳ trước'), color: 'var(--mint-dark)'
    },
    {
      icon: '✅', deco: '🎮', label: 'Nhiệm vụ hoàn thành', value: metrics.completedTasks,
      delta: metrics.completedTasks - metrics.previousCompletedTasks,
      change: formatDelta(metrics.completedTasks, metrics.previousCompletedTasks, ' task'), color: 'var(--mint-dark)'
    },
    {
      icon: '📝', deco: '📚', label: 'Bài nhật ký', value: metrics.journalEntries,
      delta: metrics.journalEntries - metrics.previousJournalEntries,
      change: formatDelta(metrics.journalEntries, metrics.previousJournalEntries, ' bài'), color: 'var(--lavender)'
    },
    {
      icon: '⭐', deco: '🏆', label: 'XP trong kỳ', value: metrics.xpEarned,
      delta: metrics.xpEarned - metrics.previousXpEarned,
      change: formatDelta(metrics.xpEarned, metrics.previousXpEarned, ' XP'), color: 'var(--gold)'
    }
  ];
});

function buildLinePath(series, width, height, padLeft, padRight, padTop, padBottom, key) {
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const step = series.length > 1 ? chartWidth / (series.length - 1) : chartWidth;
  const plotted = series.map((point, index) => {
    const value = point[key] === null || point[key] === undefined ? null : Number(point[key]);
    const x = padLeft + (step * index);
    const y = value === null ? null : padTop + chartHeight - ((value / 10) * chartHeight);
    return { x, y, value, label: point.label };
  });
  const filled = plotted.map((point, index) => {
    if (point.y !== null) return point;
    const prev = [...plotted].slice(0, index).reverse().find((item) => item.y !== null);
    const next = plotted.slice(index + 1).find((item) => item.y !== null);
    return { ...point, y: prev?.y ?? next?.y ?? (padTop + chartHeight) };
  });
  return { plotted, filled, path: filled.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ') };
}

const moodChartSvg = computed(() => {
  const series = periodData.value.chartPoints;
  const width = 600, height = 180, padLeft = 30, padRight = 10, padTop = 15, padBottom = 20;
  if (!series.length) {
    return `<text x="300" y="90" font-size="13" fill="#A89585" text-anchor="middle" font-family="Nunito">Chua co du lieu tam trang de ve bieu do</text>`;
  }

  const moodSeries = buildLinePath(series, width, height, padLeft, padRight, padTop, padBottom, 'mood');
  const anxietySeries = buildLinePath(series, width, height, padLeft, padRight, padTop, padBottom, 'anxiety');
  const stressSeries = buildLinePath(series, width, height, padLeft, padRight, padTop, padBottom, 'stress');
  const chartHeight = height - padTop - padBottom;
  const lastValidMood = moodSeries.plotted.filter((p) => p.value !== null).slice(-1)[0];
  let gridLines = '';
  for (let index = 0; index <= 5; index += 1) {
    const y = padTop + (chartHeight / 5) * index;
    gridLines += `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4"></line>`;
    gridLines += `<text x="${padLeft - 4}" y="${y + 4}" font-size="9" fill="#A89585" text-anchor="end">${10 - (index * 2)}</text>`;
  }
  const areaPoints = `${moodSeries.filled.map((p) => `${p.x},${p.y}`).join(' ')} ${width - padRight},${padTop + chartHeight} ${padLeft},${padTop + chartHeight}`;

  return `
    <defs>
      <linearGradient id="reportMoodGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7BBF95" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="#7BBF95" stop-opacity="0.03"></stop>
      </linearGradient>
    </defs>
    ${gridLines}
    <polygon points="${areaPoints}" fill="url(#reportMoodGradient)"></polygon>
    <path d="${moodSeries.path}" fill="none" stroke="#7BBF95" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></path>
    <path d="${anxietySeries.path}" fill="none" stroke="#E8A876" stroke-width="1.5" stroke-dasharray="5,3" stroke-linejoin="round" stroke-linecap="round"></path>
    <path d="${stressSeries.path}" fill="none" stroke="#C3AED6" stroke-width="1.5" stroke-dasharray="3,3" stroke-linejoin="round" stroke-linecap="round"></path>
    ${moodSeries.plotted.map((p) => p.value === null ? '' : `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#7BBF95" stroke="white" stroke-width="1.5"></circle>`).join('')}
    ${lastValidMood ? `<circle cx="${lastValidMood.x}" cy="${lastValidMood.y}" r="4.5" fill="#FFCBA4" stroke="#E8A876" stroke-width="1.5"></circle>` : ''}
  `;
});

const radarChartSvg = computed(() => {
  const radarSource = periodData.value.radar;
  const data = radarSource.map((item) => ({ ...item, percent: item.value === null || item.value === undefined ? 20 : Math.max(10, Math.min(100, Number(item.value) * 10)) }));
  if (!data.length) {
    return `<text x="110" y="110" font-size="12" fill="#A89585" text-anchor="middle" font-family="Nunito">Chua co du lieu radar</text>`;
  }

  const cx = 110, cy = 110, r = 80, n = data.length;
  function polar(angle, radius) {
    const a = (angle - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  let grid = '';
  for (let level = 1; level <= 5; level += 1) {
    const points = Array.from({ length: n }, (_, index) => { const p = polar(index * (360 / n), r * (level / 5)); return `${p.x},${p.y}`; }).join(' ');
    grid += `<polygon points="${points}" fill="none" stroke="#E8CBA7" stroke-width="${level === 5 ? 1.5 : 0.8}"></polygon>`;
  }
  const axes = data.map((_, index) => { const p = polar(index * (360 / n), r); return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#E8CBA7" stroke-width="1"></line>`; }).join('');
  const polygonPoints = data.map((item, index) => { const p = polar(index * (360 / n), r * (item.percent / 100)); return `${p.x},${p.y}`; }).join(' ');
  const labelsSvg = data.map((item, index) => { const p = polar(index * (360 / n), r + 20); return `<text x="${p.x}" y="${p.y}" font-size="9" fill="#7A6555" text-anchor="middle" dominant-baseline="middle" font-family="Nunito" font-weight="700">${item.label}</text>`; }).join('');

  return `
    ${grid}
    ${axes}
    <polygon points="${polygonPoints}" fill="rgba(168,213,186,0.25)" stroke="#7BBF95" stroke-width="2"></polygon>
    ${labelsSvg}
    ${data.map((item, index) => { const p = polar(index * (360 / n), r * (item.percent / 100)); return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${item.color}" stroke="white" stroke-width="1.5"></circle>`; }).join('')}
  `;
});

const taskBreakdownMax = computed(() => Math.max(1, ...periodData.value.breakdown.map((item) => item.count)));

function buildInsights(pd) {
  const insights = [];
  const { metrics, riskLevel } = pd;
  const moodDelta = metrics.averageMood === null || metrics.previousAverageMood === null ? null : Math.round((metrics.averageMood - metrics.previousAverageMood) * 10) / 10;
  const anxietyDelta = metrics.averageAnxiety === null || metrics.previousAverageAnxiety === null ? null : Math.round((metrics.averageAnxiety - metrics.previousAverageAnxiety) * 10) / 10;
  const topTask = [...pd.currentTasks].sort((a, b) => (b.xp_earned || 0) - (a.xp_earned || 0))[0];
  const positiveJournalRate = pd.currentJournals.length
    ? Math.round((pd.currentJournals.filter((e) => Number(e.sentiment_score || 0) > 0.5).length / pd.currentJournals.length) * 100)
    : 0;

  if (moodDelta !== null) {
    insights.push({
      type: moodDelta >= 0 ? 'positive' : 'warning',
      text: moodDelta >= 0 ? `Tâm trạng trung bình đang nhích lên ${moodDelta} điểm so với kỳ trước.` : `Tâm trạng trung bình đang giảm ${Math.abs(moodDelta)} điểm so với kỳ trước.`
    });
  }
  insights.push({
    type: ['high', 'critical'].includes(riskLevel) ? 'warning' : 'tip',
    text: ['high', 'critical'].includes(riskLevel)
      ? 'Chỉ số rủi ro hiện đang cao. Nên ưu tiên các task ngắn, điều hòa nhịp thở và cân nhắc kết nối chuyên gia.'
      : 'Mức rủi ro hiện tại đang trong vùng có thể theo dõi. Duy trì check-in và nhiệm vụ đều đặn sẽ giúp dữ liệu ổn định hơn.'
  });
  if (anxietyDelta !== null) {
    insights.push({
      type: anxietyDelta <= 0 ? 'positive' : 'warning',
      text: anxietyDelta <= 0 ? `Lo âu trung bình đã giảm ${Math.abs(anxietyDelta)} điểm trong kỳ này.` : `Lo âu trung bình tăng ${anxietyDelta} điểm trong kỳ này, nên chú ý các ngày giữa tuần hoặc sau các đợt áp lực.`
    });
  }
  if (topTask?.title) {
    insights.push({ type: 'tip', text: `Nhiệm vụ mang lại nhịp hoạt động rõ nhất trong kỳ này là "${topTask.title}". Bạn có thể dùng nó như anchor khi tâm trạng xuống.` });
  }
  if (pd.currentJournals.length) {
    insights.push({ type: positiveJournalRate >= 50 ? 'positive' : 'tip', text: `Khoảng ${positiveJournalRate}% bài journal trong kỳ mang sắc thái tích cực. Việc viết đều đang giúp bạn quan sát cảm xúc rõ hơn.` });
  }
  return insights.slice(0, 5);
}
const insights = computed(() => buildInsights(periodData.value));

function moodLevel(value) {
  if (value === null || value === undefined) return 0;
  if (value >= 8) return 5;
  if (value >= 6) return 4;
  if (value >= 4.5) return 3;
  if (value >= 3) return 2;
  return 1;
}
const heatmapLeadingBlanks = computed(() => {
  const hm = periodData.value.heatmap;
  return hm.length ? new Date(`${hm[0].date}T00:00:00`).getDay() : 0;
});

function severityLabel(value) {
  if (!value) return 'Chưa phân loại';
  const map = { minimal: 'Rất thấp', mild: 'Nhẹ', moderate: 'Trung bình', moderately_severe: 'Khá cao', severe: 'Cao', good: 'Tốt' };
  return map[String(value).toLowerCase()] || value;
}
function severityClass(value) {
  const lowered = String(value || '').toLowerCase();
  if (['severe', 'moderately_severe', 'high'].includes(lowered)) return 'score-high';
  if (['moderate', 'medium'].includes(lowered)) return 'score-mid';
  return 'score-low';
}
function assessmentIcon(code) {
  const n = String(code || '').toLowerCase();
  if (n.includes('gad')) return '😰';
  if (n.includes('phq')) return '🌧️';
  if (n.includes('dass')) return '📊';
  if (n.includes('psqi')) return '😴';
  return '🧠';
}
function assessmentBg(code) {
  const n = String(code || '').toLowerCase();
  if (n.includes('gad')) return 'var(--peach-light)';
  if (n.includes('phq')) return 'var(--sky-light)';
  if (n.includes('dass')) return 'var(--lavender-light)';
  if (n.includes('psqi')) return 'var(--mint-light)';
  return 'var(--rose-light)';
}
const assessments = computed(() => reportData.value?.assessments || []);

const periodSummaryItems = computed(() => {
  const { metrics, periodKey } = periodData.value;
  return [
    { icon: '😊', label: 'Ngày tâm trạng tốt', value: `${metrics.positiveDays}/${REPORT_PERIODS[periodKey].days}` },
    { icon: '✅', label: 'Nhiệm vụ hoàn thành', value: metrics.completedTasks },
    { icon: '📝', label: 'Bài nhật ký', value: metrics.journalEntries },
    { icon: '🧘', label: 'Phút thực hành', value: `${metrics.practiceMinutes} phút` }
  ];
});

const comparisonRows = computed(() => {
  const { metrics } = periodData.value;
  return [
    { label: 'Tâm trạng', value: formatDelta(metrics.averageMood, metrics.previousAverageMood), color: (metrics.averageMood ?? 0) >= (metrics.previousAverageMood ?? 0) ? 'var(--mint-dark)' : 'var(--coral)' },
    { label: 'Lo âu', value: formatDelta(metrics.averageAnxiety, metrics.previousAverageAnxiety), color: (metrics.averageAnxiety ?? 0) <= (metrics.previousAverageAnxiety ?? 0) ? 'var(--mint-dark)' : 'var(--coral)' },
    { label: 'Nhiệm vụ', value: formatDelta(metrics.completedTasks, metrics.previousCompletedTasks), color: metrics.completedTasks >= metrics.previousCompletedTasks ? 'var(--mint-dark)' : 'var(--coral)' },
    { label: 'XP', value: formatDelta(metrics.xpEarned, metrics.previousXpEarned), color: metrics.xpEarned >= metrics.previousXpEarned ? 'var(--gold)' : 'var(--text-light)' }
  ];
});

const periodLabelText = computed(() => {
  const pd = periodData.value;
  return currentOffset.value === 0 ? pd.dateLabel : `${pd.dateLabel} (${currentOffset.value} kỳ trước)`;
});

const subtitleText = ref('Nhìn lại hành trình — hiểu bản thân sâu hơn mỗi ngày 🌱');

function switchPeriod(period) {
  currentPeriod.value = period;
  currentOffset.value = 0;
}
function navPeriod(direction) {
  const maxOffset = REPORT_PERIODS[currentPeriod.value]?.maxOffset ?? 0;
  const nextOffset = currentOffset.value + (direction > 0 ? -1 : 1);
  if (nextOffset < 0) { showToast('Bạn đang ở kỳ mới nhất'); return; }
  if (nextOffset > maxOffset) { showToast('Không còn dữ liệu xa hơn trong khoảng 90 ngày'); return; }
  currentOffset.value = nextOffset;
}

function exportPDF() {
  showToast('Đang chuẩn bị xuất PDF...');
  setTimeout(() => window.print(), 300);
}
function exportJSON() {
  const payload = {
    generated_at: new Date().toISOString(),
    period: currentPeriod.value,
    offset: currentOffset.value,
    report: periodData.value,
    raw: reportData.value
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `peaceflow-report-${currentPeriod.value}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất JSON');
}
async function shareReport() {
  const pd = periodData.value;
  const summaryText = `Mood TB ${pd.metrics.averageMood ?? '--'}/10, ${pd.metrics.completedTasks} nhiệm vụ, ${pd.metrics.journalEntries} bài journal`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'PeaceFlow Report', text: `${pd.dateLabel}: ${summaryText}` });
      showToast('Đã mở chia sẻ báo cáo');
      return;
    } catch (error) {
      console.error('Share cancelled or failed:', error);
    }
  }
  showToast('Báo cáo đã sẵn sàng để chia sẻ với chuyên gia');
}

onMounted(async () => {
  try {
    await auth.waitForAuth();
    const payload = await apiClient.get('/reports/detail');
    reportData.value = normalizeReportPayload(payload);
  } catch (error) {
    console.error('Failed to load report detail:', error);
    showToast('Không tải được báo cáo từ API');
  }
});
</script>

<style scoped src="../assets/report.css"></style>
