import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'payments' });

const listEl = document.getElementById('adminPaymentsList');
const payoutsEl = document.getElementById('adminPayoutsList');

function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
    try {
        return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}
const TYPE = { chat: 'Chat text', voice: 'Gọi thoại', video: 'Video call', inperson: 'Gặp trực tiếp' };

async function load() {
    if (!listEl) return;
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    let rows = [];
    try {
        rows = await apiClient.get('/admin/bookings/pending-payment', { noCache: true });
    } catch (_e) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách (cần quyền admin).</div>';
        return;
    }
    setAdminBadge('payments', Array.isArray(rows) ? rows.length : 0);
    if (!Array.isArray(rows) || !rows.length) {
        listEl.innerHTML = '<div class="admin-card admin-empty">✅ Không có thanh toán nào đang chờ xác nhận.</div>';
        return;
    }
    listEl.innerHTML = rows.map((b) => `
        <div class="admin-card">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div>
                    <div style="font-weight:800;">${esc(b.client_name)} <span style="color:var(--text-light);font-weight:600;">→ ${esc(b.expert_name)}</span></div>
                    <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${esc(TYPE[b.session_type] || b.session_type)} · ${dt(b.starts_at)}</div>
                    ${b.notes ? `<div style="color:var(--text-secondary);font-size:0.82rem;margin-top:6px;">📝 ${esc(b.notes)}</div>` : ''}
                </div>
                <div style="text-align:right;min-width:160px;">
                    <div style="font-size:1.2rem;font-weight:800;color:var(--coral);">${money(b.amount)}</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">Nội dung CK:</div>
                    <div style="font-weight:800;font-family:monospace;">${esc(b.content || '')}</div>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end;">
                <button type="button" class="btn-outline" data-reject="${b.id}">Từ chối</button>
                <button type="button" class="btn-primary" data-confirm="${b.id}">✓ Xác nhận đã nhận tiền</button>
            </div>
        </div>
    `).join('');

    listEl.querySelectorAll('[data-confirm]').forEach((btn) => {
        btn.addEventListener('click', () => act(`/admin/bookings/${btn.getAttribute('data-confirm')}/confirm-payment`, btn));
    });
    listEl.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (window.confirm('Từ chối (không nhận được tiền) và huỷ đơn này?')) {
                act(`/admin/bookings/${btn.getAttribute('data-reject')}/reject-payment`, btn);
            }
        });
    });
}

async function act(url, btn) {
    btn.disabled = true;
    try {
        await apiClient.post(url, {});
        refreshAll();
    } catch (e) {
        alert(e.message || 'Thao tác thất bại.');
        btn.disabled = false;
    }
}

async function loadPayouts() {
    if (!payoutsEl) return;
    payoutsEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    let rows = [];
    try {
        rows = await apiClient.get('/admin/payouts/pending', { noCache: true });
    } catch (_e) {
        payoutsEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách.</div>';
        return;
    }
    if (!Array.isArray(rows) || !rows.length) {
        payoutsEl.innerHTML = '<div class="admin-card admin-empty">Không có số dư nào cần chi trả.</div>';
        return;
    }
    payoutsEl.innerHTML = rows.map((e) => `
        <div class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
            <div>
                <div style="font-weight:800;">${esc(e.full_name)}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary);">${esc(e.email || '')}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.2rem;font-weight:800;color:var(--mint-dark,#7BBF95);">${money(e.balance)}</div>
                <button type="button" class="btn-primary" style="margin-top:6px;" data-payout="${e.id}">Chi trả</button>
            </div>
        </div>
    `).join('');
    payoutsEl.querySelectorAll('[data-payout]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (window.confirm('Xác nhận đã chuyển khoản cho chuyên gia và đưa số dư về 0?')) {
                act(`/admin/payouts/${btn.getAttribute('data-payout')}`, btn);
            }
        });
    });
}

function refreshAll() { load(); loadPayouts(); }

document.getElementById('reloadBtn')?.addEventListener('click', refreshAll);
refreshAll();
