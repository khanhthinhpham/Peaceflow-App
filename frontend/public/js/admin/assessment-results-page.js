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

    currentItem = item;
    document.getElementById('arDetailModal').classList.add('show');
}

let currentItem = null;

document.getElementById('arDeleteBtn')?.addEventListener('click', async () => {
    if (!currentItem) return;
    if (!window.confirm(`Xoá kết quả "${currentItem.name}" của ${currentItem.respondent_name || 'người này'}? Không thể hoàn tác.`)) return;
    try {
        await apiClient.delete(`/admin/assessment-results/${currentItem.id}`);
        closeDetail();
        load(state.page);
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
    if (!currentItem) return;
    const item = currentItem;
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
    if (!currentItem) return;
    const item = currentItem;
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

document.getElementById('arExportAllBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('arExportAllBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Đang tạo file...';

    try {
        const allData = await apiClient.get('/admin/assessment-results?limit=0', { noCache: true });
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
});

init();
