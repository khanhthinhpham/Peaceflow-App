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
      <div class="breadcrumb">
        <router-link to="/dashboard">{{ t('taskDetail.breadcrumbDashboard') }}</router-link>
        <span>›</span>
        <router-link :to="tasksLink">{{ t('taskDetail.breadcrumbTasks') }}</router-link>
        <span>›</span>
        <span>{{ task.title }}</span>
      </div>

      <div class="detail-layout">
        <!-- LEFT COLUMN -->
        <div class="detail-left">
          <div class="paper-card task-hero" :class="`cat-${sectionId}`">
            <div class="th-top">
              <div class="th-icon" :class="sectionId">{{ taskIcon }}</div>
              <div class="th-info">
                <div class="th-title">{{ task.title }}</div>
                <div class="th-meta">
                  <span class="badge-pill" :class="badgeClass">{{ difficultyLabel }}</span>
                  <span class="badge-pill badge-mint">⏱ {{ durationLabel }}</span>
                  <span class="badge-pill badge-peach">⭐ {{ task.xp_reward || 0 }} XP</span>
                  <span
                    v-for="tag in tags.slice(0, 3)"
                    :key="tag"
                    class="badge-pill"
                    style="background:var(--sky-light);color:#4a90aa;border:1.5px solid var(--sky);"
                  >{{ tag }}</span>
                </div>
                <div class="th-desc">{{ taskDescription }}</div>
                <div class="th-quote handwritten">{{ quote }}</div>
              </div>
            </div>
            <div class="th-actions">
              <button class="btn-primary btn-large" @click="startTask">{{ t('taskDetail.hero.startBtn') }}</button>
              <button class="btn-outline">{{ t('taskDetail.hero.saveFavorite') }}</button>
              <button class="btn-outline" @click="shareTask">{{ t('taskDetail.hero.shareBtn') }}</button>
              <button class="btn-outline" style="color:var(--coral);border-color:var(--coral);" @click="emergencyOpen = true">{{ t('taskDetail.hero.emergencyBtn') }}</button>
            </div>
          </div>

          <!-- Phase Indicator -->
          <div class="phase-indicator">
            <div class="phase-item" :class="phaseClass(1)" @click="switchPhase(1)">
              <div class="phase-num">📖</div>
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
              <div v-if="safetyNotes.length" style="margin-top: 20px; padding: 14px; background: rgba(255, 139, 139, 0.1); border: 1.5px solid var(--coral); border-radius: var(--radius-sm);">
                <div class="steps-title" style="color: var(--coral); margin-bottom: 8px;">{{ t('taskDetail.phase1.safetyTitle') }}</div>
                <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                  <li v-for="(item, idx) in safetyNotes" :key="idx">{{ item }}</li>
                </ul>
              </div>
              <div v-if="objective" style="margin-top: 20px; padding: 14px; background: var(--mint-light); border: 1.5px solid var(--mint); border-radius: var(--radius-sm);">
                <div class="steps-title" style="color: var(--mint-dark); margin-bottom: 8px;">{{ t('taskDetail.phase1.objectiveTitle') }}</div>
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
              <div class="rt-icon">{{ getTaskIcon(candidate) }}</div>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { goToLegacyPage } from '../lib/legacyApp';
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';
import { buildGuestEmergencyTasksFallback } from '../lib/taskFallbackData';

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

onMounted(() => {
  loadTaskDetail();
});

onBeforeUnmount(() => {
  stopAllTimers();
});
</script>

<style scoped src="../assets/task-detail.css"></style>
