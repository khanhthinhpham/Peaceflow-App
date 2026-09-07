<template> 
  <main class="main-content" style="margin-left: 0;" >
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('moodCheckin.title') }}</div>
        <div class="page-subtitle">{{ t('moodCheckin.subtitle') }}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="badge-pill badge-mint">{{ todayBadgeText }}</span>
        <router-link to="/dashboard" class="btn-outline">{{ t('moodCheckin.backDashboard') }}</router-link>
      </div>
    </div>

    <!-- MODE SELECTOR -->
    <div class="mode-selector">
      <div class="mode-card active">
        <div class="mode-icon">⚡</div>
        <div class="mode-title">{{ t('moodCheckin.modes.quickTitle') }}</div>
        <div class="mode-desc">{{ t('moodCheckin.modes.quickDesc') }}</div>
        <div class="mode-time">{{ t('moodCheckin.modes.quickTime') }}</div>
      </div>
      <div class="mode-card" @click="$router.push('/mood-chat')">
        <div class="mode-icon">🐱</div>
        <div class="mode-title">{{ t('moodCheckin.modes.chatTitle') }}</div>
        <div class="mode-desc">{{ t('moodCheckin.modes.chatDesc') }}</div>
        <div class="mode-time">{{ t('moodCheckin.modes.chatTime') }}</div>
      </div>
      <div class="mode-card" @click="$router.push('/mood-assessment')">
        <div class="mode-icon">📋</div>
        <div class="mode-title">{{ t('moodCheckin.modes.testTitle') }}</div>
        <div class="mode-desc">{{ t('moodCheckin.modes.testDesc') }}</div>
        <div class="mode-time">{{ t('moodCheckin.modes.testTime') }}</div>
      </div>
    </div>

    <div class="panel active">
      <div class="paper-card checkin-card">
        <div class="step-indicator">
          <div class="si-dot" :class="dotClass(1)">1</div>
          <div class="si-line" :class="{ done: step >= 2 }"></div>
          <div class="si-dot" :class="dotClass(2)">2</div>
          <div class="si-line" :class="{ done: step >= 3 }"></div>
          <div class="si-dot" :class="dotClass(3)">3</div>
          <div class="si-line" :class="{ done: step >= 4 }"></div>
          <div class="si-dot" :class="dotClass(4)">✓</div>
        </div>

        <!-- Step 1: Mood -->
        <div class="checkin-step" :class="{ active: step === 1 }">
          <div class="mascot-speech-box">
            <span class="msb-avatar">🐱</span>
            <div class="msb-text">{{ t('moodCheckin.step1.mascotGreeting', { name: displayName }) }}</div>
          </div>
          <div class="checkin-title">{{ t('moodCheckin.step1.title') }}</div>
          <div class="checkin-sub">{{ t('moodCheckin.step1.sub') }}</div>
          <div class="mood-grid">
            <div
              v-for="option in MOOD_OPTIONS"
              :key="option.id"
              class="mood-btn"
              :class="{ selected: checkinData.moodId === option.id }"
              @click="selectMood(option)"
            >
              <span class="mood-emoji">{{ option.emoji }}</span>
              <span class="mood-label">{{ t(option.labelKey) }}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <button class="btn-primary" @click="goStep(2)">{{ t('moodCheckin.step1.continueBtn') }}</button>
          </div>
        </div>

        <!-- Step 2: Intensity -->
        <div class="checkin-step" :class="{ active: step === 2 }">
          <div class="mascot-speech-box">
            <span class="msb-avatar">{{ checkinData.mood || '🐱' }}</span>
            <div class="msb-text">{{ mascotMoodText }}</div>
          </div>
          <div class="checkin-title">{{ t('moodCheckin.step2.title') }}</div>
          <div class="checkin-sub">{{ t('moodCheckin.step2.sub') }}</div>
          <div class="slider-wrap">
            <div class="slider-labels"><span>{{ t('moodCheckin.step2.sliderLow') }}</span><span>{{ t('moodCheckin.step2.sliderHigh') }}</span></div>
            <input
              type="range" class="mood-slider" min="1" max="10"
              v-model.number="checkinData.score"
            >
            <div class="slider-value-display">
              <div class="slider-tree">{{ sliderTreeEmoji }}</div>
              <div class="slider-val">{{ checkinData.score }}</div>
              <div class="slider-val-label">{{ sliderValLabel }}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn-outline" @click="goStep(1)">{{ t('moodCheckin.step2.backBtn') }}</button>
            <button class="btn-primary" @click="goStep(3)">{{ t('moodCheckin.step2.continueBtn') }}</button>
          </div>
        </div>

        <!-- Step 3: Tags -->
        <div class="checkin-step" :class="{ active: step === 3 }">
          <div class="mascot-speech-box">
            <span class="msb-avatar">🐱</span>
            <div class="msb-text">{{ t('moodCheckin.step3.mascotText') }}</div>
          </div>
          <div class="checkin-title">{{ t('moodCheckin.step3.title') }}</div>
          <div class="checkin-sub">{{ t('moodCheckin.step3.sub') }}</div>
          <div class="tag-grid">
            <div
              v-for="tag in TAGS"
              :key="tag.id"
              class="tag-btn"
              :class="{ selected: checkinData.tags.includes(tag) }"
              @click="toggleTag(tag)"
            >{{ t(tag.labelKey) }}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn-outline" @click="goStep(2)">{{ t('moodCheckin.step3.backBtn') }}</button>
            <button class="btn-primary" :disabled="submitting" @click="submitCheckin">{{ submitting ? t('moodCheckin.step3.saving') : t('moodCheckin.step3.saveBtn') }}</button>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div class="checkin-step" :class="{ active: step === 4 }">
          <div style="text-align:center;padding:10px 0 20px;">
            <div style="font-size:3rem;margin-bottom:8px;animation:bounce-r 2s ease-in-out infinite;">{{ checkinData.mood || '🌿' }}</div>
            <div style="font-size:1.2rem;font-weight:800;margin-bottom:6px;">{{ resultTitle }}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;">{{ resultMsg }}</div>
            <div style="display:flex;justify-content:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
              <span class="badge-pill badge-mint">{{ checkinData.mood || '' }} {{ selectedMoodLabel || t('moodCheckin.step4.defaultMoodLabel') }}</span>
              <span class="badge-pill badge-peach">{{ t('moodCheckin.step4.levelBadge', { score: checkinData.score }) }}</span>
              <span class="badge-pill" style="background:var(--sky-light);color:#5090aa;border:1.5px solid var(--sky);">{{ statusBadgeText }}</span>
            </div>
          </div>
          <div class="paper-card" style="padding:18px;margin-bottom:16px;background:linear-gradient(135deg,var(--peach-light),var(--mint-light));border-color:var(--peach);">
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">{{ t('moodCheckin.step4.tasksHeading') }}</div>
            <div v-if="!suggestedTasks.length" style="font-size:0.85rem;color:var(--text-secondary);">
              {{ t('moodCheckin.step4.noTasks') }}
            </div>
            <div
              v-for="task in suggestedTasks.slice(0, 3)"
              :key="task.id"
              class="rt-item"
              @click="router.push({ path: '/task-detail', query: { id: task.id } })"
            >
              <div class="rt-icon">{{ getTaskEmoji(task.category) }}</div>
              <div class="rt-info">
                <div class="rt-name">{{ task.title }}</div>
                <div class="rt-meta">{{ task.category || 'general' }} • {{ task.duration_minutes || 0 }} {{ t('moodCheckin.step4.minutesUnit') }}</div>
              </div>
              <div class="rt-xp">+{{ task.xp_reward || 0 }} XP</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <router-link to="/tasks" class="btn-primary">{{ t('moodCheckin.step4.viewAllTasksBtn') }}</router-link>
            <button class="btn-outline" @click="resetCheckin">{{ t('moodCheckin.step4.checkinAgainBtn') }}</button>
            <router-link to="/dashboard" class="btn-outline">{{ t('moodCheckin.step4.dashboardBtn') }}</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEmergencyPopup" class="emergency-overlay show">
      <div class="emergency-popup">
        <div class="ep-header">
          <div class="ep-icon">❤️</div>
          <div class="ep-title">{{ t('moodCheckin.emergency.title') }}</div>
        </div>
        <p class="ep-text">{{ t('moodCheckin.emergency.text') }}</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">{{ t('moodCheckin.emergency.hotlineLabel') }}</div>
        </div>
        <div class="ep-actions">
          <a href="tel:0931773637" class="ep-btn ep-btn-primary">{{ t('moodCheckin.emergency.callBtn') }}</a>
          <router-link to="/experts" class="ep-btn ep-btn-secondary">{{ t('moodCheckin.emergency.chatExpertBtn') }}</router-link>
          <a href="tel:115" class="ep-btn ep-btn-secondary" style="background:var(--coral-light);color:#c05050;border-color:var(--coral);">{{ t('moodCheckin.emergency.emergencyCallBtn') }}</a>
          <button class="ep-btn ep-btn-close" @click="showEmergencyPopup = false">{{ t('moodCheckin.emergency.closeBtn') }}</button>
        </div>
        <p style="text-align:center;font-size:0.72rem;color:var(--text-light);margin-top:10px;font-style:italic;">{{ t('moodCheckin.emergency.footer') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { getTaskEmoji } from '../lib/dashboardHelpers';

const { t } = useI18n();

// `id` ỔN ĐỊNH dùng để so khớp lựa chọn trong UI; `viLabel` là giá trị THẬT gửi lên backend
// làm dominant_emotion — LUÔN LUÔN tiếng Việt, KHÔNG đổi theo ngôn ngữ đang chọn.
// Lý do: backend (expert.routes.js) có dò `emotion.includes('buồn')` để gắn cờ "cần chuyên
// gia trầm cảm" khi ghép chuyên gia phù hợp — nếu gửi nhãn tiếng Anh ("Sad") thì người dùng
// tiếng Anh sẽ không bao giờ được gắn cờ này. `labelKey` chỉ dùng để HIỂN THỊ.
const MOOD_OPTIONS = [
  { id: 'veryHappy', score: 9, viLabel: 'Rất vui', labelKey: 'moodCheckin.moods.veryHappy', emoji: '😊' },
  { id: 'comfortable', score: 7, viLabel: 'Thoải mái', labelKey: 'moodCheckin.moods.comfortable', emoji: '😌' },
  { id: 'normal', score: 5, viLabel: 'Bình thường', labelKey: 'moodCheckin.moods.normal', emoji: '😐' },
  { id: 'slightlyStressed', score: 4, viLabel: 'Hơi căng', labelKey: 'moodCheckin.moods.slightlyStressed', emoji: '😟' },
  { id: 'veryStressed', score: 2, viLabel: 'Rất căng thẳng', labelKey: 'moodCheckin.moods.veryStressed', emoji: '😰' },
  { id: 'sad', score: 2, viLabel: 'Buồn bã', labelKey: 'moodCheckin.moods.sad', emoji: '😢' },
  { id: 'angry', score: 1, viLabel: 'Tức giận', labelKey: 'moodCheckin.moods.angry', emoji: '😡' }
];

// `id` ở đây CHÍNH LÀ token gửi lên backend làm `triggers` (khớp đúng danh sách cũ đã suy
// ra qua normalizeTrigger/TRIGGER_MAP trước đây: 'work','family','relationship',...) — nên
// không cần dò chuỗi tiếng Việt bỏ dấu nữa, độ tin cậy cao hơn hẳn cách cũ và không phụ
// thuộc ngôn ngữ đang hiển thị.
const TAGS = [
  { id: 'work', labelKey: 'moodCheckin.tags.work' },
  { id: 'family', labelKey: 'moodCheckin.tags.family' },
  { id: 'relationship', labelKey: 'moodCheckin.tags.relationship' },
  { id: 'finance', labelKey: 'moodCheckin.tags.finance' },
  { id: 'health', labelKey: 'moodCheckin.tags.health' },
  { id: 'lonely', labelKey: 'moodCheckin.tags.lonely' },
  { id: 'sleep_loss', labelKey: 'moodCheckin.tags.sleep_loss' },
  { id: 'social_media', labelKey: 'moodCheckin.tags.social_media' },
  { id: 'study', labelKey: 'moodCheckin.tags.study' },
  { id: 'unknown', labelKey: 'moodCheckin.tags.unknown' }
];

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

const auth = useAuthStore();
const router = useRouter();
const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || t('dashboard.defaultUserLabel'));

const step = ref(1);
const submitting = ref(false);
const showEmergencyPopup = ref(false);
const suggestedTasks = ref([]);
const todayDone = ref(false);
// Nguyên văn tiếng Việt do BACKEND trả về (latest_mood.dominant_emotion — luôn tiếng Việt,
// xem giải thích ở MOOD_OPTIONS). Dịch lại để hiển thị qua computed todayLabelDisplay bên
// dưới, thay vì hiện thẳng ra đây.
const todayLabel = ref('');

// Trạng thái thay vì chuỗi tĩnh: gán ref.value = t('...') một lần lúc submit thì đổi ngôn
// ngữ giữa chừng (trước khi bấm nút, hoặc sau khi đã lưu) sẽ không tự cập nhật — cùng lỗi
// đã gặp và sửa ở demoSaveLabel bên IndexView.vue.
const resultPhase = ref('pending'); // 'pending' | 'saving' | 'saved' | 'failed'
const resultTitle = computed(() => t(`moodCheckin.step4.${resultPhase.value === 'pending' ? 'savedTitle' : resultPhase.value + 'Title'}`));
const resultMsg = computed(() => t(`moodCheckin.step4.${resultPhase.value === 'pending' ? 'savedMsg' : resultPhase.value + 'Msg'}`));
const statusBadgeText = computed(() => t(`moodCheckin.step4.${resultPhase.value}Badge`));

const checkinData = reactive({ score: 5, mood: null, moodId: null, tags: [] });

const selectedMoodOption = computed(() => MOOD_OPTIONS.find((o) => o.id === checkinData.moodId) || null);
const selectedMoodLabel = computed(() => (selectedMoodOption.value ? t(selectedMoodOption.value.labelKey) : ''));

// Ánh xạ ngược nhãn tiếng Việt backend trả về (todayLabel) sang đúng ngôn ngữ đang hiển thị
// — không tìm thấy (dữ liệu cũ/khác định dạng) thì hiện nguyên văn thay vì mất trắng.
const todayLabelDisplay = computed(() => {
  if (!todayLabel.value) return '';
  const found = MOOD_OPTIONS.find((o) => o.viLabel === todayLabel.value);
  return found ? t(found.labelKey) : todayLabel.value;
});

const todayBadgeText = computed(() => {
  const base = todayDone.value ? t('moodCheckin.todayDone') : t('moodCheckin.todayNotDone');
  return todayDone.value && todayLabelDisplay.value ? `${base} · ${todayLabelDisplay.value}` : base;
});

const mascotMoodText = computed(() => (
  selectedMoodLabel.value
    ? t('moodCheckin.step2.mascotWithMood', { mood: selectedMoodLabel.value })
    : t('moodCheckin.step2.mascotDefault')
));

const sliderValLabel = computed(() => {
  const val = checkinData.score;
  if (val <= 3) return t('moodCheckin.step2.level1');
  if (val <= 4) return t('moodCheckin.step2.level2');
  if (val <= 6) return t('moodCheckin.step2.level3');
  if (val <= 8) return t('moodCheckin.step2.level4');
  return t('moodCheckin.step2.level5');
});

const sliderTreeEmoji = computed(() => {
  const val = checkinData.score;
  if (val >= 7) return '🌸';
  if (val >= 4) return '🌿';
  return '🍂';
});

function dotClass(dot) {
  if (dot < step.value) return 'done';
  if (dot === step.value) return 'active';
  return '';
}

function selectMood(option) {
  checkinData.score = option.score;
  checkinData.moodId = option.id;
  checkinData.mood = option.emoji;
  setTimeout(() => goStep(2), 400);
}

function toggleTag(tag) {
  const idx = checkinData.tags.indexOf(tag);
  if (idx === -1) checkinData.tags.push(tag);
  else checkinData.tags.splice(idx, 1);
}

function goStep(target) {
  if (target === 2 && !checkinData.mood) {
    alert(t('moodCheckin.alerts.pickMoodFirst'));
    return;
  }
  step.value = target;
}

function deriveMoodPayload() {
  // `tag.id` CHÍNH LÀ token gửi backend — không cần dò/chuẩn hoá chuỗi hiển thị nữa (xem
  // giải thích ở khai báo TAGS).
  const triggers = checkinData.tags.map((tag) => tag.id);
  const anxietyScore = checkinData.score <= 2 ? 9 : checkinData.score <= 4 ? 7 : checkinData.score <= 6 ? 5 : 3;
  const stressScore = triggers.some((tag) => ['work', 'finance', 'study'].includes(tag))
    ? Math.min(10, anxietyScore + 1)
    : anxietyScore;
  const energyScore = Math.max(1, Math.min(10, checkinData.score + (checkinData.score >= 7 ? 1 : 0)));
  const sleepScore = triggers.includes('sleep_loss') ? 3 : null;

  return {
    mood_score: checkinData.score,
    anxiety_score: anxietyScore,
    stress_score: stressScore,
    energy_score: energyScore,
    sleep_quality_score: sleepScore,
    // LUÔN gửi nhãn tiếng Việt (viLabel), bất kể ngôn ngữ UI đang chọn — xem giải thích ở
    // khai báo MOOD_OPTIONS.
    dominant_emotion: selectedMoodOption.value?.viLabel || null,
    triggers,
    notes: checkinData.tags.map((tag) => t(tag.labelKey)).join(', ') || null
  };
}

async function loadRemoteProgress() {
  try {
    const progress = await apiClient.get('/progress');
    const xp = progress?.xp ?? 0;
    const level = progress?.level ?? progress?.current_level ?? 1;
    window.dispatchEvent(new CustomEvent('peaceflow:progress-updated', { detail: { xp, level } }));
  } catch (error) {
    console.error('Could not load progress from API:', error);
  }
}

async function syncTodayCheckinBadge() {
  try {
    const report = await apiClient.get('/reports/detail');
    const latestMood = report?.latest_mood || null;
    todayDone.value = isToday(latestMood?.created_at);
    todayLabel.value = latestMood?.dominant_emotion || '';
  } catch (error) {
    console.error('Could not load today check-in badge:', error);
    todayDone.value = false;
  }
}

async function fetchRecommendedTasks() {
  try {
    const data = await apiClient.get('/tasks/recommended');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Could not fetch recommended tasks:', error);
    return [];
  }
}

async function submitCheckin() {
  if (submitting.value) return;
  submitting.value = true;
  resultPhase.value = 'saving';

  try {
    await apiClient.post('/moods', deriveMoodPayload());
    window.dispatchEvent(new CustomEvent('peaceflow:mood-saved'));

    suggestedTasks.value = await fetchRecommendedTasks();
    await loadRemoteProgress();
    await syncTodayCheckinBadge();

    resultPhase.value = 'saved';
    todayDone.value = true;
    // Lưu nguyên văn tiếng Việt (viLabel) — khớp đúng định dạng backend trả về ở lần đọc
    // sau, để todayLabelDisplay ánh xạ ngược đúng ngôn ngữ đang hiển thị.
    todayLabel.value = selectedMoodOption.value?.viLabel || '';
    step.value = 4;
  } catch (error) {
    console.error('Could not save mood to API:', error);
    resultPhase.value = 'failed';
    alert(t('moodCheckin.alerts.saveFailed'));
  } finally {
    submitting.value = false;
  }
}

function resetCheckin() {
  checkinData.score = 5;
  checkinData.mood = null;
  checkinData.moodId = null;
  checkinData.tags = [];
  suggestedTasks.value = [];
  resultPhase.value = 'pending';
  step.value = 1;
}

onMounted(async () => {
  if (!auth.isAuthenticated) {
    alert(t('moodCheckin.alerts.pleaseLogin'));
    router.replace('/login');
    return;
  }
  await loadRemoteProgress();
  await syncTodayCheckinBadge();
});
</script>

<style scoped>
.main-content { margin-left: var(--sidebar-width, 240px); padding: 28px; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 800; }
.page-subtitle { font-size: 0.85rem; color: var(--text-secondary); }
.badge-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 50px; font-size: 0.72rem; font-weight: 700; }
.badge-mint { background: var(--mint-light); color: var(--mint-dark); border: 1.5px solid var(--mint); }
.badge-peach { background: var(--peach-light); color: var(--peach-dark); border: 1.5px solid var(--peach); }

