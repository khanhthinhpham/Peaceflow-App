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
    filters: { search: '', owner: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false },
    patientViewActive: false,
    colleagues: null
};

let detailContext = null;

function normalizeAnswerRow(entry, index) {
    if (entry === null || typeof entry !== 'object') {
        return { no: index + 1, question: `Câu ${index + 1}`, answer: entry === null || entry === undefined ? '(không có dữ liệu)' : String(entry), score: '' };
    }
    const question = entry.question || entry.domain || entry.item || `Câu ${index + 1}`;
    const answer = entry.answer ?? (entry.choice !== undefined && entry.choice !== null ? `Đáp án ${entry.choice}` : '');
    const score = entry.score ?? entry.choice ?? '';
    return { no: index + 1, question, answer, score };
}

// Danh mục đáp án (nhãn+điểm) của các bài tự làm — dùng để hiện dropdown đáp án khi sửa,
// giống hệt cơ chế bên portal chuyên gia, đảm bảo chọn đáp án nào điểm tự khớp theo đó.
let answerCatalogPromise = null;
function loadAnswerCatalog() {
    if (!answerCatalogPromise) {
        answerCatalogPromise = fetch('../../public/data/self-test-answer-catalog.json')
            .then((r) => (r.ok ? r.json() : {}))
            .catch(() => ({}));
    }
    return answerCatalogPromise;
}

function findCatalogOptions(catalog, testCode, row) {
    const test = catalog?.[String(testCode || '').toLowerCase()];
    if (!test) return null;
    const byIndex = test.questions[row.no - 1];
    if (byIndex && byIndex.text === row.question) return byIndex.options;
    const byText = test.questions.find((q) => q.text === row.question);
    return byText ? byText.options : null;
}

function computeTotalFromRowScores(testCode, catalog, scoresByIndex) {
    const test = catalog?.[String(testCode || '').toLowerCase()];
    if (!test?.scoring) return null;
    const subScores = {};
    Object.entries(test.scoring).forEach(([key, sc]) => {
        let sum = 0;
        sc.indices.forEach((idx) => { sum += Number(scoresByIndex[idx]) || 0; });
        subScores[key] = sum * sc.multiplier;
    });
    if (subScores.total !== undefined) return subScores.total;
    return Object.values(subScores).reduce((a, b) => a + b, 0);
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
        if (state.patientViewActive) loadPatientSummaryView();
        else load(0);
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
        if (state.patientViewActive) loadPatientSummaryView();
        else load(0);
    });

    document.getElementById('arPatientViewBtn')?.addEventListener('click', togglePatientView);
    document.getElementById('arPatientModalClose')?.addEventListener('click', () => {
        document.getElementById('arPatientModal').classList.remove('show');
    });

    document.getElementById('arDetailClose')?.addEventListener('click', closeDetail);
    document.getElementById('arDetailCloseBtn')?.addEventListener('click', closeDetail);

    load(0);
}

function togglePatientView() {
    state.patientViewActive = !state.patientViewActive;
    const btn = document.getElementById('arPatientViewBtn');
    if (btn) btn.textContent = state.patientViewActive ? '📋 Xem theo lần test' : '👤 Xem theo bệnh nhân';
    document.getElementById('arPager').style.display = state.patientViewActive ? 'none' : '';
    if (state.patientViewActive) loadPatientSummaryView();
    else load(0);
}

let patientGroupsCache = [];
async function loadPatientSummaryView() {
    const listEl = document.getElementById('arList');
    const metaEl = document.getElementById('arMeta');
    listEl.innerHTML = '<div class="admin-card admin-empty">Đang tải...</div>';
    metaEl.textContent = '';

    const qs = new URLSearchParams({ limit: '0' });
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

    const results = data?.items || [];
    if (!results.length) {
        listEl.innerHTML = '<div class="admin-card admin-empty">Không có bệnh nhân nào khớp với bộ lọc.</div>';
        return;
    }

    patientGroupsCache = groupResultsByPerson(results);
    metaEl.textContent = `${patientGroupsCache.length} bệnh nhân · ${results.length} lượt test`;
    listEl.innerHTML = patientGroupsCache.map((g, idx) => `
        <div class="admin-card" data-patient-idx="${idx}" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;">
            <div>
                <div style="font-weight:800;">${esc(g.name)}${g.age ? ` — ${g.age} tuổi` : ''}</div>
                <div style="color:var(--text-secondary);font-size:.82rem;margin-top:3px;">Lần gần nhất: ${dt(g.tests[0].created_at)}</div>
            </div>
            <div style="font-weight:700;white-space:nowrap;">${g.tests.length} lần test</div>
        </div>
    `).join('');

    listEl.querySelectorAll('[data-patient-idx]').forEach((card) => {
        card.addEventListener('click', () => {
            const g = patientGroupsCache[Number(card.getAttribute('data-patient-idx'))];
            if (g) openPatientModal(g);
        });
    });
}

