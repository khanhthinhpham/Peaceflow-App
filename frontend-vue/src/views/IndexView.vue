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
      <div class="hero-content" ref="heroContentRef">
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
          <div class="step-indicator" style="margin-bottom:16px;" v-if="!demoSaved">
            <div class="si-dot" :class="demoDotClass(1)">1</div>
            <div class="si-line" :class="{ done: demoStep >= 2 }"></div>
            <div class="si-dot" :class="demoDotClass(2)">2</div>
            <div class="si-line" :class="{ done: demoStep >= 3 }"></div>
            <div class="si-dot" :class="demoDotClass(3)">3</div>
            <div class="si-line" :class="{ done: demoStep >= 4 }"></div>
            <div class="si-dot" :class="demoDotClass(4)">4</div>
          </div>

          <template v-if="!demoSaved">
            <!-- Step 1: Mood -->
            <div class="checkin-step" :class="{ active: demoStep === 1 }">
              <div class="mascot-speech-box">
                <span class="msb-avatar">🐱</span>
                <div class="msb-text">{{ t('moodCheckin.step1.mascotGreeting', { name: demoDisplayName }) }}</div>
              </div>
              <div class="checkin-title">{{ t('moodCheckin.step1.title') }}</div>
              <div class="checkin-sub">{{ t('moodCheckin.step1.sub') }}</div>
              <div class="mood-grid">
                <div
                  v-for="option in MOOD_OPTIONS"
                  :key="option.id"
                  class="mood-btn"
                  :class="{ selected: demoCheckin.moodId === option.id }"
                  @click="selectDemoMood(option)"
                >
                  <span class="mood-emoji">{{ option.emoji }}</span>
                  <span class="mood-label">{{ t(option.labelKey) }}</span>
                </div>
              </div>
            </div>

            <!-- Step 2: Intensity -->
            <div class="checkin-step" :class="{ active: demoStep === 2 }">
              <div class="mascot-speech-box">
                <span class="msb-avatar">{{ demoCheckin.mood || '🐱' }}</span>
                <div class="msb-text">{{ demoMascotMoodText }}</div>
              </div>
              <div class="checkin-title">{{ t('moodCheckin.step2.title') }}</div>
              <div class="checkin-sub">{{ t('moodCheckin.step2.sub') }}</div>
              <div class="slider-wrap">
                <div class="slider-labels"><span>{{ t('moodCheckin.step2.sliderLow') }}</span><span>{{ t('moodCheckin.step2.sliderHigh') }}</span></div>
                <input type="range" class="mood-slider" min="1" max="10" v-model.number="demoCheckin.score">
                <div class="slider-value-display">
                  <div class="slider-tree">{{ demoSliderTreeEmoji }}</div>
                  <div class="slider-val">{{ demoCheckin.score }}</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <button class="btn-outline" @click="demoGoStep(1)">{{ t('moodCheckin.step2.backBtn') }}</button>
                <button class="btn-primary" @click="demoGoStep(3)">{{ t('moodCheckin.step2.continueBtn') }}</button>
              </div>
            </div>

            <!-- Step 3: Tags -->
            <div class="checkin-step" :class="{ active: demoStep === 3 }">
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
                  :class="{ selected: demoCheckin.tags.includes(tag) }"
                  @click="toggleDemoTag(tag)"
                >{{ t(tag.labelKey) }}</div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <button class="btn-outline" @click="demoGoStep(2)">{{ t('moodCheckin.step3.backBtn') }}</button>
                <button class="btn-primary" @click="demoGoStep(4)">{{ t('moodCheckin.step3.continueBtn') }}</button>
              </div>
            </div>

            <!-- Step 4: Body symptoms -->
            <div class="checkin-step" :class="{ active: demoStep === 4 }">
              <div class="mascot-speech-box">
                <span class="msb-avatar">🐱</span>
                <div class="msb-text">{{ t('moodCheckin.stepBody.mascotText') }}</div>
              </div>
              <div class="checkin-title">{{ t('moodCheckin.stepBody.title') }}</div>
              <div class="checkin-sub">{{ t('moodCheckin.stepBody.sub') }}</div>
              <div class="tag-grid">
                <div
                  v-for="group in BODY_SYMPTOM_GROUPS"
                  :key="group.id"
                  class="tag-btn"
                  :class="{ selected: isDemoBodyGroupHighlighted(group) }"
                  @click="toggleDemoBodyGroup(group)"
                >{{ t(group.labelKey) }}<template v-if="group.children.length">{{ demoExpandedBodyGroups.has(group.id) ? ' ▲' : ' ▼' }}</template></div>
              </div>
              <template v-for="group in BODY_SYMPTOM_GROUPS" :key="`sub-${group.id}`">
                <div v-if="group.children.length && demoExpandedBodyGroups.has(group.id)" class="tag-grid" style="margin-top:-6px;margin-bottom:16px;padding:12px;background:var(--cream,#fff8f0);border-radius:var(--radius-sm,10px);">
                  <div
                    v-for="child in group.children"
                    :key="child.id"
                    class="tag-btn"
                    :class="{ selected: demoCheckin.bodySymptoms.includes(child) }"
                    @click="toggleDemoBodySymptom(child)"
                  >{{ t(child.labelKey) }}</div>
                </div>
              </template>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <button class="btn-outline" @click="demoGoStep(3)">{{ t('moodCheckin.stepBody.backBtn') }}</button>
                <button class="btn-primary" :disabled="demoSubmitting" @click="saveDemoMood">{{ demoSubmitting ? t('moodCheckin.stepBody.saving') : t('moodCheckin.stepBody.saveBtn') }}</button>
              </div>
            </div>
          </template>

          <!-- Result -->
          <div v-else style="text-align:center;padding:20px 0 4px;">
            <div style="font-size:2.6rem;margin-bottom:10px;">{{ demoCheckin.mood || '🌿' }}</div>
            <div style="font-size:1rem;font-weight:800;margin-bottom:16px;color:var(--mint-dark);">{{ demoResultLabel }}</div>
            <button class="btn-outline" @click="resetDemoCheckin">{{ t('moodCheckin.step4.checkinAgainBtn') }}</button>
          </div>
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
          <a href="https://online.gov.vn/nen-tang/dbceffea-6475-46c3-80b7-21e803d8b6ec" target="_blank" rel="noopener" title="Đã xác nhận với Bộ Công Thương" style="display:inline-block;margin-top:16px;">
            <img src="https://fileserver.online.gov.vn/uploads/Resources/iconxacnhan/DaThongBao.png" alt="Đã xác nhận" style="height:72px;">
          </a>
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
          <a href="/docs/dieu-kien-han-che-dich-vu.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyConditions') }}</a>
          <a href="/docs/chinh-sach-gia.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyPricing') }}</a>
          <a href="/docs/chinh-sach-thanh-toan.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyPayment') }}</a>
          <a href="/privacy-policy.html" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyPrivacyDoc') }}</a>
          <a href="/docs/phuong-thuc-xu-ly-khieu-nai.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyComplaints') }}</a>
          <a href="/docs/thong-tin-ho-tro-truc-tuyen.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyOnlineSupport') }}</a>
          <a href="/docs/phuong-thuc-cung-cap-cham-dut-hoan-tien.pdf" target="_blank" rel="noopener" class="footer-link">{{ t('landing.footer.supportPolicyServiceTerms') }}</a>
        </div>
        <div>
          <div class="footer-col-title">{{ t('landing.footer.legalTitle') }}</div>
          <div class="footer-legal">
            <div>{{ t('landing.footer.legalCompany') }}: Công ty TNHH Minh Vision</div>
            <div>{{ t('landing.footer.legalTaxId') }}: 2902268055</div>
            <div>{{ t('landing.footer.legalLicenseDate') }}: 16/03/2026</div>
            <div>{{ t('landing.footer.legalRepresentative') }}: Phạm Khánh Thịnh</div>
            <div>{{ t('landing.footer.legalField') }}: Tư vấn chiến lược kinh doanh, chuyển đổi số và Digital Marketing</div>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);">{{ t('landing.footer.copyright') }}</div>
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <LanguageSwitcher />
          <div style="font-size:0.85rem;color:rgba(255,255,255,0.5);display:flex;gap:16px;">
            <a href="https://www.facebook.com/profile.php?id=61594063631691" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;cursor:pointer;" title="Facebook">FB</a>
            <a href="https://www.instagram.com/peaceflow.vn/" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;cursor:pointer;" title="Instagram">IG</a>
            <a href="https://www.threads.com/@peaceflow.vn" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;cursor:pointer;" title="Threads">TH</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/apiClient';
