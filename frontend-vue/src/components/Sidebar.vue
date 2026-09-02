<template>
  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <router-link to="/" class="sidebar-logo">
      <div class="logo-icon">🌿</div>
      <div class="logo-text">Peace<span>Flow</span></div>
    </router-link>

    <nav class="sidebar-nav">
      <template v-for="section in NAV_SECTIONS" :key="section.label">
        <div class="nav-section-label" style="margin-top:8px;">{{ section.label }}</div>
        <template v-for="item in section.items" :key="item.key">
          <router-link
            v-if="item.route"
            :to="{ name: item.route }"
            class="nav-item"
            :class="{ active: activeKey === item.key }"
          >
            <span class="ni">{{ item.icon }}</span> {{ item.label }}
          </router-link>
          <a v-else href="#" class="nav-item" @click.prevent="goToLegacyPage(item.legacy)">
            <span class="ni">{{ item.icon }}</span> {{ item.label }}
          </a>
        </template>
        <template v-if="section.label === 'Kết nối'">
          <router-link
            v-if="expertRole"
            :to="isExpert ? { name: 'expert-dashboard' } : '/expert-apply'"
            class="nav-item"
            style="color:var(--mint-dark); font-weight:700;"
          >
            <span class="ni">🧑‍⚕️</span> {{ isExpert ? 'Quản lý chuyên gia' : 'Hồ sơ chuyên gia' }}
          </router-link>
          <router-link
            v-if="isAdmin"
            to="/admin/dashboard"
            class="nav-item"
            style="color:var(--coral); font-weight:700;"
          >
            <span class="ni">🛡️</span> Trang quản trị
          </router-link>
        </template>
      </template>

      <a
        v-if="auth.isAuthenticated"
        href="#"
        class="nav-item"
        style="color:var(--coral); margin-top: 10px; border-top: 1px dashed var(--kraft-light); padding-top: 15px;"
        @click.prevent="handleLogout"
      >
        <span class="ni">🚪</span> Đăng xuất
      </a>
      <router-link
        v-else
        to="/login"
        class="nav-item"
        style="color:var(--coral); margin-top: 10px; border-top: 1px dashed var(--kraft-light); padding-top: 15px;"
      >
        <span class="ni">🔐</span> Đăng nhập
      </router-link>
    </nav>

    <div class="sidebar-bottom">
      <button class="notif-bell-btn" data-notif-bell @click="notif.togglePanel()">
        <span style="font-size:1.1rem;position:relative;">
          🔔
          <span v-if="notif.unread > 0" class="notif-badge">{{ Math.min(notif.unread, 9) }}</span>
        </span>
        Thông báo
      </button>
      <div class="user-card-mini">
        <div class="user-avatar-mini" :style="avatarStyle">{{ avatarEmoji }}</div>
        <div class="user-info-mini">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <div class="user-name">{{ displayName }}</div>
            <span v-if="isExpert" class="tag-expert">Chuyên gia</span>
            <span v-if="isAdmin" class="tag-admin">Admin</span>
          </div>
          <div class="user-level">⭐ {{ xp ?? '--' }} XP · Level {{ level ?? '--' }}</div>
        </div>
      </div>
      <router-link to="/emergency" class="emergency-btn">
        🆘 Hỗ trợ khẩn cấp
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { goToLegacyPage } from '../lib/legacyApp';

defineProps({ sidebarOpen: { type: Boolean, default: false } });
const emit = defineEmits(['navigate']);

const NAV_SECTIONS = [
  {
    label: 'Chính',
    items: [
      { key: 'dashboard', icon: '🏡', label: 'Tổng quan', route: 'dashboard' },
      { key: 'mood', icon: '💭', label: 'Tâm trạng', route: 'mood-checkin' },
      { key: 'tests', icon: '📋', label: 'Bài test', route: 'mood-assessment' },
      { key: 'tasks', icon: '🎮', label: 'Nhiệm vụ', route: 'tasks' },
      { key: 'journal', icon: '📝', label: 'Nhật ký', route: 'journal' }
    ]
  },
  {
    label: 'Kết nối',
    items: [
      { key: 'experts', icon: '🩺', label: 'Chuyên gia', route: 'experts' },
      { key: 'community', icon: '👥', label: 'Cộng đồng', route: 'community' }
    ]
  },
  {
    label: 'Phân tích',
    items: [
      { key: 'report', icon: '📊', label: 'Báo cáo', route: 'report' },
      { key: 'achievements', icon: '🏅', label: 'Thành tích', route: 'achievements' }
    ]
  },
  {
    label: 'Cài đặt',
    items: [
      { key: 'profile', icon: '👤', label: 'Hồ sơ', route: 'profile' },
      { key: 'settings', icon: '⚙️', label: 'Cài đặt', route: 'settings' }
    ]
  }
];

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notif = useNotificationsStore();