function openPatientModal(group) {
    document.getElementById('arPatientModalTitle').textContent = group.name;
    document.getElementById('arPatientModalMeta').textContent = `${group.age ? `${group.age} tuổi · ` : ''}${group.tests.length} lần test`;
    const listEl = document.getElementById('arPatientModalList');
    listEl.innerHTML = group.tests
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((t) => `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px dashed var(--kraft-light);cursor:pointer;" data-test-id="${t.id}">
                <div>
                    <div style="font-weight:800;">${esc(t.name)}</div>
                    <div style="color:var(--text-secondary);font-size:.82rem;">${dt(t.created_at)} · Tài khoản: ${esc(t.owner_name || t.owner_email)}</div>
                </div>
                <div style="font-weight:700;text-align:right;white-space:nowrap;">${esc(t.severity || 'Đã hoàn thành')}<br>${t.total_score}</div>
            </div>
        `).join('');
    listEl.querySelectorAll('[data-test-id]').forEach((row) => {
        row.addEventListener('click', () => {
            const t = group.tests.find((x) => x.id === row.getAttribute('data-test-id'));
            if (t) {
                document.getElementById('arPatientModal').classList.remove('show');
                openDetail(t);
            }
        });
    });
    document.getElementById('arPatientModal').classList.add('show');
}

function closeDetail() {
    document.getElementById('arDetailModal').classList.remove('show');
    detailContext = null;
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
        <div class="admin-card" data-result="${item.id}" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;">
            <button type="button" class="ca-flag-btn${item.flagged ? ' active' : ''}" data-flag-btn title="${item.flagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}">${item.flagged ? '⭐' : '☆'}</button>
            <div style="flex:1 1 220px;min-width:0;">
                <span style="font-weight:800;">${esc(item.respondent_name || 'Chưa rõ tên')}${item.respondent_age ? ` — ${item.respondent_age} tuổi` : ''}</span>
                <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">${esc(item.name)} · ${dt(item.created_at)}</div>
                <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">Tài khoản: ${esc(item.owner_name || item.owner_email)}</div>
            </div>
            <div style="text-align:right;font-size:.85rem;font-weight:700;white-space:nowrap;flex-shrink:0;">${esc(item.severity || 'Đã hoàn thành')}<br>${item.total_score}</div>
        </div>
    `).join('');

    listEl.querySelectorAll('[data-result]').forEach((row) => {
        row.addEventListener('click', (ev) => {
            if (ev.target.closest('[data-flag-btn]')) return;
            const item = state.items.find((r) => r.id === row.getAttribute('data-result'));
            if (item) openDetail(item);
        });
        row.querySelector('[data-flag-btn]')?.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const item = state.items.find((r) => r.id === row.getAttribute('data-result'));
            if (!item) return;
            try {
                const updated = await apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged });
                item.flagged = updated.flagged;
                load(state.page);
            } catch (error) {
                alert(error.message || 'Không thể đánh dấu.');
            }
        });
    });

    renderPager(pagerEl, { page: state.page, totalPages, onGo: (p) => load(p) });
}

function renderDetailMeta(item) {
    const parts = [];
    parts.push(`Tài khoản: ${item.owner_name || item.owner_email} (${item.owner_email})`);
    if (item.respondent_name) parts.push(`Người làm bài: ${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
    parts.push(`Điểm: ${item.total_score}`);
    parts.push(`Xếp loại: ${item.severity || 'Đã hoàn thành'}`);
    parts.push(dt(item.created_at));
    if (item.note) parts.push(`Ghi chú: ${item.note}`);
    if (item.edited_at) parts.push(`(đã sửa lúc ${dt(item.edited_at)})`);
    document.getElementById('arDetailMeta').textContent = parts.join(' · ');
}

// Cả 2 ô "Trả lời" và "Điểm" đều là dropdown cùng trỏ vào 1 chỉ số trong danh mục đáp án
// khi bài test có trong danh mục — chọn ở ô nào thì ô kia tự nhảy theo, không lệch nhau.
function renderDetailRows(rows, editing, testCode, catalog) {
    const tbody = document.getElementById('arDetailRows');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-secondary);">Không có dữ liệu chi tiết từng câu.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map((r) => {
        const options = editing ? findCatalogOptions(catalog, testCode, r) : null;
        let answerCell;
        let scoreCell;
        if (!editing) {
            answerCell = esc(String(r.answer));
            scoreCell = esc(String(r.score));
        } else if (options) {
            let selIdx = options.findIndex((opt) => opt.label === r.answer);
            if (selIdx === -1) selIdx = options.findIndex((opt) => opt.score === r.score);
            if (selIdx === -1) selIdx = 0;
            const optionTags = (textFn) => options.map((opt, i) => `<option value="${i}" ${i === selIdx ? 'selected' : ''}>${esc(String(textFn(opt)))}</option>`).join('');
            answerCell = `<select data-row-idx="${r.no}" data-role="answer" class="form-input">${optionTags((opt) => opt.label)}</select>`;
            scoreCell = `<select data-row-idx="${r.no}" data-role="score" class="form-input">${optionTags((opt) => opt.score)}</select>`;
        } else {
            answerCell = `<input type="text" data-row-answer="${r.no}" value="${esc(String(r.answer))}" class="form-input">`;
            scoreCell = `<input type="number" step="0.5" data-row-score="${r.no}" value="${esc(String(r.score))}" class="form-input">`;
        }
        return `<tr><td>${r.no}</td><td>${esc(String(r.question))}</td><td>${answerCell}</td><td>${scoreCell}</td></tr>`;
    }).join('');

    if (!editing) return;

    const recomputeTotal = () => {
        const scoresByIndex = rows.map((r) => {
            const sel = tbody.querySelector(`select[data-row-idx="${r.no}"][data-role="score"]`);
            if (sel) return Number(sel.value);
            const input = tbody.querySelector(`[data-row-score="${r.no}"]`);
            return input ? Number(input.value) : r.score;
        });
        const total = computeTotalFromRowScores(testCode, catalog, scoresByIndex);
        if (total !== null) document.getElementById('arEditScore').value = total;
    };

    tbody.querySelectorAll('select[data-role]').forEach((sel) => {
        sel.addEventListener('change', () => {
            const rowNo = sel.getAttribute('data-row-idx');
            const otherRole = sel.getAttribute('data-role') === 'answer' ? 'score' : 'answer';
            const other = tbody.querySelector(`select[data-row-idx="${rowNo}"][data-role="${otherRole}"]`);
            if (other) other.value = sel.value;
            recomputeTotal();
        });
    });
    tbody.querySelectorAll('[data-row-score]').forEach((input) => {
        input.addEventListener('input', recomputeTotal);
    });
    recomputeTotal();
}