import { MOOD_OPTIONS, TAGS, BODY_SYMPTOM_GROUPS, deriveMoodPayload } from '../lib/moodCheckinOptions';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';

const { t, tm } = useI18n();
const auth = useAuthStore();

// Danh sách slogan lấy từ chính file dịch (landing.slogans, mảng 27 câu) — không giữ bản
// cứng ở đây nữa, để đổi ngôn ngữ thì slogan cũng đổi theo mà không cần đụng code.
const SLOGAN_INDEX = Math.floor(Math.random() * 27);
const heroQuote = computed(() => tm('landing.slogans')[SLOGAN_INDEX]);

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

// Mood demo — dùng chung MOOD_OPTIONS/TAGS/BODY_SYMPTOM_GROUPS với trang /mood-checkin
// thật (xem lib/moodCheckinOptions.js), để widget này luôn là đúng 4 bước như app thật
// thay vì một bản rút gọn dễ lệch dữ liệu theo thời gian.
const demoStep = ref(1);
const demoCheckin = reactive({ score: 5, mood: null, moodId: null, tags: [], bodySymptoms: [] });
const demoExpandedBodyGroups = reactive(new Set());
const demoSubmitting = ref(false);
// Trạng thái thay vì chuỗi tĩnh: nếu chỉ gán ref = t('...') một lần lúc setup, đổi ngôn
// ngữ sau đó (mà chưa bấm nút) sẽ không tự cập nhật vì không phải computed theo locale.
const demoSaved = ref(false);

