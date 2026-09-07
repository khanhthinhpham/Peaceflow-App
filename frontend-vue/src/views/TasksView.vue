<template>
  <div class="tasks-page">
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-icon">❤️</div>
        <div class="ep-title">{{ t('tasksPage.emergency.title') }}</div>
        <p class="ep-text">{{ t('tasksPage.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">{{ t('tasksPage.emergency.hotlineLabel') }}</div>
        </div>
        <div class="ep-actions">
          <a href="tel:0931773637" class="ep-btn ep-btn-red">{{ t('tasksPage.emergency.callBtn') }}</a>
          <router-link to="/experts" class="ep-btn ep-btn-green">{{ t('tasksPage.emergency.connectExpertBtn') }}</router-link>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">{{ t('tasksPage.emergency.closeBtn') }}</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="page-header">
        <div>
          <div class="page-title">{{ t('tasksPage.title') }}</div>
          <div class="page-subtitle">{{ subtitleText }}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <router-link v-if="!guestEmergencyMode" to="/mood-checkin" class="btn-outline">{{ t('tasksPage.checkinBtn') }}</router-link>
          <router-link v-else to="/login" class="btn-outline">{{ t('tasksPage.checkinBtn') }}</router-link>
          <button class="btn-primary" @click="emergencyOpen = true">{{ t('tasksPage.emergencyBtn') }}</button>
        </div>
      </div>

      <div v-if="guestEmergencyMode" class="guest-emergency-note">
        <div class="guest-emergency-note-title">{{ t('tasksPage.guestNote.title') }}</div>
        <div class="guest-emergency-note-text">
          {{ t('tasksPage.guestNote.text') }}
        </div>
        <div class="guest-emergency-note-actions">
          <router-link to="/login" class="btn-primary" style="text-decoration:none;">{{ t('tasksPage.guestNote.loginCta') }}</router-link>
        </div>
      </div>

      <!-- XP Bar -->
      <div class="paper-card xp-topbar">
        <template v-if="guestEmergencyMode">
          <div class="xp-level-badge">!</div>
          <div class="xp-info">
            <div class="xi-name">{{ t('tasksPage.xpTopbar.guestTitle') }}</div>
            <div class="xi-range">{{ t('tasksPage.xpTopbar.guestDesc') }}</div>
          </div>
        </template>
        <template v-else>
          <div class="xp-level-badge">{{ xpInfo.level }}</div>
          <div class="xp-info">
            <div class="xi-name">{{ xpInfo.title }}</div>
            <div class="xi-range">{{ t('tasksPage.xpTopbar.levelRange', { level: xpInfo.level, min: xpInfo.minXP, max: xpInfo.maxXPLabel }) }}</div>
          </div>
          <div class="xp-bar-wrap">
            <div class="xp-bar-bg">
              <div class="xp-bar-fill" :style="{ width: xpInfo.percent + '%' }"></div>
            </div>
            <div class="xp-bar-label"><span>{{ xpInfo.minXP }} XP</span><span>{{ xpInfo.nextLabel }}</span><span>{{ xpInfo.maxXPLabel }} XP</span></div>
          </div>
          <div class="xp-total">{{ xpInfo.xp }} XP</div>
        </template>
      </div>

      <!-- AI Suggestion -->
      <div class="paper-card ai-suggestion">
        <template v-if="guestEmergencyMode">
          <div class="ai-mascot">🆘</div>
          <div class="ai-text">
            <div class="at-title">{{ t('tasksPage.aiSuggestion.guestTitle') }}</div>
            <div class="at-sub">{{ t('tasksPage.aiSuggestion.guestDesc') }}</div>
          </div>
          <div class="ai-actions">
            <router-link to="/login" class="btn-primary" style="text-decoration:none;">{{ t('tasksPage.guestNote.loginCta') }}</router-link>
          </div>
        </template>
        <template v-else>
          <div class="ai-mascot">🐱</div>
          <div class="ai-text">
            <div class="at-title">{{ t('tasksPage.aiSuggestion.title') }}</div>
            <div class="at-sub">{{ suggestionBannerText }}</div>
          </div>
          <div class="ai-actions">
            <button class="btn-primary" @click="scrollToSuggested">{{ t('tasksPage.aiSuggestion.viewBtn') }}</button>
          </div>
        </template>
      </div>

      <!-- Weekly Challenge -->
      <div class="paper-card weekly-challenge">
        <template v-if="guestEmergencyMode">
          <div class="wc-header">
            <span style="font-size:1.3rem;">💛</span>
            <div class="wc-title">{{ t('tasksPage.challenge.guestTitle') }}</div>
          </div>
          <div class="wc-desc">{{ t('tasksPage.challenge.guestDesc') }}</div>
        </template>
        <template v-else>
          <div class="wc-header">
            <span style="font-size:1.3rem;">🏆</span>
            <div class="wc-title">{{ challenge?.title || t('tasksPage.challenge.defaultTitle') }}</div>
            <span class="badge-pill badge-peach" style="margin-left:auto;">{{ t('tasksPage.challenge.daysLeft', { n: challenge?.days_left ?? 0 }) }}</span>
          </div>
          <div class="wc-desc">{{ challenge?.description || t('tasksPage.challenge.defaultDesc') }}</div>
          <div class="wc-progress-bar">
            <div class="wc-progress-fill" :style="{ width: challengePercent + '%' }"></div>
          </div>
          <div class="wc-meta"><span>{{ challenge?.completed ?? 0 }}/{{ challenge?.goal ?? 7 }} {{ t('tasksPage.challenge.tasksMeta') }}</span><span>{{ challenge?.reward_label || t('tasksPage.challenge.defaultReward') }}</span></div>
        </template>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <template v-if="!guestEmergencyMode">
          <button class="filter-btn" :class="{ active: activeFilter === 'all' }" @click="setFilter('all')">{{ t('tasksPage.filters.all') }}</button>
          <button class="filter-btn emergency-filter" :class="{ active: activeFilter === 'emergency' }" @click="setFilter('emergency')">{{ t('tasksPage.filters.emergency') }}</button>
          <button class="filter-btn easy-filter" :class="{ active: activeFilter === 'easy' }" @click="setFilter('easy')">{{ t('tasksPage.filters.easy') }}</button>
          <button class="filter-btn medium-filter" :class="{ active: activeFilter === 'medium' }" @click="setFilter('medium')">{{ t('tasksPage.filters.medium') }}</button>
          <button class="filter-btn hard-filter" :class="{ active: activeFilter === 'hard' }" @click="setFilter('hard')">{{ t('tasksPage.filters.hard') }}</button>
          <button class="filter-btn" :class="{ active: activeFilter === 'completed' }" @click="setFilter('completed')">{{ t('tasksPage.filters.completed') }}</button>
          <input type="text" class="search-input" :placeholder="t('tasksPage.filters.searchPlaceholder')" :value="searchQuery" @input="searchQuery = $event.target.value">
        </template>
        <template v-else>
          <button class="filter-btn emergency-filter active">{{ t('tasksPage.filters.emergency') }}</button>
        </template>
      </div>

      <!-- Task Sections -->
      <div v-if="loadError" style="text-align:center;padding:40px;color:var(--coral);">{{ loadError }}</div>
      <div v-else-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('tasksPage.list.loading') }}</div>
      <div v-else-if="!filteredTasks.length" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('tasksPage.list.empty') }}</div>
      <div v-else id="taskSections">
        <div v-for="section in groupedSections" :key="section.id" class="task-section">
          <div class="section-header">
            <div class="sh-icon" :class="section.iconClass">⭐</div>
            <div class="sh-title">{{ t(section.titleKey) }}</div>
            <div class="sh-count">{{ t('tasksPage.sections.count', { n: section.tasks.length }) }}</div>
            <div class="sh-desc">{{ t(section.descKey) }}</div>
          </div>
          <div class="task-grid">
            <div
              v-for="task in section.tasks"
              :key="task.id"
              class="task-card paper-card"
              :class="[`cat-${getTaskSectionId(task)}`, { completed: task.completed }]"
              @click="goToTask(task)"
            >
              <div class="tc-top">
                <div class="tc-icon" :class="getTaskSectionId(task)">{{ getTaskIcon(task) }}</div>
                <div class="tc-info">
                  <div class="tc-name">{{ task.title || t('tasksPage.card.defaultTitle') }}</div>
                  <div class="tc-meta">
                    <div class="tc-meta-item">⏱ {{ getTaskDurationLabel(task) }}</div>
                    <div v-if="recommendedIds.has(task.id)" class="tc-meta-item" style="color:var(--peach-dark);">{{ t('tasksPage.card.suggestedToday') }}</div>
                    <div v-if="task.in_progress && !task.completed" class="tc-meta-item" style="color:var(--blue);">{{ t('tasksPage.card.inProgress') }}</div>
                    <div v-if="task.completed" class="tc-meta-item" style="color:var(--mint-dark);">{{ t('tasksPage.card.completedCount', { n: task.completion_count || 1 }) }}</div>
                  </div>
                </div>
              </div>
              <div class="tc-desc">{{ getTaskDescription(task) }}</div>
              <div class="tc-bottom">
                <div class="tc-xp">+{{ task.xp_reward || 0 }} XP</div>
                <button
                  class="tc-start-btn"
                  :class="{ emergency: getTaskSectionId(task) === 'emergency' }"
                  @click.stop="goToTask(task)"
                >{{ task.completed ? t('tasksPage.card.reviewBtn') : task.in_progress ? t('tasksPage.card.continueBtn') : t('tasksPage.card.startBtn') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';
import { buildGuestEmergencyTasksFallback } from '../lib/taskFallbackData';
import { getLevelInfo, getLevelProgress } from '../lib/dashboardHelpers';

// titleKey/descKey thay vì chuỗi tiếng Việt cứng — dịch qua t() ở nơi dùng (template).
const SECTION_CONFIG = [
  { id: 'emergency', titleKey: 'tasksPage.sections.emergencyTitle', descKey: 'tasksPage.sections.emergencyDesc', iconClass: 'emergency' },
  { id: 'easy', titleKey: 'tasksPage.sections.easyTitle', descKey: 'tasksPage.sections.easyDesc', iconClass: 'easy' },
  { id: 'medium', titleKey: 'tasksPage.sections.mediumTitle', descKey: 'tasksPage.sections.mediumDesc', iconClass: 'medium' },
  { id: 'hard', titleKey: 'tasksPage.sections.hardTitle', descKey: 'tasksPage.sections.hardDesc', iconClass: 'hard' }
];

const { t, tm } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const allTasks = ref([]);
const dashboard = ref(null);
const recommendedIds = reactive(new Set());
const aiExercises = ref([]);
const activeFilter = ref('all');
const searchQuery = ref('');
const guestEmergencyMode = ref(false);
const emergencyOpen = ref(false);
const loading = ref(true);
const loadError = ref('');

function getTaskIcon(task) {
  return task?.metadata?.icon || task?.icon || '🌱';
}
function getTaskDurationLabel(task) {
  const minutes = Number(task?.duration_minutes || 0);
  if (!minutes) return t('tasksPage.card.defaultDuration');
  return minutes === 1 ? t('tasksPage.card.oneMinute') : t('tasksPage.card.minutes', { n: minutes });
}
function getTaskDescription(task) {
  // task?.description/metadata?.objective là NỘI DUNG NHIỆM VỤ thật (từ API hoặc file
  // fallback khẩn cấp) — ngoài phạm vi đợt dịch tĩnh này (giống task.title ở Dashboard).
  // Chỉ dịch câu dự phòng khi nhiệm vụ chưa có mô tả.
  return task?.description || task?.metadata?.objective || t('tasksPage.card.defaultDescription');
}
function isEmergencyTask(task) {
  return task?.category === 'emergency';
}
function getTaskSectionId(task) {
  if (isEmergencyTask(task)) return 'emergency';
  return task?.difficulty || 'easy';
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }
  return [];
}

function getFilterMatch(task, filter) {
  if (filter === 'all') return true;
  if (filter === 'completed') return Boolean(task.completed);
  if (filter === 'suggested') return recommendedIds.has(task.id);
  if (filter === 'emergency') return isEmergencyTask(task);
  return !isEmergencyTask(task) && task.difficulty === filter;
}

const filteredTasks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return allTasks.value.filter((task) => {
    if (!getFilterMatch(task, activeFilter.value)) return false;
    if (!query) return true;
    const haystack = [task.title, task.description, task.code, ...normalizeArray(task.tags)]
      .filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });
});

