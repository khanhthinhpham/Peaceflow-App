<template>
  <div v-if="notif.panelOpen" ref="panelEl" class="notif-panel">
    <template v-if="!notif.notifications.length">
      <div class="notif-panel-header">
        <span>Thông báo</span>
        <button class="notif-panel-close" @click="notif.closePanel()" aria-label="Đóng thông báo">✕</button>
      </div>
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <div class="notif-empty-text">Không có thông báo nào</div>
      </div>
    </template>
    <template v-else>
      <div class="notif-panel-header">
        <span>Thông báo</span>
        <button class="notif-panel-close" @click="notif.closePanel()" aria-label="Đóng thông báo">✕</button>
      </div>
      <a
        v-for="n in notif.notifications"
        :key="n.id"
        href="#"
        class="notif-item"
        @click.prevent="handleItemClick(n)"
      >
        <div class="notif-item-icon">{{ n.icon }}</div>
        <div>
          <div class="notif-item-title">{{ n.title }}</div>
          <div class="notif-item-body">{{ n.body }}</div>
        </div>
      </a>
    </template>
    <div v-if="!notif._isPushGranted()" class="notif-panel-footer">
      <button @click="notif.requestPush(); notif.closePanel();">🔔 Bật thông báo push để nhận nhắc nhở</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications';
import { goToLegacyPage, resolveAppRedirect } from '../lib/legacyApp';

const notif = useNotificationsStore();
const panelEl = ref(null);
const router = useRouter();

function handleItemClick(n) {
  notif.closePanel();
  const dest = notif.actionFor(n);
  if (!dest || dest === '#') return;
  const resolved = resolveAppRedirect(dest);
  if (resolved.internal) router.push(resolved.path);
  else goToLegacyPage(dest);
}

function handleOutsideClick(event) {
  if (!notif.panelOpen) return;
  if (panelEl.value && panelEl.value.contains(event.target)) return;
  if (event.target.closest('[data-notif-bell]')) return;
  notif.closePanel();
}

onMounted(() => document.addEventListener('click', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick));
</script>

<style scoped>
.notif-panel {
  position: fixed;
  top: 68px;
  right: 12px;
  z-index: 9999;
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: var(--warm-white);
  border: 2px solid var(--kraft-light);
  border-radius: 16px;
  box-shadow: 4px 4px 0px rgba(74, 55, 40, 0.12);
}
.notif-empty { padding: 24px; text-align: center; color: var(--text-secondary); }
.notif-empty-icon { font-size: 2rem; margin-bottom: 8px; }
.notif-empty-text { font-size: 0.88rem; }
.notif-panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--kraft-light);
  font-weight: 800;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.notif-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  line-height: 1;
}
.notif-panel-close:active { color: var(--text-primary); }
@media (max-width: 640px) {
  .notif-panel {
    left: 12px;
    right: 12px;
    width: auto;
  }
}
.notif-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--kraft-light);
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}
.notif-item:hover { background: var(--cream); }
.notif-item-icon { font-size: 1.5rem; flex-shrink: 0; }
.notif-item-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.notif-item-body { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.notif-panel-footer { padding: 10px 16px; text-align: center; border-top: 1px solid var(--kraft-light); }
.notif-panel-footer button { font-size: 0.78rem; color: var(--mint-dark); background: none; border: none; cursor: pointer; font-weight: 600; }
</style>
