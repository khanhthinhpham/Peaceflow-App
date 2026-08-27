<template>
  <main class="main-content">
    <div class="page-header">
      <div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <div class="page-title">🌿 Xin chào, {{ displayName }}!</div>
          <span v-if="isExpert" class="header-tag" style="background:var(--mint); color:var(--text-primary); border:1px solid var(--mint-dark);">🩺 Chuyên gia</span>
          <span v-if="isAdmin" class="header-tag" style="background:var(--coral); color:#fff; border:1px solid var(--coral-dark);">🛡️ Admin</span>
        </div>
        <div class="page-subtitle handwritten" style="font-size:1rem;color:var(--mint-dark);">"Hôm nay là một ngày mới để tiến bộ 🌱"</div>
      </div>
      <div class="header-actions">
        <button class="btn-outline" @click.prevent>📊 Báo cáo tuần</button>
        <router-link to="/mood-checkin" class="btn-primary">💭 Check-in ngay</router-link>
      </div>
    </div>

    <div v-if="isNewUser" style="background:linear-gradient(135deg,var(--mint-light),var(--peach-light));border:2px solid var(--mint);border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;">
      <div style="font-size:2rem;margin-bottom:8px;">🌱</div>
      <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:6px;">Chào mừng đến với PeaceFlow!</div>
      <div style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:20px;line-height:1.6;">
        Hãy bắt đầu bằng cách check-in tâm trạng hôm nay.<br>
        Chỉ mất 30 giây — hệ thống sẽ gợi ý nhiệm vụ phù hợp nhất cho bạn.
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <router-link to="/mood-checkin" style="display:inline-block;padding:10px 22px;background:var(--mint-dark);color:white;border-radius:50px;font-weight:700;font-size:0.88rem;text-decoration:none;">💭 Check-in ngay</router-link>
        <router-link to="/tasks" style="display:inline-block;padding:10px 22px;border:2px solid var(--kraft-light);border-radius:50px;font-weight:700;font-size:0.88rem;text-decoration:none;color:var(--text-secondary);">🎮 Xem nhiệm vụ</router-link>
        <router-link to="/journal" style="display:inline-block;padding:10px 22px;border:2px solid var(--kraft-light);border-radius:50px;font-weight:700;font-size:0.88rem;text-decoration:none;color:var(--text-secondary);">📝 Viết nhật ký</router-link>
      </div>
    </div>

    <div class="paper-card checkin-prompt">
      <div class="cp-mascot">🐱</div>
      <div class="cp-text">
        <div class="cp-title">Chào buổi sáng! Hôm nay bạn cảm thấy thế nào? ☀️</div>
        <div class="cp-sub">Chỉ mất 30 giây — check-in để PeaceFlow gợi ý nhiệm vụ phù hợp nhất cho bạn nhé!</div>
      </div>
      <div class="cp-actions">
        <router-link to="/mood-checkin" class="btn-primary" style="font-size:0.82rem;padding:9px 16px;">Bắt đầu →</router-link>
      </div>
    </div>

    <div v-if="showEmergencyBanner" class="paper-card" style="margin:14px 0 20px;padding:16px 18px;border-color:var(--coral);background:rgba(255,139,139,0.08);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:0.95rem;font-weight:800;color:#c05050;">🆘 Ưu tiên an toàn cho bạn lúc này</div>
          <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;">PeaceFlow phát hiện mức cần hỗ trợ cao từ dữ liệu gần đây. Bạn có thể mở khu hỗ trợ khẩn cấp hoặc liên hệ người tin tưởng.</div>
        </div>
        <router-link to="/emergency" class="btn-primary" style="white-space:nowrap;">Mở hỗ trợ khẩn cấp</router-link>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="grid-4">
      <div class="paper-card stat-card">
        <div class="sc-icon mint">💭</div>
        <div class="sc-value">{{ stats.mood }}</div>
        <div class="sc-label">Tâm trạng hôm nay</div>
        <div class="sc-change" :style="{ color: stats.moodColor }">{{ stats.moodTrend }}</div>
      </div>
      <div class="paper-card stat-card">
        <div class="sc-icon peach">🔥</div>
        <div class="sc-value">{{ stats.streak }}</div>
        <div class="sc-label">Ngày streak liên tục</div>
        <div class="sc-change" :style="{ color: stats.streakColor }">{{ stats.streakTrend }}</div>
      </div>
      <div class="paper-card stat-card">
        <div class="sc-icon sky">✅</div>
        <div class="sc-value">{{ stats.tasks }}</div>
        <div class="sc-label">Nhiệm vụ tuần này</div>
        <div class="sc-change" :style="{ color: stats.tasksColor }">{{ stats.tasksTrend }}</div>
      </div>
      <div class="paper-card stat-card">
        <div class="sc-icon lavender">📉</div>
        <div class="sc-value">{{ stats.anxiety }}</div>
        <div class="sc-label">Mức lo âu (2 tuần)</div>
        <div class="sc-change" :style="{ color: stats.anxietyColor }">{{ stats.anxietyTrend }}</div>
      </div>
    </div>

    <div class="grid-main">
      <!-- Left column -->
      <div>
        <div class="paper-card chart-card" style="margin-bottom:18px;">
          <div class="chart-header">
            <div class="chart-title">📈 Biểu đồ tâm trạng</div>
            <div class="chart-tabs">
              <button
                v-for="tab in CHART_TABS"
                :key="tab.period"
                class="chart-tab"
                :class="{ active: chartPeriod === tab.period }"
                @click="switchChart(tab.period)"
              >{{ tab.label }}</button>
            </div>
          </div>
          <div class="mood-chart-area" v-html="chartSvgHtml"></div>
          <div class="chart-labels">
            <span v-if="!chartLabels.length">Chưa có dữ liệu</span>
            <span v-for="(label, idx) in chartLabels" :key="idx">{{ label }}</span>
          </div>
        </div>

        <div class="paper-card insight-card" style="margin-bottom:18px;">
          <div class="insight-header">
            <div class="insight-icon">🤖</div>
            <div class="insight-title">{{ insightTitle }}</div>
            <span class="badge-pill badge-mint" style="margin-left:auto;">{{ insightBadge }}</span>
          </div>
          <div class="insight-text" :style="insightMode === 'loading' ? { opacity: 0.55, fontStyle: 'italic' } : {}" v-html="insightBodyHtml"></div>
          <div v-if="insightTags.length" class="insight-tags">
            <span v-for="(tag, idx) in insightTags" :key="idx" class="badge-pill" :class="tag.cls">{{ tag.text }}</span>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button class="btn-primary" :disabled="insightMode === 'loading'" @click="requestAiInsight">
              {{ insightMode === 'loading' ? '⏳ Đang phân tích...' : (aiRecommendation ? '🔄 Cập nhật lời khuyên' : '✨ Nhận lời khuyên từ AI') }}
            </button>
            <span v-if="insightNote" style="font-size:0.78rem;color:var(--text-secondary);">{{ insightNote }}</span>
          </div>
        </div>

        <div class="paper-card radar-card" style="margin-bottom:18px;">
          <template v-if="radarMetrics.length">
            <div class="section-title">
              <span class="st-icon">🕸️</span> Sức khỏe tổng thể
              <a href="#" class="st-link" @click.prevent>Xem chi tiết →</a>
            </div>
            <div class="radar-wrap">
              <div class="radar-svg-wrap" v-html="radarSvgHtml"></div>
              <div class="radar-legend">
                <div v-for="metric in radarMetrics" :key="metric.label" class="rl-item">
                  <div class="rl-dot" :style="{ background: metric.color }"></div>
                  <span class="rl-label">{{ metric.label }}</span>
                  <span class="rl-val">{{ metric.value ?? '--' }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="section-title"><span class="st-icon">🕸️</span> Sức khỏe tổng thể</div>
            <div style="padding:12px 0;color:var(--text-secondary);">Chưa có đủ dữ liệu để tổng hợp các chỉ số.</div>
          </template>
        </div>

        <div class="paper-card" style="overflow:hidden;">
          <div style="padding:16px 18px;border-bottom:2px solid var(--kraft-light);display:flex;align-items:center;justify-content:space-between;">
            <div class="section-title" style="margin-bottom:0;"><span class="st-icon">🎯</span> Nhiệm vụ hôm nay</div>
            <router-link to="/tasks" class="st-link" style="font-size:0.75rem;color:var(--mint-dark);font-weight:600;text-decoration:none;">Xem tất cả →</router-link>
          </div>
          <template v-if="recommendedTasks.length">
            <template v-for="(task, idx) in recommendedTasks" :key="task.id">
              <div class="task-card paper-card" style="border:none;border-radius:0;box-shadow:none;cursor:pointer;" @click="router.push({ path: '/task-detail', query: { id: task.id } })">
                <div class="task-icon-box" :class="String(task.difficulty || 'easy').toLowerCase()">{{ getTaskEmoji(task.category) }}</div>
                <div class="task-info">
                  <div class="task-name">{{ task.title }}</div>
                  <div class="task-meta"><span>⏱ {{ task.duration_minutes || 0 }} phút</span><span>🔴 {{ task.difficulty || 'Dễ' }}</span></div>
                </div>
                <span class="task-xp">+{{ task.xp_reward || 0 }} XP</span>
              </div>
              <div v-if="idx < recommendedTasks.length - 1" class="task-divider"></div>
            </template>
          </template>
          <div v-else style="padding:20px;text-align:center;color:var(--text-secondary);">
            Chưa có nhiệm vụ được đề xuất. Hãy hoàn thành mood check-in để hệ thống gợi ý phù hợp hơn.
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div>
        <div class="paper-card garden-card" style="margin-bottom:18px;">
          <template v-if="gardenMetrics.length">
            <div class="section-title">
              <span class="st-icon">🌳</span> Khu vườn tâm hồn
              <span class="badge-pill" :class="riskBadgeClass" style="margin-left:auto;">{{ riskLabel }}</span>
            </div>
            <div class="garden-scene">
              <div class="garden-sky">
                <div class="g-sun"></div>
                <div class="g-cloud g-cloud-1"></div>
                <div class="g-cloud g-cloud-2"></div>
                <div class="g-rainbow" :class="{ show: riskLevel === 'low' || riskLevel === 'moderate' }"></div>
                <div class="g-butterfly g-butterfly-1">🦋</div>
                <div class="g-butterfly g-butterfly-2">🦋</div>
              </div>
              <div v-html="gardenTreesHtml"></div>
              <div class="g-mascot">{{ riskLevel === 'critical' ? '🫶' : '🐱' }}</div>
            </div>
            <div class="garden-legend">
              <div v-for="metric in gardenMetrics" :key="metric.label" class="gl-item">
                <div class="gl-dot" :style="{ background: metric.color }"></div>
                {{ metric.label }} — {{ metric.status_text }} {{ metric.emoji }}
              </div>
            </div>
          </template>
          <template v-else>
            <div class="section-title"><span class="st-icon">🌳</span> Khu vườn tâm hồn</div>
            <div style="padding:12px 0;color:var(--text-secondary);">Chưa có đủ dữ liệu để nuôi khu vườn.</div>
          </template>
        </div>

        <div class="paper-card xp-card" style="margin-bottom:18px;">
          <div class="xp-header">
            <div class="xp-level-badge">
              <div class="xp-level-circle">{{ xpInfo.currentLevel }}</div>
              <div class="xp-level-info">
                <div class="xl-name">{{ xpInfo.title }}</div>
                <div class="xl-range">{{ xpInfo.minXP }} – {{ xpInfo.maxXPLabel }} XP</div>
              </div>
            </div>
            <div class="xp-total">{{ xpInfo.xp }} XP</div>
          </div>
          <div class="xp-bar-wrap">
            <div class="xp-bar-fill" :style="{ width: xpInfo.percent + '%' }"></div>
          </div>
          <div class="xp-bar-labels">
            <span>{{ xpInfo.minXP }} XP</span>
            <span>{{ xpInfo.nextLabel }}</span>
            <span>{{ xpInfo.maxXPLabel }} XP</span>
          </div>
        </div>

        <div class="paper-card streak-card" style="margin-bottom:18px;">
          <div class="streak-fire">🔥</div>
          <div class="streak-number">{{ stats.streak }}</div>
          <div class="streak-label">ngày streak liên tục</div>
          <div class="streak-days">
            <div v-for="(day, idx) in streakDays" :key="idx" class="streak-day" :class="day.className">{{ day.label }}</div>
          </div>
        </div>

        <div class="paper-card challenge-card" style="margin-bottom:18px;">
          <template v-if="challenge">
            <div class="challenge-header">
              <span style="font-size:1.3rem;">🏆</span>
              <div class="challenge-title">{{ challenge.title }}</div>
              <span class="badge-pill badge-peach" style="margin-left:auto;">{{ challenge.days_left }} ngày còn lại</span>
            </div>
            <div class="challenge-desc">{{ challenge.description }}</div>
            <div class="challenge-progress-bar">
              <div class="challenge-progress-fill" :style="{ width: challenge.progress_percent + '%' }"></div>
            </div>
            <div class="challenge-meta">
              <span>{{ challenge.completed }}/{{ challenge.goal }} nhiệm vụ</span>
              <span>{{ challenge.reward_label }}</span>
            </div>
          </template>
          <template v-else>
            <div class="section-title"><span class="st-icon">🏆</span> Mục tiêu tuần</div>
            <div style="padding:12px 0;color:var(--text-secondary);">Chưa có dữ liệu mục tiêu tuần này.</div>
          </template>
        </div>

        <div class="paper-card" style="margin-bottom:0;overflow:hidden;">
          <div style="padding:14px 18px 8px;font-size:0.85rem;font-weight:700;border-bottom:1px solid var(--kraft-light);display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span>🩺 Phiên tư vấn sắp tới</span>
            <span v-if="expertSession" style="padding:3px 9px;border-radius:999px;font-size:0.66rem;font-weight:800;" :style="{ color: expertStatus.color, background: expertStatus.bg }">{{ expertStatus.label }}</span>
          </div>
          <template v-if="expertSession">
            <div class="expert-mini-card">
              <div class="expert-avatar">👩‍⚕️</div>
              <div class="expert-info">
                <div class="expert-name">{{ expertSession.expert_name }}</div>
                <div class="expert-type">{{ expertTypeLabel }}</div>
                <div class="expert-time">{{ expertTimeLabel }}</div>
              </div>
              <router-link class="btn-outline" style="font-size:0.72rem;padding:6px 12px;" to="/experts">Xem</router-link>
            </div>
          </template>
          <div v-else style="padding:18px;">
            <div style="font-size:0.9rem;font-weight:800;margin-bottom:6px;">Chưa có lịch tư vấn</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:14px;">{{ noExpertHelperText }}</div>
            <router-link to="/experts" class="btn-outline" style="font-size:0.78rem;">Xem chuyên gia</router-link>
          </div>
        </div>

        <div class="paper-card" style="margin-top:18px;text-align:center;padding:18px;">
          <div style="font-size:1.6rem;">❤️</div>
          <div style="font-weight:800;margin-top:2px;">Ủng hộ PeaceFlow</div>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin:6px 0 12px;line-height:1.5;">Mỗi đóng góp giúp PeaceFlow tiếp tục miễn phí cho mọi người.</p>
          <button type="button" class="btn-primary" style="width:100%;" @click="donate.openModal()">Ủng hộ ngay</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { useDonateStore } from '../stores/donate';
import {
  escapeHtml, getLevelInfo, getLevelProgress, getTaskEmoji, getRiskLabel, getRiskBadgeClass,
  buildStreakDays, renderChartSvg, buildRadarSvg, buildGardenTreesHtml
} from '../lib/dashboardHelpers';

const CHART_TABS = [
  { period: '7d', label: '7 ngày' },
  { period: '30d', label: '30 ngày' },
  { period: '3m', label: '3 tháng' }
];

const auth = useAuthStore();
const router = useRouter();
const donate = useDonateStore();

const data = ref(null);
const chartPeriod = ref('7d');
const loading = ref(false);
const aiTasks = ref(null);
const insightMode = ref('server'); // 'server' | 'loading' | 'ai'
const insightNote = ref('');
const insightGeneratedAt = ref(null);
const aiRecommendation = ref('');
const aiExercises = ref([]);

const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || 'bạn');
const isExpert = computed(() => Boolean(auth.user?.is_expert));
const isAdmin = computed(() => auth.user?.role === 'admin');

