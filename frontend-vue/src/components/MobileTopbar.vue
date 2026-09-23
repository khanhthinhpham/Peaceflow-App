<template>
  <div class="mobile-topbar">
    <div class="mobile-topbar-inner">
      <button class="mobile-menu-btn" @click="$emit('toggle-sidebar')">☰</button>
      <router-link to="/" style="display:flex;align-items:center;gap:8px;text-decoration:none;flex:1;margin-left:14px;">
        <div style="width:32px;height:32px;background:var(--mint);border-radius:8px;border:2px solid var(--mint-dark);display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:2px 2px 0px var(--mint-dark);">🌿</div>
        <span style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">Peace<span style="color:var(--mint-dark);">Flow</span></span>
      </router-link>
      <button class="notif-bell-btn" data-notif-bell @click="notif.togglePanel()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span v-if="notif.unread > 0" class="notif-badge">{{ Math.min(notif.unread, 9) }}</span>
      </button>
    </div>
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
  /* padding-top che phần status bar/tai thỏ khi chạy trong app mobile (Capacitor) — trên
     web thường env(safe-area-inset-top) = 0px nên không đổi gì. */
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--warm-white);
  border-bottom: 2px solid var(--kraft-light);
  z-index: 300;
}
.mobile-topbar-inner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 0px;
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
.notif-badge {
  display: flex; position: absolute; top: -3px; right: -3px; background: var(--coral);
  color: white; font-size: 0.6rem; font-weight: 800; width: 16px; height: 16px;
  border-radius: 50%; border: 2px solid var(--warm-white);
  align-items: center; justify-content: center;
}
@media (max-width: 900px) {
  .mobile-topbar { display: block; }
}
</style>
