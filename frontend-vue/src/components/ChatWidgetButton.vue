<template>
  <button v-if="!rail.docked" type="button" class="chat-widget-btn" :class="{ 'is-open': chat.dropdownOpen }" :aria-label="t('nav.messages')" data-chat-widget-btn @click="chat.toggleDropdown()">
    <NavIcon name="messages" />
    <span class="rail-label">{{ t('nav.messages') }}</span>
    <span v-if="chat.totalUnread > 0" class="chat-widget-badge">{{ Math.min(chat.totalUnread, 9) }}</span>
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import NavIcon from './NavIcon.vue';
import { useRightRailStore } from '../stores/rightRail';
import { useChatWidgetStore } from '../stores/chatWidget';

const { t } = useI18n();
const rail = useRightRailStore();
const chat = useChatWidgetStore();
</script>

<style scoped>
.chat-widget-btn {
  position: fixed;
  top: calc(62px + var(--rail-shift, 0px));
  right: 0;
  z-index: 250;
  height: 34px;
  padding: 0 9px;
  border: none;
  border-radius: 10px 0 0 10px;
  background: var(--color-surface, #FFFDF7);
  box-shadow: var(--shadow-soft, 0 2px 8px rgba(74, 55, 40, 0.08));
  color: var(--color-text-muted, #6b5a4b);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0;
  font-family: var(--font-body, inherit);
  transition: color 0.2s ease, background-color 0.2s ease, gap 0.2s ease;
}
.chat-widget-btn { animation: rail-tab-in 0.3s ease both; }
@keyframes rail-tab-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.chat-widget-btn:hover,
.chat-widget-btn:focus-visible {
  color: var(--color-brand, #4f7a5a);
  background: var(--color-brand-soft, #eef4ef);
  gap: 8px;
}
.chat-widget-btn.is-open {
  color: var(--color-brand, #4f7a5a);
  background: var(--color-surface, #FFFDF7);
  box-shadow: none;
}
.chat-widget-btn.is-open:hover { gap: 0; }
.chat-widget-btn.is-open:hover .rail-label { max-width: 0; opacity: 0; }
.chat-widget-btn .nav-icon { width: 16px; height: 16px; }
.rail-label {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  font-size: 12px;
  font-weight: 600;
  transition: max-width 0.25s ease, opacity 0.2s ease;
}
.chat-widget-btn:hover .rail-label,
.chat-widget-btn:focus-visible .rail-label { max-width: 160px; opacity: 1; }
.chat-widget-badge {
  position: absolute;
  top: -5px;
  left: -5px;
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