const groupedSections = computed(() => SECTION_CONFIG
  .map((section) => ({ ...section, tasks: filteredTasks.value.filter((t) => getTaskSectionId(t) === section.id) }))
  .filter((section) => section.tasks.length));

const subtitleText = computed(() => {
  if (guestEmergencyMode.value) return t('tasksPage.subtitleGuest');
  return t('tasksPage.subtitleUser', { n: allTasks.value.length });
});

// Đây là bản đồ trạng thái tĩnh (key cố định 'critical'/'high'/...), không phải nội dung
// AI sinh tự do — dịch được, giống getRiskLabel bên dashboardHelpers.js.
function getRiskLabel(level) {
  if (level === 'critical') return t('tasksPage.risk.critical');
  if (level === 'high') return t('tasksPage.risk.high');
  if (level === 'moderate') return t('tasksPage.risk.moderate');
  return t('tasksPage.risk.stable');
}

const suggestionBannerText = computed(() => {
  // Ưu tiên bài tập AI (Gemini) đã chọn ở daily message trên Dashboard — cùng nguồn
  // dữ liệu tâm trạng/xu hướng gần đây, cụ thể hơn bộ máy quy tắc chung (dashboard.tasks).
  // ex.title là tên nhiệm vụ THẬT (dữ liệu backend/AI) — không dịch, chỉ dịch câu bao quanh.
  if (aiExercises.value.length) {
    const names = aiExercises.value.map((ex) => ex.title).filter(Boolean).join(', ');
    return t('tasksPage.aiSuggestion.aiText', { n: aiExercises.value.length, names });
  }

  const recommendedTasks = Array.isArray(dashboard.value?.tasks) ? dashboard.value.tasks : [];
  const latestMood = dashboard.value?.latest_mood;
  const summary = dashboard.value?.summary || {};
  const moodText = latestMood?.mood_score !== null && latestMood?.mood_score !== undefined
    ? t('tasksPage.aiSuggestion.moodRecent', { score: latestMood.mood_score })
    : t('tasksPage.aiSuggestion.moodNone');
  return recommendedTasks.length
    ? t('tasksPage.aiSuggestion.ruleBasedText', { n: recommendedTasks.length, moodText, risk: getRiskLabel(summary.risk_level) })
    : t('tasksPage.aiSuggestion.noSuggestion');
});

