<template>
  <main class="main-content profile-page" style="margin-left: 0;">
    <div class="breadcrumb">
      <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
      <span>👤 Hồ sơ cá nhân</span>
    </div>

    <!-- Profile Hero -->
    <div class="paper-card profile-hero">
      <div class="ph-deco">🌿</div>
      <div class="ph-content">
        <div class="ph-avatar-wrap">
          <div class="ph-avatar" @click="switchTab('info')" title="Đổi avatar">{{ heroAvatar }}</div>
          <div class="ph-avatar-edit">✏️</div>
        </div>
        <div class="ph-info">
          <div class="ph-name">{{ heroName }}</div>
          <div class="ph-tagline">{{ heroTaglineText }}</div>
          <div class="ph-meta">
            <div class="ph-meta-item">📅 Tham gia: {{ heroJoinDate }}</div>
            <div class="ph-meta-item">📍 {{ heroLocation }}</div>
            <div class="ph-meta-item">🔥 Streak: {{ heroStreak }} ngày</div>
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
      <div class="profile-tab" :class="{ active: activeTab === 'info' }" @click="switchTab('info')">👤 Thông tin</div>
      <div class="profile-tab" :class="{ active: activeTab === 'badges' }" @click="switchTab('badges')">🏅 Thành tích</div>
      <div class="profile-tab" :class="{ active: activeTab === 'activity' }" @click="switchTab('activity')">📊 Hoạt động</div>
      <div class="profile-tab" :class="{ active: activeTab === 'settings' }" @click="switchTab('settings')">⚙️ Cài đặt</div>
      <div class="profile-tab" :class="{ active: activeTab === 'privacy' }" @click="switchTab('privacy')">🔒 Bảo mật</div>
    </div>

    <div class="profile-layout">
      <!-- LEFT: Main Content -->
      <div>
        <!-- TAB: INFO -->
        <div class="tab-panel" :class="{ active: activeTab === 'info' }">
          <div class="paper-card section-card">
            <div class="sc-title">👤 Thông tin cá nhân</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tên hiển thị *</label>
                <input type="text" class="form-input" v-model="formDisplayName">
              </div>
              <div class="form-group">
                <label class="form-label">Biệt danh (tùy chọn)</label>
                <input type="text" class="form-input" placeholder="Tên bạn muốn PeaceCat gọi..." v-model="formNickname">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" v-model="formEmail">
              </div>
              <div class="form-group">
                <label class="form-label">Số điện thoại (tùy chọn)</label>
                <input type="tel" class="form-input" placeholder="0xxx xxx xxx" v-model="formPhone">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Độ tuổi</label>
                <select class="form-select" v-model="formAgeGroup">
                  <option>16-24 tuổi</option>
                  <option>25-34 tuổi</option>
                  <option>35-44 tuổi</option>
                  <option>45+ tuổi</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Giới tính</label>
                <select class="form-select" v-model="formGender">
                  <option>Nữ</option>
                  <option>Nam</option>
                  <option>Khác</option>
                  <option>Không muốn tiết lộ</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Khẩu hiệu cá nhân</label>
              <input type="text" class="form-input" v-model="formTagline">
              <span class="form-hint">Hiển thị trên trang hồ sơ của bạn</span>
            </div>
            <div class="form-group">
              <label class="form-label">Giới thiệu bản thân (tùy chọn)</label>
              <textarea class="form-textarea" rows="3" placeholder="Kể một chút về hành trình của bạn..." v-model="formBio"></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button class="btn-outline" @click="resetForm">Hủy thay đổi</button>
              <button class="btn-primary" @click="saveProfile">{{ savingProfile ? 'Đang lưu...' : '💾 Lưu thay đổi' }}</button>
            </div>
          </div>

          <div class="paper-card section-card">
            <div class="sc-title">🎭 Chọn Avatar Paper Flow</div>
            <div class="avatar-grid">
              <div
                v-for="avatar in AVATARS"
                :key="avatar"
                class="avatar-option"
                :class="{ selected: avatar === selectedAvatar }"
                @click="selectAvatar(avatar)"
              >{{ avatar }}</div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-light);">Avatar của bạn sẽ xuất hiện trong cộng đồng và bảng xếp hạng</div>
          </div>

          <div class="paper-card section-card">
            <div class="sc-title">🎯 Mục tiêu & Ưu tiên</div>
            <div class="form-group">
              <label class="form-label">Mục tiêu chính khi dùng PeaceFlow</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                <div
                  v-for="goal in GOAL_OPTIONS"
                  :key="goal"
                  class="goal-chip"
                  :class="{ selected: selectedGoals.includes(goal) }"
                  @click="toggleGoal(goal)"
                >{{ goal }}</div>
              </div>
            </div>
            <div class="form-row" style="margin-top:8px;">
              <div class="form-group">
                <label class="form-label">Thời gian thiền mục tiêu/ngày</label>
                <select class="form-select" v-model="formGoalDuration">
                  <option>5 phút</option>
                  <option>10 phút</option>
                  <option>15 phút</option>
                  <option>20 phút</option>
                  <option>30 phút</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nhắc nhở hàng ngày lúc</label>
                <input type="time" class="form-input" v-model="formReminderTime">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;">
              <button class="btn-primary" @click="saveGoals">{{ savingGoals ? 'Đang lưu...' : '💾 Lưu mục tiêu' }}</button>
            </div>
          </div>
        </div>

        <!-- TAB: BADGES -->
        <div class="tab-panel" :class="{ active: activeTab === 'badges' }">
          <div class="paper-card section-card">
            <div class="sc-title">🏅 Huy hiệu đã đạt được ({{ achievements?.summary?.badges_earned || 0 }}/{{ achievements?.summary?.badges_total || 0 }})</div>
            <div class="badges-grid">
              <template v-if="badgesList.length">
                <div v-for="(badge, idx) in badgesList" :key="idx" class="badge-item" :class="badge.earned ? 'earned' : 'locked'">
                  <div class="bi-icon">{{ badge.icon || '🏅' }}</div>
                  <div class="bi-name">{{ badge.name }}</div>
                  <div class="bi-desc">{{ badge.earned ? (badge.earned_at ? `Đạt ${formatDate(badge.earned_at)}` : 'Đã đạt') : `${badge.current_value}/${badge.target_value}` }}</div>
                </div>
              </template>
              <div v-else style="grid-column:1/-1;color:var(--text-secondary);">Chưa có badge nào trong hồ sơ.</div>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">📈 Tiến trình cấp độ</div>
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
                  <div style="font-size:0.86rem;font-weight:800;">Level {{ level.level }} — {{ level.title }}</div>
                  <div style="font-size:0.72rem;color:var(--text-secondary);margin:4px 0 6px;">
                    {{ Number.isFinite(level.maxXP) ? `${level.minXP} - ${level.maxXP} XP` : `${level.minXP}+ XP` }}
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
              <div class="sb-label">Nhiệm vụ hoàn thành</div>
            </div>
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.journals }}</div>
              <div class="sb-label">Bài nhật ký</div>
            </div>
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.assessments }}</div>
              <div class="sb-label">Bài test tâm lý</div>
            </div>
            <div class="paper-card stat-box">
              <div class="sb-num">{{ activityStats.streak }} 🔥</div>
              <div class="sb-label">Streak hiện tại</div>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">📋 Hoạt động gần đây</div>
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
              <div v-else style="color:var(--text-secondary);">Chưa có hoạt động nào được ghi nhận.</div>
            </div>
          </div>
        </div>

        <!-- TAB: SETTINGS -->
        <div class="tab-panel" :class="{ active: activeTab === 'settings' }">
          <div class="paper-card section-card">
            <div class="sc-title">🔔 Thông báo</div>
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
            <div class="sc-title">🌐 Ngôn ngữ & Hiển thị</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Ngôn ngữ</label>
                <select class="form-select">
                  <option selected>🇻🇳 Tiếng Việt</option>
                  <option>🇬🇧 English</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Giao diện</label>
                <select class="form-select">
                  <option selected>☀️ Sáng (Paper Flow)</option>
                  <option>🌙 Tối (sắp ra mắt)</option>
                </select>
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">Hiệu ứng animation</div>
                <div class="tr-desc">Bật/tắt các hiệu ứng chuyển động trong ứng dụng</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">Âm thanh nền</div>
                <div class="tr-desc">Nhạc thiền và âm thanh tự nhiên trong bài tập</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px;">
              <button class="btn-primary" @click="saveSettings">💾 Lưu cài đặt</button>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">📱 Thiết bị kết nối</div>
            <div>
              <div style="padding:10px 0;border-bottom:1px dashed var(--kraft-light);">
                <div style="font-size:0.8rem;font-weight:800;">Trình duyệt hiện tại</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);">Đã đăng nhập gần đây • Đồng bộ qua session hiện tại</div>
              </div>
              <div style="padding-top:10px;font-size:0.74rem;color:var(--text-light);">
                Danh sách thiết bị chi tiết chưa có bảng quản lý riêng trên backend.
              </div>
            </div>
            <button class="btn-outline" style="margin-top:8px;" @click="showToast('Tính năng sắp ra mắt! 🚀')">+ Kết nối thiết bị mới</button>
          </div>
        </div>

        <!-- TAB: PRIVACY -->
        <div class="tab-panel" :class="{ active: activeTab === 'privacy' }">
          <div class="paper-card section-card">
            <div class="sc-title">🔐 Bảo mật tài khoản</div>
            <div class="form-group">
              <label class="form-label">Mật khẩu hiện tại</label>
              <input type="password" class="form-input" placeholder="••••••••">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mật khẩu mới</label>
                <input type="password" class="form-input" placeholder="••••••••">
              </div>
              <div class="form-group">
                <label class="form-label">Xác nhận mật khẩu mới</label>
                <input type="password" class="form-input" placeholder="••••••••">
              </div>
            </div>
            <div class="toggle-row">
              <div class="tr-left">
                <div class="tr-title">Xác thực 2 bước (2FA)</div>
                <div class="tr-desc">Bảo vệ tài khoản bằng mã OTP qua SMS hoặc app</div>
              </div>
              <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px;">
              <button class="btn-primary" @click="savePassword">🔐 Cập nhật mật khẩu</button>
            </div>
          </div>
          <div class="paper-card section-card">
            <div class="sc-title">🔒 Quyền riêng tư dữ liệu</div>
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
            <div class="sc-title">📤 Xuất dữ liệu</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.6;">
              Tải xuống toàn bộ dữ liệu của bạn dưới dạng file JSON hoặc PDF. Dữ liệu bao gồm: nhật ký, kết quả khảo sát, lịch sử nhiệm vụ.
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn-outline" @click="exportData('json')">📄 Xuất JSON</button>
              <button class="btn-outline" @click="exportData('pdf')">📋 Xuất PDF báo cáo</button>
            </div>
          </div>
          <div class="paper-card danger-zone">
            <div class="dz-title">⚠️ Vùng nguy hiểm</div>
            <div class="dz-item">
              <div>
                <div class="dz-text">Xóa toàn bộ dữ liệu</div>
                <div class="dz-sub">Xóa vĩnh viễn nhật ký, kết quả khảo sát, lịch sử nhiệm vụ</div>
              </div>
              <button
                class="btn-danger"
                @click="confirmAction('deleteData', '🗑️', 'Xóa toàn bộ dữ liệu?', 'Hành động này không thể hoàn tác. Tất cả nhật ký, kết quả khảo sát và lịch sử sẽ bị xóa vĩnh viễn.')"
              >🗑️ Xóa dữ liệu</button>
            </div>
            <div class="dz-item">
              <div>
                <div class="dz-text">Xóa tài khoản</div>
                <div class="dz-sub">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan</div>
              </div>
              <button
                class="btn-danger"
                @click="confirmAction('deleteAccount', '💔', 'Xóa tài khoản?', 'Hành động này không thể hoàn tác. Tài khoản và toàn bộ dữ liệu sẽ bị xóa vĩnh viễn sau 30 ngày.')"
              >💔 Xóa tài khoản</button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDEBAR -->
      <div>
        <!-- Streak & XP -->
        <div class="paper-card right-card">
          <div class="rc-title">🔥 Chuỗi hoạt động</div>
          <div class="streak-display">
            <div class="sd-num">{{ streakCard.streak }} 🔥</div>
            <div class="sd-label">ngày liên tục</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="text-align:center;padding:8px;background:var(--cream);border-radius:var(--border-radius-sm);border:1.5px solid var(--kraft-light);">
              <div style="font-size:1rem;font-weight:800;color:var(--mint-dark);">{{ streakCard.totalXp }}</div>
              <div style="font-size:0.62rem;color:var(--text-secondary);">Tổng XP</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--cream);border-radius:var(--border-radius-sm);border:1.5px solid var(--kraft-light);">
              <div style="font-size:1rem;font-weight:800;color:var(--lavender);">Level {{ streakCard.level }}</div>
              <div style="font-size:0.62rem;color:var(--text-secondary);">Cấp độ</div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="paper-card right-card">
          <div class="rc-title">🔗 Truy cập nhanh</div>
          <router-link to="/dashboard" class="quick-link"><span class="ql-icon">🏡</span><span class="ql-text">Tổng quan</span><span class="ql-arrow">›</span></router-link>
          <router-link to="/journal" class="quick-link"><span class="ql-icon">📝</span><span class="ql-text">Nhật ký cảm xúc</span><span class="ql-arrow">›</span></router-link>
          <router-link to="/mood-assessment" class="quick-link"><span class="ql-icon">📊</span><span class="ql-text">Kiểm tra tâm lý</span><span class="ql-arrow">›</span></router-link>
          <router-link to="/experts" class="quick-link"><span class="ql-icon">🩺</span><span class="ql-text">Kết nối chuyên gia</span><span class="ql-arrow">›</span></router-link>
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
import { apiClient } from '../lib/apiClient';
import { EventLogger } from '../lib/eventLogger';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const AVATARS = ['🐱', '🌱', '🌿', '🧘', '🌤️', '🌙', '💚', '🦋', '🍀', '☁️', '🌸', '⭐'];
const LOCAL_SETTINGS_KEY = 'peaceflow_profile_settings';
const GOAL_OPTIONS = [
  '😌 Giảm lo âu',
  '😴 Cải thiện giấc ngủ',
  '💪 Tăng cường sức khỏe',
  '🎯 Tăng tập trung',
  '💼 Giảm stress công việc',
  '❤️ Cải thiện mối quan hệ',
  '🌱 Phát triển bản thân'
];

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
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  if (!value) return 'Chưa có hoạt động';
  const target = new Date(value);
  const diff = Math.floor((Date.now() - target.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return 'Hôm nay';
  if (diff === 1) return '1 ngày trước';
  return `${diff} ngày trước`;
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
const formAgeGroup = ref('25-34 tuổi');
const formGender = ref('Không muốn tiết lộ');
const formTagline = ref('Hôm nay là một ngày mới để tiến bộ 🌱');
const formBio = ref('');
const formGoalDuration = ref('10 phút');
const formReminderTime = ref('08:00');

const heroAvatar = ref('🐱');
const heroName = ref('Người dùng');
const heroTaglineText = ref('"Hôm nay là một ngày mới để tiến bộ 🌱"');
const heroJoinDate = ref('Chưa có');
const heroLocation = ref('Chưa cập nhật vị trí');
const heroStreak = ref(0);
const heroLevelBadgeText = ref('');
const heroXpLeft = ref('0 XP');
const heroXpRight = ref('');
const heroXpFillPct = ref(0);

const savingProfile = ref(false);
const savingGoals = ref(false);

const toastVisible = ref(false);
const toastText = ref('Đã lưu thay đổi!');
let toastTimer = null;

function getLevelInfo() {
  return achievements.value?.progress?.level_info || {
    level: 1,
    title: 'Người Bắt Đầu',
    progress_percent: 0,
    xp_to_next: 100,
    maxXP: 100
  };
}

function getDisplayName() {
  const onboarding = profile.value?.onboarding_answers || {};
  return user.value?.display_name || onboarding.nickname || user.value?.full_name || 'Người dùng';
}

function getAvatarEmoji() {
  return selectedAvatar.value || profile.value?.onboarding_answers?.avatar_emoji || '🐱';
}

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
  formAgeGroup.value = onboarding.ageGroup || '25-34 tuổi';
  formGender.value = mapGenderToDisplay(user.value?.gender);
  formTagline.value = onboarding.tagline || 'Hôm nay là một ngày mới để tiến bộ 🌱';
  formBio.value = onboarding.bio || '';
  formGoalDuration.value = `${support.goal_duration_minutes || 10} phút`;
  formReminderTime.value = support.reminder_time || '08:00';
}

function renderHero() {
  const levelInfo = getLevelInfo();
  const totalXp = progress.value?.total_xp || 0;
  const currentLevel = progress.value?.current_level || levelInfo.level || 1;
  const streak = progress.value?.current_streak || 0;
  const location = [user.value?.city, user.value?.country].filter(Boolean).join(', ') || 'Chưa cập nhật vị trí';
  const avatar = getAvatarEmoji();

  heroAvatar.value = avatar;
  heroName.value = getDisplayName();
  heroTaglineText.value = `"${formTagline.value || 'Hôm nay là một ngày mới để tiến bộ 🌱'}"`;
  heroJoinDate.value = formatDate(user.value?.created_at);
  heroLocation.value = location;
  heroStreak.value = streak;
  heroLevelBadgeText.value = `⭐ Level ${currentLevel} — ${levelInfo.title || 'Hành trình'}`;

  const target = Number.isFinite(levelInfo.maxXP) ? levelInfo.maxXP : totalXp;
  if (!Number.isFinite(levelInfo.maxXP) && target === totalXp) {
    heroXpLeft.value = `${totalXp} XP • MAX`;
  } else {
    heroXpLeft.value = `${totalXp} XP`;
  }
  heroXpRight.value = levelInfo.xp_to_next > 0 ? `Còn ${levelInfo.xp_to_next} XP → Level ${currentLevel + 1}` : 'Đang ở mốc cao nhất hiện tại';
  heroXpFillPct.value = levelInfo.progress_percent || 0;
}

function renderGoals() {
  const goals = Array.isArray(profile.value?.goals) ? profile.value.goals : [];
  selectedGoals.value = [...goals];
}

const badgesList = computed(() => achievements.value?.badges || []);
const levelsList = computed(() => achievements.value?.levels || []);

const activityStats = computed(() => ({
  tasks: report.value?.task_history?.length || 0,
  journals: report.value?.journal_history?.length || 0,
  assessments: report.value?.assessments?.length || 0,
  streak: progress.value?.current_streak || 0
}));

const activityTimeline = computed(() => {
  const timeline = [
    ...(report.value?.task_history || []).slice(0, 6).map((item) => ({
      type: 'task',
      date: item.created_at,
      title: item.title,
      meta: `+${item.xp_earned || 0} XP • ${item.category || 'Nhiệm vụ'}`
    })),
    ...(report.value?.journal_history || []).slice(0, 6).map((item) => ({
      type: 'journal',
      date: item.created_at,
      title: item.title || 'Nhật ký cảm xúc',
      meta: 'Đã lưu vào hồ sơ cảm xúc'
    })),
    ...(report.value?.assessments || []).slice(0, 6).map((item) => ({
      type: 'assessment',
      date: item.created_at,
      title: item.name,
      meta: `${item.severity || 'Đã hoàn thành'} • ${item.total_score || 0} điểm`
    }))
  ].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 8);
  return timeline;
});

