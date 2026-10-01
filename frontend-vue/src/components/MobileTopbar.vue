<template>
  <div class="mobile-topbar">
    <div class="mobile-topbar-inner">
      <button v-if="!sidebarOpen" class="mobile-menu-btn" @click="$emit('toggle-sidebar')">☰</button>
      <div class="mobile-topbar-right">
        <button class="notif-bell-btn" data-notif-bell @click="notif.togglePanel()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notif.unread > 0" class="notif-badge">{{ Math.min(notif.unread, 9) }}</span>
        </button>
        <router-link to="/emergency" class="sos-btn" :title="t('sidebar.emergencySupport')">SOS</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useNotificationsStore } from '../stores/notifications';

defineProps({ sidebarOpen: { type: Boolean, default: false } });
defineEmits(['toggle-sidebar']);
const { t } = useI18n();
const notif = useNotificationsStore();
</script>

<style scoped>
/* Thả nổi trực tiếp lên nội dung trang (không còn nền/viền của 1 thanh riêng, không còn
   logo) — từng nút (☰, chuông, SOS) tự có nền/bóng riêng để luôn đọc được dù nội dung phía
   sau là gì. */
.mobile-topbar {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  padding-top: env(safe-area-inset-top, 0px);
  z-index: 300;
  pointer-events: none;
}
.mobile-topbar-inner {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  pointer-events: none;
}
.mobile-topbar-inner > * {
  pointer-events: auto;
}
.mobile-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--text-primary);
  flex-shrink: 0;
}
.notif-bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: var(--cream);
  border: 1.5px solid var(--kraft-light);
  border-radius: var(--radius-full);
  color: var(--mint-dark);
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 2px 2px 0px rgba(74, 55, 40, 0.15);
  transition: var(--transition);
}
.notif-bell-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px rgba(74, 55, 40, 0.15);
}
.sos-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: var(--coral);
  border: 1.5px solid var(--coral-dark, var(--coral));
  border-radius: var(--radius-full);
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  text-decoration: none;
  flex-shrink: 0;
  transition: var(--transition);
}
.sos-btn:active {
  transform: translate(1px, 1px);
  background: var(--coral-dark, var(--coral));
}
.notif-badge {
  display: flex; position: absolute; top: -3px; right: -3px; background: var(--coral);
  color: white; font-size: 0.6rem; font-weight: 800; width: 16px; height: 16px;
  border-radius: 50%; border: 2px solid var(--warm-white);
  align-items: center; justify-content: center;
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .mobile-topbar { display: block; }
}
</style>
