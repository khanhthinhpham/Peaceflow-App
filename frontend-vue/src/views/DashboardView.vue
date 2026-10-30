<template>
  <main class="main-content dash">
    <div class="dash-inner">
      <div class="dash-grid">
        <!-- ======================= CỘT TRÁI ======================= -->
        <div class="col-left">
          <!-- 1. Check-in -->
          <section class="card checkin-card">
            <div class="ci-body">
              <div class="ci-titles">
                <div class="ci-hello-row">
                  <p class="ci-hello">{{ t('dashboard.hero.hello', { name: displayName }) }}</p>
                  <span v-if="isExpert" class="role-tag">{{ t('sidebar.tagExpert') }}</span>
                  <span v-if="isAdmin" class="role-tag">{{ t('sidebar.tagAdmin') }}</span>
                </div>
                <h1 class="ci-title">{{ checkinPromptTitle }}</h1>
              </div>

              <div class="mood-picker">
                <router-link
                  v-for="(mood, idx) in moodButtons"
                  :key="mood.id"
                  to="/mood-checkin"
                  class="mood-btn"
                  :class="{ 'is-active': idx === CHECKIN_CENTER_INDEX }"
                >
                  <span class="mood-icon-wrap">
                    <span class="mood-icon" aria-hidden="true" :style="{ animationDelay: (idx * 1) + 's' }">{{ mood.emoji }}</span>
                    <span v-if="idx === CHECKIN_CENTER_INDEX" class="mood-check" aria-hidden="true"><span class="material-symbols-outlined">check</span></span>
                  </span>
                  <span class="mood-label">{{ mood.label }}</span>
                </router-link>
              </div>

              <p class="ci-foot">{{ t('dashboard.hero.footnote') }}</p>

              <div v-if="isNewUser" class="new-user-links">
                <router-link to="/tasks" class="btn pf-btn-secondary">{{ t('dashboard.newUser.tasksCta') }}</router-link>
                <router-link to="/journal" class="btn pf-btn-secondary">{{ t('dashboard.newUser.journalCta') }}</router-link>
              </div>
            </div>
          </section>

          <!-- 2. Bốn chỉ số -->
          <div class="kpi-grid">
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.moodLabel') }}</span>
              <div class="kpi-value"><b>{{ stats.mood }}</b><small>/10</small></div>
              <p class="kpi-foot">{{ stats.moodTrend }}</p>
            </div>
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.streakLabel') }}</span>
              <div class="kpi-value"><b>{{ stats.streak }}</b><small>{{ t('dashboard.stats.streakUnit') }}</small></div>
              <p class="kpi-foot">{{ stats.streakTrend }}</p>
            </div>
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.tasksLabel') }}</span>
              <div class="kpi-value"><b>{{ stats.tasks }}</b><small v-if="weeklyGoal">/{{ weeklyGoal }}</small></div>
              <p class="kpi-foot">{{ stats.tasksTrend }}</p>
            </div>
            <div class="card kpi">
              <span class="kpi-label">{{ t('dashboard.stats.anxietyLabel') }}</span>
              <div class="kpi-value"><b :class="{ 'is-empty': stats.anxiety === '--' }">{{ stats.anxiety }}</b></div>
              <p class="kpi-foot">{{ stats.anxietyTrend }}</p>
            </div>
          </div>

          <!-- 3. Trợ lý PeaceCat -->
          <section class="stack-16">
            <div class="ai-head">
              <div class="ai-head-left">
                <span class="ai-caption">{{ t('dashboard.insight.assistant') }}</span>
                <span class="ai-title pf-section-title">{{ insightTitle }}</span>
              </div>
              <button class="btn pf-btn-tertiary" :disabled="insightMode === 'loading'" @click="requestAiInsight">
                <span class="material-symbols-outlined" :class="{ spinning: insightMode === 'loading' }" aria-hidden="true">refresh</span>
                <span>{{ insightMode === 'loading' ? t('dashboard.insight.btnAnalyzing') : (aiRecommendation ? t('dashboard.insight.btnUpdate') : t('dashboard.insight.btnGet')) }}</span>
              </button>
            </div>
            <div class="card card-pad">
              <div class="ai-quote">
                <div class="ai-text" :class="{ loading: insightMode === 'loading' }" v-html="insightBodyHtml"></div>
                <p v-if="insightTags.length" class="ai-basis">
                  {{ t('dashboard.insight.basis') }} {{ insightTags.map((tag) => tag.text).join(' & ') }}
                </p>
              </div>
              <p v-if="insightNote" class="ai-note">{{ insightNote }}</p>

              <!-- Nhiệm vụ hôm nay: một chỗ duy nhất (gộp bài AI gợi ý + nhiệm vụ đề xuất), thẻ có ảnh, 2 thẻ/hàng -->
              <div class="task-section">
                <div class="task-section-head">
                  <h3 class="side-title pf-section-title">{{ t('dashboard.tasks.title') }}</h3>
                  <router-link to="/tasks" class="link-sm">{{ t('dashboard.tasks.viewAll') }}</router-link>
                </div>
                <div v-if="suggestionList.length" class="task-grid">
                  <router-link
                    v-for="item in suggestionList"
                    :key="item.id || item.title"
                    class="td-card"
                    :to="item.id ? { path: '/task-detail', query: { id: item.id } } : '/tasks'"
                  >
                    <div class="task-thumb">
                      <img
                        v-if="taskCardSrc(item) && !brokenThumbs.has(item.id)"
                        :src="taskCardSrc(item)"
                        :alt="item.title"
                        loading="lazy"
                        @error="brokenThumbs.add(item.id)"
                      >
                      <span v-if="taskBadge(item).cls === 'tb-priority'" class="task-badge">{{ taskBadge(item).text }}</span>
                    </div>
                    <div class="td-card-body">
                      <h4 class="task-name">{{ item.title }}</h4>
                      <p v-if="item.reason" class="task-reason">{{ item.reason }}</p>
                      <div class="td-card-foot">
                        <span class="task-time">{{ item.duration_minutes || 0 }} {{ t('dashboard.tasks.minutesUnit') }} · {{ taskBadge(item).text }}</span>
                        <span class="task-xp">+{{ item.xp_reward || 0 }} XP</span>
                      </div>
                    </div>
                  </router-link>
                </div>
                <p v-else class="empty-text">{{ t('dashboard.tasks.empty') }}</p>
              </div>
            </div>
          </section>

          <!-- 4. Xu hướng tâm trạng -->
          <section class="stack-16">
            <div class="sec-head">
              <div>
                <span class="eyebrow">{{ t('dashboard.chart.eyebrow') }}</span>
                <h3 class="sec-title pf-section-title">{{ t('dashboard.chart.heading') }}</h3>
              </div>
              <div class="seg">
                <button
                  v-for="tab in CHART_TABS"
                  :key="tab.period"
                  class="seg-btn"
                  :class="{ 'is-active': chartPeriod === tab.period }"
                  @click="switchChart(tab.period)"
                >{{ t(tab.labelKey) }}</button>
              </div>
            </div>
            <div class="card card-pad">
              <div class="trend-wrap">
                <div class="mood-chart-area" v-html="chartSvgHtml"></div>
                <div class="chart-labels" :style="{ gridTemplateColumns: `repeat(${Math.max(chartLabels.length, 1)}, minmax(0, 1fr))` }">
                  <span v-if="!chartLabels.length">{{ t('dashboard.chart.noData') }}</span>
                  <span
                    v-for="(label, idx) in chartLabels"
                    :key="idx"
                    :class="{ 'is-current': idx === chartLabels.length - 1 }"
                  >{{ label }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 5. Radar sức khỏe tổng thể -->
          <section class="stack-16">
            <div class="sec-head">
              <div>
                <span class="eyebrow">{{ t('dashboard.wellness.eyebrow') }}</span>
                <h3 class="sec-title pf-section-title">{{ t('dashboard.wellness.title') }}</h3>
              </div>
              <a v-if="radarMetrics.length" href="#" class="link-arrow" @click.prevent>
                <span>{{ t('dashboard.wellness.viewDetailPlain') }}</span>
              </a>
            </div>
            <div class="card card-pad">
              <div v-if="radarMetrics.length" class="radar-grid">
                <div class="radar-svg-wrap" v-html="radarSvgHtml"></div>
                <div class="radar-badges">
                  <div v-for="metric in radarMetrics" :key="metric.key" class="radar-badge">
                    <span class="rb-label">{{ metric.label }}</span>
                    <span class="rb-value" :class="{ 'is-empty': metric.value === null || metric.value === undefined }">
                      {{ metric.value === null || metric.value === undefined ? '--' : `${metric.value} / 10` }}
                    </span>
                  </div>
                </div>
              </div>
              <p v-else class="empty-text">{{ t('dashboard.wellness.notEnough') }}</p>
            </div>
          </section>
        </div>

        <!-- ======================= CỘT PHẢI ======================= -->
        <div class="col-right-stack">
          <!-- Hỗ trợ ưu tiên: card đỏ riêng, tách khỏi panel bên dưới -->
          <div v-if="showEmergencyBanner" class="card safety-card">
            <span class="sb-badge">{{ t('dashboard.emergencyBanner.badge') }}</span>
            <p class="sb-desc">
              {{ t('dashboard.emergencyBanner.desc') }}
              <span v-if="emergencyReasonText" class="sb-reason">{{ t('dashboard.emergencyBanner.reasonPrefix') }} {{ emergencyReasonText }}</span>
            </p>
            <router-link to="/emergency" class="btn pf-btn-danger pf-btn-block">{{ t('dashboard.emergencyBanner.openBtn') }}</router-link>
          </div>

          <aside class="col-right">
          <!-- Level + chuỗi thói quen -->
          <div class="side-sec stack-16">
            <div class="level-row">
              <div class="level-title">{{ t('dashboard.levels.levelTitle', { level: xpInfo.currentLevel, title: xpInfo.title }) }}</div>
              <span class="level-sub">{{ t('dashboard.levels.xpEarned', { xp: xpInfo.xp }) }}</span>
            </div>

            <div class="xp-block">
              <div class="xp-track"><div class="xp-meter" :style="{ width: xpInfo.percent + '%' }"></div></div>
              <div class="xp-labels">
                <span>{{ xpInfo.minXP }} XP</span>
                <span>{{ xpInfo.maxXPLabel }} XP</span>
              </div>
            </div>

            <div class="ribbon-block">
              <div class="ribbon-head">
                <span class="ribbon-title">{{ t('dashboard.streak.ribbonTitle') }}</span>
                <span class="ribbon-count">{{ t('dashboard.streak.daysInRow', { n: stats.streak }) }}</span>
              </div>
              <div class="ribbon">
                <div v-for="(day, idx) in streakRibbon" :key="idx" class="rb-day">
                  <span class="rb-day-label" :class="{ 'is-today': day.state.startsWith('today') }">{{ day.label }}</span>
                  <div class="rb-day-dot" :class="`st-${day.state}`">
                    <span v-if="day.state === 'done' || day.state === 'today-done'" class="material-symbols-outlined">check</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Khu vườn tâm hồn -->
          <div class="side-sec stack-14 garden-sec">
            <div class="side-head">
              <div>
                <span class="eyebrow">{{ t('dashboard.garden.eyebrow') }}</span>
                <h3 class="side-title">{{ t('dashboard.garden.title') }}</h3>
              </div>
              <span v-if="gardenMetrics.length" class="risk-badge" :class="`risk-${riskBadgeClass}`">{{ riskLabel }}</span>
            </div>
            <template v-if="gardenMetrics.length">
              <div class="garden-scene">
                <div class="garden-sky">
                  <div class="g-sun"></div>
                  <div class="g-cloud g-cloud-1"></div>
                  <div class="g-cloud g-cloud-2"></div>
                </div>
                <div v-html="gardenTreesHtml"></div>
              </div>
              <div class="garden-grid">
                <div v-for="metric in gardenMetrics" :key="metric.key" class="garden-chip">
                  <span class="dot" :class="gardenDotClass(metric.status)"></span>
                  <span>{{ metric.label }}: <strong>{{ metric.status_text }}</strong></span>
                </div>
              </div>
            </template>
            <p v-else class="empty-text">{{ t('dashboard.garden.notEnough') }}</p>
          </div>

          <!-- Mục tiêu tuần, phiên tư vấn, ủng hộ -->
          <div class="side-sec stack-16 side-muted">
            <div class="stack-8">
              <div class="side-head">
                <span class="side-title-sm">{{ challenge?.title || t('dashboard.challenge.title') }}</span>
                <span v-if="challenge" class="side-meta">{{ t('dashboard.challenge.daysLeft', { n: challenge.days_left }) }}</span>
              </div>
              <div class="mini-card row-between">
                <template v-if="challenge">
                  <div class="grow">
                    <span class="mini-strong">{{ challenge.completed }}/{{ challenge.goal }} {{ t('dashboard.challenge.tasksMeta') }}</span>
                    <span class="mini-sub">{{ challenge.description }}</span>
                    <div class="challenge-track"><div class="challenge-fill" :style="{ width: challenge.progress_percent + '%' }"></div></div>
                  </div>
                </template>
                <span v-else class="mini-sub">{{ t('dashboard.challenge.empty') }}</span>
                
              </div>
            </div>

            <div class="stack-8 divided">
              <div class="side-head">
                <span class="side-title-sm">{{ t('dashboard.expert.title') }}</span>
                <span v-if="expertSession" class="status-pill" :style="{ color: expertStatus.color, background: expertStatus.bg }">{{ expertStatus.label }}</span>
              </div>
              <div class="mini-card stack-8">
                <template v-if="expertSession">
                  <span class="mini-strong">{{ expertSession.expert_name }}</span>
                  <span class="mini-sub">{{ expertTypeLabel }} · {{ expertTimeLabel }}</span>
                  <router-link to="/experts" class="btn pf-btn-secondary pf-btn-block">{{ t('dashboard.expert.viewBtn') }}</router-link>
                </template>
                <template v-else>
                  <span class="mini-mid">{{ t('dashboard.expert.noSchedule') }}</span>
                  <p class="mini-sub">{{ noExpertHelperText }}</p>
                  <router-link to="/experts" class="btn pf-btn-secondary pf-btn-block">{{ t('dashboard.expert.viewExpertsBtn') }}</router-link>
                </template>
              </div>
            </div>

            <div class="stack-10 divided">
              <div class="donate-head">
                <span class="side-title-sm">{{ t('dashboard.donate.title') }}</span>
              </div>
              <p class="mini-sub">{{ t('dashboard.donate.desc') }}</p>
              <button type="button" class="btn pf-btn-secondary pf-btn-block" @click="donate.openModal()">{{ t('dashboard.donate.btn') }}</button>
            </div>
          </div>
          </aside>
        </div>
      </div>

      <div class="dash-quote">
        <p>{{ t('dashboard.quote') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { useDonateStore } from '../stores/donate';
import {
  escapeHtml, getLevelInfo, getLevelProgress, getRiskLabel, getRiskBadgeClass,
  buildStreakDays, renderChartSvg, buildRadarSvg, buildGardenTreesHtml
} from '../lib/dashboardHelpers';
import { MOOD_OPTIONS } from '../lib/moodCheckinOptions';
import { taskCardSrc } from '../lib/taskImages';

// 5 mức cảm xúc đại diện (trong 7 mức thật của trang check-in) để hiện preview dạng hàng
// emoji trên dashboard — mức ở giữa (index 2) phóng to làm điểm nhấn, bấm vào hàng này đi
// thẳng sang trang check-in thật để chọn chính xác.
const CHECKIN_PREVIEW_MOODS = ['comfortable', 'normal', 'veryHappy', 'slightlyStressed', 'angry']
  .map((id) => MOOD_OPTIONS.find((m) => m.id === id));
const CHECKIN_CENTER_INDEX = 2;

const CHART_TABS = [
  { period: '7d', labelKey: 'dashboard.chart.tab7d' },
  { period: '30d', labelKey: 'dashboard.chart.tab30d' },
  { period: '3m', labelKey: 'dashboard.chart.tab3m' }
];

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const donate = useDonateStore();

const data = ref(null);
const chartPeriod = ref('7d');
const loading = ref(false);
const aiTasks = ref(null);
const insightMode = ref('server'); // 'server' | 'loading' | 'ai'
const insightNote = ref('');
const aiRecommendation = ref('');
const aiExercises = ref([]);
const currentTime = ref(Date.now());
let greetingTimer = null;

// Locale cho Intl.DateTimeFormat — 'vi' -> 'vi-VN', 'en' -> 'en-US'. Trước đây hardcode
// 'vi-VN' nên đổi ngôn ngữ app không đổi được cách hiển thị ngày giờ.
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || t('dashboard.defaultUserLabel'));
const isExpert = computed(() => Boolean(auth.user?.is_expert));
const isAdmin = computed(() => Boolean(auth.user?.role === 'admin' || auth.user?.is_admin));
const checkinPromptTitle = computed(() => {
  const hour = new Date(currentTime.value).getHours();
  const period = hour < 12 ? 'morningTitle' : hour < 18 ? 'afternoonTitle' : 'eveningTitle';
  return t(`dashboard.checkinPrompt.${period}`);
});

const progress = computed(() => data.value?.progress || null);
const summary = computed(() => data.value?.summary || null);
const showEmergencyBanner = computed(() => Boolean(summary.value?.show_emergency_banner));
const emergencyReasonText = computed(() => {
  const reason = summary.value?.emergency_reason;
  if (!reason?.code) return '';
  return t(`dashboard.emergencyBanner.reasons.${reason.code}`, reason.params || {});
});
const isNewUser = computed(() => Boolean(data.value) && !data.value.latest_mood && (progress.value?.total_xp ?? 0) === 0);

const stats = computed(() => {
  const p = progress.value;
  const mood = data.value?.latest_mood;
  const s = summary.value;

  const hasMood = mood?.mood_score !== undefined && mood?.mood_score !== null;
  const streak = p?.current_streak ?? p?.streak ?? 0;
  const weeklyTasks = p?.weekly_tasks_completed ?? 0;
  const anxietyAverage = s?.anxiety_average_14d;
  const hasAnxiety = anxietyAverage !== null && anxietyAverage !== undefined;

  return {
    mood: hasMood ? mood.mood_score : '--',
    moodTrend: hasMood ? t('dashboard.stats.moodTrendHas') : t('dashboard.stats.moodTrendNone'),
    moodColor: hasMood ? 'var(--mint-dark)' : 'var(--text-light)',
    streak,
    streakTrend: streak > 0 ? t('dashboard.stats.streakTrendHas') : t('dashboard.stats.streakTrendNone'),
    streakColor: streak > 0 ? 'var(--peach-dark)' : 'var(--text-light)',
    tasks: weeklyTasks,
    tasksTrend: weeklyTasks > 0 ? t('dashboard.stats.tasksTrendHas', { n: weeklyTasks }) : t('dashboard.stats.tasksTrendNone'),
    tasksColor: weeklyTasks > 0 ? 'var(--sky)' : 'var(--text-light)',
    anxiety: hasAnxiety ? anxietyAverage : '--',
    anxietyTrend: hasAnxiety ? t('dashboard.stats.anxietyTrendHas') : t('dashboard.stats.anxietyTrendNone'),
    anxietyColor: hasAnxiety ? 'var(--lavender)' : 'var(--text-light)'
  };
});

const chartSvgHtml = computed(() => renderChartSvg(data.value?.mood_chart?.[chartPeriod.value], t('dashboard.chart.noDataToDraw')));
const chartLabels = computed(() => (data.value?.mood_chart?.[chartPeriod.value]?.points || []).map((p) => escapeHtml(p.label || '--')));

const insightTitle = computed(() => {
  if (insightMode.value === 'loading') return t('dashboard.insight.analyzing');
  if (insightMode.value === 'ai') return t('dashboard.insight.adviceFrom');
  // data.value?.insight?.title là NHẬN XÉT DO BACKEND/AI SINH RA (tiếng Việt) — chưa nằm
  // trong phạm vi đợt dịch tĩnh này, chỉ dịch phần fallback khi backend chưa có insight.
  return data.value?.insight?.title || t('dashboard.insight.defaultTitle');
});
const insightBadge = computed(() => (insightMode.value === 'ai' || insightMode.value === 'loading' ? 'AI' : 'DB'));
const insightTags = computed(() => {
  if (insightMode.value !== 'server') return [];
  const tags = data.value?.insight?.tags;
  const classes = ['badge-mint', 'badge-peach', 'badge-lavender'];
  if (tags?.length) return tags.map((tag, i) => ({ text: tag, cls: classes[i % classes.length] }));
  return [{ text: t('dashboard.insight.waitingData'), cls: 'badge-mint' }];
});
const insightBodyHtml = computed(() => {
  if (insightMode.value === 'loading') return t('dashboard.insight.loadingAdvice');
  if (insightMode.value === 'ai') {
    // aiRecommendation là nội dung PeaceCat AI SINH RA (tiếng Việt) — ngoài phạm vi đợt dịch
    // tĩnh này, xem ai.service.js. Danh sách bài tập không nằm ở đây mà hiện một lần duy nhất
    // trong suggestionList (kèm nút thực hiện) để không lặp lại.
    return escapeHtml(aiRecommendation.value);
  }
  return escapeHtml(data.value?.insight?.body || t('dashboard.insight.noAnalysis')).replace(/\n/g, '<br>');
});

function handleInsightClick(event) {
  const link = event.target.closest('[data-task-id]');
  if (!link) return;
  router.push({ path: '/task-detail', query: { id: link.getAttribute('data-task-id') } });
}

// Backend (report.routes.js) trả `label`/`status_text` bằng tiếng Việt cứng — đây là bản
// đồ trạng thái TĨNH (key cố định 'emotion'/'energy'/... và status 'excellent'/'good'/...),
// không phải nội dung AI sinh tự do, nên dịch được. Bỏ qua 2 field đó, tự dịch lại từ
// `metric.key`/`metric.status` (backend đã gửi kèm) để khớp ngôn ngữ đang chọn — nếu không
// tiêu đề card đã dịch nhưng nội dung bên trong vẫn tiếng Việt, nhìn dịch nửa vời.
function translateMetric(metric) {
  return {
    ...metric,
    label: t(`dashboard.garden.metrics.${metric.key}`),
    status_text: t(`dashboard.garden.status.${metric.status}`)
  };
}

const radarMetrics = computed(() => (data.value?.wellness?.radar || []).map(translateMetric));
const radarSvgHtml = computed(() => buildRadarSvg(radarMetrics.value));

const gardenMetrics = computed(() => (data.value?.wellness?.garden || []).map(translateMetric));
const gardenTreesHtml = computed(() => buildGardenTreesHtml(gardenMetrics.value));
const riskLevel = computed(() => summary.value?.risk_level);
const riskLabel = computed(() => getRiskLabel(riskLevel.value, t));
const riskBadgeClass = computed(() => getRiskBadgeClass(riskLevel.value));

const xpInfo = computed(() => {
  const p = progress.value;
  const xp = p?.xp ?? 0;
  const levelInfo = p?.level_info || getLevelInfo(xp);
  const percent = levelInfo?.progress_percent ?? getLevelProgress(xp);
  const currentLevel = p?.level ?? p?.current_level ?? levelInfo.level;
  const maxXP = levelInfo?.maxXP ?? levelInfo.maxXP;
  const minXP = levelInfo?.minXP ?? levelInfo.minXP;
  const xpToNext = levelInfo?.xp_to_next ?? (maxXP === Infinity ? 0 : Math.max(0, maxXP - xp));
  const nextLabel = maxXP === Infinity
    ? t('dashboard.levels.maxLevel')
    : t('dashboard.levels.nextLevel', { xp: xpToNext, level: currentLevel + 1 });
  // levelInfo.title là dữ liệu BACKEND trả về (progress?.level_info, tiếng Việt) khi có;
  // chỉ khi rơi về fallback cục bộ (getLevelInfo) mới dùng labelKey tự dịch được.
  const title = levelInfo.title || (levelInfo.labelKey ? t(levelInfo.labelKey) : t('dashboard.levels.defaultTitle'));
  return { xp, currentLevel, title, minXP, maxXPLabel: maxXP === Infinity ? '∞' : maxXP, percent, nextLabel };
});

const streakDays = computed(() => buildStreakDays(stats.value.streak, locale.value));

const challenge = computed(() => data.value?.challenge || null);

const expertSession = computed(() => data.value?.expert_session || null);
const expertStatus = computed(() => {
  const statusMap = {
    pending: { label: t('dashboard.expert.statusPending'), color: 'var(--color-caution)', bg: 'var(--color-caution-soft)' },
    confirmed: { label: t('dashboard.expert.statusConfirmed'), color: 'var(--color-brand)', bg: 'var(--color-brand-soft)' }
  };
  return statusMap[expertSession.value?.status] || statusMap.confirmed;
});
const expertTypeLabel = computed(() => {
  const typeMap = {
    chat: t('dashboard.expert.typeChat'),
    voice: t('dashboard.expert.typeVoice'),
    video: t('dashboard.expert.typeVideo'),
    inperson: t('dashboard.expert.typeInPerson')
  };
  return typeMap[expertSession.value?.session_type] || expertSession.value?.session_type || t('dashboard.expert.typeDefault');
});
const expertTimeLabel = computed(() => {
  if (!expertSession.value) return '';
  try {
    return new Intl.DateTimeFormat(intlLocale.value, {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
    }).format(new Date(expertSession.value.starts_at));
  } catch (_e) {
    return expertSession.value.starts_at;
  }
});
const noExpertHelperText = computed(() => (
  ['high', 'critical'].includes(summary.value?.risk_level)
    ? t('dashboard.expert.helperHighRisk')
    : t('dashboard.expert.helperDefault')
));

const recommendedTasks = computed(() => aiTasks.value || data.value?.tasks || []);

// --- Chỉ phục vụ hiển thị (bố cục mới) ---
const moodButtons = computed(() => CHECKIN_PREVIEW_MOODS.map((mood) => ({
  ...mood,
  label: t(mood.labelKey)
})));
// Thẻ "Bài tập gợi ý" trong card PeaceCat: lấy nhiệm vụ đầu tiên đang được đề xuất.
// Danh sách nhiệm vụ duy nhất của Dashboard: bài AI chọn (kèm lý do) nếu có, nếu không thì các
// nhiệm vụ hệ thống đề xuất. Tối đa 4 thẻ (2 hàng × 2) để không dài trang.
const suggestionList = computed(() => {
  const list = insightMode.value === 'ai' && aiExercises.value.length ? aiExercises.value : recommendedTasks.value;
  return list.slice(0, 4);
});
// Ảnh nhiệm vụ lỗi (thiếu file) thì ẩn ảnh, giữ khung màu nền.
const brokenThumbs = reactive(new Set());
// Mẫu số của KPI "Nhiệm vụ tuần" lấy từ mục tiêu tuần thật (nếu có), không tự đặt cứng.
const weeklyGoal = computed(() => challenge.value?.goal ?? null);

function taskBadge(task) {
  if (String(task.category || '').toLowerCase() === 'emergency') return { text: t('dashboard.tasks.badgePriority'), cls: 'tb-priority' };
  const level = String(task.difficulty || 'easy').toLowerCase();
  if (level === 'hard') return { text: t('dashboard.tasks.badgeHard'), cls: 'tb-hard' };
  if (level === 'medium') return { text: t('dashboard.tasks.badgeMedium'), cls: 'tb-medium' };
  return { text: t('dashboard.tasks.badgeEasy'), cls: 'tb-easy' };
}

// buildStreakDays chỉ đánh dấu ngày đã làm/hôm nay; tách thêm ngày đã qua (bỏ lỡ) và ngày
// sắp tới để vẽ đúng 3 trạng thái của dải chuỗi thói quen.
const streakRibbon = computed(() => {
  const todayIndex = new Date().getDay();
  return streakDays.value.map((day, index) => {
    const isToday = day.className.includes('today');
    const isDone = day.className.includes('done');
    let state = index < todayIndex ? 'missed' : 'upcoming';
    if (isDone) state = 'done';
    if (isToday) state = isDone ? 'today-done' : 'today';
    return { ...day, state };
  });
});

function gardenDotClass(status) {
  if (status === 'excellent' || status === 'good') return 'dot-primary';
  if (status === 'fair' || status === 'needs-care') return 'dot-amber';
  return 'dot-muted';
}

function switchChart(period) {
  chartPeriod.value = period;
}

function syncUser(user) {
  const current = auth.user || {};
  const isSameUser = current.id && user.id ? current.id === user.id : true;
  const merged = isSameUser ? { ...current, ...user } : { ...user };
  if (merged.display_name && (!merged.full_name || merged.full_name === current.full_name)) {
    merged.full_name = merged.display_name;
  }
  auth.setSession({ user: merged });
}

// Ghi lại vào localStorage để trang Nhiệm vụ tô sáng đúng các bài AI vừa gợi ý.
function cacheInsightForTasksPage(recommendation, exercises) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const userId = data.value?.user?.id || auth.user?.id || 'guest';
  try {
    localStorage.setItem(
      `peaceflow_ai_insight_${userId}_${today}`,
      JSON.stringify({ recommendation, exercises })
    );
  } catch (_e) { /* hết dung lượng localStorage thì bỏ qua */ }
}

function applyInsight(res) {
  const recommendation = res?.summary || '';
  const exercises = Array.isArray(res?.exercises) ? res.exercises : [];
  if (!recommendation && !exercises.length) return false;

  aiRecommendation.value = recommendation;
  aiExercises.value = exercises;
  insightMode.value = 'ai';
  if (exercises.length) aiTasks.value = exercises;
  cacheInsightForTasksPage(recommendation, exercises);
  return true;
}

// Mở trang: chỉ ĐỌC lời khuyên đã lưu từ lần bấm nút trước — KHÔNG gọi AI, không tốn token.
async function loadStoredInsight() {
  try {
    const res = await apiClient.get('/ai/insight', { noCache: true });
    applyInsight(res);
  } catch (e) {
    console.warn('[AI] không đọc được lời khuyên đã lưu:', e.message);
  }
}

// Người dùng bấm nút. Backend tự so dữ liệu hiện tại với lần chạy gần nhất:
// chưa thay đổi đáng kể -> trả lại đúng lời khuyên cũ (không gọi AI, không tốn token);
// đã thay đổi -> sinh lời khuyên mới.
async function requestAiInsight() {
  if (insightMode.value === 'loading') return;
  insightMode.value = 'loading';
  insightNote.value = '';
  try {
    const res = await apiClient.post('/ai/insight', {});
    const ok = applyInsight(res);
    if (!ok) {
      insightNote.value = t('dashboard.insight.noteNotEnough');
      insightMode.value = data.value?.insight ? 'server' : 'ai';
      return;
    }
    insightNote.value = res?.changed === false
      ? t('dashboard.insight.noteUnchanged')
      : t('dashboard.insight.noteUpdated');
  } catch (e) {
    console.warn('[AI] tạo lời khuyên thất bại:', e.message);
    insightNote.value = t('dashboard.insight.noteFailed');
    insightMode.value = aiRecommendation.value ? 'ai' : (data.value?.insight ? 'server' : 'server');
  }
}

async function refresh(force = false) {
  if (loading.value && !force) return;
  loading.value = true;

  try {
    aiTasks.value = null;
    const forceFresh = force || localStorage.getItem('peaceflow_dashboard_refresh') === '1';
    const result = await apiClient.get('/dashboard', { noCache: forceFresh });
    data.value = result;

    if (result?.user) {
      syncUser(result.user);
    }

    if (result?.progress) {
      window.dispatchEvent(new CustomEvent('peaceflow:progress-updated', {
        detail: {
          xp: result.progress.xp ?? result.progress.total_xp ?? 0,
          level: result.progress.level ?? result.progress.current_level ?? 1
        }
      }));
    }

    localStorage.removeItem('peaceflow_dashboard_refresh');
    // KHONG tu dong goi AI nua: chi doc lai loi khuyen da luu tu lan bam nut truoc.
    loadStoredInsight();
  } finally {
    loading.value = false;
  }
}

function handleSwrUpdate(event) {
  if (event.detail?.endpoint !== '/dashboard' || !data.value) return;
  data.value = event.detail.data;
  if (event.detail.data?.user) syncUser(event.detail.data.user);
}

function handleVisibility() {
  if (document.visibilityState !== 'visible') return;
  if (localStorage.getItem('peaceflow_dashboard_refresh') === '1') refresh(true);
}

function handleMutation() {
  refresh(true).catch(() => {});
}

onMounted(async () => {
  greetingTimer = window.setInterval(() => {
    currentTime.value = Date.now();
  }, 60 * 1000);
  document.addEventListener('click', handleInsightClick);
  window.addEventListener('pageshow', handleVisibility);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('peaceflow:swr-update', handleSwrUpdate);
  window.addEventListener('peaceflow:mood-saved', handleMutation);
  window.addEventListener('peaceflow:task-completed', handleMutation);
  window.addEventListener('peaceflow:journal-saved', handleMutation);
  window.addEventListener('peaceflow:booking-changed', handleMutation);

  try {
    // Chạy song song thay vì chờ waitForAuth() xong mới bắt đầu refresh() — waitForAuth
    // không quyết định việc có gọi refresh() hay không ở đây, nên chờ nối tiếp chỉ cộng
    // thêm một round-trip vào thời gian hiện đúng dữ liệu mà không có lý do.
    await Promise.all([auth.waitForAuth(), refresh()]);
  } catch (error) {
    console.error('Dashboard init error:', error);
  }
});

onBeforeUnmount(() => {
  if (greetingTimer) window.clearInterval(greetingTimer);
  document.removeEventListener('click', handleInsightClick);
  window.removeEventListener('pageshow', handleVisibility);
  document.removeEventListener('visibilitychange', handleVisibility);
  window.removeEventListener('peaceflow:swr-update', handleSwrUpdate);
  window.removeEventListener('peaceflow:mood-saved', handleMutation);
  window.removeEventListener('peaceflow:task-completed', handleMutation);
  window.removeEventListener('peaceflow:journal-saved', handleMutation);
  window.removeEventListener('peaceflow:booking-changed', handleMutation);
});

</script>

<script>
export default { name: 'DashboardView' };
</script>

<style scoped>
/* Dashboard theo bộ nhận diện PeaceFlow — mọi màu/chữ/bo góc lấy từ assets/brand-tokens.css.
   Font: Nunito cho tiêu đề và số liệu nổi bật, Inter cho nội dung; Playfair chỉ cho câu nhấn
   (lời chào, câu trích dẫn cuối trang).
   Nguyên tắc: khoảng trống tạo phân cấp trước, viền mảnh khi cần, bóng đổ rất nhẹ,
   không gradient trang trí, không viết hoa toàn bộ, ít pill/icon. */
.dash {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-text);
  background: var(--color-canvas);
  -webkit-font-smoothing: antialiased;
  position: relative;
  isolation: isolate;
}
/* Ảnh rừng hòa vào nền ivory: ảnh nét (không làm mờ) nhưng chỉ hiện nhẹ và trộn kiểu
   multiply, nên tổng thể vẫn giữ tông ivory của bộ nhận diện thay vì bị ảnh thay màu.
   Lớp position:fixed → đứng yên khi cuộn (background-attachment:fixed không chạy trên iOS). */
