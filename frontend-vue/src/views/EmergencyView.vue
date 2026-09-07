<template>
  <div class="emergency-page">
    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible }">✅ <span>{{ toastText }}</span></div>

    <!-- Task Detail Modal -->
    <div class="modal-overlay" :class="{ show: modalOpen }" @click="closeTaskModalOnBackdrop">
      <div class="task-modal">
        <button class="tm-close" @click="closeTaskModal">✕</button>
        <div class="tm-icon">{{ activeTask?.icon }}</div>
        <div class="tm-title">{{ activeTask ? t(activeTask.titleKey) : '' }}</div>
        <div class="tm-desc">{{ activeTask ? t(activeTask.descKey) : '' }}</div>
        <div class="tm-steps">
          <div v-for="(step, idx) in activeTask ? tm(activeTask.stepsKey) : []" :key="idx" class="tm-step">
            <div class="tm-step-num">{{ idx + 1 }}</div>
            <div class="tm-step-text">{{ step }}</div>
          </div>
        </div>
        <div class="tm-timer" v-if="activeTask?.timeMinutes != null">
          <div class="tm-timer-num">{{ modalTimerLabel }}</div>
          <div class="tm-timer-label">{{ t('emergency.taskModal.timeRemainingLabel') }}</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button
            v-if="!modalTimerRunning"
            style="padding:10px 24px;border:2px solid var(--mint-dark);border-radius:50px;background:var(--mint);color:var(--text-primary);font-family:'Nunito',sans-serif;font-size:0.85rem;font-weight:700;cursor:pointer;"
            @click="startModalTimer"
          >{{ t('emergency.taskModal.startBtn') }}</button>
          <button
            style="padding:10px 20px;border:2px solid var(--kraft-light);border-radius:50px;background:transparent;color:var(--text-secondary);font-family:'Nunito',sans-serif;font-size:0.82rem;font-weight:600;cursor:pointer;"
            @click="closeTaskModal"
          >{{ t('emergency.taskModal.closeBtn') }}</button>
        </div>
      </div>
    </div>

    <main class="main-content">
      <div class="breadcrumb">
        <router-link to="/dashboard">{{ t('emergency.breadcrumbDashboard') }}</router-link><span>›</span>
        <span>{{ t('emergency.breadcrumbCurrent') }}</span>
      </div>

      <!-- Hero -->
      <div class="hero-section">
        <div class="hs-deco1">❤️</div>
        <div class="hs-deco2">🌿</div>
        <div class="hs-heart">❤️</div>
        <div class="hs-title">{{ t('emergency.hero.titlePre') }} <span>{{ t('emergency.hero.titleHighlight') }}</span></div>
        <div class="hs-subtitle">{{ t('emergency.hero.subtitle') }}</div>
        <div class="hs-reassure">{{ t('emergency.hero.reassure') }}</div>
      </div>

      <!-- Hotlines -->
      <div class="section-title">{{ t('emergency.hotlines.sectionTitle') }}</div>
      <div class="hotline-grid">
        <a href="tel:0931773637" class="paper-card hotline-card hc-main" @click="logHotlineView('0931773637')">
          <div class="hc-icon">📞</div>
          <div class="hc-num">0931773637</div>
          <div class="hc-label">{{ t('emergency.hotlines.mainLabel') }}</div>
          <div class="hc-desc">{{ t('emergency.hotlines.mainDesc') }}</div>
          <div class="hc-badge">{{ t('emergency.hotlines.mainBadge') }}</div>
        </a>
        <router-link to="/experts" class="paper-card hotline-card hc-expert">
          <div class="hc-icon">🩺</div>
          <div class="hc-num">{{ t('emergency.hotlines.expertNum') }}</div>
          <div class="hc-label">{{ t('emergency.hotlines.expertLabel') }}</div>
          <div class="hc-desc">{{ t('emergency.hotlines.expertDesc') }}</div>
          <div class="hc-badge">{{ t('emergency.hotlines.expertBadge') }}</div>
        </router-link>
        <a href="tel:115" class="paper-card hotline-card hc-rescue" @click="logHotlineView('115')">
          <div class="hc-icon">🚑</div>
          <div class="hc-num">115</div>
          <div class="hc-label">{{ t('emergency.hotlines.rescueLabel') }}</div>
          <div class="hc-desc">{{ t('emergency.hotlines.rescueDesc') }}</div>
          <div class="hc-badge">{{ t('emergency.hotlines.rescueBadge') }}</div>
        </a>
      </div>

      <div class="emergency-layout">
        <!-- LEFT -->
        <div>
          <!-- Breathing Exercise -->
          <div class="paper-card breathing-card">
            <div class="bc-title">{{ t('emergency.breathing.title') }}</div>
            <div class="bc-desc">{{ t('emergency.breathing.desc') }}</div>
            <div class="breath-circle" :class="breathPhaseClass" @click="startBreathing">
              <span>{{ breathText }}</span>
            </div>
            <div class="breath-label">{{ breathLabel }}</div>
            <div class="breath-progress">
              <div v-for="i in 5" :key="i" class="bp-dot" :class="{ active: i <= breathCycle + 1 && isBreathing }"></div>
            </div>
            <div class="breath-controls">
              <button v-if="!isBreathing" class="bc-ctrl-btn bc-start" @click="startBreathing">{{ t('emergency.breathing.startBtn') }}</button>
              <button v-else class="bc-ctrl-btn bc-stop" @click="stopBreathing()">{{ t('emergency.breathing.stopBtn') }}</button>
            </div>
          </div>

          <!-- Immediate Tasks -->
          <div class="section-title">{{ t('emergency.tasksSectionTitle') }}</div>
          <div class="task-grid">
            <div v-for="(task, idx) in EMERGENCY_TASKS" :key="task.id" class="paper-card etask-card" @click="openTaskModal(idx)">
              <div class="etc-icon">{{ task.icon }}</div>
              <div class="etc-title">{{ t(task.titleKey) }}</div>
              <div class="etc-desc">{{ t(task.descKey) }}</div>
              <div class="etc-meta">
                <div class="etc-time">⏱ {{ t(task.timeKey) }}</div>
              </div>
              <button class="etc-btn" @click.stop="openTaskModal(idx)">{{ t('emergency.breathing.startBtn') }}</button>
            </div>
          </div>

          <!-- 5-4-3-2-1 Grounding -->
          <div class="paper-card grounding-card">
            <div class="section-title" style="margin-bottom:10px;">{{ t('emergency.grounding.sectionTitle') }}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">{{ t('emergency.grounding.subtitle') }}</div>
            <div class="grounding-steps">
              <div v-for="(s, idx) in GROUNDING_STEPS" :key="s.id" class="gs-item" :class="{ done: groundingDone.has(idx) }" @click="toggleGrounding(idx)">
                <div class="gs-num">{{ s.num }}</div>
                <div class="gs-content">
                  <div class="gs-title">{{ t(s.titleKey) }}</div>
                  <div class="gs-desc">{{ t(s.descKey) }}</div>
                </div>
                <div class="gs-check">✅</div>
              </div>
            </div>
            <div style="margin-top:10px;text-align:center;">
              <button
                style="padding:8px 20px;border:2px solid var(--mint-dark);border-radius:50px;background:var(--mint-light);color:var(--mint-dark);font-family:'Nunito',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;"
                @click="resetGrounding"
              >{{ t('emergency.grounding.resetBtn') }}</button>
            </div>
          </div>

          <!-- Affirmations -->
          <div class="paper-card affirmation-card">
            <div class="ac-title">{{ t('emergency.affirmation.sectionTitle') }}</div>
            <div class="affirmation-text" @click="nextAffirmation">"{{ AFFIRMATIONS[affirmationIndex] }}"</div>
            <div class="ac-hint">{{ t('emergency.affirmation.hint') }}</div>
          </div>

          <!-- Disclaimer -->
          <div style="padding:14px 16px;background:rgba(255,139,139,0.05);border:1.5px solid rgba(255,139,139,0.2);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;" v-html="t('emergency.disclaimer')"></div>
        </div>

        <!-- RIGHT -->
        <div>
          <!-- Expert Quick Connect -->
          <div class="paper-card right-card">
            <div class="rc-title">{{ t('emergency.expertQuick.title') }}</div>
            <div class="expert-quick">
              <div v-for="e in EXPERTS_ONLINE" :key="e.name" class="eq-item">
                <div class="eq-avatar">{{ e.avatar }}</div>
                <div class="eq-info">
                  <div class="eq-name">{{ e.name }}</div>
                  <div class="eq-status">{{ e.online ? t('emergency.expertQuick.online') : t('emergency.expertQuick.offline') }}</div>
                </div>
                <button class="eq-btn" @click="connectExpert(e.name)">{{ e.online ? t('emergency.expertQuick.chatBtn') : t('emergency.expertQuick.scheduleBtn') }}</button>
              </div>
            </div>
            <router-link
              to="/experts"
              style="display:block;margin-top:8px;padding:9px;border:1.5px solid var(--lavender);border-radius:50px;text-align:center;font-size:0.78rem;font-weight:700;color:#8a6aaa;text-decoration:none;transition:var(--transition);background:var(--lavender-light);"
            >{{ t('emergency.expertQuick.viewAllBtn') }}</router-link>
          </div>

          <!-- Safe Plan -->
          <div class="paper-card safe-plan-card">
            <div class="rc-title">{{ t('emergency.safePlan.title') }}</div>
            <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">{{ t('emergency.safePlan.subtitle') }}</div>
            <div class="sp-step">
              <div class="sp-num">1</div>
              <div class="sp-text">{{ t('emergency.safePlan.step1') }}</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">2</div>
              <div class="sp-text">{{ t('emergency.safePlan.step2') }}</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">3</div>
              <div class="sp-text">{{ t('emergency.safePlan.step3') }}</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">4</div>
              <div class="sp-text">{{ t('emergency.safePlan.step4') }}</div>
            </div>
            <div class="sp-step">
              <div class="sp-num">5</div>
              <div class="sp-text">{{ t('emergency.safePlan.step5') }}</div>
            </div>
            <button
              style="width:100%;margin-top:10px;padding:8px;border:1.5px solid var(--mint-dark);border-radius:50px;background:var(--mint-dark);color:white;font-family:'Nunito',sans-serif;font-size:0.75rem;font-weight:700;cursor:pointer;"
              @click="editSafePlan"
            >{{ t('emergency.safePlan.customizeBtn') }}</button>
          </div>

          <!-- PeaceCat Message -->
          <div class="paper-card message-card">
            <div class="mc-mascot">🐱</div>
            <div class="mc-text" :style="{ opacity: peaceCatMessageOpacity }">{{ PeaceCAT_MESSAGES[peaceCatMessageIndex] }}</div>
          </div>

          <!-- Resources -->
          <div class="paper-card right-card">
            <div class="rc-title">{{ t('emergency.resources.title') }}</div>
            <router-link to="/mood-chat" class="resource-item"><span class="ri-icon">💬</span><span class="ri-text">{{ t('emergency.resources.aiChat') }}</span><span class="ri-arrow">›</span></router-link>
            <router-link to="/tasks" class="resource-item"><span class="ri-icon">🎮</span><span class="ri-text">{{ t('emergency.resources.tasks') }}</span><span class="ri-arrow">›</span></router-link>
            <router-link to="/journal" class="resource-item"><span class="ri-icon">📝</span><span class="ri-text">{{ t('emergency.resources.journal') }}</span><span class="ri-arrow">›</span></router-link>
            <router-link to="/community" class="resource-item"><span class="ri-icon">👥</span><span class="ri-text">{{ t('emergency.resources.community') }}</span><span class="ri-arrow">›</span></router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const { t, tm } = useI18n();

