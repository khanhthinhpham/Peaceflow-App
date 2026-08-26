<template>
  <div class="task-detail-page">
    <div ref="confettiContainerEl" class="confetti-container"></div>

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

    <main class="main-content" style="margin-left: 0;"  v-if="task">
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link>
        <span>›</span>
        <router-link :to="tasksLink">🎮 Nhiệm vụ</router-link>
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
              <button class="btn-primary btn-large" @click="startTask">▶ Bắt đầu ngay</button>
              <button class="btn-outline">🤍 Lưu yêu thích</button>
              <button class="btn-outline" @click="shareTask">📤 Chia sẻ</button>
              <button class="btn-outline" style="color:var(--coral);border-color:var(--coral);" @click="emergencyOpen = true">🆘 Khẩn cấp</button>
            </div>
          </div>

          <!-- Phase Indicator -->
          <div class="phase-indicator">
            <div class="phase-item" :class="phaseClass(1)" @click="switchPhase(1)">
              <div class="phase-num">📖</div>
              <div>Chuẩn bị</div>
            </div>
            <div class="phase-item" :class="phaseClass(2)" @click="switchPhase(2)">
              <div class="phase-num">▶</div>
              <div>Thực hiện</div>
            </div>
            <div class="phase-item" :class="phaseClass(3)" @click="switchPhase(3)">
              <div class="phase-num">✓</div>
              <div>Hoàn thành</div>
            </div>
          </div>

          <!-- PHASE 1: PREPARATION -->
          <div class="phase-panel" :class="{ active: phase === 1 }">
            <div class="paper-card steps-card">
              <div v-if="preparation.length" style="margin-bottom: 20px;">
                <div class="steps-title">🎒 Chuẩn bị</div>
                <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
                  <li v-for="(item, idx) in preparation" :key="idx">{{ item }}</li>
                </ul>
              </div>
              <div class="steps-title">📋 Hướng dẫn từng bước</div>
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
                <div v-else style="font-size:0.82rem;color:var(--text-secondary);">Nhiệm vụ này chưa có checklist chi tiết.</div>
              </div>
              <div v-if="safetyNotes.length" style="margin-top: 20px; padding: 14px; background: rgba(255, 139, 139, 0.1); border: 1.5px solid var(--coral); border-radius: var(--radius-sm);">
                <div class="steps-title" style="color: var(--coral); margin-bottom: 8px;">⚠️ Lưu ý an toàn</div>
                <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                  <li v-for="(item, idx) in safetyNotes" :key="idx">{{ item }}</li>
                </ul>
              </div>
              <div v-if="objective" style="margin-top: 20px; padding: 14px; background: var(--mint-light); border: 1.5px solid var(--mint); border-radius: var(--radius-sm);">
                <div class="steps-title" style="color: var(--mint-dark); margin-bottom: 8px;">🎯 Mục tiêu</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">{{ objective }}</div>
              </div>
              <div style="margin-top:16px;text-align:center;">
                <button class="btn-primary" @click="startTask">▶ Bắt đầu ngay</button>
              </div>
            </div>
          </div>

          <!-- PHASE 2: EXECUTION -->
          <div class="phase-panel" :class="{ active: phase === 2 }">
            <div class="paper-card timer-card">
              <div class="timer-title">🧘 Thực hiện — {{ task.title }}</div>

              <div class="breathing-scene" v-show="isBreathing">
                <div class="breath-circle" :class="breathPhase.name">
                  <div>
                    <div class="breath-count">{{ breathPhase.count }}</div>
                    <div class="breath-label">{{ breathPhase.label }}</div>
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
                  <div class="timer-label">còn lại</div>
                </div>
              </div>

              <div class="timer-controls">
                <button class="btn-outline" @click="pauseTimer">{{ isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng' }}</button>
                <button class="btn-primary" @click="completeTask">✓ Hoàn thành</button>
                <button class="btn-outline" @click="resetTimer">↩ Bắt đầu lại</button>
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
                  <span class="xp-label">đã được cộng vào tài khoản!</span>
                </div>
                <div class="fp-mood-title">Bạn cảm thấy thế nào sau khi thiền?</div>
                <div class="fp-emojis">
                  <button
                    v-for="emoji in ['😊', '😌', '😐', '😕', '😢']"
                    :key="emoji"
                    class="fp-emoji-btn"
                    :class="{ selected: feedbackEmoji === emoji }"
                    @click="feedbackEmoji = emoji"
                  >{{ emoji }}</button>
                </div>
                <textarea class="fp-note-area" rows="3" placeholder="Ghi chú thêm cảm nhận của bạn... (tùy chọn)"></textarea>
                <div class="fp-actions">
                  <router-link :to="tasksLink" class="btn-primary">🎮 Nhiệm vụ tiếp theo</router-link>
                  <router-link to="/journal" class="btn-outline">📝 Ghi nhật ký</router-link>
                  <router-link to="/dashboard" class="btn-outline">🏡 Dashboard</router-link>
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
            <div class="ic-title">📊 Thông tin nhiệm vụ</div>
            <div class="ic-stat-row"><span class="ic-stat-label">Mã nhiệm vụ</span><span class="ic-stat-val">{{ task.code || task.id }}</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">Cấp độ</span><span class="ic-stat-val">{{ difficultyLabel }}</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">Thời gian</span><span class="ic-stat-val">{{ durationLabel }}</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">Phần thưởng</span><span class="ic-stat-val" style="color:var(--peach-dark);">+{{ task.xp_reward || 0 }} XP ⭐</span></div>
            <div class="ic-stat-row"><span class="ic-stat-label">Danh mục</span><span class="ic-stat-val">{{ task.category || 'general' }}</span></div>
            <div class="ic-stat-row">
              <span class="ic-stat-label">Trạng thái</span>
              <span class="ic-stat-val" :style="{ color: task.completed ? 'var(--mint-dark)' : task.in_progress ? 'var(--blue)' : 'var(--text-secondary)' }">{{ statusText }}</span>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">🧭 Trạng thái của bạn</div>
            <div class="community-stat">
              <div class="cs-num">{{ task.completion_count || 0 }}</div>
              <div class="cs-label">lần bạn đã hoàn thành nhiệm vụ này</div>
              <div class="cs-bar"><div class="cs-bar-fill" :style="{ width: Math.min(100, (task.completion_count || 0) * 20) + '%' }"></div></div>
              <div style="font-size:0.72rem;color:var(--text-secondary);">{{ recommendedText }}</div>
              <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:8px;">{{ steps.length }} bước thực hiện{{ tags.length ? ` · tags: ${tags.slice(0, 3).join(', ')}` : '' }}</div>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">✨ Lợi ích khoa học</div>
            <div v-if="!benefits.length" class="benefit-item"><span>Chưa có ghi chú lợi ích khoa học riêng cho nhiệm vụ này.</span></div>
            <div v-for="(benefit, idx) in benefits" :key="idx" class="benefit-item">
              <span class="benefit-icon">💡</span><span>{{ benefit }}</span>
            </div>
          </div>

          <div class="paper-card info-card">
            <div class="ic-title">🔗 Nhiệm vụ cùng cấp độ</div>
            <div v-if="!relatedTasks.length" style="font-size:0.8rem;color:var(--text-secondary);padding:10px;">Chưa có nhiệm vụ liên quan trong cùng nhóm.</div>
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
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { goToLegacyPage } from '../lib/legacyApp';
import { isGuestEmergencyModeActive } from '../lib/guestEmergency';
import { GUEST_EMERGENCY_TASKS_FALLBACK } from '../lib/taskFallbackData';

const TASK_DETAIL_FACTS = [
  'Bạn không hề đơn độc. Mỗi lần hoàn thành một nhiệm vụ nhỏ đều là một tín hiệu phục hồi có thậtS.',
  'Đi từng bước nhỏ vẫn là tiến lên. Nhịp ổn định quan trọng hơn tốc độ.',
  'Khi cơ thể dịu lại, tâm trí sẽ theo sau. Hãy cho mình thêm một chút thời gian.',
  'Một nhiệm vụ đơn giản nhưng hoàn thành trọn vẹn thường hiệu quả hơn rất nhiều so với cố gắng quá sức.'
];

const BREATH_PHASES = [
  { name: 'inhale', label: 'Hít vào', count: '4' },
  { name: 'hold', label: 'Giữ', count: '4' },
  { name: 'exhale', label: 'Thở ra', count: '6' }
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

function getTaskMeta(t) {
  if (!t?.metadata) return {};
  if (typeof t.metadata === 'string') {
    try { return JSON.parse(t.metadata); } catch (_e) { return {}; }
  }
  return t.metadata;
}
function getTaskIcon(t) {
  return getTaskMeta(t).icon || t?.icon || '🌱';
}
function getTaskDescription(t) {
  return t?.description || getTaskMeta(t).objective || 'Nhiệm vụ này chưa có mô tả chi tiết.';
}
function getTaskDurationLabel(t) {
  const minutes = Number(t?.duration_minutes || 0);
  if (!minutes) return 'Tùy chọn';
  return minutes === 1 ? '1 phút' : `${minutes} phút`;
}
function getTaskSectionId(t) {
  if (t?.category === 'emergency') return 'emergency';
  return t?.difficulty || 'easy';
}
function getDifficultyLabel(t) {
  const sectionId = getTaskSectionId(t);
  if (sectionId === 'emergency') return '🔴 Khẩn cấp';
  if (sectionId === 'medium') return '🟡 Trung bình';
  if (sectionId === 'hard') return '🟠 Nâng cao';
  return '🟢 Dễ';
}
function getBadgeClass(t) {
  const sectionId = getTaskSectionId(t);
  if (sectionId === 'emergency') return 'badge-coral';
  if (sectionId === 'medium') return 'badge-yellow';
  if (sectionId === 'hard') return 'badge-peach';
  return 'badge-mint';
}
function isBreathingTask(t) {
  const title = (t?.title || '').toLowerCase();
  return t?.category === 'breathing' || title.includes('thở') || title.includes('breathing');
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
const quote = computed(() => meta.value.quote || 'Mỗi nhiệm vụ nhỏ hoàn thành là một bước tiến rõ ràng của quá trình hồi phục.');

const statusText = computed(() => (
  task.value?.completed ? `Đã hoàn thành ${task.value.completion_count || 1} lần`
    : task.value?.in_progress ? 'Đang thực hiện'
    : 'Chưa bắt đầu'
));
const recommendedText = computed(() => (
  task.value?.recommended ? 'Có trong gợi ý hôm nay' : 'Không nằm trong nhóm ưu tiên hôm nay'
));
const relatedTasks = computed(() => allTasks.value
  .filter((c) => c.id !== task.value?.id && getTaskSectionId(c) === sectionId.value)
  .slice(0, 4));

const displayName = computed(() => {
  if (guestEmergencyMode.value) return 'Khách khẩn cấp';
  return auth.user?.display_name || auth.user?.full_name || 'Bạn';
});
const feedbackTitle = computed(() => (
  guestEmergencyMode.value ? 'Bạn vừa hoàn thành một bài hỗ trợ khẩn cấp' : `Tuyệt vời, ${displayName.value}! 🎉`
));
const feedbackSubtitle = computed(() => {
  if (!task.value) return '';
  return guestEmergencyMode.value
    ? `Bạn đã hoàn thành "${task.value.title}". Đăng nhập để lưu lịch sử và mở thêm nhiều bài tập khác.`
    : `Bạn vừa hoàn thành "${task.value.title}". Hệ thống đã ghi nhận kết quả vào lịch sử nhiệm vụ của bạn.`;
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
const timerPhaseText = ref('Đi theo từng bước và nhấn Hoàn thành khi đã xong.');

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
  timerPhaseText.value = isBreathingTask(task.value)
    ? 'Giữ nhịp thở theo vòng lặp hiển thị.'
    : 'Bắt đầu thực hiện theo các bước ở phần chuẩn bị.';

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
  timerPhaseText.value = isPaused.value ? 'Đã tạm dừng.' : 'Tiếp tục theo nhịp của bạn.';
}

function resetTimer() {
  isPaused.value = true;
  remainingSeconds.value = totalSeconds.value;
  timerPhaseText.value = 'Đã đưa nhiệm vụ về trạng thái sẵn sàng.';
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
  alert('Đã sao chép liên kết nhiệm vụ vào clipboard.');
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
  timerPhaseText.value = isBreathingTask(nextTask)
    ? 'Hít vào chậm và sâu theo nhịp hiển thị.'
    : 'Đi theo từng bước và nhấn Hoàn thành khi đã xong.';
  stressFact.value = TASK_DETAIL_FACTS[Math.floor(Math.random() * TASK_DETAIL_FACTS.length)];
  phase.value = 1;
}

async function loadTaskDetail() {
  guestEmergencyMode.value = isGuestEmergencyModeActive(auth.isAuthenticated);

  if (guestEmergencyMode.value) {
    const taskId = route.query.id || 'E1_SEPARATE_ENV';
    const publicEmergencyTasks = await apiClient.request('/tasks/public-emergency', { method: 'GET' }, { retryAuth: false });
    const guestTasks = Array.isArray(publicEmergencyTasks) && publicEmergencyTasks.length
      ? publicEmergencyTasks
      : GUEST_EMERGENCY_TASKS_FALLBACK;

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
