<template>
  <main class="onboarding-page">
    <div class="progress-bar-container"><div class="progress-bar-fill" :style="{ width: `${progress}%` }" /></div>
    <router-link to="/dashboard" class="onboarding-logo"><div class="logo-icon">🌿</div><div class="logo-text">Peace<span>Flow</span></div></router-link>
    <div class="step-dots">
      <button v-for="(label, index) in stepLabels" :key="label" class="step-dot" :class="{ active: step === index, done: step > index }" :title="label" :aria-label="label" :style="index === 1 ? { display: 'none' } : undefined" @click="goToStep(index)" />
    </div>
    <div v-for="(emoji, index) in decorations" :key="index" class="bg-deco" :class="`bg-deco-${index + 1}`">{{ emoji }}</div>

    <div class="onboarding-wrapper">
      <section v-show="step === 0" class="step-screen active">
        <div class="paper-card welcome-card">
          <div class="welcome-scene"><div class="w-sun" /><div class="w-cloud w-cloud-1" /><div class="w-cloud w-cloud-2" /><div class="w-mountain-back" /><div class="w-mountain-front" /><div class="w-ground" /><div class="w-mascot"><div class="w-mascot-body"><div class="w-mascot-ears"><div class="w-mascot-ear" /><div class="w-mascot-ear" /></div><div class="w-mascot-eyes"><div class="w-mascot-eye" /><div class="w-mascot-eye" /></div><div class="w-mascot-mouth" /></div></div></div>
          <p class="handwritten welcome-quote">{{ quote }}</p>
          <h1 class="welcome-title">{{ t('onboarding.welcome.titlePre') }} <span class="hl">{{ t('onboarding.welcome.titleHighlight') }}</span><br>{{ t('onboarding.welcome.titleSuffix') }}</h1>
          <p class="welcome-sub" v-html="t('onboarding.welcome.sub')"></p>
          <div class="welcome-stats"><div><strong>10K+</strong><span>{{ t('onboarding.welcome.statsUsers') }}</span></div><div><strong>50+</strong><span>{{ t('onboarding.welcome.statsExercises') }}</span></div><div><strong>30+</strong><span>{{ t('onboarding.welcome.statsExperts') }}</span></div></div>
          <div class="step-nav center"><button class="btn-next" @click="goToStep(2)">{{ t('onboarding.welcome.cta') }}</button></div>
        </div>
      </section>

      <section v-show="step === 1" class="step-screen active">
        <div class="paper-card auth-card">
          <p style="font-size:1.8rem;margin-bottom:8px;">👋</p>
          <h2 class="step-title">{{ t('onboarding.auth.title') }}</h2>
          <p class="step-subtitle">{{ t('onboarding.auth.subtitle') }}</p>

          <div class="auth-options">
            <button class="auth-btn" @click="selectAuth('google')">
              <span class="auth-icon">🔵</span>
              <span class="auth-label">{{ t('onboarding.auth.google') }}</span>
              <span class="auth-arrow">›</span>
            </button>
            <button class="auth-btn" @click="selectAuth('apple')">
              <span class="auth-icon">🍎</span>
              <span class="auth-label">{{ t('onboarding.auth.apple') }}</span>
              <span class="auth-arrow">›</span>
            </button>
          </div>

          <div class="auth-divider">{{ t('onboarding.auth.dividerOr') }}</div>

          <div class="auth-form">
            <input v-model="authEmail" type="email" class="form-input" :placeholder="t('onboarding.auth.emailPlaceholder')">
            <input v-model="authPassword" type="password" class="form-input" :placeholder="t('onboarding.auth.passwordPlaceholder')">
            <button class="btn-next" style="width:100%;justify-content:center;" @click="nextStep">
              {{ t('onboarding.auth.createAccount') }}
            </button>
          </div>

          <div class="note-box sky">
            <span>🕵️</span>
            <span v-html="t('onboarding.auth.tryAnonNote')"></span>
          </div>
          <button class="btn-skip" style="display:block;text-align:center;margin-top:6px;width:100%;" @click="nextStep">
            {{ t('onboarding.auth.tryAnonBtn') }}
          </button>
          <div class="note-box mint">
            <span>🔐</span>
            <span v-html="t('onboarding.auth.encryptedNote')"></span>
          </div>

          <div class="step-nav" style="margin-top:18px;">
            <button class="btn-back" @click="previousStep">{{ t('onboarding.auth.back') }}</button>
          </div>
        </div>
      </section>

      <section v-show="step === 2" class="step-screen active">
        <div class="paper-card profile-card"><p style="font-size:1.8rem;margin-bottom:8px;">😊</p><h2 class="step-title">{{ t('onboarding.profileStep.title') }}</h2><p class="step-subtitle">{{ t('onboarding.profileStep.subtitle') }}</p>
          <div class="q-block"><div class="q-label"><span class="qi">🐱</span>{{ t('onboarding.profileStep.nameLabel') }}</div><input v-model="name" class="form-input" :placeholder="t('onboarding.profileStep.namePlaceholder')"></div>
          <div class="q-block"><div class="q-label"><span class="qi">🎂</span>{{ t('onboarding.profileStep.ageLabel') }}</div><div class="age-options"><button v-for="item in ages" :key="item" class="option-chip" :class="{ selected: age === item }" @click="age = item">{{ item }}</button></div></div>
          <div class="q-block"><div class="q-label"><span class="qi">🎨</span>{{ t('onboarding.profileStep.avatarLabel') }}</div><div class="avatar-grid"><button v-for="item in avatars" :key="item.name" class="avatar-option" :class="{ selected: avatar === item.emoji }" @click="avatar = item.emoji"><span class="av-emoji">{{ item.emoji }}</span><span class="av-name">{{ item.name }}</span></button></div></div>
          <div class="q-block"><div class="q-label"><span class="qi">💭</span>{{ t('onboarding.profileStep.reasonLabel') }}</div><div class="reason-options"><button v-for="item in reasons" :key="item.id" class="reason-option" :class="{ selected: reason === item.id }" @click="reason = item.id"><span class="ri">{{ item.emoji }}</span><span class="rt">{{ t(item.labelKey) }}</span></button></div></div>
          <div class="step-nav"><button class="btn-back" @click="previousStep">{{ t('onboarding.profileStep.back') }}</button><button class="btn-next" @click="nextStep">{{ t('onboarding.profileStep.continue') }}</button></div>
        </div>
      </section>

      <section v-show="step === 3" class="step-screen active"><div class="paper-card mindset-card"><p style="font-size:1.8rem;margin-bottom:8px;">🤝</p><h2 class="step-title">{{ t('onboarding.mindset.title') }}</h2><p class="mindset-intro" v-html="t('onboarding.mindset.subtitle')"></p><div class="mindset-progress"><span>{{ t('onboarding.mindset.progressLabel', { n: readCards.size }) }}</span><div class="mindset-progress-bar"><div class="mindset-progress-fill" :style="{ width: `${readCards.size * 25}%` }" /></div></div><div class="flip-cards-container"><button v-for="(card, index) in mindsetCards" :key="card.id" class="flip-card" :class="{ flipped: readCards.has(index) }" @click="flipCard(index)"><span class="flip-card-front"><span class="fci">{{ card.emoji }}</span><span class="fct">{{ t(card.titleKey) }}</span><span class="fcc">✅</span><span class="fca">›</span></span><span class="flip-card-back">{{ t(card.descKey) }}</span></button></div><div class="step-nav"><button class="btn-back" @click="previousStep">{{ t('onboarding.mindset.back') }}</button><button class="btn-next" @click="nextStep">{{ t('onboarding.mindset.agreeBtn') }}</button></div></div></section>

      <section v-show="step === 4" class="step-screen active"><div class="paper-card device-card"><p style="font-size:1.8rem;margin-bottom:4px;">⌚</p><div class="optional-badge">{{ t('onboarding.device.optionalBadge') }}</div><h2 class="step-title">{{ t('onboarding.device.title') }}</h2><p class="step-subtitle">{{ t('onboarding.device.subtitle') }}</p><div class="data-collected"><strong>{{ t('onboarding.device.dataCollectedLabel') }}</strong><div class="data-tags"><span v-for="tag in dataTags" :key="tag" class="data-tag">{{ tag }}</span></div></div><div class="device-list"><div v-for="device in devices" :key="device.name" class="device-item"><span class="di-icon">{{ device.icon }}</span><div class="di-info"><div class="di-name">{{ device.name }}</div><div class="di-desc">{{ t(device.descKey) }}</div></div><button class="di-btn" :class="{ connected: connectedDevices.has(device.name) }" :disabled="connectedDevices.has(device.name)" @click="connectDevice(device.name)">{{ connectedDevices.has(device.name) ? t('onboarding.device.connectedBtn') : t('onboarding.device.connectBtn') }}</button></div></div><div class="step-nav"><button class="btn-back" @click="previousStep">{{ t('onboarding.device.back') }}</button><div style="display:flex;gap:10px;"><button class="btn-skip" @click="nextStep">{{ t('onboarding.device.skipBtn') }}</button><button class="btn-next" @click="nextStep">{{ t('onboarding.device.continueBtn') }}</button></div></div></div></section>

      <section v-show="step === 5" class="step-screen active"><div class="paper-card complete-card"><div class="complete-anim"><div class="confetti-wrap"><i v-for="piece in confetti" :key="piece.id" class="cp" :style="piece.style" /></div><div class="complete-circle">🌿</div></div><h2 class="complete-title">{{ t('onboarding.complete.titlePrefix') }} <span class="cn">{{ name.trim() || t('onboarding.complete.defaultName') }}</span>{{ t('onboarding.complete.titleSuffix') }}</h2><p class="complete-desc" v-html="t('onboarding.complete.desc')"></p><div class="complete-summary"><div v-for="item in summary" :key="item.labelKey" class="cs-item"><div class="csi">{{ item.icon }}</div><div class="csl">{{ t(item.labelKey) }}</div><div class="csv">{{ item.value }}</div></div></div><div class="first-task"><div class="ft-label">{{ t('onboarding.complete.firstTaskLabel') }}</div><div class="ft-name">{{ t('onboarding.complete.firstTaskName') }}</div><div class="ft-meta" v-html="t('onboarding.complete.firstTaskMeta')"></div></div><div class="onboarding-warning" v-html="t('onboarding.complete.warningNote')"></div><div class="step-nav center complete-actions"><button class="btn-next" @click="complete('mood-checkin')">{{ t('onboarding.complete.startCheckinBtn') }}</button><button class="dashboard-link" @click="complete('dashboard')">{{ t('onboarding.complete.dashboardBtn') }}</button></div></div></section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/apiClient';

