import { auth } from '../auth.js';

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

    if (!sidebarBuilt) {
        const name = user.display_name || user.full_name || 'Quản trị viên';

        sidebar.innerHTML = `
            <div class="admin-brand">
                <div class="admin-brand-mark">🌿</div>
                <div>
                    <p class="admin-brand-eyebrow">PeaceFlow</p>
                    <p class="admin-brand-title">Trang quản trị</p>
                </div>
            </div>

            <nav class="admin-nav">
                ${NAV_ITEMS.map((item) => `
                    <a class="admin-nav-link" data-nav-key="${item.key}" href="app.html?page=${item.page}">
                        <span class="admin-nav-ico" aria-hidden="true">${item.icon}</span>
                        <span>${item.label}</span>
                        ${item.badge ? `<span class="admin-nav-badge" data-badge="${item.badge}"></span>` : ''}
                    </a>
                `).join('')}
            </nav>

            <div class="admin-sidebar-footer">
                <div class="admin-user-card">
                    <div class="admin-user-avatar">${escapeHtml(getInitials(name))}</div>
                    <div class="admin-user-meta">
                        <div class="admin-user-name">${escapeHtml(name)}</div>
                        <div class="admin-user-email">${escapeHtml(user.email || '')}</div>
                    </div>
                </div>
                <a class="admin-footer-link" href="../dashboard.html">
                    <span class="admin-nav-ico" aria-hidden="true">🏠</span>
                    <span>Về app người dùng</span>
                </a>
                <button type="button" class="admin-footer-link admin-footer-link-danger" id="adminLogoutBtn">
                    <span class="admin-nav-ico" aria-hidden="true">🚪</span>
                    <span>Đăng xuất</span>
                </button>
            </div>
        `;

        sidebarBuilt = true;
        document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
            await auth.logout();
        });
    }

    sidebar.querySelectorAll('.admin-nav-link[data-nav-key]').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-nav-key') === active);
    });
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