function openDetail(item) {
    detailContext = { item, editing: false, rows: Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [], catalog: null };

    document.getElementById('arDetailTitle').textContent = item.name;
    renderDetailMeta(item);

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

    renderDetailRows(detailContext.rows, false);
    document.getElementById('arEditPanel').style.display = 'none';
    document.getElementById('arEditSaveBtn').style.display = 'none';
    document.getElementById('arSharePanel').style.display = 'none';
    document.getElementById('arEditToggleBtn').textContent = '✏️ Sửa kết quả';
    const flagBtn = document.getElementById('arFlagToggleBtn');
    flagBtn.textContent = item.flagged ? '⭐ Đã đánh dấu' : '☆ Đánh dấu';

    document.getElementById('arDetailModal').classList.add('show');
}

document.getElementById('arFlagToggleBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const { item } = detailContext;
    try {
        const updated = await apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged });
        item.flagged = updated.flagged;
        document.getElementById('arFlagToggleBtn').textContent = item.flagged ? '⭐ Đã đánh dấu' : '☆ Đánh dấu';
        const listed = state.items.find((r) => r.id === item.id);
        if (listed) listed.flagged = item.flagged;
    } catch (error) {
        alert(error.message || 'Không thể đánh dấu.');
    }
});

document.getElementById('arEditToggleBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    detailContext.editing = !detailContext.editing;
    const { item, editing, rows } = detailContext;

    document.getElementById('arEditPanel').style.display = editing ? '' : 'none';
    document.getElementById('arEditSaveBtn').style.display = editing ? '' : 'none';
    document.getElementById('arEditToggleBtn').textContent = editing ? 'Hủy sửa' : '✏️ Sửa kết quả';

    if (editing) {
        document.getElementById('arEditName').value = item.respondent_name || '';
        document.getElementById('arEditAge').value = item.respondent_age ?? '';
        document.getElementById('arEditScore').value = item.total_score ?? '';
        document.getElementById('arEditSeverity').value = item.severity || '';
        document.getElementById('arEditNote').value = item.note || '';
    }

    const catalog = editing ? await loadAnswerCatalog() : null;
    if (!detailContext || detailContext.item !== item) return;
    detailContext.catalog = catalog;
    renderDetailRows(rows, editing, item.code, catalog);
});

