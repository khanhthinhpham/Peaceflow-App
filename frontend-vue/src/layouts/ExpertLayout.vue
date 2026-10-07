<template>
  <div class="expert-portal">
    <ExpertMobileTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <ExpertSidebar :sidebar-open="sidebarOpen" />
    <div v-if="sidebarOpen" class="sidebar-overlay expert-sidebar-overlay open" @click="sidebarOpen = false"></div>

    <div id="expertPageHost">
      <router-view v-if="ready" />
    </div>

    <NotificationPanel />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExpertSidebar from '../components/ExpertSidebar.vue';
import ExpertMobileTopbar from '../components/ExpertMobileTopbar.vue';
import NotificationPanel from '../components/NotificationPanel.vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { useExpertBadgesStore } from '../stores/expertBadges';
import { apiClient } from '../lib/apiClient';
import '../assets/expertPortal.css';

const sidebarOpen = ref(false);
const ready = ref(false);
const route = useRoute();
const router = useRouter();
watch(() => route.fullPath, () => { sidebarOpen.value = false; });

const auth = useAuthStore();
const notif = useNotificationsStore();
const expertBadges = useExpertBadgesStore();

// Tải độc lập ở layout (không phải trong ExpertDashboardView) để số hiện đúng trên sidebar
// dù đang đứng ở tab nào khác (Hồ sơ thân chủ, Thanh toán...), không chỉ lúc mở Tổng quan.
async function refreshPendingBookingsBadge() {
  try {
    const data = await apiClient.get('/expert-portal/bookings', { noCache: true });
    const list = Array.isArray(data) ? data : [];
    expertBadges.setBadge('pendingBookings', list.filter((b) => b.status === 'awaiting_expert').length);
  } catch (_e) {
    // Im lặng bỏ qua — badge chỉ là gợi ý phụ, không được làm hỏng cả trang nếu lỗi.
  }
}

onMounted(async () => {
  const authenticated = await auth.waitForAuth();
  if (!authenticated) {
    router.replace('/login');
    return;
  }
  if (auth.user?.role !== 'expert') {
    router.replace('/dashboard');
    return;
  }

  ready.value = true;
  notif.init();
  refreshPendingBookingsBadge();
  // notifications.js dispatch sự kiện này mỗi khi có booking_new/booking_update qua realtime
  // (xem _startRealtime trong stores/notifications.js) — cùng sự kiện ExpertDashboardView.vue
  // đã dùng để tự load lại danh sách lịch hẹn của nó.
  window.addEventListener('peaceflow:booking-changed', refreshPendingBookingsBadge);
});

onBeforeUnmount(() => {
  window.removeEventListener('peaceflow:booking-changed', refreshPendingBookingsBadge);
});
</script>
