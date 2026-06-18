import { auth } from '../auth.js';
import { apiClient } from '../api-client.js';
import { escapeHtml } from './utils.js';

const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const ICON_LEAF = `<svg ${SVG_ATTRS}><path d="M5 21c0-8.5 6-15 15-16 1 8.5-5 16-15 16Z"/><path d="M9 17c2.2-3.8 5.2-6 9-7"/></svg>`;
const ICON_OVERVIEW = `<svg ${SVG_ATTRS}><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg>`;
const ICON_PROFILE = `<svg ${SVG_ATTRS}><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.2-5.6 7-5.6s7 2 7 5.6"/></svg>`;
const ICON_HISTORY = `<svg ${SVG_ATTRS}><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3.2 4.2v3.8h3.8"/><path d="M12 8v4.2l3 1.8"/></svg>`;

const NAV_ITEMS = [
    { href: 'dashboard.html', key: 'dashboard', icon: ICON_OVERVIEW, label: 'Tổng quan' },
    { href: 'application.html', key: 'application', icon: ICON_PROFILE, label: 'Hồ sơ chuyên gia' },
    { href: 'review-status.html', key: 'review-status', icon: ICON_HISTORY, label: 'Lịch sử xét duyệt' }
];

let sidebarBuilt = false;
let authVerified = false;
let expertDataCache = null;
let expertDataCachedAt = 0;
const EXPERT_DATA_TTL_MS = 20_000;

export function mountExpertShell({ active, title, subtitle, badgeText }) {
    const user = auth.getUser() || {};
    const sidebar = document.getElementById('expertSidebar');

    if (sidebar && !sidebarBuilt) {
        const displayName = user.display_name || user.full_name || 'PeaceFlow Expert';
        const initials = getInitials(displayName);

        sidebar.innerHTML = `
            <div class="expert-sidebar-inner">
                <div class="expert-brand">
                    <div class="expert-brand-mark">${ICON_LEAF}</div>
                    <div>
                        <p class="expert-brand-eyebrow">PeaceFlow</p>
                        <h2 class="expert-brand-title">Expert Portal</h2>
                    </div>
                </div>

                <section class="expert-user-card">
                    <div class="expert-user-avatar">${escapeHtml(initials)}</div>
                    <div class="expert-user-copy">
                        <div class="expert-user-row">
                            <h3 class="expert-user-name">${escapeHtml(displayName)}</h3>
                            <span class="expert-user-badge">Chuyên gia</span>
                        </div>
                        <p class="expert-user-meta" title="${escapeHtml(user.email || '')}">${escapeHtml(user.email || '')}</p>
                    </div>
                </section>

                <div class="expert-nav-group">
                    <p class="expert-nav-label">Quản lý</p>
                    <nav class="expert-nav">
                        ${NAV_ITEMS.map((item) => `
                            <a class="expert-nav-link" data-nav-key="${item.key}" href="${item.href}">
                                <span class="expert-nav-icon">${item.icon}</span>
                                <span>${item.label}</span>
                            </a>
                        `).join('')}
                    </nav>
                </div>

                <div class="expert-sidebar-footer">
                    <a href="../dashboard.html" class="expert-footer-link">Về dashboard người dùng</a>
                    <button type="button" id="expertLogoutBtn" class="expert-footer-link">Đăng xuất</button>
                </div>
            </div>
        `;

        sidebarBuilt = true;
        document.getElementById('expertLogoutBtn')?.addEventListener('click', async () => {
            await auth.logout();
        });
    }

    sidebar?.querySelectorAll('.expert-nav-link').forEach((link) => {
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
