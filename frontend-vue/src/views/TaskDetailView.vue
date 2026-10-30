<template>
  <div class="task-detail-page">
    <div ref="confettiContainerEl" class="confetti-container"></div>

    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-icon">❤️</div>
        <div class="ep-title">{{ t('taskDetail.emergency.title') }}</div>
        <p class="ep-text">{{ t('taskDetail.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">{{ t('taskDetail.emergency.hotlineLabel') }}</div>
        </div>
        <div class="ep-actions">
          <a href="tel:0931773637" class="ep-btn ep-btn-red">{{ t('taskDetail.emergency.callHotline') }}</a>
          <router-link to="/experts" class="ep-btn ep-btn-green">{{ t('taskDetail.emergency.connectExpert') }}</router-link>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">{{ t('taskDetail.emergency.imOk') }}</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;"  v-if="task">
      <div class="detail-layout">
        <!-- LEFT COLUMN -->
        <div class="detail-left">
          <div class="paper-card task-hero" :class="`cat-${sectionId}`">
            <div v-if="task.code && !brokenTaskImage" class="th-banner">
              <img :src="taskBannerSrc" :alt="task.title" class="th-banner-img" loading="lazy" @error="brokenTaskImage = true">
            </div>
            <div class="th-title-row">
              <div class="th-icon" :class="sectionId">{{ taskIcon }}</div>
              <div class="th-title">{{ task.title }}</div>
            </div>
            <div class="th-top">
              <div class="th-info">
                <div class="th-meta">
                  <span class="badge-pill" :class="badgeClass">{{ difficultyLabel }}</span>
                  <span class="badge-pill badge-mint">⏱ {{ durationLabel }}</span>
                  <span class="badge-pill badge-peach">⭐ {{ task.xp_reward || 0 }} XP</span>
                  <span
                    v-for="tag in tags.slice(0, 3)"
                    :key="tag"
                    class="badge-pill"
                    style="background:var(--color-surface-muted);color:var(--color-text-muted);"
                  >{{ tag }}</span>
                </div>
                <div class="th-desc">{{ taskDescription }}</div>
                <div class="th-quote handwritten">{{ quote }}</div>
              </div>
            </div>
            <div class="th-actions">
              <button class="btn-primary btn-large th-icon-btn" :title="plainText(t('taskDetail.hero.startBtn'))" :aria-label="plainText(t('taskDetail.hero.startBtn'))" @click="startTask"><NavIcon name="play" /></button>
              <button class="btn-outline th-icon-btn" :title="plainText(t('taskDetail.hero.saveFavorite'))" :aria-label="plainText(t('taskDetail.hero.saveFavorite'))"><NavIcon name="heart" /></button>
              <button class="btn-outline th-icon-btn" :title="plainText(t('taskDetail.hero.shareBtn'))" :aria-label="plainText(t('taskDetail.hero.shareBtn'))" @click="shareTask"><NavIcon name="share" /></button>
              <button class="btn-outline btn-danger-soft th-icon-btn th-sos-btn" :title="plainText(t('taskDetail.hero.emergencyBtn'))" :aria-label="plainText(t('taskDetail.hero.emergencyBtn'))" @click="emergencyOpen = true">SOS</button>
            </div>
          </div>

          <!-- Phase Indicator -->
          <div class="phase-indicator">
            <div class="phase-item" :class="phaseClass(1)" @click="switchPhase(1)">
              <div class="phase-num"><NavIcon name="journal" class="phase-num-icon" /></div>
              <div>{{ t('taskDetail.phases.prepare') }}</div>
            </div>
            <div class="phase-item" :class="phaseClass(2)" @click="switchPhase(2)">
              <div class="phase-num">▶</div>
              <div>{{ t('taskDetail.phases.execute') }}</div>
            </div>
            <div class="phase-item" :class="phaseClass(3)" @click="switchPhase(3)">
              <div class="phase-num">✓</div>
              <div>{{ t('taskDetail.phases.complete') }}</div>
            </div>
          </div>

          <!-- PHASE 1: PREPARATION -->
          <div class="phase-panel" :class="{ active: phase === 1 }">
            <div class="paper-card steps-card">
              <div v-if="preparation.length" style="margin-bottom: 20px;">
                <div class="steps-title">{{ t('taskDetail.phase1.prepareTitle') }}</div>
                <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
                  <li v-for="(item, idx) in preparation" :key="idx">{{ item }}</li>
                </ul>
              </div>
              <div class="steps-title">{{ t('taskDetail.phase1.instructionsTitle') }}</div>
              <div class="step-list">
                <template v-if="steps.length">
                  <div
                    v-for="(step, idx) in steps"
                    :key="idx"
                    class="step-item"
                    :class="{ done: stepsCompleted.has(idx) }"
                    @click="toggleStep(idx)"
                  >
                    <div class="step-num">{{ idx + 1 }}</div>
                    <div class="step-content">
                      <div class="step-text">{{ step }}</div>
                    </div>
                  </div>
                </template>
                <div v-else style="font-size:0.82rem;color:var(--text-secondary);">{{ t('taskDetail.phase1.noChecklist') }}</div>
              </div>
              <div v-if="safetyNotes.length" class="td-note td-note-safety">
                <div class="steps-title" style="margin-bottom: 8px;">{{ t('taskDetail.phase1.safetyTitle') }}</div>
                <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                  <li v-for="(item, idx) in safetyNotes" :key="idx">{{ item }}</li>
                </ul>
              </div>
              <div v-if="objective" class="td-note td-note-goal">
                <div class="steps-title" style="margin-bottom: 8px;">{{ t('taskDetail.phase1.objectiveTitle') }}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">{{ objective }}</div>
              </div>
              <div style="margin-top:16px;text-align:center;">
                <button class="btn-primary" @click="startTask">{{ t('taskDetail.phase1.startBtn') }}</button>
              </div>
            </div>
          </div>

          <!-- PHASE 2: EXECUTION -->
          <div class="phase-panel" :class="{ active: phase === 2 }">
            <div class="paper-card timer-card">
              <div class="timer-title">{{ t('taskDetail.phase2.timerTitle', { title: task.title }) }}</div>

              <div class="breathing-scene" v-show="isBreathing">
                <div class="breath-circle" :class="breathPhase.name">
                  <div>
                    <div class="breath-count">{{ breathPhase.count }}</div>
                    <div class="breath-label">{{ t(breathPhase.labelKey) }}</div>
                  </div>
                </div>
              </div>

              <div class="timer-phase-text">{{ timerPhaseText }}</div>

              <div class="round-counter" v-show="isBreathing">
                <div class="round-dot active"></div>
                <div class="round-dot"></div>
                <div class="round-dot"></div>
                <div class="round-dot"></div>
                <div class="round-dot"></div>
              </div>

              <div class="timer-ring-wrap">
                <svg class="timer-ring" width="160" height="160" viewBox="0 0 160 160">
                  <circle class="timer-ring-bg" cx="80" cy="80" r="70" />
                  <circle class="timer-ring-fill" :style="{ strokeDashoffset: ringOffset }" cx="80" cy="80" r="70" />
                </svg>
                <div class="timer-center">
                  <div class="timer-num">{{ formattedTimer }}</div>
                  <div class="timer-label">{{ t('taskDetail.phase2.remainingLabel') }}</div>
                </div>
              </div>

              <div class="timer-controls">
                <button class="btn-outline" @click="pauseTimer">{{ isPaused ? t('taskDetail.phase2.resumeBtn') : t('taskDetail.phase2.pauseBtn') }}</button>
                <button class="btn-primary" @click="completeTask">{{ t('taskDetail.phase2.completeBtn') }}</button>
                <button class="btn-outline" @click="resetTimer">{{ t('taskDetail.phase2.resetBtn') }}</button>
              </div>
            </div>
          </div>

          <!-- PHASE 3: FEEDBACK -->
          <div class="phase-panel" :class="{ active: phase === 3 }">
            <div class="paper-card">
              <div class="feedback-panel show">
                <div class="fp-mascot">🐱</div>
                <div class="fp-title">{{ feedbackTitle }}</div>
                <div class="fp-subtitle">{{ feedbackSubtitle }}</div>
                <div class="xp-animation">
                  <span class="xp-num">+{{ xpEarned }} XP</span>
                  <span class="xp-label">{{ t('taskDetail.phase3.xpAddedLabel') }}</span>
                </div>
                <div class="fp-mood-title">{{ t('taskDetail.phase3.moodQuestion') }}</div>
                <div class="fp-emojis">
                  <button
                    v-for="emoji in ['😊', '😌', '😐', '😕', '😢']"
                    :key="emoji"
                    class="fp-emoji-btn"
                    :class="{ selected: feedbackEmoji === emoji }"
                    @click="feedbackEmoji = emoji"
                  >{{ emoji }}</button>
                </div>
                <textarea class="fp-note-area" rows="3" :placeholder="t('taskDetail.phase3.notePlaceholder')"></textarea>
                <div class="fp-actions">
                  <router-link :to="tasksLink" class="btn-primary">{{ t('taskDetail.phase3.nextTaskBtn') }}</router-link>
                  <router-link to="/journal" class="btn-outline">{{ t('taskDetail.phase3.journalBtn') }}</router-link>
                  <router-link to="/dashboard" class="btn-outline">{{ t('taskDetail.phase3.dashboardBtn') }}</router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="detail-right">
          <div class="paper-card" style="padding:16px;">
            <div class="mascot-tip">
              <span class="mt-avatar">💡</span>
              <div class="mt-text">{{ stressFact }}</div>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">{{ t('taskDetail.info.title') }}</div>
            <div class="ic-stat-row"><span class="ic-stat-label">{{ t('taskDetail.info.codeLabel') }}</span><span class="ic-stat-val">{{ task.code || task.id }}</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">{{ t('taskDetail.info.levelLabel') }}</span><span class="ic-stat-val">{{ difficultyLabel }}</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">{{ t('taskDetail.info.timeLabel') }}</span><span class="ic-stat-val">{{ durationLabel }}</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">{{ t('taskDetail.info.rewardLabel') }}</span><span class="ic-stat-val" style="color:var(--peach-dark);">+{{ task.xp_reward || 0 }} XP ⭐</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">{{ t('taskDetail.info.categoryLabel') }}</span><span class="ic-stat-val">{{ task.category || t('taskDetail.categoryDefault') }}</span></div>
            <div class="ic-stat-row">
              <span class="ic-stat-label">{{ t('taskDetail.info.statusLabel') }}</span>
              <span class="ic-stat-val" :style="{ color: task.completed ? 'var(--mint-dark)' : task.in_progress ? 'var(--blue)' : 'var(--text-secondary)' }">{{ statusText }}</span>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">{{ t('taskDetail.yourStatus.title') }}</div>
            <div class="community-stat">
              <div class="cs-num">{{ task.completion_count || 0 }}</div>
              <div class="cs-label">{{ t('taskDetail.yourStatus.timesCompletedLabel') }}</div>
              <div class="cs-bar"><div class="cs-bar-fill" :style="{ width: Math.min(100, (task.completion_count || 0) * 20) + '%' }"></div></div>
              <div style="font-size:0.72rem;color:var(--text-secondary);">{{ recommendedText }}</div>
              <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:8px;">{{ t('taskDetail.yourStatus.stepsCountLabel', { n: steps.length }) }}{{ tags.length ? t('taskDetail.yourStatus.tagsLabel', { tags: tags.slice(0, 3).join(', ') }) : '' }}</div>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">{{ t('taskDetail.benefits.title') }}</div>
            <div v-if="!benefits.length" class="benefit-item"><span>{{ t('taskDetail.benefits.noData') }}</span></div>
            <div v-for="(benefit, idx) in benefits" :key="idx" class="benefit-item">
              <span class="benefit-icon">💡</span><span>{{ benefit }}</span>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">{{ t('taskDetail.related.title') }}</div>
            <div v-if="!relatedTasks.length" style="font-size:0.8rem;color:var(--text-secondary);padding:10px;">{{ t('taskDetail.related.noData') }}</div>
            <a
              v-for="candidate in relatedTasks"
              :key="candidate.id"
              href="#"
              class="related-task"
              @click.prevent="goToTask(candidate)"
            >
              <div class="rt-icon">
                <img v-if="taskThumbSrc(candidate) && !brokenRelatedImages.has(candidate.id)" :src="taskThumbSrc(candidate)" :alt="candidate.title" loading="lazy" @error="brokenRelatedImages.add(candidate.id)">
                <template v-else>{{ getTaskIcon(candidate) }}</template>
              </div>
              <div>
                <div class="rt-name">{{ candidate.title }}</div>
                <div class="rt-meta">{{ getDifficultyLabel(candidate) }} · +{{ candidate.xp_reward || 0 }} XP</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient, API_BASE_URL } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { goToLegacyPage } from '../lib/legacyApp';
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';
import { buildGuestEmergencyTasksFallback } from '../lib/taskFallbackData';
import { taskThumbSrc } from '../lib/taskImages';
import NavIcon from '../components/NavIcon.vue';
// Nhãn i18n có emoji đứng đầu (▶ 🤍 📤 🆘) — bỏ đi khi dùng làm title/aria-label của nút icon.
const plainText = (str) => String(str).replace(/^[^\p{L}\p{N}]+/u, '');

const { t, tm } = useI18n();

const BREATH_PHASES = [
  { name: 'inhale', labelKey: 'taskDetail.breathPhases.inhale', count: '4' },
  { name: 'hold', labelKey: 'taskDetail.breathPhases.hold', count: '4' },
  { name: 'exhale', labelKey: 'taskDetail.breathPhases.exhale', count: '6' }
];

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const allTasks = ref([]);
const task = ref(null);
const brokenTaskImage = ref(false);
// Nhiệm vụ liên quan hiện ảnh thumb thật của nhiệm vụ; ảnh lỗi thì quay về icon cũ.
const brokenRelatedImages = reactive(new Set());
// Nhiem vu co san dung anh tinh public/task-images/<code>.png; nhiem vu admin tu tao qua UI
// dung anh luu trong DB qua GET /tasks/:id/cover.
const taskBannerSrc = computed(() => (task.value?.has_cover
  ? `${API_BASE_URL}/tasks/${task.value.id}/cover`
  : `/task-images/${task.value?.code}.png`));
const guestEmergencyMode = ref(false);
const emergencyOpen = ref(false);
const confettiContainerEl = ref(null);

const phase = ref(1);
const stepsCompleted = reactive(new Set());
const feedbackEmoji = ref(null);
const isPaused = ref(false);
const isCompleted = ref(false);
const totalSeconds = ref(300);
const remainingSeconds = ref(300);
const xpEarned = ref(0);
const breathPhaseIndex = ref(0);
const stressFact = ref('');

let timerInterval = null;
let breathInterval = null;

const tasksLink = computed(() => (guestEmergencyMode.value ? { path: '/tasks', query: { guest_emergency: '1' } } : '/tasks'));

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

function getTaskMeta(taskObj) {
  if (!taskObj?.metadata) return {};
  if (typeof taskObj.metadata === 'string') {
    try { return JSON.parse(taskObj.metadata); } catch (_e) { return {}; }
  }
  return taskObj.metadata;
}
function getTaskIcon(taskObj) {
  return getTaskMeta(taskObj).icon || taskObj?.icon || '🌱';
}
function getTaskDescription(taskObj) {
  return taskObj?.description || getTaskMeta(taskObj).objective || t('taskDetail.defaultDescription');
}
function getTaskDurationLabel(taskObj) {
  const minutes = Number(taskObj?.duration_minutes || 0);
  if (!minutes) return t('taskDetail.durationOptional');
  return t('taskDetail.minutesUnit', { n: minutes });
}
function getTaskSectionId(taskObj) {
  if (taskObj?.category === 'emergency') return 'emergency';
  return taskObj?.difficulty || 'easy';
}
function getDifficultyLabel(taskObj) {
  const sectionId = getTaskSectionId(taskObj);
  if (sectionId === 'emergency') return t('taskDetail.difficulty.emergency');
  if (sectionId === 'medium') return t('taskDetail.difficulty.medium');
  if (sectionId === 'hard') return t('taskDetail.difficulty.hard');
  return t('taskDetail.difficulty.easy');
}
function getBadgeClass(taskObj) {
  const sectionId = getTaskSectionId(taskObj);
  if (sectionId === 'emergency') return 'badge-coral';
  if (sectionId === 'medium') return 'badge-yellow';
  if (sectionId === 'hard') return 'badge-peach';
  return 'badge-mint';
}
function isBreathingTask(taskObj) {
  const title = (taskObj?.title || '').toLowerCase();
  return taskObj?.category === 'breathing' || title.includes('thở') || title.includes('breathing');
}

const sectionId = computed(() => getTaskSectionId(task.value));
const badgeClass = computed(() => getBadgeClass(task.value));
const difficultyLabel = computed(() => getDifficultyLabel(task.value));
const durationLabel = computed(() => getTaskDurationLabel(task.value));
const taskIcon = computed(() => getTaskIcon(task.value));
const taskDescription = computed(() => getTaskDescription(task.value));
const isBreathing = computed(() => isBreathingTask(task.value));
const breathPhase = computed(() => BREATH_PHASES[breathPhaseIndex.value]);

const meta = computed(() => getTaskMeta(task.value));
const steps = computed(() => normalizeArray(task.value?.steps));
const safetyNotes = computed(() => normalizeArray(task.value?.safety_notes));
const preparation = computed(() => normalizeArray(meta.value.preparation));
const benefits = computed(() => normalizeArray(meta.value.benefits));
const tags = computed(() => normalizeArray(task.value?.tags));
const objective = computed(() => meta.value.objective || task.value?.description || null);
const quote = computed(() => meta.value.quote || t('taskDetail.defaultQuote'));

const statusText = computed(() => (
  task.value?.completed ? t('taskDetail.status.completedTimes', { n: task.value.completion_count || 1 })
    : task.value?.in_progress ? t('taskDetail.status.inProgress')
    : t('taskDetail.status.notStarted')
));
const recommendedText = computed(() => (
  task.value?.recommended ? t('taskDetail.yourStatus.recommendedYes') : t('taskDetail.yourStatus.recommendedNo')
));
const relatedTasks = computed(() => allTasks.value
  .filter((c) => c.id !== task.value?.id && getTaskSectionId(c) === sectionId.value)
  .slice(0, 4));

const displayName = computed(() => {
  if (guestEmergencyMode.value) return t('taskDetail.guestDisplayName');
  return auth.user?.display_name || auth.user?.full_name || t('taskDetail.defaultDisplayName');
});
const feedbackTitle = computed(() => (
  guestEmergencyMode.value ? t('taskDetail.feedback.guestTitle') : t('taskDetail.feedback.userTitle', { name: displayName.value })
));
const feedbackSubtitle = computed(() => {
  if (!task.value) return '';
  return guestEmergencyMode.value
    ? t('taskDetail.feedback.guestSubtitle', { title: task.value.title })
    : t('taskDetail.feedback.userSubtitle', { title: task.value.title });
});

function formatTimer(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
const formattedTimer = computed(() => formatTimer(remainingSeconds.value));
const ringOffset = computed(() => {
  const ratio = totalSeconds.value > 0 ? remainingSeconds.value / totalSeconds.value : 1;
  return 440 - (440 * ratio);
});
// Trạng thái thuần (không phải chuỗi đã dịch) — timerPhaseText computed từ đây, tránh kẹt bản
// dịch cũ khi đổi ngôn ngữ giữa lúc đang làm nhiệm vụ.
const timerPhaseKind = ref('default'); // 'default' | 'breathing' | 'steps' | 'breathingReady' | 'paused' | 'resumed' | 'reset'
const timerPhaseText = computed(() => t(`taskDetail.timerText.${timerPhaseKind.value}`));

function phaseClass(n) {
  return { active: phase.value === n, done: phase.value > n };
}

function stopBreathingAnimation() {
  if (breathInterval) {
    clearInterval(breathInterval);
    breathInterval = null;
  }
}
function startBreathingAnimation() {
  stopBreathingAnimation();
  if (!isBreathingTask(task.value)) return;
  breathPhaseIndex.value = 0;
  breathInterval = setInterval(() => {
    breathPhaseIndex.value = (breathPhaseIndex.value + 1) % BREATH_PHASES.length;
  }, 4000);
}
function stopAllTimers() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  stopBreathingAnimation();
}

function switchPhase(next) {
  // Tab "Hoàn thành" bấm được trực tiếp như 2 tab kia, nhưng trước đây chỉ đổi phase mà
  // KHÔNG gọi completeTask() thật — hiện màn "+0 XP" giả (xpEarned vẫn ở giá trị mặc định
  // ref(0), chưa từng được gán) và không hề gọi API lưu vào hệ thống. Nếu nhiệm vụ chưa
  // thực sự hoàn thành, coi việc bấm tab này như bấm nút "Hoàn thành" thật.
  if (next === 3 && !isCompleted.value) {
    completeTask();
    return;
  }
  phase.value = next;
  if (next !== 2) stopBreathingAnimation();
}

async function startTask() {
  if (!task.value) return;

  if (!guestEmergencyMode.value && !task.value.in_progress && !task.value.completed) {
    try {
      await apiClient.post(`/tasks/${task.value.id}/start`, {});
      task.value.in_progress = true;
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  }

  isPaused.value = false;
  switchPhase(2);
  timerPhaseKind.value = isBreathingTask(task.value) ? 'breathing' : 'steps';

  if (totalSeconds.value > 0) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isPaused.value) return;
      remainingSeconds.value -= 1;
      if (remainingSeconds.value <= 0) completeTask();
    }, 1000);
  }

  startBreathingAnimation();
}

