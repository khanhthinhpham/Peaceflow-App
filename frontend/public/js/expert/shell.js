import { auth } from '../auth.js';
import { apiClient } from '../api-client.js';
import { escapeHtml } from './utils.js';

const NAV_ITEMS = [
    { href: 'dashboard.html', key: 'dashboard', icon: '🏡', label: 'Tổng quan' },
    { href: 'application.html', key: 'application', icon: '🗂️', label: 'Hồ sơ chuyên gia' },
    { href: 'review-status.html', key: 'review-status', icon: '🧾', label: 'Lịch sử xét duyệt' }
];

// Sidebar chỉ dựng một lần cho mỗi session module. Khi chạy trong expert app-shell
// (SPA), #expertSidebar nằm ngoài vùng nội dung bị thay nên không bị dựng lại khi
// đổi trang — tránh nhấp nháy và giảm lag. Các lần gọi sau chỉ cập nhật active + tiêu đề.
let sidebarBuilt = false;

export function mountExpertShell({ active, title, subtitle, badgeText }) {
    const user = auth.getUser() || {};
    const sidebar = document.getElementById('expertSidebar');

    if (sidebar && !sidebarBuilt) {
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
                    <a class="expert-nav-link" data-nav-key="${item.key}" href="${item.href}">
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
        sidebarBuilt = true;
        document.getElementById('expertLogoutBtn')?.addEventListener('click', async () => {
            await auth.logout();
        });
    }

    // Cập nhật trạng thái active mỗi lần đổi trang (không dựng lại sidebar).
    sidebar?.querySelectorAll('.expert-nav-link').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-nav-key') === active);
    });

    const titleEl = document.getElementById('expertPageTitle');
    const subtitleEl = document.getElementById('expertPageSubtitle');
    const badgeEl = document.getElementById('expertPageBadge');
    if (titleEl) titleEl.textContent = title || '';
    if (subtitleEl) subtitleEl.textContent = subtitle || '';
    if (badgeEl) badgeEl.textContent = badgeText || 'Expert workspace';
}

// Xác minh phiên (/me) chỉ một lần cho mỗi session module. Trong SPA, mỗi trang vẫn
// gọi requireExpertUser nhưng từ lần 2 trở đi lấy user từ localStorage, không gọi lại /me.
let authVerified = false;

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

// Cache dùng chung cho dữ liệu expert (3 trang dùng cùng 2 endpoint). TTL ngắn để
// điều hướng giữa các trang không gọi lại API; gọi invalidateExpertData() sau khi
// submit để lần tải kế tiếp lấy dữ liệu mới.
let expertDataCache = null;
let expertDataCachedAt = 0;
const EXPERT_DATA_TTL_MS = 20_000;

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
