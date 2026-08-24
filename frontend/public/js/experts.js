import { apiClient } from './api-client.js';

window.__expertsApiMode = true;

// Hình thức tư vấn — chỉ ảnh hưởng cách kết nối, KHÔNG ảnh hưởng giá (giá do thời lượng
// + khám mới/tái khám quyết định, xem DURATION_TIERS).
const SESSION_CONFIG = {
    voice: { label: 'Gọi thoại', icon: '📞' },
    video: { label: 'Video call', icon: '📹' }
};

// Thời lượng quyết định giá — cùng 1 bảng giá cho mọi chuyên gia. Giá thật lấy từ
// expert.session_pricing (server trả về theo đúng khám mới/tái khám của user hiện tại).
const DURATION_TIERS = {
    quick: { label: 'Nhanh', icon: '⚡', durationLabel: 'Dưới 30 phút', minutes: 25 },
    standard: { label: 'Tiêu chuẩn', icon: '🕐', durationLabel: '30 - 60 phút', minutes: 45 }
};

const TOPIC_OPTIONS = ['Lo âu', 'Trầm cảm', 'Stress công việc', 'Mất ngủ', 'Mối quan hệ', 'Sang chấn', 'Khác'];
const SEVERITY_OPTIONS = ['Nhẹ', 'Vừa', 'Nặng'];

const state = {
    experts: [],
    filteredExperts: [],
    summary: null,
    aiMatch: null,
    upcomingBooking: null,
    currentFilter: 'all',
    currentSort: 'rating',
    search: '',
    currentExpertId: null,
    bookingMonthOffset: 0,
    bookingData: {
        expertId: null,
        sessionType: 'voice',
        durationTier: 'quick',
        price: 0,
        duration: DURATION_TIERS.quick.minutes,
        date: '',
        time: '',
        startsAt: '',
        topic: '',
        severity: '',
        notes: ''
    }
};

const refs = {
    subtitle: document.getElementById('expertsSubtitle'),
    aiMatchTitle: document.getElementById('aiMatchTitle'),
    aiMatchSubtitle: document.getElementById('aiMatchSubtitle'),
    activeCount: document.getElementById('expertsActiveCount'),
    avgRating: document.getElementById('expertsAvgRating'),
    sessionsCount: document.getElementById('expertsSessionsCount'),
    satisfactionRate: document.getElementById('expertsSatisfactionRate'),
    grid: document.getElementById('expertGrid'),
    searchInput: document.getElementById('expertsSearchInput'),
    sortSelect: document.getElementById('expertsSortSelect'),
    bookingOverlay: document.getElementById('bookingModalOverlay'),
    profileOverlay: document.getElementById('profileModalOverlay'),
    bmAvatar: document.getElementById('bmAvatar'),
    bmName: document.getElementById('bmName'),
    bmDegree: document.getElementById('bmDegree'),
    pmAvatar: document.getElementById('pmAvatar'),
    pmName: document.getElementById('pmName'),
    pmDegree: document.getElementById('pmDegree'),
    pmTags: document.getElementById('pmTags'),
    pmStats: document.getElementById('pmStats'),
    pmBio: document.getElementById('pmBio'),
    pmCredentials: document.getElementById('pmCredentials'),
    pmApproaches: document.getElementById('pmApproaches'),
    sessionTypes: document.getElementById('sessionTypes'),
    durationTiers: document.getElementById('durationTiers'),
    clientTypeBanner: document.getElementById('bookingClientTypeBanner'),
    calendarGrid: document.getElementById('calendarGrid'),
    timeSlots: document.getElementById('timeSlots'),
    calMonthLabel: document.getElementById('calMonthLabel'),
    bsExpert: document.getElementById('bs-expert'),
    bsType: document.getElementById('bs-type'),
    bsDatetime: document.getElementById('bs-datetime'),
    bsDuration: document.getElementById('bs-duration'),
    bsPrice: document.getElementById('bs-price'),
    successDatetime: document.getElementById('success-datetime'),
    successType: document.getElementById('success-type'),
    successExpert: document.getElementById('success-expert'),
    notesTextarea: document.querySelector('.problem-textarea'),
    myBookingsSection: document.getElementById('myBookingsSection'),
    myBookingsList: document.getElementById('myBookingsList'),
    reviewOverlay: document.getElementById('reviewModalOverlay'),
    reviewExpertName: document.getElementById('reviewExpertName'),
    reviewStars: document.getElementById('reviewStars'),
    reviewComment: document.getElementById('reviewComment')
};

