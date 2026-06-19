import { apiClient, API_BASE_URL } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';
import { icon } from './icons.js';

mountAdminShell({ active: 'experts' });

// ===== chung =====
function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dt(v) {
    if (!v) return '';
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function specialties(v) {
    let arr = v;
    if (typeof v === 'string') { try { arr = JSON.parse(v); } catch (_e) { arr = []; } }
    return Array.isArray(arr) ? arr : [];
}
function chip(text) {
    return `<span style="font-size:.74rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">${esc(text)}</span>`;
}

function monoIcon(name) {
    return `<span class="admin-inline-icon">${icon(name)}</span>`;
}

// ===== Hồ sơ đăng ký =====
const listEl = document.getElementById('adminApplicationsList');
const appTabsEl = document.getElementById('adminApplicationsTabs');
let currentStatus = 'pending';

const STATUS_BADGE = {
    pending: { label: 'Chờ duyệt', bg: 'rgba(245,176,65,.16)', color: '#b5791b', border: 'rgba(245,176,65,.5)' },
    approved: { label: 'Đã duyệt', bg: 'var(--mint-light,#c5e8d2)', color: 'var(--mint-dark,#4a9e8e)', border: 'var(--mint,#a8d5ba)' },
    rejected: { label: 'Từ chối', bg: 'rgba(255,139,139,.14)', color: 'var(--coral-dark,#e05555)', border: 'var(--coral,#ff8b8b)' }
};
function badge(status) {
    const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
    return `<span style="font-size:.72rem;font-weight:800;padding:2px 9px;border-radius:999px;background:${s.bg};color:${s.color};border:1px solid ${s.border};white-space:nowrap;">${s.label}</span>`;
}

function appCard(a) {
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
                    ${credHref ? `<a href="${credHref}" target="_blank" rel="noopener" class="btn-outline" style="font-size:.82rem;">${monoIcon('file-text')} Xem bằng cấp${a.credential_filename ? ` (${esc(a.credential_filename)})` : ''}</a>` : '<span style="color:var(--text-light);font-size:.82rem;">Không có file bằng cấp</span>'}
                </div>
                ${a.status === 'pending' ? `
                    <div style="display:flex;gap:10px;">
                        <button type="button" class="btn-outline" data-reject="${a.id}">${monoIcon('alert')} Từ chối</button>
                        <button type="button" class="btn-primary" data-approve="${a.id}">${monoIcon('check')} Duyệt hồ sơ</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

async function loadApplications(status = currentStatus) {
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
    listEl.innerHTML = `<div class="admin-card admin-empty">${status === 'pending' ? `${monoIcon('check')} Không có hồ sơ nào đang chờ duyệt.` : 'Không có hồ sơ nào.'}</div>`;
        if (status === 'pending') setAdminBadge('experts', 0);
        return;
    }
    if (status === 'pending') setAdminBadge('experts', rows.length);
    listEl.innerHTML = rows.map(appCard).join('');
    listEl.querySelectorAll('[data-approve]').forEach((btn) => {
        btn.addEventListener('click', () => appAct(`/admin/expert-applications/${btn.getAttribute('data-approve')}/approve`, btn, 'Duyệt hồ sơ này và mở quyền chuyên gia?'));
    });
    listEl.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', () => appAct(`/admin/expert-applications/${btn.getAttribute('data-reject')}/reject`, btn, 'Từ chối hồ sơ này?'));
    });
}

async function appAct(url, btn, confirmMsg) {
    if (!window.confirm(confirmMsg)) return;
    btn.disabled = true;
    try {
        await apiClient.post(url, {});
        await loadApplications(currentStatus);
        refreshPendingBadge();
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

// ===== Danh sách chuyên gia =====
const expertsListEl = document.getElementById('adminExpertsList');
const expertsMetaEl = document.getElementById('adminExpertsMeta');
const expertSearchEl = document.getElementById('expertSearch');
const expertActiveTabsEl = document.getElementById('expertActiveTabs');
const expertState = { search: '', active: '' };

function expertCard(e) {
    const sp = specialties(e.specialties);
    const active = e.active;
    const hasBank = !!e.payout_account_number;
    const hasQr = !!e.payout_qr_url;
    return `
        <div class="admin-card" data-expert="${e.id}">
            <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;justify-content:space-between;">
                <div style="display:flex;gap:12px;min-width:0;">
                    <div class="admin-user-bubble" style="background:var(--mint-light,#c5e8d2);">${icon('user')}</div>
                    <div style="min-width:0;">
                        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                            <span style="font-weight:800;">${esc(e.full_name)}</span>
                            <span style="font-size:.7rem;font-weight:800;padding:1px 8px;border-radius:6px;background:${active ? 'var(--mint-light,#c5e8d2)' : 'rgba(74,55,40,.1)'};color:${active ? 'var(--mint-dark,#4a9e8e)' : 'var(--text-secondary,#7a6555)'};">${active ? 'Đang hoạt động' : 'Đã tắt'}</span>
                            <span style="font-size:.7rem;color:var(--text-light);font-family:monospace;">${esc(e.code || '')}</span>
                        </div>
                        <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">${esc(e.email || '')}</div>
                        <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">${monoIcon('star')} ${Number(e.rating || 0).toFixed(1)} · ${Number(e.sessions_count || 0)} buổi · Giá: ${money(e.base_price)} · Số dư: <strong>${money(e.balance)}</strong></div>
                    </div>
                </div>
                <button type="button" class="${active ? 'btn-outline' : 'btn-primary'}" data-toggle="${active ? '0' : '1'}" style="font-size:.82rem;">${active ? 'Tắt hoạt động' : 'Bật hoạt động'}</button>
            </div>
            ${sp.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">${sp.map(chip).join('')}</div>` : ''}
            <div class="admin-expert-payout-card" style="margin-top:12px;">
                ${hasBank
                    ? `
                        <div class="admin-expert-payout-info">
                            <div class="admin-expert-payout-line">${monoIcon('card')} <strong>${esc(e.payout_bank_name || '')}</strong></div>
                            <div class="admin-expert-payout-line">Số tài khoản: <span class="admin-expert-payout-mono">${esc(e.payout_account_number)}</span></div>
                            <div class="admin-expert-payout-line">Chủ tài khoản: <strong>${esc(e.payout_account_name || 'Chưa cập nhật')}</strong></div>
                        </div>
                        ${hasQr ? `
                            <a class="admin-expert-qr-card" href="${esc(e.payout_qr_url)}" target="_blank" rel="noopener" aria-label="Xem mã QR nhận tiền của ${esc(e.full_name)}">
                                <img class="admin-expert-qr-image" src="${esc(e.payout_qr_url)}" alt="QR nhận tiền của ${esc(e.full_name)}">
                                <span class="admin-expert-qr-caption">Mã QR nhận tiền</span>
                            </a>
                        ` : `
                            <div class="admin-expert-qr-card admin-expert-qr-empty">
                                <span class="admin-expert-qr-caption">Chưa tạo được mã QR</span>
                            </div>
                        `}
                    `
                    : `<span style="color:var(--coral-dark);">${monoIcon('alert')} Chưa cập nhật phương thức nhận thanh toán</span>`}
            </div>
        </div>
    `;
}

async function loadExperts() {
    expertsListEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    let data;
    try {
        const qs = new URLSearchParams();
        if (expertState.search) qs.set('search', expertState.search);
        if (expertState.active) qs.set('active', expertState.active);
        qs.set('limit', '100');
        data = await apiClient.get(`/admin/experts?${qs.toString()}`, { noCache: true });
    } catch (_e) {
        expertsListEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách chuyên gia.</div>';
        return;
    }
    const experts = data?.experts || [];
    expertsMetaEl.textContent = experts.length ? `${experts.length}${(data?.total || 0) > experts.length ? ' / ' + data.total : ''} chuyên gia` : '';
    if (!experts.length) {
        expertsListEl.innerHTML = '<div class="admin-card admin-empty">Không có chuyên gia nào.</div>';
        return;
    }
    expertsListEl.innerHTML = experts.map(expertCard).join('');
    expertsListEl.querySelectorAll('[data-expert]').forEach((row) => {
        const id = row.getAttribute('data-expert');
        row.querySelector('[data-toggle]')?.addEventListener('click', async (ev) => {
            const next = ev.currentTarget.getAttribute('data-toggle') === '1';
            if (!window.confirm(next ? 'Bật hoạt động cho chuyên gia này?' : 'Tắt hoạt động? Chuyên gia sẽ không nhận lịch mới.')) return;
            ev.currentTarget.disabled = true;
            try {
                await apiClient.patch(`/admin/experts/${id}`, { active: next });
                loadExperts();
            } catch (e) {
                alert(e.message || 'Cập nhật thất bại.');
                ev.currentTarget.disabled = false;
            }
        });
    });
}

function applyExpertSearch() {
    expertState.search = (expertSearchEl.value || '').trim();
    loadExperts();
}

// ===== chuyển chế độ =====
const applicationsView = document.getElementById('applicationsView');
const expertsView = document.getElementById('expertsView');
let mode = 'applications';
let expertsLoaded = false;

function switchMode(next) {
    mode = next;
    applicationsView.style.display = next === 'applications' ? '' : 'none';
    expertsView.style.display = next === 'experts' ? '' : 'none';
    if (next === 'experts' && !expertsLoaded) {
        expertsLoaded = true;
        loadExperts();
    }
}

document.getElementById('expertsModeTabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    document.querySelectorAll('#expertsModeTabs .admin-tab').forEach((t) => t.classList.toggle('active', t === tab));
    switchMode(tab.getAttribute('data-mode'));
});

appTabsEl?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    appTabsEl.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t === tab));
    loadApplications(tab.getAttribute('data-status'));
});

expertActiveTabsEl?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    expertActiveTabsEl.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t === tab));
    expertState.active = tab.getAttribute('data-active') || '';
    loadExperts();
});

document.getElementById('expertSearchBtn')?.addEventListener('click', applyExpertSearch);
expertSearchEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyExpertSearch(); });

document.getElementById('reloadBtn')?.addEventListener('click', () => {
    if (mode === 'applications') loadApplications(currentStatus);
    else loadExperts();
});

loadApplications('pending');