const router = useRouter();
const auth = useAuthStore();
const { t, tm } = useI18n();
const step = ref(0);
const name = ref(''); const age = ref(''); const avatar = ref(''); const reason = ref('');
const authEmail = ref(''); const authPassword = ref('');
const readCards = ref(new Set()); const connectedDevices = ref(new Set());
const quotes = computed(() => tm('onboarding.quotes'));
const quoteIndex = ref(Math.floor(Math.random() * 5));
const quote = computed(() => quotes.value[quoteIndex.value] || '');
const progress = computed(() => step.value * 20);
const stepLabels = computed(() => tm('onboarding.stepLabels')); const decorations = ['🌿', '🦋', '🌸', '⭐', '🍃', '🌼'];
const ages = computed(() => tm('onboarding.ages'));
const avatars = [{ emoji: '🐱', name: 'PeaceCat' }, { emoji: '🐻', name: 'CalmBear' }, { emoji: '🦊', name: 'WiseFox' }, { emoji: '🐰', name: 'HopBun' }, { emoji: '🦉', name: 'PeaceOwl' }, { emoji: '🐼', name: 'PeacePanda' }, { emoji: '🦋', name: 'FreeSpirit' }, { emoji: '🌱', name: 'GrowSeed' }];
// id = giá trị lưu vào profile.goals/onboarding_answers.reason trên backend (chỉ merge JSONB
// opaque, không so khớp theo text — đã audit) — dùng mã cố định thay vì text tiếng Việt.
const reasons = [
  { id: 'stressed', emoji: '😰', labelKey: 'onboarding.reasons.stressed' },
  { id: 'understand_self', emoji: '🔍', labelKey: 'onboarding.reasons.understandSelf' },
  { id: 'curious', emoji: '✨', labelKey: 'onboarding.reasons.curious' },
  { id: 'referred', emoji: '👥', labelKey: 'onboarding.reasons.referred' }
];
const mindsetCards = [
  { id: 'aiSupport', emoji: '🤖', titleKey: 'onboarding.mindsetCards.aiSupport.title', descKey: 'onboarding.mindsetCards.aiSupport.description' },
  { id: 'release', emoji: '💧', titleKey: 'onboarding.mindsetCards.release.title', descKey: 'onboarding.mindsetCards.release.description' },
  { id: 'selfHelp', emoji: '🌱', titleKey: 'onboarding.mindsetCards.selfHelp.title', descKey: 'onboarding.mindsetCards.selfHelp.description' },
  { id: 'patience', emoji: '🐢', titleKey: 'onboarding.mindsetCards.patience.title', descKey: 'onboarding.mindsetCards.patience.description' }
];
const dataTags = computed(() => tm('onboarding.dataTags'));
const devices = [
  { icon: '⌚', name: 'Apple Watch', descKey: 'onboarding.devices.appleWatch.desc' },
  { icon: '🟢', name: 'Garmin', descKey: 'onboarding.devices.garmin.desc' },
  { icon: '🔵', name: 'Fitbit', descKey: 'onboarding.devices.fitbit.desc' },
  { icon: '🟡', name: 'Google Fit / Samsung Health', descKey: 'onboarding.devices.googleFit.desc' }
];
const summary = computed(() => [
  { icon: '⭐', labelKey: 'onboarding.complete.xpLabel', value: '+50 XP' },
  { icon: '🌱', labelKey: 'onboarding.complete.badgeLabel', value: t('onboarding.complete.badgeValue') },
  { icon: '📋', labelKey: 'onboarding.complete.taskLabel', value: t('onboarding.complete.taskValue') }
]);
const confetti = ref([]);
function spawnConfetti() {
  const colors = ['#A8D5BA', '#FFCBA4', '#A8D8EA', '#C3AED6', '#FF8B8B', '#D4A574', '#C5E8D2'];
  confetti.value = Array.from({ length: 20 }, (_, id) => ({
    id,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 20}%`,
      background: colors[Math.floor(Math.random() * colors.length)],
      animationDelay: `${Math.random()}s`,
      animationDuration: `${1.5 + Math.random()}s`,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px'
    }
  }));
}

function replaceSet(target, item) { target.value = new Set([...target.value, item]); }
function flipCard(index) { const next = new Set(readCards.value); next.has(index) ? next.delete(index) : next.add(index); readCards.value = next; }
function connectDevice(device) { replaceSet(connectedDevices, device); }
async function saveProfile() {
  try {
    const me = {};
    if (name.value.trim()) me.display_name = name.value.trim();
    if (avatar.value) me.avatar_url = `emoji:${avatar.value}`;
    if (Object.keys(me).length) {
      await apiClient.put('/me', me);
      auth.user = { ...(auth.user || {}), ...me };
    }
    await apiClient.put('/profile', { goals: reason.value ? [reason.value] : [], onboarding_answers: { reason: reason.value || null } });
  } catch (e) {
    console.error('Save profile failed:', e);
  }
}
async function goToStep(index) {
  if (index < 0 || index > 5) return;
  const cur = step.value;
  if (cur === 2 && index > 2) {
    await saveProfile();
  }
  if (index >= 2) {
    try {
      await apiClient.put('/profile', { onboarding_answers: { started: true } });
      localStorage.setItem('peaceflow_onboarding_done', '1');
    } catch (e) {
      console.error('Mark onboarding started failed:', e);
    }
  }
  step.value = index;
  if (index === 5) setTimeout(spawnConfetti, 300);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function nextStep() { goToStep(step.value + 1); } function previousStep() { goToStep(step.value - 1); }
function selectAuth() { nextStep(); }
async function complete(destination) {
  try {
    await apiClient.put('/profile', { onboarding_answers: { completed: true } });
  } catch (e) {
    console.error('Mark onboarding failed:', e);
  }
  localStorage.setItem('peaceflow_onboarding_done', '1');
  await router.push({ name: destination });
}
onMounted(async () => { if (!await auth.waitForAuth()) { router.replace('/login'); return; } name.value = auth.user?.display_name || auth.user?.full_name || ''; });
</script>

<style scoped src="../assets/onboarding.css"></style>
<style scoped>
.welcome-stats { display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:16px; } .welcome-stats div { text-align:center; } .welcome-stats strong { display:block; font-size:1.4rem; color:var(--mint-dark); } .welcome-stats span { font-size:.75rem; color:var(--text-light); font-weight:600; }
.option-chip, .avatar-option, .reason-option, .flip-card { font:inherit; color:inherit; text-align:inherit; } .option-chip, .avatar-option, .reason-option { cursor:pointer; } .flip-card { border:0; padding:0; background:transparent; width:100%; } .flip-card-front, .flip-card-back { width:100%; }
.onboarding-warning { padding:12px 16px; background:var(--coral-light); border:1.5px solid var(--coral); border-radius:var(--border-radius-sm); font-size:.8rem; color:var(--text-secondary); margin-bottom:20px; }.complete-actions { flex-direction:column; gap:12px; }.dashboard-link { font-size:.85rem; color:var(--text-light); text-decoration:underline; background:none; border:0; cursor:pointer; }
</style>