function pauseTimer() {
  isPaused.value = !isPaused.value;
  timerPhaseKind.value = isPaused.value ? 'paused' : 'resumed';
}

function resetTimer() {
  isPaused.value = true;
  remainingSeconds.value = totalSeconds.value;
  timerPhaseKind.value = 'reset';
}

async function completeTask() {
  if (!task.value || isCompleted.value) return;
  isCompleted.value = true;
  stopAllTimers();

  try {
    if (guestEmergencyMode.value) {
      task.value.completed = true;
      task.value.in_progress = false;
      task.value.completion_count = (task.value.completion_count || 0) + 1;
      xpEarned.value = task.value.xp_reward || 0;
    } else {
      const result = await apiClient.post(`/tasks/${task.value.id}/complete`, {
        self_rating_before: null,
        self_rating_after: null,
        notes: null
      });

      task.value.completed = true;
      task.value.in_progress = false;
      task.value.completion_count = (task.value.completion_count || 0) + 1;

      if (result?.progress) {
        window.dispatchEvent(new CustomEvent('peaceflow:progress-updated', {
          detail: {
            xp: result.progress.total_xp ?? result.progress.xp,
            level: result.progress.current_level ?? result.progress.level
          }
        }));
      }

      xpEarned.value = result?.xp_earned ?? task.value.xp_reward ?? 0;
      localStorage.setItem('peaceflow_dashboard_refresh', '1');
      window.dispatchEvent(new Event('peaceflow-dashboard-refresh'));
      window.dispatchEvent(new CustomEvent('peaceflow:task-completed'));
    }
  } catch (error) {
    console.error('Failed to complete task:', error);
    isCompleted.value = false;
    return;
  }

  switchPhase(3);
  fireConfetti();
}

