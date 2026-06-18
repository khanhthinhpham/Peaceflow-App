import { apiClient } from '../api-client.js';
import { mountAdminShell } from './shell.js';

mountAdminShell({ active: 'users' });

const summaryEl = document.getElementById('adminUsersSummary');

async function loadUsersSummary() {
    if (!summaryEl) return;
    summaryEl.innerHTML = '<div class="admin-empty">Đang tải...</div>';

    try {
        const overview = await apiClient.get('/admin/overview', { noCache: true });
        summaryEl.innerHTML = `
            <h2 class="admin-list-title">Tình hình tài khoản</h2>
            <div class="admin-list">
                <div class="admin-list-item">
                    <div>
                        <p class="admin-list-title">Tổng số người dùng</p>
                        <p class="admin-list-sub">${Number(overview.total_users || 0).toLocaleString('vi-VN')} tài khoản hiện có trên nền tảng.</p>
                    </div>
                    <span class="admin-pill">${Number(overview.total_users || 0).toLocaleString('vi-VN')} user</span>
                </div>
                <div class="admin-list-item">
                    <div>
                        <p class="admin-list-title">Liên quan lịch hẹn</p>
                        <p class="admin-list-sub">Hôm nay có ${Number(overview.bookings_today || 0).toLocaleString('vi-VN')} lịch hẹn. Tab users nên là nơi tra cứu nhanh user phát sinh booking hoặc ví.</p>
                    </div>
                    <span class="admin-pill">Booking</span>
                </div>
            </div>
        `;
    } catch (error) {
        summaryEl.innerHTML = `<div class="admin-empty" style="color:var(--coral);">${error.message || 'Không tải được dữ liệu người dùng.'}</div>`;
    }
}

loadUsersSummary();
