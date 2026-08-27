<template>
  <div class="tasks-page">
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-icon">❤️</div>
        <div class="ep-title">Bạn không đơn độc</div>
        <p class="ep-text">Nếu bạn đang cảm thấy rất khó khăn, hãy để ai đó giúp bạn ngay bây giờ.</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">Đường dây nóng sức khỏe tâm thần — Miễn phí, 24/7</div>
        </div>
        <div class="ep-actions">
          <a href="tel:1800599920" class="ep-btn ep-btn-red">📞 Gọi ngay hotline</a>
          <router-link to="/experts" class="ep-btn ep-btn-green">💬 Kết nối chuyên gia</router-link>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">Tôi ổn, đóng lại</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="page-header">
        <div>
          <div class="page-title">🎮 Nhiệm Vụ</div>
          <div class="page-subtitle">{{ subtitleText }}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <router-link v-if="!guestEmergencyMode" to="/mood-checkin" class="btn-outline">💭 Check-in tâm trạng</router-link>
          <router-link v-else to="/login" class="btn-outline">💭 Check-in tâm trạng</router-link>
          <button class="btn-primary" @click="emergencyOpen = true">🆘 Khẩn cấp</button>
        </div>
      </div>

      <div v-if="guestEmergencyMode" class="guest-emergency-note">
        <div class="guest-emergency-note-title">Bạn đang ở chế độ hỗ trợ khẩn cấp</div>
        <div class="guest-emergency-note-text">
          Hiện tại PeaceFlow chỉ mở các bài tập khẩn cấp để bạn ổn định lại trước. Đăng nhập để xem đầy đủ thư viện nhiệm vụ, nhật ký và các gợi ý cá nhân hóa.
        </div>
        <div class="guest-emergency-note-actions">
          <router-link to="/login" class="btn-primary" style="text-decoration:none;">Đăng nhập để xem thêm nhiều bài tập</router-link>
        </div>
      </div>

      <!-- XP Bar -->
      <div class="paper-card xp-topbar">
        <template v-if="guestEmergencyMode">
          <div class="xp-level-badge">!</div>
          <div class="xp-info">
            <div class="xi-name">Chế độ hỗ trợ khẩn cấp</div>
            <div class="xi-range">Không cần tài khoản để bắt đầu các bài tập ổn định cảm xúc cơ bản.</div>
          </div>
        </template>
        <template v-else>
          <div class="xp-level-badge">{{ xpInfo.level }}</div>
          <div class="xp-info">
            <div class="xi-name">{{ xpInfo.title }}</div>
            <div class="xi-range">Level {{ xpInfo.level }} · {{ xpInfo.minXP }} – {{ xpInfo.maxXPLabel }} XP</div>
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
            <div class="at-title">Hãy bắt đầu với một bài tập ngắn</div>
            <div class="at-sub">Nếu bạn đang quá tải, hãy chọn một bài thở hoặc thiền khẩn cấp bên dưới. Khi cần thêm nội dung, hãy đăng nhập để mở toàn bộ nhiệm vụ của PeaceFlow.</div>
          </div>
          <div class="ai-actions">
            <router-link to="/login" class="btn-primary" style="text-decoration:none;">Đăng nhập để xem thêm nhiều bài tập</router-link>
          </div>
        </template>
        <template v-else>
          <div class="ai-mascot">🐱</div>
          <div class="ai-text">
            <div class="at-title">🤖 PeaceCat gợi ý hôm nay</div>
            <div class="at-sub">{{ suggestionBannerText }}</div>
          </div>
          <div class="ai-actions">
            <button class="btn-primary" @click="scrollToSuggested">Xem gợi ý →</button>
          </div>
        </template>
      </div>

      <!-- Weekly Challenge -->
      <div class="paper-card weekly-challenge">
        <template v-if="guestEmergencyMode">
          <div class="wc-header">
            <span style="font-size:1.3rem;">💛</span>
            <div class="wc-title">Bạn không cần làm mọi thứ cùng lúc</div>
          </div>
          <div class="wc-desc">Hãy ưu tiên một bài tập ngắn để cơ thể hạ nhịp trước. Sau đó bạn có thể đăng nhập để theo dõi tiến trình và mở thêm nhiều bài tập khác.</div>
        </template>
        <template v-else>
          <div class="wc-header">
            <span style="font-size:1.3rem;">🏆</span>
            <div class="wc-title">{{ challenge?.title || 'Mục tiêu tuần này' }}</div>
            <span class="badge-pill badge-peach" style="margin-left:auto;">{{ challenge?.days_left ?? 0 }} ngày còn lại</span>
          </div>
          <div class="wc-desc">{{ challenge?.description || 'Giữ nhịp hoàn thành nhiệm vụ đều đặn trong tuần này.' }}</div>
          <div class="wc-progress-bar">
            <div class="wc-progress-fill" :style="{ width: challengePercent + '%' }"></div>
          </div>
          <div class="wc-meta"><span>{{ challenge?.completed ?? 0 }}/{{ challenge?.goal ?? 7 }} nhiệm vụ</span><span>{{ challenge?.reward_label || 'Giữ nhịp chăm sóc bản thân' }}</span></div>
        </template>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <template v-if="!guestEmergencyMode">
          <button class="filter-btn" :class="{ active: activeFilter === 'all' }" @click="setFilter('all')">🌿 Tất cả</button>
          <button class="filter-btn emergency-filter" :class="{ active: activeFilter === 'emergency' }" @click="setFilter('emergency')">🔴 Khẩn cấp</button>
          <button class="filter-btn easy-filter" :class="{ active: activeFilter === 'easy' }" @click="setFilter('easy')">🟢 Dễ</button>
          <button class="filter-btn medium-filter" :class="{ active: activeFilter === 'medium' }" @click="setFilter('medium')">🟡 Trung bình</button>
          <button class="filter-btn hard-filter" :class="{ active: activeFilter === 'hard' }" @click="setFilter('hard')">🟠 Nâng cao</button>
          <button class="filter-btn" :class="{ active: activeFilter === 'completed' }" @click="setFilter('completed')">✅ Đã hoàn thành</button>
          <input type="text" class="search-input" placeholder="🔍 Tìm nhiệm vụ..." :value="searchQuery" @input="searchQuery = $event.target.value">
        </template>
        <template v-else>
          <button class="filter-btn emergency-filter active">🔴 Khẩn cấp</button>
        </template>
      </div>

      <!-- Task Sections -->
      <div v-if="loadError" style="text-align:center;padding:40px;color:var(--coral);">{{ loadError }}</div>
      <div v-else-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">Đang tải danh sách nhiệm vụ từ hệ thống...</div>
      <div v-else-if="!filteredTasks.length" style="text-align:center;padding:40px;color:var(--text-secondary);">Không tìm thấy nhiệm vụ phù hợp với bộ lọc hiện tại.</div>
      <div v-else id="taskSections">
        <div v-for="section in groupedSections" :key="section.id" class="task-section">
          <div class="section-header">
            <div class="sh-icon" :class="section.iconClass">⭐</div>
            <div class="sh-title">{{ section.title }}</div>
            <div class="sh-count">{{ section.tasks.length }} nhiệm vụ</div>
            <div class="sh-desc">{{ section.description }}</div>
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
                  <div class="tc-name">{{ task.title || 'Nhiệm vụ' }}</div>
                  <div class="tc-meta">
                    <div class="tc-meta-item">⏱ {{ getTaskDurationLabel(task) }}</div>
                    <div v-if="recommendedIds.has(task.id)" class="tc-meta-item" style="color:var(--peach-dark);">⭐ Gợi ý hôm nay</div>
                    <div v-if="task.in_progress && !task.completed" class="tc-meta-item" style="color:var(--blue);">⏳ Đang thực hiện</div>
                    <div v-if="task.completed" class="tc-meta-item" style="color:var(--mint-dark);">✓ Đã hoàn thành {{ task.completion_count || 1 }} lần</div>
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
                >{{ task.completed ? 'Xem lại' : task.in_progress ? 'Tiếp tục' : 'Bắt đầu' }}</button>
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
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';
import { GUEST_EMERGENCY_TASKS_FALLBACK } from '../lib/taskFallbackData';
import { getLevelInfo, getLevelProgress } from '../lib/dashboardHelpers';

