<template>
  <aside class="expert-sidebar sidebar" :class="{ open: sidebarOpen }">
    <router-link :to="{ name: 'expert-dashboard' }" class="sidebar-logo">
      <div class="logo-icon">🌿</div>
      <div class="logo-text">Peace<span>Flow</span></div>
    </router-link>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Quản lý</div>
      <router-link
        v-for="item in NAV_ITEMS"
        :key="item.key"
        :to="{ name: item.route }"
        class="nav-item expert-shell-link"
        :class="{ active: activeKey === item.key }"
      >
        <span class="ni">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-bottom">
      <div class="user-card-mini" style="margin-bottom:10px;">
        <div class="user-avatar-mini">{{ initials }}</div>
        <div class="user-info-mini" style="min-width:0;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <div class="user-name">{{ displayName }}</div>
            <span style="font-size:0.6rem; font-weight:800; background:var(--mint); color:var(--text-white); padding:1px 6px; border-radius:6px; border:1px solid var(--mint-dark); white-space:nowrap;">Chuyên gia</span>
          </div>
          <div class="user-level" :title="auth.user?.email || ''">{{ auth.user?.email || '' }}</div>
        </div>
      </div>

      <router-link
        to="/dashboard"
        class="nav-item expert-shell-link expert-footer-dashboard-link"
        style="margin-bottom:8px; border:1.5px solid var(--kraft-light); background:var(--warm-white);"
      >
        <span class="ni">🏠</span>
        <span>Về app người dùng</span>
      </router-link>

      <button
        type="button"
        class="nav-item expert-footer-logout-btn"
        style="width:100%; background:rgba(255,179,179,.12); text-align:left; cursor:pointer; font-family:inherit; border:1.5px solid var(--coral); color:var(--coral-dark);"
        @click="handleLogout"
      >
        <span class="ni">🚪</span>
        <span>Đăng xuất</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

defineProps({ sidebarOpen: { type: Boolean, default: false } });

const NAV_ITEMS = [
  { route: 'expert-dashboard', key: 'dashboard', icon: '🏡', label: 'Tổng quan' },
  { route: 'expert-client-assessments', key: 'client-assessments', icon: '🩺', label: 'Đánh giá lâm sàng' },
  { route: 'expert-payments', key: 'payments', icon: '💳', label: 'Thanh toán' },
  { route: 'expert-application', key: 'application', icon: '📋', label: 'Hồ sơ chuyên gia' },
  { route: 'expert-review-status', key: 'review-status', icon: '🧾', label: 'Lịch sử xét duyệt' }
];

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const activeKey = computed(() => route.meta?.navKey || null);
const displayName = computed(() => auth.user?.display_name || auth.user?.full_name || 'PeaceFlow Expert');
const initials = computed(() => {
  const parts = displayName.value.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return chars || 'EX';
});

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>
