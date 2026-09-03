<template>
  <div class="admin-body">
    <div v-if="sidebarOpen" id="adminSidebarOverlay" class="sidebar-overlay admin-sidebar-overlay open" @click="sidebarOpen = false"></div>
    <AdminMobileTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <AdminSidebar :sidebar-open="sidebarOpen" />

    <div id="adminPageHost">
      <router-view v-if="ready" />
    </div>

    <NotificationPanel />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminSidebar from '../components/AdminSidebar.vue';
import AdminMobileTopbar from '../components/AdminMobileTopbar.vue';
import NotificationPanel from '../components/NotificationPanel.vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { useAdminBadgesStore } from '../stores/adminBadges';
import { apiClient } from '../lib/apiClient';
import '../assets/admin.css';

const sidebarOpen = ref(false);
const ready = ref(false);
const route = useRoute();
const router = useRouter();
watch(() => route.fullPath, () => { sidebarOpen.value = false; });

const auth = useAuthStore();
const notif = useNotificationsStore();
const adminBadges = useAdminBadgesStore();

// Giống ensureAdminLiveBadges() ở bản gốc — badge trên sidebar tự cập nhật ngay khi có
// thông báo liên quan (lịch hẹn mới, bài viết bị báo cáo...) mà không cần chuyển trang.
async function refreshAdminBadges() {
  try {
    const o = await apiClient.get('/admin/overview', { noCache: true });
    adminBadges.setBadge('experts', o.pending_expert_applications);
    adminBadges.setBadge('payments', o.pending_payment_bookings);
    adminBadges.setBadge('community', o.reported_community_posts);
  } catch (_e) { /* ignore */ }
}

onMounted(async () => {
  const authenticated = await auth.waitForAuth();
  if (!authenticated) {
    router.replace('/login');
    return;
  }
  if (auth.user?.role !== 'admin' && !auth.user?.is_admin) {
    router.replace('/dashboard');
    return;
  }
  ready.value = true;
  notif.init();
  window.addEventListener('peaceflow:booking-changed', refreshAdminBadges);
});

onBeforeUnmount(() => {
  window.removeEventListener('peaceflow:booking-changed', refreshAdminBadges);
});
</script>

<style scoped>
.admin-body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 203, 164, 0.18), transparent 26%),
    radial-gradient(circle at bottom right, rgba(168, 213, 186, 0.18), transparent 30%),
    var(--cream);
  color: var(--text-primary);
}
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(74, 55, 40, 0.3);
  z-index: 150;
}
.sidebar-overlay.open { display: block; }
#adminPageHost {
  margin-left: var(--sidebar-width, 240px);
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
@media (max-width: 860px) {
  #adminPageHost { margin-left: 0; padding-top: calc(60px + env(safe-area-inset-top, 0px)); }
}
</style>