const SECTION_CONFIG = [
  { id: 'emergency', title: '🔴 Khẩn Cấp', description: 'Ưu tiên thực hiện ngay khi cảm xúc đang quá tải.', iconClass: 'emergency' },
  { id: 'easy', title: '🟢 Dễ', description: 'Các nhiệm vụ ngắn để giữ nhịp chăm sóc bản thân mỗi ngày.', iconClass: 'easy' },
  { id: 'medium', title: '🟡 Trung Bình', description: 'Cần thêm chút thời gian tập trung hoặc không gian yên tĩnh.', iconClass: 'medium' },
  { id: 'hard', title: '🟠 Nâng Cao', description: 'Nhiệm vụ dài hơn, phù hợp khi bạn có đủ năng lượng để đào sâu.', iconClass: 'hard' }
];

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
  if (!minutes) return 'Tùy chọn';
  return minutes === 1 ? '1 phút' : `${minutes} phút`;
}
function getTaskDescription(task) {
  return task?.description || task?.metadata?.objective || 'Nhiệm vụ này chưa có mô tả chi tiết.';
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
  if (guestEmergencyMode.value) return 'Chỉ hiển thị các bài tập khẩn cấp dành cho khách chưa đăng nhập.';
  return `Bạn đang có ${allTasks.value.length} nhiệm vụ khả dụng từ hệ thống gợi ý và thư viện bài tập.`;
});

