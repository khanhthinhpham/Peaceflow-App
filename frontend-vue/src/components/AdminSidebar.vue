<template>
  <aside class="sidebar admin-sidebar" :class="{ open: sidebarOpen }">
    <router-link to="/admin/dashboard" class="sidebar-logo">
      <div class="logo-icon">🌿</div>
      <div class="logo-text">Peace<span>Flow</span></div>
    </router-link>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Quản trị</div>
      <router-link
        v-for="item in NAV_ITEMS"
        :key="item.key"
        :to="{ name: item.route }"
        class="nav-item admin-shell-link"
        :class="{ active: activeKey === item.key }"
      >
        <span class="ni" aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="admin-nav-badge" :class="{ show: badges[item.badge] > 0 }">{{ badgeLabel(badges[item.badge]) }}</span>
      </router-link>
    </nav>

    <div class="sidebar-bottom admin-sidebar-bottom">
      <button type="button" class="nav-item admin-footer-link admin-notif-btn" data-notif-bell @click="notif.togglePanel()">
        <span class="ni admin-notif-ico" aria-hidden="true">
          🔔
          <span v-if="notif.unread > 0" class="admin-bell-badge show">{{ Math.min(notif.unread, 9) }}</span>
        </span>
        <span>Thông báo</span>
      </button>

      <div class="user-card-mini admin-user-card">
        <div class="user-avatar-mini admin-user-avatar">{{ initials }}</div>
        <div class="user-info-mini admin-user-meta">
          <div class="admin-user-heading">
            <div class="user-name admin-user-name">{{ displayName }}</div>
            <span class="admin-role-chip">Admin</span>
          </div>
          <div class="user-level admin-user-email">{{ auth.user?.email || '' }}</div>
        </div>
      </div>

      <router-link to="/dashboard" class="nav-item admin-footer-link admin-footer-link-dashboard">
        <span class="ni" aria-hidden="true">🏡</span>
        <span>Về app người dùng</span>
      </router-link>
      <button type="button" class="nav-item admin-footer-link admin-footer-link-danger" @click="handleLogout">
        <span class="ni" aria-hidden="true">🚪</span>
        <span>Đăng xuất</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { useAdminBadgesStore } from '../stores/adminBadges';

defineProps({ sidebarOpen: { type: Boolean, default: false } });

const NAV_ITEMS = [
  { route: 'admin-dashboard', key: 'dashboard', icon: '📊', label: 'Tổng quan' },
  { route: 'admin-experts', key: 'experts', icon: '🧑‍⚕️', label: 'Duyệt chuyên gia', badge: 'experts' },
  { route: 'admin-bookings', key: 'bookings', icon: '📅', label: 'Quản lý lịch hẹn' },
  { route: 'admin-payments', key: 'payments', icon: '💳', label: 'Thanh toán & payout', badge: 'payments' },
  { route: 'admin-users', key: 'users', icon: '👥', label: 'Người dùng' },
  { route: 'admin-assessment-results', key: 'assessment-results', icon: '🧪', label: 'Bài test' },
  { route: 'admin-community', key: 'community', icon: '🛡️', label: 'Kiểm duyệt cộng đồng', badge: 'community' },
  { route: 'admin-ai-usage', key: 'ai-usage', icon: '🤖', label: 'Quản lý AI' }
];

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notif = useNotificationsStore();
const badges = useAdminBadgesStore();

const activeKey = computed(() => route.meta?.navKey || null);
const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || 'Quản trị viên');
const initials = computed(() => {
  const parts = displayName.value.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return chars || 'AD';
});

function badgeLabel(count) {
  const total = Number(count) || 0;
  return total > 99 ? '99+' : String(total);
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>