// timeMinutes tách riêng khỏi timeKey (chuỗi hiển thị đã dịch) — modal timer và điều kiện hiện
// đếm ngược không được phép so khớp theo text đã dịch (vd 'phút'/'min' khác nhau theo ngôn ngữ).
const EMERGENCY_TASKS = [
  { id: 'detach', icon: '🌊', titleKey: 'emergency.tasks.detach.title', descKey: 'emergency.tasks.detach.desc', timeKey: 'emergency.tasks.detach.time', timeMinutes: 5, stepsKey: 'emergency.tasks.detach.steps' },
  { id: 'stopDropBreathe', icon: '🛑', titleKey: 'emergency.tasks.stopDropBreathe.title', descKey: 'emergency.tasks.stopDropBreathe.desc', timeKey: 'emergency.tasks.stopDropBreathe.time', timeMinutes: 2, stepsKey: 'emergency.tasks.stopDropBreathe.steps' },
  { id: 'coldWater', icon: '💧', titleKey: 'emergency.tasks.coldWater.title', descKey: 'emergency.tasks.coldWater.desc', timeKey: 'emergency.tasks.coldWater.time', timeMinutes: 1, stepsKey: 'emergency.tasks.coldWater.steps' },
  { id: 'warmCup', icon: '☕', titleKey: 'emergency.tasks.warmCup.title', descKey: 'emergency.tasks.warmCup.desc', timeKey: 'emergency.tasks.warmCup.time', timeMinutes: 3, stepsKey: 'emergency.tasks.warmCup.steps' },
  { id: 'selfForgive', icon: '🤲', titleKey: 'emergency.tasks.selfForgive.title', descKey: 'emergency.tasks.selfForgive.desc', timeKey: 'emergency.tasks.selfForgive.time', timeMinutes: 5, stepsKey: 'emergency.tasks.selfForgive.steps' },
  { id: 'cryIfNeeded', icon: '🎵', titleKey: 'emergency.tasks.cryIfNeeded.title', descKey: 'emergency.tasks.cryIfNeeded.desc', timeKey: 'emergency.tasks.cryIfNeeded.time', timeMinutes: null, stepsKey: 'emergency.tasks.cryIfNeeded.steps' }
];