const demoDisplayName = computed(() => (isAuthenticated.value ? (auth.user?.display_name || auth.user?.full_name || t('dashboard.defaultUserLabel')) : t('dashboard.defaultUserLabel')));
const demoSelectedMoodOption = computed(() => MOOD_OPTIONS.find((o) => o.id === demoCheckin.moodId) || null);
const demoSelectedMoodLabel = computed(() => (demoSelectedMoodOption.value ? t(demoSelectedMoodOption.value.labelKey) : ''));
const demoMascotMoodText = computed(() => (
  demoSelectedMoodLabel.value
    ? t('moodCheckin.step2.mascotWithMood', { mood: demoSelectedMoodLabel.value })
    : t('moodCheckin.step2.mascotDefault')
));
const demoSliderTreeEmoji = computed(() => {
  const val = demoCheckin.score;
  if (val >= 7) return '🌸';
  if (val >= 4) return '🌿';
  return '🍂';
});
const demoResultLabel = computed(() => t(isAuthenticated.value ? 'landing.moodDemo.saveDoneAuth' : 'landing.moodDemo.saveDoneGuest'));

function demoDotClass(dot) {
  if (dot < demoStep.value) return 'done';
  if (dot === demoStep.value) return 'active';
  return '';
}

function demoGoStep(target) {
  demoStep.value = target;
}

function selectDemoMood(option) {
  demoCheckin.score = option.score;
  demoCheckin.moodId = option.id;
  demoCheckin.mood = option.emoji;
  setTimeout(() => demoGoStep(2), 400);
}

function toggleDemoTag(tag) {
  const idx = demoCheckin.tags.indexOf(tag);
  if (idx === -1) demoCheckin.tags.push(tag);
  else demoCheckin.tags.splice(idx, 1);
}

function toggleDemoBodySymptom(tag) {
  const idx = demoCheckin.bodySymptoms.indexOf(tag);
  if (idx === -1) demoCheckin.bodySymptoms.push(tag);
  else demoCheckin.bodySymptoms.splice(idx, 1);
}

// "Mất ngủ" không có tag con -> bấm là chọn thẳng nó làm triệu chứng. Các nhóm còn lại có
// tag con -> bấm chỉ để MỞ/ĐÓNG danh sách con.
function toggleDemoBodyGroup(group) {
  if (!group.children.length) {
    toggleDemoBodySymptom(group);
    return;
  }
  if (demoExpandedBodyGroups.has(group.id)) demoExpandedBodyGroups.delete(group.id);
  else demoExpandedBodyGroups.add(group.id);
}

