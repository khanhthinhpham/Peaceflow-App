import { defineStore } from 'pinia';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from './auth';
import { subscribeNotifications, unsubscribeNotifications } from '../lib/supabaseRealtime';

const VAPID_PUBLIC_KEY = 'BPv-CCXdm5KP7VgrtF2NILO4xIRp2w5zk-BqcCJDoYTKWLHDrSUkhD5ODXJDlyV529vsm78bgPrNXCs0TasYjx0';
let toastIdSeq = 0;
// Số toast hiển thị cùng lúc. Trước đây không giới hạn nên 5-6 thông báo là xếp chồng
// che kín góc phải màn hình.
const MAX_VISIBLE_TOASTS = 3;
// Số id "đã xem" giữ lại trong localStorage — đủ nhiều để thông báo cũ không bị toast lại,
// vẫn đủ nhỏ để không phình vô hạn.
const MAX_SEEN_IDS = 200;

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

    // Nơi bấm vào một thông báo sẽ dẫn tới.
    //
    // Quyết định theo VAI TRÒ người đang đăng nhập, KHÔNG theo trang đang đứng. Trước đây
    // điều kiện là `window.location.pathname.includes('/admin/')` nên cùng một thông báo,
    // admin bấm từ /admin/payments ra một đường, bấm từ /dashboard lại ra đường khác. Tệ
    // hơn: nhánh đó trả 'app.html?page=payments.html' — 'app.html' không có trong
    // MIGRATED_PAGES nên admin bấm thông báo là bị bật hẳn ra frontend cũ.
    //
    // Backend gửi action theo LOẠI thông báo, không biết người nhận là ai; mà cùng một
    // loại 'booking_update' được gửi cho cả bệnh nhân, chuyên gia và admin (xem
    // expert.routes.js). Nên phần dưới đây chỉnh lại đích cho đúng vai:
    actionFor(notif) {
      const auth = useAuthStore();
      const isAdmin = Boolean(auth.user?.role === 'admin' || auth.user?.is_admin);
      const isExpert = Boolean(auth.user?.is_expert || auth.user?.role === 'expert');
      // Loại từ danh sách tổng hợp là 'booking', từ realtime là 'booking_new'/'booking_update'.
      const type = String(notif?.type || '');
      const isBooking = type.startsWith('booking');

      // Admin: thông báo lịch hẹn/thanh toán gửi cho admin là việc đối chiếu thanh toán
      // ("... báo đã chuyển khoản — cần đối chiếu & xác nhận"), thuộc khu quản trị.
      // CỐ Ý không bắt các loại còn lại: nhắc check-in, streak, huy hiệu, hay bình luận
      // trên bài của chính họ là chuyện cá nhân — admin cũng là người dùng bình thường
      // (is_admin cộng thêm vào role, xem migration 0049), đưa hết về khu quản trị là sai.
      if (isAdmin && isBooking) return '/admin/payments';

      // Chuyên gia: mọi thông báo lịch hẹn đều thuộc khu làm việc của họ. Trước đây
      // 'booking_update' luôn trỏ 'experts.html' nên chuyên gia nhận tin "thân chủ đã huỷ
      // lịch" lại bị đưa tới trang đi TÌM chuyên gia.
      if (isExpert && isBooking) return '/expert/dashboard';

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
        // Đếm theo is_read do server trả về, KHÔNG lấy tổng số. Trước đây lấy tổng nên
        // badge hiện lại nguyên số cũ sau mỗi lần tải trang, dù người dùng đã mở panel.
        this.unread = this.notifications.filter((item) => !item.is_read).length;
        this._maybeShowToast();
      } catch (_) {
        this.notifications = [];
        this.unread = 0;
      }
    },

    _maybeShowToast() {
      if (!this.notifications.length) return;

      const seenRaw = localStorage.getItem('notif_seen_ids');
      let seenIds = null;
      try {
        seenIds = seenRaw ? new Set(JSON.parse(seenRaw)) : null;
      } catch {
        seenIds = null; // localStorage hỏng -> coi như lần đầu, chỉ ghi nhận không toast
      }
      const currentIds = this.notifications.map((n) => n.id);

      // CỘNG DỒN danh sách đã xem, KHÔNG ghi đè bằng lô hiện tại.
      // Trước đây ghi đè nên bất cứ thông báo nào rơi ra khỏi kết quả API rồi quay lại —
      // hoặc có id tổng hợp bị đổi (id lịch hẹn là `booking-${group_key || timestamp}`,
      // đổi theo mốc thời gian mới nhất) — đều bị coi là mới và toast lại. Đó là hiện
      // tượng "vào lại là hiện cả loạt thông báo cũ".
      const merged = [...new Set([...(seenIds || []), ...currentIds])].slice(-MAX_SEEN_IDS);
      localStorage.setItem('notif_seen_ids', JSON.stringify(merged));

      if (!seenIds) return;

      // Bỏ luôn cái server đã báo là đã đọc — vd người dùng đã xem trên máy/thiết bị khác,
      // hoặc thông báo cũ vẫn nằm trong danh sách để xem lại nhưng không còn "mới".
      const newNotifs = this.notifications.filter((n) => !n.is_read && !seenIds.has(n.id));
      if (!newNotifs.length) return;

      // Chỉ toast tối đa MAX_VISIBLE_TOASTS cái; còn lại vẫn nằm trong panel thông báo.
      newNotifs.slice(0, MAX_VISIBLE_TOASTS).forEach((notif, i) => {
        setTimeout(() => this.pushToast(notif), i * 800);
      });
    },

    pushToast(notif) {
      const id = ++toastIdSeq;
      // `id` phải đặt SAU ...notif. Mọi thông báo từ API đều có sẵn trường id
      // ('booking-xxx', 'checkin-reminder'...); để id trước thì nó bị ghi đè, rồi timer
      // tự tắt gọi dismissToast(<số>) trong khi toast mang id <chuỗi> -> filter không
      // khớp gì -> toast KHÔNG BAO GIỜ tự tắt, chỉ tắt được khi người dùng bấm ✕.
      this.toasts.push({ ...notif, id });
      // Quá số lượng cho phép thì bỏ cái cũ nhất (timer của nó sau đó thành vô hại).
      if (this.toasts.length > MAX_VISIBLE_TOASTS) {
        this.toasts = this.toasts.slice(-MAX_VISIBLE_TOASTS);
      }
      setTimeout(() => this.dismissToast(id), 4000);
    },

    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },

    togglePanel() {
      this.panelOpen = !this.panelOpen;
      if (!this.panelOpen) return;

      this.unread = 0;
      // Ghi nhận đã đọc ở SERVER nữa, không chỉ trong bộ nhớ — nếu không, tải lại trang là
      // badge hiện lại. Đánh dấu ngay trên bản đồ dữ liệu đang giữ để panel không nhảy số
      // khi load lại lần sau.
      this.notifications = this.notifications.map((item) => ({ ...item, is_read: true }));
      // "Bắn và quên": lỗi mạng không được làm hỏng việc mở panel.
      apiClient.post('/notifications/read', {}).catch((error) => {
        console.warn('[Notif] không đánh dấu được đã đọc:', error?.message || error);
      });
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
