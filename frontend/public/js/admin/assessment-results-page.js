import { apiClient } from '../api-client.js';
import { mountAdminShell } from './shell.js';
import { renderPager } from './pager.js';

mountAdminShell({ active: 'assessment-results' });

function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dt(v) {
    if (!v) return '';
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
    } catch (_e) { return v; }
}

// Danh mục bài test tự làm — giống danh mục dùng bên portal chuyên gia.
const TEST_CODES = [
    { code: 'DASS21', label: 'DASS-21' },
    { code: 'GAD7', label: 'GAD-7' },
    { code: 'HARS', label: 'HARS' },
    { code: 'PHQ9', label: 'PHQ-9' },
    { code: 'PSQI', label: 'PSQI' },
    { code: 'PSS', label: 'PSS' },
    { code: 'SDQ25', label: 'SDQ-25' },
    { code: 'MMSE', label: 'MMSE' },
    { code: 'ISI', label: 'ISI' },
    { code: 'IAT', label: 'IAT' },
    { code: 'AUDIT', label: 'AUDIT' },
    { code: 'RAVEN_CPM', label: 'Raven CPM' },
    { code: 'CARS', label: 'CARS' },
    { code: 'SDQ25_OBS', label: 'SDQ-25 (quan sát)' }
];

const state = {
    items: [],
    page: 0,
    limit: 20,
    total: 0,
    filters: { search: '', owner: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false }
};

function normalizeAnswerRow(entry, index) {
    if (entry === null || typeof entry !== 'object') {
        return { no: index + 1, question: `Câu ${index + 1}`, answer: entry === null || entry === undefined ? '(không có dữ liệu)' : String(entry), score: '' };
    }
    const question = entry.question || entry.domain || entry.item || `Câu ${index + 1}`;
    const answer = entry.answer ?? (entry.choice !== undefined && entry.choice !== null ? `Đáp án ${entry.choice}` : '');
    const score = entry.score ?? entry.choice ?? '';
    return { no: index + 1, question, answer, score };
}

function init() {
    const codeSel = document.getElementById('arSearchCode');
    codeSel.innerHTML = '<option value="">Tất cả bài test</option>'
        + TEST_CODES.map((t) => `<option value="${t.code}">${t.label}</option>`).join('');

    document.getElementById('reloadBtn')?.addEventListener('click', () => load(state.page));

    const runSearch = () => {
        state.filters = {
            search: document.getElementById('arSearchName').value.trim(),
            owner: document.getElementById('arSearchOwner').value.trim(),
            code: document.getElementById('arSearchCode').value,
            ageMin: document.getElementById('arSearchAgeMin').value.trim(),
            ageMax: document.getElementById('arSearchAgeMax').value.trim(),
            flaggedOnly: document.getElementById('arSearchFlagged').checked
        };
        load(0);
    };
    document.getElementById('arSearchBtn')?.addEventListener('click', runSearch);
    document.getElementById('arSearchFlagged')?.addEventListener('change', runSearch);
    document.getElementById('arSearchName')?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') runSearch(); });
    document.getElementById('arSearchOwner')?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') runSearch(); });

    document.getElementById('arSearchResetBtn')?.addEventListener('click', () => {
        document.getElementById('arSearchName').value = '';
        document.getElementById('arSearchOwner').value = '';
        document.getElementById('arSearchCode').value = '';
        document.getElementById('arSearchAgeMin').value = '';
        document.getElementById('arSearchAgeMax').value = '';
        document.getElementById('arSearchFlagged').checked = false;
        state.filters = { search: '', owner: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false };
        load(0);
    });

    document.getElementById('arDetailClose')?.addEventListener('click', closeDetail);
    document.getElementById('arDetailCloseBtn')?.addEventListener('click', closeDetail);

    load(0);
}

function closeDetail() {
    document.getElementById('arDetailModal').classList.remove('show');
}