const GROUNDING_STEPS = [
  { id: 'see', num: '5', titleKey: 'emergency.groundingSteps.see.title', descKey: 'emergency.groundingSteps.see.desc' },
  { id: 'touch', num: '4', titleKey: 'emergency.groundingSteps.touch.title', descKey: 'emergency.groundingSteps.touch.desc' },
  { id: 'hear', num: '3', titleKey: 'emergency.groundingSteps.hear.title', descKey: 'emergency.groundingSteps.hear.desc' },
  { id: 'smell', num: '2', titleKey: 'emergency.groundingSteps.smell.title', descKey: 'emergency.groundingSteps.smell.desc' },
  { id: 'taste', num: '1', titleKey: 'emergency.groundingSteps.taste.title', descKey: 'emergency.groundingSteps.taste.desc' }
];

const AFFIRMATIONS = computed(() => tm('emergency.affirmations'));

// Tên/avatar chuyên gia là dữ liệu demo cục bộ (không phải từ backend) — giữ nguyên tên,
// chỉ dịch trạng thái online/offline và nhãn nút qua t() ở template.
const EXPERTS_ONLINE = [
  { name: 'ThS. Lan Anh', avatar: '👩‍⚕️', online: true },
  { name: 'BS. Minh Tâm', avatar: '🧑‍⚕️', online: true },
  { name: 'ThS. Hoài Phương', avatar: '👩', online: false }
];

