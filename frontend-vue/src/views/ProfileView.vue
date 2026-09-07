<template>
  <main class="main-content profile-page" style="margin-left: 0;">
    <div class="breadcrumb">
      <router-link to="/dashboard">{{ t('profile.breadcrumbDashboard') }}</router-link><span>›</span>
      <span>{{ t('profile.breadcrumbCurrent') }}</span>
    </div>

    <!-- Profile Hero -->
    <div class="paper-card profile-hero">
      <div class="ph-deco">🌿</div>
      <div class="ph-content">
        <div class="ph-avatar-wrap">
          <div class="ph-avatar" @click="switchTab('info')" :title="t('profile.hero.changeAvatarTitle')">{{ heroAvatar }}</div>
          <div class="ph-avatar-edit">✏️</div>
        </div>
        <div class="ph-info">
          <div class="ph-name">{{ heroName }}</div>
          <div class="ph-tagline">{{ heroTaglineText }}</div>
          <div class="ph-meta">
            <div class="ph-meta-item">{{ t('profile.hero.joined', { date: heroJoinDate }) }}</div>
            <div class="ph-meta-item">📍 {{ heroLocation }}</div>
            <div class="ph-meta-item">{{ t('profile.hero.streakDays', { n: heroStreak }) }}</div>
          </div>
          <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div class="ph-level-badge">{{ heroLevelBadgeText }}</div>
          </div>
          <div class="ph-xp-bar-wrap">
            <div class="ph-xp-label"><span>{{ heroXpLeft }}</span><span>{{ heroXpRight }}</span></div>
            <div class="ph-xp-bar">
              <div class="ph-xp-fill" :style="{ width: heroXpFillPct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Tabs -->
    <div class="profile-tabs">
      <div class="profile-tab" :class="{ active: activeTab === 'info' }" @click="switchTab('info')">{{ t('profile.tabs.info') }}</div>
      <div class="profile-tab" :class="{ active: activeTab === 'badges' }" @click="switchTab('badges')">{{ t('profile.tabs.badges') }}</div>
      <div class="profile-tab" :class="{ active: activeTab === 'activity' }" @click="switchTab('activity')">{{ t('profile.tabs.activity') }}</div>
      <div class="profile-tab" :class="{ active: activeTab === 'settings' }" @click="switchTab('settings')">{{ t('profile.tabs.settings') }}</div>
      <div class="profile-tab" :class="{ active: activeTab === 'privacy' }" @click="switchTab('privacy')">{{ t('profile.tabs.privacy') }}</div>
    </div>

    <div class="profile-layout">
      <!-- LEFT: Main Content -->
      <div>
        <!-- TAB: INFO -->
        <div class="tab-panel" :class="{ active: activeTab === 'info' }">
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.info.sectionTitle') }}</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.displayName') }}</label>
                <input type="text" class="form-input" v-model="formDisplayName">
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.nickname') }}</label>
                <input type="text" class="form-input" :placeholder="t('profile.info.nicknamePlaceholder')" v-model="formNickname">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.email') }}</label>
                <input type="email" class="form-input" v-model="formEmail">
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.phone') }}</label>
                <input type="tel" class="form-input" :placeholder="t('profile.info.phonePlaceholder')" v-model="formPhone">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.ageGroup') }}</label>
                <select class="form-select" v-model="formAgeGroup">
                  <option v-for="opt in AGE_OPTIONS" :key="opt.id" :value="opt.id">{{ t(opt.labelKey) }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.gender') }}</label>
                <select class="form-select" v-model="formGender">
                  <option v-for="opt in GENDER_OPTIONS" :key="opt.id" :value="opt.id">{{ t(opt.labelKey) }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('profile.info.tagline') }}</label>
              <input type="text" class="form-input" v-model="formTagline">
              <span class="form-hint">{{ t('profile.info.taglineHint') }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('profile.info.bio') }}</label>
              <textarea class="form-textarea" rows="3" :placeholder="t('profile.info.bioPlaceholder')" v-model="formBio"></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button class="btn-outline" @click="resetForm">{{ t('profile.info.cancel') }}</button>
              <button class="btn-primary" @click="saveProfile">{{ savingProfile ? t('profile.info.saving') : t('profile.info.save') }}</button>
            </div>
          </div>

          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.info.avatarSectionTitle') }}</div>
            <div class="avatar-grid">
              <div
                v-for="avatar in AVATARS"
                :key="avatar"
                class="avatar-option"
                :class="{ selected: avatar === selectedAvatar }"
                @click="selectAvatar(avatar)"
              >{{ avatar }}</div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-light);">{{ t('profile.info.avatarHint') }}</div>
          </div>

          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.info.goalsSectionTitle') }}</div>
            <div class="form-group">
              <label class="form-label">{{ t('profile.info.goalsLabel') }}</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                <div
                  v-for="goal in GOAL_OPTIONS"
                  :key="goal.id"
                  class="goal-chip"
                  :class="{ selected: selectedGoals.includes(goal.id) }"
                  @click="toggleGoal(goal.id)"
                >{{ t(goal.labelKey) }}</div>
              </div>
            </div>
            <div class="form-row" style="margin-top:8px;">
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.goalDurationLabel') }}</label>
                <select class="form-select" v-model="formGoalDuration">
                  <option v-for="n in GOAL_DURATION_OPTIONS" :key="n" :value="n">{{ t('profile.info.minutesUnit', { n }) }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('profile.info.reminderLabel') }}</label>
                <input type="time" class="form-input" v-model="formReminderTime">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;">
              <button class="btn-primary" @click="saveGoals">{{ savingGoals ? t('profile.info.saving') : t('profile.info.saveGoals') }}</button>
            </div>
          </div>
        </div>

        <!-- TAB: BADGES -->
        <div class="tab-panel" :class="{ active: activeTab === 'badges' }">
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.badges.earnedTitle', { earned: achievements?.summary?.badges_earned || 0, total: achievements?.summary?.badges_total || 0 }) }}</div>
            <div class="badges-grid">
              <template v-if="badgesList.length">
                <div v-for="(badge, idx) in badgesList" :key="idx" class="badge-item" :class="badge.earned ? 'earned' : 'locked'">
                  <div class="bi-icon">{{ badge.icon || '🏅' }}</div>
                  <div class="bi-name">{{ badge.name }}</div>
                  <div class="bi-desc">{{ badge.earned ? (badge.earned_at ? t('profile.badges.earnedOn', { date: formatDate(badge.earned_at) }) : t('profile.badges.earned')) : t('profile.badges.progress', { current: badge.current_value, target: badge.target_value }) }}</div>
                </div>
              </template>
              <div v-else style="grid-column:1/-1;color:var(--text-secondary);">{{ t('profile.badges.noBadges') }}</div>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.badges.levelProgressTitle') }}</div>
            <div>
              <div
                v-for="level in levelsList"
                :key="level.level"
                style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px dashed var(--kraft-light);"
              >
                <div
                  style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;"
                  :style="{
                    border: '2px solid ' + (level.is_current ? 'var(--mint-dark)' : level.is_completed ? 'var(--gold)' : 'var(--kraft-light)'),
                    background: level.is_current ? 'var(--mint-light)' : level.is_completed ? 'var(--gold-light)' : 'var(--cream)'
                  }"
                >{{ level.is_completed ? '✓' : level.level }}</div>
                <div style="flex:1;">
                  <div style="font-size:0.86rem;font-weight:800;">{{ t('profile.badges.levelLabel', { level: level.level, title: level.title }) }}</div>
                  <div style="font-size:0.72rem;color:var(--text-secondary);margin:4px 0 6px;">
                    {{ Number.isFinite(level.maxXP) ? t('profile.badges.xpRange', { min: level.minXP, max: level.maxXP }) : t('profile.badges.xpMinPlus', { min: level.minXP }) }}
                  </div>
                  <div class="ph-xp-bar" style="height:8px;">
                    <div class="ph-xp-fill" :style="{ width: level.progress_percent + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: ACTIVITY -->
        <div class="tab-panel" :class="{ active: activeTab === 'activity' }">
          <div class="stats-grid-4" style="margin-bottom:16px;">
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.tasks }}</div>
              <div class="sb-label">{{ t('profile.activity.tasksCompleted') }}</div>
            </div>
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.journals }}</div>
              <div class="sb-label">{{ t('profile.activity.journalEntries') }}</div>
            </div>
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.assessments }}</div>
              <div class="sb-label">{{ t('profile.activity.assessments') }}</div>
            </div>
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.streak }} 🔥</div>
              <div class="sb-label">{{ t('profile.activity.currentStreak') }}</div>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.activity.recentActivityTitle') }}</div>
            <div class="activity-timeline">
              <template v-if="activityTimeline.length">
                <div v-for="(item, idx) in activityTimeline" :key="idx" style="display:flex;gap:10px;padding:12px 0;border-bottom:1px dashed var(--kraft-light);">
                  <div style="width:34px;height:34px;border-radius:12px;background:var(--cream);border:1.5px solid var(--kraft-light);display:flex;align-items:center;justify-content:center;">
                    {{ item.type === 'task' ? '🧩' : item.type === 'journal' ? '📝' : '📊' }}
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:0.8rem;font-weight:800;">{{ item.title }}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">{{ item.meta }}</div>
                  </div>
                  <div style="font-size:0.68rem;color:var(--text-light);white-space:nowrap;">{{ formatRelativeDate(item.date) }}</div>
                </div>
              </template>
              <div v-else style="color:var(--text-secondary);">{{ t('profile.activity.noActivity') }}</div>
            </div>
          </div>
        </div>

        <!-- TAB: SETTINGS -->
        <div class="tab-panel" :class="{ active: activeTab === 'settings' }">
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.settings.notifTitle') }}</div>
            <div>
              <div v-for="row in notifRows" :key="row.key" class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ row.title }}</div>
                  <div class="tr-desc">{{ row.desc }}</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="localSettings[row.key]">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.settings.languageDisplayTitle') }}</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('profile.settings.languageLabel') }}</label>
                <LanguageSwitcher />
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('profile.settings.themeLabel') }}</label>
                <select class="form-select">
                  <option selected>{{ t('profile.settings.themeLight') }}</option>
                  <option>{{ t('profile.settings.themeDark') }}</option>
                </select>
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('profile.settings.animationTitle') }}</div>
                <div class="tr-desc">{{ t('profile.settings.animationDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('profile.settings.soundTitle') }}</div>
                <div class="tr-desc">{{ t('profile.settings.soundDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px;">
              <button class="btn-primary" @click="saveSettings">{{ t('profile.settings.saveSettings') }}</button>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.settings.devicesTitle') }}</div>
            <div>
              <div style="padding:10px 0;border-bottom:1px dashed var(--kraft-light);">
                <div style="font-size:0.8rem;font-weight:800;">{{ t('profile.settings.currentBrowser') }}</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);">{{ t('profile.settings.currentBrowserDesc') }}</div>
              </div>
              <div style="padding-top:10px;font-size:0.74rem;color:var(--text-light);">
                {{ t('profile.settings.devicesNote') }}
              </div>
            </div>
            <button class="btn-outline" style="margin-top:8px;" @click="showToast(t('profile.settings.deviceComingSoon'))">{{ t('profile.settings.connectNewDevice') }}</button>
          </div>
        </div>

        <!-- TAB: PRIVACY -->
        <div class="tab-panel" :class="{ active: activeTab === 'privacy' }">
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.privacy.securityTitle') }}</div>
            <div class="form-group">
              <label class="form-label">{{ t('profile.privacy.currentPassword') }}</label>
              <input type="password" class="form-input" placeholder="••••••••">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('profile.privacy.newPassword') }}</label>
                <input type="password" class="form-input" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('profile.privacy.confirmPassword') }}</label>
                <input type="password" class="form-input" placeholder="••••••••">
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">{{ t('profile.privacy.twoFaTitle') }}</div>
                <div class="tr-desc">{{ t('profile.privacy.twoFaDesc') }}</div>
              </div>
              <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px;">
              <button class="btn-primary" @click="savePassword">{{ t('profile.privacy.updatePassword') }}</button>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.privacy.dataPrivacyTitle') }}</div>
            <div>
              <div v-for="row in privacyRows" :key="row.key" class="toggle-row">
                <div class="tr-left">
                  <div class="tr-title">{{ row.title }}</div>
                  <div class="tr-desc">{{ row.desc }}</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="localSettings[row.key]">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">{{ t('profile.privacy.exportTitle') }}</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.6;">
              {{ t('profile.privacy.exportDesc') }}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn-outline" @click="exportData('json')">{{ t('profile.privacy.exportJson') }}</button>
              <button class="btn-outline" @click="exportData('pdf')">{{ t('profile.privacy.exportPdf') }}</button>
            </div>
          </div>
          <div class="paper-card danger-zone">
            <div class="dz-title">{{ t('profile.privacy.dangerZoneTitle') }}</div>
            <div class="dz-item">
              <div>
                <div class="dz-text">{{ t('profile.privacy.deleteDataTitle') }}</div>
                <div class="dz-sub">{{ t('profile.privacy.deleteDataDesc') }}</div>
              </div>
              <button
                class="btn-danger"
                @click="confirmAction('deleteData', '🗑️', t('profile.privacy.deleteDataConfirmTitle'), t('profile.privacy.deleteDataConfirmMsg'))"
              >{{ t('profile.privacy.deleteDataBtn') }}</button>
            </div>
            <div class="dz-item">
              <div>
                <div class="dz-text">{{ t('profile.privacy.deleteAccountTitle') }}</div>
                <div class="dz-sub">{{ t('profile.privacy.deleteAccountDesc') }}</div>
              </div>
              <button
                class="btn-danger"
                @click="confirmAction('deleteAccount', '💔', t('profile.privacy.deleteAccountConfirmTitle'), t('profile.privacy.deleteAccountConfirmMsg'))"
              >{{ t('profile.privacy.deleteAccountBtn') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDEBAR -->
      <div>
        <!-- Streak & XP -->
        <div class="paper-card right-card">
          <div class="rc-title">{{ t('profile.sidebar.streakTitle') }}</div>
          <div class="streak-display">
            <div class="sd-num">{{ streakCard.streak }} 🔥</div>
            <div class="sd-label">{{ t('profile.sidebar.daysInARow') }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="text-align:center;padding:8px;background:var(--cream);border-radius:var(--border-radius-sm);border:1.5px solid var(--kraft-light);">
              <div style="font-size:1rem;font-weight:800;color:var(--mint-dark);">{{ streakCard.totalXp }}</div>
              <div style="font-size:0.62rem;color:var(--text-secondary);">{{ t('profile.sidebar.totalXp') }}</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--cream);border-radius:var(--border-radius-sm);border:1.5px solid var(--kraft-light);">
              <div style="font-size:1rem;font-weight:800;color:var(--lavender);">Level {{ streakCard.level }}</div>
              <div style="font-size:0.62rem;color:var(--text-secondary);">{{ t('profile.sidebar.level') }}</div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="paper-card right-card">
          <div class="rc-title">{{ t('profile.sidebar.quickLinksTitle') }}</div>
          <router-link to="/dashboard" class="quick-link"><span class="ql-icon">🏡</span><span class="ql-text">{{ t('profile.sidebar.dashboard') }}</span><span class="ql-arrow">›</span></router-link>
          <router-link to="/journal" class="quick-link"><span class="ql-icon">📝</span><span class="ql-text">{{ t('profile.sidebar.journal') }}</span><span class="ql-arrow">›</span></router-link>
          <router-link to="/mood-assessment" class="quick-link"><span class="ql-icon">📊</span><span class="ql-text">{{ t('profile.sidebar.moodCheck') }}</span><span class="ql-arrow">›</span></router-link>
          <router-link to="/experts" class="quick-link"><span class="ql-icon">🩺</span><span class="ql-text">{{ t('profile.sidebar.experts') }}</span><span class="ql-arrow">›</span></router-link>
        </div>

        <!-- PeaceCat Tip -->
        <div class="paper-card right-card">
          <div style="display:flex;gap:8px;align-items:flex-start;">
            <span style="font-size:1.2rem;">🐱</span>
            <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">{{ tipCardText }}</div>
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
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { EventLogger } from '../lib/eventLogger';
import { useAuthStore } from '../stores/auth';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';

const { t, locale } = useI18n();
const auth = useAuthStore();
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

const AVATARS = ['🐱', '🌱', '🌿', '🧘', '🌤️', '🌙', '💚', '🦋', '🍀', '☁️', '🌸', '⭐'];
const LOCAL_SETTINGS_KEY = 'peaceflow_profile_settings';

// id = giá trị lưu vào onboarding_answers.ageGroup (backend không so khớp text, chỉ lưu opaque JSON,
// nên an toàn để đổi từ chuỗi tiếng Việt sang mã cố định). Dữ liệu cũ dạng "25-34 tuổi" được
// quy đổi sang mã mới trong normalizeAgeGroup() khi load.
const AGE_OPTIONS = [
  { id: '16-24', labelKey: 'profile.ageOptions.a1624' },
  { id: '25-34', labelKey: 'profile.ageOptions.a2534' },
  { id: '35-44', labelKey: 'profile.ageOptions.a3544' },
  { id: '45+', labelKey: 'profile.ageOptions.a45plus' }
];
const LEGACY_AGE_MAP = {
  '16-24 tuổi': '16-24',
  '25-34 tuổi': '25-34',
  '35-44 tuổi': '35-44',
  '45+ tuổi': '45+'
};
function normalizeAgeGroup(value) {
  if (!value) return '25-34';
  if (AGE_OPTIONS.some((opt) => opt.id === value)) return value;
  return LEGACY_AGE_MAP[value] || '25-34';
}

// id giữ nguyên các giá trị tiếng Việt cũ ('Nam'/'Nữ'/...) vì mapGenderToDisplay/mapDisplayToGender
// bên dưới đã dùng đúng các chuỗi này làm input/output — chỉ đổi CHỮ HIỂN THỊ (labelKey), không đổi id.
const GENDER_OPTIONS = [
  { id: 'Nữ', labelKey: 'profile.genderOptions.female' },
  { id: 'Nam', labelKey: 'profile.genderOptions.male' },
  { id: 'Khác', labelKey: 'profile.genderOptions.other' },
  { id: 'Không muốn tiết lộ', labelKey: 'profile.genderOptions.preferNot' }
];

const GOAL_DURATION_OPTIONS = [5, 10, 15, 20, 30];

// id = giá trị lưu vào profile.goals trên backend (không có logic so khớp theo text ở backend,
// chỉ lưu mảng opaque). Dữ liệu cũ (chuỗi tiếng Việt) được quy đổi sang id mới trong renderGoals().
const GOAL_OPTIONS = [
  { id: 'reduce_anxiety', labelKey: 'profile.goalOptions.reduceAnxiety' },
  { id: 'improve_sleep', labelKey: 'profile.goalOptions.improveSleep' },
  { id: 'boost_health', labelKey: 'profile.goalOptions.boostHealth' },
  { id: 'boost_focus', labelKey: 'profile.goalOptions.boostFocus' },
  { id: 'reduce_work_stress', labelKey: 'profile.goalOptions.reduceWorkStress' },
  { id: 'improve_relationships', labelKey: 'profile.goalOptions.improveRelationships' },
  { id: 'self_growth', labelKey: 'profile.goalOptions.selfGrowth' }
];
const LEGACY_GOAL_MAP = {
  '😌 Giảm lo âu': 'reduce_anxiety',
  '😴 Cải thiện giấc ngủ': 'improve_sleep',
  '💪 Tăng cường sức khỏe': 'boost_health',
  '🎯 Tăng tập trung': 'boost_focus',
  '💼 Giảm stress công việc': 'reduce_work_stress',
  '❤️ Cải thiện mối quan hệ': 'improve_relationships',
  '🌱 Phát triển bản thân': 'self_growth'
};
function normalizeGoal(value) {
  if (GOAL_OPTIONS.some((opt) => opt.id === value)) return value;
  return LEGACY_GOAL_MAP[value] || null;
}

function loadLocalSettings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function mapGenderToDisplay(value) {
  if (value === 'male') return 'Nam';
  if (value === 'female') return 'Nữ';
  if (value === 'other') return 'Khác';
  return 'Không muốn tiết lộ';
}

function mapDisplayToGender(value) {
  if (value === 'Nam') return 'male';
  if (value === 'Nữ') return 'female';
  if (value === 'Khác') return 'other';
  return 'prefer_not_to_say';
}

function formatDate(value) {
  if (!value) return t('profile.hero.defaultJoinDate');
  return new Intl.DateTimeFormat(intlLocale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  if (!value) return t('profile.activity.noActivity');
  const target = new Date(value);
  const diff = Math.floor((Date.now() - target.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return t('profile.activity.today');
  if (diff === 1) return t('profile.activity.oneDayAgo');
  return t('profile.activity.daysAgo', { n: diff });
}

const user = ref(null);
const profile = ref(null);
const progress = ref(null);
const achievements = ref(null);
const report = ref(null);
const activeTab = ref('info');
const selectedAvatar = ref('🐱');
const selectedGoals = ref([]);
const localSettings = reactive(loadLocalSettings());

const formDisplayName = ref('');
const formNickname = ref('');
const formEmail = ref('');
const formPhone = ref('');
const formAgeGroup = ref('25-34');
const formGender = ref('Không muốn tiết lộ');
const formTagline = ref('');
const formBio = ref('');
const formGoalDuration = ref(10);
const formReminderTime = ref('08:00');

const savingProfile = ref(false);
const savingGoals = ref(false);

const toastVisible = ref(false);
const toastText = ref('');
let toastTimer = null;

// Backend hardcode title cấp độ bằng tiếng Việt (progress.routes.js LEVELS), trùng đúng 5 mốc
// XP với dashboard.levels.l1..l5 — nên bỏ qua `title` backend trả, tự dịch lại theo `level`
// (số nguyên, không đổi theo ngôn ngữ) giống cách DashboardView.vue đã làm với radar/garden.
function translateLevelTitle(level) {
  const key = `dashboard.levels.l${level}`;
  const translated = t(key);
  return translated === key ? t('dashboard.levels.defaultTitle') : translated;
}

function getLevelInfo() {
  return achievements.value?.progress?.level_info || {
    level: 1,
    progress_percent: 0,
    xp_to_next: 100,
    maxXP: 100
  };
}

function getDisplayName() {
  const onboarding = profile.value?.onboarding_answers || {};
  return user.value?.display_name || onboarding.nickname || user.value?.full_name || t('profile.hero.defaultUserName');
}

function getAvatarEmoji() {
  return selectedAvatar.value || profile.value?.onboarding_answers?.avatar_emoji || '🐱';
}

// Computed thay vì gán ref một lần trong renderHero() — đảm bảo hero card cập nhật ngay khi
// đổi ngôn ngữ, không bị kẹt lại bản dịch cũ (lỗi reactive-gap đã gặp nhiều lần ở các file khác).
const heroAvatar = computed(() => getAvatarEmoji());
const heroName = computed(() => getDisplayName());
const heroTaglineText = computed(() => `"${formTagline.value || t('profile.hero.defaultTagline')}"`);
const heroJoinDate = computed(() => formatDate(user.value?.created_at));
const heroLocation = computed(() => [user.value?.city, user.value?.country].filter(Boolean).join(', ') || t('profile.hero.defaultLocation'));
const heroStreak = computed(() => progress.value?.current_streak || 0);

const heroLevelInfo = computed(() => getLevelInfo());
const heroCurrentLevel = computed(() => progress.value?.current_level || heroLevelInfo.value.level || 1);
const heroLevelBadgeText = computed(() => t('profile.hero.levelBadge', {
  level: heroCurrentLevel.value,
  title: translateLevelTitle(heroLevelInfo.value.level || heroCurrentLevel.value)
}));

const heroXpLeft = computed(() => {
  const totalXp = progress.value?.total_xp || 0;
  const maxXP = heroLevelInfo.value.maxXP;
  if (!Number.isFinite(maxXP) && maxXP === totalXp) return t('profile.hero.xpMax', { xp: totalXp });
  return t('profile.hero.xp', { xp: totalXp });
});
const heroXpRight = computed(() => {
  const info = heroLevelInfo.value;
  return info.xp_to_next > 0
    ? t('profile.hero.xpToNext', { n: info.xp_to_next, level: heroCurrentLevel.value + 1 })
    : t('profile.hero.atMax');
});
const heroXpFillPct = computed(() => heroLevelInfo.value.progress_percent || 0);

function syncStoredUser() {
  if (!user.value) return;
  localStorage.setItem('user', JSON.stringify(user.value));
  auth.user = user.value;
  window.dispatchEvent(new Event('user-profile-updated'));
}

function showToast(message, type = 'success') {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 2600);
}

function renderForm() {
  const onboarding = profile.value?.onboarding_answers || {};
  const support = profile.value?.support_preferences || {};

  formDisplayName.value = user.value?.display_name || user.value?.full_name || '';
  formNickname.value = onboarding.nickname || '';
  formEmail.value = user.value?.email || '';
  formPhone.value = user.value?.phone || '';
  formAgeGroup.value = normalizeAgeGroup(onboarding.ageGroup);
  formGender.value = mapGenderToDisplay(user.value?.gender);
  formTagline.value = onboarding.tagline || '';
  formBio.value = onboarding.bio || '';
  formGoalDuration.value = Number(support.goal_duration_minutes) || 10;
  formReminderTime.value = support.reminder_time || '08:00';
}

function renderGoals() {
  const goals = Array.isArray(profile.value?.goals) ? profile.value.goals : [];
  selectedGoals.value = [...new Set(goals.map(normalizeGoal).filter(Boolean))];
}

const badgesList = computed(() => achievements.value?.badges || []);
// Backend trả `title` tiếng Việt cứng cho từng cấp — bỏ qua, tự dịch lại theo `level`
// (xem translateLevelTitle ở trên), giữ nguyên các cờ trạng thái (is_current/is_completed/...).
const levelsList = computed(() => (achievements.value?.levels || []).map((level) => ({
  ...level,
  title: translateLevelTitle(level.level)
})));

const activityStats = computed(() => ({
  tasks: report.value?.task_history?.length || 0,
  journals: report.value?.journal_history?.length || 0,
  assessments: report.value?.assessments?.length || 0,
  streak: progress.value?.current_streak || 0
}));

const activityTimeline = computed(() => {
  // item.title (task/assessment tên) là nội dung động từ backend — ngoài phạm vi dịch UI tĩnh,
  // giữ nguyên; chỉ dịch phần "meta" (nhãn tĩnh do frontend tự ghép).
  const timeline = [
    ...(report.value?.task_history || []).slice(0, 6).map((item) => ({
      type: 'task',
      date: item.created_at,
      title: item.title,
      meta: t('profile.activity.taskXpMeta', { n: item.xp_earned || 0, category: item.category || t('profile.activity.taskCategoryDefault') })
    })),
    ...(report.value?.journal_history || []).slice(0, 6).map((item) => ({
      type: 'journal',
      date: item.created_at,
      title: item.title || t('profile.activity.journalDefaultTitle'),
      meta: t('profile.activity.journalMeta')
    })),
    ...(report.value?.assessments || []).slice(0, 6).map((item) => ({
      type: 'assessment',
      date: item.created_at,
      title: item.name,
      meta: t('profile.activity.assessmentMeta', { status: item.severity || t('profile.activity.assessmentStatusDefault'), score: item.total_score || 0 })
    }))
  ].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 8);
  return timeline;
});

const notifRows = computed(() => [
  { key: 'moodReminder', title: t('profile.notifRows.moodReminder.title'), desc: t('profile.notifRows.moodReminder.desc') },
  { key: 'journalReminder', title: t('profile.notifRows.journalReminder.title'), desc: t('profile.notifRows.journalReminder.desc') },
  { key: 'badgeAlerts', title: t('profile.notifRows.badgeAlerts.title'), desc: t('profile.notifRows.badgeAlerts.desc') }
]);

const privacyRows = computed(() => [
  { key: 'hideCommunity', title: t('profile.privacyRows.hideCommunity.title'), desc: t('profile.privacyRows.hideCommunity.desc') },
  { key: 'hideAchievements', title: t('profile.privacyRows.hideAchievements.title'), desc: t('profile.privacyRows.hideAchievements.desc') }
]);

if (localSettings.moodReminder === undefined) localSettings.moodReminder = true;
if (localSettings.journalReminder === undefined) localSettings.journalReminder = false;
if (localSettings.badgeAlerts === undefined) localSettings.badgeAlerts = true;
if (localSettings.hideCommunity === undefined) localSettings.hideCommunity = true;
if (localSettings.hideAchievements === undefined) localSettings.hideAchievements = false;

const streakCard = computed(() => ({
  totalXp: progress.value?.total_xp || 0,
  level: progress.value?.current_level || 1,
  streak: progress.value?.current_streak || 0
}));

const tipCardText = computed(() => {
  const nextBadge = achievements.value?.next_badge;
  return nextBadge
    ? t('profile.sidebar.tipWithBadge', { badge: nextBadge.name, current: nextBadge.current_value, target: nextBadge.target_value })
    : t('profile.sidebar.tipDefault');
});

async function loadData() {
  const [userData, profileData, progressData, achievementsData, reportData] = await Promise.all([
    apiClient.get('/me'),
    apiClient.get('/profile'),
    apiClient.get('/progress'),
    apiClient.get('/achievements'),
    apiClient.get('/reports/detail')
  ]);

  user.value = userData;
  profile.value = profileData || {};
  progress.value = progressData || {};
  achievements.value = achievementsData || {};
  report.value = reportData || {};
  selectedAvatar.value = profile.value?.onboarding_answers?.avatar_emoji || '🐱';
  syncStoredUser();
}

function renderPage() {
  renderForm();
  renderGoals();
}

async function saveProfile() {
  EventLogger.log('profile', 'save:attempt');
  savingProfile.value = true;

  try {
    const onboardingAnswers = {
      ...(profile.value?.onboarding_answers || {}),
      nickname: formNickname.value?.trim() || '',
      tagline: formTagline.value?.trim() || '',
      bio: formBio.value?.trim() || '',
      ageGroup: formAgeGroup.value || '',
      avatar_emoji: selectedAvatar.value
    };

    const [userData, profileData] = await Promise.all([
      apiClient.put('/me', {
        display_name: formDisplayName.value?.trim() || null,
        phone: formPhone.value?.trim() || null,
        gender: mapDisplayToGender(formGender.value || '')
      }),
      apiClient.put('/profile', {
        onboarding_answers: onboardingAnswers
      })
    ]);

    user.value = userData;
    profile.value = profileData;
    syncStoredUser();
    EventLogger.log('profile', 'save:success');
    renderPage();
    showToast(t('profile.toast.profileSaved'));
  } catch (error) {
    EventLogger.error('profile', 'save:failed', error);
    console.error('Profile save failed:', error);
    showToast(t('profile.toast.profileSaveFailed'), 'error');
  } finally {
    savingProfile.value = false;
  }
}

async function saveGoals() {
  EventLogger.log('profile', 'goals:save:attempt');
  savingGoals.value = true;

  try {
    const profileData = await apiClient.put('/profile', {
      goals: [...selectedGoals.value],
      support_preferences: {
        goal_duration_minutes: Number(formGoalDuration.value) || 10,
        reminder_time: formReminderTime.value || '08:00'
      }
    });

    profile.value = profileData;
    EventLogger.log('profile', 'goals:save:success');
    renderPage();
    showToast(t('profile.toast.goalsSaved'));
  } catch (error) {
    EventLogger.error('profile', 'goals:save:failed', error);
    console.error('Goals save failed:', error);
    showToast(t('profile.toast.goalsSaveFailed'), 'error');
  } finally {
    savingGoals.value = false;
  }
}

function resetForm() {
  renderForm();
  renderGoals();
  showToast(t('profile.toast.formReset'), 'info');
}

function toggleGoal(id) {
  const wasSelected = selectedGoals.value.includes(id);
  EventLogger.log('profile', 'goal:toggle');
  if (wasSelected) {
    selectedGoals.value = selectedGoals.value.filter((goal) => goal !== id);
  } else {
    selectedGoals.value = [...selectedGoals.value, id];
  }
}

function switchTab(tab) {
  EventLogger.log('profile', 'tab:switch');
  activeTab.value = tab;
}

function saveSettings() {
  EventLogger.log('profile', 'settings:save:local');
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify({ ...localSettings }));
  showToast(t('profile.toast.settingsSaved'), 'info');
}

function savePassword() {
  showToast(t('profile.toast.passwordNotSupported'), 'info');
}

function exportData(format) {
  EventLogger.log('profile', 'data:export');
  if (format === 'json') {
    const payload = {
      user: user.value,
      profile: profile.value,
      progress: progress.value,
      achievements: {
        summary: achievements.value?.summary,
        recent_badges: achievements.value?.recent_badges
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'peaceflow-profile-export.json';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(t('profile.toast.dataExported'));
    return;
  }

  showToast(t('profile.toast.pdfNotSupported'), 'info');
}

function confirmAction(action, _icon, title, message) {
  const confirmed = window.confirm(`${title}\n\n${message}`);
  if (!confirmed) return;
  showToast(t('profile.toast.actionNotSupported', { action }), 'info');
}

function selectAvatar(avatar) {
  EventLogger.log('profile', 'avatar:select');
  selectedAvatar.value = avatar;
}

onMounted(async () => {
  try {
    await loadData();
    renderPage();
  } catch (error) {
    console.error('Profile init failed:', error);
    showToast(t('profile.toast.loadFailed'), 'error');
  }
});
</script>

<style scoped src="../assets/profile.css"></style>