.mode-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
.mode-card { padding: 20px 16px; text-align: center; cursor: pointer; border: 2px solid var(--kraft-light); border-radius: var(--radius-md); background: var(--warm-white); transition: var(--transition); box-shadow: var(--shadow-paper); }
.mode-card:hover { box-shadow: var(--shadow-paper-hover); transform: translateY(-2px); }
.mode-card.active { border-color: var(--mint-dark); background: var(--mint-light); box-shadow: 3px 3px 0px var(--mint-dark); }
.mode-icon { font-size: 2rem; margin-bottom: 8px; }
.mode-title { font-size: 0.92rem; font-weight: 700; margin-bottom: 4px; }
.mode-desc { font-size: 0.72rem; color: var(--text-secondary); }
.mode-time { font-size: 0.68rem; color: var(--text-light); font-weight: 600; margin-top: 4px; }

.panel { display: none; }
.panel.active { display: block; animation: panel-enter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
@keyframes panel-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.checkin-card { padding: 32px 36px; max-width: 680px; margin: 0 auto; }
.checkin-step { display: none; }
.checkin-step.active { display: block; animation: panel-enter 0.35s ease; }

.step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
.si-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--kraft-light); background: var(--cream); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; color: var(--text-light); transition: var(--transition); }
.si-dot.active { background: var(--mint); border-color: var(--mint-dark); color: white; box-shadow: 2px 2px 0px var(--mint-dark); }
.si-dot.done { background: var(--mint-dark); border-color: var(--mint-dark); color: white; }
.si-line { flex: 1; height: 2px; background: var(--kraft-light); border-radius: 1px; }
.si-line.done { background: var(--mint-dark); }