document.getElementById('arEditSaveBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const { item, rows, catalog } = detailContext;

    const editedRows = rows.map((r) => {
        const options = findCatalogOptions(catalog, item.code, r);
        if (options) {
            const idxSelect = document.querySelector(`select[data-row-idx="${r.no}"][data-role="answer"]`);
            const opt = idxSelect ? options[Number(idxSelect.value)] : null;
            return { question: r.question, answer: opt ? opt.label : r.answer, score: opt ? opt.score : r.score };
        }
        const answerInput = document.querySelector(`[data-row-answer="${r.no}"]`);
        const scoreInput = document.querySelector(`[data-row-score="${r.no}"]`);
        return {
            question: r.question,
            answer: answerInput ? answerInput.value : r.answer,
            score: scoreInput && scoreInput.value !== '' ? Number(scoreInput.value) : r.score
        };
    });

    const payload = {
        respondent_name: document.getElementById('arEditName').value.trim() || null,
        respondent_age: document.getElementById('arEditAge').value.trim() || null,
        total_score: Number(document.getElementById('arEditScore').value),
        severity: document.getElementById('arEditSeverity').value.trim() || null,
        note: document.getElementById('arEditNote').value.trim() || null,
        raw_answers: editedRows
    };
    if (!Number.isFinite(payload.total_score)) {
        alert('Điểm tổng không hợp lệ.');
        return;
    }

    const saveBtn = document.getElementById('arEditSaveBtn');
    saveBtn.disabled = true;
    try {
        const updated = await apiClient.patch(`/assessments/results/${item.id}`, payload);
        Object.assign(item, updated, { raw_answers: editedRows });
        detailContext.rows = editedRows.map(normalizeAnswerRow);
        detailContext.editing = false;

        document.getElementById('arEditPanel').style.display = 'none';
        saveBtn.style.display = 'none';
        document.getElementById('arEditToggleBtn').textContent = '✏️ Sửa kết quả';
        renderDetailMeta(item);
        renderDetailRows(detailContext.rows, false);
        load(state.page);
    } catch (error) {
        alert(error.message || 'Không thể lưu thay đổi.');
    } finally {
        saveBtn.disabled = false;
    }
});

async function ensureColleaguesLoaded() {
    if (state.colleagues) return state.colleagues;
    try {
        const data = await apiClient.get('/admin/experts?limit=100&active=true', { noCache: true });
        state.colleagues = (data?.experts || []).filter((e) => e.user_id);
    } catch (_error) {
        state.colleagues = [];
    }
    return state.colleagues;
}

async function refreshShareList(resultId) {
    const listEl = document.getElementById('arShareList');
    listEl.innerHTML = 'Đang tải...';
    try {
        const shares = await apiClient.get(`/assessments/results/${resultId}/shares`, { noCache: true });
        if (!shares.length) {
            listEl.innerHTML = '<span style="color:var(--text-secondary);">Chưa chia sẻ với ai.</span>';
            return;
        }
        listEl.innerHTML = `<strong>Đã chia sẻ với:</strong><ul style="margin:6px 0 0;padding-left:18px;">${shares.map((s) => `
            <li>${esc(s.full_name || s.email)} <button type="button" data-target="${s.shared_with_user_id}" style="border:none;background:none;color:var(--coral);cursor:pointer;font-size:.78rem;">Gỡ</button></li>
        `).join('')}</ul>`;
        listEl.querySelectorAll('[data-target]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    await apiClient.delete(`/assessments/results/${resultId}/share/${btn.getAttribute('data-target')}`);
                    refreshShareList(resultId);
                } catch (error) {
                    alert(error.message || 'Không thể gỡ chia sẻ.');
                }
            });
        });
    } catch (_error) {
        listEl.innerHTML = '<span style="color:var(--coral);">Không tải được danh sách chia sẻ.</span>';
    }
}