const progress = computed(() => data.value?.progress || null);
const summary = computed(() => data.value?.summary || null);
const showEmergencyBanner = computed(() => Boolean(summary.value?.show_emergency_banner));
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
    moodTrend: hasMood ? 'Dữ liệu mới nhất' : 'Chưa có dữ liệu',
    moodColor: hasMood ? 'var(--mint-dark)' : 'var(--text-light)',
    streak,
    streakTrend: streak > 0 ? 'Đang duy trì nhịp tốt' : 'Bắt đầu một chuỗi mới hôm nay',
    streakColor: streak > 0 ? 'var(--peach-dark)' : 'var(--text-light)',
    tasks: weeklyTasks,
    tasksTrend: weeklyTasks > 0 ? `Đã hoàn thành ${weeklyTasks} nhiệm vụ trong 7 ngày` : 'Chưa có nhiệm vụ hoàn thành trong tuần',
    tasksColor: weeklyTasks > 0 ? 'var(--sky)' : 'var(--text-light)',
    anxiety: hasAnxiety ? anxietyAverage : '--',
    anxietyTrend: hasAnxiety ? 'Trung bình 14 ngày gần nhất' : 'Chưa đủ dữ liệu',
    anxietyColor: hasAnxiety ? 'var(--lavender)' : 'var(--text-light)'
  };
});