const BOOKING_STATUS_BADGE = {
    pending_payment: { label: 'Chờ thanh toán', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
    pending: { label: 'Chờ xác nhận thanh toán', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
    awaiting_expert: { label: 'Chờ chuyên gia nhận lịch', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
    confirmed: { label: 'Đã xác nhận', color: '#2f8f5b', bg: 'rgba(47,143,91,.14)' },
    completed: { label: 'Đã hoàn thành', color: '#5a6b5c', bg: 'rgba(120,140,120,.16)' },
    cancelled: { label: 'Đã hủy', color: '#a23b3b', bg: 'rgba(200,80,80,.14)' },
    expired: { label: 'Hết hạn', color: '#a23b3b', bg: 'rgba(200,80,80,.10)' }
};

let reviewState = { bookingId: null, rating: 5 };
let myBookingsState = { items: [], tab: 'upcoming' };
let walletBalance = 0;

async function loadWallet() {
    try {
        const w = await apiClient.get('/wallet', { noCache: true });
        walletBalance = Number(w.balance) || 0;
    } catch (_error) {
        walletBalance = 0;
    }
    const chip = document.getElementById('walletBalanceChip');
    if (chip) {
        chip.textContent = `👛 Ví: ${formatCurrency(walletBalance)}`;
        chip.style.display = walletBalance > 0 ? '' : 'none';
    }
}

async function payWallet(bookingId) {
    try {
        await apiClient.post(`/bookings/${bookingId}/pay-wallet`, {});
        paymentPaidSuccess();
        loadWallet();
    } catch (error) {
        showToast(error.message || 'Không thanh toán được bằng ví.', 'error');
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function showToast(message, type = 'success') {
    if (window.Toast?.show) {
        window.Toast.show(message, 2200);
        return;
    }
    if (type === 'error') alert(message);
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function formatDateTime(value) {
    if (!value) return 'Chưa chọn';
    return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
    }).format(new Date(value));
}

function getExpertById(id) {
    return state.experts.find((expert) => expert.id === id) || null;
}

// Hình thức (voice/video) — không kèm giá, giá chỉ phụ thuộc thời lượng + khám mới/tái khám.
function getSessionOptions() {
    return Object.entries(SESSION_CONFIG).map(([key, config]) => ({
        key,
        label: config.label,
        icon: config.icon
    }));
}

// Thời lượng (nhanh/tiêu chuẩn) — giá lấy từ expert.session_pricing (server tính sẵn theo
// đúng khám mới/tái khám của user hiện tại với chuyên gia này).
function getDurationTierOptions(expert) {
    const pricing = expert?.session_pricing || { quick: 0, standard: 0 };
    return Object.entries(DURATION_TIERS).map(([key, config]) => ({
        key,
        label: config.label,
        icon: config.icon,
        minutes: config.minutes,
        durationLabel: config.durationLabel,
        price: pricing[key] || 0,
        priceLabel: formatCurrency(pricing[key] || 0)
    }));
}

function getSessionPriceLabel(expert) {
    const allPricing = expert?.session_pricing_all || {
        new_client: { quick: 300000, standard: 500000 },
        returning_client: { quick: 150000, standard: 200000 }
    };
    const formatRange = (pricing) => {
        const quick = Number(pricing?.quick || 0);
        const standard = Number(pricing?.standard || 0);
        return quick === standard
            ? formatCurrency(quick)
            : `${formatCurrency(quick)} - ${formatCurrency(standard)}`;
    };
    return {
        newClient: formatRange(allPricing.new_client),
        returningClient: formatRange(allPricing.returning_client)
    };
}

function renderSummary() {
    if (refs.subtitle) {
        const base = `Bạn đang có ${state.summary?.active_experts || 0} chuyên gia khả dụng trong hệ thống`;
        refs.subtitle.textContent = state.upcomingBooking
            ? `${base} • Lịch sắp tới với ${state.upcomingBooking.expert_name} vào ${formatDateTime(state.upcomingBooking.starts_at)}`
            : `${base} và thư viện tư vấn đang hoạt động`;
    }

    if (refs.aiMatchTitle) refs.aiMatchTitle.textContent = `🤖 ${state.aiMatch?.title || 'PeaceCat đang phân tích tín hiệu của bạn'}`;
    if (refs.aiMatchSubtitle) refs.aiMatchSubtitle.textContent = state.aiMatch?.subtitle || 'Bạn có thể xem toàn bộ danh sách chuyên gia bên dưới.';
    if (refs.activeCount) refs.activeCount.textContent = String(state.summary?.active_experts || 0);
    if (refs.avgRating) refs.avgRating.textContent = `${state.summary?.avg_rating || 0}⭐`;
    if (refs.sessionsCount) refs.sessionsCount.textContent = Number(state.summary?.total_sessions || 0).toLocaleString('vi-VN');
    if (refs.satisfactionRate) refs.satisfactionRate.textContent = `${state.summary?.satisfaction_rate || 0}%`;
}

function renderExperts(data) {
    if (!refs.grid) return;

    if (!data.length) {
        refs.grid.innerHTML = `
            <div class="paper-card" style="padding:24px;text-align:center;color:var(--text-secondary);grid-column:1 / -1;">
                Chưa có chuyên gia phù hợp với bộ lọc hiện tại.
            </div>
        `;
        return;
    }

    refs.grid.innerHTML = data.map((expert) => `
        <div class="paper-card expert-card" onclick="openProfileModal('${expert.id}')">
            <div class="ec-top-banner ${escapeHtml(expert.status)}"></div>
            <div class="ec-body">
                ${expert.matched ? '<div class="ec-match-badge">✨ PeaceCat khuyên dùng</div>' : ''}
                <div class="ec-header">
                    <div class="ec-avatar">
                        <span data-avatar-slot="${expert.id}">${escapeHtml(expert.avatar)}</span>
                        <div class="ec-status-dot ${escapeHtml(expert.status)}"></div>
                    </div>
                    <div class="ec-info">
                        <div class="ec-name">${escapeHtml(expert.name)}</div>
                        <div class="ec-degree">${escapeHtml(expert.degree)}</div>
                        <div class="ec-rating">
                            <span class="ec-stars">${'⭐'.repeat(Math.max(1, Math.round(expert.rating || 0)))}</span>
                            <span class="ec-rating-num">${escapeHtml(String(expert.rating))}</span>
                            <span class="ec-sessions">(${escapeHtml(String(expert.sessions))} phiên)</span>
                        </div>
                    </div>
                </div>
                <div class="ec-specialties">
                    ${(expert.specialties || []).map((specialty) => `<span class="ec-specialty">${escapeHtml(specialty)}</span>`).join('')}
                </div>
                <p class="ec-bio">${escapeHtml(expert.bio)}</p>
                <div class="ec-meta">
                    <div class="ec-meta-item">📍 ${escapeHtml(expert.location)}</div>
                    <div class="ec-meta-item">📅 ${escapeHtml(String(expert.experience))} năm kinh nghiệm</div>
                </div>
                <div class="ec-price-row">
                    <div>
                        <div class="ec-price">Khám mới: ${escapeHtml(getSessionPriceLabel(expert).newClient)}</div>
                        <div class="ec-price-label">Tái khám: ${escapeHtml(getSessionPriceLabel(expert).returningClient)}</div>
                    </div>
                    <div class="ec-next">⏰ ${escapeHtml(expert.nextSlot || 'Chưa có lịch')}</div>
                </div>
                <div class="ec-actions">
                    <button class="ec-btn-book" onclick="event.stopPropagation();openBookingModal('${expert.id}')">Đặt lịch ngay</button>
                    <button class="ec-btn-msg" onclick="event.stopPropagation();openProfileModal('${expert.id}')">Xem hồ sơ</button>
                </div>
            </div>
        </div>
    `).join('');

    data.filter((expert) => expert.has_avatar_photo).forEach((expert) => {
        applyAvatarPhoto(refs.grid.querySelector(`[data-avatar-slot="${expert.id}"]`), expert);
    });
}

const avatarUrlCache = new Map();
async function getAvatarObjectUrl(id) {
    if (avatarUrlCache.has(id)) return avatarUrlCache.get(id);
    const blob = await apiClient.getBlob(`/experts/${id}/avatar`);
    const url = URL.createObjectURL(blob);
    avatarUrlCache.set(id, url);
    return url;
}

// Thay emoji bằng ảnh đại diện thật (nếu chuyên gia đã có), giữ nguyên emoji khi tải lỗi.
async function applyAvatarPhoto(el, expert) {
    if (!el || !expert.has_avatar_photo) return;
    try {
        const url = await getAvatarObjectUrl(expert.id);
        el.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
    } catch (_e) { /* giữ nguyên emoji mặc định */ }
}

function applyFilters() {
    const query = state.search.trim().toLowerCase();
    let data = [...state.experts];

    if (state.currentFilter === 'available') {
        data = data.filter((expert) => expert.status === 'online');
    } else if (state.currentFilter === 'matched') {
        data = data.filter((expert) => expert.matched);
    } else if (state.currentFilter !== 'all') {
        data = data.filter((expert) => expert.tags.includes(state.currentFilter));
    }

    if (query) {
        data = data.filter((expert) =>
            expert.name.toLowerCase().includes(query) ||
            expert.specialties.some((specialty) => specialty.toLowerCase().includes(query)) ||
            expert.bio.toLowerCase().includes(query)
        );
    }

    switch (state.currentSort) {
        case 'sessions':
            data.sort((a, b) => b.sessions - a.sessions);
            break;
        case 'price_asc':
            data.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            data.sort((a, b) => b.price - a.price);
            break;
        case 'available':
            data.sort((a, b) => {
                const priority = { online: 0, busy: 1, offline: 2 };
                return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
            });
            break;
        case 'rating':
        default:
            data.sort((a, b) => b.rating - a.rating);
            break;
    }

    state.filteredExperts = data;
    renderExperts(data);
}

function renderProfileModal(expert) {
    if (!expert) return;

    refs.pmAvatar.textContent = expert.avatar;
    applyAvatarPhoto(refs.pmAvatar, expert);
    refs.pmName.textContent = expert.name;
    refs.pmDegree.textContent = expert.degree;
    refs.pmTags.innerHTML = expert.specialties.map((specialty) => `<span class="badge-pill badge-mint">${escapeHtml(specialty)}</span>`).join('');
    refs.pmStats.innerHTML = `
        <div class="stat-card">
            <div class="sc-num">${escapeHtml(String(expert.rating))}⭐</div>
            <div class="sc-label">Đánh giá</div>
        </div>
        <div class="stat-card">
            <div class="sc-num">${escapeHtml(String(expert.sessions))}</div>
            <div class="sc-label">Phiên tư vấn</div>
        </div>
        <div class="stat-card">
            <div class="sc-num">${escapeHtml(String(expert.experience))}</div>
            <div class="sc-label">Năm KN</div>
        </div>
    `;
    refs.pmBio.textContent = expert.bio;
    refs.pmCredentials.innerHTML = expert.credentials.map((credential) => `<div style="font-size:0.8rem;margin-bottom:4px;">${escapeHtml(credential)}</div>`).join('');
    refs.pmApproaches.innerHTML = expert.approaches.map((approach) => `<span class="badge-pill badge-sky" style="margin-right:6px;margin-bottom:6px;">${escapeHtml(approach)}</span>`).join('');
}

function renderSessionTypeOptions() {
    const options = getSessionOptions();
    const selectedType = state.bookingData.sessionType || 'voice';

    refs.sessionTypes.innerHTML = options.map((option) => `
        <div class="session-type-card ${option.key === selectedType ? 'selected' : ''}"
            onclick="selectSessionType(this,'${option.key}')">
            <div class="stc-icon">${option.icon}</div>
            <div class="stc-name">${escapeHtml(option.label)}</div>
        </div>
    `).join('');
}

function renderDurationTierOptions(expert) {
    const options = getDurationTierOptions(expert);
    const selectedTier = state.bookingData.durationTier || 'quick';

    refs.durationTiers.innerHTML = options.map((option) => `
        <div class="session-type-card ${option.key === selectedTier ? 'selected' : ''}"
            onclick="selectDurationTier(this,'${option.key}','${option.price}','${option.minutes}')">
            <div class="stc-icon">${option.icon}</div>
            <div class="stc-name">${escapeHtml(option.label)}</div>
            <div class="stc-price">${escapeHtml(option.priceLabel)}</div>
            <div class="stc-duration">${escapeHtml(option.durationLabel)}</div>
        </div>
    `).join('');

    if (refs.clientTypeBanner) {
        const isReturning = !!expert?.is_returning_client;
        refs.clientTypeBanner.className = `bm-client-type-banner ${isReturning ? 'returning-client' : 'new-client'}`;
        refs.clientTypeBanner.textContent = isReturning
            ? '🔁 Tái khám — bạn đã từng hoàn thành 1 buổi với chuyên gia này, áp dụng giá tái khám.'
            : '🆕 Khám mới — đây là lần đầu bạn đặt lịch với chuyên gia này.';
    }
}

function renderCalendar() {
    if (!refs.calendarGrid || !refs.calMonthLabel) return;

    const today = new Date();
    const monthBase = new Date(today.getFullYear(), today.getMonth() + state.bookingMonthOffset, 1);
    refs.calMonthLabel.textContent = new Intl.DateTimeFormat('vi-VN', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok'
    }).format(monthBase);

    const days = [];
    for (let index = 0; index < 14; index += 1) {
        const date = new Date();
        date.setDate(today.getDate() + index);
        if (date.getMonth() !== monthBase.getMonth() || date.getFullYear() !== monthBase.getFullYear()) continue;
        days.push(date);
    }

    refs.calendarGrid.innerHTML = days.map((date, index) => {
        const isoDate = date.toISOString().slice(0, 10);
        const selected = state.bookingData.date === isoDate || (!state.bookingData.date && index === 0);
        if (selected) state.bookingData.date = isoDate;

        return `
            <div class="calendar-day valid ${selected ? 'selected' : ''}"
                onclick="selectBookingDate('${isoDate}', this)">
                ${date.getDate()}
            </div>
        `;
    }).join('');
}

async function renderTimeSlots() {
    if (!refs.timeSlots) return;

    const expertId = state.currentExpertId;
    const date = state.bookingData.date;
    if (!expertId || !date) {
        refs.timeSlots.innerHTML = '<div class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary,#8b7355);font-size:0.85rem;padding:6px 2px;">Hãy chọn ngày để xem giờ trống.</div>';
        return;
    }

    refs.timeSlots.innerHTML = '<div class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary,#8b7355);font-size:0.85rem;padding:6px 2px;">Đang tải khung giờ trống...</div>';

    let slots = [];
    try {
        slots = await apiClient.get(`/experts/${expertId}/slots?date=${date}`, { noCache: true });
    } catch (_error) {
        slots = [];
    }

    if (!Array.isArray(slots) || !slots.length) {
        state.bookingData.time = '';
        refs.timeSlots.innerHTML = '<div class="time-slot-empty" style="grid-column:1/-1;color:var(--text-secondary,#8b7355);font-size:0.85rem;padding:6px 2px;">Chuyên gia không còn giờ trống trong ngày này. Hãy chọn ngày khác.</div>';
        return;
    }

    if (!slots.includes(state.bookingData.time)) {
        state.bookingData.time = slots[0];
    }

    refs.timeSlots.innerHTML = slots.map((time) => `
        <div class="time-slot ${time === state.bookingData.time ? 'selected' : ''}"
            onclick="selectBookingTime('${time}', this)">
            ${time}
        </div>
    `).join('');
}

function bookingChip(group, value, active) {
    return `<button type="button" data-chip-group="${group}" data-chip-value="${escapeHtml(value)}"
        style="padding:7px 13px;border-radius:999px;border:1.5px solid ${active ? 'var(--mint-dark,#7bbf95)' : 'var(--kraft-light,#e8ddd0)'};background:${active ? 'var(--mint-light,#c5e8d2)' : 'transparent'};font:inherit;font-size:0.82rem;font-weight:700;cursor:pointer;color:var(--text-primary,#4a3728);">${escapeHtml(value)}</button>`;
}

function renderBookingExtras() {
    const topicEl = document.getElementById('bookingTopicChips');
    const sevEl = document.getElementById('bookingSeverityChips');
    if (topicEl) topicEl.innerHTML = TOPIC_OPTIONS.map((t) => bookingChip('topic', t, state.bookingData.topic === t)).join('');
    if (sevEl) sevEl.innerHTML = SEVERITY_OPTIONS.map((s) => bookingChip('severity', s, state.bookingData.severity === s)).join('');

    [topicEl, sevEl].forEach((box) => {
        box?.querySelectorAll('[data-chip-group]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const group = btn.getAttribute('data-chip-group');
                const value = btn.getAttribute('data-chip-value');
                state.bookingData[group] = state.bookingData[group] === value ? '' : value;
                renderBookingExtras();
            });
        });
    });
}

