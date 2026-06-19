import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'dashboard' });

const kpisEl = document.getElementById('adminOverviewKpis');
const extraEl = document.getElementById('adminOverviewExtra');

function money(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}
function num(value) {
    return Number(value || 0).toLocaleString('vi-VN');
}

function card(label, value, hint, accent) {
    const valStyle = accent ? ` style="color:${accent};"` : '';
    return `
        <article class="admin-kpi">
            <div class="admin-kpi-label">${label}</div>
            <div class="admin-kpi-value"${valStyle}>${value}</div>
            <div class="admin-kpi-hint">${hint}</div>
        </article>
    `;
}

function signal(title, sub, pill, accent) {
    return `
        <div class="admin-list-item">
            <div>
                <p class="admin-list-title">${title}</p>
                <p class="admin-list-sub">${sub}</p>
            </div>
            <span class="admin-pill"${accent ? ` style="background:${accent.bg};border-color:${accent.border};color:${accent.color};"` : ''}>${pill}</span>
        </div>
    `;
}

async function loadOverview() {
    if (kpisEl) kpisEl.innerHTML = '<div class="admin-card admin-empty">Đang tải số liệu...</div>';
    if (extraEl) extraEl.innerHTML = '<div class="admin-empty">Đang tải...</div>';

    let o;
    try {
        o = await apiClient.get('/admin/overview', { noCache: true });
    } catch (error) {
        if (kpisEl) kpisEl.innerHTML = `<div class="admin-card admin-empty" style="color:var(--coral);">${error.message || 'Không tải được tổng quan admin.'}</div>`;
        if (extraEl) extraEl.innerHTML = '<div class="admin-empty">Không lấy được dữ liệu tổng quan.</div>';
        return;
    }

    setAdminBadge('experts', o.pending_expert_applications);
    setAdminBadge('payments', o.pending_payment_bookings);
    setAdminBadge('community', o.reported_community_posts);

    const coral = 'var(--coral-dark,#e05555)';

    if (kpisEl) {
        kpisEl.innerHTML = [
            // Tài chính
            card('Doanh thu nền tảng', money(o.platform_revenue), 'Phí 25% từ buổi đã đối soát'),
            card('Doanh thu tháng này', money(o.platform_revenue_month), 'Phí nền tảng trong tháng'),
            card('Tổng GMV', money(o.gmv), 'Tổng giá trị giao dịch'),
            card('Đã chi trả chuyên gia', money(o.total_paid_experts), 'Cộng dồn các đợt payout'),
            card('Số dư ví đang giữ', money(o.total_wallet_balance), 'Nghĩa vụ hoàn cho người dùng'),
            card('Số dư chờ payout', money(o.pending_payout_amount), `${num(o.pending_payout_experts)} chuyên gia đang chờ`),
            // Tăng trưởng / vận hành
            card('Tổng người dùng', num(o.total_users), `+${num(o.new_users_today)} hôm nay · +${num(o.new_users_7d)} trong 7 ngày`),
            card('Chuyên gia', num(o.active_experts), `${num(o.active_experts)}/${num(o.total_experts)} đang hoạt động`),
            card('Lịch hẹn', num(o.bookings_total), `Hôm nay ${num(o.bookings_today)} · Hoàn thành ${num(o.bookings_completed)}`),
            card('Lịch sắp tới', num(o.bookings_upcoming), `${num(o.bookings_awaiting_expert)} chờ chuyên gia nhận`),
            // An toàn
            card('Người dùng nguy cơ cao', num(o.high_risk_users_7d), '7 ngày qua (mức high/critical)', (o.high_risk_users_7d > 0 ? coral : null)),
            card('Lượt khẩn cấp', num(o.emergencies_7d), '7 ngày qua', (o.emergencies_7d > 0 ? coral : null))
        ].join('');
    }

    if (extraEl) {
        const alertTone = { bg: 'rgba(255,139,139,.14)', border: 'var(--coral,#ff8b8b)', color: coral };
        const signals = [];

        if (o.high_risk_users_7d > 0 || o.emergencies_7d > 0) {
            signals.push(signal(
                'An toàn người dùng',
                `${num(o.high_risk_users_7d)} người dùng nguy cơ cao và ${num(o.emergencies_7d)} lượt khẩn cấp trong 7 ngày qua — cần theo dõi sát.`,
                'Ưu tiên', alertTone
            ));
        }
        signals.push(signal(
            'Đối soát thanh toán',
            `${num(o.pending_payment_bookings)} booking cần xác nhận tiền vào trước khi chuyển cho chuyên gia.`,
            'Payments', (o.pending_payment_bookings > 0 ? alertTone : null)
        ));
        signals.push(signal(
            'Hồ sơ chuyên gia',
            `${num(o.pending_expert_applications)} hồ sơ đang chờ xét duyệt để mở quyền chuyên gia.`,
            'Experts', (o.pending_expert_applications > 0 ? alertTone : null)
        ));
        signals.push(signal(
            'Kiểm duyệt cộng đồng',
            `${num(o.reported_community_posts)} bài bị báo cáo, ${num(o.hidden_community_posts)} bài đang ẩn · tổng ${num(o.total_community_posts)} bài (+${num(o.community_posts_today)} hôm nay).`,
            'Community', (o.reported_community_posts > 0 ? alertTone : null)
        ));
        if (o.suspended_users > 0) {
            signals.push(signal(
                'Tài khoản bị khoá',
                `${num(o.suspended_users)} tài khoản đang ở trạng thái khoá.`,
                'Users'
            ));
        }

        let updatedAt = '';
        try { updatedAt = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); } catch (_e) { updatedAt = ''; }

        extraEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <h2 class="admin-list-title">Tín hiệu cần chú ý</h2>
                ${updatedAt ? `<span style="font-size:.74rem;color:var(--text-light,#a89585);">Cập nhật ${updatedAt}</span>` : ''}
            </div>
            <div class="admin-list">${signals.join('')}</div>
        `;
    }
}

loadOverview();