.dash::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9;
  mix-blend-mode: multiply;
  /* Góc trên trái là màu nền ivory trọn vẹn, ảnh hiện dần theo đường chéo và rõ nhất ở góc dưới phải. */
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { margin-left: 0; padding: 20px 20px 32px; min-height: 100vh; }
.dash-inner { width: 100%; display: flex; flex-direction: column; gap: 24px; }

/* ---------- Nền tảng ---------- */
.material-symbols-outlined { font-size: 18px; line-height: 1; vertical-align: middle; font-variation-settings: 'wght' 300; }
.stack-8 > * + * { margin-top: 8px; } .stack-10 > * + * { margin-top: 10px; } .stack-14 > * + * { margin-top: 14px; }
.stack-16 > * + * { margin-top: 16px; } .stack-20 > * + * { margin-top: 20px; }
.empty-text { font-size: 14px; color: var(--color-text-muted); margin: 0; line-height: 1.6; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.dot-primary { background: var(--color-brand); } .dot-amber { background: var(--color-terracotta); } .dot-muted { background: var(--color-olive); }

.card { background: var(--color-surface); border-radius: var(--radius-card); }
.card-pad { padding: 28px; }
.eyebrow { display: block; font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.sec-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.sec-title { font-family: var(--font-heading); font-size: 22px; font-weight: 800; line-height: 1.25; color: var(--color-text); margin: 2px 0 0; }

/* ---------- Buttons: primary / secondary / tertiary / danger ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 8px 16px;
  border: none; border-radius: var(--radius-control);
  font-family: inherit; font-size: 14px; font-weight: 600; line-height: 1;
  text-decoration: none; white-space: nowrap; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pf-btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.pf-btn-primary:hover { filter: brightness(0.92); }
.pf-btn-secondary { background: var(--color-surface-muted); color: var(--color-text); }
.pf-btn-secondary:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.pf-btn-tertiary { min-height: 0; padding: 4px 0; background: none; color: var(--color-text-muted); font-weight: 500; }
.pf-btn-tertiary:hover { color: var(--color-brand); }
.pf-btn-tertiary .material-symbols-outlined { font-size: 17px; }
.spinning { animation: pf-spin 1s linear infinite; }
@keyframes pf-spin { to { transform: rotate(360deg); } }
.pf-btn-danger { background: var(--color-danger); color: #fff; }
.pf-btn-danger:hover { filter: brightness(0.92); }
.pf-btn-sm { min-height: 30px; padding: 6px 12px; font-size: 13px; }
.pf-btn-block { width: 100%; }
.link-arrow, .link-sm { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--color-brand); text-decoration: none; }
.link-arrow:hover, .link-sm:hover { text-decoration: underline; text-underline-offset: 3px; }

/* Focus rõ ràng cho bàn phím */
.dash :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius: var(--radius-control); }

/* ---------- Băng hỗ trợ ưu tiên (an toàn — dùng màu danger, không dùng terracotta) ---------- */
.sb-badge { font-size: 12px; font-weight: 600; color: var(--color-danger); }
.sb-desc { font-size: 14px; color: var(--color-text); line-height: 1.5; margin: 0; }
.sb-reason { font-weight: 600; color: var(--color-danger); }

/* ---------- Bố cục 8/4 ---------- */
.dash-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.col-left { display: flex; flex-direction: column; gap: 52px; min-width: 0; }

/* ---------- 1. Check-in ---------- */
.checkin-card {
  padding: 36px 28px 28px;
  border-radius: var(--radius-panel);
  /* Gradient rất nhẹ, chỉ đủ phảng phất sắc màu (mint/peach/lavender của app) theo đường
     chéo — độ sáng tổng thể phải giữ bằng các card trắng ấm khác, không được tối/đậm hơn.
     Dòng đầu là bản dự phòng (màu đã pha sẵn gần trắng) cho trình duyệt WebView cũ chưa
     hỗ trợ color-mix; dòng sau dùng color-mix cho trình duyệt hiện đại. */
  background: linear-gradient(135deg, #f6faf2 0%, var(--color-surface) 50%, #fff9ef 78%, #faf6f5 100%);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--mint-light) 15%, var(--color-surface)) 0%,
    var(--color-surface) 50%,
    color-mix(in srgb, var(--peach-light) 15%, var(--color-surface)) 78%,
    color-mix(in srgb, var(--lavender-light) 12%, var(--color-surface)) 100%);
}
.ci-body { display: flex; flex-direction: column; gap: 24px; }
.ci-titles { text-align: center; }
.ci-hello-row { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
.ci-hello { font-family: var(--font-display); font-style: italic; font-size: 20px; color: var(--color-text-muted); margin: 0; }
.role-tag { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-control); background: var(--color-surface-muted); color: var(--color-text-muted); }
.ci-title { font-family: var(--font-heading); font-size: 34px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); margin: 6px 0 0; }

