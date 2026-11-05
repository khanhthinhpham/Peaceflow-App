<template>
  <div v-if="chat.dropdownOpen" ref="panelEl" class="chat-widget-dropdown" :class="{ 'is-docked': rail.docked }">
    <div class="cwd-header">
      <span>{{ t('messages.title') }}</span>
      <button class="cwd-close" @click="chat.closeDropdown()" :aria-label="t('common.close')"><NavIcon name="close" /></button>
    </div>
    <div class="cwd-search-wrap">
      <NavIcon name="search" class="cwd-search-icon" />
      <input v-model="search" type="text" class="cwd-search" :placeholder="t('messages.searchPlaceholder')">
    </div>
    <div v-if="chat.loading && !chat.conversations.length" class="cwd-empty">...</div>
    <div v-else-if="!chat.conversations.length" class="cwd-empty">{{ t('messages.listEmpty') }}</div>
    <div v-else-if="!filteredConversations.length" class="cwd-empty">{{ t('messages.searchEmpty') }}</div>
    <button
      v-for="c in filteredConversations"
      :key="c.id"
      type="button"
      class="cwd-item"
      @click="chat.openWindow(c)"
    >
      <div class="cwd-avatar">
        <img v-if="avatarUrls[c.id] || c.clientAvatarUrl" :src="avatarUrls[c.id] || c.clientAvatarUrl" alt="">
        <template v-else>{{ c.avatar }}</template>
      </div>
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { getExpertAvatarUrl } from '../lib/expertAvatars';
import { useChatWidgetStore } from '../stores/chatWidget';
import NavIcon from './NavIcon.vue';
import { useRightRailStore } from '../stores/rightRail';

const { t } = useI18n();
const chat = useChatWidgetStore();
const rail = useRightRailStore();
const panelEl = ref(null);
const search = ref('');

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return chat.conversations;
  return chat.conversations.filter((c) => (c.name || '').toLowerCase().includes(q));
});

// Ảnh thật của chuyên gia (nếu đã upload) thay cho emoji — cùng cách tải blob có Bearer
// token như ExpertsView.vue dùng cho danh sách chuyên gia.
const avatarUrls = reactive({});
async function loadAvatars(list) {
  await Promise.all(list.filter((c) => c.expertId && c.hasAvatarPhoto && !avatarUrls[c.id]).map(async (c) => {
    try {
      avatarUrls[c.id] = await getExpertAvatarUrl(c.expertId); // dùng chung, không tải lại
    } catch (_err) { /* giữ nguyên emoji mặc định */ }
  }));
}
watch(() => chat.conversations, (list) => loadAvatars(list), { immediate: true });

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
  top: calc(62px + var(--rail-shift, 0px));
  right: 34px;
  z-index: 260;
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  border: none;
  border-radius: 12px 0 12px 12px;
  background: var(--color-surface, #FFFDF7);
  box-shadow: -6px 8px 24px rgba(55, 58, 52, 0.10);
}
/* Đồng bộ với khung Thông báo (NotificationPanel): không gạch chia, token dashboard. */
.chat-widget-dropdown { font-family: var(--font-body, inherit); padding-bottom: 6px; }
.cwd-header {
  padding: 14px 12px 6px 18px;
  font-family: var(--font-heading, inherit);
  font-weight: 800;
  font-size: 16px;
  color: var(--color-text, var(--text-primary));
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cwd-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-muted, var(--text-secondary));
}
.cwd-close:hover { background: var(--color-canvas, var(--cream)); color: var(--color-text, var(--text-primary)); }
.cwd-close .nav-icon { width: 18px; height: 18px; }
.cwd-empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted, var(--text-secondary));
  font-size: 13px;
}
.cwd-search-wrap {
  position: relative;
  padding: 6px 12px 8px;
}
.cwd-search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--color-text-subtle, var(--text-light));
  pointer-events: none;
}
.cwd-search {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: none;
  border-radius: var(--radius-control, 10px);
  background: var(--color-canvas, var(--cream));
  color: var(--color-text, var(--text-primary));
  font-family: var(--font-body, inherit);
  font-size: 13px;
  outline: none;
}
.cwd-search:focus { box-shadow: 0 0 0 2px var(--color-brand-soft, var(--mint-light)); }
.cwd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% - 16px);
  margin: 0 8px;
  padding: 10px;
  border: none;
  border-radius: var(--radius-control, 10px);
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.cwd-item:hover { background: var(--color-canvas, var(--cream)); }
.cwd-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-brand-soft, var(--mint-light));
  color: var(--color-brand, var(--mint-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  overflow: hidden;
}
.cwd-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cwd-info {
  flex: 1;
  min-width: 0;
}
.cwd-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, var(--text-primary));
}
.cwd-preview {
  font-size: 13px;
  color: var(--color-text-muted, var(--text-light));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cwd-badge {
  background: var(--color-danger, var(--coral));
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}
.cwd-footer {
  display: block;
  padding: 8px 10px 4px;
  text-align: center;
  font-size: 13px;
  color: var(--color-brand, var(--mint-dark));
  font-weight: 600;
  text-decoration: none;
}
.cwd-footer:hover { text-decoration: underline; text-underline-offset: 2px; }
/* Gắn vào panel phải của trang Tổng quan: mở ngay dưới hàng nút, bo đủ 4 góc. */
@media (min-width: 1101px) {
  .chat-widget-dropdown.is-docked { top: 64px; right: 16px; border-radius: 12px; }
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .chat-widget-dropdown {
    display: none !important;
  }
}
</style>