const challenge = computed(() => dashboard.value?.challenge || null);
const challengePercent = computed(() => Math.max(0, Math.min(100, challenge.value?.progress_percent ?? 0)));

const xpInfo = computed(() => {
  const progress = dashboard.value?.progress;
  const xp = progress?.xp ?? progress?.total_xp ?? 0;
  const level = progress?.level ?? progress?.current_level ?? 1;
  const levelInfo = progress?.level_info || getLevelInfo(xp);
  const percent = levelInfo?.progress_percent ?? getLevelProgress(xp);
  const maxXP = levelInfo.maxXP === Infinity ? '∞' : levelInfo.maxXP;
  const nextLabel = levelInfo.maxXP === Infinity
    ? t('dashboard.levels.maxLevel')
    : t('dashboard.levels.nextLevel', { xp: levelInfo.xp_to_next ?? 0, level: level + 1 });
  // levelInfo.title là dữ liệu BACKEND (progress?.level_info, tiếng Việt) khi có; fallback
  // cục bộ (getLevelInfo) giờ chỉ có labelKey — xem giải thích tương tự ở DashboardView.vue.
  const title = levelInfo.title || (levelInfo.labelKey ? t(levelInfo.labelKey) : `Level ${level}`);
  return { xp, level, title, minXP: levelInfo.minXP ?? 0, maxXPLabel: maxXP, percent, nextLabel };
});

