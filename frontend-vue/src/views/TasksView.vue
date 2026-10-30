<template>
  <div class="tasks-page">
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-title">{{ t('tasksPage.emergency.title') }}</div>
        <p class="ep-text">{{ t('tasksPage.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">0931773637</div>
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
      <!-- Hàng đầu: thẻ cấp độ/XP bên trái, nút check-in + khẩn cấp bên phải. -->
      <div class="page-header">
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
        <div class="tasks-header-actions">
          <button class="btn-primary btn-emergency" @click="emergencyOpen = true">{{ t('tasksPage.emergencyBtn') }}</button>
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

      <!-- Gợi ý AI + thử thách tuần nằm chung một hàng -->
      <div class="tasks-top-row">
      <!-- AI Suggestion -->
      <div class="paper-card ai-suggestion">
        <template v-if="guestEmergencyMode">
          <div class="ai-text">
            <div class="at-title">{{ t('tasksPage.aiSuggestion.guestTitle') }}</div>
            <div class="at-sub">{{ t('tasksPage.aiSuggestion.guestDesc') }}</div>
          </div>
          <div class="ai-actions">
            <router-link to="/login" class="btn-primary" style="text-decoration:none;">{{ t('tasksPage.guestNote.loginCta') }}</router-link>
          </div>
        </template>
        <template v-else>
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
            <div class="wc-title">{{ t('tasksPage.challenge.guestTitle') }}</div>
          </div>
          <div class="wc-desc">{{ t('tasksPage.challenge.guestDesc') }}</div>
        </template>
        <template v-else>
          <div class="wc-header">
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

      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <template v-if="!guestEmergencyMode">
          <div class="filter-dropdown-wrap">
            <button type="button" class="filter-dropdown-btn" data-task-filter-btn @click="filterOpen = !filterOpen">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              {{ filterLabel(activeFilter) }}
              <span class="fd-caret">▾</span>
            </button>
            <div v-if="filterOpen" ref="filterDropdownEl" class="filter-dropdown-menu">
              <button type="button" class="fdm-item" :class="{ active: activeFilter === 'all' }" @click="setFilter('all'); filterOpen = false">{{ t('tasksPage.filters.all') }}</button>
              <button type="button" class="fdm-item" :class="{ active: activeFilter === 'emergency' }" @click="setFilter('emergency'); filterOpen = false">{{ t('tasksPage.filters.emergency') }}</button>
              <button type="button" class="fdm-item" :class="{ active: activeFilter === 'easy' }" @click="setFilter('easy'); filterOpen = false">{{ t('tasksPage.filters.easy') }}</button>
              <button type="button" class="fdm-item" :class="{ active: activeFilter === 'medium' }" @click="setFilter('medium'); filterOpen = false">{{ t('tasksPage.filters.medium') }}</button>
              <button type="button" class="fdm-item" :class="{ active: activeFilter === 'hard' }" @click="setFilter('hard'); filterOpen = false">{{ t('tasksPage.filters.hard') }}</button>
              <button type="button" class="fdm-item" :class="{ active: activeFilter === 'completed' }" @click="setFilter('completed'); filterOpen = false">{{ t('tasksPage.filters.completed') }}</button>
            </div>
          </div>
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
                <div class="tc-icon" :class="getTaskSectionId(task)">
                  <img v-if="task.code && !brokenTaskImages.has(task.code)" :src="taskThumbSrc(task)" :alt="task.title" class="tc-icon-img" loading="lazy" @error="brokenTaskImages.add(task.code)">
                  <template v-else>{{ getTaskIcon(task) }}</template>
                </div>
                <div class="tc-info">
                  <div class="tc-name">{{ task.title || t('tasksPage.card.defaultTitle') }}</div>
                  <div class="tc-meta">
                    <div class="tc-meta-item">{{ getTaskDurationLabel(task) }}</div>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { taskThumbSrc } from '../lib/taskImages';
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
const brokenTaskImages = reactive(new Set());
const aiExercises = ref([]);
const activeFilter = ref('all');
const searchQuery = ref('');
const filterOpen = ref(false);
const filterDropdownEl = ref(null);
const TASK_FILTER_LABEL_KEYS = {
  all: 'tasksPage.filters.all', emergency: 'tasksPage.filters.emergency', easy: 'tasksPage.filters.easy',
  medium: 'tasksPage.filters.medium', hard: 'tasksPage.filters.hard', completed: 'tasksPage.filters.completed'
};
function filterLabel(filter) {
  return t(TASK_FILTER_LABEL_KEYS[filter] || filter);
}
function handleFilterOutsideClick(event) {
  if (!filterOpen.value) return;
  if (filterDropdownEl.value && filterDropdownEl.value.contains(event.target)) return;
  if (event.target.closest('[data-task-filter-btn]')) return;
  filterOpen.value = false;
}
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
  document.addEventListener('click', handleFilterOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleFilterOutsideClick);
});
</script>

<style scoped src="../assets/tasks.css"></style>
<style scoped>
/* Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, khối phẳng bo mềm, chữ
   Inter/tiêu đề --font-heading, nút phẳng. CHỈ áp cho phần khung trang (header, thanh XP, gợi ý,
   thử thách tuần, bộ lọc, tiêu đề nhóm, popup) — thẻ nhiệm vụ (.task-card, .tc-*, .paper-card
   của thẻ) cùng hover/animation của chúng giữ nguyên như tasks.css. Không đặt font ở gốc trang
   để thẻ nhiệm vụ vẫn kế thừa font cũ. */
.tasks-page { background: var(--color-canvas); position: relative; isolation: isolate; min-height: 100vh; }
.tasks-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9  ; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { padding: 20px 20px 32px; }

.page-header, .guest-emergency-note, .xp-topbar, .ai-suggestion, .weekly-challenge, .filter-bar, .section-header, .emergency-popup {
  font-family: var(--font-body); color: var(--color-text); -webkit-font-smoothing: antialiased;
}
.page-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); }
.page-subtitle { font-size: 14px; color: var(--color-text-muted); margin-top: 2px; }

