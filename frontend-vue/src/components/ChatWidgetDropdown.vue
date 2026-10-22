<template>
  <div v-if="chat.dropdownOpen" ref="panelEl" class="chat-widget-dropdown">
    <div class="cwd-header">
      <span>{{ t('messages.title') }}</span>
      <button class="cwd-close" @click="chat.closeDropdown()" aria-label="Đóng">✕</button>
    </div>
    <div v-if="chat.loading" class="cwd-empty">...</div>
    <div v-else-if="!chat.conversations.length" class="cwd-empty">{{ t('messages.listEmpty') }}</div>
    <button
      v-for="c in chat.conversations"
      :key="c.id"
      type="button"
      class="cwd-item"
      @click="chat.openWindow(c)"
    >
      <div class="cwd-avatar">{{ c.avatar }}</div>
      <div class="cwd-info">
        <div class="cwd-name">{{ c.name }}</div>
        <div class="cwd-preview">{{ c.last_message_preview || '' }}</div>
      </div>
      <div v-if="c.unread_count > 0" class="cwd-badge">{{ c.unread_count }}</div>
    </button>
    <router-link :to="{ name: 'messages' }" class="cwd-footer" @click="chat.closeDropdown()">{{ t('messages.viewAll') }}</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatWidgetStore } from '../stores/chatWidget';

const { t } = useI18n();
const chat = useChatWidgetStore();
const panelEl = ref(null);

function handleOutsideClick(event) {
  if (!chat.dropdownOpen) return;
  if (panelEl.value && panelEl.value.contains(event.target)) return;
  if (event.target.closest('[data-chat-widget-btn]')) return;
  chat.closeDropdown();
}

onMounted(() => document.addEventListener('click', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick));
</script>

<style scoped>
.chat-widget-dropdown {
  position: fixed;
  top: 68px;
  right: 16px;
  z-index: 250;
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: var(--warm-white);
  border: 2px solid var(--kraft-light);
  border-radius: 16px;
  box-shadow: 4px 4px 0px rgba(74, 55, 40, 0.12);
}
.cwd-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--kraft-light);
  font-weight: 800;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cwd-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-secondary);
}
.cwd-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.82rem;
}
.cwd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--kraft-light);
}
.cwd-item:hover {
  background: var(--mint-light);
}
.cwd-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--lavender-light);
  border: 1.5px solid var(--kraft-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.cwd-info {
  flex: 1;
  min-width: 0;
}
.cwd-name {
  font-size: 0.85rem;
  font-weight: 700;
}
.cwd-preview {
  font-size: 0.72rem;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cwd-badge {
  background: var(--coral);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}
.cwd-footer {
  display: block;
  padding: 10px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--mint-dark);
  font-weight: 700;
  text-decoration: none;
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .chat-widget-dropdown {
    display: none !important;
  }
}
</style>