async function load(page = 0) {
    state.page = Math.max(0, page);
    const listEl = document.getElementById('arList');
    const pagerEl = document.getElementById('arPager');
    const metaEl = document.getElementById('arMeta');
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    if (pagerEl) pagerEl.innerHTML = '';

    const qs = new URLSearchParams({ limit: String(state.limit), offset: String(state.page * state.limit) });
    const f = state.filters;
    if (f.search) qs.set('search', f.search);
    if (f.owner) qs.set('owner', f.owner);
    if (f.code) qs.set('code', f.code);
    if (f.ageMin) qs.set('age_min', f.ageMin);
    if (f.ageMax) qs.set('age_max', f.ageMax);
    if (f.flaggedOnly) qs.set('flagged', 'true');

    let data;
    try {
        data = await apiClient.get(`/admin/assessment-results?${qs.toString()}`, { noCache: true });
    } catch (_e) {
        listEl.innerHTML = '<div class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách.</div>';
        return;
    }

    state.items = data?.items || [];
    state.total = data?.total || 0;

    if (!state.items.length) {
        listEl.innerHTML = '<div class="admin-card admin-empty">Không có kết quả nào khớp.</div>';
        metaEl.textContent = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    metaEl.textContent = `${state.page * state.limit + 1}–${state.page * state.limit + state.items.length} trong ${state.total} kết quả · Trang ${state.page + 1}/${totalPages}`;

    listEl.innerHTML = state.items.map((item) => `
        <div class="admin-card" data-result="${item.id}" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;">
            <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-weight:800;">${esc(item.respondent_name || 'Chưa rõ tên')}${item.respondent_age ? ` — ${item.respondent_age} tuổi` : ''}</span>
                    ${item.flagged ? '<span style="font-size:.75rem;">⭐</span>' : ''}
                </div>
                <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">${esc(item.name)} · ${dt(item.created_at)}</div>
                <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">Tài khoản: ${esc(item.owner_name || item.owner_email)}</div>
            </div>
            <div style="text-align:right;font-size:.85rem;font-weight:700;white-space:nowrap;">${esc(item.severity || 'Đã hoàn thành')}<br>${item.total_score}</div>
        </div>
    `).join('');

    listEl.querySelectorAll('[data-result]').forEach((row) => {
        row.addEventListener('click', () => {
            const item = state.items.find((r) => r.id === row.getAttribute('data-result'));
            if (item) openDetail(item);
        });
    });

    renderPager(pagerEl, { page: state.page, totalPages, onGo: (p) => load(p) });
}

function openDetail(item) {
    document.getElementById('arDetailTitle').textContent = item.name;
    const parts = [];
    parts.push(`Tài khoản: ${item.owner_name || item.owner_email} (${item.owner_email})`);
    if (item.respondent_name) parts.push(`Người làm bài: ${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
    parts.push(`Điểm: ${item.total_score}`);
    parts.push(`Xếp loại: ${item.severity || 'Đã hoàn thành'}`);
    parts.push(dt(item.created_at));
    if (item.note) parts.push(`Ghi chú: ${item.note}`);
    if (item.edited_at) parts.push(`(đã sửa lúc ${dt(item.edited_at)})`);
    document.getElementById('arDetailMeta').textContent = parts.join(' · ');

    const attachEl = document.getElementById('arDetailAttachment');
    if (item.has_attachment) {
        attachEl.style.display = 'block';
        attachEl.innerHTML = `<button type="button" class="btn-outline" id="arViewAttachmentBtn">🖼️ Xem ảnh đính kèm</button>`;
        document.getElementById('arViewAttachmentBtn').addEventListener('click', async () => {
            attachEl.innerHTML = '<p style="color:var(--text-secondary);">Đang tải ảnh...</p>';
            try {
                const blob = await apiClient.getBlob(`/assessments/results/${item.id}/attachment`);
                const url = URL.createObjectURL(blob);
                attachEl.innerHTML = `<img src="${url}" alt="Ảnh đính kèm" style="max-width:100%;border-radius:12px;border:1.5px solid var(--kraft-light);">`;
            } catch (_e) {
                attachEl.innerHTML = '<p style="color:var(--coral);">Không tải được ảnh đính kèm.</p>';
            }
        });
    } else {
        attachEl.style.display = 'none';
        attachEl.innerHTML = '';
    }

    const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];
    document.getElementById('arDetailRows').innerHTML = rows.length
        ? rows.map((r) => `<tr><td>${r.no}</td><td>${esc(String(r.question))}</td><td>${esc(String(r.answer))}</td><td>${esc(String(r.score))}</td></tr>`).join('')
        : '<tr><td colspan="4" style="color:var(--text-secondary);">Không có dữ liệu chi tiết từng câu.</td></tr>';

    document.getElementById('arDeleteBtn').onclick = async () => {
        if (!window.confirm(`Xoá kết quả "${item.name}" của ${item.respondent_name || 'người này'}? Không thể hoàn tác.`)) return;
        try {
            await apiClient.delete(`/admin/assessment-results/${item.id}`);
            closeDetail();
            load(state.page);
        } catch (error) {
            alert(error.message || 'Không thể xoá kết quả.');
        }
    };

    document.getElementById('arDetailModal').classList.add('show');
}

init();
