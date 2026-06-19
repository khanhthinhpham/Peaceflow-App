import { apiClient } from '../api-client.js';
import { auth } from '../auth.js';
import { mountAdminShell, setAdminBadge } from './shell.js';
import { icon } from './icons.js';

mountAdminShell({ active: 'dashboard' });

const headerEl = document.getElementById('ovHeader');
const alertEl = document.getElementById('ovAlert');
const actionsEl = document.getElementById('ovActions');
const opsEl = document.getElementById('ovOps');
const financeEl = document.getElementById('ovFinance');
const communityEl = document.getElementById('ovCommunity');
const bookingChartEl = document.getElementById('ovBookingChart');

function num(v) { return Number(v || 0).toLocaleString('vi-VN'); }
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }

function deltaBadge(cur, prev, goodWhenUp = true) {
    const diff = Number(cur || 0) - Number(prev || 0);
    if (diff === 0) return '<span class="admin-delta">±0 vs tuần trước</span>';
    const up = diff > 0;
    const good = goodWhenUp ? up : !up;
    return `<span class="admin-delta admin-delta--${good ? 'up' : 'down'}">${up ? icon('arrow-up') : icon('arrow-down')} ${Math.abs(diff)} vs tuần trước</span>`;
}

function stat({ label, value, hint, ico, variant }) {
    return `
        <article class="admin-stat${variant ? ` admin-stat--${variant}` : ''}">
            <div class="admin-stat-top">
                <span class="admin-stat-label">${label}</span>
                ${ico ? `<span class="admin-stat-ico" aria-hidden="true">${ico}</span>` : ''}
            </div>
            <div class="admin-stat-value">${value}</div>
            <div class="admin-stat-hint">${hint || ''}</div>
        </article>
    `;
}

function quick({ ico, title, count, href }) {
    return `
        <a class="admin-quick" href="${href}">
            <span class="admin-quick-ico" aria-hidden="true">${ico}</span>
            <span class="admin-quick-title">${title}</span>
            <span class="admin-quick-count">${count}</span>
        </a>
    `;
}

