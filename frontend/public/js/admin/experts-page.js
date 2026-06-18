import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'experts' });

const summaryEl = document.getElementById('adminExpertsSummary');

async function loadExpertsSummary() {
    if (!summaryEl) return;
    summaryEl.innerHTML = '<div class="admin-empty">Đang tải...</div>';

    try {
        const overview = await apiClient.get('/admin/overview', { noCache: true });
        setAdminBadge('experts', overview.pending_expert_applications);

        summaryEl.innerHTML = `
            <h2 class="admin-list-title">Tình hình chuyên gia</h2>
            <div class="admin-list">
                <div class="admin-list-item">
                    <div>
                        <p class="admin-list-title">Hồ sơ chờ duyệt</p>
                        <p class="admin-list-sub">${Number(overview.pending_expert_applications || 0).toLocaleString('vi-VN')} hồ sơ đang ở trạng thái pending trong bảng <code>expert_applications</code>.</p>
                    </div>
                    <span class="admin-pill">${Number(overview.pending_expert_applications || 0).toLocaleString('vi-VN')} hồ sơ</span>
                </div>
                <div class="admin-list-item">
                    <div>
                        <p class="admin-list-title">Chuyên gia đã hoạt động</p>
                        <p class="admin-list-sub">${Number(overview.active_experts || 0).toLocaleString('vi-VN')} chuyên gia đã có profile hoạt động trong hệ thống.</p>
                    </div>
                    <span class="admin-pill">${Number(overview.active_experts || 0).toLocaleString('vi-VN')} active</span>
                </div>
            </div>
        `;
    } catch (error) {
        summaryEl.innerHTML = `<div class="admin-empty" style="color:var(--coral);">${error.message || 'Không tải được dữ liệu chuyên gia.'}</div>`;
    }
}

loadExpertsSummary();