function setFilter(cat) {
  activeFilter.value = cat;
}

function scrollToSuggested() {
  if (guestEmergencyMode.value) {
    document.getElementById('taskSections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  activeFilter.value = 'suggested';
  document.getElementById('taskSections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function parseTaskMeta(task) {
  if (!task?.metadata) return {};
  if (typeof task.metadata === 'string') {
    try { return JSON.parse(task.metadata); } catch { return {}; }
  }
  return task.metadata;
}

function goToTask(task) {
  const meta = parseTaskMeta(task);
  const title = String(task.title || '').toLowerCase();
  const query = guestEmergencyMode.value ? { guest_emergency: '1' } : {};

  if (meta.legacy_code === 'E2' || task.code === 'E2_DEEP_BREATHING') {
    router.push({ path: '/task-breathing', query });
    return;
  }
  // title.includes('thiền') so khớp NHIỆM VỤ THẬT từ backend (chưa dịch, ngoài phạm vi đợt
  // này — xem getTaskDescription ở trên) — không phụ thuộc ngôn ngữ UI đang chọn nên vẫn an
  // toàn dù đây là fallback cuối, sau 3 điều kiện khác đáng tin cậy hơn.
  if (meta.legacy_code === '2.3' || task.code === '2.3' || task.category === 'meditation' || title.includes('thiền')) {
    router.push({ path: '/task-meditation', query });
    return;
  }

  router.push({ path: '/task-detail', query: { ...query, id: task.id } });
}

async function loadTaskPage() {
  loading.value = true;
  loadError.value = '';

  const isAuthenticated = auth.isAuthenticated;
  guestEmergencyMode.value = isGuestEmergencyModeActive(isAuthenticated);

  if (!isAuthenticated && guestEmergencyMode.value) {
    try {
      const publicEmergencyTasks = await apiClient.request('/tasks/public-emergency', { method: 'GET' }, { retryAuth: false });
      const guestTasks = Array.isArray(publicEmergencyTasks) && publicEmergencyTasks.length
        ? publicEmergencyTasks
        : buildGuestEmergencyTasksFallback(t, tm);

      allTasks.value = guestTasks;
      recommendedIds.clear();
    } finally {
      loading.value = false;
    }
    return;
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return;
  }

  try {
    const [tasks, dashboardData] = await Promise.all([
      apiClient.get('/tasks'),
      apiClient.get('/dashboard')
    ]);

    allTasks.value = Array.isArray(tasks) ? tasks : [];
    dashboard.value = dashboardData || null;
    recommendedIds.clear();
    (dashboardData?.tasks || []).forEach((t) => recommendedIds.add(t.id));

    // Bổ sung AI exercises từ localStorage
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const uid = auth.user?.id || 'guest';
    const aiCache = localStorage.getItem(`peaceflow_ai_insight_${uid}_${today}`);
    if (aiCache) {
      try {
        const { exercises = [] } = JSON.parse(aiCache);
        aiExercises.value = exercises;
        exercises.forEach((ex) => {
          if (ex.id) recommendedIds.add(ex.id);
        });
      } catch (_e) { /* ignore corrupted cache */ }
    }
  } catch (error) {
    console.error('Failed to load tasks page:', error);
    loadError.value = t('tasksPage.list.loadError');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTaskPage();
});
</script>

<style scoped src="../assets/tasks.css"></style>
