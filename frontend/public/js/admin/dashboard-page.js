import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'dashboard' });

const kpisEl = document.getElementById('adminOverviewKpis');
const extraEl = document.getElementById('adminOverviewExtra');

function money(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function card(label, value, hint) {
    return `
        <article class="admin-kpi">
            <div class="admin-kpi-label">${label}</div>
            <div class="admin-kpi-value">${value}</div>
            <div class="admin-kpi-hint">${hint}</div>
        </article>
    `;
}

async function loadOverview() {
    if (kpisEl) {
        kpisEl.innerHTML = '<div class="admin-card admin-empty">Đang tải số liệu...</div>';
    }
    if (extraEl) {
        extraEl.innerHTML = '<div class="admin-empty">Đang tải...</div>';
    }

    try {
        const overview = await apiClient.get('/admin/overview', { noCache: true });

        setAdminBadge('experts', overview.pending_expert_applications);
        setAdminBadge('payments', overview.pending_payment_bookings);
        setAdminBadge('community', overview.reported_community_posts);

        if (kpisEl) {
            kpisEl.innerHTML = [
                card('Tổng người dùng', Number(overview.total_users || 0).toLocaleString('vi-VN'), 'Toàn bộ tài khoản đã tạo'),
                card('Chuyên gia hoạt động', Number(overview.active_experts || 0).toLocaleString('vi-VN'), 'Đang có profile chuyên gia'),
                card('Lịch hẹn hôm nay', Number(overview.bookings_today || 0).toLocaleString('vi-VN'), 'Tính theo ngày hiện tại'),
                card('Booking chờ thanh toán', Number(overview.pending_payment_bookings || 0).toLocaleString('vi-VN'), 'Cần admin đối chiếu'),
                card('Hồ sơ chuyên gia chờ duyệt', Number(overview.pending_expert_applications || 0).toLocaleString('vi-VN'), 'Chưa xử lý xét duyệt'),
                card('Số dư chờ payout', money(overview.pending_payout_amount || 0), `${Number(overview.pending_payout_experts || 0).toLocaleString('vi-VN')} chuyên gia đang chờ`)
            ].join('');
        }

        if (extraEl) {
            extraEl.innerHTML = `
                <h2 class="admin-list-title">Tín hiệu cần chú ý</h2>
                <div class="admin-list">
                    <div class="admin-list-item">
                        <div>
                            <p class="admin-list-title">Kiểm duyệt cộng đồng</p>
                            <p class="admin-list-sub">Có ${Number(overview.reported_community_posts || 0).toLocaleString('vi-VN')} bài viết đã bị báo cáo và ${Number(overview.hidden_community_posts || 0).toLocaleString('vi-VN')} bài đang bị ẩn.</p>
                        </div>
                        <span class="admin-pill">Community</span>
                    </div>
                    <div class="admin-list-item">
                        <div>
                            <p class="admin-list-title">Hồ sơ chuyên gia</p>
                            <p class="admin-list-sub">${Number(overview.pending_expert_applications || 0).toLocaleString('vi-VN')} hồ sơ đang chờ xét duyệt để mở quyền chuyên gia.</p>
                        </div>
                        <span class="admin-pill">Experts</span>
                    </div>
                    <div class="admin-list-item">
                        <div>
                            <p class="admin-list-title">Đối soát thanh toán</p>
                            <p class="admin-list-sub">${Number(overview.pending_payment_bookings || 0).toLocaleString('vi-VN')} booking cần xác nhận tiền vào trước khi chuyển cho chuyên gia xử lý.</p>
                        </div>
                        <span class="admin-pill">Payments</span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        if (kpisEl) {
            kpisEl.innerHTML = `<div class="admin-card admin-empty" style="color:var(--coral);">${error.message || 'Không tải được tổng quan admin.'}</div>`;
        }
        if (extraEl) {
            extraEl.innerHTML = '<div class="admin-empty">Không lấy được dữ liệu tổng quan.</div>';
        }
    }
}

loadOverview();