document.getElementById('arShareToggleBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const panel = document.getElementById('arSharePanel');
    const opening = panel.style.display === 'none';
    panel.style.display = opening ? '' : 'none';
    if (!opening) return;

    const colleagues = await ensureColleaguesLoaded();
    const optionsHtml = '<option value="">Chọn chuyên gia...</option>'
        + colleagues.map((c) => `<option value="${c.user_id}">${esc(c.full_name)}</option>`).join('');
    document.getElementById('arTransferTarget').innerHTML = optionsHtml;
    document.getElementById('arShareColleagues').innerHTML = colleagues.length
        ? colleagues.map((c) => `<label><input type="checkbox" value="${c.user_id}"> ${esc(c.full_name)}</label>`).join('')
        : '<span style="color:var(--text-secondary);font-size:.85rem;">Không có chuyên gia nào khác.</span>';
    refreshShareList(detailContext.item.id);
});

document.getElementById('arShareConfirmBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const targetUserIds = Array.from(document.querySelectorAll('#arShareColleagues input[type="checkbox"]:checked')).map((cb) => cb.value);
    if (!targetUserIds.length) {
        alert('Vui lòng chọn ít nhất 1 chuyên gia cần chia sẻ.');
        return;
    }
    try {
        await apiClient.post(`/assessments/results/${detailContext.item.id}/share`, { target_user_ids: targetUserIds });
        document.querySelectorAll('#arShareColleagues input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
        refreshShareList(detailContext.item.id);
    } catch (error) {
        alert(error.message || 'Không thể chia sẻ.');
    }
});

document.getElementById('arTransferBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const targetUserId = document.getElementById('arTransferTarget').value;
    if (!targetUserId) {
        alert('Vui lòng chọn chuyên gia cần chuyển hồ sơ.');
        return;
    }
    const targetName = document.getElementById('arTransferTarget').selectedOptions[0]?.textContent || 'chuyên gia này';
    if (!window.confirm(`Chuyển hẳn kết quả "${detailContext.item.name}" của ${detailContext.item.respondent_name || 'người này'} sang tài khoản ${targetName}?`)) return;

    try {
        await apiClient.post(`/assessments/results/${detailContext.item.id}/transfer`, { target_user_id: targetUserId });
        closeDetail();
        if (state.patientViewActive) loadPatientSummaryView();
        else load(state.page);
    } catch (error) {
        alert(error.message || 'Không thể chuyển hồ sơ.');
    }
});

document.getElementById('arDeleteBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const { item } = detailContext;
    if (!window.confirm(`Xoá kết quả "${item.name}" của ${item.respondent_name || 'người này'}? Không thể hoàn tác.`)) return;
    try {
        await apiClient.delete(`/admin/assessment-results/${item.id}`);
        closeDetail();
        if (state.patientViewActive) loadPatientSummaryView();
        else load(state.page);
    } catch (error) {
        alert(error.message || 'Không thể xoá kết quả.');
    }
});

