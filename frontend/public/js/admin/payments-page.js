import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';
import { icon } from './icons.js';
import { renderPager } from './pager.js';

mountAdminShell({ active: 'payments' });

const listEl = document.getElementById('adminPaymentsList');
const payoutsEl = document.getElementById('adminPayoutsList');
const payMetaEl = document.getElementById('adminPaymentsMeta');
const payPagerEl = document.getElementById('adminPaymentsPager');
const poMetaEl = document.getElementById('adminPayoutsMeta');
const poPagerEl = document.getElementById('adminPayoutsPager');
const PAY_LIMIT = 20;
const payState = { page: 0, total: 0 };
const poState = { page: 0, total: 0 };

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function money(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function dt(value) {
    try {
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        }).format(new Date(value));
    } catch (_error) {
        return value;
    }
}

const TYPE = {
    chat: 'Chat text',
    voice: 'Gọi thoại',
    video: 'Video call',
    inperson: 'Gặp trực tiếp'
};

async function loadPayments(page = payState.page) {
    if (!listEl) return;
    payState.page = Math.max(0, page);
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    if (payPagerEl) payPagerEl.innerHTML = '';

    let data;
    try {
        const qs = new URLSearchParams({ limit: String(PAY_LIMIT), offset: String(payState.page * PAY_LIMIT) });
        data = await apiClient.get(`/admin/bookings/pending-payment?${qs.toString()}`, { noCache: true });
    } catch (_error) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách chờ xác nhận thanh toán.</div>';
        return;
    }

    const rows = data?.bookings || [];
    payState.total = data?.total || 0;
    setAdminBadge('payments', payState.total);

    if (!rows.length) {
        listEl.innerHTML = '<div class="admin-card admin-empty">Không có booking nào đang chờ xác nhận thanh toán.</div>';
        if (payMetaEl) payMetaEl.textContent = '';
        if (payPagerEl) payPagerEl.innerHTML = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(payState.total / PAY_LIMIT));
    if (payMetaEl) payMetaEl.textContent = `${payState.page * PAY_LIMIT + 1}–${payState.page * PAY_LIMIT + rows.length} trong ${payState.total} đơn · Trang ${payState.page + 1}/${totalPages}`;

    listEl.innerHTML = rows.map((booking) => `
        <div class="admin-card">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div>
                    <div style="font-weight:800;">${esc(booking.client_name)} <span style="color:var(--text-light);font-weight:600;">→ ${esc(booking.expert_name)}</span></div>
                    <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${esc(TYPE[booking.session_type] || booking.session_type)} · ${dt(booking.starts_at)}</div>
                    ${booking.notes ? `<div style="color:var(--text-secondary);font-size:0.82rem;margin-top:6px;">Ghi chú: ${esc(booking.notes)}</div>` : ''}
                </div>
                <div style="text-align:right;min-width:160px;">
                    <div style="font-size:1.2rem;font-weight:800;color:var(--coral);">${money(booking.amount)}</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">Nội dung chuyển khoản</div>
                    <div style="font-weight:800;font-family:monospace;">${esc(booking.content || '')}</div>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end;">
                <button type="button" class="btn-outline" data-reject="${booking.id}">Từ chối</button>
                <button type="button" class="btn-primary" data-confirm="${booking.id}">Xác nhận đã nhận tiền</button>
            </div>
        </div>
    `).join('');

    listEl.querySelectorAll('[data-confirm]').forEach((button) => {
        button.addEventListener('click', () => act(`/admin/bookings/${button.getAttribute('data-confirm')}/confirm-payment`, button));
    });

    listEl.querySelectorAll('[data-reject]').forEach((button) => {
        button.addEventListener('click', () => {
            if (window.confirm('Từ chối thanh toán này và hủy booking?')) {
                act(`/admin/bookings/${button.getAttribute('data-reject')}/reject-payment`, button);
            }
        });
    });

    renderPager(payPagerEl, { page: payState.page, totalPages: Math.max(1, Math.ceil(payState.total / PAY_LIMIT)), onGo: (p) => loadPayments(p) });
}

async function loadPayouts(page = poState.page) {
    if (!payoutsEl) return;
    poState.page = Math.max(0, page);
    payoutsEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    if (poPagerEl) poPagerEl.innerHTML = '';

    let data;
    try {
        const qs = new URLSearchParams({ limit: String(PAY_LIMIT), offset: String(poState.page * PAY_LIMIT) });
        data = await apiClient.get(`/admin/payouts/pending?${qs.toString()}`, { noCache: true });
    } catch (_error) {
        payoutsEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách payout.</div>';
        return;
    }

    const rows = data?.experts || [];
    poState.total = data?.total || 0;

    if (!rows.length) {
        payoutsEl.innerHTML = '<div class="admin-card admin-empty">Không có số dư nào cần chi trả.</div>';
        if (poMetaEl) poMetaEl.textContent = '';
        if (poPagerEl) poPagerEl.innerHTML = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(poState.total / PAY_LIMIT));
    if (poMetaEl) poMetaEl.textContent = `${poState.page * PAY_LIMIT + 1}–${poState.page * PAY_LIMIT + rows.length} trong ${poState.total} chuyên gia · Trang ${poState.page + 1}/${totalPages}`;

    payoutsEl.innerHTML = rows.map((expert) => `
        <div class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
            <div>
                <div style="font-weight:800;">${esc(expert.full_name)}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary);">${esc(expert.email || '')}</div>
                ${expert.payout_account_number
                    ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;">${icon('card')} ${esc(expert.payout_bank_name || '')} · <strong style="font-family:monospace;">${esc(expert.payout_account_number)}</strong>${expert.payout_account_name ? ' · ' + esc(expert.payout_account_name) : ''}</div>`
                    : `<div style="font-size:0.82rem;color:var(--coral-dark);margin-top:4px;">${icon('alert')} Chưa cập nhật tài khoản nhận tiền</div>`}
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.2rem;font-weight:800;color:var(--mint-dark,#7BBF95);">${money(expert.balance)}</div>
                <button type="button" class="btn-primary" style="margin-top:6px;" data-payout="${expert.id}">Chi trả</button>
            </div>
        </div>
    `).join('');

    payoutsEl.querySelectorAll('[data-payout]').forEach((button) => {
        button.addEventListener('click', () => {
            if (window.confirm('Xác nhận đã chuyển khoản cho chuyên gia và đưa số dư về 0?')) {
                act(`/admin/payouts/${button.getAttribute('data-payout')}`, button);
            }
        });
    });

    renderPager(poPagerEl, { page: poState.page, totalPages: Math.max(1, Math.ceil(poState.total / PAY_LIMIT)), onGo: (p) => loadPayouts(p) });
}

async function act(url, button) {
    button.disabled = true;
    try {
        await apiClient.post(url, {});
        refreshAll();
    } catch (error) {
        alert(error.message || 'Thao tác thất bại.');
        button.disabled = false;
    }
}

function refreshAll() {
    loadPayments();
    loadPayouts();
}

document.getElementById('reloadBtn')?.addEventListener('click', refreshAll);

refreshAll();
