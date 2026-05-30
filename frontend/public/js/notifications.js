import { apiClient } from './api-client.js';
import { auth } from './auth.js';

const VAPID_PUBLIC_KEY = 'BBmum3N-lH6Ig9bGbellDDyTeSxZHQbYBmbXwtQGyMguftr1YOBsonHfT3JFJfvLMYpV-O-g57qC_IFg85rWrbE';

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
    },

    async loadNotifications() {
        try {
            const data = await apiClient.get('/notifications', { noCache: true });
            this._notifications = Array.isArray(data) ? data : [];
            this._unread = this._notifications.length;
        } catch (_) {
            this._notifications = [];
            this._unread = 0;
        }
    },

    renderBell() {
        const bellContainers = document.querySelectorAll('[data-notification-bell]');
        bellContainers.forEach((container) => {
            container.innerHTML = `
                <button id="notifBell" onclick="NotificationManager.togglePanel()" style="
                    position:relative;background:none;border:none;cursor:pointer;
                    font-size:1.3rem;padding:4px;line-height:1;">
                    🔔
                    ${this._unread > 0 ? `<span style="
                        position:absolute;top:-2px;right:-4px;
                        background:var(--coral);color:white;
                        font-size:0.6rem;font-weight:800;
                        width:16px;height:16px;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;">
                        ${Math.min(this._unread, 9)}
                    </span>` : ''}
                </button>
            `;
        });
        window.NotificationManager = this;
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

        if (!this._notifications.length) {
            panel.innerHTML = `
                <div style="padding:24px;text-align:center;color:var(--text-secondary);">
                    <div style="font-size:2rem;margin-bottom:8px;">🔔</div>
                    <div style="font-size:0.88rem;">Không có thông báo nào</div>
                </div>`;
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
                <div style="padding:10px 16px;text-align:center;">
                    <button onclick="NotificationManager.requestPush();document.getElementById('notifPanel')?.remove()"
                        style="font-size:0.75rem;color:var(--mint-dark);background:none;border:none;cursor:pointer;font-weight:600;">
                        🔔 Bật thông báo push
                    </button>
                </div>
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
            // Tìm sw.js từ root của site
            const swPath = window.location.pathname.includes('/frontend/') ? '/frontend/sw.js' : '/sw.js';
            const reg = await navigator.serviceWorker.register(swPath);
            await navigator.serviceWorker.ready;

            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                await apiClient.post('/notifications/subscribe', {
                    endpoint: existing.endpoint,
                    keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(existing.getKey('p256dh')))), auth: btoa(String.fromCharCode(...new Uint8Array(existing.getKey('auth')))) }
                }).catch(() => {});
            }
        } catch (_) {}
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

// Auto-init khi DOM sẵn sàng
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
    } else {
        NotificationManager.init();
    }
    window.addEventListener('peaceflow:route-mounted', () => NotificationManager.init());
}