const PeaceCAT_MESSAGES = computed(() => tm('emergency.peaceCatMessages'));

async function logEmergencyEvent(eventType, payload = {}) {
  if (!auth.isAuthenticated) return;
  try {
    await apiClient.post('/emergency/log', { event_type: eventType, payload });
  } catch (_) {}
}

function logHotlineView(number) {
  logEmergencyEvent('hotline_view', { number });
}

// Toast
const toastVisible = ref(false);
const toastText = ref('');
let toastTimer = null;
function showToast(message) {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 3000);
}

// Breathing
const BREATH_PHASES = computed(() => [
  { class: 'inhale', labelKey: 'emergency.breathPhases.inhaleLabel', textKey: 'emergency.breathPhases.inhaleText', duration: 4000 },
  { class: 'hold', labelKey: 'emergency.breathPhases.holdLabel', textKey: 'emergency.breathPhases.holdText', duration: 4000 },
  { class: 'exhale', labelKey: 'emergency.breathPhases.exhaleLabel', textKey: 'emergency.breathPhases.exhaleText', duration: 4000 },
  { class: '', labelKey: 'emergency.breathPhases.restLabel', textKey: 'emergency.breathPhases.restText', duration: 2000 }
]);
const isBreathing = ref(false);
const breathPhaseIdx = ref(0);
const breathCycle = ref(0);
// Trạng thái thuần (không phải chuỗi đã dịch) — breathText/breathLabel/breathPhaseClass là
// computed từ đây, để không bị kẹt bản dịch cũ khi đổi ngôn ngữ giữa lúc đang thở.
const breathDisplayState = ref({ kind: 'idle' }); // { kind: 'idle' | 'phase' | 'completed', idx? }
let breathTimeout = null;

const breathPhaseClass = computed(() => breathDisplayState.value.kind === 'phase' ? BREATH_PHASES.value[breathDisplayState.value.idx].class : '');
const breathText = computed(() => breathDisplayState.value.kind === 'phase' ? t(BREATH_PHASES.value[breathDisplayState.value.idx].textKey) : t('emergency.breathPhases.startText'));
const breathLabel = computed(() => {
  if (breathDisplayState.value.kind === 'phase') return t(BREATH_PHASES.value[breathDisplayState.value.idx].labelKey);
  if (breathDisplayState.value.kind === 'completed') return t('emergency.breathPhases.completedLabel');
  return t('emergency.breathPhases.startHint');
});

