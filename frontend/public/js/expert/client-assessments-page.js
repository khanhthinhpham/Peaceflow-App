import { apiClient } from '../api-client.js';
import { mountExpertShell, requireExpertUser, showExpertBanner } from './shell.js';
import { escapeHtml, formatDateTime } from './utils.js';

// Mô tả rút gọn theo từng mức 1/2/3/4 của CARS (Childhood Autism Rating Scale).
// Các mức lẻ (1.5/2.5/3.5) không có mô tả riêng — giữ đúng bản gốc (ô để trống).
const CARS_DOMAINS = [
    { key: 'd1', label: '1. Quan hệ với mọi người', levels: {
        1: 'Không có biểu hiện khó khăn khi quan hệ với mọi người, hành vi phù hợp với tuổi.',
        2: 'Quan hệ bất bình thường nhẹ: né tránh ánh mắt/bám bố mẹ nhiều hơn trẻ cùng tuổi.',
        3: 'Bất thường trung bình: dường như không nhận thấy người lớn, hiếm khi khởi đầu quan hệ.',
        4: 'Bất thường nặng: luôn tách biệt, hầu như không bao giờ đáp ứng hay khởi đầu quan hệ.'
    } },
    { key: 'd2', label: '2. Bắt chước', levels: {
        1: 'Bắt chước âm thanh, lời nói, động tác phù hợp với lứa tuổi.',
        2: 'Chỉ bắt chước hành vi đơn giản, cần khích lệ hoặc trì hoãn (nhẹ).',
        3: 'Ít bắt chước, cần yêu cầu kiên trì và giúp đỡ nhiều (trung bình).',
        4: 'Hiếm khi hoặc không bao giờ bắt chước dù được khích lệ (nặng).'
    } },
    { key: 'd3', label: '3. Đáp ứng cảm xúc', levels: {
        1: 'Đáp ứng cảm xúc phù hợp với tình huống và tuổi.',
        2: 'Đôi khi thể hiện cảm xúc không phù hợp, không liên quan tình huống (nhẹ).',
        3: 'Có dấu hiệu rõ về đáp ứng cảm xúc không phù hợp, quá mức hoặc thiếu (trung bình).',
        4: 'Đáp ứng cảm xúc hiếm khi phù hợp, rất khó thay đổi khí sắc (nặng).'
    } },
    { key: 'd4', label: '4. Động tác cơ thể', levels: {
        1: 'Hoạt động thoải mái, nhanh nhẹn, phối hợp tốt như trẻ cùng tuổi.',
        2: 'Có động tác bất thường nhỏ: vụng về, lặp lại, phối hợp kém (nhẹ).',
        3: 'Cử động khác lạ rõ: ngón tay, nhìn chằm chằm, đung đưa, quay tròn (trung bình).',
        4: 'Động tác bất thường xuất hiện mạnh mẽ, liên tục dù bị lôi kéo (nặng).'
    } },
    { key: 'd5', label: '5. Sử dụng đồ vật', levels: {
        1: 'Quan tâm và sử dụng đồ chơi/đồ vật phù hợp, đúng cách.',
        2: 'Quan tâm không đúng kiểu, chơi không phù hợp như đập/mút đồ chơi (nhẹ).',
        3: 'Ít quan tâm đồ chơi, tập trung vào chi tiết không đặc trưng, lặp một hành động (trung bình).',
        4: 'Hành vi bất thường thường xuyên, cường độ mạnh, khó đổi hướng (nặng).'
    } },
    { key: 'd6', label: '6. Thích nghi với sự thay đổi', levels: {
        1: 'Chấp nhận thay đổi thông thường mà không khó chịu.',
        2: 'Tiếp tục hoạt động cũ khi bị yêu cầu thay đổi (nhẹ).',
        3: 'Chống lại thay đổi, khó bị đánh lạc hướng, cáu giận khi đổi thói quen (trung bình).',
        4: 'Phản ứng mãnh liệt, rất cáu giận hoặc không hợp tác khi bị thay đổi (nặng).'
    } },
    { key: 'd7', label: '7. Đáp ứng nhìn', levels: {
        1: 'Động tác nhìn bình thường, phù hợp lứa tuổi, kết hợp giác quan khác.',
        2: 'Đôi khi cần nhắc nhìn vào vật, thích nhìn gương/đèn sáng, tránh giao tiếp mắt (nhẹ).',
        3: 'Thường bị nhắc nhìn, nhìn chằm chằm khoảng trống, cầm đồ vật sát mắt (trung bình).',
        4: 'Luôn tránh nhìn vào mắt/đồ vật, cách nhìn rất đặc biệt (nặng).'
    } },
    { key: 'd8', label: '8. Đáp ứng nghe', levels: {
        1: 'Biểu hiện nghe bình thường, phù hợp lứa tuổi.',
        2: 'Đôi khi thiếu đáp ứng hoặc nhạy cảm với âm thanh nhất định (nhẹ).',
        3: 'Đáp ứng âm thanh hay biến đổi; lờ đi âm thanh hoặc giật mình/che tai (trung bình).',
        4: 'Đáp ứng cực kỳ nhạy cảm hoặc hoàn toàn không đáp ứng với âm thanh (nặng).'
    } },
    { key: 'd9', label: '9. Nếm, ngửi và đáp ứng xúc giác', levels: {
        1: 'Đáp ứng/sử dụng nếm-ngửi-sờ bình thường, khám phá đồ vật phù hợp.',
        2: 'Hay cho đồ vật vào miệng, ngửi/nếm thứ không ăn được (nhẹ).',
        3: 'Biểu hiện trung bình khi sờ/ngửi/nếm hoặc khi được bế/ôm; phản ứng quá/dưới mức (trung bình).',
        4: 'Tạo cảm giác thay vì thăm dò; không cảm nhận đau hoặc quá nhạy cảm (nặng).'
    } },
    { key: 'd10', label: '10. Sợ hãi và lo lắng', levels: {
        1: 'Sợ hãi/lo lắng phù hợp tình huống và tuổi.',
        2: 'Đôi khi sợ hãi/lo lắng hơn bạn cùng tuổi trong tình huống tương tự (nhẹ).',
        3: 'Thể hiện khá nhiều sợ hãi/lo lắng so với trẻ khác (trung bình).',
        4: 'Sợ hãi kéo dài, khó trấn an, hoặc thiếu nhận biết nguy hiểm cần tránh (nặng).'
    } },
    { key: 'd11', label: '11. Giao tiếp có lời', levels: {
        1: 'Giao tiếp có lời bình thường, phù hợp tình huống và tuổi.',
        2: 'Ngôn ngữ chậm, có thể lặp âm/đảo đại từ, đôi khi dùng từ kỳ dị (nhẹ).',
        3: 'Có thể không nói được, hoặc lời nói kỳ dị/lặp lại, hỏi quá nhiều hoặc bám chủ đề (trung bình).',
        4: 'Không dùng từ có nghĩa, nhiều âm vô nghĩa/la hét hoặc kỳ dị (nặng).'
    } },
    { key: 'd12', label: '12. Giao tiếp không lời', levels: {
        1: 'Sử dụng giao tiếp không lời (cử chỉ, nét mặt) bình thường.',
        2: 'Sử dụng không thuần thục, chỉ thể hiện nhu cầu một cách mơ hồ (nhẹ).',
        3: 'Không có khả năng thể hiện nhu cầu/hiểu người khác qua giao tiếp không lời (trung bình).',
        4: 'Dùng cử chỉ kỳ dị vô nghĩa; không hiểu cử chỉ/nét mặt người khác (nặng).'
    } },
    { key: 'd13', label: '13. Mức độ hoạt động', levels: {
        1: 'Hoạt động phù hợp tuổi và hoàn cảnh.',
        2: 'Bồn chồn nhẹ hoặc lười biếng/di chuyển chậm chạp (nhẹ).',
        3: 'Khó kiềm chế/khó ngủ ban đêm, hoặc thờ ơ cần thúc giục (trung bình).',
        4: 'Hoạt động trì trệ hoặc chuyển cực đoan bất thường, quá mức (nặng).'
    } },
    { key: 'd14', label: '14. Mức độ và sự ổn định của đáp ứng trí tuệ', levels: {
        1: 'Trí tuệ bình thường, ổn định ở mọi lĩnh vực, không có bất thường.',
        2: 'Không thông minh như bạn cùng tuổi, kỹ năng chậm ở mọi lĩnh vực (nhẹ).',
        3: 'Nhìn chung không thông minh bằng bạn cùng tuổi, nhưng có lĩnh vực gần bình thường (trung bình).',
        4: 'Không thông minh bằng bạn cùng tuổi nhưng có thể vượt trội ở vài lĩnh vực riêng lẻ (nặng).'
    } },
    { key: 'd15', label: '15. Ấn tượng chung', levels: {
        1: 'Không tự kỷ — không có các triệu chứng đặc trưng.',
        2: 'Tự kỷ mức nhẹ — thể hiện vài triệu chứng hoặc chỉ ở mức nhẹ.',
        3: 'Tự kỷ mức vừa — thể hiện một số triệu chứng ở mức vừa.',
        4: 'Tự kỷ nặng — thể hiện hầu hết triệu chứng ở mức nặng.'
    } }
];

