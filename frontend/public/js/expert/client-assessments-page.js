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
    history: []
};

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'client-assessments',
        title: 'Đánh giá lâm sàng',
        subtitle: 'Nhập điểm CARS hoặc SDQ-25 (bản quan sát) thay cho client trong các buổi tư vấn.',
        badgeText: 'CARS · SDQ-25'
    });

    await Promise.all([loadClients(), loadSelfTestResults()]);
}

async function loadSelfTestResults() {
    const el = document.getElementById('caSelfTestList');
    el.innerHTML = '<p class="ca-empty">Đang tải...</p>';
    let results = [];
    try {
        results = await apiClient.get('/expert-portal/self-test-results', { noCache: true });
    } catch (error) {
        el.innerHTML = '<p class="ca-empty">Không tải được danh sách.</p>';
        return;
    }

    if (!results.length) {
        el.innerHTML = '<p class="ca-empty">Chưa có ai tự làm test trên tài khoản này.</p>';
        return;
    }

    el.innerHTML = results.map((item) => `
        <div class="ca-selftest-item">
            <div class="ca-selftest-main">
                <div class="ca-selftest-name">${escapeHtml(item.respondent_name || 'Chưa rõ tên')}${item.respondent_age ? ` — ${item.respondent_age} tuổi` : ''}</div>
                <div class="ca-selftest-meta">${escapeHtml(item.name)} · ${formatDateTime(item.created_at)}</div>
                ${item.note ? `<div class="ca-selftest-note">Ghi chú: ${escapeHtml(item.note)}</div>` : ''}
            </div>
            <div class="ca-selftest-score">${escapeHtml(item.severity || 'Đã hoàn thành')}<br>${item.total_score}</div>
        </div>
    `).join('');
}

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

function renderSdqObsForm() {
    const el = document.getElementById('caFormBody');
    const options = [
        { label: 'Không đúng', normal: 0, reverse: 2 },
        { label: 'Đúng một phần', normal: 1, reverse: 1 },
        { label: 'Chắc chắn đúng', normal: 2, reverse: 0 }
    ];

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
            raw_answers: CARS_DOMAINS.map((d) => ({ domain: d.key, score: state.carsAnswers[d.key] })),
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
            raw_answers: SDQ_OBS_ITEMS.map((it) => ({ question: it.n, score: state.sdqAnswers[it.n] })),
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
        <div class="ca-history-item">
            <span><strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.severity || 'Đã hoàn thành')} (${item.total_score})</span>
            <span>${formatDateTime(item.created_at)}</span>
        </div>
    `).join('');
}

init();