function startBreathing() {
  if (isBreathing.value) return;
  isBreathing.value = true;
  breathPhaseIdx.value = 0;
  breathCycle.value = 0;
  logEmergencyEvent('breathing_tool');
  runBreathPhase();
}

function runBreathPhase() {
  const phase = BREATH_PHASES.value[breathPhaseIdx.value];
  breathDisplayState.value = { kind: 'phase', idx: breathPhaseIdx.value };
  breathTimeout = setTimeout(() => {
    breathTimeout = null;
    breathPhaseIdx.value = (breathPhaseIdx.value + 1) % BREATH_PHASES.value.length;
    if (breathPhaseIdx.value === 0) {
      breathCycle.value += 1;
      if (breathCycle.value >= 5) {
        stopBreathing(true);
        return;
      }
    }
    runBreathPhase();
  }, phase.duration);
}

function stopBreathing(completed = false) {
  if (breathTimeout) { clearTimeout(breathTimeout); breathTimeout = null; }
  breathDisplayState.value = { kind: completed ? 'completed' : 'idle' };
  isBreathing.value = false;
  if (completed) showToast(t('emergency.toast.breathingDone'));
}

// Grounding
const groundingDone = ref(new Set());
function toggleGrounding(idx) {
  const next = new Set(groundingDone.value);
  if (next.has(idx)) next.delete(idx);
  else next.add(idx);
  groundingDone.value = next;
  if (groundingDone.value.size === GROUNDING_STEPS.length) {
    showToast(t('emergency.grounding.completedToast'));
  }
}
function resetGrounding() {
  groundingDone.value = new Set();
}

// Affirmations
const affirmationIndex = ref(Math.floor(Math.random() * 21));
function nextAffirmation() {
  affirmationIndex.value = (affirmationIndex.value + 1) % AFFIRMATIONS.value.length;
}

// PeaceCat rotating message
const peaceCatMessageIndex = ref(0);
const peaceCatMessageOpacity = ref('1');
let peaceCatInterval = null;
function rotatePeaceCatMessage() {
  peaceCatInterval = setInterval(() => {
    peaceCatMessageOpacity.value = '0';
    setTimeout(() => {
      peaceCatMessageIndex.value = (peaceCatMessageIndex.value + 1) % PeaceCAT_MESSAGES.value.length;
      peaceCatMessageOpacity.value = '1';
    }, 400);
  }, 6000);
}

// Task modal
const modalOpen = ref(false);
const activeTaskIdx = ref(0);
const activeTask = computed(() => EMERGENCY_TASKS[activeTaskIdx.value]);
const modalTimerSeconds = ref(0);
const modalTimerRunning = ref(false);
let modalTimerInterval = null;

const modalTimerLabel = computed(() => {
  const m = Math.floor(modalTimerSeconds.value / 60).toString().padStart(2, '0');
  const s = (modalTimerSeconds.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

function openTaskModal(idx) {
  activeTaskIdx.value = idx;
  const task = EMERGENCY_TASKS[idx];
  modalTimerSeconds.value = task.timeMinutes != null ? task.timeMinutes * 60 : 0;
  modalOpen.value = true;
}

function closeTaskModalOnBackdrop(event) {
  if (event.target.classList.contains('modal-overlay')) closeTaskModal();
}

function closeTaskModal() {
  modalOpen.value = false;
  stopModalTimer();
}

function startModalTimer() {
  if (modalTimerInterval) return;
  modalTimerRunning.value = true;
  modalTimerInterval = setInterval(() => {
    modalTimerSeconds.value -= 1;
    if (modalTimerSeconds.value <= 0) {
      stopModalTimer();
      showToast(t('emergency.toast.taskDone'));
    }
  }, 1000);
}

function stopModalTimer() {
  if (modalTimerInterval) {
    clearInterval(modalTimerInterval);
    modalTimerInterval = null;
  }
  modalTimerRunning.value = false;
}

// Misc actions
function connectExpert(name) {
  logEmergencyEvent('expert_request', { expert_name: name });
  showToast(t('emergency.toast.connectingExpert', { name }));
  setTimeout(() => router.push('/experts'), 1500);
}

function editSafePlan() {
  showToast(t('emergency.toast.safePlanComingSoon'));
}

onMounted(() => {
  rotatePeaceCatMessage();
});

onBeforeUnmount(() => {
  if (breathTimeout) clearTimeout(breathTimeout);
  if (modalTimerInterval) clearInterval(modalTimerInterval);
  if (peaceCatInterval) clearInterval(peaceCatInterval);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped src="../assets/emergency.css"></style>