const CARS_SCALE_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4];

const CARS_BANDS = [
    { max: 29.5, label: 'Không có tự kỷ' },
    { max: 36.5, label: 'Tự kỷ mức độ nhẹ và vừa' },
    { max: 60, label: 'Tự kỷ mức độ nặng' }
];

// SDQ-25 bản quan sát (cán bộ tâm lý/chuyên gia chấm) — thứ tự câu 1-25 giữ nguyên bản gốc.
const SDQ_OBS_ITEMS = [
    { n: 1, text: 'Quan tâm đến cảm xúc của người khác', dim: 'prosocial' },
    { n: 2, text: 'Bồn chồn, quá hiếu động, không ở yên một chỗ được lâu', dim: 'hyperactivity' },
    { n: 3, text: 'Hay than phiền là bị đau đầu, đau bụng hoặc bị ốm', dim: 'emotional' },
    { n: 4, text: 'Sẵn sàng chia sẻ với những trẻ khác (nhường quà, đồ chơi)', dim: 'prosocial' },
    { n: 5, text: 'Hay có những cơn nổi cáu hoặc tức giận', dim: 'conduct' },
    { n: 6, text: 'Hay lủi thủi một mình hoặc có xu hướng chơi một mình', dim: 'peer' },
    { n: 7, text: 'Nhìn chung là ngoan, luôn làm những điều người lớn sai bảo', dim: 'conduct', reverse: true },
    { n: 8, text: 'Có nhiều điều lo lắng, thường tỏ ra lo lắng', dim: 'emotional' },
    { n: 9, text: 'Giúp đỡ ai đó bị đau, buồn bực hay bị bệnh', dim: 'prosocial' },
    { n: 10, text: 'Liên tục bồn chồn hay lúc nào cũng bứt rứt', dim: 'hyperactivity' },
    { n: 11, text: 'Có ít nhất một bạn thân', dim: 'peer', reverse: true },
    { n: 12, text: 'Thường đánh nhau với những đứa trẻ khác hoặc la hét chúng', dim: 'conduct' },
    { n: 13, text: 'Hay không được vui, buồn bã hoặc mau nước mắt', dim: 'emotional' },
    { n: 14, text: 'Nói chung được những trẻ khác thích', dim: 'peer', reverse: true },
    { n: 15, text: 'Dễ sao nhãng, thiếu tập trung', dim: 'hyperactivity' },
    { n: 16, text: 'Hồi hộp, sợ sệt trong những tình huống mới, dễ mất tự tin', dim: 'emotional' },
    { n: 17, text: 'Tử tế với những trẻ nhỏ tuổi hơn', dim: 'prosocial' },
    { n: 18, text: 'Hay nói dối, lừa lọc', dim: 'conduct' },
    { n: 19, text: 'Bị những trẻ khác trêu chọc hoặc bắt nạt', dim: 'peer' },
    { n: 20, text: 'Hay nguyện giúp đỡ người khác (bố, mẹ, thầy cô, bạn bè)', dim: 'prosocial' },
    { n: 21, text: 'Đắn đo hoặc suy nghĩ mọi chuyện trước khi làm', dim: 'hyperactivity', reverse: true },
    { n: 22, text: 'Ăn cắp đồ ở nhà, trường học hoặc những nơi khác', dim: 'conduct' },
    { n: 23, text: 'Dễ hòa đồng với người lớn hơn là với trẻ khác', dim: 'peer', reverse: true },
    { n: 24, text: 'Hay sợ hãi, dễ hoảng sợ', dim: 'emotional' },
    { n: 25, text: 'Làm những công việc được giao từ đầu đến cuối, thời gian chú ý cao', dim: 'hyperactivity', reverse: true }
];

const SDQ_DIMENSION_LABELS = {
    emotional: 'Cảm xúc',
    conduct: 'Hành vi',
    hyperactivity: 'Tăng động',
    peer: 'Bạn bè',
    prosocial: 'Xã hội tích cực'
};

const SDQ_CUTOFFS = { emotional: 4, conduct: 3, hyperactivity: 6, peer: 3 };
const SDQ_TOTAL_BANDS = [
    { max: 15, label: 'Bình thường' },
    { max: 19, label: 'Ranh giới' },
    { max: 40, label: 'Bất thường' }
];

const state = {
    clients: [],
    selectedClient: null,
    testType: 'CARS',
    carsAnswers: {},
    sdqAnswers: {},
    history: [],
    selfTestResults: [],
    selfTestPage: 0,
    selfTestLimit: 10,
    selfTestTotal: 0,
    selfTestFilters: { search: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false },
    patientViewActive: false,
    colleagues: null
};

// Danh mục bài test tự làm — dùng để đổ vào ô lọc "Bài test" ở khu tìm kiếm.
const SELF_TEST_CODES = [
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
    { code: 'RAVEN_CPM', label: 'Raven CPM' }
];

// Cửa sổ trang hiển thị (luôn có trang đầu/cuối, dấu … khi xa) — cùng kiểu pager
// đã dùng ở trang Quản lý user trong admin.
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