function csvEscape(value) {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(filename, lines) {
    const csvContent = '﻿' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('arExportCsvBtn')?.addEventListener('click', () => {
    if (!detailContext) return;
    const item = detailContext.item;
    const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];
    const lines = [];
    lines.push(['Bài test', item.name].map(csvEscape).join(','));
    lines.push(['Tài khoản', `${item.owner_name || ''} (${item.owner_email})`].map(csvEscape).join(','));
    if (item.respondent_name) lines.push(['Người làm bài', `${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`].map(csvEscape).join(','));
    lines.push(['Điểm', item.total_score].map(csvEscape).join(','));
    lines.push(['Xếp loại', item.severity || ''].map(csvEscape).join(','));
    lines.push(['Ngày', dt(item.created_at)].map(csvEscape).join(','));
    if (item.note) lines.push(['Ghi chú', item.note].map(csvEscape).join(','));
    lines.push('');
    lines.push(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm'].map(csvEscape).join(','));
    rows.forEach((r) => lines.push([r.no, r.question, r.answer, r.score].map(csvEscape).join(',')));
    downloadCsv(`${(item.name || 'ket-qua').replace(/\s+/g, '-')}-${item.id.slice(0, 8)}.csv`, lines);
});

document.getElementById('arExportPdfBtn')?.addEventListener('click', () => {
    if (!detailContext) return;
    const item = detailContext.item;
    const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];

    const metaLines = [];
    metaLines.push(`Tài khoản: ${esc(item.owner_name || '')} (${esc(item.owner_email)})`);
    if (item.respondent_name) metaLines.push(`Người làm bài: ${esc(item.respondent_name)}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
    metaLines.push(`Điểm: ${esc(String(item.total_score))}`);
    metaLines.push(`Xếp loại: ${esc(item.severity || 'Đã hoàn thành')}`);
    metaLines.push(`Ngày: ${esc(dt(item.created_at))}`);
    if (item.note) metaLines.push(`Ghi chú: ${esc(item.note)}`);

    const tableRows = rows.map((r) => `
        <tr><td>${r.no}</td><td>${esc(String(r.question))}</td><td>${esc(String(r.answer))}</td><td>${esc(String(r.score))}</td></tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để xuất PDF.');
        return;
    }
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>${esc(item.name)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
                h1 { font-size: 20px; margin-bottom: 4px; }
                .meta { font-size: 13px; color: #555; margin-bottom: 16px; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
                th { background: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>${esc(item.name)}</h1>
            <div class="meta">${metaLines.join('<br>')}</div>
            <table>
                <thead><tr><th>#</th><th>Câu hỏi / Mục</th><th>Trả lời</th><th>Điểm</th></tr></thead>
                <tbody>${tableRows || '<tr><td colspan="4">Không có dữ liệu chi tiết.</td></tr>'}</tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
    };
});

// ===== Xuất Excel toàn bộ hệ thống (mọi tài khoản) =====
// Giống hệt bản bên portal chuyên gia (nhóm theo tên+tuổi, nhiều sheet có style), chỉ
// thêm cột "Tài khoản đã nhập" vì dữ liệu ở đây trải trên nhiều chuyên gia khác nhau.
function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

function buildInterpretation(item) {
    const ir = item.interpreted_result;
    if (ir && typeof ir === 'object') {
        if (ir.summary_html) return stripHtml(ir.summary_html);
        if (ir.scored && ir.standard_score !== undefined) {
            const parts = [`Điểm thô: ${ir.raw_total}/36`];
            if (ir.standard_score !== null) {
                parts.push(`SS: ${ir.standard_score}`, `Percentile: ${ir.percentile}`, `Xếp loại: ${ir.iq_label}`);
            } else if (ir.note) {
                parts.push(ir.note);
            }
            return parts.join(' — ');
        }
        if (ir.note) return ir.note;
    }
    if (item.dimension_scores && typeof item.dimension_scores === 'object' && Object.keys(item.dimension_scores).length) {
        return Object.entries(item.dimension_scores)
            .map(([key, value]) => `${key}: ${value?.severity || value?.score || ''}`)
            .join('; ');
    }
    return `Điểm ${item.total_score} — ${item.severity || 'Đã hoàn thành'}`;
}

function sanitizeSheetName(raw, usedNames) {
    let base = String(raw).replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet';
    let candidate = base;
    let counter = 2;
    while (usedNames.has(candidate)) {
        const suffix = ` (${counter})`;
        candidate = base.slice(0, 31 - suffix.length) + suffix;
        counter += 1;
    }
    usedNames.add(candidate);
    return candidate;
}

const XLS_COLORS = {
    header: 'FF7BBF95',
    headerText: 'FFFFFFFF',
    section: 'FFE8CBA7',
    subHeader: 'FFC5E8F5',
    borderLine: 'FFD4A574',
    zebra: 'FFFFF8F0',
    darkText: 'FF4A3728'
};

function xlsThinBorder() {
    const style = { style: 'thin', color: { argb: XLS_COLORS.borderLine } };
    return { top: style, left: style, bottom: style, right: style };
}

function xlsStyleHeaderRow(row, fillArgb = XLS_COLORS.header, fontArgb = XLS_COLORS.headerText) {
    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.font = { bold: true, color: { argb: fontArgb } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = xlsThinBorder();
    });
}

function xlsStyleDataRow(row, zebra) {
    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = xlsThinBorder();
        cell.alignment = { vertical: 'top', wrapText: true };
        if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLS_COLORS.zebra } };
    });
}

function xlsStyleSectionRow(row, span) {
    row.font = { bold: true, color: { argb: XLS_COLORS.darkText } };
    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLS_COLORS.section } };
    });
    if (span) row.worksheet.mergeCells(`A${row.number}:${span}${row.number}`);
}