function isDemoBodyGroupHighlighted(group) {
  if (!group.children.length) return demoCheckin.bodySymptoms.includes(group);
  return demoExpandedBodyGroups.has(group.id);
}

function resetDemoCheckin() {
  demoStep.value = 1;
  demoCheckin.score = 5;
  demoCheckin.mood = null;
  demoCheckin.moodId = null;
  demoCheckin.tags = [];
  demoCheckin.bodySymptoms = [];
  demoExpandedBodyGroups.clear();
  demoSaved.value = false;
}

async function saveDemoMood() {
  demoSubmitting.value = true;

  // Đây là widget demo trên trang chủ — chỉ lưu thật vào DB khi đã đăng nhập. Khách chưa
  // đăng nhập chỉ xem trước trải nghiệm, không có tài khoản để lưu.
  if (isAuthenticated.value) {
    try {
      const payload = deriveMoodPayload({
        score: demoCheckin.score,
        moodViLabel: demoSelectedMoodOption.value?.viLabel || null,
        triggerIds: demoCheckin.tags.map((tag) => tag.id),
        notes: demoCheckin.bodySymptoms.length
          ? `${t('moodCheckin.stepBody.notesPrefix')}: ${demoCheckin.bodySymptoms.map((tag) => t(tag.labelKey)).join(', ')}`
          : null
      });
      await apiClient.post('/moods', payload);
      window.dispatchEvent(new CustomEvent('peaceflow:mood-saved'));
    } catch (error) {
      console.error('Could not save mood to API:', error);
    }
  }

  demoSubmitting.value = false;
  demoSaved.value = true;
}

function closeAuthDropdownOnOutsideClick(event) {
  const menu = document.querySelector('.nav-auth-menu');
  if (menu && !menu.contains(event.target)) navDropdownOpen.value = false;
}

// Đo chiều cao thật của .hero-content và co nhỏ (transform: scale) nếu tràn quá 1 màn
// hình mobile — đảm bảo badge/title/subtitle/quote/actions/stats luôn hiện đủ mà không
// cần cuộn, thay vì chỉ dựa vào ước lượng CSS tĩnh (không đúng trên mọi thiết bị).
const heroContentRef = ref(null);
const HERO_FIT_MIN_SCALE = 0.6;
let heroFitRaf = null;

function fitHeroContent() {
  const el = heroContentRef.value;
  if (!el) return;

  el.style.transform = '';
  el.style.transformOrigin = '';
  el.style.marginBottom = '';

  if (window.innerWidth > 768) return;

  const rect = el.getBoundingClientRect();
  const naturalHeight = el.scrollHeight;
  const bottomGap = 16;
  const available = window.innerHeight - rect.top - bottomGap;
  if (available <= 0 || naturalHeight <= available) return;

  const scale = Math.max(available / naturalHeight, HERO_FIT_MIN_SCALE);
  el.style.transformOrigin = 'top center';
  el.style.transform = `scale(${scale})`;
  el.style.marginBottom = `${-(naturalHeight - naturalHeight * scale)}px`;
}

function scheduleHeroFit() {
  if (heroFitRaf) cancelAnimationFrame(heroFitRaf);
  heroFitRaf = requestAnimationFrame(fitHeroContent);
}

onMounted(() => {
  document.addEventListener('click', closeAuthDropdownOnOutsideClick);
  auth.waitForAuth();

  nextTick(() => {
    scheduleHeroFit();
    if (document.fonts?.ready) document.fonts.ready.then(scheduleHeroFit);
  });
  window.addEventListener('resize', scheduleHeroFit);
  window.addEventListener('orientationchange', scheduleHeroFit);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeAuthDropdownOnOutsideClick);
  window.removeEventListener('resize', scheduleHeroFit);
  window.removeEventListener('orientationchange', scheduleHeroFit);
  if (heroFitRaf) cancelAnimationFrame(heroFitRaf);
  // Lưới an toàn: router-link trong mobile-nav-panel điều hướng đi luôn mà không
  // gọi closeMobileNav() trước, nếu không reset ở đây body sẽ bị kẹt overflow:hidden.
  document.body.style.overflow = '';
});
</script>

<style scoped src="../assets/index-landing.css"></style>
<style scoped src="../assets/moodCheckinWidget.css"></style>