function renderSelfTestPager() {
    const el = document.getElementById('caSelfTestPager');
    if (!el) return;
    const totalPages = Math.max(1, Math.ceil(state.selfTestTotal / state.selfTestLimit));
    const cur = state.selfTestPage;

    if (state.selfTestTotal === 0) {
        el.innerHTML = '';
        return;
    }

    const from = cur * state.selfTestLimit + 1;
    const to = Math.min(state.selfTestTotal, (cur + 1) * state.selfTestLimit);
    const metaHtml = `<span class="ca-pager-meta">${from}–${to} trong ${state.selfTestTotal}</span>`;

    if (totalPages <= 1) {
        el.innerHTML = metaHtml;
        return;
    }

    const last = totalPages - 1;
    const parts = [metaHtml];
    parts.push(`<button type="button" class="ca-page-btn" data-page="0" ${cur === 0 ? 'disabled' : ''} title="Trang đầu">« Đầu</button>`);
    parts.push(`<button type="button" class="ca-page-btn" data-page="${cur - 1}" ${cur === 0 ? 'disabled' : ''}>‹ Trước</button>`);
    for (const p of pageWindow(cur, totalPages)) {
        parts.push(p === '…'
            ? '<span class="ca-page-ellipsis">…</span>'
            : `<button type="button" class="ca-page-btn${p === cur ? ' active' : ''}" data-page="${p}">${p + 1}</button>`);
    }
    parts.push(`<button type="button" class="ca-page-btn" data-page="${cur + 1}" ${cur >= last ? 'disabled' : ''}>Sau ›</button>`);
    parts.push(`<button type="button" class="ca-page-btn" data-page="${last}" ${cur >= last ? 'disabled' : ''} title="Trang cuối">Cuối »</button>`);
    el.innerHTML = parts.join('');

    el.querySelectorAll('.ca-page-btn[data-page]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (!Number.isNaN(p) && p !== state.selfTestPage) {
                loadSelfTestResults(p);
            }
        });
    });
}

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'client-assessments',
        title: 'Đánh giá lâm sàng',
        subtitle: 'Nhập điểm CARS hoặc SDQ-25 (bản quan sát) thay cho client trong các buổi tư vấn.',
        badgeText: 'CARS · SDQ-25'
    });

    wireSelfTestSearch();
    await Promise.all([loadClients(), loadSelfTestResults()]);
}

function wireSelfTestSearch() {
    const codeSel = document.getElementById('caSearchCode');
    if (codeSel) {
        codeSel.innerHTML = '<option value="">Tất cả bài test</option>'
            + SELF_TEST_CODES.map((t) => `<option value="${t.code}">${t.label}</option>`).join('');
    }

    const runSearch = () => {
        state.selfTestFilters = {
            search: document.getElementById('caSearchName').value.trim(),
            code: document.getElementById('caSearchCode').value,
            ageMin: document.getElementById('caSearchAgeMin').value.trim(),
            ageMax: document.getElementById('caSearchAgeMax').value.trim(),
            flaggedOnly: document.getElementById('caSearchFlagged').checked
        };
        if (state.patientViewActive) loadPatientSummaryView();
        else loadSelfTestResults(0);
    };

    document.getElementById('caSearchBtn')?.addEventListener('click', runSearch);
    document.getElementById('caSearchFlagged')?.addEventListener('change', runSearch);

    document.getElementById('caSearchName')?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') document.getElementById('caSearchBtn').click();
    });

    document.getElementById('caSearchResetBtn')?.addEventListener('click', () => {
        document.getElementById('caSearchName').value = '';
        document.getElementById('caSearchCode').value = '';
        document.getElementById('caSearchAgeMin').value = '';
        document.getElementById('caSearchAgeMax').value = '';
        document.getElementById('caSearchFlagged').checked = false;
        state.selfTestFilters = { search: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false };
        if (state.patientViewActive) loadPatientSummaryView();
        else loadSelfTestResults(0);
    });

    document.getElementById('caPatientViewBtn')?.addEventListener('click', togglePatientView);
}

function togglePatientView() {
    state.patientViewActive = !state.patientViewActive;
    const btn = document.getElementById('caPatientViewBtn');
    if (btn) btn.textContent = state.patientViewActive ? '📋 Xem theo lần test' : '👤 Xem theo bệnh nhân';
    document.getElementById('caSelfTestPager').style.display = state.patientViewActive ? 'none' : '';
    if (state.patientViewActive) loadPatientSummaryView();
    else loadSelfTestResults(0);
}

async function loadSelfTestResults(page = 0) {
    const el = document.getElementById('caSelfTestList');
    const pagerEl = document.getElementById('caSelfTestPager');
    el.innerHTML = '<p class="ca-empty">Đang tải...</p>';
    if (pagerEl) pagerEl.innerHTML = '';
    state.selfTestPage = Math.max(0, page);

    const qs = new URLSearchParams({
        limit: String(state.selfTestLimit),
        offset: String(state.selfTestPage * state.selfTestLimit)
    });
    const f = state.selfTestFilters;
    if (f.search) qs.set('search', f.search);
    if (f.code) qs.set('code', f.code);
    if (f.ageMin) qs.set('age_min', f.ageMin);
    if (f.ageMax) qs.set('age_max', f.ageMax);
    if (f.flaggedOnly) qs.set('flagged', 'true');

    let data;
    try {
        data = await apiClient.get(
            `/expert-portal/self-test-results?${qs.toString()}`,
            { noCache: true }
        );
    } catch (error) {
        state.selfTestResults = [];
        state.selfTestTotal = 0;
        el.innerHTML = '<p class="ca-empty">Không tải được danh sách.</p>';
        return;
    }

    state.selfTestResults = data?.items || [];
    state.selfTestTotal = data?.total || 0;

    if (!state.selfTestResults.length) {
        const hasFilter = Object.values(state.selfTestFilters).some(Boolean);
        el.innerHTML = state.selfTestTotal
            ? '<p class="ca-empty">Không có kết quả ở trang này.</p>'
            : hasFilter
                ? '<p class="ca-empty">Không tìm thấy kết quả khớp với bộ lọc.</p>'
                : '<p class="ca-empty">Chưa có ai tự làm test trên tài khoản này.</p>';
        renderSelfTestPager();
        return;
    }

    renderSelfTestList();
    renderSelfTestPager();
}

// Vẽ lại danh sách từ state hiện có (không gọi lại API) — dùng sau khi đổi cờ đánh dấu.
function renderSelfTestList() {
    const el = document.getElementById('caSelfTestList');
    if (!el) return;
    el.innerHTML = state.selfTestResults.map((item) => `
        <div class="ca-selftest-item" data-selftest-id="${item.id}">
            <button type="button" class="ca-flag-btn${item.flagged ? ' active' : ''}" data-flag-btn title="${item.flagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}">${item.flagged ? '⭐' : '☆'}</button>
            <div class="ca-selftest-main">
                <div class="ca-selftest-name">${escapeHtml(item.respondent_name || 'Chưa rõ tên')}${item.respondent_age ? ` — ${item.respondent_age} tuổi` : ''}${!item.is_owner ? ' <span class="ca-shared-badge">🔗 Được chia sẻ</span>' : ''}</div>
                <div class="ca-selftest-meta">${escapeHtml(item.name)} · ${formatDateTime(item.created_at)}</div>
                ${item.note ? `<div class="ca-selftest-note">Ghi chú: ${escapeHtml(item.note)}</div>` : ''}
            </div>
            <div class="ca-selftest-score">${escapeHtml(item.severity || 'Đã hoàn thành')}<br>${item.total_score}</div>
        </div>
    `).join('');
    el.querySelectorAll('[data-selftest-id]').forEach((row) => {
        row.addEventListener('click', (ev) => {
            if (ev.target.closest('[data-flag-btn]')) return;
            const item = state.selfTestResults.find((r) => r.id === row.getAttribute('data-selftest-id'));
            if (item) openDetailModal(item);
        });
        row.querySelector('[data-flag-btn]')?.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const item = state.selfTestResults.find((r) => r.id === row.getAttribute('data-selftest-id'));
            if (!item) return;
            try {
                const updated = await apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged });
                item.flagged = updated.flagged;
                renderSelfTestList();
            } catch (error) {
                showExpertBanner(error.message || 'Không thể đánh dấu.', 'error');
            }
        });
    });
}

