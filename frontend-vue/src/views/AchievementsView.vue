<template>
  <div class="achievements-page">
    <div class="confetti-container"></div>

    <!-- Badge Detail Modal -->
    <div class="modal-overlay" :class="{ show: activeBadge }" @click="closeBadgeModal">
      <div v-if="activeBadge" class="badge-modal">
        <button class="bm-close" @click="activeBadge = null">✕</button>
        <span class="bm-icon">{{ activeBadge.icon || '🏅' }}</span>
        <div class="bm-name">{{ activeBadge.name || 'Huy hiệu' }}</div>
        <div class="bm-desc">{{ activeBadge.description || 'Không có mô tả' }}</div>
        <div class="bm-condition">{{ activeBadge.condition || 'Không có điều kiện' }}</div>
        <div class="bm-earned-date">
          {{ activeBadge.earned
            ? (activeBadge.earned_at ? `Đạt ngày ${formatDate(activeBadge.earned_at)}` : 'Đã đạt từ dữ liệu thực tế, chưa có mốc thời gian lưu riêng')
            : `Tiến độ hiện tại: ${activeBadge.current_value} / ${activeBadge.target_value}` }}
        </div>
        <div style="margin-top:14px;">
          <button class="btn-primary" style="width:100%;justify-content:center;" @click="activeBadge = null">Tuyệt vời! 🎉</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" v-if="data">
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <span>🏅 Huy hiệu & Thành tích</span>
      </div>

      <!-- Hero Banner -->
      <div class="paper-card hero-banner">
        <div class="hb-deco">🏆</div>
        <div class="hb-deco2">🌟</div>
        <div class="hb-content">
          <div class="hb-avatar" :style="heroAvatarStyle">{{ heroAvatarText }}</div>
          <div class="hb-info">
            <div class="hb-name">{{ userName }} — {{ getLevelTitle(levelInfo) }}</div>
            <div class="hb-level">⭐ Level {{ data.progress.current_level }} — {{ getLevelTitle(levelInfo) }}</div>
            <div class="hb-xp-wrap">
              <div class="hb-xp-label">
                <span>{{ xpCurrent }} / {{ xpTargetLabel }} XP</span>
                <span>{{ xpLeft > 0 ? `Còn ${xpLeft} XP → Level ${data.progress.current_level + 1}` : 'Đã ở level hiện tại cao nhất' }}</span>
              </div>
              <div class="hb-xp-bar"><div class="hb-xp-fill" :style="{ width: (levelInfo.progress_percent || 0) + '%' }"></div></div>
            </div>
            <div class="hb-stats">
              <div class="hb-stat"><div class="hb-stat-num">{{ data.summary.badges_earned || 0 }}</div><div class="hb-stat-label">Huy hiệu đạt</div></div>
              <div class="hb-stat"><div class="hb-stat-num">{{ data.summary.completed_tasks || 0 }}</div><div class="hb-stat-label">Nhiệm vụ xong</div></div>
              <div class="hb-stat"><div class="hb-stat-num">{{ data.summary.current_streak || 0 }}🔥</div><div class="hb-stat-label">Streak ngày</div></div>
              <div class="hb-stat"><div class="hb-stat-num">{{ completedChallengesCount }}/{{ data.challenges.length }}</div><div class="hb-stat-label">Thử thách</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="view-tabs">
        <div class="view-tab" :class="{ active: activeTab === 'badges' }" @click="activeTab = 'badges'">🏅 Huy hiệu</div>
        <div class="view-tab" :class="{ active: activeTab === 'levels' }" @click="activeTab = 'levels'">📈 Cấp độ</div>
        <div class="view-tab" :class="{ active: activeTab === 'streak' }" @click="activeTab = 'streak'">🔥 Streak</div>
        <div class="view-tab" :class="{ active: activeTab === 'challenges' }" @click="activeTab = 'challenges'">🎯 Thử thách</div>
        <div class="view-tab" :class="{ active: activeTab === 'hof' }" @click="activeTab = 'hof'">🌟 Vinh danh</div>
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
              >{{ FILTER_LABELS[filter] || filter }}</button>
            </div>
            <div class="badge-grid">
              <div v-if="!filteredBadges.length" class="paper-card" style="padding:20px;grid-column:1/-1;text-align:center;color:var(--text-secondary);">
                Chưa có huy hiệu phù hợp với bộ lọc này.
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
                  <div class="bc-date">{{ badge.earned_at ? `Đạt ngày ${formatDate(badge.earned_at)}` : 'Đã đạt từ dữ liệu hiện tại' }}</div>
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
              <div style="font-size:0.92rem;font-weight:800;margin-bottom:16px;padding-bottom:8px;border-bottom:2px dashed var(--kraft-light);">📈 Lộ trình cấp độ PeaceFlow</div>
              <div class="level-roadmap">
                <div v-for="level in data.levels" :key="level.level" class="level-item">
                  <div class="li-circle" :class="{ done: level.is_completed, current: level.is_current, locked: level.is_locked }">
                    {{ level.is_completed ? '✓' : level.level }}
                  </div>
                  <div class="li-content">
                    <div class="li-header">
                      <div class="li-level">Level {{ level.level }} — {{ level.title }}</div>
                      <div class="li-badge" :class="level.is_current ? 'lb-current' : level.is_completed ? 'lb-done' : 'lb-locked'">
                        {{ level.is_current ? 'Hiện tại' : level.is_completed ? 'Đã đạt' : 'Chưa mở' }}
                      </div>
                    </div>
                    <div style="font-size:0.74rem;color:var(--text-secondary);margin-bottom:6px;">
                      {{ Number.isFinite(level.maxXP) ? `${level.minXP} - ${level.maxXP} XP` : `${level.minXP}+ XP` }}
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
                  <div class="sh-num">{{ data.streak.current }} ngày</div>
                  <div class="sh-label">Chuỗi hoạt động hiện tại</div>
                  <div class="sh-record">🏆 Kỷ lục cá nhân: {{ data.streak.longest }} ngày</div>
                </div>
              </div>
              <div style="font-size:0.78rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">{{ data.streak.month_label }}</div>
              <div class="streak-calendar">
                <div v-for="d in ['CN','T2','T3','T4','T5','T6','T7']" :key="d" class="sc-day-h">{{ d }}</div>
                <div v-for="(day, idx) in data.streak.calendar" :key="idx" class="sc-day" :class="day.state">{{ day.label }}</div>
              </div>
              <div style="display:flex;gap:12px;margin-top:8px;font-size:0.65rem;color:var(--text-light);flex-wrap:wrap;">
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--mint-dark);display:inline-block;"></span>Hoàn thành</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:rgba(255,139,139,0.3);display:inline-block;"></span>Bỏ lỡ</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--mint-light);border:1.5px solid var(--mint-dark);display:inline-block;"></span>Hôm nay</span>
              </div>
            </div>
            <div class="paper-card" style="padding:18px;">
              <div style="font-size:0.88rem;font-weight:700;margin-bottom:12px;">📊 Thống kê streak</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                <div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius-sm);border:1.5px solid var(--kraft-light);">
                  <div style="font-size:1.3rem;font-weight:800;color:var(--peach-dark);">{{ data.streak.current }}🔥</div>
                  <div style="font-size:0.62rem;color:var(--text-secondary);">Streak hiện tại</div>
                </div>
                <div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius-sm);border:1.5px solid var(--kraft-light);">
                  <div style="font-size:1.3rem;font-weight:800;color:var(--gold);">{{ data.streak.longest }}🏆</div>
                  <div style="font-size:0.62rem;color:var(--text-secondary);">Kỷ lục</div>
                </div>
                <div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius-sm);border:1.5px solid var(--kraft-light);">
                  <div style="font-size:1.3rem;font-weight:800;color:var(--mint-dark);">{{ data.streak.active_days }}</div>
                  <div style="font-size:0.62rem;color:var(--text-secondary);">Tổng ngày active</div>
                </div>
              </div>
              <div style="margin-top:12px;padding:12px 14px;background:var(--mint-light);border:1.5px solid var(--mint);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">
                🐱 <strong>PeaceCat nói:</strong> Bạn còn {{ data.progress.level_info?.xp_to_next || 0 }} XP để lên cấp tiếp theo. Chỉ cần giữ nhịp hoạt động đều là progress sẽ tự đẩy lên.
              </div>
            </div>
          </div>

          <!-- TAB: CHALLENGES -->
          <div class="tab-panel" :class="{ active: activeTab === 'challenges' }">
            <div style="font-size:0.88rem;font-weight:700;margin-bottom:12px;color:var(--text-secondary);">🎯 Thử thách đặc biệt — Tham gia để nhận phần thưởng độc quyền!</div>
            <div>
              <div v-for="(challenge, idx) in data.challenges" :key="idx" class="paper-card challenge-card" style="padding:18px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                  <div>
                    <div style="font-size:0.95rem;font-weight:800;margin-bottom:4px;">{{ challenge.icon }} {{ challenge.title }}</div>
                    <div style="font-size:0.76rem;color:var(--text-secondary);line-height:1.5;">{{ challenge.description }}</div>
                  </div>
                  <div style="font-size:0.68rem;font-weight:800;" :style="{ color: challenge.completed ? 'var(--mint-dark)' : 'var(--text-light)' }">
                    {{ challenge.completed ? 'Hoàn thành' : `${challenge.current}/${challenge.target}` }}
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
              <div style="font-size:0.92rem;font-weight:800;margin-bottom:4px;">🌟 Bảng Vinh Danh PeaceFlow</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:16px;">Những người dùng xuất sắc nhất tháng này</div>
              <div>
                <div v-if="!data.leaderboard.top_users.length" class="paper-card" style="padding:18px;text-align:center;color:var(--text-secondary);">Chưa có đủ dữ liệu xếp hạng.</div>
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
                    <div class="hof-name">{{ entry.name }}{{ entry.is_current_user ? ' (Bạn)' : '' }}</div>
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
                <div style="font-size:0.88rem;font-weight:700;margin-bottom:10px;">📍 Vị trí của bạn</div>
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
                  {{ data.leaderboard.user_rank.total_users > 0 ? `Bạn đang ở top ${Math.max(1, Math.round((data.leaderboard.user_rank.rank / data.leaderboard.user_rank.total_users) * 100))}% người dùng theo XP.` : 'Điểm xếp hạng sẽ cập nhật khi có thêm dữ liệu.' }}
                </div>
              </template>
              <template v-else>
                <div style="font-size:0.88rem;font-weight:700;margin-bottom:10px;">📍 Vị trí của bạn</div>
                <div style="font-size:0.76rem;color:var(--text-secondary);text-align:center;">Cần thêm dữ liệu progress để xếp hạng.</div>
              </template>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div>
          <div class="paper-card next-badge-card">
            <template v-if="data.next_badge">
              <div class="rc-title">🎯 Huy hiệu tiếp theo</div>
              <div class="nb-icon">{{ data.next_badge.icon }}</div>
              <div class="nb-name">{{ data.next_badge.name }}</div>
              <div class="nb-desc">{{ data.next_badge.description || data.next_badge.condition }}</div>
              <div class="nb-progress"><div class="nb-fill" :style="{ width: data.next_badge.progress_percent + '%' }"></div></div>
              <div class="nb-label">{{ data.next_badge.current_value }} / {{ data.next_badge.target_value }} ({{ data.next_badge.progress_percent }}%)</div>
            </template>
            <template v-else>
              <div class="rc-title">🎯 Huy hiệu tiếp theo</div>
              <div class="nb-icon">🏆</div>
              <div class="nb-name">Đã mở hết</div>
              <div class="nb-desc">Tất cả badge trong hệ thống hiện tại đã được bạn chạm mốc.</div>
            </template>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">📊 Tổng quan thành tích</div>
            <div class="quick-stat">
              <div class="qs-item"><div class="qs-num">{{ data.summary.badges_earned }}/{{ data.summary.badges_total }}</div><div class="qs-label">Huy hiệu</div></div>
              <div class="qs-item"><div class="qs-num">Level {{ data.progress.current_level }}</div><div class="qs-label">Cấp độ</div></div>
              <div class="qs-item"><div class="qs-num">{{ data.progress.total_xp }}</div><div class="qs-label">Tổng XP</div></div>
              <div class="qs-item"><div class="qs-num">{{ completedChallengesCount }}/{{ data.challenges.length }}</div><div class="qs-label">Thử thách</div></div>
            </div>
          </div>

          <div class="paper-card motivational-card">
            <div class="mc-mascot">🐱</div>
            <div class="mc-text">{{ motivationalText }}</div>
          </div>

          <div class="paper-card right-card">
            <div class="rc-title">🆕 Huy hiệu gần đây</div>
            <div>
              <div v-if="!data.recent_badges.length" style="font-size:0.74rem;color:var(--text-secondary);line-height:1.6;">
                Chưa có badge nào được mở gần đây. Hãy hoàn thành thêm nhiệm vụ hoặc check-in để tạo tiến triển mới.
              </div>
              <div v-for="(badge, idx) in data.recent_badges" :key="idx" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px dashed var(--kraft-light);">
                <div style="width:38px;height:38px;border-radius:12px;background:var(--gold-light);display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:1.5px solid var(--gold);">{{ badge.icon }}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.76rem;font-weight:800;">{{ badge.name }}</div>
                  <div style="font-size:0.66rem;color:var(--text-secondary);">{{ badge.earned_at ? `Đạt ngày ${formatDate(badge.earned_at)}` : 'Đã đạt từ dữ liệu hiện tại' }}</div>
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
import { apiClient } from '../lib/apiClient';

const FILTER_LABELS = {
  all: 'Tất cả', earned: 'Đã đạt', locked: 'Chưa đạt', milestone: 'Cột mốc',
  task: 'Nhiệm vụ', streak: 'Streak', journal: 'Nhật ký', mood: 'Tâm trạng'
};

const data = ref(null);
const activeTab = ref('badges');
const activeFilter = ref('all');
const activeBadge = ref(null);

function formatDate(value) {
  if (!value) return 'Đã đạt';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(value));
}
function getLevelTitle(level) {
  return level?.title || 'Hành trình';
}

const userName = computed(() => data.value?.user?.display_name || data.value?.user?.full_name || 'Người dùng');
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
    ? `"Bạn đang tiến gần tới ${next.name}. Chỉ cần thêm ${Math.max(0, next.target_value - next.current_value)} bước nhỏ nữa để chạm huy hiệu tiếp theo."`
    : '"Toàn bộ badge hiện có đã được mở. Hành trình của bạn đang ở vùng rất ổn định."';
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
