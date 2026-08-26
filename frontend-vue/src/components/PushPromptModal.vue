<template>
  <div v-if="notif.showPushPrompt" class="push-prompt">
    <div class="push-prompt-body">
      <div class="push-prompt-emoji">🔔</div>
      <div style="flex:1;">
        <div class="push-prompt-title">Bật nhắc nhở hàng ngày?</div>
        <div class="push-prompt-desc">PeaceFlow sẽ nhắc check-in tâm trạng và cảnh báo khi streak sắp mất.</div>
        <div class="push-prompt-actions">
          <button class="push-prompt-yes" @click="notif.acceptPushPrompt()">Bật thông báo</button>
          <button class="push-prompt-no" @click="notif.dismissPushPrompt()">Để sau</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications';

const notif = useNotificationsStore();
</script>

<style scoped>
.push-prompt {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: calc(100% - 48px);
  max-width: 360px;
  background: var(--warm-white, #faf8f4);
  border: 2px solid var(--kraft-light, #e8ddd0);
  border-radius: 16px;
  box-shadow: 4px 4px 0px rgba(74, 55, 40, 0.12);
  padding: 20px;
  animation: fadeIn .3s ease;
}
.push-prompt-body { display: flex; gap: 12px; align-items: flex-start; }
.push-prompt-emoji { font-size: 2rem; line-height: 1; }
.push-prompt-title { font-weight: 800; font-size: 0.9rem; color: var(--text-primary, #2d1f14); margin-bottom: 4px; }
.push-prompt-desc { font-size: 0.8rem; color: var(--text-secondary, #8b7355); margin-bottom: 12px; }
.push-prompt-actions { display: flex; gap: 8px; }
.push-prompt-yes { flex: 1; padding: 8px; background: var(--mint-dark, #4a9e8e); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
.push-prompt-no { padding: 8px 14px; background: none; border: 1.5px solid var(--kraft-light, #e8ddd0); border-radius: 8px; font-size: 0.82rem; cursor: pointer; color: var(--text-secondary, #8b7355); }
@keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
</style>
