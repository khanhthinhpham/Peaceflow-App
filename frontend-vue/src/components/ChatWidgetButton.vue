<template>
  <button type="button" class="chat-widget-btn" data-chat-widget-btn @click="chat.toggleDropdown()">
    💬
    <span v-if="chat.totalUnread > 0" class="chat-widget-badge">{{ Math.min(chat.totalUnread, 9) }}</span>
  </button>
</template>

<script setup>
import { useChatWidgetStore } from '../stores/chatWidget';

const chat = useChatWidgetStore();
</script>

<style scoped>
.chat-widget-btn {
  position: fixed;
  top: 30px;
  right: 16px;
  z-index: 250;
  /* Match the 45px rendered height of the Check-in / Emergency pill actions. */
  width: 45px;
  height: 45px;
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
.chat-widget-btn:hover {
  background: var(--mint-light);
  border-color: var(--mint);
}
.chat-widget-badge {
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
  .chat-widget-btn {
    display: none !important;
  }
}
</style>
