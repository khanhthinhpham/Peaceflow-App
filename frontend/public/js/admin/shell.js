import { auth } from '../auth.js';
import { apiClient } from '../api-client.js';

const NAV_ITEMS = [
    { page: 'dashboard.html', key: 'dashboard', icon: '📊', label: 'Tổng quan' },
    { page: 'experts.html', key: 'experts', icon: '🧑‍⚕️', label: 'Duyệt chuyên gia', badge: 'experts' },
    { page: 'payments.html', key: 'payments', icon: '💳', label: 'Thanh toán & payout', badge: 'payments' },
    { page: 'users.html', key: 'users', icon: '👥', label: 'Người dùng' },
    { page: 'community.html', key: 'community', icon: '🛡️', label: 'Kiểm duyệt cộng đồng', badge: 'community' }
];

let sidebarBuilt = false;
let authVerified = false;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getInitials(value) {
    return String(value || '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'AD';
}

export function mountAdminShell({ active } = {}) {
    const user = auth.getUser() || {};
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar) return;
    sidebar.classList.add('sidebar');

    if (!sidebarBuilt) {
        const name = user.display_name || user.full_name || 'Quản trị viên';

        sidebar.innerHTML = `
            <a href="app.html?page=dashboard.html" class="sidebar-logo">
                <div class="logo-icon">🌿</div>
                <div class="logo-text">Peace<span>Flow</span></div>
            </a>

            <nav class="sidebar-nav">
                <div class="nav-section-label">Quản trị</div>
                ${NAV_ITEMS.map((item) => `
                    <a class="nav-item admin-shell-link" data-nav-key="${item.key}" href="app.html?page=${item.page}">
                        <span class="ni" aria-hidden="true">${item.icon}</span>
                        <span>${item.label}</span>
                        ${item.badge ? `<span class="admin-nav-badge" data-badge="${item.badge}"></span>` : ''}
                    </a>
                `).join('')}
            </nav>

            <div class="sidebar-bottom admin-sidebar-bottom">
                <button
                    type="button"
                    class="nav-item admin-footer-link admin-notif-btn"
                    id="adminNotifBtn"
                    data-notification-bell
                    onclick="window.NotificationManager?.togglePanel()"
                >
                    <span class="ni admin-notif-ico" aria-hidden="true">🔔<span id="notifBadge" class="admin-bell-badge"></span></span>
                    <span>Thông báo</span>
                </button>

                <div class="user-card-mini admin-user-card">
                    <div class="user-avatar-mini admin-user-avatar">${escapeHtml(getInitials(name))}</div>
                    <div class="user-info-mini admin-user-meta">
                        <div class="admin-user-heading">
                            <div class="user-name admin-user-name">${escapeHtml(name)}</div>
                            <span class="admin-role-chip">Admin</span>
                        </div>
                        <div class="user-level admin-user-email">${escapeHtml(user.email || '')}</div>
                    </div>
                </div>

                <a class="nav-item admin-footer-link admin-footer-link-dashboard" href="../dashboard.html">
                    <span class="ni" aria-hidden="true">🏠</span>
                    <span>Về app người dùng</span>
                </a>
                <button type="button" class="nav-item admin-footer-link admin-footer-link-danger" id="adminLogoutBtn">
                    <span class="ni" aria-hidden="true">🚪</span>
                    <span>Đăng xuất</span>
                </button>
            </div>
        `;

        sidebarBuilt = true;
        document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
            await auth.logout();
        });
    }

    sidebar.querySelectorAll('.admin-shell-link[data-nav-key]').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-nav-key') === active);
    });

    // Đồng bộ badge chuông (số chưa đọc) sau khi chuông đã được dựng trong sidebar.
    window.NotificationManager?.renderBell?.();
    ensureAdminLiveBadges();
}

// Cập nhật badge nav (chờ duyệt / chờ thanh toán / báo cáo) realtime.
async function refreshAdminBadges() {
    try {
        const o = await apiClient.get('/admin/overview', { noCache: true });
        setAdminBadge('experts', o.pending_expert_applications);
        setAdminBadge('payments', o.pending_payment_bookings);
        setAdminBadge('community', o.reported_community_posts);
    } catch (_e) { /* im lặng nếu lỗi mạng */ }
}

let liveBadgesBound = false;
function ensureAdminLiveBadges() {
    if (liveBadgesBound) return;
    liveBadgesBound = true;
    // Khi có thông báo booking realtime (vd thân chủ báo đã chuyển khoản) → làm mới badge.
    window.addEventListener('peaceflow:booking-changed', () => refreshAdminBadges());
}

export function setAdminBadge(key, count) {
    const badge = document.querySelector(`.admin-nav-badge[data-badge="${key}"]`);
    if (!badge) return;

    const total = Number(count) || 0;
    badge.textContent = total > 99 ? '99+' : String(total);
    badge.classList.toggle('show', total > 0);
}

export async function requireAdmin() {
    if (!authVerified) {
        const ok = await auth.waitForAuth();
        if (!ok) {
            window.location.replace('../login.html');
            return null;
        }
        authVerified = true;
    }

    const user = auth.getUser();
    if (user?.role !== 'admin') {
        window.location.replace('../dashboard.html');
        return null;
    }
    return user;
}
