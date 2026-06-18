import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'community' });

const summaryEl = document.getElementById('adminCommunitySummary');

async function loadCommunitySummary() {
    if (!summaryEl) return;
    summaryEl.innerHTML = '<div class="admin-empty">Đang tải...</div>';

    try {
        const overview = await apiClient.get('/admin/overview', { noCache: true });
        setAdminBadge('community', overview.reported_community_posts);

        summaryEl.innerHTML = `
            <h2 class="admin-list-title">Tình hình kiểm duyệt</h2>
            <div class="admin-list">
                <div class="admin-list-item">
                    <div>
                        <p class="admin-list-title">Bài viết bị báo cáo</p>
                        <p class="admin-list-sub">${Number(overview.reported_community_posts || 0).toLocaleString('vi-VN')} bài viết đang có ít nhất một report.</p>
                    </div>
                    <span class="admin-pill">${Number(overview.reported_community_posts || 0).toLocaleString('vi-VN')} report</span>
                </div>
                <div class="admin-list-item">
                    <div>
                        <p class="admin-list-title">Bài viết đang bị ẩn</p>
                        <p class="admin-list-sub">${Number(overview.hidden_community_posts || 0).toLocaleString('vi-VN')} bài đã bị ẩn tự động hoặc bởi moderation.</p>
                    </div>
                    <span class="admin-pill">${Number(overview.hidden_community_posts || 0).toLocaleString('vi-VN')} hidden</span>
                </div>
            </div>
        `;
    } catch (error) {
        summaryEl.innerHTML = `<div class="admin-empty" style="color:var(--coral);">${error.message || 'Không tải được dữ liệu cộng đồng.'}</div>`;
    }
}

loadCommunitySummary();
