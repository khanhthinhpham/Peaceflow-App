<template>
  <div v-if="notif.panelOpen" ref="panelEl" class="notif-panel" :class="{ 'is-docked': rail.docked }">
    <template v-if="!notif.notifications.length">
      <div class="notif-panel-header">
        <span>{{ t('notifPanel.title') }}</span>
        <button class="notif-panel-close" @click="notif.closePanel()" :aria-label="t('notifPanel.closeAria')"><NavIcon name="close" /></button>
      </div>
      <div class="notif-empty">
        <div class="notif-empty-icon"><NavIcon name="bell" /></div>
        <div class="notif-empty-text">{{ t('notifPanel.empty') }}</div>
      </div>
    </template>
    <template v-else>
      <div class="notif-panel-header">
        <span>{{ t('notifPanel.title') }}</span>
        <button class="notif-panel-close" @click="notif.closePanel()" :aria-label="t('notifPanel.closeAria')"><NavIcon name="close" /></button>
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
          <div class="notif-item-icon"><NavIcon :name="notifIcon(n)" /></div>
          <div>
            <!-- n.title/n.body do BACKEND sinh (tổng hợp động, có cả nội dung tự do như tên
                 người bình luận) — chưa nằm trong phạm vi đợt dịch tĩnh này, xem ai.service.js
                 notification.routes.js. Chỉ phần khung xung quanh (tiêu đề panel, nút...) đã
                 dịch ở đây. -->
            <div class="notif-item-title">{{ plainTitle(n.title) }}</div>
            <div class="notif-item-body">{{ n.body }}</div>
            <div class="notif-item-time">{{ formatDateTime(n.created_at) }}</div>
          </div>
        </a>
      </div>
    </template>
    <div v-if="!notif._isPushGranted()" class="notif-panel-footer">
      <button @click="notif.requestPush(); notif.closePanel();">{{ plainTitle(t('notifPanel.enablePush')) }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '../stores/notifications';
import { goToLegacyPage, resolveAppRedirect } from '../lib/legacyApp';
import NavIcon from './NavIcon.vue';
import { useRightRailStore } from '../stores/rightRail';

// Icon đơn sắc thay emoji backend gửi về: theo loại thông báo trước, rồi theo emoji cũ.
const ICON_BY_TYPE = { achievement: 'achievements', booking: 'calendar', reminder: 'bell', warning: 'flame', expert: 'experts' };
const ICON_BY_EMOJI = {
  '📅': 'calendar', '💬': 'messages', '↩️': 'messages', '✅': 'check', '📝': 'journal', '🩺': 'experts',
  '📣': 'megaphone', '📋': 'tests', '❤️': 'heart', '🏅': 'achievements', '🔥': 'flame', '💭': 'mood'
};
function notifIcon(n) {
  return ICON_BY_EMOJI[n?.icon] || ICON_BY_TYPE[n?.type] || 'bell';
}
// Bỏ emoji trang trí đầu tiêu đề (vd "💌 Góc chia sẻ có bài mới").
function plainTitle(title) {
  return String(title || '').replace(/^[^\p{L}\p{N}]+/u, '');
}

const { t, locale } = useI18n();
const notif = useNotificationsStore();
const rail = useRightRailStore();
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
.notif-empty { padding: 24px; text-align: center; color: var(--color-text-muted, var(--text-secondary)); }
.notif-empty-icon { display: flex; justify-content: center; margin-bottom: 8px; color: var(--color-text-subtle, var(--text-light)); }
.notif-empty-icon .nav-icon { width: 32px; height: 32px; }
.notif-empty-text { font-size: 0.88rem; }
.notif-panel-header {
  padding: 14px 12px 6px 18px;
  font-family: var(--font-heading, inherit);
  font-weight: 800;
  font-size: 16px;
  color: var(--color-text, var(--text-primary));
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.notif-panel-close {
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
.notif-panel-close:hover { background: var(--color-canvas, var(--cream)); color: var(--color-text, var(--text-primary)); }
.notif-panel-close .nav-icon { width: 18px; height: 18px; }
/* Desktop: nút chuông nổi (NotificationWidgetButton.vue) nằm ở top:30px, không phải top:68px
   như chuông trong MobileTopbar.vue (<900px) — panel phải mở đúng ngay dưới nút đó. */
@media (min-width: 901px) {
  .notif-panel {
    top: calc(24px + var(--rail-shift, 0px));
    right: 34px;
    border: none;
    border-radius: 12px 0 12px 12px;
    background: var(--color-surface, #FFFDF7);
    box-shadow: -6px 8px 24px rgba(55, 58, 52, 0.10);
  }
}
/* Gắn vào panel phải của trang Tổng quan: mở ngay dưới hàng nút, bo đủ 4 góc. */
@media (min-width: 1101px) {
  .notif-panel.is-docked { top: 64px; right: 16px; border-radius: 12px; }
}
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
  margin: 0 8px;
  border-radius: var(--radius-control, 10px);
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
  padding: 10px;
  border-radius: var(--radius-control, 10px);
  background: var(--color-surface, var(--warm-white));
  text-decoration: none;
  color: inherit;
  transition: background 0.2s, transform 0.25s ease, opacity 0.25s ease;
  touch-action: pan-y;
}
.notif-item:hover { background: var(--color-canvas, var(--cream)); }
.notif-item-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; background: var(--color-brand-soft, var(--mint-light)); color: var(--color-brand, var(--mint-dark)); display: flex; align-items: center; justify-content: center; }
.notif-item-icon .nav-icon { width: 18px; height: 18px; }
.notif-item-title { font-size: 14px; font-weight: 600; color: var(--color-text, var(--text-primary)); }
.notif-item-body { font-size: 13px; color: var(--color-text-muted, var(--text-secondary)); margin-top: 2px; line-height: 1.45; }
.notif-item-time { font-size: 12px; color: var(--color-text-subtle, var(--text-light)); margin-top: 4px; }
.notif-panel { font-family: var(--font-body, inherit); padding-bottom: 8px; }
.notif-panel-footer { padding: 8px 16px 2px; text-align: center; }
.notif-panel-footer button { font-size: 13px; color: var(--color-brand, var(--mint-dark)); background: none; border: none; cursor: pointer; font-weight: 600; }
</style>
