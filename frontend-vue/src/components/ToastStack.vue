<template>
  <div class="toast-stack">
    <div
      v-for="toast in notif.toasts"
      :key="toast.id"
      class="notif-toast"
      @click="handleClick(toast)"
    >
      <div class="notif-toast-icon">{{ toast.icon }}</div>
      <div class="notif-toast-body">
        <div class="notif-toast-title">{{ toast.title }}</div>
        <div class="notif-toast-text">{{ toast.body }}</div>
      </div>
      <button class="notif-toast-close" @click.stop="notif.dismissToast(toast.id)">✕</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications';
import { goToLegacyPage, resolveAppRedirect } from '../lib/legacyApp';

const notif = useNotificationsStore();
const router = useRouter();

function handleClick(toast) {
  const dest = notif.actionFor(toast);
  notif.dismissToast(toast.id);
  if (!dest || dest === '#') return;
  const resolved = resolveAppRedirect(dest);
  if (resolved.internal) router.push(resolved.path);
  else goToLegacyPage(dest);
}
</script>

<style scoped>
.toast-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notif-toast {
  max-width: 300px;
  min-width: 220px;
  background: var(--warm-white, #faf8f4);
  border: 2px solid var(--kraft-light, #e8ddd0);
  border-radius: 14px;
  box-shadow: 4px 4px 0px rgba(74, 55, 40, 0.15);
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  animation: toastIn .3s ease;
}
.notif-toast-icon { font-size: 1.4rem; flex-shrink: 0; line-height: 1.2; }
.notif-toast-body { flex: 1; min-width: 0; }
.notif-toast-title { font-weight: 800; font-size: 0.82rem; color: var(--text-primary, #2d1f14); margin-bottom: 2px; }
.notif-toast-text { font-size: 0.75rem; color: var(--text-secondary, #8b7355); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-toast-close { background: none; border: none; cursor: pointer; color: var(--text-secondary, #8b7355); font-size: 1rem; line-height: 1; padding: 0; flex-shrink: 0; }
@keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
</style>