function groupResultsByPerson(results) {
    const groups = new Map();
    results.forEach((item) => {
        const rawName = (item.respondent_name || '').trim() || 'Chưa rõ tên';
        const normName = rawName.normalize('NFC').toLowerCase();
        const hasAge = item.respondent_age !== null && item.respondent_age !== undefined && item.respondent_age !== '';
        const ageKey = hasAge ? String(item.respondent_age) : '__unknown__';
        const key = `${normName}|${ageKey}`;
        if (!groups.has(key)) {
            groups.set(key, { name: rawName, age: hasAge ? ageKey : '', tests: [] });
        }
        groups.get(key).tests.push(item);
    });

    const nameOccurrence = new Map();
    groups.forEach((group) => {
        const key = group.name.normalize('NFC').toLowerCase();
        nameOccurrence.set(key, (nameOccurrence.get(key) || 0) + 1);
    });

    const finalGroups = Array.from(groups.values()).map((group) => {
        const key = group.name.normalize('NFC').toLowerCase();
        const needsSuffix = nameOccurrence.get(key) > 1;
        const sheetSuffix = needsSuffix ? (group.age ? ` (${group.age} tuổi)` : ' (chưa rõ tuổi)') : '';
        return { ...group, sheetSuffix };
    });

    return finalGroups.sort((a, b) => {
        const aMax = Math.max(...a.tests.map((t) => new Date(t.created_at).getTime()));
        const bMax = Math.max(...b.tests.map((t) => new Date(t.created_at).getTime()));
        return bMax - aMax;
    });
}

// Bấm "Xuất Excel toàn bộ" mở bảng chọn tài khoản trước — không chọn ai thì xuất hết,
// chọn 1 vài tài khoản thì chỉ xuất đúng kết quả của những tài khoản đó.
document.getElementById('arExportAllBtn')?.addEventListener('click', async () => {
    const modal = document.getElementById('arExportOwnerModal');
    const listEl = document.getElementById('arExportOwnerList');
    listEl.innerHTML = 'Đang tải...';
    modal.classList.add('show');
    try {
        const owners = await apiClient.get('/admin/assessment-results/owners', { noCache: true });
        listEl.innerHTML = owners.length
            ? owners.map((o) => `
                <label>
                    <input type="checkbox" value="${o.owner_user_id}">
                    ${esc(o.owner_name || o.owner_email)} (${o.result_count})
                </label>
            `).join('')
            : '<span style="color:var(--text-secondary);">Chưa có tài khoản nào có kết quả.</span>';
    } catch (_e) {
        listEl.innerHTML = '<span style="color:var(--coral);">Không tải được danh sách tài khoản.</span>';
    }
});

