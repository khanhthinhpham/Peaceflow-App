import { auth } from '../auth.js';

// Điều hướng khu admin. Mỗi mục là 1 tab (fragment) load trong shell, không reload sidebar.
const NAV_ITEMS = [
    { page: 'dashboard.html', key: 'dashboard', icon: '📊', label: 'Tổng quan' },
    { page: 'experts.html', key: 'experts', icon: '🧑‍⚕️', label: 'Duyệt chuyên gia', badge: 'experts' },
    { page: 'payments.html', key: 'payments', icon: '💳', label: 'Thanh toán & Payout', badge: 'payments' },
    { page: 'users.html', key: 'users', icon: '👥', label: 'Người dùng' },
    { page: 'community.html', key: 'community', icon: '🛡️', label: 'Kiểm duyệt cộng đồng', badge: 'community' }
];

let sidebarBuilt = false;
let authVerified = false;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getInitials(value) {
    return String(value || '')
        .trim().split(/\s+/).slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase()).join('') || 'AD';
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
                        <span class="admin-nav-ico">${item.icon}</span>
                        <span>${item.label}</span>
                        ${item.badge ? `<span class="admin-nav-badge" data-badge="${item.badge}"></span>` : ''}
                    </a>
                `).join('')}
            </nav>

            <div class="admin-sidebar-footer">
                <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;">
                    <div class="admin-brand-mark" style="width:34px;height:34px;font-size:.85rem;background:var(--mint,#A8D5BA);box-shadow:2px 2px 0 var(--mint-dark,#7BBF95);">${escapeHtml(getInitials(name))}</div>
                    <div style="min-width:0;">
                        <div style="font-weight:800;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(name)}</div>
                        <div style="font-size:.74rem;color:var(--text-light,#A89585);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(user.email || '')}</div>
                    </div>
                </div>
                <a class="admin-footer-link" href="../dashboard.html">
                    <span class="admin-nav-ico">🏠</span><span>Về app người dùng</span>
                </a>
                <button type="button" class="admin-footer-link" id="adminLogoutBtn" style="color:var(--coral-dark,#E05555);">
                    <span class="admin-nav-ico">🚪</span><span>Đăng xuất</span>
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

// Cập nhật badge số đếm trên 1 mục nav (vd số hồ sơ chờ duyệt).
export function setAdminBadge(key, count) {
    const el = document.querySelector(`.admin-nav-badge[data-badge="${key}"]`);
    if (!el) return;
    const n = Number(count) || 0;
    el.textContent = n > 99 ? '99+' : String(n);
    el.classList.toggle('show', n > 0);
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