const chartSvgHtml = computed(() => renderChartSvg(data.value?.mood_chart?.[chartPeriod.value]));
const chartLabels = computed(() => (data.value?.mood_chart?.[chartPeriod.value]?.points || []).map((p) => escapeHtml(p.label || '--')));

const insightTitle = computed(() => {
  if (insightMode.value === 'loading') return 'PeaceCat AI đang phân tích...';
  if (insightMode.value === 'ai') {
    // Ghi rõ lời khuyên được sinh lúc nào, vì giờ nó chỉ đổi khi người dùng bấm nút
    // (và dữ liệu của họ đã thay đổi) — không còn tự làm mới mỗi ngày.
    const at = insightGeneratedAt.value;
    if (!at) return 'Lời khuyên từ PeaceCat AI';
    try {
      const label = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
      }).format(new Date(at));
      return `Lời khuyên từ PeaceCat AI · ${label}`;
    } catch (_e) {
      return 'Lời khuyên từ PeaceCat AI';
    }
  }
  return data.value?.insight?.title || 'Insight từ dữ liệu của bạn';
});
const insightBadge = computed(() => (insightMode.value === 'ai' || insightMode.value === 'loading' ? 'AI' : 'DB'));
const insightTags = computed(() => {
  if (insightMode.value !== 'server') return [];
  const tags = data.value?.insight?.tags;
  const classes = ['badge-mint', 'badge-peach', 'badge-lavender'];
  if (tags?.length) return tags.map((tag, i) => ({ text: tag, cls: classes[i % classes.length] }));
  return [{ text: 'Đang chờ dữ liệu', cls: 'badge-mint' }];
});
const insightBodyHtml = computed(() => {
  if (insightMode.value === 'loading') return 'Đang tải gợi ý cá nhân hóa cho bạn...';
  if (insightMode.value === 'ai') {
    let exercisesHtml = '';
    if (aiExercises.value.length) {
      const items = aiExercises.value.map((ex) => {
        const nameHtml = ex.id
          ? `<a data-task-id="${ex.id}" style="color:var(--mint-dark);font-weight:700;text-decoration:none;cursor:pointer;">${escapeHtml(ex.title)}</a>`
          : `<strong>${escapeHtml(ex.title)}</strong>`;
        return `<li style="margin-bottom:12px;">${nameHtml}${ex.reason ? `<div style="margin-top:4px;font-size:0.85rem;color:var(--text-secondary);line-height:1.5;">${escapeHtml(ex.reason)}</div>` : ''}</li>`;
      }).join('');
      exercisesHtml = `<ol style="padding-left:1.25rem;margin:8px 0 0;">${items}</ol>`;
    }
    return `${escapeHtml(aiRecommendation.value)}${exercisesHtml}`;
  }
  return escapeHtml(data.value?.insight?.body || 'Chưa có phân tích.').replace(/\n/g, '<br>');
});