/* Nút ở khung trang: phẳng như .pf-btn-* của Dashboard (nút "Bắt đầu" trên thẻ là .tc-start-btn, không đổi). */
.page-header .btn-primary, .page-header .btn-outline,
.guest-emergency-note .btn-primary, .ai-actions .btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 8px 16px; border: none; border-radius: var(--radius-control); box-shadow: none; transform: none;
  font-family: var(--font-body); font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.page-header .btn-primary, .guest-emergency-note .btn-primary, .ai-actions .btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.page-header .btn-primary:hover, .guest-emergency-note .btn-primary:hover, .ai-actions .btn-primary:hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); box-shadow: none; transform: none; }
/* Nút khẩn cấp dùng màu danger như .pf-btn-danger của Dashboard (an toàn, không dùng xanh thương hiệu). */
.page-header .btn-emergency, .page-header .btn-emergency:hover { background: var(--color-danger); color: #fff; }
.page-header .btn-outline { background: var(--color-surface-muted); color: var(--color-text); }
.page-header .btn-outline:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.tasks-page :is(.page-header, .ai-actions, .filter-bar) :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

/* Khối trên đầu: thẻ trắng bo mềm, không viền/bóng giấy. */
.xp-topbar, .ai-suggestion, .weekly-challenge, .guest-emergency-note {
  background: var(--color-surface); border: none; border-radius: var(--radius-card); box-shadow: none;
}
.xp-topbar { padding: 16px 22px; }
.page-header { flex-wrap: nowrap; gap: 16px; align-items: center; }
.page-header > .xp-topbar { flex: 1 1 auto; min-width: 0; margin: 0; }
.tasks-header-actions { display: flex; gap: 8px; margin-right: 120px; flex-shrink: 0; }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .page-header { flex-wrap: wrap; }
  .page-header > .xp-topbar { flex-basis: 100%; }
  /* Mobile đã có nút SOS cố định trên thanh trên cùng — bỏ nút Khẩn cấp trùng ở đây. */
  .tasks-header-actions { display: none; }
  /* tasks.css ẩn nút "Xem gợi ý" trên mobile — hiện lại, nằm dưới đoạn gợi ý, rộng hết thẻ. */
  .ai-suggestion { flex-wrap: wrap; }
  .ai-suggestion > .ai-text { flex: 1 1 100%; }
  .ai-actions { display: flex; flex: 1 1 100%; margin-left: 0; }
  .ai-actions .btn-primary { width: 100%; }
}
.tasks-top-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.tasks-top-row > .ai-suggestion, .tasks-top-row > .weekly-challenge { margin-bottom: 0; }
@media (max-width: 900px) {
  .tasks-top-row { grid-template-columns: 1fr; }
}
.xp-level-badge { border: none; box-shadow: none; background: var(--color-brand-soft); color: var(--color-brand); font-family: var(--font-heading); }
.xp-info .xi-name, .ai-text .at-title, .wc-title { font-family: var(--font-heading); font-size: 16px; font-weight: 800; color: var(--color-text); }
.xp-info .xi-range, .ai-text .at-sub, .wc-desc, .xp-bar-label, .wc-meta { color: var(--color-text-muted); }
.ai-text .at-sub, .wc-desc { font-size: 14px; }
.xp-bar-bg, .wc-progress-bar { border: none; background: var(--color-surface-muted); }
.xp-bar-fill { background: var(--color-brand); }
.wc-progress-fill { background: var(--color-terracotta); }
.xp-total { font-family: var(--font-heading); color: var(--color-brand); }
.weekly-challenge .badge-pill { border: none; background: var(--color-terracotta-soft); color: var(--color-terracotta); font-size: 12px; }

/* Bộ lọc + ô tìm kiếm. */
.filter-dropdown-btn {
  border: none; border-radius: var(--radius-control); background: var(--color-surface);
  font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--color-text); min-height: 36px;
}
.filter-dropdown-btn:hover { background: var(--color-brand-soft); color: var(--color-brand); border: none; }
.filter-dropdown-menu { border: none; border-radius: var(--radius-card); background: var(--color-surface); box-shadow: var(--shadow-soft); }
.fdm-item { font-family: var(--font-body); font-size: 14px; border-radius: var(--radius-control); color: var(--color-text); }
.fdm-item:hover { background: var(--color-canvas); }
.fdm-item.active { background: var(--color-brand-soft); color: var(--color-brand); }
.search-input {
  border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-surface);
  font-family: var(--font-body); font-size: 14px; color: var(--color-text); min-height: 36px;
}
.search-input:focus { border-color: var(--color-brand); }

/* Tiêu đề nhóm nhiệm vụ. */
.section-header { border-bottom: 1px solid var(--color-surface-muted); }
.sh-icon { border: none; border-radius: var(--radius-control); }
.sh-title { font-family: var(--font-heading); font-size: 19px; font-weight: 800; color: var(--color-text); }
.sh-count { color: var(--color-text-subtle); font-size: 12px; }
.sh-desc { color: var(--color-text-muted); font-size: 13px; }

/* Popup khẩn cấp giống bản ở trang check-in. */
.emergency-popup { border: none; border-radius: var(--radius-panel); box-shadow: var(--shadow-soft); }
.ep-btn { border: none; border-radius: var(--radius-control); box-shadow: none; font-family: var(--font-body); }
</style>
