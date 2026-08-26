<template>
  <div class="task-meditation-page">
    <main class="main-content" style="margin-left: 0;">
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <router-link :to="tasksLink">🎮 Nhiệm vụ</router-link><span>›</span>
        <span>🧘 Thiền</span>
      </div>

      <div v-if="guestEmergencyMode" class="guest-emergency-note">
        <div class="guest-emergency-note-title">Bạn đang ở chế độ hỗ trợ khẩn cấp</div>
        <div class="guest-emergency-note-text">
          Bài thiền này luôn mở cho mọi người, không cần đăng nhập. Đăng nhập để lưu tiến trình và nhận XP.
        </div>
      </div>

      <div class="page-layout">
        <div class="paper-card meditation-arena" v-show="!showFeedback">
          <div class="ma-title">🧘 Thiền Chánh Niệm</div>
          <div class="ma-subtitle">Tập trung vào hiện tại</div>
          <div class="visual-container">
            <div class="lotus"></div>
            <div class="timer-display">{{ timerLabel }}</div>
          </div>
          <div class="med-controls">
            <button v-if="!isRunning" class="mc-btn mc-start" @click="startMeditation">▶ Bắt đầu</button>
          </div>
        </div>

        <div class="paper-card feedback-card" :class="{ show: showFeedback }">
          <h2>Tuyệt vời! 🎉</h2>
          <div class="xp-badge"><span class="xp-num">+{{ xpEarned }} XP</span></div>
          <br>
          <router-link :to="tasksLink" class="btn-primary" style="text-decoration:none;">Quay lại nhiệm vụ</router-link>
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
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const guestEmergencyMode = ref(false);
const tasksLink = computed(() => (guestEmergencyMode.value ? { path: '/tasks', query: { guest_emergency: '1' } } : '/tasks'));

const timeLeft = ref(300);
const isRunning = ref(false);
const showFeedback = ref(false);
const xpEarned = ref(25);
const state = reactive({ task: null });
let interval = null;

const timerLabel = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

function parseMeta(task) {
  if (!task?.metadata) return {};
  if (typeof task.metadata === 'string') {
    try { return JSON.parse(task.metadata); } catch { return {}; }
  }
  return task.metadata;
}

async function startMeditation() {
  if (isRunning.value) return;
  isRunning.value = true;

  if (!guestEmergencyMode.value && state.task && !state.task.in_progress && !state.task.completed) {
    try {
      await apiClient.post(`/tasks/${state.task.id}/start`, {});
      state.task.in_progress = true;
    } catch (error) {
      console.error('Failed to start meditation task:', error);
    }
  }

  interval = setInterval(() => {
    timeLeft.value -= 1;
    if (timeLeft.value <= 0) {
      clearInterval(interval);
      finish();
    }
  }, 1000);
}

async function finish() {
  let xp = 25;
  try {
    if (!guestEmergencyMode.value && state.task) {
      const result = await apiClient.post(`/tasks/${state.task.id}/complete`, {
        self_rating_before: null,
        self_rating_after: null,
        notes: 'Meditation session completed'
      });
      xp = result?.xp_earned ?? xp;
      state.task.completed = true;
      state.task.in_progress = false;
      localStorage.setItem('peaceflow_dashboard_refresh', '1');
      window.dispatchEvent(new Event('peaceflow-dashboard-refresh'));
    }
  } catch (error) {
    console.error('Failed to complete meditation task:', error);
  }

  xpEarned.value = xp;
  showFeedback.value = true;
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
    const tasks = await apiClient.get('/tasks');
    state.task = (Array.isArray(tasks) ? tasks : []).find((task) => {
      const meta = parseMeta(task);
      const title = String(task.title || '').toLowerCase();
      return meta.legacy_code === '2.3' || task.code === '2.3' || task.category === 'meditation' || title.includes('thiền');
    }) || null;
  } catch (error) {
    console.error('Failed to load meditation page data:', error);
  }
}

onMounted(loadData);
onBeforeUnmount(() => clearInterval(interval));
</script>

<style scoped src="../assets/task-meditation.css"></style>