// ===== SVG charts =====
function areaChart(series, color) {
    const w = 600, h = 150, pad = 8;
    if (!series.length) return '';
    const max = Math.max(1, ...series.map((s) => s.value));
    const stepX = (w - 2 * pad) / Math.max(1, series.length - 1);
    const pts = series.map((s, i) => [pad + i * stepX, h - pad - (s.value / max) * (h - 2 * pad - 6)]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `M${pts[0][0].toFixed(1)},${(h - pad).toFixed(1)} ${pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} L${pts[pts.length - 1][0].toFixed(1)},${(h - pad).toFixed(1)} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="admin-chart-svg" role="img">
        <path d="${area}" fill="${color}" fill-opacity="0.14"/>
        <path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
}
function barChart(series, color) {
    const w = 600, h = 150, pad = 8;
    if (!series.length) return '';
    const max = Math.max(1, ...series.map((s) => s.value));
    const gap = (w - 2 * pad) / series.length;
    const bw = gap * 0.62;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="admin-chart-svg" role="img">${series.map((s, i) => {
        const bh = (s.value / max) * (h - 2 * pad);
        const x = pad + i * gap + (gap - bw) / 2;
        const y = h - pad - bh;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, bh).toFixed(1)}" rx="1.5" fill="${color}" fill-opacity="0.85"/>`;
    }).join('')}</svg>`;
}
function dayLabel(iso) {
    if (!iso) return '';
    const [, m, d] = String(iso).split('-');
    return `${d}/${m}`;
}

async function load() {
    if (headerEl) headerEl.innerHTML = '<p class="admin-page-sub">Đang tải số liệu...</p>';

    let o, t;
    try {
        [o, t] = await Promise.all([
            apiClient.get('/admin/overview', { noCache: true }),
            apiClient.get('/admin/overview/trends', { noCache: true }).catch(() => ({ revenue: [], bookings: [], signups: [] }))
        ]);
    } catch (error) {
        if (headerEl) headerEl.innerHTML = `<div class="admin-card admin-empty" style="color:var(--coral);">${error.message || 'Không tải được tổng quan admin.'}</div>`;
        return;
    }

    setAdminBadge('experts', o.pending_expert_applications);
    setAdminBadge('payments', o.pending_payment_bookings);
    setAdminBadge('community', o.reported_community_posts);

    const name = (auth.getUser()?.display_name || auth.getUser()?.full_name || 'Admin').split(' ').slice(-1)[0];

    // ---- Header (lời chào + ngày giờ + làm mới) ----
    if (headerEl) {
        let stamp = '';
        try { stamp = new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (_e) { stamp = ''; }
        headerEl.innerHTML = `
            <div class="admin-ov-header-row">
                <div>
                    <p class="admin-page-kicker">PeaceFlow Admin</p>
                    <h1 class="admin-page-title">Xin chào, ${name}</h1>
                </div>
                <div class="admin-ov-header-meta">
                    <span>${stamp}</span>
                    <button type="button" id="ovRefreshBtn" class="admin-ov-refresh" aria-label="Làm mới">${icon('refresh')}</button>
                </div>
            </div>
        `;
        document.getElementById('ovRefreshBtn')?.addEventListener('click', load);
    }

    // ---- Alert banner (1 tín hiệu ưu tiên nhất) ----
    if (alertEl) {
        let a = null;
        if (o.high_risk_users_7d > 0) a = { variant: 'critical', ico: icon('alert'), title: `${num(o.high_risk_users_7d)} người dùng nguy cơ cao`, sub: `7 ngày · mức high/critical · ${deltaText(o.high_risk_users_7d, o.high_risk_users_prev_7d)}`, cta: 'Xem chi tiết', href: 'app.html?page=users.html' };
        else if (o.emergencies_7d > 0) a = { variant: 'critical', ico: icon('alert'), title: `${num(o.emergencies_7d)} lượt khẩn cấp`, sub: '7 ngày qua', cta: 'Xem', href: 'app.html?page=users.html' };
        else if (o.pending_payment_bookings > 0) a = { variant: 'warn', ico: icon('wallet'), title: `${num(o.pending_payment_bookings)} booking chờ đối soát`, sub: 'Cần xác nhận tiền vào', cta: 'Đối soát', href: 'app.html?page=payments.html' };
        else a = { variant: 'ok', ico: icon('check'), title: 'Mọi thứ đang ổn', sub: 'Không có việc nào cần xử lý gấp hôm nay.', cta: '', href: '' };

        alertEl.innerHTML = `
            <div class="admin-alert-banner admin-alert-banner--${a.variant}">
                <span class="admin-alert-banner-ico">${a.ico}</span>
                <div class="admin-alert-banner-body">
                    <span class="admin-alert-banner-title">${a.title}</span>
                    <span class="admin-alert-banner-sub">${a.sub}</span>
                </div>
                ${a.cta ? `<a class="admin-alert-banner-cta" href="${a.href}">${a.cta} →</a>` : ''}
            </div>
        `;
    }

    // ---- Thao tác nhanh (kèm số việc chờ) ----
    if (actionsEl) {
        actionsEl.innerHTML = `
            <h3 class="admin-ov-h">${icon('bolt')} Thao tác nhanh</h3>
            <div class="admin-quick-grid">
                ${quick({ ico: icon('clipboard-check'), title: 'Duyệt chuyên gia', count: `${num(o.pending_expert_applications)} chờ`, href: 'app.html?page=experts.html' })}
                ${quick({ ico: icon('card'), title: 'Thanh toán & payout', count: `${num(o.pending_payment_bookings)} chờ`, href: 'app.html?page=payments.html' })}
                ${quick({ ico: icon('shield'), title: 'Kiểm duyệt cộng đồng', count: `${num(o.reported_community_posts)} báo cáo`, href: 'app.html?page=community.html' })}
                ${quick({ ico: icon('users'), title: 'Quản lý người dùng', count: `${num(o.total_users)} tổng`, href: 'app.html?page=users.html' })}
            </div>
        `;
    }

    // ---- Vận hành ----
    if (opsEl) {
        opsEl.innerHTML = `
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">${icon('chart')} Vận hành</h3>
                <div class="admin-ov-grid">
                    ${stat({ label: 'Tổng người dùng', value: num(o.total_users), hint: `${deltaText(o.new_users_7d, o.new_users_prev_7d)} · +${num(o.new_users_today)} hôm nay`, ico: icon('users'), variant: 'ops' })}
                    ${stat({ label: 'Chuyên gia hoạt động', value: `${num(o.active_experts)}<span class="admin-stat-frac">/${num(o.total_experts)}</span>`, hint: `${o.total_experts ? Math.round((o.active_experts / o.total_experts) * 100) : 0}% hoạt động`, ico: icon('badge'), variant: 'ops' })}
                    ${stat({ label: 'Lịch hẹn', value: num(o.bookings_total), hint: `Hôm nay ${num(o.bookings_today)} · hoàn thành ${num(o.bookings_completed)}`, ico: icon('calendar'), variant: 'ops' })}
                    ${stat({ label: 'Lịch sắp tới', value: num(o.bookings_upcoming), hint: `${num(o.bookings_awaiting_expert)} chờ chuyên gia nhận`, ico: icon('clock'), variant: 'ops' })}
                </div>
            </div>
        `;
    }

    // ---- Tài chính (doanh thu hero + chart nhúng + 3 thẻ) ----
    if (financeEl) {
        const rev = t.revenue || [];
        const revSum = rev.reduce((acc, s) => acc + s.value, 0);
        const chart = revSum > 0
            ? areaChart(rev, '#4a9e8e')
            : '<div class="admin-finance-empty">Chưa có doanh thu. Biểu đồ sẽ hiện khi có giao dịch đầu tiên.</div>';
        financeEl.innerHTML = `
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">${icon('money')} Tài chính</h3>
                <div class="admin-finance-layout">
                    <div class="admin-card admin-finance-hero">
                        <div class="admin-finance-hero-head">
                            <div>
                                <span class="admin-stat-label">Doanh thu nền tảng</span>
                                <div class="admin-finance-hero-value">${money(o.platform_revenue)}</div>
                                <div class="admin-stat-hint">Phí 25% từ buổi đã đối soát · tháng này ${money(o.platform_revenue_month)}</div>
                            </div>
                            <span class="admin-chart-range">30 ngày qua</span>
                        </div>
                        <div class="admin-finance-hero-chart">${chart}</div>
                    </div>
                    <div class="admin-finance-side">
                        ${stat({ label: 'Tổng GMV', value: money(o.gmv), hint: 'Tổng giá trị giao dịch', ico: icon('card'), variant: 'finance' })}
                        ${stat({ label: 'Đã chi trả chuyên gia', value: money(o.total_paid_experts), hint: 'Cộng dồn các đợt payout', ico: icon('check'), variant: 'finance' })}
                        ${stat({ label: 'Số dư ví đang giữ', value: money(o.total_wallet_balance), hint: 'Nghĩa vụ hoàn cho người dùng', ico: icon('wallet'), variant: 'finance' })}
                        ${stat({ label: 'Chờ payout', value: money(o.pending_payout_amount), hint: `${num(o.pending_payout_experts)} chuyên gia đang chờ`, ico: icon('clock'), variant: 'finance' })}
                    </div>
                </div>
            </div>
        `;
    }

    // ---- Cộng đồng ----
    if (communityEl) {
        communityEl.innerHTML = `
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">${icon('message')} Cộng đồng</h3>
                <div class="admin-ov-grid">
                    ${stat({ label: 'Bài cộng đồng', value: num(o.total_community_posts), hint: `+${num(o.community_posts_today)} hôm nay`, ico: icon('message'), variant: 'ops' })}
                    ${stat({ label: 'Bài bị báo cáo', value: num(o.reported_community_posts), hint: `${num(o.hidden_community_posts)} đang ẩn`, ico: icon('flag'), variant: o.reported_community_posts > 0 ? 'alert' : 'warn' })}
                </div>
            </div>
        `;
    }

    // ---- Booking 30 ngày (chart full width) ----
    if (bookingChartEl) {
        const bk = t.bookings || [];
        const sum = bk.reduce((acc, s) => acc + s.value, 0);
        bookingChartEl.innerHTML = `
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">${icon('calendar')} Booking 30 ngày</h3>
                <div class="admin-card admin-chart-card">
                    <div class="admin-chart-head">
                        <p class="admin-chart-total">${num(sum)} lượt</p>
                        <span class="admin-chart-range">Tổng ${num(sum)}</span>
                    </div>
                    <div class="admin-chart-body">${barChart(bk, '#e0955a') || '<div class="admin-empty" style="padding:20px;">Chưa có dữ liệu</div>'}</div>
                    ${bk.length ? `<div class="admin-chart-xaxis"><span>${dayLabel(bk[0].day)}</span><span>${dayLabel(bk[bk.length - 1].day)}</span></div>` : ''}
                </div>
            </div>
        `;
    }
}

function deltaText(cur, prev) {
    const diff = Number(cur || 0) - Number(prev || 0);
    if (diff === 0) return '±0 vs tuần trước';
    return `${diff > 0 ? '+' : '−'}${Math.abs(diff)} vs tuần trước`;
}

load();