function updateBookingSummary() {
    const expert = getExpertById(state.currentExpertId);
    const session = SESSION_CONFIG[state.bookingData.sessionType] || SESSION_CONFIG.voice;
    const tier = DURATION_TIERS[state.bookingData.durationTier] || DURATION_TIERS.quick;
    const startsAt = state.bookingData.date && state.bookingData.time
        ? `${state.bookingData.date}T${state.bookingData.time}:00+07:00`
        : '';
    state.bookingData.startsAt = startsAt;

    const headerParts = [];
    if (state.bookingData.topic) headerParts.push(`Chủ đề: ${state.bookingData.topic}`);
    if (state.bookingData.severity) headerParts.push(`Mức độ: ${state.bookingData.severity}`);
    const freeText = refs.notesTextarea?.value?.trim() || '';
    state.bookingData.notes = [headerParts.join(' · '), freeText].filter(Boolean).join('\n');

    refs.bsExpert.textContent = expert?.name || '—';
    refs.bsType.textContent = `${session.label} · ${expert?.is_returning_client ? 'Tái khám' : 'Khám mới'} (${tier.label})`;
    refs.bsDatetime.textContent = startsAt ? formatDateTime(startsAt) : 'Chưa chọn';
    refs.bsDuration.textContent = `${state.bookingData.duration} phút`;
    refs.bsPrice.textContent = formatCurrency(state.bookingData.price);
}

