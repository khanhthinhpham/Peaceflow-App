import { apiClient } from '../api-client.js';
import { auth } from '../auth.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'dashboard' });

const headerEl = document.getElementById('ovHeader');
const alertsEl = document.getElementById('ovAlerts');
const kpisEl = document.getElementById('ovKpis');
const chartsEl = document.getElementById('ovCharts');
const tasksEl = document.getElementById('ovTasks');
const actionsEl = document.getElementById('ovActions');

function num(v) { return Number(v || 0).toLocaleString('vi-VN'); }
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function moneyShort(v) {
    const n = Number(v || 0);
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}tỷ`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}tr`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
    return `${n}`;
}

function deltaBadge(cur, prev, goodWhenUp = true) {
    const diff = Number(cur || 0) - Number(prev || 0);
    if (diff === 0) return '<span class="admin-delta">±0 vs tuần trước</span>';
    const up = diff > 0;
    const good = goodWhenUp ? up : !up;
    return `<span class="admin-delta admin-delta--${good ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(diff)} vs tuần trước</span>`;
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

// ===== SVG charts (vanilla, không thư viện) =====
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
function chartCard(title, total, series, type, color) {
    const sum = series.reduce((a, s) => a + s.value, 0);
    const svg = type === 'bar' ? barChart(series, color) : areaChart(series, color);
    return `
        <section class="admin-card admin-chart-card">
            <div class="admin-chart-head">
                <div>
                    <p class="admin-stat-label">${title}</p>
                    <p class="admin-chart-total">${total}</p>
                </div>
                <span class="admin-chart-range">30 ngày · tổng ${typeof sum === 'number' ? num(sum) : sum}</span>
            </div>
            <div class="admin-chart-body">${svg || '<div class="admin-empty" style="padding:20px;">Chưa có dữ liệu</div>'}</div>
        </section>
    `;
}

// ===== Alert center =====
function alertCard({ ico, num: n, label, cta, href, variant }) {
    const inner = `
        <span class="admin-alert-ico">${ico}</span>
        <div class="admin-alert-body">
            <span class="admin-alert-num">${n}</span>
            <span class="admin-alert-label">${label}</span>
        </div>
        ${cta ? `<span class="admin-alert-cta">${cta} →</span>` : ''}`;
    return href
        ? `<a class="admin-alert admin-alert--${variant}" href="${href}">${inner}</a>`
        : `<div class="admin-alert admin-alert--${variant}">${inner}</div>`;
}

// ===== Task inbox =====
function task({ ico, title, sub, cta, href, variant }) {
    return `
        <a class="admin-task admin-task--${variant}" href="${href}">
            <span class="admin-task-ico">${ico}</span>
            <div class="admin-task-body">
                <span class="admin-task-title">${title}</span>
                <span class="admin-task-sub">${sub}</span>
            </div>
            <span class="admin-task-cta">${cta} →</span>
        </a>
    `;
}

async function loadOverview() {
    if (kpisEl) kpisEl.innerHTML = '<div class="admin-card admin-empty">Đang tải số liệu...</div>';

    let o;
    try {
        o = await apiClient.get('/admin/overview', { noCache: true });
    } catch (error) {
        if (kpisEl) kpisEl.innerHTML = `<div class="admin-card admin-empty" style="color:var(--coral);">${error.message || 'Không tải được tổng quan admin.'}</div>`;
        return;
    }

    setAdminBadge('experts', o.pending_expert_applications);
    setAdminBadge('payments', o.pending_payment_bookings);
    setAdminBadge('community', o.reported_community_posts);

    const name = (auth.getUser()?.display_name || auth.getUser()?.full_name || 'Admin').split(' ').slice(-1)[0];

    // ---- Header kể chuyện ----
    if (headerEl) {
        const issues = [];
        if (o.high_risk_users_7d > 0) issues.push(`<strong>${num(o.high_risk_users_7d)}</strong> người dùng nguy cơ cao`);
        if (o.pending_payment_bookings > 0) issues.push(`<strong>${num(o.pending_payment_bookings)}</strong> booking chờ đối soát`);
        if (o.pending_payout_experts > 0) issues.push(`<strong>${num(o.pending_payout_experts)}</strong> payout chờ xử lý`);
        if (o.pending_expert_applications > 0) issues.push(`<strong>${num(o.pending_expert_applications)}</strong> hồ sơ chờ duyệt`);
        if (o.reported_community_posts > 0) issues.push(`<strong>${num(o.reported_community_posts)}</strong> bài bị báo cáo`);
        const sub = issues.length
            ? `Hôm nay cần chú ý: ${issues.slice(0, 3).join(' · ')}.`
            : 'Hôm nay chưa có việc nào cần xử lý gấp. 🎉';
        headerEl.innerHTML = `
            <p class="admin-page-kicker">PeaceFlow Admin</p>
            <h1 class="admin-page-title">Xin chào, ${name} 👋</h1>
            <p class="admin-page-sub">${sub}</p>
        `;
    }

    // ---- Alert center ----
    if (alertsEl) {
        const alerts = [];
        if (o.high_risk_users_7d > 0) {
            alerts.push(alertCard({ ico: '🚨', num: num(o.high_risk_users_7d), label: `người dùng nguy cơ cao (7n) ${deltaBadge(o.high_risk_users_7d, o.high_risk_users_prev_7d, false)}`, variant: 'critical' }));
        }
        if (o.emergencies_7d > 0) {
            alerts.push(alertCard({ ico: '🆘', num: num(o.emergencies_7d), label: 'lượt khẩn cấp (7 ngày)', variant: 'critical' }));
        }
        if (o.pending_payment_bookings > 0) {
            alerts.push(alertCard({ ico: '💰', num: num(o.pending_payment_bookings), label: 'booking chờ đối soát', cta: 'Đối soát', href: 'app.html?page=payments.html', variant: 'warn' }));
        }
        if (o.pending_payout_experts > 0) {
            alerts.push(alertCard({ ico: '💸', num: num(o.pending_payout_experts), label: 'payout chờ chi trả', cta: 'Chi trả', href: 'app.html?page=payments.html', variant: 'warn' }));
        }
        if (o.pending_expert_applications > 0) {
            alerts.push(alertCard({ ico: '🧑‍⚕️', num: num(o.pending_expert_applications), label: 'hồ sơ chờ duyệt', cta: 'Duyệt', href: 'app.html?page=experts.html', variant: 'info' }));
        }
        if (o.reported_community_posts > 0) {
            alerts.push(alertCard({ ico: '🚩', num: num(o.reported_community_posts), label: 'bài bị báo cáo', cta: 'Kiểm duyệt', href: 'app.html?page=community.html', variant: 'warn' }));
        }
        alertsEl.innerHTML = alerts.length
            ? alerts.join('')
            : alertCard({ ico: '✅', num: '', label: 'Mọi thứ đang ổn — không có việc gấp', variant: 'ok' });
    }

    // ---- KPI nhóm ----
    if (kpisEl) {
        kpisEl.innerHTML = `
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">💵 Tài chính</h3>
                <div class="admin-ov-grid">
                    ${stat({ label: 'Doanh thu nền tảng', value: money(o.platform_revenue), hint: 'Phí 25% từ buổi đã đối soát', ico: '🏦', variant: 'hero' })}
                    ${stat({ label: 'Doanh thu tháng này', value: money(o.platform_revenue_month), hint: 'Phí nền tảng trong tháng', ico: '📈', variant: 'finance' })}
                    ${stat({ label: 'Tổng GMV', value: money(o.gmv), hint: 'Tổng giá trị giao dịch', ico: '💳', variant: 'finance' })}
                    ${stat({ label: 'Đã chi trả chuyên gia', value: money(o.total_paid_experts), hint: 'Cộng dồn các đợt payout', ico: '✅', variant: 'finance' })}
                    ${stat({ label: 'Số dư ví đang giữ', value: money(o.total_wallet_balance), hint: 'Nghĩa vụ hoàn cho người dùng', ico: '👛', variant: 'finance' })}
                    ${stat({ label: 'Số dư chờ payout', value: money(o.pending_payout_amount), hint: `${num(o.pending_payout_experts)} chuyên gia đang chờ`, ico: '⏳', variant: 'finance' })}
                </div>
            </div>
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">📊 Vận hành</h3>
                <div class="admin-ov-grid">
                    ${stat({ label: 'Tổng người dùng', value: `${num(o.total_users)} <span class="admin-stat-sup">${deltaBadge(o.new_users_7d, o.new_users_prev_7d, true)}</span>`, hint: `+${num(o.new_users_today)} hôm nay`, ico: '👥', variant: 'ops' })}
                    ${stat({ label: 'Chuyên gia hoạt động', value: num(o.active_experts), hint: `${num(o.active_experts)}/${num(o.total_experts)} tổng số`, ico: '🧑‍⚕️', variant: 'ops' })}
                    ${stat({ label: 'Lịch hẹn', value: num(o.bookings_total), hint: `Hôm nay ${num(o.bookings_today)} · Hoàn thành ${num(o.bookings_completed)}`, ico: '📅', variant: 'ops' })}
                    ${stat({ label: 'Lịch sắp tới', value: num(o.bookings_upcoming), hint: `${num(o.bookings_awaiting_expert)} chờ chuyên gia nhận`, ico: '🕒', variant: 'ops' })}
                </div>
            </div>
            <div class="admin-ov-section">
                <h3 class="admin-ov-h">🛡️ An toàn & kiểm duyệt</h3>
                <div class="admin-ov-grid">
                    ${stat({ label: 'Người dùng nguy cơ cao', value: num(o.high_risk_users_7d), hint: `7 ngày · mức high/critical ${deltaBadge(o.high_risk_users_7d, o.high_risk_users_prev_7d, false)}`, ico: '🚨', variant: o.high_risk_users_7d > 0 ? 'alert' : 'warn' })}
                    ${stat({ label: 'Lượt khẩn cấp', value: num(o.emergencies_7d), hint: '7 ngày qua', ico: '🆘', variant: o.emergencies_7d > 0 ? 'alert' : 'warn' })}
                    ${stat({ label: 'Bài bị báo cáo', value: num(o.reported_community_posts), hint: `${num(o.hidden_community_posts)} đang ẩn`, ico: '🚩', variant: 'warn' })}
                    ${stat({ label: 'Bài cộng đồng', value: num(o.total_community_posts), hint: `+${num(o.community_posts_today)} hôm nay`, ico: '💬', variant: 'ops' })}
                </div>
            </div>
        `;
    }

    // ---- Quick actions ----
    if (actionsEl) {
        actionsEl.innerHTML = `
            <h2 class="admin-list-title">Thao tác nhanh</h2>
            <div class="admin-actions-grid">
                <a class="admin-action-btn" href="app.html?page=experts.html"><span>🧑‍⚕️</span> Duyệt chuyên gia</a>
                <a class="admin-action-btn" href="app.html?page=payments.html"><span>💸</span> Thanh toán & payout</a>
                <a class="admin-action-btn" href="app.html?page=community.html"><span>🛡️</span> Kiểm duyệt cộng đồng</a>
                <a class="admin-action-btn" href="app.html?page=users.html"><span>👥</span> Quản lý người dùng</a>
            </div>
        `;
    }

    // ---- Task inbox ----
    if (tasksEl) {
        let updatedAt = '';
        try { updatedAt = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); } catch (_e) { updatedAt = ''; }
        const items = [];
        if (o.high_risk_users_7d > 0 || o.emergencies_7d > 0) {
            items.push(task({ ico: '⚠️', title: 'An toàn người dùng', sub: `${num(o.high_risk_users_7d)} nguy cơ cao · ${num(o.emergencies_7d)} lượt khẩn cấp (7 ngày)`, cta: 'Theo dõi', href: 'app.html?page=users.html', variant: 'critical' }));
        }
        if (o.pending_payment_bookings > 0) {
            items.push(task({ ico: '💰', title: 'Đối soát thanh toán', sub: `${num(o.pending_payment_bookings)} booking chờ xác nhận tiền vào`, cta: 'Đối soát', href: 'app.html?page=payments.html', variant: 'warn' }));
        }
        if (o.pending_payout_experts > 0) {
            items.push(task({ ico: '💸', title: 'Chi trả chuyên gia', sub: `${num(o.pending_payout_experts)} chuyên gia · ${money(o.pending_payout_amount)} chờ chi trả`, cta: 'Chi trả', href: 'app.html?page=payments.html', variant: 'warn' }));
        }
        if (o.pending_expert_applications > 0) {
            items.push(task({ ico: '🧑‍⚕️', title: 'Hồ sơ chuyên gia', sub: `${num(o.pending_expert_applications)} hồ sơ chờ xét duyệt`, cta: 'Mở danh sách', href: 'app.html?page=experts.html', variant: 'info' }));
        }
        if (o.reported_community_posts > 0) {
            items.push(task({ ico: '🚩', title: 'Kiểm duyệt cộng đồng', sub: `${num(o.reported_community_posts)} bài bị báo cáo`, cta: 'Kiểm duyệt', href: 'app.html?page=community.html', variant: 'warn' }));
        }
        tasksEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <h2 class="admin-list-title">Việc cần xử lý</h2>
                ${updatedAt ? `<span style="font-size:.74rem;color:var(--text-light,#a89585);">Cập nhật ${updatedAt}</span>` : ''}
            </div>
            ${items.length ? `<div class="admin-task-list">${items.join('')}</div>` : '<p class="admin-note" style="margin-top:10px;">Không có việc nào cần xử lý ngay. 🎉</p>'}
        `;
    }

    loadTrends();
}

async function loadTrends() {
    if (!chartsEl) return;
    chartsEl.innerHTML = '<div class="admin-card admin-empty">Đang tải biểu đồ...</div>';
    let t;
    try {
        t = await apiClient.get('/admin/overview/trends', { noCache: true });
    } catch (_e) {
        chartsEl.innerHTML = '';
        return;
    }
    const revTotal = (t.revenue || []).reduce((a, s) => a + s.value, 0);
    chartsEl.innerHTML = [
        chartCard('Doanh thu nền tảng (30 ngày)', money(revTotal), t.revenue || [], 'area', '#4a9e8e'),
        chartCard('Booking theo ngày (30 ngày)', `${num((t.bookings || []).reduce((a, s) => a + s.value, 0))} lượt`, t.bookings || [], 'bar', '#e0955a')
    ].join('');
}

loadOverview();
