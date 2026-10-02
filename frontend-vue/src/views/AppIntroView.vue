<template>
  <main class="intro-page">
    <button class="intro-skip" @click="finish()">{{ t('appIntro.skip') }}</button>

    <div class="intro-dots">
      <button
        v-for="(slide, idx) in slides"
        :key="slide.key"
        class="intro-dot"
        :class="{ active: idx === current }"
        :aria-label="slide.key"
        @click="current = idx"
      />
    </div>

    <div class="intro-slide-wrap">
      <!-- Slide 1: bê nguyên y hệt section .hero của landing page, chỉ bỏ hàng nút CTA -->
      <section v-show="current === 0" class="intro-slide intro-slide-hero">
        <section class="hero" id="intro-hero">
          <div class="hero-bg-deco">
            <div class="hbd-circle hbd-1"></div>
            <div class="hbd-circle hbd-2"></div>
            <div class="hbd-circle hbd-3"></div>
          </div>
          <div class="hero-content">
            <div class="hero-badge">{{ t('landing.hero.badge') }}</div>
            <h1 class="hero-title">
              {{ t('appIntro.welcomeTitleLine1') }}
              <span class="ht-accent">{{ t('appIntro.welcomeAccent') }}</span>,<br>
              {{ t('appIntro.welcomeTitleLine2') }}
            </h1>
            <p class="hero-subtitle">{{ t('landing.hero.subtitle') }}</p>
            <div class="hero-message">
              <div class="hero-message-text">"{{ heroQuote }}"</div>
            </div>
          </div>
        </section>
      </section>

      <!-- Slide 2: bê nguyên section .how-section (Cách hoạt động) của landing page -->
      <section v-show="current === 1" class="intro-slide intro-slide-how">
        <section class="how-section" id="intro-how">
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
      </section>

      <!-- Slide 3: bê nguyên section #features của landing page, bỏ link điều hướng (không cho bấm) -->
      <section v-show="current === 2" class="intro-slide intro-slide-features">
        <section id="intro-features">
          <div style="text-align:center;margin-bottom:48px;">
            <div class="section-badge">{{ t('landing.features.badge') }}</div>
            <h2 class="section-title">{{ t('landing.features.titleLine1') }}<br>{{ t('landing.features.titleLine2') }}</h2>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="fc-icon-wrap" style="background:var(--mint-light);border-color:var(--mint);">💭</div>
              <div class="fc-title">{{ t('landing.features.moodTitle') }}</div>
              <div class="fc-desc">{{ t('landing.features.moodDesc') }}</div>
              <span class="fc-link">{{ t('landing.features.moodLink') }}</span>
            </div>
            <div class="feature-card">
              <div class="fc-icon-wrap" style="background:var(--peach-light);border-color:var(--peach);">🎮</div>
              <div class="fc-title">{{ t('landing.features.tasksTitle') }}</div>
              <div class="fc-desc">{{ t('landing.features.tasksDesc') }}</div>
              <span class="fc-link">{{ t('landing.features.tasksLink') }}</span>
            </div>
            <div class="feature-card">
              <div class="fc-icon-wrap" style="background:var(--lavender-light);border-color:var(--lavender);">🩺</div>
              <div class="fc-title">{{ t('landing.features.expertsTitle') }}</div>
              <div class="fc-desc">{{ t('landing.features.expertsDesc') }}</div>
              <span class="fc-link">{{ t('landing.features.expertsLink') }}</span>
            </div>
            <div class="feature-card">
              <div class="fc-icon-wrap" style="background:var(--sky-light);border-color:var(--sky);">📊</div>
              <div class="fc-title">{{ t('landing.features.testsTitle') }}</div>
              <div class="fc-desc">{{ t('landing.features.testsDesc') }}</div>
              <span class="fc-link">{{ t('landing.features.testsLink') }}</span>
            </div>
            <div class="feature-card">
              <div class="fc-icon-wrap" style="background:var(--gold-light);border-color:var(--gold);">📝</div>
              <div class="fc-title">{{ t('landing.features.journalTitle') }}</div>
              <div class="fc-desc">{{ t('landing.features.journalDesc') }}</div>
              <span class="fc-link">{{ t('landing.features.journalLink') }}</span>
            </div>
            <div class="feature-card">
              <div class="fc-icon-wrap" style="background:var(--coral-light);border-color:var(--coral);">🆘</div>
              <div class="fc-title">{{ t('landing.features.emergencyTitle') }}</div>
              <div class="fc-desc">{{ t('landing.features.emergencyDesc') }}</div>
              <span class="fc-link" style="color:var(--coral);">{{ t('landing.features.emergencyLink') }}</span>
            </div>
          </div>
        </section>
      </section>

      <!-- Slide 4: CTA, đóng khung thành 1 card cho đỡ trống thay vì icon/chữ trôi nổi giữa nền -->
      <section v-show="current === 3" class="intro-slide">
        <div class="cta-card">
          <div class="cta-icon">🚀</div>
          <h1 class="intro-title"><span class="ht-accent">{{ t('appIntro.ctaTitleAccent') }}</span> {{ t('appIntro.ctaTitleRest') }}</h1>
          <p class="intro-desc">{{ t('appIntro.ctaDesc') }}</p>
          <div class="cta-stats">
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
          <div class="cta-chips">
            <span class="cta-chip">{{ t('appIntro.chipFree') }}</span>
            <span class="cta-chip">{{ t('appIntro.chipSecure') }}</span>
            <span class="cta-chip">{{ t('appIntro.chipFast') }}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="intro-nav">
      <button v-if="current > 0" class="btn-outline" @click="current--">{{ t('appIntro.back') }}</button>
      <div v-else style="width:1px;"></div>
      <button v-if="current < slides.length - 1" class="btn-primary" @click="current++">{{ t('appIntro.next') }}</button>
      <button v-else class="btn-primary" @click="finish(true)">{{ t('appIntro.start') }}</button>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import '../assets/index-landing.css';