function handleInsightClick(event) {
  const link = event.target.closest('[data-task-id]');
  if (!link) return;
  router.push({ path: '/task-detail', query: { id: link.getAttribute('data-task-id') } });
}

const radarMetrics = computed(() => data.value?.wellness?.radar || []);
const radarSvgHtml = computed(() => buildRadarSvg(radarMetrics.value));

const gardenMetrics = computed(() => data.value?.wellness?.garden || []);
const gardenTreesHtml = computed(() => buildGardenTreesHtml(gardenMetrics.value));
const riskLevel = computed(() => summary.value?.risk_level);
const riskLabel = computed(() => getRiskLabel(riskLevel.value));
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
  const nextLabel = maxXP === Infinity ? 'Bạn đang ở cấp cao nhất hiện tại' : `Còn ${xpToNext} XP → Level ${currentLevel + 1}`;
  return { xp, currentLevel, title: levelInfo.title || 'Hành trình đang tiếp tục', minXP, maxXPLabel: maxXP === Infinity ? '∞' : maxXP, percent, nextLabel };
});

const streakDays = computed(() => buildStreakDays(stats.value.streak));

const challenge = computed(() => data.value?.challenge || null);

const expertSession = computed(() => data.value?.expert_session || null);
const expertStatus = computed(() => {
  const statusMap = {
    pending: { label: 'Chờ xác nhận', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
    confirmed: { label: 'Đã xác nhận', color: '#2f8f5b', bg: 'rgba(47,143,91,.14)' }
  };
  return statusMap[expertSession.value?.status] || statusMap.confirmed;
});
const expertTypeLabel = computed(() => {
  const typeMap = { chat: 'Chat text', voice: 'Gọi thoại', video: 'Video call', inperson: 'Gặp trực tiếp' };
  return typeMap[expertSession.value?.session_type] || expertSession.value?.session_type || 'Tư vấn trực tuyến';
});
const expertTimeLabel = computed(() => {
  if (!expertSession.value) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
    }).format(new Date(expertSession.value.starts_at));
  } catch (_e) {
    return expertSession.value.starts_at;
  }
});
const noExpertHelperText = computed(() => (
  ['high', 'critical'].includes(summary.value?.risk_level)
    ? 'Bạn đang ở vùng cần ưu tiên hồi phục. Nếu cần thêm hỗ trợ, hãy cân nhắc kết nối chuyên gia.'
    : 'Hiện chưa có lịch tư vấn nào được lưu trong hệ thống.'
));

