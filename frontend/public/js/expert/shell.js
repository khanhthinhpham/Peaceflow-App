import { auth } from '../auth.js';
import { apiClient } from '../api-client.js';
import { escapeHtml } from './utils.js';

const NAV_ITEMS = [
    { href: 'dashboard.html', key: 'dashboard', icon: '🏡', label: 'Tổng quan' },
    { href: 'application.html', key: 'application', icon: '📋', label: 'Hồ sơ chuyên gia' },
    { href: 'review-status.html', key: 'review-status', icon: '🧾', label: 'Lịch sử xét duyệt' }
];

let sidebarBuilt = false;
let authVerified = false;
let expertDataCache = null;
let expertDataCachedAt = 0;
const EXPERT_DATA_TTL_MS = 20_000;

export function mountExpertShell({ active, title, subtitle, badgeText }) {
    const user = auth.getUser() || {};
    const sidebar = document.getElementById('expertSidebar');

    if (sidebar) {
        sidebar.classList.add('sidebar');
    }

    if (sidebar && !sidebarBuilt) {
        const displayName = user.display_name || user.full_name || 'PeaceFlow Expert';
        const initials = getInitials(displayName);

        sidebar.innerHTML = `
            <a href="dashboard.html" class="sidebar-logo">
                <div class="logo-icon">🌿</div>
                <div class="logo-text">Peace<span>Flow</span></div>
            </a>

            <nav class="sidebar-nav">
                <div class="nav-section-label">Quản lý</div>
                ${NAV_ITEMS.map((item) => `
                    <a class="nav-item expert-shell-link" data-nav-key="${item.key}" href="${item.href}">
                        <span class="ni">${item.icon}</span>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </nav>

            <div class="sidebar-bottom">
                <div class="user-card-mini" style="margin-bottom:10px;">
                    <div class="user-avatar-mini">${escapeHtml(initials)}</div>
                    <div class="user-info-mini" style="min-width:0;">
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <div class="user-name">${escapeHtml(displayName)}</div>
                            <span style="font-size:0.6rem; font-weight:800; background:var(--mint); color:var(--text-white); padding:1px 6px; border-radius:6px; border:1px solid var(--mint-dark); white-space:nowrap;">Chuyên gia</span>
                        </div>
                        <div class="user-level" title="${escapeHtml(user.email || '')}">${escapeHtml(user.email || '')}</div>
                    </div>
                </div>

                <a
                    href="../dashboard.html"
                    class="nav-item expert-shell-link expert-footer-dashboard-link"
                    style="margin-bottom:8px; border:1.5px solid var(--kraft-light); background:var(--warm-white);"
                >
                    <span class="ni">🏠</span>
                    <span>Về dashboard người dùng</span>
                </a>

                <button
                    type="button"
                    id="expertLogoutBtn"
                    class="nav-item expert-footer-logout-btn"
                    style="width:100%; background:rgba(255,179,179,.12); text-align:left; cursor:pointer; font-family:inherit; border:1.5px solid var(--coral); color:var(--coral-dark);"
                >
                    <span class="ni">🚪</span>
                    <span>Đăng xuất</span>
                </button>
            </div>
        `;

        sidebarBuilt = true;
        document.getElementById('expertLogoutBtn')?.addEventListener('click', async () => {
            await auth.logout();
        });
    }

    sidebar?.querySelectorAll('.expert-shell-link[data-nav-key]').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-nav-key') === active);
    });

    const titleEl = document.getElementById('expertPageTitle');
    const subtitleEl = document.getElementById('expertPageSubtitle');
    const badgeEl = document.getElementById('expertPageBadge');
    if (titleEl) titleEl.textContent = title || '';
    if (subtitleEl) subtitleEl.textContent = subtitle || '';
    if (badgeEl) badgeEl.textContent = badgeText || 'Expert workspace';

    const avatarChip = document.querySelector('.expert-avatar-chip');
    if (avatarChip) {
        avatarChip.textContent = getInitials(user.display_name || user.full_name || 'Expert');
    }

    window.NotificationManager?.renderBell?.();
}

export async function requireExpertUser() {
    if (!authVerified) {
        const authenticated = await auth.waitForAuth();
        if (!authenticated) {
            window.location.replace('../login.html');
            return null;
        }
        authVerified = true;
    }

    const user = auth.getUser();
    if (user?.role !== 'expert') {
        window.location.replace('../dashboard.html');
        return null;
    }

    return user;
}

export async function loadExpertData({ force = false } = {}) {
    if (!force && expertDataCache && (Date.now() - expertDataCachedAt) < EXPERT_DATA_TTL_MS) {
        return expertDataCache;
    }

    const [application, overview] = await Promise.all([
        auth.getMyExpertApplication(),
        apiClient.get('/expert-portal/overview', { noCache: true })
    ]);

    expertDataCache = { application, overview };
    expertDataCachedAt = Date.now();
    return expertDataCache;
}

export function invalidateExpertData() {
    expertDataCache = null;
    expertDataCachedAt = 0;
}

export function showExpertBanner(message, type = 'info') {
    const banner = document.getElementById('expertStatusBanner');
    if (!banner) return;
    banner.textContent = message || '';
    banner.className = message ? `expert-status-banner show ${type}` : 'expert-status-banner';
}

function getInitials(value) {
    return String(value || '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'EX';
}