const { t, tm } = useI18n();
const router = useRouter();
const current = ref(0);

// Slide 1 dùng nguyên section .hero của landing page (xem template) nên không cần dữ liệu riêng.
const SLOGAN_INDEX = Math.floor(Math.random() * 27);
const heroQuote = computed(() => tm('landing.slogans')[SLOGAN_INDEX]);

// Mỗi slide = 1 MỤC LỚN của landing page, bê nguyên markup/class thật từ IndexView.vue (xem
// template) để đồng bộ 100% với landing page — không có dữ liệu riêng, slides chỉ dùng để
// render chấm (dots) và điều hướng back/next.
const slides = [{ key: 'hero' }, { key: 'howItWorks' }, { key: 'features' }, { key: 'cta' }];

// Bỏ qua: quay về trang chủ. Bấm "Bắt đầu ngay" ở slide cuối: vào thẳng trang đăng ký, giống
// nút CTA chính của landing page (hero-actions -> /signup).
function finish(goToSignup) {
  localStorage.setItem('pf_intro_seen', '1');
  router.replace({ name: goToSignup ? 'signup' : 'index' });
}
</script>

<style scoped>
.intro-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 24px 24px calc(20px + env(safe-area-inset-bottom, 0px));
  padding-top: calc(24px + env(safe-area-inset-top, 0px));
  background: linear-gradient(160deg, var(--cream) 0%, var(--mint-light) 50%, var(--peach-light) 100%);
}
.intro-skip {
  align-self: flex-end;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 10px;
}
.intro-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 8px 0 20px;
}
.intro-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: none;
  background: var(--kraft-light);
  cursor: pointer;
  transition: var(--transition);
}
.intro-dot.active {
  width: 22px;
  border-radius: 5px;
  background: var(--mint-dark);
}
.intro-slide-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}
.intro-slide {
  width: 100%;
  text-align: center;
  animation: fade-up 0.4s ease;
}
/* Slide hero = y hệt section .hero của landing page, chỉ chỉnh lại phần khung bao quanh
   (nó vốn được thiết kế để chiếm trọn màn hình dưới navbar, ở đây cần gọn trong 1 slide). */
.intro-slide-hero :deep(.hero) {
  min-height: auto;
  padding: 0;
  background: none;
  justify-content: center;
}
/* Bỏ cột .hero-visual (phone mockup) ở intro -> .hero-content hết còn 2 cột, cho nó full chiều rộng */
.intro-slide-hero :deep(.hero-content) {
  max-width: none;
  flex: initial;
  width: 100%;
}
/* Slide how-it-works = y hệt section .how-section của landing page, chỉ bỏ padding/background
   riêng của nó (vốn là 1 section full-width có padding/bg của trang chủ). */
.intro-slide-how :deep(.how-section) {
  background: none;
  padding: 0;
}
/* Badge "Cách hoạt động" / "Tính năng" (.section-badge, dùng chung cho slide 2 & 3): nền mint
   đậm đặc + bỏ viền, cho nổi bật hơn kiểu nhạt + viền mảnh mặc định của landing page. */
.intro-page :deep(.section-badge) {
  background: var(--mint-dark);
  border: none;
  color: white;
}
/* Icon feature-card: bỏ khung nền màu (inline style trong template) + canh giữa + phóng to.
   Dùng !important vì nền/màu viền được set qua inline style (giữ nguyên markup gốc landing),
   external CSS thường không thắng được inline style. */
.intro-slide-features :deep(.feature-card) {
  text-align: center;
}
.intro-slide-features :deep(.fc-icon-wrap) {
  background: none !important;
  border: none !important;
  display: inline-flex;
  width: auto;
  height: auto;
  font-size: 2.6rem;
  margin: 0 0 14px;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.intro-title {
  font-size: 1.7rem;
  font-weight: 900;
  margin-bottom: 14px;
  line-height: 1.3;
}
/* Y hệt kiểu ".hero-title .ht-accent" của landing (chữ xanh mint + gạch chân mảnh bên dưới),
   viết lại riêng vì rule gốc chỉ áp dụng khi tổ tiên là .hero-title. */
.intro-title .ht-accent {
  color: var(--mint-dark);
  position: relative;
}
.intro-title .ht-accent::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--mint-dark);
  border-radius: 2px;
  opacity: 0.5;
}
.intro-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 420px;
  margin: 0 auto;
}
/* Slide CTA: dải nền gradient sáng, không border, kéo tràn ra sát 2 mép màn hình (bù trừ
   padding 2 bên 24px của .intro-page) thay vì 1 card viền thu nhỏ giữa màn hình. */
.cta-card {
  padding: 36px 24px;
  margin: 0 -24px;
  background: linear-gradient(160deg, var(--mint-light) 0%, var(--cream) 100%);
}
.cta-icon {
  font-size: 3.4rem;
  margin-bottom: 14px;
  animation: cta-float 2.4s ease-in-out infinite;
}
@keyframes cta-float {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-8px) rotate(4deg); }
}
.cta-stats {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px 18px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1.5px dashed var(--kraft-light);
}
.cta-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}
.cta-chip {
  background: var(--mint-dark);
  border: none;
  color: white;
  border-radius: var(--radius-full);
  padding: 5px 14px;
  font-size: 0.75rem;
  font-weight: 700;
}
.intro-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}
.intro-nav .btn-primary,
.intro-nav .btn-outline {
  flex-shrink: 0;
}
</style>