const recommendedTasks = computed(() => aiTasks.value || data.value?.tasks || []);

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
  insightGeneratedAt.value = res?.generated_at || null;
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
      insightNote.value = 'Chưa đủ dữ liệu để đưa ra lời khuyên. Hãy check-in tâm trạng hoặc hoàn thành một nhiệm vụ trước nhé.';
      insightMode.value = data.value?.insight ? 'server' : 'ai';
      return;
    }
    insightNote.value = res?.changed === false
      ? 'Dữ liệu của bạn chưa thay đổi đáng kể so với lần trước nên lời khuyên được giữ nguyên.'
      : 'Đã cập nhật theo dữ liệu mới nhất của bạn.';
  } catch (e) {
    console.warn('[AI] tạo lời khuyên thất bại:', e.message);
    insightNote.value = 'Không tạo được lời khuyên lúc này, bạn thử lại sau ít phút nhé.';
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
.main-content { margin-left: 0; padding: 28px; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 800; }
.page-subtitle { font-size: 0.85rem; color: var(--text-secondary); }
.header-actions { display: flex; align-items: center; gap: 10px; }
.header-tag { font-size: 0.75rem; font-weight: 800; padding: 3px 10px; border-radius: 8px; white-space: nowrap; }

.badge-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 50px; font-size: 0.72rem; font-weight: 700; }
.badge-mint { background: var(--mint-light); color: var(--mint-dark); border: 1.5px solid var(--mint); }
.badge-peach { background: var(--peach-light); color: var(--peach-dark); border: 1.5px solid var(--peach); }
.badge-coral { background: var(--coral-light); color: #c05050; border: 1.5px solid var(--coral); }
.badge-lavender { background: var(--lavender-light); color: #8a6aaa; border: 1.5px solid var(--lavender); }

.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 20px; }
.grid-main { display: grid; grid-template-columns: 1fr 340px; gap: 20px; margin-bottom: 20px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }

.stat-card { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
.stat-card .sc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 4px; border: 2px solid; }
.stat-card .sc-value { font-size: 1.6rem; font-weight: 800; }
.stat-card .sc-label { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; }
.stat-card .sc-change { font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; gap: 3px; }
.sc-icon.mint { background: var(--mint-light); border-color: var(--mint); }
.sc-icon.peach { background: var(--peach-light); border-color: var(--peach); }
.sc-icon.sky { background: var(--sky-light); border-color: var(--sky); }
.sc-icon.lavender { background: var(--lavender-light); border-color: var(--lavender); }

.chart-card { padding: 22px; }
.chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.chart-title { font-size: 1rem; font-weight: 700; }
.chart-tabs { display: flex; gap: 4px; }
.chart-tab { padding: 5px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: 1.5px solid var(--kraft-light); background: transparent; color: var(--text-secondary); transition: var(--transition); }
.chart-tab.active { background: var(--mint-light); border-color: var(--mint-dark); color: var(--text-primary); }
.mood-chart-area { height: 140px; position: relative; margin-bottom: 8px; }
.mood-chart-area :deep(.chart-svg) { width: 100%; height: 100%; }
.chart-labels { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-light); padding: 0 4px; }