function getRiskLabel(level) {
  if (level === 'critical') return 'rất cao';
  if (level === 'high') return 'cao';
  if (level === 'moderate') return 'đang cần theo dõi';
  return 'ổn định';
}

const suggestionBannerText = computed(() => {
  // Ưu tiên bài tập AI (Gemini) đã chọn ở daily message trên Dashboard — cùng nguồn
  // dữ liệu tâm trạng/xu hướng gần đây, cụ thể hơn bộ máy quy tắc chung (dashboard.tasks).
  if (aiExercises.value.length) {
    const names = aiExercises.value.map((ex) => ex.title).filter(Boolean).join(', ');
    return `PeaceCat (AI) gợi ý ${aiExercises.value.length} nhiệm vụ dựa trên tâm trạng gần đây của bạn: ${names}.`;
  }

  const recommendedTasks = Array.isArray(dashboard.value?.tasks) ? dashboard.value.tasks : [];
  const latestMood = dashboard.value?.latest_mood;
  const summary = dashboard.value?.summary || {};
  const moodText = latestMood?.mood_score !== null && latestMood?.mood_score !== undefined
    ? `Mood gần nhất ${latestMood.mood_score}/10`
    : 'Chưa có mood check-in gần đây';
  return recommendedTasks.length
    ? `PeaceCat chọn ${recommendedTasks.length} nhiệm vụ phù hợp lúc này. ${moodText} và mức rủi ro ${getRiskLabel(summary.risk_level)} đang được dùng để ưu tiên danh sách.`
    : 'Chưa có gợi ý cá nhân hóa rõ ràng, bạn vẫn có thể chọn bất kỳ nhiệm vụ nào phù hợp với năng lượng hiện tại.';
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
    ? 'Bạn đang ở cấp cao nhất hiện tại'
    : `Còn ${levelInfo.xp_to_next ?? 0} XP → Level ${level + 1}`;
  return { xp, level, title: levelInfo.title || `Level ${level}`, minXP: levelInfo.minXP ?? 0, maxXPLabel: maxXP, percent, nextLabel };
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
        : GUEST_EMERGENCY_TASKS_FALLBACK;

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
    loadError.value = 'Không tải được nhiệm vụ từ API. Hãy đăng nhập lại hoặc kiểm tra backend.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTaskPage();
});
</script>

<style scoped src="../assets/tasks.css"></style>