// Xem theo bệnh nhân: gộp toàn bộ kết quả (theo đúng bộ lọc đang chọn) theo tên+tuổi —
// cùng logic gộp dùng khi xuất Excel — để bác sĩ thấy tổng số lần 1 người đã làm test,
// tiện khi muốn xem lại trước khi cho làm thêm bài mới.
let patientGroupsCache = [];
async function loadPatientSummaryView() {
    const el = document.getElementById('caSelfTestList');
    el.innerHTML = '<p class="ca-empty">Đang tải...</p>';

    const qs = new URLSearchParams({ limit: '0' });
    const f = state.selfTestFilters;
    if (f.search) qs.set('search', f.search);
    if (f.code) qs.set('code', f.code);
    if (f.ageMin) qs.set('age_min', f.ageMin);
    if (f.ageMax) qs.set('age_max', f.ageMax);
    if (f.flaggedOnly) qs.set('flagged', 'true');

    let data;
    try {
        data = await apiClient.get(`/expert-portal/self-test-results?${qs.toString()}`, { noCache: true });
    } catch (error) {
        el.innerHTML = '<p class="ca-empty">Không tải được danh sách.</p>';
        return;
    }

    const results = data?.items || [];
    if (!results.length) {
        el.innerHTML = '<p class="ca-empty">Không có bệnh nhân nào khớp với bộ lọc.</p>';
        return;
    }

    patientGroupsCache = groupSelfTestResultsByPerson(results);
    el.innerHTML = patientGroupsCache.map((g, idx) => `
        <div class="ca-patient-card" data-patient-idx="${idx}">
            <div>
                <div class="ca-patient-name">${escapeHtml(g.name)}${g.age ? ` — ${g.age} tuổi` : ''}</div>
                <div class="ca-patient-meta">Lần gần nhất: ${formatDateTime(g.tests[0].created_at)}</div>
            </div>
            <div class="ca-patient-count">${g.tests.length} lần test</div>
        </div>
    `).join('');

    el.querySelectorAll('[data-patient-idx]').forEach((card) => {
        card.addEventListener('click', () => {
            const g = patientGroupsCache[Number(card.getAttribute('data-patient-idx'))];
            if (g) openPatientModal(g);
        });
    });
}

function openPatientModal(group) {
    document.getElementById('caPatientModalTitle').textContent = group.name;
    document.getElementById('caPatientModalMeta').textContent = `${group.age ? `${group.age} tuổi · ` : ''}${group.tests.length} lần test`;
    const listEl = document.getElementById('caPatientModalList');
    listEl.innerHTML = group.tests
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((t) => `
            <div class="ca-patient-test-row" data-test-id="${t.id}">
                <div>
                    <div class="ca-selftest-name">${escapeHtml(t.name)}</div>
                    <div class="ca-selftest-meta">${formatDateTime(t.created_at)}</div>
                </div>
                <div class="ca-selftest-score">${escapeHtml(t.severity || 'Đã hoàn thành')}<br>${t.total_score}</div>
            </div>
        `).join('');
    listEl.querySelectorAll('[data-test-id]').forEach((row) => {
        row.addEventListener('click', () => {
            const t = group.tests.find((x) => x.id === row.getAttribute('data-test-id'));
            if (t) {
                document.getElementById('caPatientModal').classList.remove('show');
                openDetailModal(t);
            }
        });
    });
    document.getElementById('caPatientModal').classList.add('show');
}

document.getElementById('caPatientModalClose')?.addEventListener('click', () => {
    document.getElementById('caPatientModal').classList.remove('show');
});

async function loadClients() {
    const el = document.getElementById('caClientList');
    el.innerHTML = '<p class="ca-empty">Đang tải danh sách client...</p>';
    try {
        state.clients = await apiClient.get('/expert-portal/clients', { noCache: true });
    } catch (error) {
        state.clients = [];
        el.innerHTML = '<p class="ca-empty">Không tải được danh sách client.</p>';
        return;
    }
    renderClientList();
}

function renderClientList() {
    const el = document.getElementById('caClientList');
    if (!state.clients.length) {
        el.innerHTML = '<p class="ca-empty">Bạn chưa có client nào (cần ít nhất 1 lịch hẹn đã xác nhận/hoàn thành).</p>';
        return;
    }

    el.innerHTML = `<div class="ca-client-grid">${state.clients.map((client) => `
        <div class="ca-client-card ${state.selectedClient?.user_id === client.user_id ? 'is-active' : ''}" data-client-id="${client.user_id}">
            <div class="ca-client-name">${escapeHtml(client.full_name || 'Client')}</div>
            <div class="ca-client-meta">${escapeHtml(client.email || '')}</div>
            <div class="ca-client-meta">Lịch gần nhất: ${formatDateTime(client.last_booking_at)}</div>
        </div>
    `).join('')}</div>`;

    el.querySelectorAll('[data-client-id]').forEach((card) => {
        card.addEventListener('click', () => selectClient(card.getAttribute('data-client-id')));
    });
}

function selectClient(userId) {
    state.selectedClient = state.clients.find((c) => c.user_id === userId) || null;
    if (!state.selectedClient) return;

    renderClientList();
    document.getElementById('caFormPanel').style.display = 'block';
    document.getElementById('caHistoryPanel').style.display = 'block';
    document.getElementById('caFormSubtitle').textContent = `Client: ${state.selectedClient.full_name || state.selectedClient.email}`;

    state.carsAnswers = {};
    state.sdqAnswers = {};
    renderTestSwitch();
    renderForm();
    loadHistory();
}

function renderTestSwitch() {
    const el = document.getElementById('caTestSwitch');
    const options = [
        { code: 'CARS', label: 'CARS (Tự kỷ)' },
        { code: 'SDQ25_OBS', label: 'SDQ-25 (Quan sát)' }
    ];
    el.innerHTML = options.map((opt) => `
        <button type="button" class="ca-switch-btn ${state.testType === opt.code ? 'is-active' : ''}" data-test-type="${opt.code}">${opt.label}</button>
    `).join('');
    el.querySelectorAll('[data-test-type]').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.testType = btn.getAttribute('data-test-type');
            renderTestSwitch();
            renderForm();
        });
    });
}

function renderForm() {
    document.getElementById('caFormTitle').textContent = state.testType === 'CARS'
        ? 'CARS — Thang đánh giá mức độ tự kỷ'
        : 'SDQ-25 — Bản quan sát';
    if (state.testType === 'CARS') renderCarsForm();
    else renderSdqObsForm();
}

