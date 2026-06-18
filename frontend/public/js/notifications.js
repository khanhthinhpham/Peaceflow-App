import { apiClient } from './api-client.js';
import { auth } from './auth.js';
import { subscribeNotifications, unsubscribeNotifications } from './supabase-realtime.js';

const VAPID_PUBLIC_KEY = 'BPv-CCXdm5KP7VgrtF2NILO4xIRp2w5zk-BqcCJDoYTKWLHDrSUkhD5ODXJDlyV529vsm78bgPrNXCs0TasYjx0';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const NotificationManager = {
    _notifications: [],
    _unread: 0,

    async init() {
        if (!auth.isAuthenticated()) return;
        await this.loadNotifications();
        this.renderBell();
        await this.registerPush();
        this._maybePromptPush();
        this._startRealtime();
    },

    _startRealtime() {
        unsubscribeNotifications();
        subscribeNotifications((notif) => {
            // Hiện toast ngay lập tức theo đúng loại thông báo
            const meta = this._toastMetaFor(notif);
            this._showToast({
                icon: meta.icon,
                title: meta.title,
                body: notif.message,
                action: meta.action
            });
            // Cập nhật bell
            this._unread++;
            this.renderBell();

            // Báo cho các trang đang mở để tự cập nhật danh sách lịch hẹn (không cần reload)
            if (notif?.type === 'booking_new' || notif?.type === 'booking_update') {
                window.dispatchEvent(new CustomEvent('peaceflow:booking-changed', { detail: notif }));
            }
        });
    },

    _toastMetaFor(notif) {
        switch (notif?.type) {
            case 'booking_new':
                return { icon: '📅', title: 'Lịch hẹn mới', action: 'expert/app.html?page=dashboard.html' };
            case 'booking_update':
                return { icon: '📅', title: 'Cập nhật lịch hẹn', action: 'experts.html' };
            case 'comment':
                return { icon: '💬', title: 'Bình luận mới', action: 'community.html' };
            default:
                return { icon: '❤️', title: 'Cảm xúc mới', action: 'community.html' };
        }
    },

    _maybePromptPush() {
        if (!('Notification' in window)) return;
        if (this._isPushGranted()) return;
        if (Notification.permission === 'denied') return;
        if (localStorage.getItem('push_prompted')) return;

        setTimeout(() => {
            const modal = document.createElement('div');
            modal.id = 'pushPromptModal';
            modal.style.cssText = `
                position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;
                width:calc(100% - 48px);max-width:360px;
                background:var(--warm-white,#faf8f4);border:2px solid var(--kraft-light,#e8ddd0);
                border-radius:16px;box-shadow:4px 4px 0px rgba(74,55,40,0.12);
                padding:20px;
            `;
            modal.innerHTML = `
                <style>#pushPromptModal{animation:fadeIn .3s ease}@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}</style>
                <div style="display:flex;gap:12px;align-items:flex-start;">
                    <div style="font-size:2rem;line-height:1;">🔔</div>
                    <div style="flex:1;">
                        <div style="font-weight:800;font-size:0.9rem;color:var(--text-primary,#2d1f14);margin-bottom:4px;">
                            Bật nhắc nhở hàng ngày?
                        </div>
                        <div style="font-size:0.8rem;color:var(--text-secondary,#8b7355);margin-bottom:12px;">
                            PeaceFlow sẽ nhắc check-in tâm trạng và cảnh báo khi streak sắp mất.
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button id="pushPromptYes" style="flex:1;padding:8px;background:var(--mint-dark,#4a9e8e);color:white;border:none;border-radius:8px;font-weight:700;font-size:0.82rem;cursor:pointer;">
                                Bật thông báo
                            </button>
                            <button id="pushPromptNo" style="padding:8px 14px;background:none;border:1.5px solid var(--kraft-light,#e8ddd0);border-radius:8px;font-size:0.82rem;cursor:pointer;color:var(--text-secondary,#8b7355);">
                                Để sau
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('pushPromptYes').onclick = async () => {
                modal.remove();
                localStorage.setItem('push_prompted', '1');
                await NotificationManager.requestPush();
            };
            document.getElementById('pushPromptNo').onclick = () => {
                modal.remove();
                localStorage.setItem('push_prompted', '1');
            };
        }, 3000);
    },

    async loadNotifications() {
        try {
            const data = await apiClient.get('/notifications', { noCache: true });
            this._notifications = Array.isArray(data) ? data : [];
            this._unread = this._notifications.length;
            this._maybeShowToast();
        } catch (_) {
            this._notifications = [];
            this._unread = 0;
        }
    },

    _maybeShowToast() {
        if (!this._notifications.length) return;

        const seenRaw = localStorage.getItem('notif_seen_ids');
        const seenIds = seenRaw ? new Set(JSON.parse(seenRaw)) : null;
        const currentIds = this._notifications.map(n => n.id);

        // Lưu lại danh sách hiện tại
        localStorage.setItem('notif_seen_ids', JSON.stringify(currentIds));

        // Lần đầu tiên → chỉ lưu baseline, không show toast
        if (!seenIds) return;

        // Tìm tất cả notification mới (chưa từng thấy)
        const newNotifs = this._notifications.filter(n => !seenIds.has(n.id));
        if (!newNotifs.length) return;

        // Show toast cho cái mới nhất, queue các cái còn lại
        newNotifs.forEach((notif, i) => {
            setTimeout(() => this._showToast(notif), i * 800);
        });
    },

    _showToast(notif) {
        const existing = document.getElementById('notifToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'notifToast';
        toast.style.cssText = `
            position:fixed;top:16px;right:16px;z-index:99999;
            max-width:300px;min-width:220px;
            background:var(--warm-white,#faf8f4);border:2px solid var(--kraft-light,#e8ddd0);
            border-radius:14px;box-shadow:4px 4px 0px rgba(74,55,40,0.15);
            padding:12px 14px;cursor:pointer;
            animation:toastIn .3s ease;
        `;
        toast.innerHTML = `
            <style>@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
            @keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(20px)}}</style>
            <div style="display:flex;gap:10px;align-items:flex-start;">
                <div style="font-size:1.4rem;flex-shrink:0;line-height:1.2;">${notif.icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:800;font-size:0.82rem;color:var(--text-primary,#2d1f14);margin-bottom:2px;">${notif.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary,#8b7355);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${notif.body}</div>
                </div>
                <button onclick="document.getElementById('notifToast')?.remove()" style="background:none;border:none;cursor:pointer;color:var(--text-secondary,#8b7355);font-size:1rem;line-height:1;padding:0;flex-shrink:0;">✕</button>
            </div>
        `;

        toast.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            if (notif.action) window.location.href = notif.action;
            toast.remove();
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            if (!toast.parentNode) return;
            toast.style.animation = 'toastOut .3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    renderBell() {
        const count = Math.min(this._unread, 9);
        ['notifBadge', 'notifBadgeDesktop'].forEach((id) => {
            const badge = document.getElementById(id);
            if (!badge) return;
            if (this._unread > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    },

    _isPushGranted() {
        return 'Notification' in window && Notification.permission === 'granted';
    },

    togglePanel() {
        let panel = document.getElementById('notifPanel');
        if (panel) { panel.remove(); return; }

        panel = document.createElement('div');
        panel.id = 'notifPanel';
        panel.style.cssText = `
            position:fixed;top:68px;right:12px;z-index:9999;
            width:320px;max-height:420px;overflow-y:auto;
            background:var(--warm-white);border:2px solid var(--kraft-light);
            border-radius:16px;box-shadow:4px 4px 0px rgba(74,55,40,0.12);
        `;

        const pushFooter = this._isPushGranted() ? '' : `
            <div style="padding:10px 16px;text-align:center;border-top:1px solid var(--kraft-light);">
                <button onclick="NotificationManager.requestPush();document.getElementById('notifPanel')?.remove()"
                    style="font-size:0.78rem;color:var(--mint-dark);background:none;border:none;cursor:pointer;font-weight:600;">
                    🔔 Bật thông báo push để nhận nhắc nhở
                </button>
            </div>`;

        if (!this._notifications.length) {
            panel.innerHTML = `
                <div style="padding:24px;text-align:center;color:var(--text-secondary);">
                    <div style="font-size:2rem;margin-bottom:8px;">🔔</div>
                    <div style="font-size:0.88rem;">Không có thông báo nào</div>
                </div>
                ${pushFooter}`;
        } else {
            panel.innerHTML = `
                <div style="padding:12px 16px;border-bottom:1px solid var(--kraft-light);font-weight:800;font-size:0.88rem;">
                    Thông báo
                </div>
                ${this._notifications.map((n) => `
                    <a href="${n.action || '#'}" onclick="document.getElementById('notifPanel')?.remove()"
                       style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid var(--kraft-light);
                              text-decoration:none;color:inherit;transition:background 0.2s;"
                       onmouseover="this.style.background='var(--cream)'"
                       onmouseout="this.style.background=''">
                        <div style="font-size:1.5rem;flex-shrink:0;">${n.icon}</div>
                        <div>
                            <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">${n.title}</div>
                            <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">${n.body}</div>
                        </div>
                    </a>
                `).join('')}
                ${pushFooter}
            `;
        }

        document.body.appendChild(panel);
        this._unread = 0;
        document.querySelectorAll('[data-notification-bell]').forEach((c) => this.renderBell());

        // Đóng khi click ngoài
        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (!panel.contains(e.target) && e.target.id !== 'notifBell') {
                    panel.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 100);
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
                await apiClient.post('/notifications/subscribe', {
                    endpoint: s.endpoint,
                    keys: s.keys
                }).catch((err) => console.warn('[Push] Re-save subscription failed:', err));
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
            await apiClient.post('/notifications/subscribe', {
                endpoint: subJson.endpoint,
                keys: subJson.keys
            });

            new Notification('PeaceFlow 🌿', {
                body: 'Đã bật thông báo! Bạn sẽ nhận nhắc nhở mood check-in hàng ngày.',
                icon: '/favicon.png'
            });
        } catch (err) {
            console.error('Push subscribe failed:', err);
        }
    }
};

// Expose ra window để sidebar.js gọi được
window.NotificationManager = NotificationManager;

// Auto-init khi DOM sẵn sàng
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
    } else {
        NotificationManager.init();
    }
    window.addEventListener('peaceflow:route-mounted', () => NotificationManager.init());
}