.checkin-title { font-size: 1.2rem; font-weight: 800; margin-bottom: 6px; }
.checkin-sub { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 22px; }

.mascot-speech-box { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--mint-light); border: 1.5px solid var(--mint); border-radius: var(--radius-sm); margin-bottom: 20px; }
.msb-avatar { font-size: 1.8rem; flex-shrink: 0; }
.msb-text { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; }

.mood-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 20px; }
.mood-btn { aspect-ratio: 1; border: 2px solid var(--kraft-light); border-radius: var(--radius-sm); background: var(--warm-white); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; transition: var(--transition); box-shadow: var(--shadow-paper); padding: 4px; }
.mood-btn:hover, .mood-btn.selected { border-color: var(--mint-dark); background: var(--mint-light); box-shadow: 3px 3px 0px var(--mint-dark); transform: translate(-1px, -1px); }
.mood-emoji { font-size: 1.6rem; }
.mood-label { font-size: 0.55rem; font-weight: 700; color: var(--text-secondary); text-align: center; line-height: 1.2; }

.slider-wrap { margin-bottom: 20px; }
.slider-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-light); margin-bottom: 8px; }
.mood-slider { width: 100%; height: 8px; -webkit-appearance: none; appearance: none; background: linear-gradient(90deg, var(--coral-light), var(--peach), var(--mint)); border-radius: 50px; outline: none; cursor: pointer; }
.mood-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--warm-white); border: 3px solid var(--mint-dark); box-shadow: 2px 2px 0px var(--mint-dark); cursor: pointer; }
.slider-value-display { text-align: center; margin-top: 10px; }
.slider-val { font-size: 2rem; font-weight: 800; color: var(--mint-dark); }
.slider-val-label { font-size: 0.78rem; color: var(--text-secondary); }
.slider-tree { font-size: 2rem; transition: var(--transition); }