.mood-picker { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; max-width: 560px; width: 100%; margin: 0 auto; }
.mood-btn {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  padding: 16px 8px 14px; border-radius: var(--radius-card);
  background: var(--color-canvas);
  text-decoration: none; text-align: center;
  transition: background-color var(--duration-normal) var(--ease-standard), transform var(--duration-normal) var(--ease-standard);
}
.mood-btn:hover { background: var(--color-surface-muted); transform: translateY(-2px); }
/* Bê nguyên CSS icon của code cũ (.cp-mood-emoji) sang .mood-icon của layout mới — không chỉnh
   giá trị, chỉ đổi selector cho khớp cấu trúc .mood-btn hiện tại. */
.mood-icon {
  font-size: 1.4rem;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  animation: mood-icon-pop 5s ease-in-out infinite;
}
.mood-btn.is-active .mood-icon {
  font-size: 2rem;
  width: 58px;
  height: 58px;
  background: var(--warm-white);
  box-shadow: 0 4px 12px rgba(74, 55, 40, 0.18), 0 0 0 3px var(--warm-white);
  translate: 0 -6px;
}
.mood-btn:hover .mood-icon {
  animation-play-state: paused;
  scale: 1.3;
  translate: 0 -8px;
  background: var(--warm-white);
  box-shadow: 0 4px 12px rgba(74, 55, 40, 0.18);
}
@keyframes mood-icon-pop {
  0%, 100% { scale: 1; rotate: 0deg; }
  5% { scale: 1.3; rotate: -10deg; }
  10% { scale: 1.3; rotate: 10deg; }
  15% { scale: 1.1; rotate: -5deg; }
  20% { scale: 1; rotate: 0deg; }
}
.mood-label { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
/* Trạng thái chọn nhận biết được không chỉ nhờ màu: dấu tích cạnh icon + chữ đậm (không còn nền
   thẻ màu xanh để tránh ồn, chỉ icon + chữ nổi bật). */
.mood-btn.is-active .mood-label { color: var(--color-brand); font-weight: 700; }
.mood-icon-wrap { position: relative; display: inline-flex; }
.mood-check { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: var(--color-brand); color: var(--color-on-brand); display: flex; align-items: center; justify-content: center; }
.mood-check .material-symbols-outlined { font-size: 16px; font-variation-settings: 'wght' 500; }
.ci-foot { font-size: 13px; color: var(--color-text-muted); text-align: center; margin: 0; }
.new-user-links { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

/* ---------- 2. Bốn chỉ số ---------- */
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.kpi { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
.kpi-label { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.kpi-value { display: flex; align-items: baseline; gap: 4px; }
.kpi-value b { font-family: var(--font-heading); font-size: 34px; font-weight: 800; line-height: 1.1; color: var(--color-text); }
.kpi-value b.is-empty { color: var(--color-text-subtle); }
.kpi-value small { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }
.kpi-foot { font-size: 13px; color: var(--color-text-muted); margin: 0; line-height: 1.4; }

/* ---------- 3. Trợ lý PeaceCat ---------- */
.ai-row { display: flex; align-items: flex-start; gap: 20px; }
.ai-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.ai-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.ai-head-left { display: flex; flex-direction: column; gap: 2px; }
.ai-caption { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.ai-title { font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--color-text); }
.ai-quote { padding: 0; }
.ai-text { font-size: 15px; line-height: 1.7; color: var(--color-text); }
.ai-text.loading { opacity: 0.55; font-style: italic; }
.ai-text :deep(a) { color: var(--color-brand) !important; }
.ai-basis { font-size: 13px; color: var(--color-text-muted); margin: 8px 0 0; }
.ai-note { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* ---------- Nhiệm vụ hôm nay: thẻ có ảnh, 2 thẻ/hàng ---------- */
.task-section { padding-top: 8px; }
.task-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.task-section-head .pf-section-title { font-size: 18px; }
.task-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.td-card { display: flex; flex-direction: column; border-radius: var(--radius-card); background: var(--color-canvas); overflow: hidden; text-decoration: none; color: inherit; transition: transform var(--duration-normal) var(--ease-standard), background-color var(--duration-normal) var(--ease-standard); }
.td-card:hover { transform: translateY(-2px); background: var(--color-surface-muted); }
.task-thumb { position: relative; aspect-ratio: 16 / 9; background: var(--color-olive); }
.task-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.task-badge { position: absolute; top: 10px; left: 10px; font-size: 12px; font-weight: 600; color: #fff; background: var(--color-danger); padding: 2px 8px; border-radius: var(--radius-control); }
.td-card-body { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px 16px; flex: 1; }
.task-name { font-size: 15px; font-weight: 600; line-height: 1.4; color: var(--color-text); margin: 0; }
.task-reason { font-size: 13.5px; line-height: 1.55; color: var(--color-text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.td-card-foot { margin-top: auto; padding-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.task-time { font-size: 13px; color: var(--color-text-muted); }
.task-xp { font-size: 13px; font-weight: 600; color: var(--color-terracotta); white-space: nowrap; }

/* ---------- 4. Biểu đồ ---------- */
.seg { display: inline-flex; align-items: center; padding: 3px; border-radius: var(--radius-control); background: var(--color-surface-muted); }
.seg-btn { padding: 6px 14px; border-radius: 6px; border: none; background: transparent; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--color-text-muted); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard); }
.seg-btn:hover { color: var(--color-text); }
.seg-btn.is-active { background: var(--color-surface); color: var(--color-brand); font-weight: 600; box-shadow: 0 1px 2px rgba(55, 58, 52, 0.08); }
.mood-chart-area { height: 216px; }
.mood-chart-area :deep(.chart-svg) { width: 100%; height: 100%; overflow: visible; }
.chart-labels { display: grid; gap: 4px; padding-top: 12px; margin-top: 4px; text-align: center; }
.chart-labels span { font-size: 12.5px; font-weight: 500; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chart-labels span.is-current { font-weight: 700; color: var(--color-brand); }

/* ---------- 5. Radar ---------- */
.radar-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 24px; align-items: center; }
.radar-svg-wrap { display: flex; justify-content: center; padding: 8px 0; }
/* viewBox rộng hai bên để nhãn trục (tên + điểm) nằm trong khung, co theo bề ngang thẻ — không tràn trên mobile. */
.radar-svg-wrap { min-width: 0; }
.radar-svg-wrap :deep(.radar-svg) { display: block; width: 100%; max-width: 440px; height: auto; overflow: hidden; }
.radar-badges { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 16px; }
.radar-badge { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: var(--radius-control); background: var(--color-canvas); }
.rb-label { font-size: 13px; color: var(--color-text-muted); }
.rb-value { font-size: 18px; font-weight: 600; color: var(--color-text); }
.rb-value.is-empty { color: var(--color-text-subtle); }

/* ---------- Cột phải: một panel liền chia vạch ---------- */
.col-right-stack { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.col-right { display: flex; flex-direction: column; border-radius: var(--radius-panel); background: var(--color-surface); overflow: hidden; }
/* Hỗ trợ ưu tiên: thẻ đỏ đứng riêng, không chung nền với panel bên dưới */
.safety-card { padding: 18px 20px; background: var(--color-danger-soft); display: flex; flex-direction: column; gap: 8px; }
.side-sec { padding: 24px; }
.side-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.side-title { font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--color-text); margin: 0; }
.side-title-sm { font-size: 15px; font-weight: 600; color: var(--color-text); }
.side-meta { font-size: 13px; color: var(--color-text-muted); }

.level-row { display: flex; flex-direction: row; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.level-title { font-family: var(--font-heading); font-size: 18px; font-weight: 800; color: var(--color-text); }
.level-sub { font-size: 13px; color: var(--color-text-muted); }
.xp-block > * + * { margin-top: 8px; }
.xp-track { width: 100%; height: 6px; border-radius: 999px; background: var(--color-surface-muted); overflow: hidden; }
.xp-meter { height: 100%; border-radius: 999px; background: var(--color-brand); transition: width 600ms var(--ease-standard); }
.xp-labels { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12.5px; color: var(--color-text-muted); }
.xp-next { color: var(--color-text); font-weight: 600; }
.ribbon-block { padding-top: 4px; }
.ribbon-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; }
.ribbon-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.ribbon-count { font-size: 13px; color: var(--color-text-muted); }
.ribbon { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; text-align: center; }
.rb-day { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.rb-day-label { font-size: 12px; color: var(--color-text-muted); }
.rb-day-label.is-today { color: var(--color-text); font-weight: 700; }
.rb-day-dot { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.rb-day-dot .material-symbols-outlined { font-size: 16px; font-variation-settings: 'wght' 500; }
.rb-day-dot.st-missed { background: var(--color-surface-muted); }
.rb-day-dot.st-upcoming { background: var(--color-canvas); }
.rb-day-dot.st-done { background: var(--color-sage); color: var(--color-text); }
.rb-day-dot.st-today { background: var(--color-brand-soft); box-shadow: inset 0 0 0 2px var(--color-brand); }
.rb-day-dot.st-today-done { background: var(--color-brand); color: var(--color-on-brand); }


.risk-badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-control); white-space: nowrap; }
.risk-badge-coral { background: var(--color-danger-soft); color: var(--color-danger); }
.risk-badge-peach { background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.risk-badge-mint { background: var(--color-brand-soft); color: var(--color-brand); }
.garden-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.garden-chip { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted); }
.garden-chip strong { color: var(--color-text); font-weight: 600; }

/* Cảnh vườn minh họa tạm (sẽ thay bằng Soul Garden 3D): tông dịu, không hiệu ứng game hóa. */
.garden-scene { position: relative; height: 144px; border-radius: var(--radius-card); overflow: hidden; background: linear-gradient(180deg, #ece8df 0%, #ece8df 55%, #c9d1bd 55%, #a8b49a 100%); }
.garden-sky { position: absolute; top: 0; left: 0; right: 0; height: 55%; }
.g-sun { position: absolute; top: 14px; right: 20px; width: 30px; height: 30px; background: #e7c9a5; border-radius: 50%; }
.g-cloud { position: absolute; background: var(--color-surface); border-radius: 50px; opacity: 0.85; }
.g-cloud-1 { top: 16px; left: 20px; width: 56px; height: 18px; animation: g-drift 12s var(--ease-standard) infinite alternate; }
.g-cloud-2 { top: 30px; left: 92px; width: 38px; height: 12px; animation: g-drift 16s var(--ease-standard) infinite alternate-reverse; }
.garden-scene :deep(.garden-tree) { position: absolute; bottom: 0; display: flex; flex-direction: column; align-items: center; }
.garden-scene :deep(.gt-trunk) { background: #7a6a55; border-radius: 3px; }
.garden-scene :deep(.gt-top) { border-left: solid transparent; border-right: solid transparent; border-bottom: solid; }
.garden-scene :deep(.gt-flower) { display: none; }
@keyframes g-drift { from { transform: translateX(0); } to { transform: translateX(14px); } }

.side-muted { background: var(--color-canvas); }
.divided { padding-top: 16px; }
.mini-card { padding: 0; }
.row-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.grow { flex: 1; min-width: 0; }
.mini-strong { display: block; font-size: 15px; font-weight: 600; color: var(--color-text); }
.mini-mid { display: block; font-size: 14px; font-weight: 600; color: var(--color-text); }
.mini-sub { display: block; font-size: 13px; color: var(--color-text-muted); line-height: 1.6; margin: 0; }
.challenge-track { height: 6px; margin-top: 8px; border-radius: 999px; background: var(--color-surface-muted); overflow: hidden; }
.challenge-fill { height: 100%; border-radius: 999px; background: var(--color-terracotta); }
.status-pill { padding: 2px 8px; border-radius: var(--radius-control); font-size: 12px; font-weight: 600; }
.donate-head { display: flex; align-items: center; gap: 8px; }

/* ---------- Trích dẫn cuối trang ---------- */
.dash-quote { padding: 24px 0 8px; text-align: center; }
.dash-quote p { font-family: var(--font-display); font-style: italic; font-size: 22px; color: var(--color-text-muted); max-width: 560px; margin: 0 auto; }

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .dash-grid { grid-template-columns: 1fr; }
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .main-content { padding: 16px 16px 24px; }
  .card-pad { padding: 22px; }
  .checkin-card { padding: 28px 18px 22px; }
  .ci-title { font-size: 26px; }
  .ci-hello { font-size: 18px; }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .radar-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .mood-picker { gap: 8px; }
  .mood-icon { font-size: 28px; }
  .mood-label { font-size: 12px; }
  .ai-row { flex-direction: column; gap: 14px; }
  .task-grid { grid-template-columns: 1fr; }
  .kpi-value b { font-size: 30px; }
  .dash-quote p { font-size: 19px; }
}

/* Các tiêu đề section vừa đưa ra ngoài card (PeaceCat, Nhiệm vụ hôm nay, Xu hướng tâm trạng,
   Sức khỏe tổng thể) dùng chung 1 size để đồng bộ, thay vì mỗi nơi 1 size như trước. Đặt sau
   .ai-title/.side-title/.sec-title để thắng được font-size riêng của từng class đó. */
.pf-section-title { font-size: 26px; }

/* Tôn trọng người dùng giảm chuyển động */
@media (prefers-reduced-motion: reduce) {
  .dash *, .dash *::before, .dash *::after { animation: none !important; transition: none !important; }
  .mood-btn:hover { transform: none; }
}
</style>