function renderCarsForm() {
    const el = document.getElementById('caFormBody');
    el.innerHTML = CARS_DOMAINS.map((domain) => {
        const selected = state.carsAnswers[domain.key];
        const desc = Number.isInteger(selected) ? (domain.levels[selected] || '') : '';
        return `
            <div class="ca-domain">
                <div class="ca-domain-label">${escapeHtml(domain.label)}</div>
                <div class="ca-scale-row" data-domain="${domain.key}">
                    ${CARS_SCALE_VALUES.map((v) => `
                        <button type="button" class="ca-scale-btn ${!Number.isInteger(v) ? 'is-half' : ''} ${selected === v ? 'is-selected' : ''}" data-value="${v}">${v}</button>
                    `).join('')}
                </div>
                <div class="ca-domain-desc">${escapeHtml(desc)}</div>
            </div>
        `;
    }).join('') + `
        <div class="ca-submit-row">
            <button type="button" class="btn-primary" id="caSubmitBtn">Nộp đánh giá CARS</button>
        </div>
    `;

    el.querySelectorAll('.ca-scale-row').forEach((row) => {
        const domainKey = row.getAttribute('data-domain');
        row.querySelectorAll('[data-value]').forEach((btn) => {
            btn.addEventListener('click', () => {
                state.carsAnswers[domainKey] = Number(btn.getAttribute('data-value'));
                renderCarsForm();
            });
        });
    });

    document.getElementById('caSubmitBtn')?.addEventListener('click', submitCars);
}

const SDQ_OBS_OPTIONS = [
    { label: 'Không đúng', normal: 0, reverse: 2 },
    { label: 'Đúng một phần', normal: 1, reverse: 1 },
    { label: 'Chắc chắn đúng', normal: 2, reverse: 0 }
];