.garden-card { padding: 22px; }
.garden-scene { height: 200px; background: linear-gradient(180deg, var(--sky-light) 0%, var(--sky-light) 55%, var(--mint-light) 55%, var(--mint) 100%); border-radius: var(--radius-sm); position: relative; overflow: hidden; margin-bottom: 16px; border: 2px solid var(--mint); }
.garden-sky { position: absolute; top: 0; left: 0; right: 0; height: 55%; }
.g-sun { position: absolute; top: 14px; right: 20px; width: 44px; height: 44px; background: var(--peach); border-radius: 50%; box-shadow: 0 0 20px rgba(255, 203, 164, 0.6); animation: g-float 5s ease-in-out infinite; }
.g-cloud { position: absolute; background: white; border-radius: 50px; opacity: 0.9; }
.g-cloud-1 { top: 16px; left: 20px; width: 60px; height: 22px; animation: g-float 7s ease-in-out infinite; }
.g-cloud-2 { top: 28px; left: 90px; width: 40px; height: 16px; animation: g-float 9s ease-in-out infinite; animation-delay: -3s; }
.g-rainbow { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); width: 100px; height: 50px; border-radius: 50px 50px 0 0; border: 6px solid transparent; border-top: 6px solid rgba(255, 200, 100, 0.4); opacity: 0; transition: opacity 1s; }
.g-rainbow.show { opacity: 1; }
.garden-scene :deep(.garden-tree) { position: absolute; bottom: 0; display: flex; flex-direction: column; align-items: center; }
.garden-scene :deep(.gt-trunk) { background: var(--kraft); border-radius: 3px; }
.garden-scene :deep(.gt-top) { border-left: solid transparent; border-right: solid transparent; border-bottom: solid; }
.garden-scene :deep(.gt-flower) { position: absolute; font-size: 0.8rem; animation: g-float 3s ease-in-out infinite; }
.g-butterfly { position: absolute; font-size: 1rem; animation: g-butterfly 8s ease-in-out infinite; }
.g-butterfly-1 { top: 60px; left: 40%; animation-delay: -2s; }
.g-butterfly-2 { top: 80px; right: 30%; animation-delay: -5s; }
.g-mascot { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-size: 1.8rem; animation: g-bounce 3s ease-in-out infinite; }
@keyframes g-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes g-bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-5px); } }
@keyframes g-butterfly { 0% { transform: translate(0, 0); } 25% { transform: translate(20px, -15px); } 50% { transform: translate(40px, 0); } 75% { transform: translate(20px, 15px); } 100% { transform: translate(0, 0); } }
.garden-legend { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.gl-item { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--text-secondary); }
.gl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.task-card { padding: 16px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; }
.task-card:hover { background: var(--cream); }
.task-icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; border: 2px solid; }
.task-icon-box.emergency { background: #ffe5e5; border-color: var(--coral); }
.task-icon-box.easy { background: var(--mint-light); border-color: var(--mint); }
.task-icon-box.medium { background: #fff3d4; border-color: #f0c040; }
.task-icon-box.hard { background: #ffe8d4; border-color: #e09050; }
.task-info { flex: 1; }
.task-name { font-size: 0.9rem; font-weight: 700; margin-bottom: 2px; }
.task-meta { font-size: 0.72rem; color: var(--text-light); display: flex; gap: 10px; }
.task-xp { font-size: 0.78rem; font-weight: 700; color: var(--peach-dark); background: var(--peach-light); padding: 3px 8px; border-radius: 50px; border: 1.5px solid var(--peach); white-space: nowrap; }
.task-divider { height: 1px; background: var(--kraft-light); margin: 0 18px; }

.xp-card { padding: 22px; }
.xp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.xp-level-badge { display: flex; align-items: center; gap: 8px; }
.xp-level-circle { width: 48px; height: 48px; border-radius: 50%; background: var(--mint-light); border: 3px solid var(--mint-dark); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; color: var(--mint-dark); box-shadow: 3px 3px 0px var(--mint-dark); }
.xp-level-info .xl-name { font-size: 0.88rem; font-weight: 700; }
.xp-level-info .xl-range { font-size: 0.72rem; color: var(--text-light); }
.xp-total { font-size: 1.4rem; font-weight: 800; color: var(--mint-dark); }
.xp-bar-wrap { background: var(--kraft-light); border-radius: 50px; height: 14px; overflow: hidden; margin-bottom: 6px; border: 1.5px solid var(--kraft); }
.xp-bar-fill { height: 100%; background: linear-gradient(90deg, var(--mint-dark), var(--mint)); border-radius: 50px; transition: width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; }
.xp-bar-fill::after { content: ''; position: absolute; top: 2px; left: 8px; right: 8px; height: 4px; background: rgba(255, 255, 255, 0.4); border-radius: 50px; }
.xp-bar-labels { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-light); }

.streak-card { padding: 20px; text-align: center; }
.streak-fire { font-size: 2.5rem; animation: g-float 2s ease-in-out infinite; }
.streak-number { font-size: 2.2rem; font-weight: 800; color: var(--peach-dark); line-height: 1; }
.streak-label { font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 10px; }
.streak-days { display: flex; gap: 5px; justify-content: center; flex-wrap: wrap; }
.streak-day { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; border: 1.5px solid; }
.streak-day.done { background: var(--mint); border-color: var(--mint-dark); color: white; }
.streak-day.today { background: var(--peach); border-color: var(--peach-dark); color: white; }
.streak-day.empty { background: var(--cream); border-color: var(--kraft-light); color: var(--text-light); }

.insight-card { padding: 20px; background: linear-gradient(135deg, var(--mint-light), var(--sky-light)); border-color: var(--mint); }
.insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.insight-icon { width: 36px; height: 36px; background: var(--mint); border-radius: 10px; border: 2px solid var(--mint-dark); display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: 2px 2px 0px var(--mint-dark); }
.insight-title { font-size: 0.88rem; font-weight: 700; }
.insight-text { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 10px; }
.insight-tags { display: flex; gap: 6px; flex-wrap: wrap; }

.radar-card { padding: 22px; }
.radar-wrap { display: flex; align-items: center; gap: 20px; }
.radar-svg-wrap { flex-shrink: 0; }
.radar-legend { display: flex; flex-direction: column; gap: 8px; }
.rl-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; }
.rl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rl-label { color: var(--text-secondary); font-weight: 600; }
.rl-val { font-weight: 800; margin-left: auto; }

.expert-mini-card { padding: 16px 18px; display: flex; align-items: center; gap: 12px; }
.expert-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--lavender-light); border: 2px solid var(--lavender); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
.expert-info { flex: 1; }
.expert-name { font-size: 0.88rem; font-weight: 700; }
.expert-time { font-size: 0.72rem; color: var(--text-light); }
.expert-type { font-size: 0.72rem; font-weight: 700; color: var(--lavender); }

