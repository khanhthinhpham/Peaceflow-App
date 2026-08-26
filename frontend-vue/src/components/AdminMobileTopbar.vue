<template>
  <div class="mobile-topbar admin-mobile-topbar">
    <button type="button" class="mobile-menu-btn admin-mobile-menu-btn" aria-label="Mở menu quản trị" @click="$emit('toggle-sidebar')">
      <span class="adm-ic" v-html="icon('menu')"></span>
    </button>
    <router-link to="/admin/dashboard" class="admin-mobile-brand" aria-label="Về tổng quan admin">
      <div class="logo-icon admin-mobile-logo-icon"><span v-html="icon('spark')"></span></div>
      <div class="admin-mobile-brand-text">
        <span class="admin-mobile-brand-name">Peace<span>Flow</span></span>
        <span class="admin-mobile-brand-role">Admin Portal</span>
      </div>
    </router-link>
    <button type="button" class="admin-mobile-notif-btn" data-notif-bell aria-label="Mở thông báo admin" @click="notif.togglePanel()">
      <span class="admin-mobile-notif-icon" aria-hidden="true">
        <span v-html="icon('bell')"></span>
        <span v-if="notif.unread > 0" class="admin-bell-badge admin-mobile-bell-badge show">{{ Math.min(notif.unread, 9) }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications';
import { icon } from '../lib/adminIcons';

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
.admin-mobile-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 1.3rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--text-primary);
}
.admin-mobile-bell-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 860px) {
  .mobile-topbar { display: flex; }
}
</style>
