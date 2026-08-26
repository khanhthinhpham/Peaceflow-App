<template>
  <div class="mobile-topbar">
    <button class="mobile-menu-btn" @click="$emit('toggle-sidebar')">☰</button>
    <router-link to="/" style="display:flex;align-items:center;gap:8px;text-decoration:none;flex:1;">
      <div style="width:32px;height:32px;background:var(--mint);border-radius:8px;border:2px solid var(--mint-dark);display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:2px 2px 0px var(--mint-dark);">🌿</div>
      <span style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">Peace<span style="color:var(--mint-dark);">Flow</span></span>
    </router-link>
    <button data-notif-bell style="position:relative;background:none;border:none;cursor:pointer;font-size:1.3rem;padding:6px;line-height:1;flex-shrink:0;" @click="notif.togglePanel()">
      🔔
      <span v-if="notif.unread > 0" class="notif-badge">{{ Math.min(notif.unread, 9) }}</span>
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
}
.notif-badge {
  display: flex; position: absolute; top: -2px; right: -4px; background: var(--coral);
  color: white; font-size: 0.6rem; font-weight: 800; width: 16px; height: 16px;
  border-radius: 50%; align-items: center; justify-content: center;
}
@media (max-width: 900px) {
  .mobile-topbar { display: flex; }
}
</style>