.challenge-card { padding: 20px; background: linear-gradient(135deg, var(--peach-light), var(--lavender-light)); border-color: var(--peach); }
.challenge-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.challenge-title { font-size: 0.92rem; font-weight: 700; }
.challenge-desc { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; }
.challenge-progress-bar { height: 10px; background: rgba(255, 255, 255, 0.5); border-radius: 50px; overflow: hidden; margin-bottom: 6px; border: 1.5px solid rgba(255, 255, 255, 0.7); }
.challenge-progress-fill { height: 100%; background: linear-gradient(90deg, var(--peach-dark), var(--coral)); border-radius: 50px; }
.challenge-meta { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-secondary); }

.section-title { font-size: 1rem; font-weight: 800; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.section-title .st-icon { font-size: 1.1rem; }
.section-title .st-link { font-size: 0.75rem; color: var(--mint-dark); font-weight: 600; margin-left: auto; text-decoration: none; }
.section-title .st-link:hover { text-decoration: underline; }

.checkin-prompt { padding: 18px 22px; background: linear-gradient(135deg, var(--peach-light), var(--mint-light)); border-color: var(--peach); display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.cp-mascot { font-size: 2rem; animation: g-bounce 3s ease-in-out infinite; flex-shrink: 0; }
.cp-text .cp-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 2px; }
.cp-text .cp-sub { font-size: 0.78rem; color: var(--text-secondary); }
.cp-actions { display: flex; gap: 8px; margin-left: auto; flex-shrink: 0; }

@media (max-width: 1100px) {
  .grid-main { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .main-content { margin-left: 0; padding: 16px 16px 20px; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .grid-3 { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .radar-wrap { flex-direction: column; }
  .cp-actions { display: none; }
}
</style>