const notifRows = computed(() => [
  { key: 'moodReminder', title: 'Nhắc mood check-in', desc: 'Lưu cục bộ trên thiết bị này.' },
  { key: 'journalReminder', title: 'Nhắc viết nhật ký', desc: 'Hiện chưa có bảng settings riêng trên backend.' },
  { key: 'badgeAlerts', title: 'Thông báo badge mới', desc: 'Hiển thị khi hệ thống award badge.' }
]);

const privacyRows = computed(() => [
  { key: 'hideCommunity', title: 'Ẩn hồ sơ khỏi cộng đồng', desc: 'Chưa có backend settings riêng, hiện lưu cục bộ.' },
  { key: 'hideAchievements', title: 'Ẩn thành tích công khai', desc: 'Ảnh hưởng tới cách hiển thị hồ sơ về sau.' }
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
    ? `Hồ sơ của bạn đang khá đồng bộ. Mốc gần nhất là ${nextBadge.name} với tiến độ ${nextBadge.current_value}/${nextBadge.target_value}.`
    : 'Hồ sơ của bạn đã được đồng bộ với tiến trình hiện tại trên hệ thống.';
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
  renderHero();
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
    showToast('Đã lưu thông tin hồ sơ.');
  } catch (error) {
    EventLogger.error('profile', 'save:failed', error);
    console.error('Profile save failed:', error);
    showToast('Không lưu được hồ sơ.', 'error');
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
        goal_duration_minutes: Number((formGoalDuration.value || '10').replace(/\D+/g, '')) || 10,
        reminder_time: formReminderTime.value || '08:00'
      }
    });

    profile.value = profileData;
    EventLogger.log('profile', 'goals:save:success');
    renderPage();
    showToast('Đã lưu mục tiêu.');
  } catch (error) {
    EventLogger.error('profile', 'goals:save:failed', error);
    console.error('Goals save failed:', error);
    showToast('Không lưu được mục tiêu.', 'error');
  } finally {
    savingGoals.value = false;
  }
}

