<template>
  <div class="achievements-page">
    <div class="confetti-container"></div>

    <!-- Badge Detail Modal -->
    <div class="modal-overlay" :class="{ show: activeBadge }" @click="closeBadgeModal">
      <div v-if="activeBadge" class="badge-modal">
        <button class="bm-close" @click="activeBadge = null">✕</button>
        <span class="bm-icon">{{ activeBadge.icon || '🏅' }}</span>
        <div class="bm-name">{{ activeBadge.name || t('achievements.badgeModal.defaultName') }}</div>
        <div class="bm-desc">{{ activeBadge.description || t('achievements.badgeModal.defaultDesc') }}</div>
        <div class="bm-condition">{{ activeBadge.condition || t('achievements.badgeModal.defaultCondition') }}</div>
        <div class="bm-earned-date">
          {{ activeBadge.earned
            ? (activeBadge.earned_at ? t('achievements.badgeModal.earnedOnDate', { date: formatDate(activeBadge.earned_at) }) : t('achievements.badgeModal.earnedNoDate'))
            : t('achievements.badgeModal.progressLabel', { current: activeBadge.current_value, target: activeBadge.target_value }) }}
        </div>
        <div style="margin-top:14px;">
          <button class="btn-primary" style="width:100%;justify-content:center;" @click="activeBadge = null">{{ t('achievements.badgeModal.closeBtn') }}</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" v-if="data">
      <div class="breadcrumb">
        <router-link to="/dashboard">{{ t('achievements.breadcrumbDashboard') }}</router-link><span>›</span>
        <span>{{ t('achievements.breadcrumbCurrent') }}</span>
      </div>

      <!-- Hero Banner -->
      <div class="paper-card hero-banner">
        <div class="hb-deco">🏆</div>
        <div class="hb-deco2">🌟</div>
        <div class="hb-content">
          <div class="hb-avatar" :style="heroAvatarStyle">{{ heroAvatarText }}</div>
          <div class="hb-info">
            <div class="hb-name">{{ userName }} — {{ getLevelTitle(levelInfo) }}</div>
            <div class="hb-level">{{ t('achievements.hero.levelLine', { level: data.progress.current_level, title: getLevelTitle(levelInfo) }) }}</div>
            <div class="hb-xp-wrap">
              <div class="hb-xp-label">
                <span>{{ xpCurrent }} / {{ xpTargetLabel }} XP</span>
                <span>{{ xpLeft > 0 ? t('achievements.hero.xpLeft', { n: xpLeft, level: data.progress.current_level + 1 }) : t('achievements.hero.atMaxLevel') }}</span>
              </div>
              <div class="hb-xp-bar"><div class="hb-xp-fill" :style="{ width: (levelInfo.progress_percent || 0) + '%' }"></div></div>
            </div>
            <div class="hb-stats">
              <div class="hb-stat"><div class="hb-stat-num">{{ data.summary.badges_earned || 0 }}</div><div class="hb-stat-label">{{ t('achievements.hero.badgesEarnedLabel') }}</div></div>
              <div class="hb-stat"><div class="hb-stat-num">{{ data.summary.completed_tasks || 0 }}</div><div class="hb-stat-label">{{ t('achievements.hero.tasksCompletedLabel') }}</div></div>
              <div class="hb-stat"><div class="hb-stat-num">{{ data.summary.current_streak || 0 }}🔥</div><div class="hb-stat-label">{{ t('achievements.hero.streakDaysLabel') }}</div></div>
              <div class="hb-stat"><div class="hb-stat-num">{{ completedChallengesCount }}/{{ data.challenges.length }}</div><div class="hb-stat-label">{{ t('achievements.hero.challengesLabel') }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="view-tabs">
        <div class="view-tab" :class="{ active: activeTab === 'badges' }" @click="activeTab = 'badges'">{{ t('achievements.tabs.badges') }}</div>
        <div class="view-tab" :class="{ active: activeTab === 'levels' }" @click="activeTab = 'levels'">{{ t('achievements.tabs.levels') }}</div>
        <div class="view-tab" :class="{ active: activeTab === 'streak' }" @click="activeTab = 'streak'">{{ t('achievements.tabs.streak') }}</div>
        <div class="view-tab" :class="{ active: activeTab === 'challenges' }" @click="activeTab = 'challenges'">{{ t('achievements.tabs.challenges') }}</div>
        <div class="view-tab" :class="{ active: activeTab === 'hof' }" @click="activeTab = 'hof'">{{ t('achievements.tabs.hof') }}</div>
      </div>

      <div class="achievements-layout">
        <!-- LEFT: Main Content -->
        <div>
          <!-- TAB: BADGES -->
          <div class="tab-panel" :class="{ active: activeTab === 'badges' }">
            <div class="badge-filter">
              <button
                v-for="filter in badgeFilterOptions"
                :key="filter"
                type="button"
                class="bf-btn"
                :class="{ active: activeFilter === filter }"
                @click="activeFilter = filter"
              >{{ filterLabel(filter) }}</button>
            </div>
            <div class="badge-grid">
              <div v-if="!filteredBadges.length" class="paper-card" style="padding:20px;grid-column:1/-1;text-align:center;color:var(--text-secondary);">
                {{ t('achievements.badges.noneForFilter') }}
              </div>
              <article
                v-for="badge in filteredBadges"
                :key="badge.code"
                class="paper-card badge-card"
                :class="[badge.earned ? 'earned' : 'locked', { 'new-badge': badge.is_new }]"
                role="button"
                tabindex="0"
                @click="activeBadge = badge"
                @keydown.enter.prevent="activeBadge = badge"
                @keydown.space.prevent="activeBadge = badge"
              >
                <span v-if="badge.earned" class="earned-stamp">✓</span>
                <span class="bc-icon" :class="{ 'locked-icon': !badge.earned }">{{ badge.icon }}</span>
                <div class="bc-name">{{ badge.name }}</div>
                <div class="bc-desc">{{ badge.description || '' }}</div>
                <template v-if="badge.earned">
                  <div class="bc-date">{{ badge.earned_at ? t('achievements.badges.earnedOnDate', { date: formatDate(badge.earned_at) }) : t('achievements.badges.earnedNoDate') }}</div>
                </template>
                <template v-else>
                  <div class="bc-locked-hint">{{ badge.condition }}</div>
                  <div class="bc-progress"><div class="bc-progress-fill" :style="{ width: badge.progress_percent + '%' }"></div></div>
                  <div class="bc-progress-label">{{ badge.current_value }} / {{ badge.target_value }}</div>
                </template>
              </article>
            </div>
          </div>

          <!-- TAB: LEVELS -->
          <div class="tab-panel" :class="{ active: activeTab === 'levels' }">
            <div class="paper-card" style="padding:20px;">
              <div style="font-size:0.92rem;font-weight:800;margin-bottom:16px;padding-bottom:8px;border-bottom:2px dashed var(--kraft-light);">{{ t('achievements.levels.title') }}</div>
              <div class="level-roadmap">
                <div v-for="level in data.levels" :key="level.level" class="level-item">
                  <div class="li-circle" :class="{ done: level.is_completed, current: level.is_current, locked: level.is_locked }">
                    {{ level.is_completed ? '✓' : level.level }}
                  </div>
                  <div class="li-content">
                    <div class="li-header">
                      <div class="li-level">{{ t('achievements.levels.levelLine', { level: level.level, title: translateLevelTitle(level.level) }) }}</div>
                      <div class="li-badge" :class="level.is_current ? 'lb-current' : level.is_completed ? 'lb-done' : 'lb-locked'">
                        {{ level.is_current ? t('achievements.levels.currentLabel') : level.is_completed ? t('achievements.levels.doneLabel') : t('achievements.levels.lockedLabel') }}
                      </div>
                    </div>
                    <div style="font-size:0.74rem;color:var(--text-secondary);margin-bottom:6px;">
                      {{ Number.isFinite(level.maxXP) ? t('achievements.levels.xpRange', { min: level.minXP, max: level.maxXP }) : t('achievements.levels.xpMinPlus', { min: level.minXP }) }}
                    </div>
                    <div class="bc-progress"><div class="bc-progress-fill" :style="{ width: level.progress_percent + '%' }"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: STREAK -->
          <div class="tab-panel" :class="{ active: activeTab === 'streak' }">
            <div class="paper-card streak-hero">
              <div class="sh-top">
                <span class="sh-flame">🔥</span>
                <div>
                  <div class="sh-num">{{ t('achievements.streak.daysUnit', { n: data.streak.current }) }}</div>
                  <div class="sh-label">{{ t('achievements.streak.currentLabel') }}</div>
                  <div class="sh-record">{{ t('achievements.streak.recordLabel', { n: data.streak.longest }) }}</div>
                </div>
              </div>
              <div style="font-size:0.78rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">{{ data.streak.month_label }}</div>
              <div class="streak-calendar">
                <div v-for="d in streakWeekdayLabels" :key="d" class="sc-day-h">{{ d }}</div>
                <div v-for="(day, idx) in data.streak.calendar" :key="idx" class="sc-day" :class="day.state">{{ day.label }}</div>
              </div>
              <div style="display:flex;gap:12px;margin-top:8px;font-size:0.65rem;color:var(--text-light);flex-wrap:wrap;">
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--mint-dark);display:inline-block;"></span>{{ t('achievements.streak.legendDone') }}</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:rgba(255,139,139,0.3);display:inline-block;"></span>{{ t('achievements.streak.legendMissed') }}</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--mint-light);border:1.5px solid var(--mint-dark);display:inline-block;"></span>{{ t('achievements.streak.legendToday') }}</span>
              </div>
            </div>
            <div class="paper-card" style="padding:18px;">
              <div style="font-size:0.88rem;font-weight:700;margin-bottom:12px;">{{ t('achievements.streak.statsTitle') }}</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                <div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius-sm);border:1.5px solid var(--kraft-light);">
                  <div style="font-size:1.3rem;font-weight:800;color:var(--peach-dark);">{{ data.streak.current }}🔥</div>
                  <div style="font-size:0.62rem;color:var(--text-secondary);">{{ t('achievements.streak.currentStreakLabel') }}</div>
                </div>
                <div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius-sm);border:1.5px solid var(--kraft-light);">
                  <div style="font-size:1.3rem;font-weight:800;color:var(--gold);">{{ data.streak.longest }}🏆</div>
                  <div style="font-size:0.62rem;color:var(--text-secondary);">{{ t('achievements.streak.recordShort') }}</div>
                </div>
                <div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius-sm);border:1.5px solid var(--kraft-light);">
                  <div style="font-size:1.3rem;font-weight:800;color:var(--mint-dark);">{{ data.streak.active_days }}</div>
                  <div style="font-size:0.62rem;color:var(--text-secondary);">{{ t('achievements.streak.totalActiveDaysLabel') }}</div>
                </div>
              </div>
              <div style="margin-top:12px;padding:12px 14px;background:var(--mint-light);border:1.5px solid var(--mint);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--text-secondary);line-height:1.5;" v-html="t('achievements.streak.catNote', { n: data.progress.level_info?.xp_to_next || 0 })"></div>
            </div>
          </div>

          <!-- TAB: CHALLENGES -->
          <div class="tab-panel" :class="{ active: activeTab === 'challenges' }">
            <div style="font-size:0.88rem;font-weight:700;margin-bottom:12px;color:var(--text-secondary);">{{ t('achievements.challenges.sectionTitle') }}</div>
            <div>
              <div v-for="challenge in translatedChallenges" :key="challenge.code" class="paper-card challenge-card" style="padding:18px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                  <div>
                    <div style="font-size:0.95rem;font-weight:800;margin-bottom:4px;">{{ challenge.icon }} {{ challenge.title }}</div>
                    <div style="font-size:0.76rem;color:var(--text-secondary);line-height:1.5;">{{ challenge.description }}</div>
                  </div>
                  <div style="font-size:0.68rem;font-weight:800;" :style="{ color: challenge.completed ? 'var(--mint-dark)' : 'var(--text-light)' }">
                    {{ challenge.completed ? t('achievements.challenges.completedLabel') : t('achievements.challenges.progressUnit', { current: challenge.current, target: challenge.target }) }}
                  </div>
                </div>
                <div class="nb-progress" style="margin-top:12px;"><div class="nb-fill" :style="{ width: challenge.progress_percent + '%' }"></div></div>
                <div style="display:flex;justify-content:space-between;gap:12px;margin-top:6px;font-size:0.68rem;color:var(--text-secondary);">
                  <span>{{ challenge.current }} / {{ challenge.target }}</span>
                  <span>{{ challenge.reward }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: HALL OF FAME -->
          <div class="tab-panel" :class="{ active: activeTab === 'hof' }">
            <div class="paper-card" style="padding:20px;margin-bottom:16px;">
              <div style="font-size:0.92rem;font-weight:800;margin-bottom:4px;">{{ t('achievements.hof.title') }}</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:16px;">{{ t('achievements.hof.subtitle') }}</div>
              <div>
                <div v-if="!data.leaderboard.top_users.length" class="paper-card" style="padding:18px;text-align:center;color:var(--text-secondary);">{{ t('achievements.hof.noData') }}</div>
                <div
                  v-for="entry in data.leaderboard.top_users"
                  :key="entry.rank"
                  class="hof-item"
                  :class="entry.rank <= 3 ? `rank-${entry.rank}` : ''"
                  :style="entry.is_current_user ? { background: 'var(--mint-light)', border: '1.5px solid var(--mint)' } : {}"
                >
                  <div class="hof-rank">#{{ entry.rank }}</div>
                  <div class="hof-avatar" :style="entry.avatar_url ? { backgroundImage: `url('${entry.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'var(--lavender-light)' }">{{ entry.avatar_url ? '' : entry.name.charAt(0).toUpperCase() }}</div>
                  <div class="hof-info">
                    <div class="hof-name">{{ entry.name }}{{ entry.is_current_user ? t('achievements.hof.youSuffix') : '' }}</div>
                    <div class="hof-badges">
                      <span class="hof-badge-mini">Lv {{ entry.current_level }}</span>
                      <span class="hof-badge-mini">{{ entry.badges_count }} badge</span>
                      <span class="hof-badge-mini">{{ entry.current_streak }}🔥</span>
                    </div>
                  </div>
                  <div class="hof-xp">{{ entry.total_xp }} XP</div>
                </div>
              </div>
            </div>
            <div class="paper-card" style="padding:16px;">
              <template v-if="data.leaderboard.user_rank">
                <div style="font-size:0.88rem;font-weight:700;margin-bottom:10px;">{{ t('achievements.hof.positionTitle') }}</div>
                <div class="hof-item" style="background:var(--mint-light);border:1.5px solid var(--mint);">
                  <div class="hof-rank">#{{ data.leaderboard.user_rank.rank }}</div>
                  <div class="hof-avatar" style="background:var(--lavender-light);">{{ heroAvatarText }}</div>
                  <div class="hof-info">
                    <div class="hof-name">{{ userName }}</div>
                    <div class="hof-badges">
                      <span class="hof-badge-mini">Level {{ data.leaderboard.user_rank.current_level }}</span>
                      <span class="hof-badge-mini">{{ data.leaderboard.user_rank.badges_count }} badge</span>
                    </div>
                  </div>
                  <div class="hof-xp">{{ data.leaderboard.user_rank.total_xp }} XP</div>
                </div>
                <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:8px;text-align:center;">
                  {{ data.leaderboard.user_rank.total_users > 0 ? t('achievements.hof.topPercentText', { pct: Math.max(1, Math.round((data.leaderboard.user_rank.rank / data.leaderboard.user_rank.total_users) * 100)) }) : t('achievements.hof.noRankYet') }}
                </div>
              </template>
              <template v-else>
                <div style="font-size:0.88rem;font-weight:700;margin-bottom:10px;">{{ t('achievements.hof.positionTitle') }}</div>
                <div style="font-size:0.76rem;color:var(--text-secondary);text-align:center;">{{ t('achievements.hof.needMoreData') }}</div>
              </template>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div>
          <div class="paper-card next-badge-card">
            <template v-if="data.next_badge">
              <div class="rc-title">{{ t('achievements.nextBadge.title') }}</div>
              <div class="nb-icon">{{ data.next_badge.icon }}</div>
              <div class="nb-name">{{ data.next_badge.name }}</div>
              <div class="nb-desc">{{ data.next_badge.description || data.next_badge.condition }}</div>
              <div class="nb-progress"><div class="nb-fill" :style="{ width: data.next_badge.progress_percent + '%' }"></div></div>
              <div class="nb-label">{{ t('achievements.nextBadge.progressLabel', { current: data.next_badge.current_value, target: data.next_badge.target_value, pct: data.next_badge.progress_percent }) }}</div>
            </template>
            <template v-else>
              <div class="rc-title">{{ t('achievements.nextBadge.title') }}</div>
              <div class="nb-icon">🏆</div>
              <div class="nb-name">{{ t('achievements.nextBadge.allUnlockedName') }}</div>
              <div class="nb-desc">{{ t('achievements.nextBadge.allUnlockedDesc') }}</div>
            </template>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">{{ t('achievements.overview.title') }}</div>
            <div class="quick-stat">
              <div class="qs-item"><div class="qs-num">{{ data.summary.badges_earned }}/{{ data.summary.badges_total }}</div><div class="qs-label">{{ t('achievements.overview.badgesLabel') }}</div></div>
              <div class="qs-item"><div class="qs-num">Level {{ data.progress.current_level }}</div><div class="qs-label">{{ t('achievements.overview.levelLabel') }}</div></div>
              <div class="qs-item"><div class="qs-num">{{ data.progress.total_xp }}</div><div class="qs-label">{{ t('achievements.overview.totalXpLabel') }}</div></div>
              <div class="qs-item"><div class="qs-num">{{ completedChallengesCount }}/{{ data.challenges.length }}</div><div class="qs-label">{{ t('achievements.overview.challengesLabel') }}</div></div>
            </div>
          </div>

          <div class="paper-card motivational-card">
            <div class="mc-mascot">🐱</div>
            <div class="mc-text">{{ motivationalText }}</div>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">{{ t('achievements.recentBadges.title') }}</div>
            <div>
              <div v-if="!data.recent_badges.length" style="font-size:0.74rem;color:var(--text-secondary);line-height:1.6;">
                {{ t('achievements.recentBadges.noData') }}
              </div>
              <div v-for="(badge, idx) in data.recent_badges" :key="idx" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px dashed var(--kraft-light);">
                <div style="width:38px;height:38px;border-radius:12px;background:var(--gold-light);display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:1.5px solid var(--gold);">{{ badge.icon }}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.76rem;font-weight:800;">{{ badge.name }}</div>
                  <div style="font-size:0.66rem;color:var(--text-secondary);">{{ badge.earned_at ? t('achievements.recentBadges.earnedOnDate', { date: formatDate(badge.earned_at) }) : t('achievements.recentBadges.earnedNoDate') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';

const { t, tm, locale } = useI18n();
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

const FILTER_LABEL_KEYS = {
  all: 'achievements.badgeFilters.all', earned: 'achievements.badgeFilters.earned', locked: 'achievements.badgeFilters.locked', milestone: 'achievements.badgeFilters.milestone',
  task: 'achievements.badgeFilters.task', streak: 'achievements.badgeFilters.streak', journal: 'achievements.badgeFilters.journal', mood: 'achievements.badgeFilters.mood'
};
function filterLabel(filter) {
  const key = FILTER_LABEL_KEYS[filter];
  return key ? t(key) : filter;
}

// Backend hardcode title cấp độ bằng tiếng Việt (progress.routes.js LEVELS), trùng đúng 5 mốc
// XP với dashboard.levels.l1..l5 — bỏ qua title backend trả, tự dịch lại theo số `level`,
// giống cách DashboardView.vue/ProfileView.vue đã làm.
function translateLevelTitle(level) {
  const key = `dashboard.levels.l${level}`;
  const translated = t(key);
  return translated === key ? t('dashboard.levels.defaultTitle') : translated;
}

// Backend cũng hardcode tiêu đề/mô tả/phần thưởng của 3 thử thách tuần (buildChallenges() trong
// progress.routes.js, text bị lỗi encoding mất dấu) — có `code` ổn định nên bỏ qua text backend,
// tự dịch lại theo code giống pattern trên.
const CHALLENGE_DEF_KEYS = {
  weekly_tasks: 'weekly_tasks', weekly_journal: 'weekly_journal', weekly_mood: 'weekly_mood'
};
const translatedChallenges = computed(() => (data.value?.challenges || []).map((challenge) => {
  const defKey = CHALLENGE_DEF_KEYS[challenge.code];
  if (!defKey) return challenge;
  return {
    ...challenge,
    title: t(`achievements.challengeDefs.${defKey}.title`),
    description: t(`achievements.challengeDefs.${defKey}.description`),
    reward: t(`achievements.challengeDefs.${defKey}.reward`)
  };
}));

const streakWeekdayLabels = computed(() => tm('achievements.streak.weekdayLabels'));

const data = ref(null);
const activeTab = ref('badges');
const activeFilter = ref('all');
const activeBadge = ref(null);

function formatDate(value) {
  if (!value) return t('achievements.defaultDate');
  return new Intl.DateTimeFormat(intlLocale.value, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(value));
}
function getLevelTitle(level) {
  if (level?.level) return translateLevelTitle(level.level);
  return t('achievements.defaultLevelTitle');
}

const userName = computed(() => data.value?.user?.display_name || data.value?.user?.full_name || t('achievements.defaultUserName'));
const heroAvatarText = computed(() => {
  if (data.value?.user?.avatar_url) return '';
  const name = userName.value.trim();
  return name ? name.charAt(0).toUpperCase() : 'P';
});
const heroAvatarStyle = computed(() => (
  data.value?.user?.avatar_url
    ? { backgroundImage: `url('${data.value.user.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
));

const levelInfo = computed(() => data.value?.progress?.level_info || {});
const xpCurrent = computed(() => data.value?.progress?.total_xp || 0);
const xpTargetLabel = computed(() => {
  const li = levelInfo.value;
  const target = Number.isFinite(li.maxXP) ? li.maxXP : xpCurrent.value;
  return target === xpCurrent.value && !Number.isFinite(li.maxXP) ? 'MAX' : target;
});
const xpLeft = computed(() => levelInfo.value.xp_to_next || 0);
const completedChallengesCount = computed(() => (data.value?.challenges || []).filter((item) => item.completed).length);

const badgeFilterOptions = computed(() => {
  const categories = Array.from(new Set((data.value?.badges || []).map((b) => b.category)));
  return ['all', 'earned', 'locked', ...categories];
});
const filteredBadges = computed(() => {
  const badges = data.value?.badges || [];
  if (activeFilter.value === 'all') return badges;
  if (activeFilter.value === 'earned') return badges.filter((b) => b.earned);
  if (activeFilter.value === 'locked') return badges.filter((b) => !b.earned);
  return badges.filter((b) => b.category === activeFilter.value);
});

const motivationalText = computed(() => {
  const next = data.value?.next_badge;
  return next
    ? t('achievements.motivational.near', { name: next.name, n: Math.max(0, next.target_value - next.current_value) })
    : t('achievements.motivational.allUnlocked');
});

function closeBadgeModal(event) {
  if (event.target.classList.contains('modal-overlay')) activeBadge.value = null;
}

onMounted(async () => {
  try {
    data.value = await apiClient.get('/achievements');
  } catch (error) {
    console.error('Achievements page init failed:', error);
  }
});
</script>

<style scoped src="../assets/achievements.css"></style>