function renderSdqObsForm() {
    const el = document.getElementById('caFormBody');
    const options = SDQ_OBS_OPTIONS;

    el.innerHTML = SDQ_OBS_ITEMS.map((item) => {
        const selected = state.sdqAnswers[item.n];
        return `
            <div class="ca-sdq-item">
                <div class="ca-sdq-text">${item.n}. ${escapeHtml(item.text)}</div>
                <div class="ca-sdq-opts" data-item="${item.n}">
                    ${options.map((opt) => {
                        const score = item.reverse ? opt.reverse : opt.normal;
                        return `<button type="button" class="ca-sdq-opt ${selected === score ? 'is-selected' : ''}" data-score="${score}">${opt.label}</button>`;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('') + `
        <div class="ca-submit-row">
            <button type="button" class="btn-primary" id="caSubmitBtn">Nộp đánh giá SDQ-25</button>
        </div>
    `;

    el.querySelectorAll('.ca-sdq-opts').forEach((row) => {
        const itemN = Number(row.getAttribute('data-item'));
        row.querySelectorAll('[data-score]').forEach((btn) => {
            btn.addEventListener('click', () => {
                state.sdqAnswers[itemN] = Number(btn.getAttribute('data-score'));
                renderSdqObsForm();
            });
        });
    });

    document.getElementById('caSubmitBtn')?.addEventListener('click', submitSdqObs);
}

function findBand(score, bands) {
    return bands.find((b) => score <= b.max) || bands[bands.length - 1];
}

async function submitCars() {
    if (Object.keys(state.carsAnswers).length < CARS_DOMAINS.length) {
        showExpertBanner('Vui lòng chấm đủ cả 15 lĩnh vực trước khi nộp.', 'error');
        return;
    }
    const total = CARS_DOMAINS.reduce((sum, d) => sum + (state.carsAnswers[d.key] || 0), 0);
    const band = findBand(total, CARS_BANDS);

    try {
        await apiClient.post(`/expert-portal/clients/${state.selectedClient.user_id}/assessments/CARS/submit`, {
            raw_answers: CARS_DOMAINS.map((d) => {
                const score = state.carsAnswers[d.key];
                return {
                    question: d.label,
                    answer: Number.isInteger(score) ? (d.levels[score] || String(score)) : String(score),
                    score
                };
            }),
            total_score: total,
            severity: band.label,
            dimension_scores: {},
            interpreted_result: { bands: CARS_BANDS }
        });
        showExpertBanner(`Đã lưu CARS — Tổng điểm ${total}, xếp loại: ${band.label}.`, 'success');
        state.carsAnswers = {};
        renderCarsForm();
        loadHistory();
    } catch (error) {
        showExpertBanner(error.message || 'Không thể lưu kết quả CARS.', 'error');
    }
}

async function submitSdqObs() {
    if (Object.keys(state.sdqAnswers).length < SDQ_OBS_ITEMS.length) {
        showExpertBanner('Vui lòng trả lời đủ cả 25 câu trước khi nộp.', 'error');
        return;
    }

    const dimensionScores = {};
    Object.keys(SDQ_DIMENSION_LABELS).forEach((dim) => {
        const items = SDQ_OBS_ITEMS.filter((it) => it.dim === dim);
        const score = items.reduce((sum, it) => sum + (state.sdqAnswers[it.n] || 0), 0);
        dimensionScores[dim] = score;
    });

    const total = Object.keys(dimensionScores)
        .filter((dim) => dim !== 'prosocial')
        .reduce((sum, dim) => sum + dimensionScores[dim], 0);
    const band = findBand(total, SDQ_TOTAL_BANDS);

    const dimensionResult = Object.fromEntries(Object.entries(dimensionScores).map(([dim, score]) => {
        if (dim === 'prosocial') {
            return [dim, { score, severity: score < 5 ? 'Cần hỗ trợ thêm kỹ năng xã hội' : 'Tốt' }];
        }
        const cutoff = SDQ_CUTOFFS[dim];
        return [dim, { score, severity: score >= cutoff ? 'Cần chú ý' : 'Bình thường' }];
    }));

    try {
        await apiClient.post(`/expert-portal/clients/${state.selectedClient.user_id}/assessments/SDQ25_OBS/submit`, {
            raw_answers: SDQ_OBS_ITEMS.map((it) => {
                const score = state.sdqAnswers[it.n];
                const opt = SDQ_OBS_OPTIONS.find((o) => (it.reverse ? o.reverse : o.normal) === score);
                return {
                    question: `${it.n}. ${it.text}`,
                    answer: opt ? opt.label : String(score),
                    score
                };
            }),
            total_score: total,
            severity: band.label,
            dimension_scores: dimensionResult,
            interpreted_result: { dimension_labels: SDQ_DIMENSION_LABELS }
        });
        showExpertBanner(`Đã lưu SDQ-25 quan sát — Tổng điểm khó khăn ${total}, xếp loại: ${band.label}.`, 'success');
        state.sdqAnswers = {};
        renderSdqObsForm();
        loadHistory();
    } catch (error) {
        showExpertBanner(error.message || 'Không thể lưu kết quả SDQ-25.', 'error');
    }
}

async function loadHistory() {
    const el = document.getElementById('caHistoryList');
    if (!state.selectedClient) return;
    el.innerHTML = '<p class="ca-empty">Đang tải lịch sử...</p>';
    try {
        state.history = await apiClient.get(`/expert-portal/clients/${state.selectedClient.user_id}/assessments`, { noCache: true });
    } catch (error) {
        state.history = [];
        el.innerHTML = '<p class="ca-empty">Không tải được lịch sử đánh giá.</p>';
        return;
    }
    renderHistory();
}

function renderHistory() {
    const el = document.getElementById('caHistoryList');
    if (!state.history.length) {
        el.innerHTML = '<p class="ca-empty">Chưa có đánh giá nào được bạn ghi cho client này.</p>';
        return;
    }
    el.innerHTML = state.history.map((item) => `
        <div class="ca-history-item" data-history-id="${item.id}">
            <span><strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.severity || 'Đã hoàn thành')} (${item.total_score})</span>
            <span>${formatDateTime(item.created_at)}</span>
        </div>
    `).join('');

    el.querySelectorAll('[data-history-id]').forEach((row) => {
        row.addEventListener('click', () => {
            const item = state.history.find((r) => r.id === row.getAttribute('data-history-id'));
            if (item) openDetailModal(item, state.selectedClient);
        });
    });
}

// ===== Detail modal + export =====

let detailContext = null;

// Bảng câu hỏi/đáp án (nhãn + điểm) của các bài tự làm, trích từ đúng dữ liệu bài test
// bên mood-assessment.html — dùng để hiện dropdown đáp án khi sửa kết quả, đảm bảo chọn
// đáp án nào thì điểm tự khớp theo đúng quy định của bài đó, không để lệch tay như khi
// gõ tự do. Bài không có trong bảng (Raven CPM, CARS, SDQ25 quan sát...) vẫn sửa được
// bằng ô nhập tay như trước.
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
    // Câu hỏi bị lệch thứ tự (dữ liệu cũ) — thử tìm theo đúng nội dung câu hỏi.
    const byText = test.questions.find((q) => q.text === row.question);
    return byText ? byText.options : null;
}

// Tính lại điểm tổng từ điểm từng câu đang hiển thị trong bảng, theo đúng công thức
// (nhóm chỉ số + hệ số nhân) của từng bài — giống hệt cách finishTest() tính khi làm bài
// thật ở mood-assessment.html, để sửa 1 câu là điểm tổng tự nhảy đúng, không cần tính tay.
// Trả về null nếu bài không có cấu hình tính điểm trong danh mục (Raven CPM, CARS...).
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

function normalizeAnswerRow(entry, index) {
    // Dữ liệu cũ (làm trước khi lưu kèm nội dung câu hỏi) có thể là null, số, hoặc
    // object thiếu field — luôn trả về dạng hiển thị được, không để trang bị vỡ.
    if (entry === null || typeof entry !== 'object') {
        return {
            no: index + 1,
            question: `Câu ${index + 1}`,
            answer: entry === null || entry === undefined ? '(không có dữ liệu)' : String(entry),
            score: ''
        };
    }
    const question = entry.question || entry.domain || entry.item || `Câu ${index + 1}`;
    const answer = entry.answer ?? (entry.choice !== undefined && entry.choice !== null ? `Đáp án ${entry.choice}` : '');
    const score = entry.score ?? entry.choice ?? '';
    return { no: index + 1, question, answer, score };
}

async function loadAttachmentImage(resultId) {
    const attachEl = document.getElementById('caDetailAttachment');
    attachEl.innerHTML = '<p style="color:var(--text-secondary);">Đang tải ảnh...</p>';
    try {
        const blob = await apiClient.getBlob(`/assessments/results/${resultId}/attachment`);
        const url = URL.createObjectURL(blob);
        attachEl.innerHTML = `<img src="${url}" alt="Ảnh đính kèm" style="max-width:100%;border-radius:12px;border:1.5px solid var(--kraft-light);">`;
    } catch (error) {
        console.error('Load attachment failed:', error);
        attachEl.innerHTML = '<p style="color:var(--coral);">Không tải được ảnh đính kèm.</p>';
    }
}

// Khi bài test có sẵn danh mục đáp án (findCatalogOptions trả về khác null), cả 2 ô
// "Trả lời" và "Điểm" đều là dropdown cùng trỏ vào 1 chỉ số (index) trong danh sách đáp
// án — chọn ở ô nào thì ô kia tự nhảy theo, không thể lệch nhau. Bài không có danh mục
// (Raven CPM, CARS...) vẫn dùng ô nhập tay tự do như trước.
function renderDetailRows(rows, editing, testCode, catalog) {
    const tbody = document.getElementById('caDetailRows');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-secondary);">Không có dữ liệu chi tiết từng câu.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map((r) => {
        const options = editing ? findCatalogOptions(catalog, testCode, r) : null;
        let answerCell;
        let scoreCell;
        if (!editing) {
            answerCell = escapeHtml(String(r.answer));
            scoreCell = escapeHtml(String(r.score));
        } else if (options) {
            let selIdx = options.findIndex((opt) => opt.label === r.answer);
            if (selIdx === -1) selIdx = options.findIndex((opt) => opt.score === r.score);
            if (selIdx === -1) selIdx = 0;
            const optionTags = (textFn) => options.map((opt, i) => `<option value="${i}" ${i === selIdx ? 'selected' : ''}>${escapeHtml(String(textFn(opt)))}</option>`).join('');
            answerCell = `<select data-row-idx="${r.no}" data-role="answer" class="form-input">${optionTags((opt) => opt.label)}</select>`;
            scoreCell = `<select data-row-idx="${r.no}" data-role="score" class="form-input">${optionTags((opt) => opt.score)}</select>`;
        } else {
            answerCell = `<input type="text" data-row-answer="${r.no}" value="${escapeHtml(String(r.answer))}" class="form-input">`;
            scoreCell = `<input type="number" step="0.5" data-row-score="${r.no}" value="${escapeHtml(String(r.score))}" class="form-input">`;
        }
        return `
        <tr>
            <td>${r.no}</td>
            <td>${escapeHtml(String(r.question))}</td>
            <td>${answerCell}</td>
            <td>${scoreCell}</td>
        </tr>
    `;
    }).join('');

    if (!editing) return;

    // Điểm tổng ngoài panel tự tính lại mỗi khi 1 câu trong bảng đổi điểm — theo đúng
    // công thức (nhóm chỉ số + hệ số nhân) của bài đó nếu có trong danh mục.
    const recomputeTotal = () => {
        const scoresByIndex = rows.map((r) => {
            const sel = tbody.querySelector(`select[data-row-idx="${r.no}"][data-role="score"]`);
            if (sel) return Number(sel.value);
            const input = tbody.querySelector(`[data-row-score="${r.no}"]`);
            return input ? Number(input.value) : r.score;
        });
        const total = computeTotalFromRowScores(testCode, catalog, scoresByIndex);
        if (total !== null) document.getElementById('caEditScore').value = total;
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

// Chỉ chủ sở hữu (chuyên gia đã tự nhập cho khách) mới sửa/xoá/chia sẻ được — không áp
// dụng cho kết quả của client đã có tài khoản riêng (item đi kèm `client`), và không áp
// dụng cho kết quả người khác chia sẻ cho mình (is_owner === false).
function isOwnedResult(item, client) {
    return !client && item?.is_owner !== false;
}
// Đánh dấu thì cả chủ sở hữu và người được chia sẻ đều bấm được.
function canFlagResult(item, client) {
    return !client && !!item?.id;
}

function openDetailModal(item, client) {
    detailContext = { item, client, editing: false, rows: Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [] };

    document.getElementById('caDetailTitle').textContent = item.name;
    renderDetailMeta(item, client);

    const attachEl = document.getElementById('caDetailAttachment');
    if (item.has_attachment) {
        attachEl.style.display = 'block';
        attachEl.innerHTML = `<button type="button" class="ca-export-btn" id="caViewAttachmentBtn">🖼️ Xem ảnh đính kèm</button>`;
        document.getElementById('caViewAttachmentBtn').addEventListener('click', () => loadAttachmentImage(item.id));
    } else {
        attachEl.style.display = 'none';
        attachEl.innerHTML = '';
    }

    renderDetailRows(detailContext.rows, false);
    document.getElementById('caEditPanel').style.display = 'none';
    document.getElementById('caEditSaveBtn').style.display = 'none';
    document.getElementById('caSharePanel').style.display = 'none';
    const toggleBtn = document.getElementById('caEditToggleBtn');
    toggleBtn.textContent = '✏️ Sửa kết quả';
    const owned = isOwnedResult(item, client);
    toggleBtn.style.display = owned ? '' : 'none';
    document.getElementById('caDeleteBtn').style.display = owned ? '' : 'none';
    document.getElementById('caShareToggleBtn').style.display = owned ? '' : 'none';

    const flagBtn = document.getElementById('caFlagToggleBtn');
    flagBtn.style.display = canFlagResult(item, client) ? '' : 'none';
    flagBtn.textContent = item.flagged ? '⭐ Đã đánh dấu' : '☆ Đánh dấu';

    document.getElementById('caDetailModal').classList.add('show');
}

function renderDetailMeta(item, client) {
    const parts = [];
    if (client) parts.push(`Client: ${client.full_name || client.email}`);
    if (item.respondent_name) parts.push(`Người làm bài: ${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
    parts.push(`Điểm: ${item.total_score}`);
    parts.push(`Xếp loại: ${item.severity || 'Đã hoàn thành'}`);
    parts.push(formatDateTime(item.created_at));
    if (item.note) parts.push(`Ghi chú: ${item.note}`);
    if (item.edited_at) parts.push(`(đã sửa lúc ${formatDateTime(item.edited_at)})`);
    document.getElementById('caDetailMeta').textContent = parts.join(' · ');
}

window.caCloseDetail = function () {
    document.getElementById('caDetailModal').classList.remove('show');
    detailContext = null;
};

document.getElementById('caFlagToggleBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const { item } = detailContext;
    try {
        const updated = await apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged });
        item.flagged = updated.flagged;
        const flagBtn = document.getElementById('caFlagToggleBtn');
        flagBtn.textContent = item.flagged ? '⭐ Đã đánh dấu' : '☆ Đánh dấu';
        const listed = state.selfTestResults.find((r) => r.id === item.id);
        if (listed) { listed.flagged = item.flagged; renderSelfTestList(); }
    } catch (error) {
        showExpertBanner(error.message || 'Không thể đánh dấu.', 'error');
    }
});