function openProfileModal(id) {
    const expert = getExpertById(id);
    if (!expert) return;

    state.currentExpertId = id;
    renderProfileModal(expert);
    refs.profileOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    refs.profileOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

function openBookingModal(id) {
    const expert = getExpertById(id);
    if (!expert) return;

    state.currentExpertId = id;
    const defaultTier = getDurationTierOptions(expert)[0];
    state.bookingMonthOffset = 0;
    state.bookingData = {
        expertId: id,
        sessionType: 'voice',
        durationTier: defaultTier.key,
        price: defaultTier.price,
        duration: defaultTier.minutes,
        date: '',
        time: '10:00',
        startsAt: '',
        topic: '',
        severity: '',
        notes: ''
    };

    refs.bmAvatar.textContent = expert.avatar;
    applyAvatarPhoto(refs.bmAvatar, expert);
    refs.bmName.textContent = `Đặt lịch với ${expert.name}`;
    refs.bmDegree.textContent = expert.degree;
    refs.bsExpert.textContent = expert.name;
    if (refs.notesTextarea) refs.notesTextarea.value = '';
    renderSessionTypeOptions();
    renderDurationTierOptions(expert);
    renderBookingExtras();
    renderCalendar();
    renderTimeSlots();
    goBookingStep(1);
    refs.bookingOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    refs.bookingOverlay.classList.remove('show');
    document.body.style.overflow = '';
    stopPaymentCountdown();
    stopPaymentPoll();
    setTimeout(() => {
        document.getElementById('booking-success').style.display = 'none';
        const pay = document.getElementById('booking-payment');
        if (pay) { pay.style.display = 'none'; pay.innerHTML = ''; }
        document.getElementById('booking-step-1').style.display = 'block';
        document.getElementById('booking-step-4').style.display = 'none';
        document.querySelectorAll('.bm-step').forEach((step, index) => {
            step.classList.toggle('active', index === 0);
        });
    }, 200);
}

let _paymentTimer = null;

function showPaymentStep(bookingId, payment) {
    for (let i = 1; i <= 4; i += 1) {
        const s = document.getElementById(`booking-step-${i}`);
        if (s) s.style.display = 'none';
    }
    document.getElementById('booking-success').style.display = 'none';
    const el = document.getElementById('booking-payment');
    el.style.display = 'block';

    const auto = Boolean(payment.auto);
    const intro = auto
        ? 'Quét mã bằng app ngân hàng (đã điền sẵn số tiền & nội dung). Hệ thống <strong>tự động xác nhận</strong> ngay khi nhận được tiền — bạn không cần làm gì thêm.'
        : 'Quét mã VietQR bằng app ngân hàng (đã điền sẵn số tiền & nội dung). Chuyển xong, bấm <strong>"Tôi đã chuyển khoản"</strong> — quản trị sẽ đối chiếu & xác nhận.';
    const canWallet = Number(payment.amount) > 0 && walletBalance >= Number(payment.amount);
    const walletBtn = canWallet ? `<button class="btn-primary" id="payWalletBtn">👛 Trả bằng ví (${formatCurrency(walletBalance)})</button>` : '';
    const footer = auto
        ? `<button class="btn-outline" onclick="closeBookingModal()">Thanh toán sau</button>
           ${walletBtn}
           ${payment.checkout_url ? `<a class="btn-primary" href="${payment.checkout_url}" target="_blank" rel="noopener">Mở trang thanh toán</a>` : ''}`
        : `<button class="btn-outline" onclick="closeBookingModal()">Thanh toán sau</button>
           ${walletBtn}
           <button class="btn-primary" id="claimPaymentBtn">✓ Tôi đã chuyển khoản</button>`;

    el.innerHTML = `
        <div class="bm-section">
            <div class="bm-section-title">💳 Thanh toán giữ chỗ</div>
            <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:14px;line-height:1.5;">${intro}</p>
            <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;justify-content:center;">
                <img src="${payment.qr_image}" alt="QR thanh toán" style="width:200px;height:200px;border:1.5px solid var(--kraft-light);border-radius:12px;background:#fff;" />
                <div style="font-size:0.86rem;line-height:1.95;min-width:200px;">
                    <div><span style="color:var(--text-secondary);">Ngân hàng:</span> <strong>${escapeHtml(payment.bank?.bankId || '')}</strong></div>
                    <div><span style="color:var(--text-secondary);">Số TK:</span> <strong>${escapeHtml(payment.bank?.accountNo || '')}</strong></div>
                    <div><span style="color:var(--text-secondary);">Chủ TK:</span> <strong>${escapeHtml(payment.bank?.accountName || '')}</strong></div>
                    <div><span style="color:var(--text-secondary);">Số tiền:</span> <strong style="color:var(--coral);">${formatCurrency(payment.amount)}</strong></div>
                    <div><span style="color:var(--text-secondary);">Nội dung:</span> <strong>${escapeHtml(payment.content || '')}</strong></div>
                </div>
            </div>
            ${auto ? '<div style="text-align:center;margin-top:10px;font-size:0.82rem;color:var(--mint-dark);font-weight:700;">⏳ Đang chờ thanh toán… (tự xác nhận)</div>' : ''}
            <div id="paymentCountdown" style="text-align:center;margin-top:8px;font-size:0.82rem;color:var(--text-secondary);"></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
            ${footer}
        </div>
    `;
    if (!auto) {
        el.querySelector('#claimPaymentBtn').addEventListener('click', () => claimPayment(bookingId));
    } else {
        startPaymentPoll(bookingId);
    }
    el.querySelector('#payWalletBtn')?.addEventListener('click', () => payWallet(bookingId));
    startPaymentCountdown(payment.expires_at);
}

function paymentPaidSuccess() {
    stopPaymentCountdown();
    stopPaymentPoll();
    const el = document.getElementById('booking-payment');
    if (!el) return;
    el.innerHTML = `
        <div style="text-align:center;padding:20px 0;">
            <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
            <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">Đã nhận thanh toán!</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">Đang chờ chuyên gia nhận lịch. Bạn sẽ nhận thông báo khi được xác nhận.</div>
            <button class="btn-primary" onclick="closeBookingModal()">Đóng</button>
        </div>`;
    loadMyBookings();
    showToast('Thanh toán thành công!');
}

let _paymentPoll = null;
function startPaymentPoll(bookingId) {
    stopPaymentPoll();
    _paymentPoll = setInterval(async () => {
        try {
            const p = await apiClient.get(`/bookings/${bookingId}/payment`, { noCache: true });
            if (p.booking_status && p.booking_status !== 'pending_payment') {
                paymentPaidSuccess();
            }
        } catch (_e) { /* bỏ qua, thử lại lượt sau */ }
    }, 4000);
}
function stopPaymentPoll() {
    if (_paymentPoll) { clearInterval(_paymentPoll); _paymentPoll = null; }
}

async function claimPayment(bookingId) {
    try {
        await apiClient.post(`/bookings/${bookingId}/claim-payment`, {});
        stopPaymentCountdown();
        const el = document.getElementById('booking-payment');
        el.innerHTML = `
            <div style="text-align:center;padding:20px 0;">
                <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
                <div style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">Đã ghi nhận chuyển khoản!</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">Quản trị sẽ đối chiếu thanh toán và xác nhận lịch. Bạn sẽ nhận thông báo khi được duyệt.</div>
                <button class="btn-primary" onclick="closeBookingModal()">Đóng</button>
            </div>`;
        loadMyBookings();
        showToast('Đã gửi xác nhận chuyển khoản.');
    } catch (error) {
        showToast(error.message || 'Không gửi được xác nhận.', 'error');
    }
}

function startPaymentCountdown(expiresAt) {
    stopPaymentCountdown();
    if (!expiresAt) return;
    const end = new Date(expiresAt).getTime();
    const tick = () => {
        const elc = document.getElementById('paymentCountdown');
        if (!elc) { stopPaymentCountdown(); return; }
        const ms = end - Date.now();
        if (ms <= 0) { elc.textContent = '⌛ Đơn giữ chỗ đã hết hạn — hãy đặt lại.'; stopPaymentCountdown(); return; }
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        elc.textContent = `⌛ Đơn giữ chỗ hết hạn sau ${m}:${String(s).padStart(2, '0')}`;
    };
    tick();
    _paymentTimer = setInterval(tick, 1000);
}

function stopPaymentCountdown() {
    if (_paymentTimer) { clearInterval(_paymentTimer); _paymentTimer = null; }
}

async function reopenPayment(bookingId) {
    try {
        const p = await apiClient.get(`/bookings/${bookingId}/payment`, { noCache: true });
        if (p.booking_status !== 'pending_payment') {
            showToast('Đơn không còn ở trạng thái chờ thanh toán.');
            loadMyBookings();
            return;
        }
        refs.bookingOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        showPaymentStep(bookingId, {
            amount: p.amount,
            qr_image: p.qr_image,
            content: p.content,
            bank: p.bank,
            expires_at: p.expires_at,
            auto: p.auto,
            checkout_url: p.checkout_url
        });
    } catch (_error) {
        showToast('Không mở được thanh toán.', 'error');
    }
}

async function cancelMyBooking(bookingId) {
    if (!window.confirm('Bạn chắc chắn muốn huỷ lịch hẹn này?')) return;
    try {
        const r = await apiClient.post(`/expert-bookings/${bookingId}/cancel`, {});
        showToast(r?.refunded ? `Đã huỷ. Hoàn ${formatCurrency(r.refunded)} vào ví.` : 'Đã huỷ lịch hẹn.');
        loadMyBookings();
        loadWallet();
    } catch (error) {
        showToast(error.message || 'Không huỷ được lịch.', 'error');
    }
}



function goBookingStep(step) {
    if (step === 3 && (!state.bookingData.date || !state.bookingData.time)) {
        showToast('Chọn ngày và giờ trước khi tiếp tục.', 'error');
        return;
    }

    if (step === 4) {
        updateBookingSummary();
    }

    for (let index = 1; index <= 4; index += 1) {
        const stepEl = document.getElementById(`booking-step-${index}`);
        const indicator = document.getElementById(`bm-step-${index}`);
        if (stepEl) stepEl.style.display = index === step ? 'block' : 'none';
        if (indicator) indicator.classList.toggle('active', index === step);
    }

    if (step === 2) {
        renderCalendar();
        renderTimeSlots();
    }
}

function selectSessionType(element, type) {
    refs.sessionTypes.querySelectorAll('.session-type-card').forEach((card) => card.classList.remove('selected'));
    element.classList.add('selected');
    state.bookingData.sessionType = type;
}

function selectDurationTier(element, tier, price, minutes) {
    refs.durationTiers.querySelectorAll('.session-type-card').forEach((card) => card.classList.remove('selected'));
    element.classList.add('selected');
    state.bookingData.durationTier = tier;
    state.bookingData.price = Number(price || 0);
    state.bookingData.duration = Number(minutes || 25);
}

function selectBookingDate(isoDate, element) {
    state.bookingData.date = isoDate;
    element.parentElement.querySelectorAll('.calendar-day').forEach((day) => day.classList.remove('selected'));
    element.classList.add('selected');
    renderTimeSlots();
}

function selectBookingTime(time, element) {
    state.bookingData.time = time;
    element.parentElement.querySelectorAll('.time-slot').forEach((slot) => slot.classList.remove('selected'));
    element.classList.add('selected');
}

function changeMonth(offset) {
    state.bookingMonthOffset += offset;
    renderCalendar();
}

async function confirmBooking() {
    updateBookingSummary();

    try {
        const booking = await apiClient.post(`/experts/${state.currentExpertId}/bookings`, {
            session_type: state.bookingData.sessionType,
            duration_tier: state.bookingData.durationTier,
            starts_at: state.bookingData.startsAt,
            notes: state.bookingData.notes
        });

        localStorage.setItem('peaceflow_dashboard_refresh', '1');
        loadMyBookings();
        if (booking.payment) {
            showPaymentStep(booking.id, booking.payment);
        } else {
            document.getElementById('booking-step-4').style.display = 'none';
            document.getElementById('booking-success').style.display = 'block';
        }
    } catch (error) {
        console.error('Booking failed:', error);
        showToast(error.message || 'Không đặt được lịch tư vấn.', 'error');
    }
}

function filterExperts(criteria, button) {
    state.currentFilter = criteria;
    if (button) {
        document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
    } else {
        document.querySelectorAll('.filter-btn').forEach((item) => {
            const active = item.getAttribute('onclick')?.includes(`'${criteria}'`);
            item.classList.toggle('active', Boolean(active));
        });
    }
    applyFilters();
}

function searchExperts(query) {
    state.search = query || '';
    applyFilters();
}

function sortExperts(method) {
    state.currentSort = method || 'rating';
    applyFilters();
}

function closeBookingIfOutside(event) {
    if (event.target.id === 'bookingModalOverlay') closeBookingModal();
}

function closeProfileIfOutside(event) {
    if (event.target.id === 'profileModalOverlay') closeProfileModal();
}

async function loadSidebarProgress() {
    try {
        const [user, progress] = await Promise.all([
            apiClient.get('/me'),
            apiClient.get('/progress')
        ]);

        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-profile-updated'));

        document.querySelectorAll('.user-name').forEach((element) => {
            element.textContent = user.display_name || user.full_name || 'Người dùng';
        });
        document.querySelectorAll('.user-level').forEach((element) => {
            element.textContent = `⭐ ${progress?.total_xp || 0} XP · Level ${progress?.current_level || 1}`;
        });
    } catch (error) {
        console.error('Sidebar progress load failed:', error);
    }
}

async function init() {
    try {
        const payload = await apiClient.get('/experts');
        state.experts = payload.experts || [];
        state.summary = payload.summary || {};
        state.aiMatch = payload.ai_match || null;
        state.upcomingBooking = payload.upcoming_booking || null;

        renderSummary();
        applyFilters();
        loadMyBookings();
        loadWallet();
        await loadSidebarProgress();
    } catch (error) {
        console.error('Experts init failed:', error);
        if (refs.grid) {
            refs.grid.innerHTML = `
                <div class="paper-card" style="padding:24px;text-align:center;color:var(--text-secondary);grid-column:1 / -1;">
                    Không tải được danh sách chuyên gia từ máy chủ.
                </div>
            `;
        }
        showToast('Không tải được dữ liệu chuyên gia.', 'error');
    }
}

function isUpcomingBooking(b) {
    return ['pending_payment', 'pending', 'awaiting_expert', 'confirmed'].includes(b.status) && new Date(b.starts_at).getTime() >= Date.now();
}

async function loadMyBookings() {
    if (!refs.myBookingsSection || !refs.myBookingsList) return;
    let bookings = [];
    try {
        bookings = await apiClient.get('/expert-bookings', { noCache: true });
    } catch (_error) {
        bookings = [];
    }
    if (!Array.isArray(bookings) || !bookings.length) {
        refs.myBookingsSection.style.display = 'none';
        return;
    }
    myBookingsState.items = bookings;
    myBookingsState.tab = bookings.some(isUpcomingBooking) ? 'upcoming' : 'all';
    refs.myBookingsSection.style.display = 'block';
    renderMyBookings();
}

function mbTabBtn(key, label, active) {
    return `<button type="button" data-mb-tab="${key}"
        style="padding:7px 14px;border-radius:999px;border:1.5px solid ${active ? 'var(--mint-dark,#7bbf95)' : 'var(--kraft-light,#e8ddd0)'};background:${active ? 'var(--mint-light,#c5e8d2)' : 'transparent'};font:inherit;font-weight:700;font-size:0.82rem;cursor:pointer;color:var(--text-primary,#4a3728);">${label}</button>`;
}

function renderMyBookings() {
    if (!refs.myBookingsList) return;
    const items = myBookingsState.items;
    const upcoming = items.filter(isUpcomingBooking);
    const list = myBookingsState.tab === 'upcoming' ? upcoming : items;

    refs.myBookingsList.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:12px;">
            ${mbTabBtn('upcoming', `Sắp tới (${upcoming.length})`, myBookingsState.tab === 'upcoming')}
            ${mbTabBtn('all', `Tất cả (${items.length})`, myBookingsState.tab === 'all')}
        </div>
        <div style="max-height:360px;overflow-y:auto;">
            ${list.length
                ? list.map(renderMyBookingCard).join('')
                : '<div style="padding:16px 2px;color:var(--text-secondary,#8b7355);font-size:0.88rem;">Không có lịch trong mục này.</div>'}
        </div>
    `;

    refs.myBookingsList.querySelectorAll('[data-mb-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            myBookingsState.tab = btn.getAttribute('data-mb-tab') || 'upcoming';
            renderMyBookings();
        });
    });
    refs.myBookingsList.querySelectorAll('[data-review-id]').forEach((btn) => {
        btn.addEventListener('click', () => openReviewModal(
            btn.getAttribute('data-review-id'),
            btn.getAttribute('data-review-expert')
        ));
    });
    refs.myBookingsList.querySelectorAll('[data-pay-id]').forEach((btn) => {
        btn.addEventListener('click', () => reopenPayment(btn.getAttribute('data-pay-id')));
    });
    refs.myBookingsList.querySelectorAll('[data-cancel-id]').forEach((btn) => {
        btn.addEventListener('click', () => cancelMyBooking(btn.getAttribute('data-cancel-id')));
    });
}

function renderMyBookingCard(b) {
    const badge = BOOKING_STATUS_BADGE[b.status] || BOOKING_STATUS_BADGE.pending;
    const typeLabel = SESSION_CONFIG[b.session_type]?.label || b.session_type;
    let action = '';
    if (b.status === 'completed') {
        action = b.review_rating
            ? `<div style="color:#f5a623;font-weight:800;white-space:nowrap;">${'★'.repeat(b.review_rating)}</div>`
            : `<button class="btn-primary" style="padding:6px 14px;font-size:0.82rem;" data-review-id="${b.id}" data-review-expert="${escapeHtml(b.expert_name || '')}">Đánh giá</button>`;
    } else if (b.status === 'pending_payment') {
        action = `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <button class="btn-primary" style="padding:6px 12px;font-size:0.8rem;" data-pay-id="${b.id}">Thanh toán</button>
            <button class="btn-outline" style="padding:6px 12px;font-size:0.8rem;" data-cancel-id="${b.id}">Huỷ</button>
        </div>`;
    } else if (['pending', 'awaiting_expert', 'confirmed'].includes(b.status)) {
        action = `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
            ${b.status === 'confirmed' && b.zoom_join_url ? `<a href="${escapeHtml(b.zoom_join_url)}" target="_blank" rel="noopener" class="btn-primary" style="padding:6px 12px;font-size:0.8rem;text-decoration:none;">🎥 Vào Zoom</a>` : ''}
            <button class="btn-outline" style="padding:6px 12px;font-size:0.8rem;" data-cancel-id="${b.id}">Huỷ</button>
        </div>`;
    }
    return `
        <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--kraft-light,#e8ddd0);">
            <div style="font-size:1.6rem;flex:0 0 auto;">${escapeHtml(b.expert_avatar || '👩‍⚕️')}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;">${escapeHtml(b.expert_name || 'Chuyên gia')}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary,#8b7355);">${escapeHtml(typeLabel)} · ${formatDateTime(b.starts_at)} · ${b.duration_minutes} phút</div>
            </div>
            <span style="padding:4px 10px;border-radius:999px;font-size:0.72rem;font-weight:800;color:${badge.color};background:${badge.bg};white-space:nowrap;">${badge.label}</span>
            <div style="flex:0 0 auto;">${action}</div>
        </div>
    `;
}

function openReviewModal(bookingId, expertName) {
    reviewState = { bookingId, rating: 5 };
    if (refs.reviewExpertName) refs.reviewExpertName.textContent = expertName ? `Buổi tư vấn với ${expertName}` : '';
    if (refs.reviewComment) refs.reviewComment.value = '';
    renderReviewStars();
    refs.reviewOverlay?.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function renderReviewStars() {
    if (!refs.reviewStars) return;
    refs.reviewStars.innerHTML = [1, 2, 3, 4, 5].map((n) => `
        <button type="button" data-star="${n}" style="background:none;border:none;cursor:pointer;font-size:2rem;line-height:1;padding:0;color:${n <= reviewState.rating ? '#f5a623' : '#d8cfc2'};">★</button>
    `).join('');
    refs.reviewStars.querySelectorAll('[data-star]').forEach((btn) => {
        btn.addEventListener('click', () => {
            reviewState.rating = Number(btn.getAttribute('data-star'));
            renderReviewStars();
        });
    });
}

function closeReviewModal() {
    refs.reviewOverlay?.classList.remove('show');
    document.body.style.overflow = '';
}

function closeReviewIfOutside(event) {
    if (event.target.id === 'reviewModalOverlay') closeReviewModal();
}

async function submitReview() {
    if (!reviewState.bookingId) return;
    try {
        await apiClient.post(`/expert-bookings/${reviewState.bookingId}/review`, {
            rating: reviewState.rating,
            comment: refs.reviewComment?.value?.trim() || ''
        });
        closeReviewModal();
        showToast('Cảm ơn bạn đã đánh giá!');
        loadMyBookings();
    } catch (error) {
        showToast(error.message || 'Không gửi được đánh giá.', 'error');
    }
}

window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.closeReviewIfOutside = closeReviewIfOutside;
window.submitReview = submitReview;
window.renderExperts = renderExperts;
window.filterExperts = filterExperts;
window.searchExperts = searchExperts;
window.sortExperts = sortExperts;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.goBookingStep = goBookingStep;
window.selectSessionType = selectSessionType;
window.selectDurationTier = selectDurationTier;
window.selectBookingDate = selectBookingDate;
window.selectBookingTime = selectBookingTime;
window.changeMonth = changeMonth;
window.confirmBooking = confirmBooking;
window.closeBookingIfOutside = closeBookingIfOutside;
window.closeProfileIfOutside = closeProfileIfOutside;
window.loadData = loadSidebarProgress;

if (!window.__myBookingsRealtimeBound) {
    window.__myBookingsRealtimeBound = true;
    window.addEventListener('peaceflow:booking-changed', () => {
        if (document.getElementById('myBookingsList')) loadMyBookings();
        loadWallet();
    });
}

function boot() {
    init();
}

let _justBooted = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _justBooted = true; boot(); });
} else {
    _justBooted = true;
    boot();
}

window.addEventListener('peaceflow:route-mounted', (event) => {
    if ((event.detail?.page || '').split('?')[0] !== 'experts.html') return;
    if (_justBooted) { _justBooted = false; return; }
    boot();
});
