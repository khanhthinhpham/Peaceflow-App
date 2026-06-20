import { apiClient } from '../api-client.js';
import { auth } from '../auth.js';
import { mountAdminShell } from './shell.js';
import { icon } from './icons.js';

mountAdminShell({ active: 'users' });

const listEl = document.getElementById('adminUsersList');
const metaEl = document.getElementById('adminUsersMeta');
const pagerEl = document.getElementById('adminUsersPager');
const searchEl = document.getElementById('userSearch');
const roleFilterEl = document.getElementById('userRoleFilter');
const statusTabsEl = document.getElementById('userStatusTabs');
const pageSizeEl = document.getElementById('userPageSize');

const myId = auth.getUser()?.id || null;
let LIMIT = parseInt(pageSizeEl?.value, 10) || 10;
const state = { search: '', role: '', status: '', page: 0, total: 0 };

function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Sang tab Quản lý lịch hẹn, lọc sẵn theo người này.
function goToBookings(filter) {
    sessionStorage.setItem('admin_bookings_filter', filter || '');
    if (window.AdminRouter?.navigate) window.AdminRouter.navigate('bookings.html');
    else window.location.href = 'app.html?page=bookings.html';
}
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
    if (!v) return '—';
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}
function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

const ROLE_LABEL = { user: 'Người dùng', expert: 'Chuyên gia', admin: 'Quản trị' };
function roleChip(role) {
    const map = {
        user: ['var(--cream,#fff8f0)', 'var(--text-secondary,#7a6555)', 'var(--kraft-light,#e8cba7)'],
        expert: ['var(--mint-light,#c5e8d2)', 'var(--mint-dark,#4a9e8e)', 'var(--mint,#a8d5ba)'],
        admin: ['rgba(255,139,139,.14)', 'var(--coral-dark,#e05555)', 'var(--coral,#ff8b8b)']
    };
    const [bg, color, border] = map[role] || map.user;
    return `<span style="font-size:.7rem;font-weight:800;padding:1px 8px;border-radius:6px;background:${bg};color:${color};border:1px solid ${border};white-space:nowrap;">${ROLE_LABEL[role] || role}</span>`;
}
function statusChip(status) {
    const map = {
        active: ['Hoạt động', 'var(--mint-light,#c5e8d2)', 'var(--mint-dark,#4a9e8e)'],
        suspended: ['Đã khoá', 'rgba(255,139,139,.14)', 'var(--coral-dark,#e05555)'],
        inactive: ['Ngừng', 'var(--cream,#fff8f0)', 'var(--text-light,#a89585)'],
        deleted: ['Đã xoá', 'var(--cream,#fff8f0)', 'var(--text-light,#a89585)'],
        pending: ['Chờ duyệt', 'rgba(245,176,65,.16)', '#b5791b']
    };
    const [label, bg, color] = map[status] || [status, 'var(--cream)', 'var(--text-light)'];
    return `<span style="font-size:.7rem;font-weight:800;padding:1px 8px;border-radius:6px;background:${bg};color:${color};white-space:nowrap;">${label}</span>`;
}