document.getElementById('caDeleteBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const { item } = detailContext;
    if (!window.confirm(`Xoá kết quả "${item.name}" của ${item.respondent_name || 'người này'}? Không thể hoàn tác.`)) return;
    try {
        await apiClient.delete(`/assessments/results/${item.id}`);
        showExpertBanner('Đã xoá kết quả.', 'success');
        window.caCloseDetail();
        if (state.patientViewActive) loadPatientSummaryView();
        else loadSelfTestResults(state.selfTestPage);
    } catch (error) {
        showExpertBanner(error.message || 'Không thể xoá kết quả.', 'error');
    }
});

async function ensureColleaguesLoaded() {
    if (state.colleagues) return state.colleagues;
    try {
        state.colleagues = await apiClient.get('/expert-portal/colleagues', { noCache: true });
    } catch (_error) {
        state.colleagues = [];
    }
    return state.colleagues;
}

async function refreshShareList(resultId) {
    const listEl = document.getElementById('caShareList');
    listEl.innerHTML = 'Đang tải...';
    try {
        const shares = await apiClient.get(`/assessments/results/${resultId}/shares`, { noCache: true });
        if (!shares.length) {
            listEl.innerHTML = '<span style="color:var(--text-secondary);">Chưa chia sẻ với ai.</span>';
            return;
        }
        listEl.innerHTML = `<strong>Đã chia sẻ với:</strong><ul style="margin:6px 0 0;padding-left:18px;">${shares.map((s) => `
            <li>${escapeHtml(s.full_name || s.email)} <button type="button" class="ca-unshare-btn" data-target="${s.shared_with_user_id}" style="border:none;background:none;color:var(--coral);cursor:pointer;font-size:.78rem;">Gỡ</button></li>
        `).join('')}</ul>`;
        listEl.querySelectorAll('[data-target]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                try {
                    await apiClient.delete(`/assessments/results/${resultId}/share/${btn.getAttribute('data-target')}`);
                    refreshShareList(resultId);
                } catch (error) {
                    showExpertBanner(error.message || 'Không thể gỡ chia sẻ.', 'error');
                }
            });
        });
    } catch (_error) {
        listEl.innerHTML = '<span style="color:var(--coral);">Không tải được danh sách chia sẻ.</span>';
    }
}

document.getElementById('caShareToggleBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const panel = document.getElementById('caSharePanel');
    const opening = panel.style.display === 'none';
    panel.style.display = opening ? '' : 'none';
    if (!opening) return;

    const colleagues = await ensureColleaguesLoaded();
    const select = document.getElementById('caShareTarget');
    select.innerHTML = '<option value="">Chọn chuyên gia...</option>'
        + colleagues.map((c) => `<option value="${c.user_id}">${escapeHtml(c.full_name)}${c.degree ? ` — ${escapeHtml(c.degree)}` : ''}</option>`).join('');
    refreshShareList(detailContext.item.id);
});

document.getElementById('caShareConfirmBtn')?.addEventListener('click', async () => {
    if (!detailContext) return;
    const targetUserId = document.getElementById('caShareTarget').value;
    if (!targetUserId) {
        showExpertBanner('Vui lòng chọn chuyên gia cần chia sẻ.', 'error');
        return;
    }
    try {
        await apiClient.post(`/assessments/results/${detailContext.item.id}/share`, { target_user_id: targetUserId });
        showExpertBanner('Đã chia sẻ kết quả.', 'success');
        refreshShareList(detailContext.item.id);
    } catch (error) {
        showExpertBanner(error.message || 'Không thể chia sẻ.', 'error');
    }
});

window.caToggleEdit = async function () {
    if (!detailContext) return;
    detailContext.editing = !detailContext.editing;
    const { item, editing, rows } = detailContext;

    document.getElementById('caEditPanel').style.display = editing ? '' : 'none';
    document.getElementById('caEditSaveBtn').style.display = editing ? '' : 'none';
    document.getElementById('caEditToggleBtn').textContent = editing ? 'Hủy sửa' : '✏️ Sửa kết quả';

    if (editing) {
        document.getElementById('caEditName').value = item.respondent_name || '';
        document.getElementById('caEditAge').value = item.respondent_age ?? '';
        document.getElementById('caEditScore').value = item.total_score ?? '';
        document.getElementById('caEditSeverity').value = item.severity || '';
        document.getElementById('caEditNote').value = item.note || '';
    }

    const catalog = editing ? await loadAnswerCatalog() : null;
    if (!detailContext || detailContext.item !== item) return; // modal đã đóng/đổi trong lúc tải catalog
    detailContext.catalog = catalog;
    renderDetailRows(rows, editing, item.code, catalog);
};

window.caSaveEdit = async function () {
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
        respondent_name: document.getElementById('caEditName').value.trim() || null,
        respondent_age: document.getElementById('caEditAge').value.trim() || null,
        total_score: Number(document.getElementById('caEditScore').value),
        severity: document.getElementById('caEditSeverity').value.trim() || null,
        note: document.getElementById('caEditNote').value.trim() || null,
        raw_answers: editedRows
    };

    if (!Number.isFinite(payload.total_score)) {
        showExpertBanner('Điểm tổng không hợp lệ.', 'error');
        return;
    }

    const saveBtn = document.getElementById('caEditSaveBtn');
    saveBtn.disabled = true;
    try {
        const updated = await apiClient.patch(`/assessments/results/${item.id}`, payload);
        Object.assign(item, updated, { raw_answers: editedRows });
        detailContext.rows = editedRows.map(normalizeAnswerRow);
        detailContext.editing = false;

        document.getElementById('caEditPanel').style.display = 'none';
        saveBtn.style.display = 'none';
        document.getElementById('caEditToggleBtn').textContent = '✏️ Sửa kết quả';
        renderDetailMeta(item, detailContext.client);
        renderDetailRows(detailContext.rows, false);
        showExpertBanner('Đã lưu thay đổi kết quả.', 'success');
        loadSelfTestResults(state.selfTestPage);
    } catch (error) {
        showExpertBanner(error.message || 'Không thể lưu thay đổi.', 'error');
    } finally {
        saveBtn.disabled = false;
    }
};

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

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