.tag-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.tag-btn { padding: 7px 14px; border: 2px solid var(--kraft-light); border-radius: 50px; background: var(--warm-white); cursor: pointer; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); transition: var(--transition); box-shadow: var(--shadow-paper); }
.tag-btn:hover, .tag-btn.selected { background: var(--peach-light); border-color: var(--peach-dark); color: var(--text-primary); box-shadow: 2px 2px 0px var(--peach-dark); }

.rt-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1.5px solid var(--kraft-light); border-radius: var(--radius-sm); background: var(--cream); margin-bottom: 8px; cursor: pointer; transition: var(--transition); }
.rt-item:hover { background: var(--mint-light); border-color: var(--mint); }
.rt-icon { font-size: 1.2rem; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--mint); background: var(--mint-light); flex-shrink: 0; }
.rt-info { flex: 1; }
.rt-name { font-size: 0.85rem; font-weight: 700; }
.rt-meta { font-size: 0.7rem; color: var(--text-light); }
.rt-xp { font-size: 0.75rem; font-weight: 700; color: var(--peach-dark); background: var(--peach-light); padding: 2px 8px; border-radius: 50px; border: 1.5px solid var(--peach); }

@keyframes bounce-r { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

.emergency-overlay { position: fixed; inset: 0; background: rgba(74, 55, 40, 0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.emergency-popup { background: var(--warm-white); border-radius: var(--radius-xl, 24px); border: 3px solid var(--coral); padding: 32px; max-width: 420px; width: 100%; box-shadow: 6px 6px 0px rgba(255, 139, 139, 0.3); animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes pop-in { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.ep-header { text-align: center; margin-bottom: 16px; }
.ep-icon { font-size: 2.5rem; margin-bottom: 8px; }
.ep-title { font-size: 1.2rem; font-weight: 800; color: var(--coral); }
.ep-text { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; text-align: center; }
.ep-hotline { padding: 14px; background: rgba(255, 139, 139, 0.1); border: 2px solid var(--coral); border-radius: var(--radius-sm); text-align: center; margin-bottom: 10px; }
.ep-hotline .eph-num { font-size: 1.4rem; font-weight: 800; color: var(--coral); }
.ep-hotline .eph-label { font-size: 0.75rem; color: var(--text-secondary); }
.ep-actions { display: flex; flex-direction: column; gap: 8px; }
.ep-btn { padding: 12px; border-radius: 50px; font-size: 0.88rem; font-weight: 700; cursor: pointer; text-align: center; transition: var(--transition); text-decoration: none; display: block; }
.ep-btn-primary { background: var(--coral); color: white; border: 2px solid #e07070; box-shadow: 2px 2px 0px #e07070; }
.ep-btn-secondary { background: var(--mint-light); color: var(--mint-dark); border: 2px solid var(--mint); }
.ep-btn-close { background: transparent; color: var(--text-light); border: 2px solid var(--kraft-light); font-size: 0.8rem; }

@media (max-width: 900px) {
  .main-content { margin-left: 0; padding: 16px 16px 20px; }
}
@media (max-width: 600px) {
  .mode-selector { grid-template-columns: 1fr; }
  .mood-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