const activeKey = computed(() => route.meta?.navKey || null);
const isExpert = computed(() => Boolean(auth.user?.is_expert));
const expertRole = computed(() => Boolean(auth.user?.is_expert || auth.user?.role === 'expert'));
const isAdmin = computed(() => Boolean(auth.user?.role === 'admin' || auth.user?.is_admin));
const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || 'Người dùng');

const avatarEmoji = computed(() => {
  const url = auth.user?.avatar_url;
  return url && url.startsWith('emoji:') ? url.replace('emoji:', '') : '🐱';
});
const avatarStyle = computed(() => {
  const url = auth.user?.avatar_url;
  if (!url || url.startsWith('emoji:')) return {};
  return { backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center' };
});

const xp = ref(null);
const level = ref(null);
function handleProgressUpdated(event) {
  const nextXp = event.detail?.xp ?? event.detail?.total_xp;
  const nextLevel = event.detail?.level ?? event.detail?.current_level;
  if (nextXp === undefined) return;
  xp.value = nextXp;
  level.value = nextLevel ?? level.value;
}
onMounted(() => window.addEventListener('peaceflow:progress-updated', handleProgressUpdated));
onBeforeUnmount(() => window.removeEventListener('peaceflow:progress-updated', handleProgressUpdated));

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width, 240px);
  background: var(--warm-white);
  border-right: 2px solid var(--kraft-light);
  z-index: 200;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(74, 55, 40, 0.05);
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 20px;
  border-bottom: 2px dashed var(--kraft-light);
  margin-bottom: 16px;
  text-decoration: none;
}
.logo-icon {
  width: 38px; height: 38px; background: var(--mint); border-radius: 10px;
  border: 2px solid var(--mint-dark); display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; box-shadow: 2px 2px 0 var(--mint-dark);
}
.logo-text { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }
.logo-text span { color: var(--mint-dark); }
.sidebar-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: var(--radius-sm); text-decoration: none; color: var(--text-secondary);
  font-weight: 600; font-size: 0.88rem; transition: var(--transition);
}
.nav-item:hover { background: var(--mint-light); color: var(--text-primary); }
.nav-item.active { background: var(--mint-light); color: var(--text-primary); border: 1.5px solid var(--mint); }
.nav-item .ni { font-size: 1.1rem; width: 22px; text-align: center; }
.nav-section-label {
  font-size: 0.68rem; font-weight: 700; color: var(--text-light);
  text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 12px 4px;
}
.sidebar-bottom { padding: 12px; border-top: 2px dashed var(--kraft-light); margin-top: auto; }
.notif-bell-btn {
  display: flex; align-items: center; gap: 8px; width: 100%; background: none;
  border: 1.5px solid var(--kraft-light); border-radius: var(--radius-sm); padding: 9px 12px;
  cursor: pointer; margin-bottom: 8px; font-family: inherit; color: var(--text-secondary);
  font-size: 0.85rem; font-weight: 600;
}
.notif-badge {
  display: flex; position: absolute; top: -4px; right: -6px; background: var(--coral);
  color: white; font-size: 0.55rem; font-weight: 800; width: 14px; height: 14px;
  border-radius: 50%; align-items: center; justify-content: center;
}
.user-card-mini {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: var(--cream); border-radius: var(--radius-sm); border: 1.5px solid var(--kraft-light);
}
.user-avatar-mini {
  width: 36px; height: 36px; border-radius: 50%; background: var(--lavender-light);
  border: 2px solid var(--kraft); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.user-info-mini .user-name { font-size: 0.85rem; font-weight: 700; }
.user-info-mini .user-level { font-size: 0.72rem; color: var(--text-light); }
.tag-expert {
  font-size: 0.6rem; font-weight: 800; background: var(--mint); color: var(--text-white);
  padding: 1px 6px; border-radius: 6px; border: 1px solid var(--mint-dark); white-space: nowrap;
}
.tag-admin {
  font-size: 0.6rem; font-weight: 800; background: var(--coral); color: #fff;
  padding: 1px 6px; border-radius: 6px; border: 1px solid var(--coral-dark); white-space: nowrap;
}
.emergency-btn {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: rgba(255, 139, 139, 0.1); border: 1.5px solid var(--coral); border-radius: var(--radius-sm);
  color: var(--coral); font-size: 0.78rem; font-weight: 700; cursor: pointer; margin-top: 8px;
  transition: var(--transition); text-decoration: none;
}
@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; }
  .sidebar.open { transform: translateX(0); }
}
</style>
