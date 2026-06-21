import { apiClient } from '../api-client.js';
import { mountAdminShell } from './shell.js';

mountAdminShell({ active: 'bookings' });

const listEl = document.getElementById('adminBookingsList');
const metaEl = document.getElementById('adminBookingsMeta');
const pagerEl = document.getElementById('adminBookingsPager');
const tabsEl = document.getElementById('bookingStatusTabs');
const searchEl = document.getElementById('bookingSearch');

const pageSizeEl = document.getElementById('bookingPageSize');
let LIMIT = parseInt(pageSizeEl?.value, 10) || 10;
const state = { status: '', search: '', page: 0, total: 0 };

function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
    if (!v) return '—';
    try {
        return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}

const SESSION_TYPE = { chat: 'Chat text', voice: 'Gọi thoại', video: 'Video call', inperson: 'Gặp trực tiếp' };
const STATUS = {
    pending_payment: { label: 'Chờ thanh toán', bg: 'rgba(245,176,65,.16)', color: '#b5791b' },
    pending: { label: 'Chờ đối soát', bg: 'rgba(245,176,65,.16)', color: '#b5791b' },
    awaiting_expert: { label: 'Chờ chuyên gia nhận', bg: '#eef3fb', color: '#2b5b9e' },
    confirmed: { label: 'Đã xác nhận', bg: 'var(--mint-light,#c5e8d2)', color: 'var(--mint-dark,#2f7d52)' },
    completed: { label: 'Hoàn thành', bg: '#e9f6ee', color: '#2f7d52' },
    cancelled: { label: 'Đã huỷ', bg: 'rgba(255,139,139,.14)', color: 'var(--coral-dark,#e05555)' },
    expired: { label: 'Hết hạn', bg: 'rgba(74,55,40,.08)', color: 'var(--text-light,#a89585)' }
};
const TAB_ORDER = ['', 'pending_payment', 'pending', 'awaiting_expert', 'confirmed', 'completed', 'cancelled', 'expired'];

function statusBadge(status) {
    const s = STATUS[status] || { label: status, bg: 'var(--cream)', color: 'var(--text-light)' };
    return `<span style="font-size:.72rem;font-weight:800;padding:2px 10px;border-radius:999px;background:${s.bg};color:${s.color};white-space:nowrap;">${s.label}</span>`;
}

function renderTabs(summary) {
    const total = Object.values(summary || {}).reduce((a, c) => a + c, 0);
    tabsEl.innerHTML = TAB_ORDER.map((st) => {
        const label = st === '' ? 'Tất cả' : (STATUS[st]?.label || st);
        const count = st === '' ? total : (summary?.[st] || 0);
        const active = st === state.status ? ' active' : '';
        return `<button type="button" class="admin-tab${active}" data-status="${st}">${label} (${count})</button>`;
    }).join('');
}

function card(b) {
    const pay = b.order_code
        ? `<div style="margin-top:8px;font-size:.82rem;color:var(--text-secondary);">Mã CK: <strong style="font-family:monospace;">${esc(b.payment_content || b.order_code)}</strong>${b.payment_status ? ` · TT: ${esc(b.payment_status)}` : ''}</div>`
        : '';
    return `
        <div class="admin-card">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
                <div style="min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span class="bk-link" data-search="${esc(b.client_email || b.client_name || '')}" title="Chỉ xem lịch của người này" style="font-weight:800;cursor:pointer;text-decoration:underline dotted;">${esc(b.client_name || 'Thân chủ')}</span>
                        <span style="color:var(--text-light);">→</span>
                        <span class="bk-link" data-search="${esc(b.expert_name || '')}" title="Chỉ xem lịch của chuyên gia này" style="font-weight:800;color:var(--mint-dark,#2f7d52);cursor:pointer;text-decoration:underline dotted;">${esc(b.expert_name || 'Chuyên gia')}</span>
                        ${statusBadge(b.status)}
                    </div>
                    <div style="color:var(--text-secondary);font-size:.84rem;margin-top:4px;">
                        ${esc(SESSION_TYPE[b.session_type] || b.session_type)} · ${dt(b.starts_at)} · ${Number(b.duration_minutes || 0)} phút
                    </div>
                    <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">
                        ${esc(b.client_email || '')}${b.expert_code ? ` · ${esc(b.expert_code)}` : ''}
                    </div>
                </div>
                <div style="text-align:right;white-space:nowrap;">
                    <div style="font-size:1.15rem;font-weight:800;color:var(--coral);">${money(b.amount)}</div>
                    <div style="font-size:.74rem;color:var(--text-light);">Tạo: ${dt(b.created_at)}</div>
                    ${b.paid_at ? `<div style="font-size:.74rem;color:var(--text-light);">TT: ${dt(b.paid_at)}</div>` : ''}
                </div>
            </div>
            ${b.notes ? `<div style="margin-top:10px;font-size:.84rem;color:var(--text-secondary);background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);border-radius:10px;padding:8px 12px;">📝 ${esc(b.notes)}</div>` : ''}
            ${b.status === 'cancelled' && b.cancel_reason ? `<div style="margin-top:8px;font-size:.8rem;color:var(--coral-dark);">Lý do huỷ: ${esc(b.cancel_reason)}</div>` : ''}
            ${pay}
        </div>
    `;
}

