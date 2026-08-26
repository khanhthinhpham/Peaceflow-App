<template>
  <div class="mobile-topbar expert-mobile-topbar">
    <button type="button" class="mobile-menu-btn" aria-label="Mở menu chuyên gia" @click="$emit('toggle-sidebar')">☰</button>
    <router-link :to="{ name: 'expert-dashboard' }" class="expert-mobile-brand" aria-label="Về tổng quan chuyên gia">
      <div class="logo-icon">🌿</div>
      <div class="expert-mobile-brand-text">
        <span class="expert-mobile-brand-name">Peace<span>Flow</span></span>
        <span class="expert-mobile-brand-role">Chuyên gia</span>
      </div>
    </router-link>
    <button type="button" class="expert-mobile-notif-btn" aria-label="Mở thông báo" @click="notif.togglePanel()">
      <span class="expert-mobile-notif-icon" aria-hidden="true">
        🔔
        <span class="expert-mobile-bell-badge" :class="{ show: notif.unread > 0 }">{{ Math.min(notif.unread, 9) }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications';

defineEmits(['toggle-sidebar']);
const notif = useNotificationsStore();
</script>

<style scoped>
.mobile-topbar {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px;
  background: var(--warm-white);
  border-bottom: 2px solid var(--kraft-light);
  z-index: 300;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 10px;
}
.mobile-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 1.3rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--text-primary);
}
.expert-mobile-bell-badge.show {
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 1180px) {
  .mobile-topbar { display: flex; }
}
</style>
