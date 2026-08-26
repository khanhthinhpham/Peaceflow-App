<template>
  <div class="task-breathing-page">
    <div ref="confettiContainerEl" class="confetti-container"></div>

    <main class="main-content" style="margin-left: 0;">
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <router-link :to="tasksLink">🎮 Nhiệm vụ</router-link><span>›</span>
        <span>💨 Bài Tập Thở</span>
      </div>

      <div v-if="guestEmergencyMode" class="guest-emergency-note">
        <div class="guest-emergency-note-title">Bạn đang ở chế độ hỗ trợ khẩn cấp</div>
        <div class="guest-emergency-note-text">
          Bài tập thở này luôn mở cho mọi người, không cần đăng nhập. Đăng nhập để lưu tiến trình và nhận XP.
        </div>
      </div>

      <div class="technique-tabs">
        <div v-for="(tech, key) in TECHNIQUES" :key="key" class="tech-tab" :class="{ active: currentKey === key }" @click="selectTechnique(key)">
          <div class="tt-icon">{{ tech.icon }}</div>
          <div class="tt-name">{{ tech.name }}</div>
          <div class="tt-time">{{ tech.timeLabel }}</div>
        </div>
      </div>

      <div class="page-layout">
        <div>
          <div class="paper-card breathing-arena">
            <div class="ba-title">{{ current.icon }} {{ current.fullName }}</div>
            <div class="ba-subtitle">{{ current.subtitle }}</div>
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
              <button v-if="!isRunning" class="ctrl-btn ctrl-start" @click="startBreathing">▶ Bắt đầu</button>
              <button v-if="isRunning && !isPaused" class="ctrl-btn ctrl-pause" @click="pauseBreathing">⏸ Tạm dừng</button>
              <button v-if="isRunning && isPaused" class="ctrl-btn ctrl-pause" @click="startBreathing">▶ Tiếp tục</button>
              <button v-if="isRunning" class="ctrl-btn ctrl-reset" @click="resetBreathing">↩ Đặt lại</button>
            </div>
          </div>

          <div class="paper-card technique-info">
            <div class="ti-header">
              <div class="ti-icon">{{ current.icon }}</div>
              <div class="ti-title">{{ current.fullName }}</div>
            </div>
            <div class="ti-desc">{{ current.desc }}</div>
            <div class="ti-pattern">
              <div v-for="(phase, idx) in current.phases" :key="idx" class="tp-item" :class="phase.c">
                <div class="tp-num">{{ phase.d }}</div>
                <div class="tp-label">{{ phase.n }}</div>
                <div class="tp-unit">giây</div>
              </div>
            </div>
          </div>

          <div class="paper-card session-stats">
            <div class="ss-title">📊 Thống kê phiên này</div>
            <div class="ss-grid">
              <div class="ss-item">
                <div class="ss-num">{{ currentRound }}</div>
                <div class="ss-label">Vòng</div>
              </div>
              <div class="ss-item">
                <div class="ss-num">{{ sessionTimeLabel }}</div>
                <div class="ss-label">Thời gian</div>
              </div>
            </div>
          </div>

          <div class="paper-card feedback-section" :class="{ show: showFeedback }">
            <div class="fs-mascot">🐱</div>
            <div class="fs-title">Tuyệt vời! 🎉</div>
            <div class="fs-sub">Bạn đã hoàn thành bài tập thở.</div>
            <div class="xp-badge"><span class="xp-num">+{{ xpEarned }} XP</span></div>
            <div class="fs-actions">
              <button class="btn-primary" @click="location.reload()">🔄 Luyện tập lại</button>
              <router-link :to="tasksLink" class="btn-outline">🎮 Quay lại nhiệm vụ</router-link>
            </div>
          </div>
        </div>

        <div>
          <div class="paper-card right-card">
            <div class="rc-title">🐱 PeaceCat Tip</div>
            <div class="tip-box">{{ current.tip }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { goToLegacyPage } from '../lib/legacyApp';
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const TECHNIQUES = {
  box: { icon: '📦', name: 'Thở Vuông', fullName: '📦 Thở Vuông (Box Breathing)', timeLabel: '4-4-4-4 · 5 phút', subtitle: 'Kỹ thuật kiểm soát stress tức thì', dur: 4, rounds: 5, xp: 20, desc: 'Thở vuông là kỹ thuật điều hòa hơi thở theo chu kỳ 4 giây đều nhau.', tip: 'Box Breathing là kỹ thuật của Navy SEAL! 🌊', phases: [{ n: 'Hít vào', d: 4, c: 'inhale' }, { n: 'Giữ', d: 4, c: 'hold' }, { n: 'Thở ra', d: 4, c: 'exhale' }, { n: 'Nghỉ', d: 4, c: 'pause' }] },
  '478': { icon: '🌙', name: '4-7-8', fullName: '🌙 Thở 4-7-8', timeLabel: 'Thư giãn sâu · 5 phút', subtitle: 'Giúp thư giãn sâu và hỗ trợ giấc ngủ', dur: 19, rounds: 4, xp: 20, desc: 'Giúp thư giãn sâu và hỗ trợ giấc ngủ.', tip: '4-7-8 là thuốc ngủ tự nhiên! 🌙', phases: [{ n: 'Hít vào', d: 4, c: 'inhale' }, { n: 'Giữ', d: 7, c: 'hold' }, { n: 'Thở ra', d: 8, c: 'exhale' }] },
  coherent: { icon: '💚', name: 'Coherent', fullName: '💚 Coherent', timeLabel: '5-5 · 10 phút', subtitle: 'Tối ưu hóa HRV và nhịp tim', dur: 10, rounds: 6, xp: 25, desc: 'Tối ưu hóa HRV và nhịp tim.', tip: 'Giúp đồng bộ hóa tâm trí và cơ thể. 💚', phases: [{ n: 'Hít vào', d: 5, c: 'inhale' }, { n: 'Thở ra', d: 5, c: 'exhale' }] },
  diaphragm: { icon: '🌬️', name: 'Thở Bụng', fullName: '🌬️ Thở Bụng', timeLabel: 'Cơ bản · 5 phút', subtitle: 'Cách thở tự nhiên và hiệu quả nhất', dur: 12, rounds: 6, xp: 15, desc: 'Cách thở tự nhiên và hiệu quả nhất.', tip: 'Hãy cảm nhận bụng phồng lên khi hít vào. 🌬️', phases: [{ n: 'Hít vào', d: 4, c: 'inhale' }, { n: 'Giữ', d: 2, c: 'hold' }, { n: 'Thở ra', d: 6, c: 'exhale' }] }
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
const phaseText = ref('Sẵn sàng');
const instructionText = ref('Nhấn bắt đầu để luyện tập');

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
  phaseText.value = phase.n;
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
  phaseText.value = 'Sẵn sàng';
  instructionText.value = 'Nhấn bắt đầu để luyện tập';
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