// Diễn giải kết quả dạng chữ, ưu tiên lấy phần tóm tắt đã có sẵn (summary_html của bài
// tự làm, note của Raven...), rơi về liệt kê điểm từng nhóm, cuối cùng mới chỉ ghi điểm/xếp loại.
function buildInterpretation(item) {
    const ir = item.interpreted_result;
    if (ir && typeof ir === 'object') {
        if (ir.summary_html) return stripHtml(ir.summary_html);
        // Raven CPM: hiển thị đủ điểm thô + chỉ số chuẩn hoá/IQ thay vì chỉ mỗi ghi chú.
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

// Gộp các lượt test làm CÙNG 1 người: khớp CẢ tên (đã chuẩn hoá Unicode) VÀ tuổi mới
// coi là cùng 1 người. Chỉ cần tuổi khác nhau — kể cả khi một lượt bỏ trống tuổi —
// đã coi là 2 người khác nhau và tách sheet riêng (không đoán/gộp bừa). Việc thêm
// hậu tố tuổi vào tên sheet chỉ áp dụng khi CÙNG tên xuất hiện ở nhiều tuổi khác
// nhau, để tránh 2 sheet trông giống hệt nhau mà không rõ vì sao lại tách.
function groupSelfTestResultsByPerson(results) {
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

    // Tên nào xuất hiện ở nhiều hơn 1 nhóm (tức nhiều tuổi khác nhau) mới cần thêm
    // hậu tố tuổi vào tên sheet để phân biệt.
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

// Xuất TOÀN BỘ danh sách người đã tự làm test ra 1 file Excel (.xlsx) nhiều sheet có
// tô màu/viền/gộp ô (dùng ExcelJS tải động — SheetJS bản miễn phí không ghi được style):
// sheet đầu là danh sách chung (gộp ô tên/tuổi nếu 1 người làm nhiều bài), các sheet
// sau mỗi người 1 sheet, trình bày dạng bảng tổng hợp + chi tiết từng câu hỏi.
window.caExportAllSelfTests = async function () {
    if (!state.selfTestTotal) {
        showExpertBanner('Chưa có ai tự làm test để xuất.', 'error');
        return;
    }

    const btn = document.getElementById('caExportAllBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang tạo file...'; }

    try {
        // Danh sách hiển thị đang phân trang — xuất Excel cần TOÀN BỘ, không chỉ trang
        // đang xem, nên gọi riêng với limit=0 (backend hiểu là lấy hết, không phân trang).
        const allData = await apiClient.get('/expert-portal/self-test-results?limit=0', { noCache: true });
        const allResults = allData?.items || [];
        if (!allResults.length) {
            showExpertBanner('Chưa có ai tự làm test để xuất.', 'error');
            return;
        }

        const mod = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
        const ExcelJS = mod.default || mod;
        const wb = new ExcelJS.Workbook();
        const groupList = groupSelfTestResultsByPerson(allResults);

        // ===== Sheet 1: Danh sách chung =====
        const summarySheet = wb.addWorksheet('Danh sách chung');
        summarySheet.columns = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Họ tên', key: 'name', width: 22 },
            { header: 'Tuổi', key: 'age', width: 8 },
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
                    note: t.note || '',
                    test: t.name,
                    score: t.total_score,
                    severity: t.severity || '',
                    interp: buildInterpretation(t),
                    time: formatDateTime(t.created_at)
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

        // ===== Sheet sau: 1 người / 1 sheet =====
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

            const summaryHeaderRow = sheet.addRow(['Bài test', 'Điểm / Xếp loại', 'Thời gian', 'Ghi chú']);
            xlsStyleHeaderRow(summaryHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);
            group.tests.forEach((t, i) => {
                const row = sheet.addRow([t.name, `${t.total_score} — ${t.severity || ''}`, formatDateTime(t.created_at), t.note || '']);
                xlsStyleDataRow(row, i % 2 === 1);
            });

            sheet.addRow([]);

            group.tests.forEach((t) => {
                const rows = Array.isArray(t.raw_answers) ? t.raw_answers.map(normalizeAnswerRow) : [];
                const sectionRow = sheet.addRow([`Chi tiết: ${t.name} — ${formatDateTime(t.created_at)}`]);
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
        a.download = `danh-sach-tu-test-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showExpertBanner(`Đã xuất Excel cho ${allResults.length} lượt test của ${groupList.length} người (${groupList.length + 1} sheet).`, 'success');
    } catch (error) {
        console.error('Export all self-tests failed:', error);
        showExpertBanner('Không thể tạo file Excel. Vui lòng thử lại.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📊 Xuất Excel toàn bộ'; }
    }
};

window.caExportCsv = function () {
    if (!detailContext) return;
    const { item, client } = detailContext;
    const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];

    const lines = [];
    lines.push(['Bài test', item.name].map(csvEscape).join(','));
    if (client) lines.push(['Client', client.full_name || client.email].map(csvEscape).join(','));
    if (item.respondent_name) lines.push(['Người làm bài', `${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`].map(csvEscape).join(','));
    lines.push(['Điểm', item.total_score].map(csvEscape).join(','));
    lines.push(['Xếp loại', item.severity || ''].map(csvEscape).join(','));
    lines.push(['Ngày', formatDateTime(item.created_at)].map(csvEscape).join(','));
    if (item.note) lines.push(['Ghi chú', item.note].map(csvEscape).join(','));
    lines.push('');
    lines.push(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm'].map(csvEscape).join(','));
    rows.forEach((r) => lines.push([r.no, r.question, r.answer, r.score].map(csvEscape).join(',')));

    downloadCsv(`${(item.name || 'ket-qua').replace(/\s+/g, '-')}-${item.id.slice(0, 8)}.csv`, lines);
};

window.caExportPdf = function () {
    if (!detailContext) return;
    const { item, client } = detailContext;
    const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];

    const metaLines = [];
    if (client) metaLines.push(`Client: ${escapeHtml(client.full_name || client.email)}`);
    if (item.respondent_name) metaLines.push(`Người làm bài: ${escapeHtml(item.respondent_name)}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
    metaLines.push(`Điểm: ${escapeHtml(String(item.total_score))}`);
    metaLines.push(`Xếp loại: ${escapeHtml(item.severity || 'Đã hoàn thành')}`);
    metaLines.push(`Ngày: ${escapeHtml(formatDateTime(item.created_at))}`);
    if (item.note) metaLines.push(`Ghi chú: ${escapeHtml(item.note)}`);

    const tableRows = rows.map((r) => `
        <tr>
            <td>${r.no}</td>
            <td>${escapeHtml(String(r.question))}</td>
            <td>${escapeHtml(String(r.answer))}</td>
            <td>${escapeHtml(String(r.score))}</td>
        </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showExpertBanner('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để xuất PDF.', 'error');
        return;
    }
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(item.name)}</title>
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
            <h1>${escapeHtml(item.name)}</h1>
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
};

init();