function resetForm() {
  renderForm();
  renderGoals();
  showToast('Đã khôi phục dữ liệu từ hồ sơ hiện tại.', 'info');
}

function toggleGoal(label) {
  const wasSelected = selectedGoals.value.includes(label);
  EventLogger.log('profile', 'goal:toggle');
  if (wasSelected) {
    selectedGoals.value = selectedGoals.value.filter((goal) => goal !== label);
  } else {
    selectedGoals.value = [...selectedGoals.value, label];
  }
}

function switchTab(tab) {
  EventLogger.log('profile', 'tab:switch');
  activeTab.value = tab;
}

function saveSettings() {
  EventLogger.log('profile', 'settings:save:local');
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify({ ...localSettings }));
  showToast('Đã lưu cài đặt cục bộ trên thiết bị này.', 'info');
}

function savePassword() {
  showToast('Backend hiện chưa có endpoint đổi mật khẩu trên trang này.', 'info');
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
    showToast('Đã xuất dữ liệu JSON.');
    return;
  }

  showToast('Xuất PDF chưa được nối backend ở trang này.', 'info');
}

function confirmAction(action, _icon, title, message) {
  const confirmed = window.confirm(`${title}\n\n${message}`);
  if (!confirmed) return;
  showToast(`Chức năng ${action} chưa được backend hỗ trợ trực tiếp trên trang này.`, 'info');
}

function selectAvatar(avatar) {
  EventLogger.log('profile', 'avatar:select');
  selectedAvatar.value = avatar;
  renderHero();
}

onMounted(async () => {
  try {
    await loadData();
    renderPage();
  } catch (error) {
    console.error('Profile init failed:', error);
    showToast('Không tải được hồ sơ từ máy chủ.', 'error');
  }
});
</script>

<style scoped src="../assets/profile.css"></style>