async function load(page = state.page) {
    state.page = Math.max(0, page);
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    pagerEl.innerHTML = '';
    let data;
    try {
        const qs = new URLSearchParams({ limit: String(LIMIT), offset: String(state.page * LIMIT) });
        if (state.status) qs.set('status', state.status);
        if (state.search) qs.set('search', state.search);
        data = await apiClient.get(`/admin/bookings?${qs.toString()}`, { noCache: true });
    } catch (_e) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách (cần quyền admin).</div>';
        return;
    }
    renderTabs(data?.summary);
    const rows = data?.bookings || [];
    state.total = data?.total || 0;

    listEl.innerHTML = rows.length ? rows.map(card).join('') : '<div class="admin-card admin-empty">Không có lịch hẹn nào.</div>';

    const totalPages = Math.max(1, Math.ceil(state.total / LIMIT));
    const from = state.total ? state.page * LIMIT + 1 : 0;
    const to = state.page * LIMIT + rows.length;
    metaEl.innerHTML = `${from}–${to} trong ${state.total} lịch hẹn · Trang ${state.page + 1}/${totalPages}`
        + (state.search ? ` · <a href="#" id="bkClear" style="color:var(--coral-dark,#e05555);font-weight:700;">✕ Bỏ lọc "${esc(state.search)}"</a>` : '');
    document.getElementById('bkClear')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.search = '';
        if (searchEl) searchEl.value = '';
        load(0);
    });
    renderPager(totalPages);
}

function pageWindow(current, total) {
    const pages = new Set([0, total - 1, current, current - 1, current + 1]);
    const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
    const out = [];
    let prev = null;
    for (const p of sorted) {
        if (prev !== null && p - prev > 1) out.push('…');
        out.push(p);
        prev = p;
    }
    return out;
}

function renderPager(totalPages) {
    if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
    const cur = state.page;
    const last = totalPages - 1;
    const parts = [];
    parts.push(`<button type="button" class="admin-page-btn" data-page="0" ${cur === 0 ? 'disabled' : ''}>« Đầu</button>`);
    parts.push(`<button type="button" class="admin-page-btn" data-page="${cur - 1}" ${cur === 0 ? 'disabled' : ''}>‹ Trước</button>`);
    for (const p of pageWindow(cur, totalPages)) {
        parts.push(p === '…' ? '<span class="admin-page-ellipsis">…</span>' : `<button type="button" class="admin-page-btn${p === cur ? ' active' : ''}" data-page="${p}">${p + 1}</button>`);
    }
    parts.push(`<button type="button" class="admin-page-btn" data-page="${cur + 1}" ${cur >= last ? 'disabled' : ''}>Sau ›</button>`);
    parts.push(`<button type="button" class="admin-page-btn" data-page="${last}" ${cur >= last ? 'disabled' : ''}>Cuối »</button>`);
    pagerEl.innerHTML = parts.join('');
    pagerEl.querySelectorAll('.admin-page-btn[data-page]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (!Number.isNaN(p) && p !== state.page) { load(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });
    });
}

tabsEl?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    state.status = tab.getAttribute('data-status') || '';
    load(0);
});

// Bấm tên thân chủ/chuyên gia → chỉ xem lịch của riêng người đó.
listEl?.addEventListener('click', (e) => {
    const link = e.target.closest('.bk-link[data-search]');
    if (!link) return;
    const value = link.getAttribute('data-search') || '';
    if (!value) return;
    if (searchEl) searchEl.value = value;
    state.search = value;
    load(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function applySearch() {
    state.search = (searchEl.value || '').trim();
    load(0);
}
document.getElementById('bookingSearchBtn')?.addEventListener('click', applySearch);
searchEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applySearch(); });
pageSizeEl?.addEventListener('change', () => { LIMIT = parseInt(pageSizeEl.value, 10) || 10; load(0); });
document.getElementById('reloadBtn')?.addEventListener('click', () => load(state.page));

// Bộ lọc đặt sẵn khi điều hướng từ tab Người dùng / Chuyên gia.
const preset = sessionStorage.getItem('admin_bookings_filter');
if (preset) {
    sessionStorage.removeItem('admin_bookings_filter');
    state.search = preset;
    if (searchEl) searchEl.value = preset;
}

load(0);
