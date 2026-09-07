<template>
  <div class="task-breathing-page">
    <div ref="confettiContainerEl" class="confetti-container"></div>

    <main class="main-content" style="margin-left: 0;">
      <div class="breadcrumb">
        <router-link to="/dashboard">{{ t('taskBreathing.breadcrumbDashboard') }}</router-link><span>›</span>
        <router-link :to="tasksLink">{{ t('taskBreathing.breadcrumbTasks') }}</router-link><span>›</span>
        <span>{{ t('taskBreathing.breadcrumbCurrent') }}</span>
      </div>

      <div v-if="guestEmergencyMode" class="guest-emergency-note">
        <div class="guest-emergency-note-title">{{ t('taskBreathing.guestNote.title') }}</div>
        <div class="guest-emergency-note-text">
          {{ t('taskBreathing.guestNote.text') }}
        </div>
      </div>

      <div class="technique-tabs">
        <div v-for="(tech, key) in TECHNIQUES" :key="key" class="tech-tab" :class="{ active: currentKey === key }" @click="selectTechnique(key)">
          <div class="tt-icon">{{ tech.icon }}</div>
          <div class="tt-name">{{ t(tech.nameKey) }}</div>
          <div class="tt-time">{{ t(tech.timeLabelKey) }}</div>
        </div>
      </div>

      <div class="page-layout">
        <div>
          <div class="paper-card breathing-arena">
            <div class="ba-title">{{ current.icon }} {{ t(current.fullNameKey) }}</div>
            <div class="ba-subtitle">{{ t(current.subtitleKey) }}</div>
            <div class="breath-stage">
              <div class="breath-outer"></div>
              <div class="breath-mid"></div>
              <div class="breath-inner" :class="phaseClass">
                <div class="breath-count-num">{{ currentCount || '—' }}</div>
              </div>
            </div>
            <div class="breath-phase-text">{{ phaseText }}</div>
            <div class="breath-instruction">{{ instructionText }}</div>
            <div class="round-dots">
              <div v-for="i in current.rounds" :key="i" class="rd" :class="{ done: i - 1 < currentRound, active: i - 1 === currentRound && isRunning }"></div>
            </div>
            <div class="breath-controls">
              <button v-if="!isRunning" class="ctrl-btn ctrl-start" @click="startBreathing">{{ t('taskBreathing.controls.startBtn') }}</button>
              <button v-if="isRunning && !isPaused" class="ctrl-btn ctrl-pause" @click="pauseBreathing">{{ t('taskBreathing.controls.pauseBtn') }}</button>
              <button v-if="isRunning && isPaused" class="ctrl-btn ctrl-pause" @click="startBreathing">{{ t('taskBreathing.controls.resumeBtn') }}</button>
              <button v-if="isRunning" class="ctrl-btn ctrl-reset" @click="resetBreathing">{{ t('taskBreathing.controls.resetBtn') }}</button>
            </div>
          </div>

          <div class="paper-card technique-info">
            <div class="ti-header">
              <div class="ti-icon">{{ current.icon }}</div>
              <div class="ti-title">{{ t(current.fullNameKey) }}</div>
            </div>
            <div class="ti-desc">{{ t(current.descKey) }}</div>
            <div class="ti-pattern">
              <div v-for="(phase, idx) in current.phases" :key="idx" class="tp-item" :class="phase.c">
                <div class="tp-num">{{ phase.d }}</div>
                <div class="tp-label">{{ t(phase.nameKey) }}</div>
                <div class="tp-unit">{{ t('taskBreathing.secondsUnit') }}</div>
              </div>
            </div>
          </div>

          <div class="paper-card session-stats">
            <div class="ss-title">{{ t('taskBreathing.stats.title') }}</div>
            <div class="ss-grid">
              <div class="ss-item">
                <div class="ss-num">{{ currentRound }}</div>
                <div class="ss-label">{{ t('taskBreathing.stats.roundsLabel') }}</div>
              </div>
              <div class="ss-item">
                <div class="ss-num">{{ sessionTimeLabel }}</div>
                <div class="ss-label">{{ t('taskBreathing.stats.timeLabel') }}</div>
              </div>
            </div>
          </div>

          <div class="paper-card feedback-section" :class="{ show: showFeedback }">
            <div class="fs-mascot">🐱</div>
            <div class="fs-title">{{ t('taskBreathing.feedback.title') }}</div>
            <div class="fs-sub">{{ t('taskBreathing.feedback.subtitle') }}</div>
            <div class="xp-badge"><span class="xp-num">+{{ xpEarned }} XP</span></div>
            <div class="fs-actions">
              <button class="btn-primary" @click="location.reload()">{{ t('taskBreathing.feedback.retryBtn') }}</button>
              <router-link :to="tasksLink" class="btn-outline">{{ t('taskBreathing.feedback.backToTasksBtn') }}</router-link>
            </div>
          </div>
        </div>

        <div>
          <div class="paper-card right-card">
            <div class="rc-title">{{ t('taskBreathing.tipTitle') }}</div>
            <div class="tip-box">{{ t(current.tipKey) }}</div>
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

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const TECHNIQUES = {
  box: { icon: '📦', nameKey: 'taskBreathing.techniques.box.name', fullNameKey: 'taskBreathing.techniques.box.fullName', timeLabelKey: 'taskBreathing.techniques.box.timeLabel', subtitleKey: 'taskBreathing.techniques.box.subtitle', dur: 4, rounds: 5, xp: 20, descKey: 'taskBreathing.techniques.box.desc', tipKey: 'taskBreathing.techniques.box.tip', phases: [{ nameKey: 'taskBreathing.techniques.box.phaseInhale', d: 4, c: 'inhale' }, { nameKey: 'taskBreathing.techniques.box.phaseHold', d: 4, c: 'hold' }, { nameKey: 'taskBreathing.techniques.box.phaseExhale', d: 4, c: 'exhale' }, { nameKey: 'taskBreathing.techniques.box.phasePause', d: 4, c: 'pause' }] },
  '478': { icon: '🌙', nameKey: 'taskBreathing.techniques.478.name', fullNameKey: 'taskBreathing.techniques.478.fullName', timeLabelKey: 'taskBreathing.techniques.478.timeLabel', subtitleKey: 'taskBreathing.techniques.478.subtitle', dur: 19, rounds: 4, xp: 20, descKey: 'taskBreathing.techniques.478.desc', tipKey: 'taskBreathing.techniques.478.tip', phases: [{ nameKey: 'taskBreathing.techniques.478.phaseInhale', d: 4, c: 'inhale' }, { nameKey: 'taskBreathing.techniques.478.phaseHold', d: 7, c: 'hold' }, { nameKey: 'taskBreathing.techniques.478.phaseExhale', d: 8, c: 'exhale' }] },
  coherent: { icon: '💚', nameKey: 'taskBreathing.techniques.coherent.name', fullNameKey: 'taskBreathing.techniques.coherent.fullName', timeLabelKey: 'taskBreathing.techniques.coherent.timeLabel', subtitleKey: 'taskBreathing.techniques.coherent.subtitle', dur: 10, rounds: 6, xp: 25, descKey: 'taskBreathing.techniques.coherent.desc', tipKey: 'taskBreathing.techniques.coherent.tip', phases: [{ nameKey: 'taskBreathing.techniques.coherent.phaseInhale', d: 5, c: 'inhale' }, { nameKey: 'taskBreathing.techniques.coherent.phaseExhale', d: 5, c: 'exhale' }] },
  diaphragm: { icon: '🌬️', nameKey: 'taskBreathing.techniques.diaphragm.name', fullNameKey: 'taskBreathing.techniques.diaphragm.fullName', timeLabelKey: 'taskBreathing.techniques.diaphragm.timeLabel', subtitleKey: 'taskBreathing.techniques.diaphragm.subtitle', dur: 12, rounds: 6, xp: 15, descKey: 'taskBreathing.techniques.diaphragm.desc', tipKey: 'taskBreathing.techniques.diaphragm.tip', phases: [{ nameKey: 'taskBreathing.techniques.diaphragm.phaseInhale', d: 4, c: 'inhale' }, { nameKey: 'taskBreathing.techniques.diaphragm.phaseHold', d: 2, c: 'hold' }, { nameKey: 'taskBreathing.techniques.diaphragm.phaseExhale', d: 6, c: 'exhale' }] }
};

