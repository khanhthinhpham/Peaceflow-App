import { apiClient } from '../api-client.js';
import { mountAdminShell, setAdminBadge } from './shell.js';
import { icon } from './icons.js';
import { renderPager } from './pager.js';

mountAdminShell({ active: 'community' });

const listEl = document.getElementById('adminCommunityList');
const metaEl = document.getElementById('adminCommunityMeta');
const pagerEl = document.getElementById('adminCommunityPager');
const tabsEl = document.getElementById('communityTabs');
let currentFilter = 'reported';
const cmPageSizeEl = document.getElementById('communityPageSize');
let CM_LIMIT = parseInt(cmPageSizeEl?.value, 10) || 10;
const cmState = { page: 0, total: 0 };

function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dt(v) {
    if (!v) return '';
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}

const CATEGORY = { gratitude: 'Biết ơn', story: 'Câu chuyện', milestone: 'Cột mốc', question: 'Hỏi đáp', tip: 'Mẹo' };
const REASON = { inappropriate: 'Không phù hợp', spam: 'Spam', harassment: 'Quấy rối', misinformation: 'Sai sự thật', other: 'Khác' };

function reasonsSummary(reports) {
    if (!Array.isArray(reports) || !reports.length) return '';
    const counts = {};
    reports.forEach((r) => { const k = r.reason || 'other'; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts)
        .map(([k, n]) => `<span style="font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">${esc(REASON[k] || k)} ×${n}</span>`)
        .join('');
}

function card(p) {
    const author = p.is_anonymous ? 'Ẩn danh' : (p.author_name || p.author_email || 'Ẩn danh');
    return `
        <div class="admin-card" data-post="${p.id}">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <span style="font-weight:800;">${esc(author)}</span>
                    <span style="font-size:.72rem;font-weight:700;padding:1px 8px;border-radius:6px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">${esc(CATEGORY[p.category] || p.category)}</span>
                    <span style="font-size:.72rem;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(255,139,139,.14);color:var(--coral-dark,#e05555);border:1px solid var(--coral,#ff8b8b);">⚑ ${Number(p.reports_count || 0)} báo cáo</span>
                    ${p.is_hidden ? '<span style="font-size:.72rem;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(74,55,40,.1);color:var(--text-secondary,#7a6555);">Đang ẩn</span>' : ''}
                </div>
                <span style="font-size:.78rem;color:var(--text-light);white-space:nowrap;">${dt(p.created_at)}</span>
            </div>

            <div style="margin-top:10px;font-size:.9rem;color:var(--text-primary);line-height:1.6;white-space:pre-wrap;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);border-radius:var(--radius-sm,10px);padding:12px 14px;">${esc(p.content)}</div>

            ${reasonsSummary(p.reports) ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">${reasonsSummary(p.reports)}</div>` : ''}

            <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px;">
                <button type="button" class="btn-outline" data-dismiss style="font-size:.82rem;">Bỏ qua báo cáo</button>
                <button type="button" class="${p.is_hidden ? 'btn-primary' : 'btn-outline'}" data-hide="${p.is_hidden ? '0' : '1'}" style="font-size:.82rem;">${p.is_hidden ? 'Hiện lại' : 'Ẩn bài'}</button>
                <button type="button" class="btn-outline" data-delete style="font-size:.82rem;color:var(--coral-dark);border-color:var(--coral);">Gỡ bài</button>
            </div>
        </div>
    `;
}

async function load(filter = currentFilter, page = cmState.page) {
    if (filter !== currentFilter) page = 0;
    currentFilter = filter;
    cmState.page = Math.max(0, page);
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    if (pagerEl) pagerEl.innerHTML = '';
    let data;
    try {
        const qs = new URLSearchParams({ filter, limit: String(CM_LIMIT), offset: String(cmState.page * CM_LIMIT) });
        data = await apiClient.get(`/admin/community/reports?${qs.toString()}`, { noCache: true });
    } catch (_e) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách (cần quyền admin).</div>';
        return;
    }
    const posts = data?.posts || [];
    cmState.total = data?.total || 0;
    if (!posts.length) {
        const msg = filter === 'hidden' ? 'Không có bài nào đang bị ẩn.' : `${icon('star')} Không có bài viết nào bị báo cáo.`;
        listEl.innerHTML = `<div class="admin-card admin-empty">${msg}</div>`;
        metaEl.textContent = '';
        if (pagerEl) pagerEl.innerHTML = '';
        return;
    }
    const totalPages = Math.max(1, Math.ceil(cmState.total / CM_LIMIT));
    metaEl.textContent = `${cmState.page * CM_LIMIT + 1}–${cmState.page * CM_LIMIT + posts.length} trong ${cmState.total} bài viết · Trang ${cmState.page + 1}/${totalPages}`;
    listEl.innerHTML = posts.map(card).join('');
    bindRows();
    renderPager(pagerEl, { page: cmState.page, totalPages, onGo: (p) => load(currentFilter, p) });
}

function bindRows() {
    listEl.querySelectorAll('[data-post]').forEach((row) => {
        const id = row.getAttribute('data-post');
        row.querySelector('[data-hide]')?.addEventListener('click', (e) => {
            const hide = e.currentTarget.getAttribute('data-hide') === '1';
            patch(`/admin/community/posts/${id}`, { is_hidden: hide }, e.currentTarget, 'patch');
        });
        row.querySelector('[data-dismiss]')?.addEventListener('click', (e) => {
            if (!window.confirm('Bỏ qua báo cáo của bài này (xem như hợp lệ) và hiện lại?')) return;
            patch(`/admin/community/posts/${id}/dismiss-reports`, {}, e.currentTarget, 'post');
        });
        row.querySelector('[data-delete]')?.addEventListener('click', (e) => {
            if (!window.confirm('Gỡ hẳn bài viết này? Hành động không thể hoàn tác (xoá cả bình luận & cảm xúc).')) return;
            patch(`/admin/community/posts/${id}`, null, e.currentTarget, 'delete');
        });
    });
}

async function patch(url, body, ctrl, method) {
    if (ctrl) ctrl.disabled = true;
    try {
        if (method === 'delete') await apiClient.delete(url);
        else if (method === 'post') await apiClient.post(url, body);
        else await apiClient.patch(url, body);
        await load(currentFilter, cmState.page);
        refreshBadge();
    } catch (e) {
        alert(e.message || 'Thao tác thất bại.');
        if (ctrl) ctrl.disabled = false;
    }
}

async function refreshBadge() {
    try {
        const o = await apiClient.get('/admin/overview', { noCache: true });
        setAdminBadge('community', o.reported_community_posts);
    } catch (_e) { /* ignore */ }
}

tabsEl?.addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    tabsEl.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t === tab));
    load(tab.getAttribute('data-filter'));
});

cmPageSizeEl?.addEventListener('change', () => { CM_LIMIT = parseInt(cmPageSizeEl.value, 10) || 10; load(currentFilter, 0); });
document.getElementById('reloadBtn')?.addEventListener('click', () => load(currentFilter));

load('reported');
refreshBadge();