document.getElementById('arExportOwnerModalClose')?.addEventListener('click', () => {
    document.getElementById('arExportOwnerModal').classList.remove('show');
});
document.getElementById('arExportOwnerCancelBtn')?.addEventListener('click', () => {
    document.getElementById('arExportOwnerModal').classList.remove('show');
});
document.getElementById('arExportOwnerAllBtn')?.addEventListener('click', () => {
    document.querySelectorAll('#arExportOwnerList input[type="checkbox"]').forEach((cb) => { cb.checked = true; });
});
document.getElementById('arExportOwnerNoneBtn')?.addEventListener('click', () => {
    document.querySelectorAll('#arExportOwnerList input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
});

document.getElementById('arExportOwnerConfirmBtn')?.addEventListener('click', async () => {
    const ownerIds = Array.from(document.querySelectorAll('#arExportOwnerList input[type="checkbox"]:checked')).map((cb) => cb.value);
    document.getElementById('arExportOwnerModal').classList.remove('show');
    await runExportAll(ownerIds);
});

async function runExportAll(ownerIds) {
    const btn = document.getElementById('arExportAllBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Đang tạo file...';

    try {
        const qs = new URLSearchParams({ limit: '0' });
        if (ownerIds && ownerIds.length) qs.set('owner_ids', ownerIds.join(','));
        const allData = await apiClient.get(`/admin/assessment-results?${qs.toString()}`, { noCache: true });
        const allResults = allData?.items || [];
        if (!allResults.length) {
            alert('Chưa có kết quả nào để xuất.');
            return;
        }

        const mod = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
        const ExcelJS = mod.default || mod;
        const wb = new ExcelJS.Workbook();
        const groupList = groupResultsByPerson(allResults);

        const summarySheet = wb.addWorksheet('Danh sách chung');
        summarySheet.columns = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Họ tên', key: 'name', width: 22 },
            { header: 'Tuổi', key: 'age', width: 8 },
            { header: 'Tài khoản đã nhập', key: 'owner', width: 26 },
            { header: 'Ghi chú', key: 'note', width: 24 },
            { header: 'Bài test', key: 'test', width: 28 },
            { header: 'Điểm tổng', key: 'score', width: 10 },
            { header: 'Xếp loại', key: 'severity', width: 16 },
            { header: 'Diễn giải kết quả', key: 'interp', width: 60 },
            { header: 'Thời gian', key: 'time', width: 20 }
        ];
        xlsStyleHeaderRow(summarySheet.getRow(1));
        summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

        let stt = 0;
        groupList.forEach((group) => {
            const startRow = summarySheet.rowCount + 1;
            group.tests.forEach((t, i) => {
                stt += 1;
                const row = summarySheet.addRow({
                    stt,
                    name: group.name,
                    age: group.age,
                    owner: `${t.owner_name || ''} (${t.owner_email})`,
                    note: t.note || '',
                    test: t.name,
                    score: t.total_score,
                    severity: t.severity || '',
                    interp: buildInterpretation(t),
                    time: dt(t.created_at)
                });
                xlsStyleDataRow(row, i % 2 === 1);
            });
            const endRow = summarySheet.rowCount;
            if (endRow > startRow) {
                summarySheet.mergeCells(`B${startRow}:B${endRow}`);
                summarySheet.mergeCells(`C${startRow}:C${endRow}`);
                summarySheet.getCell(`B${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
                summarySheet.getCell(`C${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });

        const usedNames = new Set(['Danh sách chung']);
        let personIndex = 0;
        groupList.forEach((group) => {
            personIndex += 1;
            const sheetName = sanitizeSheetName(`${personIndex}. ${group.name}${group.sheetSuffix}`, usedNames);
            const sheet = wb.addWorksheet(sheetName);
            sheet.columns = [{ key: 'c1', width: 28 }, { key: 'c2', width: 42 }, { key: 'c3', width: 22 }, { key: 'c4', width: 18 }];

            const titleRow = sheet.addRow([`Họ tên: ${group.name}`]);
            xlsStyleSectionRow(titleRow, 'D');
            titleRow.font = { bold: true, size: 13, color: { argb: XLS_COLORS.darkText } };

            const infoText = group.sheetSuffix
                ? `Tuổi: ${group.age || 'Không rõ'}    |    Số bài đã làm: ${group.tests.length}    |    ⚠️ Có người khác trùng tên nhưng khác tuổi — đã tách riêng sheet.`
                : `Tuổi: ${group.age || 'Không rõ'}    |    Số bài đã làm: ${group.tests.length}`;
            const infoRow = sheet.addRow([infoText]);
            sheet.mergeCells(`A${infoRow.number}:D${infoRow.number}`);
            infoRow.font = { italic: true };

            sheet.addRow([]);

            const summaryTitleRow = sheet.addRow(['Bảng tổng hợp các bài đã làm']);
            xlsStyleSectionRow(summaryTitleRow, 'D');

            const summaryHeaderRow = sheet.addRow(['Bài test', 'Điểm / Xếp loại', 'Tài khoản đã nhập', 'Thời gian']);
            xlsStyleHeaderRow(summaryHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);
            group.tests.forEach((t, i) => {
                const row = sheet.addRow([t.name, `${t.total_score} — ${t.severity || ''}`, `${t.owner_name || ''} (${t.owner_email})`, dt(t.created_at)]);
                xlsStyleDataRow(row, i % 2 === 1);
            });

            sheet.addRow([]);

            group.tests.forEach((t) => {
                const rows = Array.isArray(t.raw_answers) ? t.raw_answers.map(normalizeAnswerRow) : [];
                const sectionRow = sheet.addRow([`Chi tiết: ${t.name} — ${dt(t.created_at)} — Tài khoản: ${t.owner_name || t.owner_email}`]);
                xlsStyleSectionRow(sectionRow, 'D');

                const qHeaderRow = sheet.addRow(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm']);
                xlsStyleHeaderRow(qHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);

                if (rows.length) {
                    rows.forEach((r, i) => {
                        const row = sheet.addRow([r.no, r.question, r.answer, r.score]);
                        xlsStyleDataRow(row, i % 2 === 1);
                    });
                } else {
                    xlsStyleDataRow(sheet.addRow(['', 'Không có dữ liệu chi tiết từng câu.', '', '']));
                }
                sheet.addRow([]);
            });
        });

        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `danh-sach-tu-test-toan-he-thong-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export all assessment results failed:', error);
        alert('Không thể tạo file Excel. Vui lòng thử lại.');
    } finally {
        btn.disabled = false;
        btn.textContent = '📊 Xuất Excel toàn bộ';
    }
}

init();