const guestEmergencyMode = ref(false);
const tasksLink = computed(() => (guestEmergencyMode.value ? { path: '/tasks', query: { guest_emergency: '1' } } : '/tasks'));

const currentKey = ref('box');
const current = computed(() => TECHNIQUES[currentKey.value]);

const isRunning = ref(false);
const isPaused = ref(false);
const currentRound = ref(0);
const currentPhaseIdx = ref(0);
const currentCount = ref(0);
const sessionTime = ref(0);
const showFeedback = ref(false);
const xpEarned = ref(0);
const phaseClass = ref('');
// Trạng thái thuần (không phải chuỗi đã dịch) — phaseText computed từ đây, tránh kẹt bản dịch
// cũ khi đổi ngôn ngữ giữa lúc đang thở. instructionText chưa từng đổi giá trị trong suốt vòng
// đời trang này nên chỉ cần computed hằng số, không cần state riêng.
const phaseTextKey = ref('taskBreathing.phaseDefaults.ready');
const phaseText = computed(() => t(phaseTextKey.value));
const instructionText = computed(() => t('taskBreathing.phaseDefaults.readyInstruction'));

const state = reactive({ task: null, progress: null });
let mainInterval = null;
let sessionInterval = null;

const sessionTimeLabel = computed(() => {
  const minutes = Math.floor(sessionTime.value / 60);
  const seconds = sessionTime.value % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});

