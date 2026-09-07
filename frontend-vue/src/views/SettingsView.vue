<template>
  <main class="main-content settings-page" style="margin-left: 0;">
    <div class="breadcrumb">
      <router-link to="/dashboard">{{ t('settingsPage.breadcrumbDashboard') }}</router-link><span>›</span>
      <span>{{ t('settingsPage.breadcrumbCurrent') }}</span>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:1.5rem;font-weight:800;">{{ t('settingsPage.pageTitle') }}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);">{{ t('settingsPage.pageSubtitle') }}</div>
      </div>
      <button class="btn-primary" @click="saveAllSettings">{{ t('settingsPage.saveAll') }}</button>
    </div>

    <div class="settings-layout">
      <!-- LEFT: Settings Nav -->
      <div class="settings-nav">
        <div class="paper-card sn-card">
          <a class="sn-item" :class="{ active: currentSection === 'notifications' }" href="#" @click.prevent="switchSection('notifications')"><span class="sni">🔔</span> {{ t('settingsPage.nav.notifications') }}</a>
          <a class="sn-item" :class="{ active: currentSection === 'appearance' }" href="#" @click.prevent="switchSection('appearance')"><span class="sni">🎨</span> {{ t('settingsPage.nav.appearance') }}</a>
          <a class="sn-item" :class="{ active: currentSection === 'checkin' }" href="#" @click.prevent="switchSection('checkin')"><span class="sni">💭</span> {{ t('settingsPage.nav.checkin') }}</a>
          <a class="sn-item" :class="{ active: currentSection === 'ai' }" href="#" @click.prevent="switchSection('ai')"><span class="sni">🐱</span> {{ t('settingsPage.nav.ai') }}</a>
          <div class="sn-divider"></div>
          <a class="sn-item" :class="{ active: currentSection === 'devices' }" href="#" @click.prevent="switchSection('devices')"><span class="sni">📱</span> {{ t('settingsPage.nav.devices') }}</a>
          <a class="sn-item" :class="{ active: currentSection === 'privacy' }" href="#" @click.prevent="switchSection('privacy')"><span class="sni">🔒</span> {{ t('settingsPage.nav.privacy') }}</a>
          <a class="sn-item" :class="{ active: currentSection === 'security' }" href="#" @click.prevent="switchSection('security')"><span class="sni">🛡️</span> {{ t('settingsPage.nav.security') }}</a>
          <div class="sn-divider"></div>
          <a class="sn-item" :class="{ active: currentSection === 'data' }" href="#" @click.prevent="switchSection('data')"><span class="sni">📦</span> {{ t('settingsPage.nav.data') }}</a>
          <a class="sn-item" :class="{ active: currentSection === 'about' }" href="#" @click.prevent="switchSection('about')"><span class="sni">ℹ️</span> {{ t('settingsPage.nav.about') }}</a>
          <div class="sn-divider"></div>
          <a class="sn-item" :class="{ active: currentSection === 'danger' }" href="#" style="color:var(--coral);" @click.prevent="switchSection('danger')"><span class="sni">⚠️</span> {{ t('settingsPage.nav.danger') }}</a>
        </div>
      </div>

      <!-- RIGHT: Settings Content -->
      <div>
        <!-- NOTIFICATIONS -->
        <div class="settings-section" :class="{ active: currentSection === 'notifications' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--peach-light);">🔔</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.notifications.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.notifications.subtitle') }}</div>
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.notifications.masterTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.notifications.masterDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.notifMaster" @change="EventLogger.log('settings', 'notif:master:toggle')"><span class="toggle-slider"></span></label>
            </div>
            <div id="notif-sub-settings" :style="{ opacity: form.notifMaster ? '1' : '0.45' }">
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.morningTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.morningDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifMorning" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="time-row">
                <div class="tr-left"><div class="tr-title">{{ t('settingsPage.notifications.morningTimeLabel') }}</div></div>
                <input type="time" class="time-input" v-model="form.notifMorningTime" :disabled="!form.notifMaster">
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.eveningTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.eveningDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifEvening" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="time-row">
                <div class="tr-left"><div class="tr-title">{{ t('settingsPage.notifications.eveningTimeLabel') }}</div></div>
                <input type="time" class="time-input" v-model="form.notifEveningTime" :disabled="!form.notifMaster">
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.tasksTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.tasksDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifTasks" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.streakTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.streakDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifStreak" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.achievementsTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.achievementsDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifAchievements" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.insightsTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.insightsDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifInsights" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.expertTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.expertDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifExpert" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.notifications.communityTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.notifications.communityDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.notifCommunity" :disabled="!form.notifMaster"><span class="toggle-slider"></span></label>
              </div>
            </div>
            <div style="margin-top:14px;padding:12px 14px;background:var(--sky-light);border:1.5px solid var(--sky);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;" v-html="t('settingsPage.notifications.note')"></div>
          </div>
        </div>

        <!-- APPEARANCE -->
        <div class="settings-section" :class="{ active: currentSection === 'appearance' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--lavender-light);">🎨</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.appearance.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.appearance.subtitle') }}</div>
              </div>
            </div>
            <div class="sr-left" style="margin-bottom:8px;">
              <div class="sr-title">{{ t('settingsPage.appearance.themeSectionTitle') }}</div>
              <div class="sr-desc">{{ t('settingsPage.appearance.themeSectionDesc') }}</div>
            </div>
            <div class="theme-grid">
              <div class="theme-option" :class="{ selected: currentTheme === 'paper' }" @click="selectTheme('paper')">
                <div class="to-preview" style="background:linear-gradient(135deg,#FFF8F0,#A8D5BA);"></div>
                <div class="to-name">{{ t('settingsPage.appearance.themes.paper') }}</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'ocean' }" @click="selectTheme('ocean')">
                <div class="to-preview" style="background:linear-gradient(135deg,#E8F4FD,#74B9FF);"></div>
                <div class="to-name">{{ t('settingsPage.appearance.themes.ocean') }}</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'sunset' }" @click="selectTheme('sunset')">
                <div class="to-preview" style="background:linear-gradient(135deg,#FFF3E0,#FF8B8B);"></div>
                <div class="to-name">{{ t('settingsPage.appearance.themes.sunset') }}</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'forest' }" @click="selectTheme('forest')">
                <div class="to-preview" style="background:linear-gradient(135deg,#E8F5E9,#2E7D32);"></div>
                <div class="to-name">{{ t('settingsPage.appearance.themes.forest') }}</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'lavender' }" @click="selectTheme('lavender')">
                <div class="to-preview" style="background:linear-gradient(135deg,#F3E5F5,#9C27B0);"></div>
                <div class="to-name">{{ t('settingsPage.appearance.themes.lavender') }}</div>
              </div>
              <div class="theme-option" :class="{ selected: currentTheme === 'dark' }" style="opacity:0.5;" @click="selectTheme('dark')">
                <div class="to-preview" style="background:linear-gradient(135deg,#263238,#546E7A);"></div>
                <div class="to-name">{{ t('settingsPage.appearance.themes.dark') }}</div>
              </div>
            </div>
            <div style="margin-top:16px;">
              <div class="sr-left" style="margin-bottom:8px;">
                <div class="sr-title">{{ t('settingsPage.appearance.fontSizeTitle') }}</div>
              </div>
              <div class="font-size-row">
                <button class="fs-btn" :class="{ selected: currentFontSize === 'small' }" style="font-size:0.72rem;" @click="selectFontSize('small')">{{ t('settingsPage.appearance.fontSmall') }}</button>
                <button class="fs-btn" :class="{ selected: currentFontSize === 'medium' }" style="font-size:0.85rem;" @click="selectFontSize('medium')">{{ t('settingsPage.appearance.fontMedium') }}</button>
                <button class="fs-btn" :class="{ selected: currentFontSize === 'large' }" style="font-size:1rem;" @click="selectFontSize('large')">{{ t('settingsPage.appearance.fontLarge') }}</button>
              </div>
            </div>
            <div style="margin-top:16px;">
              <div class="sr-left" style="margin-bottom:8px;">
                <div class="sr-title">{{ t('settingsPage.appearance.languageTitle') }}</div>
              </div>
              <LanguageSwitcher />
            </div>
            <div style="margin-top:16px;">
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.appearance.animationsTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.appearance.animationsDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.appearanceAnimations"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.appearance.soundsTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.appearance.soundsDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.appearanceSounds"><span class="toggle-slider"></span></label>
              </div>
              <div class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ t('settingsPage.appearance.hapticsTitle') }}</div>
                  <div class="tr-desc">{{ t('settingsPage.appearance.hapticsDesc') }}</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" v-model="form.appearanceHaptics"><span class="toggle-slider"></span></label>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('appearance')">{{ t('settingsPage.appearance.save') }}</button>
            </div>
          </div>
        </div>

        <!-- CHECK-IN -->
        <div class="settings-section" :class="{ active: currentSection === 'checkin' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--mint-light);">💭</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.checkin.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.checkin.subtitle') }}</div>
              </div>
            </div>
            <div class="select-row">
              <div class="sr-left">
                <div class="sr-title">{{ t('settingsPage.checkin.defaultModeTitle') }}</div>
                <div class="sr-desc">{{ t('settingsPage.checkin.defaultModeDesc') }}</div>
              </div>
              <select class="form-select" v-model="form.checkinDefaultMode">
                <option v-for="opt in CHECKIN_MODE_OPTIONS" :key="opt.id" :value="opt.id">{{ t(opt.labelKey) }}</option>
              </select>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.checkin.notesTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.checkin.notesDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinNotes"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.checkin.tagsTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.checkin.tagsDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinTags"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.checkin.assessmentReminderTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.checkin.assessmentReminderDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinAssessmentReminder"><span class="toggle-slider"></span></label>
            </div>
            <div class="select-row">
              <div class="sr-left"><div class="sr-title">{{ t('settingsPage.checkin.reminderFreqTitle') }}</div></div>
              <select class="form-select" v-model="form.checkinReminderFrequency">
                <option v-for="opt in CHECKIN_FREQ_OPTIONS" :key="opt.id" :value="opt.id">{{ t(opt.labelKey) }}</option>
              </select>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.checkin.voiceTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.checkin.voiceDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinVoiceOptin"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.checkin.selfieTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.checkin.selfieDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.checkinSelfieOptin"><span class="toggle-slider"></span></label>
            </div>
            <div style="margin-top:10px;padding:10px 12px;background:var(--peach-light);border:1.5px solid var(--peach);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">
              {{ t('settingsPage.checkin.note') }}
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('checkin')">{{ t('settingsPage.checkin.save') }}</button>
            </div>
          </div>
        </div>

        <!-- AI SETTINGS -->
        <div class="settings-section" :class="{ active: currentSection === 'ai' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--lavender-light);">🐱</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.ai.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.ai.subtitle') }}</div>
              </div>
            </div>
            <div class="select-row">
              <div class="sr-left">
                <div class="sr-title">{{ t('settingsPage.ai.styleTitle') }}</div>
                <div class="sr-desc">{{ t('settingsPage.ai.styleDesc') }}</div>
              </div>
              <select class="form-select" v-model="form.aiStyle">
                <option v-for="opt in AI_STYLE_OPTIONS" :key="opt.id" :value="opt.id">{{ t(opt.labelKey) }}</option>
              </select>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.ai.taskSuggestionsTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.ai.taskSuggestionsDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiTaskSuggestions"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.ai.insightsTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.ai.insightsDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiInsights"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.ai.crisisTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.ai.crisisDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked disabled><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.ai.journalTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.ai.journalDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiJournalAnalysis"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.ai.mascotTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.ai.mascotDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.aiMascot"><span class="toggle-slider"></span></label>
            </div>
            <div style="margin-top:10px;padding:10px 12px;background:var(--lavender-light);border:1.5px solid var(--lavender);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;" v-html="t('settingsPage.ai.note')"></div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('ai')">{{ t('settingsPage.ai.save') }}</button>
            </div>
          </div>
        </div>

        <!-- DEVICES -->
        <div class="settings-section" :class="{ active: currentSection === 'devices' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--sky-light);">📱</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.devices.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.devices.subtitle') }}</div>
              </div>
            </div>
            <div>
              <div class="device-card">
                <div class="dc-icon">💻</div>
                <div class="dc-info">
                  <div class="dc-name">{{ deviceName }}</div>
                  <div class="dc-meta">{{ t('settingsPage.devices.currentSessionMeta', { time: currentSessionTime }) }}</div>
                </div>
                <div class="dc-status on">{{ t('settingsPage.devices.statusActive') }}</div>
                <button class="dc-btn" type="button" @click="handleLogout">{{ t('settingsPage.devices.logout') }}</button>
              </div>
              <div class="device-card">
                <div class="dc-icon">⌚</div>
                <div class="dc-info">
                  <div class="dc-name">{{ t('settingsPage.devices.wearableName') }}</div>
                  <div class="dc-meta">{{ t('settingsPage.devices.wearableDesc') }}</div>
                </div>
                <div class="dc-status off">{{ t('settingsPage.devices.statusUnsupported') }}</div>
                <button class="dc-btn disconnect" type="button" @click="disconnectDevice('wearable')">{{ t('settingsPage.devices.wearableInfoBtn') }}</button>
              </div>
            </div>
            <div style="margin-top:10px;padding:10px 12px;background:var(--sky-light);border:1.5px solid var(--sky);border-radius:var(--border-radius-sm);font-size:0.72rem;color:var(--text-secondary);line-height:1.5;">
              {{ t('settingsPage.devices.note') }}
            </div>
          </div>
        </div>

        <!-- PRIVACY -->
        <div class="settings-section" :class="{ active: currentSection === 'privacy' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--mint-light);">🔒</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.privacy.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.privacy.subtitle') }}</div>
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.privacy.shareDataTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.privacy.shareDataDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.privacyShareData"><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.privacy.analyticsTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.privacy.analyticsDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" v-model="form.privacyAnonAnalytics"><span class="toggle-slider"></span></label>
            </div>
            <div class="select-row">
              <div class="sr-left">
                <div class="sr-title">{{ t('settingsPage.privacy.visibilityTitle') }}</div>
                <div class="sr-desc">{{ t('settingsPage.privacy.visibilityDesc') }}</div>
              </div>
              <select class="form-select" v-model="form.privacyProfileVisibility">
                <option value="private">{{ t('settingsPage.privacy.visibility.private') }}</option>
                <option value="friends">{{ t('settingsPage.privacy.visibility.friends') }}</option>
                <option value="community">{{ t('settingsPage.privacy.visibility.community') }}</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
              <button class="btn-primary" @click="saveSection('privacy')">{{ t('settingsPage.privacy.save') }}</button>
            </div>
          </div>
        </div>

        <!-- SECURITY -->
        <div class="settings-section" :class="{ active: currentSection === 'security' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--peach-light);">🛡️</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.security.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.security.subtitle') }}</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--border-radius-sm);margin-bottom:12px;font-size:0.82rem;color:var(--text-secondary);line-height:1.6;">
              <div><strong>{{ t('settingsPage.security.userLabel') }}</strong> {{ securityInfo.displayName }}</div>
              <div><strong>{{ t('settingsPage.security.accessTokenLabel') }}</strong> {{ securityInfo.hasAccessToken ? t('settingsPage.security.yes') : t('settingsPage.security.no') }}</div>
              <div><strong>{{ t('settingsPage.security.refreshTokenLabel') }}</strong> {{ securityInfo.hasRefreshToken ? t('settingsPage.security.yes') : t('settingsPage.security.no') }}</div>
              <div><strong>{{ t('settingsPage.security.lastUpdateLabel') }}</strong> {{ securityInfo.updatedAt }}</div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('settingsPage.security.autoRefreshTitle') }}</div>
                <div class="tr-desc">{{ t('settingsPage.security.autoRefreshDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked disabled><span class="toggle-slider"></span></label>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-outline" @click="saveSection('security')">{{ t('settingsPage.security.checkSession') }}</button>
              <button class="btn-primary" @click="handleLogout">{{ t('settingsPage.security.logoutBtn') }}</button>
            </div>
          </div>
        </div>

        <!-- DATA -->
        <div class="settings-section" :class="{ active: currentSection === 'data' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--lavender-light);">📦</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.data.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.data.subtitle') }}</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:var(--warm-white);border:1.5px dashed var(--kraft-light);border-radius:var(--border-radius-sm);font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">
              {{ t('settingsPage.data.exportNote') }}
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-outline" @click="resetData">{{ t('settingsPage.data.resetLocal') }}</button>
              <button class="btn-primary" @click="exportData('json')">{{ t('settingsPage.data.exportJson') }}</button>
            </div>
          </div>
        </div>

        <!-- ABOUT -->
        <div class="settings-section" :class="{ active: currentSection === 'about' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:var(--gold-light);">ℹ️</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.about.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.about.subtitle') }}</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:var(--cream);border:1.5px solid var(--kraft-light);border-radius:var(--border-radius-sm);font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
              <div><strong>{{ t('settingsPage.about.versionLabel') }}</strong> {{ aboutInfo.version }}</div>
              <div><strong>{{ t('settingsPage.about.apiLabel') }}</strong> {{ aboutInfo.apiBase }}</div>
              <div><strong>{{ t('settingsPage.about.timezoneLabel') }}</strong> {{ aboutInfo.timezone }}</div>
              <div><strong>{{ t('settingsPage.about.currentUserLabel') }}</strong> {{ aboutInfo.displayName }}</div>
            </div>
          </div>
        </div>

        <!-- DANGER -->
        <div class="settings-section" :class="{ active: currentSection === 'danger' }">
          <div class="paper-card section-card">
            <div class="sc-header">
              <div class="sc-icon" style="background:rgba(255,139,139,0.16);">⚠️</div>
              <div>
                <div class="sc-title">{{ t('settingsPage.danger.title') }}</div>
                <div class="sc-subtitle">{{ t('settingsPage.danger.subtitle') }}</div>
              </div>
            </div>
            <div style="padding:14px 16px;background:rgba(255,139,139,0.08);border:1.5px solid var(--coral-light);border-radius:var(--border-radius-sm);font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">
              {{ t('settingsPage.danger.note') }}
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-outline" @click="resetData">{{ t('settingsPage.danger.resetCache') }}</button>
              <button class="btn-danger" @click="deleteAccount">{{ t('settingsPage.danger.deleteAccountBtn') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible }">✅ <span>{{ toastText }}</span></div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient, getApiBaseUrl } from '../lib/apiClient';
import { EventLogger } from '../lib/eventLogger';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';

const router = useRouter();
const { t, locale } = useI18n();
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

// id lưu vào support_preferences.* (backend chỉ merge JSONB opaque, không so khớp theo text —
// đã audit ai.context.js/profile.routes.js) — an toàn để đổi từ text tiếng Việt sang mã cố định.
// Map legacy dùng để quy đổi dữ liệu cũ đã lưu dạng tiếng Việt sang mã mới khi load.
const CHECKIN_MODE_OPTIONS = [
  { id: 'quick_emoji', labelKey: 'settingsPage.checkin.modes.quickEmoji' },
  { id: 'chat', labelKey: 'settingsPage.checkin.modes.chat' },
  { id: 'assessment', labelKey: 'settingsPage.checkin.modes.assessment' }
];
const LEGACY_CHECKIN_MODE_MAP = {
  '😊 Chọn emoji nhanh': 'quick_emoji',
  '💬 Chat với PeaceCat': 'chat',
  '📊 Bài kiểm tra chuẩn hóa': 'assessment'
};
function normalizeCheckinMode(value) {
  if (CHECKIN_MODE_OPTIONS.some((opt) => opt.id === value)) return value;
  return LEGACY_CHECKIN_MODE_MAP[value] || 'quick_emoji';
}

const CHECKIN_FREQ_OPTIONS = [
  { id: 'weekly', labelKey: 'settingsPage.checkin.freq.weekly' },
  { id: 'biweekly', labelKey: 'settingsPage.checkin.freq.biweekly' },
  { id: 'monthly', labelKey: 'settingsPage.checkin.freq.monthly' },
  { id: 'never', labelKey: 'settingsPage.checkin.freq.never' }
];
const LEGACY_CHECKIN_FREQ_MAP = {
  'Hàng tuần': 'weekly',
  '2 tuần/lần': 'biweekly',
  'Hàng tháng': 'monthly',
  'Chỉ khi tôi muốn': 'never'
};
function normalizeCheckinFreq(value) {
  if (CHECKIN_FREQ_OPTIONS.some((opt) => opt.id === value)) return value;
  return LEGACY_CHECKIN_FREQ_MAP[value] || 'biweekly';
}

const AI_STYLE_OPTIONS = [
  { id: 'friendly', labelKey: 'settingsPage.ai.styles.friendly' },
  { id: 'calm', labelKey: 'settingsPage.ai.styles.calm' },
  { id: 'energetic', labelKey: 'settingsPage.ai.styles.energetic' },
  { id: 'empathetic', labelKey: 'settingsPage.ai.styles.empathetic' }
];
const LEGACY_AI_STYLE_MAP = {
  '😊 Thân thiện, vui vẻ': 'friendly',
  '🧘 Bình tĩnh, sâu lắng': 'calm',
  '💪 Khích lệ, năng động': 'energetic',
  '🤗 Ấm áp, đồng cảm': 'empathetic'
};
function normalizeAiStyle(value) {
  if (AI_STYLE_OPTIONS.some((opt) => opt.id === value)) return value;
  return LEGACY_AI_STYLE_MAP[value] || 'friendly';
}

const LOCAL_SETTINGS_KEY = 'peaceflow_profile_settings';
const APP_VERSION = '1.0.0';

const THEMES = {
  paper: {
    '--cream': '#FFF8F0', '--warm-white': '#FFFDF7', '--kraft': '#D4A574', '--kraft-light': '#E8CBA7',
    '--mint': '#A8D5BA', '--mint-light': '#C5E8D2', '--mint-dark': '#7BBF95', '--peach-light': '#FFE0C4',
    '--sky-light': '#C5E8F5', '--lavender-light': '#DDD1EB', '--text-primary': '#4A3728', '--text-secondary': '#7A6555'
  },
  ocean: {
    '--cream': '#F2F8FF', '--warm-white': '#FAFDFF', '--kraft': '#86B7E3', '--kraft-light': '#C7DDF2',
    '--mint': '#8FD3F4', '--mint-light': '#D8F0FB', '--mint-dark': '#4EA5D9', '--peach-light': '#E6F4FF',
    '--sky-light': '#D8EEFF', '--lavender-light': '#DDEAFE', '--text-primary': '#23405B', '--text-secondary': '#4F6E89'
  },
  sunset: {
    '--cream': '#FFF5EE', '--warm-white': '#FFFDF9', '--kraft': '#F0A66E', '--kraft-light': '#F7D3B5',
    '--mint': '#FFC2A8', '--mint-light': '#FFE5D6', '--mint-dark': '#E9886A', '--peach-light': '#FFE4D6',
    '--sky-light': '#FFE8D8', '--lavender-light': '#F7D8D1', '--text-primary': '#5A3525', '--text-secondary': '#8A5F4A'
  },
  forest: {
    '--cream': '#F4FAF4', '--warm-white': '#FCFEFC', '--kraft': '#8DB892', '--kraft-light': '#CFE3D0',
    '--mint': '#7BC47F', '--mint-light': '#DDF2DF', '--mint-dark': '#4F9656', '--peach-light': '#E3F4E4',
    '--sky-light': '#DDF1E1', '--lavender-light': '#D8EBD8', '--text-primary': '#26442A', '--text-secondary': '#4F6C53'
  },
  lavender: {
    '--cream': '#FBF7FF', '--warm-white': '#FFFDFF', '--kraft': '#B99AD9', '--kraft-light': '#E4D7F2',
    '--mint': '#D0B7EA', '--mint-light': '#F0E7FA', '--mint-dark': '#8E6FB3', '--peach-light': '#F4E6FB',
    '--sky-light': '#EEE3FA', '--lavender-light': '#EADAF7', '--text-primary': '#47315C', '--text-secondary': '#72588C'
  }
};

const FONT_SIZES = { small: '14px', medium: '16px', large: '18px' };

function loadLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function formatDateTime(value) {
  if (!value) return t('settingsPage.defaults.notAvailable');
  return new Intl.DateTimeFormat(intlLocale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function detectDeviceName() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//.test(ua)) return 'Google Chrome';
  if (/Firefox\//.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return t('settingsPage.defaults.unknownBrowser');
}

const local = loadLocalSettings();

const user = ref(null);
const profile = ref(null);
const progress = ref(null);
const currentSection = ref('notifications');

const currentTheme = ref('paper');
const currentFontSize = ref('medium');

const form = reactive({
  notifMaster: true,
  notifMorning: true,
  notifMorningTime: '08:00',
  notifEvening: true,
  notifEveningTime: '21:30',
  notifTasks: true,
  notifStreak: true,
  notifAchievements: true,
  notifInsights: true,
  notifExpert: true,
  notifCommunity: false,
  appearanceAnimations: true,
  appearanceSounds: true,
  appearanceHaptics: true,
  checkinDefaultMode: 'quick_emoji',
  checkinNotes: true,
  checkinTags: true,
  checkinAssessmentReminder: true,
  checkinReminderFrequency: 'biweekly',
  checkinVoiceOptin: false,
  checkinSelfieOptin: false,
  aiStyle: 'friendly',
  aiTaskSuggestions: true,
  aiInsights: true,
  aiJournalAnalysis: true,
  aiMascot: true,
  privacyShareData: false,
  privacyAnonAnalytics: true,
  privacyProfileVisibility: 'private'
});

const toastVisible = ref(false);
const toastText = ref('');
let toastTimer = null;

function showToast(message, type = 'success') {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 2400);
}

function getSupportPreferences() {
  return profile.value?.support_preferences || {};
}

function getOnboardingAnswers() {
  return profile.value?.onboarding_answers || {};
}

function getNotificationSetting(key, fallback) {
  const notifications = getSupportPreferences().notifications || {};
  const localNotifications = local.notifications || {};
  return notifications[key] ?? localNotifications[key] ?? fallback;
}

function getLocalTheme() {
  return getOnboardingAnswers().theme || local.theme || 'paper';
}

function getLocalFontSize() {
  return getOnboardingAnswers().font_size || local.fontSize || 'medium';
}

function applyTheme(theme) {
  const palette = THEMES[theme] || THEMES.paper;
  Object.entries(palette).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
  currentTheme.value = theme;
}

function applyFontSize(size) {
  const cssValue = FONT_SIZES[size] || FONT_SIZES.medium;
  document.documentElement.style.fontSize = cssValue;
  currentFontSize.value = size;
}

function renderNotifications() {
  form.notifMaster = getNotificationSetting('master', true);
  form.notifMorning = getNotificationSetting('morning', true);
  form.notifEvening = getNotificationSetting('evening', true);
  form.notifTasks = getNotificationSetting('tasks', true);
  form.notifStreak = getNotificationSetting('streak', true);
  form.notifAchievements = getNotificationSetting('achievements', true);
  form.notifInsights = getNotificationSetting('insights', true);
  form.notifExpert = getNotificationSetting('expert', true);
  form.notifCommunity = getNotificationSetting('community', false);
  form.notifMorningTime = getSupportPreferences().morning_time || local.morningTime || '08:00';
  form.notifEveningTime = getSupportPreferences().evening_time || local.eveningTime || '21:30';
}

function renderAppearance() {
  const support = getSupportPreferences();
  form.appearanceAnimations = support.animations ?? local.animations ?? true;
  form.appearanceSounds = support.sounds ?? local.sounds ?? true;
  form.appearanceHaptics = support.haptics ?? local.haptics ?? true;
  applyTheme(getLocalTheme());
  applyFontSize(getLocalFontSize());
}

function renderCheckin() {
  const support = getSupportPreferences();
  form.checkinDefaultMode = normalizeCheckinMode(support.checkin_default_mode);
  form.checkinNotes = support.checkin_notes_enabled ?? true;
  form.checkinTags = support.checkin_tag_suggestions ?? true;
  form.checkinAssessmentReminder = support.assessment_reminder_enabled ?? true;
  form.checkinReminderFrequency = normalizeCheckinFreq(support.assessment_reminder_frequency);
  form.checkinVoiceOptin = support.voice_opt_in ?? false;
  form.checkinSelfieOptin = support.selfie_opt_in ?? false;
}

function renderAi() {
  const support = getSupportPreferences();
  form.aiStyle = normalizeAiStyle(support.ai_style);
  form.aiTaskSuggestions = support.ai_task_suggestions ?? true;
  form.aiInsights = support.ai_insights ?? true;
  form.aiJournalAnalysis = support.journal_analysis ?? true;
  form.aiMascot = support.mascot_enabled ?? true;
}

function renderPrivacy() {
  const support = getSupportPreferences();
  form.privacyShareData = support.privacy_share_data ?? false;
  form.privacyAnonAnalytics = support.privacy_anonymous_analytics ?? true;
  form.privacyProfileVisibility = support.profile_visibility || 'private';
}

function renderPage() {
  renderNotifications();
  renderAppearance();
  renderCheckin();
  renderAi();
  renderPrivacy();
}

const deviceName = computed(() => detectDeviceName());
const currentSessionTime = computed(() => formatDateTime(user.value?.updated_at || user.value?.created_at));

const securityInfo = computed(() => ({
  displayName: user.value?.display_name || user.value?.full_name || t('settingsPage.defaults.defaultUserName'),
  hasAccessToken: Boolean(localStorage.getItem('access_token')),
  hasRefreshToken: Boolean(localStorage.getItem('refresh_token')),
  updatedAt: formatDateTime(profile.value?.updated_at || user.value?.updated_at)
}));

const aboutInfo = computed(() => ({
  version: APP_VERSION,
  apiBase: getApiBaseUrl(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || t('settingsPage.about.unknownTimezone'),
  displayName: user.value?.display_name || user.value?.full_name || t('settingsPage.defaults.defaultUserName')
}));

function collectLocalSettings() {
  local.notifications = {
    master: form.notifMaster,
    morning: form.notifMorning,
    evening: form.notifEvening,
    tasks: form.notifTasks,
    streak: form.notifStreak,
    achievements: form.notifAchievements,
    insights: form.notifInsights,
    expert: form.notifExpert,
    community: form.notifCommunity
  };
  local.morningTime = form.notifMorningTime || '08:00';
  local.eveningTime = form.notifEveningTime || '21:30';
  local.animations = form.appearanceAnimations;
  local.sounds = form.appearanceSounds;
  local.haptics = form.appearanceHaptics;
  local.checkin = {
    defaultMode: form.checkinDefaultMode,
    notes: form.checkinNotes,
    tags: form.checkinTags,
    assessmentReminder: form.checkinAssessmentReminder,
    reminderFrequency: form.checkinReminderFrequency,
    voiceOptIn: form.checkinVoiceOptin,
    selfieOptIn: form.checkinSelfieOptin
  };
  local.ai = {
    style: form.aiStyle,
    taskSuggestions: form.aiTaskSuggestions,
    insights: form.aiInsights,
    journalAnalysis: form.aiJournalAnalysis,
    mascot: form.aiMascot
  };
  local.privacy = {
    shareData: form.privacyShareData,
    anonymousAnalytics: form.privacyAnonAnalytics,
    profileVisibility: form.privacyProfileVisibility
  };
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(local));
}

function buildProfilePayload() {
  const existingSupport = getSupportPreferences();
  const existingOnboarding = getOnboardingAnswers();

  return {
    support_preferences: {
      ...existingSupport,
      notifications: {
        master: form.notifMaster,
        morning: form.notifMorning,
        evening: form.notifEvening,
        tasks: form.notifTasks,
        streak: form.notifStreak,
        achievements: form.notifAchievements,
        insights: form.notifInsights,
        expert: form.notifExpert,
        community: form.notifCommunity
      },
      morning_time: form.notifMorningTime || '08:00',
      evening_time: form.notifEveningTime || '21:30',
      animations: form.appearanceAnimations,
      sounds: form.appearanceSounds,
      haptics: form.appearanceHaptics,
      checkin_default_mode: form.checkinDefaultMode,
      checkin_notes_enabled: form.checkinNotes,
      checkin_tag_suggestions: form.checkinTags,
      assessment_reminder_enabled: form.checkinAssessmentReminder,
      assessment_reminder_frequency: form.checkinReminderFrequency,
      voice_opt_in: form.checkinVoiceOptin,
      selfie_opt_in: form.checkinSelfieOptin,
      ai_style: form.aiStyle,
      ai_task_suggestions: form.aiTaskSuggestions,
      ai_insights: form.aiInsights,
      journal_analysis: form.aiJournalAnalysis,
      mascot_enabled: form.aiMascot,
      privacy_share_data: form.privacyShareData,
      privacy_anonymous_analytics: form.privacyAnonAnalytics,
      profile_visibility: form.privacyProfileVisibility
    },
    onboarding_answers: {
      ...existingOnboarding,
      theme: currentTheme.value || 'paper',
      font_size: currentFontSize.value || 'medium'
    }
  };
}

async function loadData() {
  const [userData, profileData, progressData] = await Promise.all([
    apiClient.get('/me'),
    apiClient.get('/profile'),
    apiClient.get('/progress')
  ]);

  user.value = userData;
  profile.value = profileData || {};
  progress.value = progressData || {};

  localStorage.setItem('user', JSON.stringify(userData));
  window.dispatchEvent(new Event('user-profile-updated'));
}

async function persistSettings(scope) {
  collectLocalSettings();

  try {
    profile.value = await apiClient.put('/profile', buildProfilePayload());
    EventLogger.log('settings', 'save:server:success');
    renderPage();
    showToast(scope === 'all' ? t('settingsPage.toast.savedAll') : t('settingsPage.toast.savedSection', { section: t(`settingsPage.nav.${scope}`) }));
  } catch (error) {
    EventLogger.error('settings', 'save:server:failed', error);
    console.error('Settings save failed:', error);
    showToast(t('settingsPage.toast.saveFailed'), 'error');
  }
}

function switchSection(sectionId) {
  EventLogger.log('settings', 'section:switch');
  currentSection.value = sectionId;
}

function selectTheme(themeName) {
  EventLogger.log('settings', 'theme:select');
  if (themeName === 'dark') {
    showToast(t('settingsPage.toast.themeDarkComingSoon'), 'info');
    return;
  }

  applyTheme(themeName);
  collectLocalSettings();
}

function selectFontSize(size) {
  EventLogger.log('settings', 'font:select');
  applyFontSize(size);
  collectLocalSettings();
}

async function saveAllSettings() {
  EventLogger.log('settings', 'save:all');
  await persistSettings('all');
}

async function saveSection(section) {
  EventLogger.log('settings', 'save:section');
  await persistSettings(section);
}

function disconnectDevice(deviceKey) {
  if (deviceKey === 'wearable') {
    showToast(t('settingsPage.toast.wearableNotSupported'), 'info');
    return;
  }
  showToast(t('settingsPage.toast.logoutOnly'), 'info');
}

async function exportData(format) {
  EventLogger.log('settings', 'data:export:attempt');
  if (format !== 'json') {
    showToast(t('settingsPage.toast.exportJsonOnly'), 'info');
    return;
  }

  try {
    const [achievements, report] = await Promise.all([
      apiClient.get('/achievements'),
      apiClient.get('/reports/detail')
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user: user.value,
      profile: profile.value,
      progress: progress.value,
      achievements,
      report,
      local_settings: local
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'peaceflow-settings-export.json';
    link.click();
    URL.revokeObjectURL(link.href);
    EventLogger.log('settings', 'data:export:success');
    showToast(t('settingsPage.toast.exported'));
  } catch (error) {
    EventLogger.error('settings', 'data:export:failed', error);
    console.error('Export failed:', error);
    showToast(t('settingsPage.toast.exportFailed'), 'error');
  }
}

function resetData() {
  EventLogger.log('settings', 'data:reset:request');
  const confirmed = window.confirm(t('settingsPage.toast.resetConfirm'));
  if (!confirmed) return;

  EventLogger.log('settings', 'data:reset:confirmed');
  localStorage.removeItem(LOCAL_SETTINGS_KEY);
  localStorage.removeItem('PeaceFlow_settings');
  Object.keys(local).forEach((key) => delete local[key]);
  renderPage();
  showToast(t('settingsPage.toast.resetDone'));
}

function deleteAccount() {
  EventLogger.log('settings', 'account:delete:request');
  showToast(t('settingsPage.toast.deleteAccountNotSupported'), 'info');
}

async function handleLogout() {
  EventLogger.log('auth', 'logout:request');
  try {
    await apiClient.logout();
  } finally {
    router.push('/login');
  }
}

onMounted(async () => {
  try {
    await loadData();
    renderPage();
  } catch (error) {
    console.error('Settings init failed:', error);
    showToast(t('settingsPage.toast.loadFailed'), 'error');
  }
});
</script>

<style scoped src="../assets/settings.css"></style>
