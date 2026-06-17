import { auth } from '../auth.js';
import { escapeHtml } from './utils.js';

const NAV_ITEMS = [
    { href: 'dashboard.html', key: 'dashboard', icon: '🏡', label: 'Tổng quan' },
    { href: 'application.html', key: 'application', icon: '🗂️', label: 'Hồ sơ chuyên gia' },
    { href: 'review-status.html', key: 'review-status', icon: '🧾', label: 'Lịch sử xét duyệt' }
];

export function mountExpertShell({ active, title, subtitle, badgeText }) {
    const user = auth.getUser() || {};
    const sidebar = document.getElementById('expertSidebar');
    const titleEl = document.getElementById('expertPageTitle');
    const subtitleEl = document.getElementById('expertPageSubtitle');
    const badgeEl = document.getElementById('expertPageBadge');

    if (sidebar) {
        sidebar.innerHTML = `
            <div class="expert-brand">
                <div class="expert-brand-mark">🌿</div>
                <div>
                    <p class="expert-brand-eyebrow">PeaceFlow</p>
                    <h2 class="expert-brand-title">Expert Portal</h2>
                </div>
            </div>
            <section class="expert-user">
                <span class="expert-user-label">Chuyên gia</span>
                <h3 class="expert-user-name">${escapeHtml(user.display_name || user.full_name || 'PeaceFlow Expert')}</h3>
                <p class="expert-user-meta">${escapeHtml(user.email || '')}</p>
            </section>
            <nav class="expert-nav">
                ${NAV_ITEMS.map((item) => `
                    <a class="expert-nav-link ${item.key === active ? 'active' : ''}" href="${item.href}">
                        <span class="expert-nav-icon">${item.icon}</span>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </nav>
            <div class="expert-sidebar-footer">
                <a href="../dashboard.html">Về dashboard người dùng</a>
                <button type="button" id="expertLogoutBtn">Đăng xuất</button>
            </div>
        `;
    }

    if (titleEl) titleEl.textContent = title || '';
    if (subtitleEl) subtitleEl.textContent = subtitle || '';
    if (badgeEl) badgeEl.textContent = badgeText || 'Expert workspace';

    document.getElementById('expertLogoutBtn')?.addEventListener('click', async () => {
        await auth.logout();
    });
}

export async function requireExpertUser() {
    const authenticated = await auth.waitForAuth();
    if (!authenticated) {
        window.location.replace('../login.html');
        return null;
    }

    const user = auth.getUser();
    if (user?.role !== 'expert') {
        window.location.replace('../dashboard.html');
        return null;
    }

    return user;
}

export function showExpertBanner(message, type = 'info') {
    const banner = document.getElementById('expertStatusBanner');
    if (!banner) return;
    banner.textContent = message || '';
    banner.className = message ? `expert-status-banner show ${type}` : 'expert-status-banner';
}