const confettiContainerEl = ref(null);
function spawnConfetti() {
  const container = confettiContainerEl.value;
  if (!container) return;
  const colors = ['#A8D5BA', '#FFCBA4', '#A8D8EA', '#C3AED6', '#FF8B8B', '#D4A574', '#C5E8D2'];
  container.innerHTML = '';
  for (let i = 0; i < 36; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 6;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = '-20px';
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    container.appendChild(piece);
  }
  setTimeout(() => { if (container) container.innerHTML = ''; }, 4500);
}

function parseMeta(task) {
  if (!task?.metadata) return {};
  if (typeof task.metadata === 'string') {
    try { return JSON.parse(task.metadata); } catch { return {}; }
  }
  return task.metadata;
}

function selectTechnique(key) {
  if (isRunning.value) resetBreathing();
  currentKey.value = key;
}

function nextPhase() {
  const phase = current.value.phases[currentPhaseIdx.value];
  phaseTextKey.value = phase.nameKey;
  phaseClass.value = phase.c;
  currentCount.value = phase.d;

  mainInterval = setInterval(() => {
    currentCount.value -= 1;
    if (currentCount.value > 0) return;

    clearInterval(mainInterval);
    mainInterval = null;
    currentPhaseIdx.value += 1;

    if (currentPhaseIdx.value >= current.value.phases.length) {
      currentPhaseIdx.value = 0;
      currentRound.value += 1;
      if (currentRound.value >= current.value.rounds) {
        finish();
        return;
      }
    }

    nextPhase();
  }, 1000);
}

async function startBreathing() {
  if (isRunning.value && !isPaused.value) return;

  if (!guestEmergencyMode.value && state.task && !state.task.in_progress && !state.task.completed) {
    try {
      await apiClient.post(`/tasks/${state.task.id}/start`, {});
      state.task.in_progress = true;
    } catch (error) {
      console.error('Failed to start breathing task:', error);
    }
  }

  const resuming = isRunning.value && isPaused.value;
  isRunning.value = true;
  isPaused.value = false;

  if (resuming) return;

  currentRound.value = 0;
  currentPhaseIdx.value = 0;
  sessionTime.value = 0;
  nextPhase();
  sessionInterval = setInterval(() => { sessionTime.value += 1; }, 1000);
}

function pauseBreathing() {
  isPaused.value = true;
  clearInterval(mainInterval);
  mainInterval = null;
  clearInterval(sessionInterval);
  sessionInterval = null;
}

function resetBreathing() {
  clearInterval(mainInterval);
  clearInterval(sessionInterval);
  mainInterval = null;
  sessionInterval = null;
  isRunning.value = false;
  isPaused.value = false;
  currentRound.value = 0;
  currentPhaseIdx.value = 0;
  sessionTime.value = 0;
  phaseTextKey.value = 'taskBreathing.phaseDefaults.ready';
  phaseClass.value = '';
  currentCount.value = 0;
}

async function finish() {
  resetBreathing();

  let xp = current.value.xp;
  try {
    if (!guestEmergencyMode.value && state.task) {
      const result = await apiClient.post(`/tasks/${state.task.id}/complete`, {
        self_rating_before: null,
        self_rating_after: null,
        notes: `Breathing technique: ${currentKey.value}`
      });
      xp = result?.xp_earned ?? xp;
      state.task.completed = true;
      state.task.in_progress = false;
      localStorage.setItem('peaceflow_dashboard_refresh', '1');
      window.dispatchEvent(new Event('peaceflow-dashboard-refresh'));
    }
  } catch (error) {
    console.error('Failed to complete breathing task:', error);
  }

  xpEarned.value = xp;
  showFeedback.value = true;
  spawnConfetti();
}

async function loadData() {
  guestEmergencyMode.value = isGuestEmergencyModeActive(auth.isAuthenticated, route.query.guest_emergency === '1' ? '?guest_emergency=1' : window.location.search);

  if (guestEmergencyMode.value) {
    state.task = null;
    return;
  }

  if (!auth.isAuthenticated) {
    router.replace('/login');
    return;
  }

  try {
    const [tasks] = await Promise.all([apiClient.get('/tasks')]);
    state.task = (Array.isArray(tasks) ? tasks : []).find((task) => {
      const meta = parseMeta(task);
      return meta.legacy_code === 'E2' || task.code === 'E2_DEEP_BREATHING';
    }) || null;
  } catch (error) {
    console.error('Failed to load breathing page data:', error);
  }
}

onMounted(loadData);
onBeforeUnmount(() => {
  clearInterval(mainInterval);
  clearInterval(sessionInterval);
});
</script>

<style scoped src="../assets/task-breathing.css"></style>
