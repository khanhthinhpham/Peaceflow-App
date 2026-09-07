<template>
  <div class="index-page">
    <!-- Mobile Nav Overlay -->
    <div class="mobile-nav-overlay" :class="{ open: mobileNavOpen }" @click="closeMobileNav"></div>
    <div class="mobile-nav-panel" :class="{ open: mobileNavOpen }">
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="mnp-close" @click="closeMobileNav">✕</button>
      </div>
      <a href="#features" class="mnp-link" @click="closeMobileNav">✨ {{ t('landing.nav.features') }}</a>
      <a href="#how-it-works" class="mnp-link" @click="closeMobileNav">💡 {{ t('landing.nav.howItWorks') }}</a>
      <router-link to="/mood-assessment" class="mnp-link">📋 {{ t('landing.nav.tests') }}</router-link>
      <router-link to="/experts" class="mnp-link">🩺 {{ t('landing.nav.experts') }}</router-link>
      <router-link to="/community" class="mnp-link">👥 {{ t('landing.nav.community') }}</router-link>
      <router-link to="/emergency" class="mnp-link" style="color:var(--coral);">🆘 {{ t('landing.nav.emergency') }}</router-link>
      <div class="mobile-auth-user" :class="{ open: isAuthenticated }">
        <div class="mobile-auth-avatar" :class="{ 'has-image': hasAvatarImage }" :style="avatarStyle">{{ hasAvatarImage ? '' : avatarFallback }}</div>
        <div>
          <div class="mobile-auth-name">{{ userLabel }}</div>
          <div class="mobile-auth-email">{{ auth.user?.email || '' }}</div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
        <router-link
          v-if="!isAuthenticated"
          :to="{ path: '/tasks', query: { guest_emergency: '1' } }"
          style="display:block;padding:12px;border:2px solid var(--coral);border-radius:var(--radius-full);background:var(--coral-light);color:var(--coral-dark);font-weight:800;font-size:0.85rem;text-align:center;"
        >🆘 {{ t('landing.nav.emergencyTask') }}</router-link>
        <router-link
          v-if="!isAuthenticated"
          to="/signup"
          style="display:block;padding:12px;border:2px solid var(--mint-dark);border-radius:var(--radius-full);background:var(--mint);color:var(--text-primary);font-weight:700;font-size:0.85rem;text-align:center;"
        >🌿 {{ t('landing.nav.signupFree') }}</router-link>
        <router-link
          v-if="!isAuthenticated"
          to="/login"
          style="display:block;padding:11px;border:2px solid var(--kraft-light);border-radius:var(--radius-full);color:var(--text-secondary);font-weight:600;font-size:0.82rem;text-align:center;"
        >{{ t('landing.nav.login') }}</router-link>
        <router-link
          v-if="isAuthenticated"
          to="/dashboard"
          style="display:block;padding:12px;border:2px solid var(--mint-dark);border-radius:var(--radius-full);background:var(--mint);color:var(--text-primary);font-weight:700;font-size:0.85rem;text-align:center;"
        >🌿 {{ t('landing.nav.enterApp') }}</router-link>
        <button
          v-if="isAuthenticated"
          style="padding:11px;border:2px solid var(--coral);border-radius:var(--radius-full);background:var(--coral-light);color:var(--coral-dark);font-weight:700;font-size:0.82rem;text-align:center;cursor:pointer;width:100%;"
          @click="handleLogout"
        >{{ t('landing.nav.logout') }}</button>
      </div>
    </div>

    <!-- NAVBAR -->
    <nav class="navbar">
      <router-link to="/" class="nav-logo">
        <div class="logo-icon">🌿</div>
        <div class="logo-text">Peace<span>Flow</span></div>
      </router-link>
      <div class="nav-links">
        <a href="#features" class="nav-link">{{ t('landing.nav.features') }}</a>
        <a href="#how-it-works" class="nav-link">{{ t('landing.nav.howItWorks') }}</a>
        <router-link to="/mood-assessment" class="nav-link">{{ t('landing.nav.tests') }}</router-link>
        <router-link to="/experts" class="nav-link">{{ t('landing.nav.experts') }}</router-link>
        <router-link to="/community" class="nav-link">{{ t('landing.nav.community') }}</router-link>
        <router-link to="/emergency" class="nav-link" style="color:var(--coral);">🆘 {{ t('landing.nav.emergency') }}</router-link>
      </div>
      <div class="nav-cta">
        <router-link v-if="!isAuthenticated" :to="{ path: '/tasks', query: { guest_emergency: '1' } }"><button class="btn-nav-emergency">🆘 {{ t('landing.nav.emergency') }}</button></router-link>
        <router-link v-if="!isAuthenticated" to="/login"><button class="btn-nav-outline">{{ t('landing.nav.login') }}</button></router-link>
        <router-link v-if="!isAuthenticated" to="/signup"><button class="btn-nav-primary">🌿 {{ t('landing.nav.signupFree') }}</button></router-link>
        <router-link v-if="isAuthenticated" to="/dashboard"><button class="btn-nav-primary">🌿 {{ t('landing.nav.enterApp') }}</button></router-link>
        <div v-if="isAuthenticated" class="nav-auth-menu">
          <button class="nav-avatar-btn" :class="{ 'has-image': hasAvatarImage }" :style="avatarStyle" type="button" :aria-label="t('landing.nav.accountAria')" @click.stop="navDropdownOpen = !navDropdownOpen">{{ hasAvatarImage ? '' : avatarFallback }}</button>
          <div class="nav-auth-dropdown" :class="{ open: navDropdownOpen }">
            <div class="nav-auth-user">
              <div class="nav-auth-user-avatar" :class="{ 'has-image': hasAvatarImage }" :style="avatarStyle">{{ hasAvatarImage ? '' : avatarFallback }}</div>
              <div>
                <div class="nav-auth-user-name">{{ userLabel }}</div>
                <div class="nav-auth-user-email">{{ auth.user?.email || '' }}</div>
              </div>
            </div>
            <router-link to="/dashboard" class="nav-auth-action" style="text-decoration:none;">{{ t('landing.nav.enterApp') }}</router-link>
            <button class="nav-auth-action logout" type="button" @click="handleLogout">{{ t('landing.nav.logout') }}</button>
          </div>
        </div>
      </div>
      <button class="mobile-nav-btn" @click="openMobileNav">☰</button>
    </nav>

    <!-- HERO -->
    <section class="hero" id="hero">
      <div class="hero-bg-deco">
        <div class="hbd-circle hbd-1"></div>
        <div class="hbd-circle hbd-2"></div>
        <div class="hbd-circle hbd-3"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">{{ t('landing.hero.badge') }}</div>
        <h1 class="hero-title">
          {{ t('landing.hero.titleLine1') }}<br>
          <span class="ht-accent">{{ t('landing.hero.titleAccent') }}</span><br>
          {{ t('landing.hero.titleLine2') }}
        </h1>
        <p class="hero-subtitle">{{ t('landing.hero.subtitle') }}</p>
        <div class="hero-message">
          <div class="hero-message-text">"{{ heroQuote }}"</div>
        </div>
        <div class="hero-actions">
          <router-link :to="isAuthenticated ? '/dashboard' : '/signup'" class="btn-hero-primary">{{ isAuthenticated ? t('landing.hero.ctaEnterApp') : t('landing.hero.ctaSignup') }}</router-link>
          <a href="#how-it-works" class="btn-hero-outline">{{ t('landing.hero.ctaLearnMore') }}</a>
        </div>
        <div class="hero-stats">
          <div class="hs-item">
            <div class="hs-num">10K+</div>
            <div class="hs-label">{{ t('landing.hero.statUsers') }}</div>
          </div>
          <div class="hs-item">
            <div class="hs-num">30+</div>
            <div class="hs-label">{{ t('landing.hero.statExperts') }}</div>
          </div>
          <div class="hs-item">
            <div class="hs-num">95%</div>
            <div class="hs-label">{{ t('landing.hero.statSatisfaction') }}</div>
          </div>
          <div class="hs-item">
            <div class="hs-num">4.9⭐</div>
            <div class="hs-label">{{ t('landing.hero.statRating') }}</div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="float-badge fb-1">{{ t('landing.hero.floatStreak') }}</div>
        <div class="float-badge fb-2">{{ t('landing.hero.floatBadge') }}</div>
        <div class="float-badge fb-3">{{ t('landing.hero.floatXp') }}</div>
        <div class="hero-phone-mockup">
          <div class="hpm-bar"></div>
          <div class="hpm-mood">
            <div class="hpm-mood-emoji">😊</div>
            <div class="hpm-mood-text">{{ t('landing.hero.phoneMoodLabel') }}</div>
          </div>
          <div class="hpm-task">
            <div class="hpm-task-icon">🧘</div>
            <div class="hpm-task-text">{{ t('landing.hero.phoneTask1') }}</div>
            <div class="hpm-task-xp">+25 XP</div>
          </div>
          <div class="hpm-task">
            <div class="hpm-task-icon">💨</div>
            <div class="hpm-task-text">{{ t('landing.hero.phoneTask2') }}</div>
            <div class="hpm-task-xp">+20 XP</div>
          </div>
          <div class="hpm-xp">
            <div class="hpm-xp-text">{{ t('landing.hero.phoneLevel') }}</div>
            <div class="hpm-xp-bar">
              <div class="hpm-xp-fill"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="how-section" id="how-it-works">
      <div style="text-align:center;">
        <div class="section-badge">{{ t('landing.howItWorks.badge') }}</div>
        <h2 class="section-title">{{ t('landing.howItWorks.titleLine1') }}<br>{{ t('landing.howItWorks.titleLine2') }}</h2>
        <p class="section-subtitle" style="margin:0 auto;">{{ t('landing.howItWorks.subtitle') }}</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">1</div>
          <span class="step-icon">📝</span>
          <div class="step-title">{{ t('landing.howItWorks.step1Title') }}</div>
          <div class="step-desc">{{ t('landing.howItWorks.step1Desc') }}</div>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <span class="step-icon">💭</span>
          <div class="step-title">{{ t('landing.howItWorks.step2Title') }}</div>
          <div class="step-desc">{{ t('landing.howItWorks.step2Desc') }}</div>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <span class="step-icon">🎮</span>
          <div class="step-title">{{ t('landing.howItWorks.step3Title') }}</div>
          <div class="step-desc">{{ t('landing.howItWorks.step3Desc') }}</div>
        </div>
        <div class="step-card">
          <div class="step-num">4</div>
          <span class="step-icon">🌱</span>
          <div class="step-title">{{ t('landing.howItWorks.step4Title') }}</div>
          <div class="step-desc">{{ t('landing.howItWorks.step4Desc') }}</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" style="background:var(--cream);padding:80px 5%;">
      <div style="text-align:center;margin-bottom:48px;">
        <div class="section-badge">{{ t('landing.features.badge') }}</div>
        <h2 class="section-title">{{ t('landing.features.titleLine1') }}<br>{{ t('landing.features.titleLine2') }}</h2>
      </div>
      <div class="features-grid">
        <router-link to="/mood-checkin" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--mint-light);border-color:var(--mint);">💭</div>
          <div class="fc-title">{{ t('landing.features.moodTitle') }}</div>
          <div class="fc-desc">{{ t('landing.features.moodDesc') }}</div>
          <span class="fc-link">{{ t('landing.features.moodLink') }}</span>
        </router-link>
        <router-link to="/tasks" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--peach-light);border-color:var(--peach);">🎮</div>
          <div class="fc-title">{{ t('landing.features.tasksTitle') }}</div>
          <div class="fc-desc">{{ t('landing.features.tasksDesc') }}</div>
          <span class="fc-link">{{ t('landing.features.tasksLink') }}</span>
        </router-link>
        <router-link to="/experts" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--lavender-light);border-color:var(--lavender);">🩺</div>
          <div class="fc-title">{{ t('landing.features.expertsTitle') }}</div>
          <div class="fc-desc">{{ t('landing.features.expertsDesc') }}</div>
          <span class="fc-link">{{ t('landing.features.expertsLink') }}</span>
        </router-link>
        <router-link to="/mood-assessment" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--sky-light);border-color:var(--sky);">📊</div>
          <div class="fc-title">{{ t('landing.features.testsTitle') }}</div>
          <div class="fc-desc">{{ t('landing.features.testsDesc') }}</div>
          <span class="fc-link">{{ t('landing.features.testsLink') }}</span>
        </router-link>
        <router-link to="/journal" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--gold-light);border-color:var(--gold);">📝</div>
          <div class="fc-title">{{ t('landing.features.journalTitle') }}</div>
          <div class="fc-desc">{{ t('landing.features.journalDesc') }}</div>
          <span class="fc-link">{{ t('landing.features.journalLink') }}</span>
        </router-link>
        <router-link to="/emergency" class="feature-card">
          <div class="fc-icon-wrap" style="background:var(--coral-light);border-color:var(--coral);">🆘</div>
          <div class="fc-title">{{ t('landing.features.emergencyTitle') }}</div>
          <div class="fc-desc">{{ t('landing.features.emergencyDesc') }}</div>
          <span class="fc-link" style="color:var(--coral);">{{ t('landing.features.emergencyLink') }}</span>
        </router-link>
      </div>
    </section>

    <!-- MOOD DEMO -->
    <section class="mood-demo-section" id="mood-demo">
      <div style="text-align:center;margin-bottom:0;">
        <div class="section-badge">{{ t('landing.moodDemo.badge') }}</div>
        <h2 class="section-title">{{ t('landing.moodDemo.titleLine1') }}<br>{{ t('landing.moodDemo.titleLine2') }}</h2>
      </div>
      <div class="mood-demo-layout">
        <div class="mood-demo-card">
          <div class="mdc-title">{{ t('landing.moodDemo.cardTitle') }}</div>
          <div class="mood-emoji-row">
            <button
              v-for="emoji in ['😊', '😌', '😐', '😟', '😰', '😢']"
              :key="emoji"
              class="demo-mood-btn"
              :class="{ selected: selectedMood === emoji }"
              :style="demoMoodBtnStyle(emoji)"
              @click="selectDemoMood(emoji)"
            >{{ emoji }}</button>
          </div>
          <div class="demo-slider-wrap">
            <div class="demo-slider-label"><span>{{ t('landing.moodDemo.sliderLow') }}</span><span>{{ t('landing.moodDemo.sliderHigh') }}</span></div>
            <input type="range" class="demo-slider" min="1" max="10" v-model.number="selectedScore">
            <div style="text-align:center;font-size:0.78rem;font-weight:700;color:var(--mint-dark);margin-top:4px;">{{ t('landing.moodDemo.levelLabel', { score: selectedScore }) }}</div>
          </div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">{{ t('landing.moodDemo.tagsLabel') }}</div>
          <div class="demo-tags">
            <span
              v-for="tag in DEMO_TAGS"
              :key="tag.id"
              class="demo-tag"
              :class="{ active: selectedTags.has(tag.id) }"
              :style="selectedTags.has(tag.id) ? { background: 'var(--mint-dark)', color: 'white' } : null"
              @click="toggleDemoTag(tag.id)"
            >{{ t(tag.labelKey) }}</span>
          </div>
          <button class="demo-save-btn" @click="saveDemoMood">{{ demoSaveLabel }}</button>
        </div>
        <div class="mood-demo-info">
          <div class="mdi-item">
            <div class="mdi-icon">🤖</div>
            <div>
              <div class="mdi-title">{{ t('landing.moodDemo.aiTitle') }}</div>
              <div class="mdi-desc">{{ t('landing.moodDemo.aiDesc') }}</div>
            </div>
          </div>
          <div class="mdi-item">
            <div class="mdi-icon">📈</div>
            <div>
              <div class="mdi-title">{{ t('landing.moodDemo.trackTitle') }}</div>
              <div class="mdi-desc">{{ t('landing.moodDemo.trackDesc') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer>
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="fb-logo">
            <div class="fb-logo-icon">🌿</div>
            <div class="fb-logo-text">Peace<span>Flow</span></div>
          </div>
          <p>{{ t('landing.footer.brandDesc') }}</p>
          <div class="footer-hotline">
            <div class="fh-num">📞 0931773637</div>
            <div class="fh-label">{{ t('landing.footer.hotlineLabel') }}</div>
          </div>
        </div>
        <div>
          <div class="footer-col-title">{{ t('landing.footer.aboutTitle') }}</div>
          <a href="#" class="footer-link">{{ t('landing.footer.aboutStory') }}</a>
          <a href="#" class="footer-link">{{ t('landing.footer.aboutTeam') }}</a>
          <a href="#" class="footer-link">{{ t('landing.footer.aboutResearch') }}</a>
          <a href="#" class="footer-link">{{ t('landing.footer.aboutPress') }}</a>
        </div>
        <div>
          <div class="footer-col-title">{{ t('landing.footer.featuresTitle') }}</div>
          <router-link to="/tasks" class="footer-link">{{ t('landing.footer.featureTasks') }}</router-link>
          <router-link to="/mood-checkin" class="footer-link">{{ t('landing.footer.featureMood') }}</router-link>
          <router-link to="/community" class="footer-link">{{ t('landing.footer.featureCommunity') }}</router-link>
          <router-link to="/experts" class="footer-link">{{ t('landing.footer.featureExperts') }}</router-link>
        </div>
        <div>
          <div class="footer-col-title">{{ t('landing.footer.supportTitle') }}</div>
          <router-link to="/emergency" class="footer-link">{{ t('landing.footer.supportEmergency') }}</router-link>
          <a href="#" class="footer-link">{{ t('landing.footer.supportFaq') }}</a>
          <a href="#" class="footer-link">{{ t('landing.footer.supportPrivacy') }}</a>
          <a href="#" class="footer-link">{{ t('landing.footer.supportTerms') }}</a>
          <a href="/docs/tong-hop-chinh-sach-hoat-dong.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportOperatingPolicy') }}</a>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);">{{ t('landing.footer.copyright') }}</div>
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <LanguageSwitcher />
          <div style="font-size:0.85rem;color:rgba(255,255,255,0.5);display:flex;gap:16px;">
            <span style="cursor:pointer;" title="Facebook">FB</span>
            <span style="cursor:pointer;" title="Instagram">IG</span>
            <span style="cursor:pointer;" title="TikTok">TT</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';

const { t, tm } = useI18n();
const auth = useAuthStore();

// Danh sách slogan lấy từ chính file dịch (landing.slogans, mảng 27 câu) — không giữ bản
// cứng ở đây nữa, để đổi ngôn ngữ thì slogan cũng đổi theo mà không cần đụng code.
const SLOGAN_INDEX = Math.floor(Math.random() * 27);
const heroQuote = computed(() => tm('landing.slogans')[SLOGAN_INDEX]);

// id ỔN ĐỊNH (không đổi theo ngôn ngữ) để so khớp lựa chọn; labelKey để hiển thị đúng
// ngôn ngữ hiện tại. Trước đây dùng thẳng chuỗi tiếng Việt vừa làm khoá vừa làm hiển thị —
// đổi ngôn ngữ là toggle/so khớp vỡ ngay vì chuỗi hiển thị đã đổi nhưng Set lưu id cũ.
const DEMO_TAGS = [
  { id: 'work', labelKey: 'landing.moodDemo.tagWork' },
  { id: 'family', labelKey: 'landing.moodDemo.tagFamily' },
  { id: 'finance', labelKey: 'landing.moodDemo.tagFinance' },
  { id: 'sleep', labelKey: 'landing.moodDemo.tagSleep' },
  { id: 'relationship', labelKey: 'landing.moodDemo.tagRelationship' },
  { id: 'unknown', labelKey: 'landing.moodDemo.tagUnknown' }
];

const mobileNavOpen = ref(false);
function openMobileNav() { mobileNavOpen.value = true; document.body.style.overflow = 'hidden'; }
function closeMobileNav() { mobileNavOpen.value = false; document.body.style.overflow = ''; }

const navDropdownOpen = ref(false);
const isAuthenticated = computed(() => auth.isAuthenticated);
const userLabel = computed(() => auth.user?.display_name || auth.user?.full_name || auth.user?.email || t('landing.nav.defaultUserLabel'));
const avatarFallback = computed(() => {
  const label = userLabel.value.trim();
  return label ? label.charAt(0).toUpperCase() : 'PF';
});
const hasAvatarImage = computed(() => Boolean(auth.user?.avatar_url));
const avatarStyle = computed(() => (hasAvatarImage.value ? { backgroundImage: `url('${auth.user.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}));

async function handleLogout() {
  navDropdownOpen.value = false;
  await auth.logout();
}

// Mood demo
const selectedMood = ref(null);
const selectedScore = ref(6);
const selectedTags = ref(new Set());
// Trạng thái thay vì chuỗi tĩnh: nếu chỉ gán ref = t('...') một lần lúc setup, đổi ngôn
// ngữ sau đó (mà chưa bấm nút) sẽ không tự cập nhật vì không phải computed theo locale.
const demoSaved = ref(false);
const demoSaveLabel = computed(() => t(demoSaved.value ? 'landing.moodDemo.saveDone' : 'landing.moodDemo.saveDefault'));

const glowingMood = ref(null);
function demoMoodBtnStyle(emoji) {
  const style = {};
  if (selectedMood.value === emoji) {
    style.transform = `scale(${1 + selectedScore.value / 20})`;
  }
  if (glowingMood.value === emoji) {
    style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  }
  return style;
}

function selectDemoMood(emoji) {
  selectedMood.value = emoji;
  glowingMood.value = emoji;
  setTimeout(() => {
    if (glowingMood.value === emoji) glowingMood.value = null;
  }, 500);
}

function toggleDemoTag(tagId) {
  const next = new Set(selectedTags.value);
  if (next.has(tagId)) next.delete(tagId);
  else next.add(tagId);
  selectedTags.value = next;
}

function saveDemoMood() {
  if (!selectedMood.value) {
    alert(t('landing.moodDemo.pickMoodAlert'));
    return;
  }

  const entry = {
    date: new Date().toISOString(),
    mood: selectedMood.value,
    score: selectedScore.value,
    // Giờ đã là id ổn định ('work', 'unknown'...) thay vì phải tách chữ từ nhãn hiển thị
    // tiếng Việt như trước — không còn phụ thuộc ngôn ngữ hiện tại.
    tags: Array.from(selectedTags.value),
    createdAt: Date.now()
  };

  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('PeaceFlow_logs') || '[]');
  } catch (_) {}

  logs.push(entry);
  localStorage.setItem('PeaceFlow_logs', JSON.stringify(logs));

  demoSaved.value = true;

  setTimeout(() => {
    window.location.href = isAuthenticated.value ? '/mood-checkin' : '/signup';
  }, 1000);
}

function closeAuthDropdownOnOutsideClick(event) {
  const menu = document.querySelector('.nav-auth-menu');
  if (menu && !menu.contains(event.target)) navDropdownOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', closeAuthDropdownOnOutsideClick);
  auth.waitForAuth();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeAuthDropdownOnOutsideClick);
  // Lưới an toàn: router-link trong mobile-nav-panel điều hướng đi luôn mà không
  // gọi closeMobileNav() trước, nếu không reset ở đây body sẽ bị kẹt overflow:hidden.
  document.body.style.overflow = '';
});
</script>

<style scoped src="../assets/index-landing.css"></style>
