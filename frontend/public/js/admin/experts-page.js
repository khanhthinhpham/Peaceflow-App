import { apiClient, API_BASE_URL } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';

mountAdminShell({ active: 'experts' });

const listEl = document.getElementById('adminApplicationsList');
const tabsEl = document.getElementById('adminApplicationsTabs');
let currentStatus = 'pending';

function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dt(v) {
    if (!v) return '';
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}
function specialties(v) {
    let arr = v;
    if (typeof v === 'string') { try { arr = JSON.parse(v); } catch (_e) { arr = []; } }
    return Array.isArray(arr) ? arr : [];
}

const STATUS_BADGE = {
    pending: { label: 'Chờ duyệt', bg: 'rgba(245,176,65,.16)', color: '#b5791b', border: 'rgba(245,176,65,.5)' },
    approved: { label: 'Đã duyệt', bg: 'var(--mint-light,#c5e8d2)', color: 'var(--mint-dark,#4a9e8e)', border: 'var(--mint,#a8d5ba)' },
    rejected: { label: 'Từ chối', bg: 'rgba(255,139,139,.14)', color: 'var(--coral-dark,#e05555)', border: 'var(--coral,#ff8b8b)' }
};

function badge(status) {
    const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
    return `<span style="font-size:.72rem;font-weight:800;padding:2px 9px;border-radius:999px;background:${s.bg};color:${s.color};border:1px solid ${s.border};white-space:nowrap;">${s.label}</span>`;
}

function chip(text) {
    return `<span style="font-size:.74rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">${esc(text)}</span>`;
}

function card(a) {
    const sp = specialties(a.specialties);
    const credHref = a.credential_path ? `${API_BASE_URL}${a.credential_path}` : null;
    return `
        <div class="admin-card">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
                <div style="min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span style="font-weight:800;font-size:1.05rem;">${esc(a.full_name)}</span>
                        ${badge(a.status)}
                    </div>
                    <div style="color:var(--text-secondary);font-size:.85rem;margin-top:3px;">${esc(a.email || '')}${a.phone ? ' · ' + esc(a.phone) : ''}</div>
                </div>
                <div style="font-size:.78rem;color:var(--text-light);text-align:right;white-space:nowrap;">Gửi: ${dt(a.created_at)}${a.reviewed_at ? `<br>Xử lý: ${dt(a.reviewed_at)}` : ''}</div>
            </div>

            <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:.86rem;color:var(--text-secondary);">
                <span><strong>Bằng cấp:</strong> ${esc(a.degree || '—')}</span>
                <span><strong>Kinh nghiệm:</strong> ${Number(a.experience_years || 0)} năm</span>
                ${a.location ? `<span><strong>Khu vực:</strong> ${esc(a.location)}</span>` : ''}
            </div>

            ${sp.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">${sp.map(chip).join('')}</div>` : ''}
            ${a.bio ? `<div style="margin-top:10px;font-size:.86rem;color:var(--text-secondary);line-height:1.55;">${esc(a.bio)}</div>` : ''}

            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;">
                <div>
                    ${credHref ? `<a href="${credHref}" target="_blank" rel="noopener" class="btn-outline" style="font-size:.82rem;">📄 Xem bằng cấp${a.credential_filename ? ` (${esc(a.credential_filename)})` : ''}</a>` : '<span style="color:var(--text-light);font-size:.82rem;">Không có file bằng cấp</span>'}
                </div>
                ${a.status === 'pending' ? `
                    <div style="display:flex;gap:10px;">
                        <button type="button" class="btn-outline" data-reject="${a.id}">Từ chối</button>
                        <button type="button" class="btn-primary" data-approve="${a.id}">✓ Duyệt hồ sơ</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

async function load(status = currentStatus) {
    currentStatus = status;
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    let rows = [];
    try {
        rows = await apiClient.get(`/admin/expert-applications?status=${encodeURIComponent(status)}`, { noCache: true });
    } catch (_e) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách (cần quyền admin).</div>';
        return;
    }
    if (!Array.isArray(rows) || !rows.length) {
        const msg = status === 'pending' ? '✅ Không có hồ sơ nào đang chờ duyệt.' : 'Không có hồ sơ nào.';
        listEl.innerHTML = `<div class="admin-card admin-empty">${msg}</div>`;
        if (status === 'pending') setAdminBadge('experts', 0);
        return;
    }
    if (status === 'pending') setAdminBadge('experts', rows.length);
    listEl.innerHTML = rows.map(card).join('');

    listEl.querySelectorAll('[data-approve]').forEach((btn) => {
        btn.addEventListener('click', () => act(`/admin/expert-applications/${btn.getAttribute('data-approve')}/approve`, btn, 'Duyệt hồ sơ này và mở quyền chuyên gia?'));
    });
    listEl.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', () => act(`/admin/expert-applications/${btn.getAttribute('data-reject')}/reject`, btn, 'Từ chối hồ sơ này?'));
    });
}

async function act(url, btn, confirmMsg) {
    if (!window.confirm(confirmMsg)) return;
    btn.disabled = true;
    try {
        await apiClient.post(url, {});
        await load(currentStatus);
        await refreshPendingBadge();
    } catch (e) {
        alert(e.message || 'Thao tác thất bại.');
        btn.disabled = false;
    }
}

async function refreshPendingBadge() {
    try {
        const rows = await apiClient.get('/admin/expert-applications?status=pending', { noCache: true });
        setAdminBadge('experts', Array.isArray(rows) ? rows.length : 0);
    } catch (_e) { /* ignore */ }
}

tabsEl?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    tabsEl.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t === tab));
    load(tab.getAttribute('data-status'));
});

document.getElementById('reloadBtn')?.addEventListener('click', () => load(currentStatus));

load('pending');
