<template>
  <div v-if="notif.panelOpen" ref="panelEl" class="notif-panel">
    <template v-if="!notif.notifications.length">
      <div class="notif-panel-header">
        <span>{{ t('notifPanel.title') }}</span>
        <button class="notif-panel-close" @click="notif.closePanel()" :aria-label="t('notifPanel.closeAria')">✕</button>
      </div>
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <div class="notif-empty-text">{{ t('notifPanel.empty') }}</div>
      </div>
    </template>
    <template v-else>
      <div class="notif-panel-header">
        <span>{{ t('notifPanel.title') }}</span>
        <button class="notif-panel-close" @click="notif.closePanel()" :aria-label="t('notifPanel.closeAria')">✕</button>
      </div>
      <div v-for="n in notif.notifications" :key="n.id" class="notif-item-wrap">
        <div class="notif-item-reveal">{{ t('notifPanel.swipeHide') }}</div>
        <a
          href="#"
          class="notif-item"
          :ref="(el) => setItemRef(n.id, el)"
          @click.prevent="handleItemClick(n)"
          @touchstart="onTouchStart($event, n.id)"
          @touchmove="onTouchMove($event, n.id)"
          @touchend="onTouchEnd($event, n.id)"
          @touchcancel="onTouchCancel(n.id)"
        >
          <div class="notif-item-icon">{{ n.icon }}</div>
          <div>
            <!-- n.title/n.body do BACKEND sinh (tổng hợp động, có cả nội dung tự do như tên
                 người bình luận) — chưa nằm trong phạm vi đợt dịch tĩnh này, xem ai.service.js
                 notification.routes.js. Chỉ phần khung xung quanh (tiêu đề panel, nút...) đã
                 dịch ở đây. -->
            <div class="notif-item-title">{{ n.title }}</div>
            <div class="notif-item-body">{{ n.body }}</div>
            <div class="notif-item-time">{{ formatDateTime(n.created_at) }}</div>
          </div>
        </a>
      </div>
    </template>
    <div v-if="!notif._isPushGranted()" class="notif-panel-footer">
      <button @click="notif.requestPush(); notif.closePanel();">{{ t('notifPanel.enablePush') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications';
import { goToLegacyPage, resolveAppRedirect } from '../lib/legacyApp';

const { t, locale } = useI18n();
const notif = useNotificationsStore();
const panelEl = ref(null);
const router = useRouter();

const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));
function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(intlLocale.value, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

// Vuốt sang trái 1 thông báo để ẩn nó đi. Chỉ thao tác DOM trực tiếp (không qua state Vue)
// lúc đang kéo cho mượt — không re-render mỗi pixel di chuyển.
const SWIPE_HIDE_THRESHOLD = 70;
const itemEls = new Map();
const dragState = new Map();

function setItemRef(id, el) {
  if (el) itemEls.set(id, el);
  else itemEls.delete(id);
}

function handleItemClick(n) {
  // Vừa vuốt xong thì bỏ qua click ngay sau đó (tránh vuốt xong lại bị điều hướng nhầm).
  if (dragState.get(n.id)?.wasSwipe) return;
  notif.closePanel();
  const dest = notif.actionFor(n);
  if (!dest || dest === '#') return;
  const resolved = resolveAppRedirect(dest);
  if (resolved.internal) router.push(resolved.path);
  else goToLegacyPage(dest);
}

function onTouchStart(event, id) {
  dragState.set(id, { startX: event.touches[0].clientX, dx: 0, wasSwipe: false });
}

function onTouchMove(event, id) {
  const state = dragState.get(id);
  const el = itemEls.get(id);
  if (!state || !el) return;
  const dx = event.touches[0].clientX - state.startX;
  if (dx >= 0) return; // chỉ cho vuốt sang trái, kéo phải thì bỏ qua
  state.dx = dx;
  if (Math.abs(dx) > 8) state.wasSwipe = true;
  el.style.transition = 'none';
  el.style.transform = `translateX(${Math.max(dx, -120)}px)`;
}

function onTouchEnd(event, id) {
  const state = dragState.get(id);
  const el = itemEls.get(id);
  if (!state || !el) return;
  el.style.transition = '';
  if (state.dx <= -SWIPE_HIDE_THRESHOLD) {
    el.style.transform = 'translateX(-100%)';
    el.style.opacity = '0';
    setTimeout(() => notif.hideNotification(id), 180);
  } else {
    el.style.transform = '';
  }
}

function onTouchCancel(id) {
  const el = itemEls.get(id);
  if (el) { el.style.transition = ''; el.style.transform = ''; }
  dragState.delete(id);
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
.notif-item-wrap {
  position: relative;
  overflow: hidden;
}
.notif-item-reveal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
  background: var(--coral, #e4572e);
  color: white;
  font-weight: 700;
  font-size: 0.78rem;
}
.notif-item {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: var(--warm-white);
  border-bottom: 1px solid var(--kraft-light);
  text-decoration: none;
  color: inherit;
  transition: background 0.2s, transform 0.25s ease, opacity 0.25s ease;
  touch-action: pan-y;
}
.notif-item:hover { background: var(--cream); }
.notif-item-icon { font-size: 1.5rem; flex-shrink: 0; }
.notif-item-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
.notif-item-body { font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px; }
.notif-item-time { font-size: 0.7rem; color: var(--text-light); margin-top: 4px; }
.notif-panel-footer { padding: 10px 16px; text-align: center; border-top: 1px solid var(--kraft-light); }
.notif-panel-footer button { font-size: 0.78rem; color: var(--mint-dark); background: none; border: none; cursor: pointer; font-weight: 600; }
</style>