function fireConfetti() {
  const container = confettiContainerEl.value;
  if (!container) return;

  const colors = ['#A8D5BA', '#FFD93D', '#FF8B8B', '#A8D8EA', '#C3AED6'];
  container.innerHTML = '';

  for (let i = 0; i < 100; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${Math.random() * 8 + 5}px`;
    piece.style.height = `${Math.random() * 12 + 8}px`;
    piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(piece);
  }

  setTimeout(() => { if (container) container.innerHTML = ''; }, 5000);
}

function toggleStep(idx) {
  if (stepsCompleted.has(idx)) stepsCompleted.delete(idx);
  else stepsCompleted.add(idx);
}

function shareTask() {
  const url = window.location.href;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
  alert(t('taskDetail.shareCopied'));
}

function goToTask(candidate) {
  const query = { id: candidate.id };
  if (guestEmergencyMode.value) query.guest_emergency = '1';
  router.push({ path: '/task-detail', query });
}

function loadTaskInto(nextTask, recommendedIds = new Set()) {
  task.value = { ...nextTask, recommended: recommendedIds.has(nextTask.id) };
  brokenTaskImage.value = false;
  totalSeconds.value = Math.max(60, Number(nextTask.duration_minutes || 5) * 60);
  remainingSeconds.value = totalSeconds.value;
  isPaused.value = false;
  isCompleted.value = false;
  stepsCompleted.clear();
  feedbackEmoji.value = null;
  timerPhaseKind.value = isBreathingTask(nextTask) ? 'breathingReady' : 'default';
  const facts = tm('taskDetail.stressFacts');
  stressFact.value = facts[Math.floor(Math.random() * facts.length)];
  phase.value = 1;
}

async function loadTaskDetail() {
  guestEmergencyMode.value = isGuestEmergencyModeActive(auth.isAuthenticated);

  if (guestEmergencyMode.value) {
    const taskId = route.query.id || 'E1_SEPARATE_ENV';
    const publicEmergencyTasks = await apiClient.request('/tasks/public-emergency', { method: 'GET' }, { retryAuth: false });
    const guestTasks = Array.isArray(publicEmergencyTasks) && publicEmergencyTasks.length
      ? publicEmergencyTasks
      : buildGuestEmergencyTasksFallback(t, tm);

    allTasks.value = guestTasks.map((t) => ({ ...t }));
    const found = allTasks.value.find((t) => t.id === taskId || t.code === taskId) || allTasks.value[0];
    if (!found) return;
    loadTaskInto(found);
    return;
  }

  if (!auth.isAuthenticated) {
    router.replace('/login');
    return;
  }

  try {
    const [tasks, dashboardData] = await Promise.all([
      apiClient.get('/tasks'),
      apiClient.get('/dashboard')
    ]);

    allTasks.value = Array.isArray(tasks) ? tasks : [];
    const recommendedIds = new Set((dashboardData?.tasks || []).map((t) => t.id));
    const taskId = route.query.id;
    const found = allTasks.value.find((t) => t.id === taskId || t.code === taskId) || allTasks.value[0];
    if (!found) return;

    allTasks.value = allTasks.value.map((item) => ({ ...item, recommended: recommendedIds.has(item.id) }));
    loadTaskInto(found, recommendedIds);
  } catch (error) {
    console.error('Failed to load task detail from API:', error);
  }
}

// Bấm vào một task liên quan chỉ đổi query ?id= trên CÙNG route /task-detail — Vue Router
// không tự re-mount component trong trường hợp này nên onMounted không chạy lại. Phải theo
// dõi route.query.id riêng để nạp đúng task mới, nếu không trang vẫn hiện task cũ (bấm như
// không có phản ứng gì).
watch(() => route.query.id, (newId, oldId) => {
  if (!newId || newId === oldId) return;
  if (allTasks.value.length) {
    const found = allTasks.value.find((t) => t.id === newId || t.code === newId);
    if (found) {
      const recommendedIds = new Set(allTasks.value.filter((t) => t.recommended).map((t) => t.id));
      loadTaskInto(found, recommendedIds);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }
  loadTaskDetail();
});

onMounted(() => {
  loadTaskDetail();
});

onBeforeUnmount(() => {
  stopAllTimers();
});
</script>

<style scoped src="../assets/task-detail.css"></style>
<style scoped>
/* Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, thẻ trắng bo mềm không
   viền/bóng giấy, chữ Inter + tiêu đề --font-heading, nút/nhãn phẳng, đường kẻ mảnh liền nét.
   Đặt SAU task-detail.css để thắng thứ tự nguồn, không sửa file gốc. */
.task-detail-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; min-height: 100vh;
}
.task-detail-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { padding: 20px 20px 32px; }
.task-detail-page :is(input, textarea, button) { font-family: inherit; }
.task-detail-page :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.breadcrumb, .breadcrumb a { color: var(--color-text-subtle); font-size: 13px; }
.breadcrumb a:hover { color: var(--color-brand); }

/* Nút phẳng như .pf-btn-* của Dashboard. */
.btn-primary, .btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 38px; padding: 8px 18px; border: none; border-radius: var(--radius-control); box-shadow: none; transform: none;
  font-family: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.btn-primary:hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); box-shadow: none; transform: none; }
.btn-outline { background: var(--color-surface-muted); color: var(--color-text); }
.btn-outline:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.btn-large { min-height: 44px; padding: 10px 22px; font-size: 15px; border-radius: var(--radius-control); }
.btn-danger-soft { background: var(--color-danger-soft); color: var(--color-danger); }
.btn-danger-soft:hover { background: var(--color-danger); color: #fff; }

/* Nhãn: nền nhạt, không viền. */
.badge-pill { border: none !important; font-size: 12px; }
.badge-mint { background: var(--color-brand-soft); color: var(--color-brand); }
.badge-peach { background: var(--color-terracotta-soft); color: var(--color-terracotta); }

/* Thẻ: nền trắng, bo --radius-card, không viền/bóng giấy. */
.paper-card { background: var(--color-surface); border: none; border-radius: var(--radius-card); box-shadow: none; }
.paper-card:hover { box-shadow: none; }

/* Thẻ đầu nhiệm vụ: giữ dải màu theo độ khó ở mép trên. */
.th-banner { border-radius: var(--radius-control); overflow: hidden; }
.th-icon { border: none; border-radius: var(--radius-control); }
.th-title { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.th-desc { color: var(--color-text-muted); }
.th-quote { font-family: var(--font-display); font-style: italic; background: var(--color-canvas); border-left: 3px solid var(--color-brand); border-radius: 0 var(--radius-control) var(--radius-control) 0; color: var(--color-text-muted); }

/* Thanh 3 giai đoạn: thanh nền nhạt, giai đoạn đang chọn là ô trắng. */
.phase-indicator { gap: 4px; padding: 4px; border-radius: var(--radius-control); background: var(--color-surface-muted); }
.phase-item, .phase-item:first-child, .phase-item:last-child { border: none; border-radius: calc(var(--radius-control) - 2px); background: transparent; color: var(--color-text-muted); font-weight: 600; }
.phase-item.active { background: var(--color-surface); color: var(--color-brand); }
.phase-item.done { background: var(--color-brand-soft); color: var(--color-brand); }

/* Các bước. */
.steps-title, .timer-title, .ic-title, .fp-title { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.step-item { border: 1.5px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas); }
.step-item:hover { background: var(--color-brand-soft); border-color: transparent; }
.step-item.done { background: var(--color-brand-soft); border-color: var(--color-brand); }
.step-num { border: none; background: var(--color-surface); color: var(--color-brand); }
.step-item.done .step-num { background: var(--color-brand); color: var(--color-on-brand); }
.td-note { margin-top: 20px; padding: 14px 16px; border-radius: var(--radius-card); }
.td-note-safety { background: var(--color-danger-soft); }
.td-note-safety .steps-title { color: var(--color-danger); }
.td-note-goal { background: var(--color-brand-soft); }
.td-note-goal .steps-title { color: var(--color-brand); }

/* Hẹn giờ / hít thở. */
.breath-circle { border: none; box-shadow: none; background: radial-gradient(circle, var(--color-surface), var(--color-brand-soft)); }
.breath-circle.inhale { background: radial-gradient(circle, var(--color-brand-soft), color-mix(in srgb, var(--color-brand) 45%, var(--color-surface))); box-shadow: none; }
.round-dot { border: none; background: var(--color-surface-muted); }
.round-dot.done, .round-dot.active { background: var(--color-brand); box-shadow: none; }
.timer-num { font-family: var(--font-heading); }

/* Hoàn thành. */
.xp-animation { border: none; background: var(--color-terracotta-soft); }
.fp-emoji-btn { border: 1.5px solid transparent; background: var(--color-canvas); }
.fp-emoji-btn.selected { border-color: var(--color-brand); background: var(--color-brand-soft); box-shadow: none; }
.fp-note-area { border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas); font-family: inherit; color: var(--color-text); }
.fp-note-area:focus { outline: none; border-color: var(--color-brand); background: var(--color-surface); }

/* Cột phải. */
.mascot-tip { border: none; border-radius: var(--radius-card); background: var(--color-terracotta-soft); }
.mt-text { color: var(--color-text); }
.ic-stat-row, .benefit-item { border-bottom: 1px solid var(--color-surface-muted); }
.ic-stat-label { color: var(--color-text-muted); }
.ic-stat-val { color: var(--color-text); }
.community-stat { border: none; border-radius: var(--radius-card); background: var(--color-brand-soft); }
.cs-num { font-family: var(--font-heading); color: var(--color-brand); }
.cs-bar { background: var(--color-surface); }
.cs-bar-fill { background: var(--color-brand); }
.related-task { border: none; border-radius: var(--radius-control); background: var(--color-canvas); transition: background-color var(--duration-fast) var(--ease-standard); }
.related-task:hover { background: var(--color-brand-soft); border: none; }
.rt-icon { border: none; border-radius: var(--radius-control); background: var(--color-surface); }
.rt-name { color: var(--color-text); font-weight: 600; }
.rt-meta { color: var(--color-text-subtle); }

/* Popup khẩn cấp giống bản ở trang check-in. */
.emergency-popup { border: none; border-radius: var(--radius-panel); box-shadow: var(--shadow-soft); }
.ep-hotline { border: none; border-radius: var(--radius-card); background: var(--color-danger-soft); }
.ep-btn { border: none; border-radius: var(--radius-control); box-shadow: none; font-family: inherit; }
.ep-btn-red { background: var(--color-danger); color: #fff; }
.ep-btn-green { background: var(--color-brand-soft); color: var(--color-brand); }
.ep-btn-ghost { background: var(--color-surface-muted); color: var(--color-text-muted); }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .main-content { padding: 16px 16px 24px; }
}
/* Desktop: chuông + nút chat nổi cố định ở góc phải trên (top 30px, cao 45px) — đẩy cột phải
   xuống để thẻ đầu tiên không bị che (trước đây có breadcrumb chiếm chỗ này). */
@media (min-width: 901px) and (hover: hover) {
  .detail-right { padding-top: 64px; }
}
.rt-icon { width: 44px; height: 44px; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.rt-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* Nút hành động ở thẻ đầu: chỉ icon nét đơn sắc (chữ chuyển vào title/aria-label). */
.th-icon-btn { width: 48px; min-width: 48px; height: 48px; min-height: 48px; padding: 0; }
.th-icon-btn .nav-icon { width: 22px; height: 22px; }
.th-icon-btn.btn-primary .nav-icon { fill: currentColor; stroke-width: 1.6; }
.th-sos-btn { font-size: 13px; font-weight: 800; letter-spacing: 0.04em; }
/* Icon giai đoạn "Chuẩn bị": nét đơn sắc cùng màu chữ, đồng bộ với ký hiệu ▶ ✓ của 2 giai đoạn sau. */
.phase-num { display: flex; align-items: center; justify-content: center; height: 20px; }
.phase-num .phase-num-icon { width: 17px; height: 17px; stroke-width: 2; }
</style>