function card(u) {
    const self = u.id === myId;
    const locked = u.status === 'suspended';
    return `
        <div class="admin-card" data-user="${u.id}">
            <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;justify-content:space-between;">
                <div style="display:flex;gap:12px;min-width:0;">
                    <div class="admin-user-bubble">${esc(initials(u.display_name || u.full_name))}</div>
                    <div style="min-width:0;">
                        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                            <span style="font-weight:800;">${esc(u.display_name || u.full_name || 'Ẩn danh')}</span>
                            ${roleChip(u.role)} ${statusChip(u.status)}
                            ${self ? '<span style="font-size:.68rem;color:var(--text-light);">(bạn)</span>' : ''}
                        </div>
                        <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">${esc(u.email)}${u.email_verified ? '' : ' · <span style="color:var(--coral-dark);">chưa xác thực</span>'}</div>
                        <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">Ví: <strong>${money(u.wallet_balance)}</strong> · Tạo: ${dt(u.created_at)} · Đăng nhập: ${dt(u.last_login_at)}</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <button type="button" class="btn-outline" data-bookings="${esc(u.email || '')}" style="font-size:.82rem;">${icon('calendar')} Lịch hẹn</button>
                    <button type="button" class="${locked ? 'btn-primary' : 'btn-outline'}" data-lock ${self ? 'disabled' : ''} style="font-size:.82rem;">${locked ? 'Mở khoá' : 'Khoá'}</button>
                </div>
            </div>
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
        if (state.search) qs.set('search', state.search);
        if (state.role) qs.set('role', state.role);
        if (state.status) qs.set('status', state.status);
        data = await apiClient.get(`/admin/users?${qs.toString()}`, { noCache: true });
    } catch (_e) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách (cần quyền admin).</div>';
        return;
    }
    const users = data?.users || [];
    state.total = data?.total || 0;

    listEl.innerHTML = users.length ? users.map(card).join('') : '<div class="admin-card admin-empty">Không tìm thấy người dùng nào.</div>';
    bindRows();

    const totalPages = Math.max(1, Math.ceil(state.total / LIMIT));
    const from = state.total ? state.page * LIMIT + 1 : 0;
    const to = state.page * LIMIT + users.length;
    metaEl.textContent = `${from}–${to} trong ${state.total} người dùng · Trang ${state.page + 1}/${totalPages}`;
    renderPager(totalPages);
}

// Tính dải số trang cần hiển thị (luôn có trang đầu/cuối, dấu … khi xa).
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
    parts.push(`<button type="button" class="admin-page-btn" data-page="0" ${cur === 0 ? 'disabled' : ''} title="Trang đầu">« Đầu</button>`);
    parts.push(`<button type="button" class="admin-page-btn" data-page="${cur - 1}" ${cur === 0 ? 'disabled' : ''}>‹ Trước</button>`);
    for (const p of pageWindow(cur, totalPages)) {
        if (p === '…') {
            parts.push('<span class="admin-page-ellipsis">…</span>');
        } else {
            parts.push(`<button type="button" class="admin-page-btn${p === cur ? ' active' : ''}" data-page="${p}">${p + 1}</button>`);
        }
    }
    parts.push(`<button type="button" class="admin-page-btn" data-page="${cur + 1}" ${cur >= last ? 'disabled' : ''}>Sau ›</button>`);
    parts.push(`<button type="button" class="admin-page-btn" data-page="${last}" ${cur >= last ? 'disabled' : ''} title="Trang cuối">Cuối »</button>`);
    pagerEl.innerHTML = parts.join('');

    pagerEl.querySelectorAll('.admin-page-btn[data-page]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (!Number.isNaN(p) && p !== state.page) {
                load(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function bindRows() {
    listEl.querySelectorAll('[data-user]').forEach((row) => {
        const id = row.getAttribute('data-user');
        row.querySelector('[data-bookings]')?.addEventListener('click', (e) => {
            goToBookings(e.currentTarget.getAttribute('data-bookings'));
        });
        row.querySelector('[data-lock]')?.addEventListener('click', (e) => {
            const locked = e.target.textContent.trim() === 'Mở khoá';
            const nextStatus = locked ? 'active' : 'suspended';
            const msg = locked ? 'Mở khoá tài khoản này?' : 'Khoá tài khoản này? Người dùng sẽ không đăng nhập được.';
            if (!window.confirm(msg)) return;
            patch(id, { status: nextStatus }, e.target);
        });
    });
}

async function patch(id, body, ctrl) {
    if (ctrl) ctrl.disabled = true;
    try {
        await apiClient.patch(`/admin/users/${id}`, body);
        await load(state.page);
    } catch (e) {
        alert(e.message || 'Cập nhật thất bại.');
        if (ctrl) ctrl.disabled = false;
    }
}

function applySearch() {
    state.search = (searchEl.value || '').trim();
    state.role = roleFilterEl.value || '';
    load(0);
}

document.getElementById('userSearchBtn')?.addEventListener('click', applySearch);
searchEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applySearch(); });
roleFilterEl?.addEventListener('change', applySearch);
pageSizeEl?.addEventListener('change', () => {
    LIMIT = parseInt(pageSizeEl.value, 10) || 10;
    load(0);
});
statusTabsEl?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    statusTabsEl.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t === tab));
    state.status = tab.getAttribute('data-status') || '';
    load(0);
});

load(0);
