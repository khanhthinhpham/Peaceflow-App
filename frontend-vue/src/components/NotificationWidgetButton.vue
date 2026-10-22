<template>
  <button type="button" class="notif-widget-btn" data-notif-bell @click="notif.togglePanel()">
    🔔
    <span v-if="notif.unread > 0" class="notif-widget-badge">{{ Math.min(notif.unread, 9) }}</span>
  </button>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications';

const notif = useNotificationsStore();
</script>

<style scoped>
.notif-widget-btn {
  position: fixed;
  top: 16px;
  right: 68px;
  z-index: 250;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--kraft-light, #e8cba7);
  background: var(--warm-white);
  box-shadow: 2px 2px 0px rgba(74, 55, 40, 0.12);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notif-widget-btn:hover {
  background: var(--mint-light);
  border-color: var(--mint);
}
.notif-widget-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--coral);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .notif-widget-btn {
    display: none !important;
  }
}
</style>
