import { defineStore } from 'pinia';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from './auth';
import { subscribeNotifications, unsubscribeNotifications } from '../lib/supabaseRealtime';

const VAPID_PUBLIC_KEY = 'BPv-CCXdm5KP7VgrtF2NILO4xIRp2w5zk-BqcCJDoYTKWLHDrSUkhD5ODXJDlyV529vsm78bgPrNXCs0TasYjx0';
let toastIdSeq = 0;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function toastMetaFor(notif) {
  switch (notif?.type) {
    case 'booking_new':
      return { icon: '📅', title: 'Lịch hẹn mới', action: 'expert/app.html?page=dashboard.html' };
    case 'booking_update':
      return { icon: '📅', title: 'Cập nhật lịch hẹn', action: 'experts.html' };
    case 'comment':
      return { icon: '💬', title: 'Bình luận mới', action: 'community.html' };
    case 'expert_approved':
      return { icon: '✅', title: 'Hồ sơ đã được duyệt', action: 'expert/app.html?page=dashboard.html' };
    case 'expert_rejected':
      return { icon: '📋', title: 'Kết quả hồ sơ chuyên gia', action: 'expert/apply.html' };
    default:
      return { icon: '❤️', title: 'Cảm xúc mới', action: 'community.html' };
  }
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    unread: 0,
    panelOpen: false,
    toasts: [],
    showPushPrompt: false,
    _initialized: false
  }),

  actions: {
    async init() {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) return;
      if (this._initialized) return;
      this._initialized = true;

      await this.loadNotifications();
      await this.registerPush();
      this._maybePromptPush();
      this._startRealtime();
    },

    _startRealtime() {
      unsubscribeNotifications();
      subscribeNotifications((notif) => {
        const meta = toastMetaFor(notif);
        const nextNotification = {
          ...notif,
          icon: meta.icon,
          title: meta.title,
          body: notif.message,
          action: meta.action
        };
        if (!this.notifications.some((item) => item.id === nextNotification.id)) {
          this.notifications.unshift(nextNotification);
        }
        this.pushToast({ type: notif.type, icon: meta.icon, title: meta.title, body: notif.message, action: meta.action });
        this.unread++;

        if (notif?.type === 'booking_new' || notif?.type === 'booking_update') {
          window.dispatchEvent(new CustomEvent('peaceflow:booking-changed', { detail: notif }));
        }
      });
    },

    actionFor(notif) {
      if (window.location.pathname.includes('/admin/')) {
        switch (notif?.type) {
          case 'booking_new':
          case 'booking_update':
            return 'app.html?page=payments.html';
          case 'comment':
          case 'community':
            return 'app.html?page=community.html';
          default:
            return 'app.html?page=dashboard.html';
        }
      }
      return notif?.action || '#';
    },

    _maybePromptPush() {
      if (!('Notification' in window)) return;
      if (this._isPushGranted()) return;
      if (Notification.permission === 'denied') return;
      if (localStorage.getItem('push_prompted')) return;

      setTimeout(() => {
        this.showPushPrompt = true;
      }, 3000);
    },

    dismissPushPrompt() {
      this.showPushPrompt = false;
      localStorage.setItem('push_prompted', '1');
    },

    async acceptPushPrompt() {
      this.showPushPrompt = false;
      localStorage.setItem('push_prompted', '1');
      await this.requestPush();
    },

    async loadNotifications() {
      try {
        const data = await apiClient.get('/notifications', { noCache: true });
        this.notifications = Array.isArray(data) ? data : [];
        this.unread = this.notifications.length;
        this._maybeShowToast();
      } catch (_) {
        this.notifications = [];
        this.unread = 0;
      }
    },

    _maybeShowToast() {
      if (!this.notifications.length) return;

      const seenRaw = localStorage.getItem('notif_seen_ids');
      const seenIds = seenRaw ? new Set(JSON.parse(seenRaw)) : null;
      const currentIds = this.notifications.map((n) => n.id);

      localStorage.setItem('notif_seen_ids', JSON.stringify(currentIds));

      if (!seenIds) return;

      const newNotifs = this.notifications.filter((n) => !seenIds.has(n.id));
      if (!newNotifs.length) return;

      newNotifs.forEach((notif, i) => {
        setTimeout(() => this.pushToast(notif), i * 800);
      });
    },

    pushToast(notif) {
      const id = ++toastIdSeq;
      this.toasts.push({ id, ...notif });
      setTimeout(() => this.dismissToast(id), 4000);
    },

    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },

    togglePanel() {
      this.panelOpen = !this.panelOpen;
      if (this.panelOpen) this.unread = 0;
    },

    closePanel() {
      this.panelOpen = false;
    },

    _isPushGranted() {
      return 'Notification' in window && Notification.permission === 'granted';
    },

    async registerPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const swPath = window.location.pathname.includes('/frontend/') ? '/frontend/sw.js' : '/sw.js';
        const reg = await navigator.serviceWorker.register(swPath);
        await navigator.serviceWorker.ready;

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          const s = existing.toJSON();
          await apiClient.post('/notifications/subscribe', { endpoint: s.endpoint, keys: s.keys })
            .catch((err) => console.warn('[Push] Re-save subscription failed:', err));
        }
      } catch (err) {
        console.warn('[Push] registerPush failed:', err);
      }
    },

    async requestPush() {
      if (!('Notification' in window)) {
        alert('Trình duyệt không hỗ trợ push notification.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      try {
        const swPath = window.location.pathname.includes('/frontend/') ? '/frontend/sw.js' : '/sw.js';
        const reg = await navigator.serviceWorker.register(swPath);
        await navigator.serviceWorker.ready;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        const subJson = sub.toJSON();
        await apiClient.post('/notifications/subscribe', { endpoint: subJson.endpoint, keys: subJson.keys });

        new Notification('PeaceFlow 🌿', {
          body: 'Đã bật thông báo! Bạn sẽ nhận nhắc nhở mood check-in hàng ngày.',
          icon: '/favicon.png'
        });
      } catch (err) {
        console.error('Push subscribe failed:', err);
      }
    }
  }
});
