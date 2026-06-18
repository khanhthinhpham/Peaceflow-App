import { apiClient } from './api-client.js';

window.__expertsApiMode = true;

const SESSION_CONFIG = {
    chat: { label: 'Chat text', icon: '💬', multiplier: 0.57, duration: 30 },
    voice: { label: 'Gọi thoại', icon: '📞', multiplier: 1, duration: 45 },
    video: { label: 'Video call', icon: '📹', multiplier: 1.43, duration: 60 },
    inperson: { label: 'Gặp trực tiếp', icon: '🏥', multiplier: 2, duration: 60 }
};

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
        sessionType: 'chat',
        price: 0,
        duration: 30,
        date: '',
        time: '',
        startsAt: '',
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
    sessionTypes: document.querySelector('.session-types'),
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
    pending: { label: 'Chờ xác nhận', color: '#bf6f00', bg: 'rgba(245,180,80,.18)' },
    confirmed: { label: 'Đã xác nhận', color: '#2f8f5b', bg: 'rgba(47,143,91,.14)' },
    completed: { label: 'Đã hoàn thành', color: '#5a6b5c', bg: 'rgba(120,140,120,.16)' },
    cancelled: { label: 'Đã hủy', color: '#a23b3b', bg: 'rgba(200,80,80,.14)' }
};

let reviewState = { bookingId: null, rating: 5 };
let myBookingsState = { items: [], tab: 'upcoming' };

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

function getSessionOptions(expert) {
    const basePrice = Number(expert?.price || 0);

    return Object.entries(SESSION_CONFIG).map(([key, config]) => ({
        key,
        label: config.label,
        icon: config.icon,
        duration: config.duration,
        durationLabel: `${config.duration} phút`,
        price: Math.round(basePrice * config.multiplier),
        priceLabel: formatCurrency(Math.round(basePrice * config.multiplier))
    }));
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
                        ${escapeHtml(expert.avatar)}
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
                        <div class="ec-price">${formatCurrency(expert.price)}</div>
                        <div class="ec-price-label">Giá từ / phiên</div>
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

function renderSessionTypeOptions(expert) {
    const options = getSessionOptions(expert);
    const selectedType = state.bookingData.sessionType || 'chat';

    refs.sessionTypes.innerHTML = options.map((option) => `
        <div class="session-type-card ${option.key === selectedType ? 'selected' : ''}"
            onclick="selectSessionType(this,'${option.key}','${option.price}','${option.duration}')">
            <div class="stc-icon">${option.icon}</div>
            <div class="stc-name">${escapeHtml(option.label)}</div>
            <div class="stc-price">${escapeHtml(option.priceLabel)}</div>
            <div class="stc-duration">${escapeHtml(option.durationLabel)}</div>
        </div>
    `).join('');
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

function updateBookingSummary() {
    const expert = getExpertById(state.currentExpertId);
    const session = SESSION_CONFIG[state.bookingData.sessionType] || SESSION_CONFIG.chat;
    const startsAt = state.bookingData.date && state.bookingData.time
        ? `${state.bookingData.date}T${state.bookingData.time}:00+07:00`
        : '';
    state.bookingData.startsAt = startsAt;
    state.bookingData.notes = refs.notesTextarea?.value?.trim() || '';

    refs.bsExpert.textContent = expert?.name || '—';
    refs.bsType.textContent = session.label;
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
    const defaultOption = getSessionOptions(expert)[0];
    state.bookingMonthOffset = 0;
    state.bookingData = {
        expertId: id,
        sessionType: defaultOption.key,
        price: defaultOption.price,
        duration: defaultOption.duration,
        date: '',
        time: '10:00',
        startsAt: '',
        notes: ''
    };

    refs.bmAvatar.textContent = expert.avatar;
    refs.bmName.textContent = `Đặt lịch với ${expert.name}`;
    refs.bmDegree.textContent = expert.degree;
    refs.bsExpert.textContent = expert.name;
    if (refs.notesTextarea) refs.notesTextarea.value = '';
    renderSessionTypeOptions(expert);
    renderCalendar();
    renderTimeSlots();
    goBookingStep(1);
    refs.bookingOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    refs.bookingOverlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => {
        document.getElementById('booking-success').style.display = 'none';
        document.getElementById('booking-step-1').style.display = 'block';
        document.querySelectorAll('.bm-step').forEach((step, index) => {
            step.classList.toggle('active', index === 0);
        });
    }, 200);
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

function selectSessionType(element, type, price, duration) {
    document.querySelectorAll('.session-type-card').forEach((card) => card.classList.remove('selected'));
    element.classList.add('selected');
    state.bookingData.sessionType = type;
    state.bookingData.price = Number(price || 0);
    state.bookingData.duration = Number(duration || 30);
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
            starts_at: state.bookingData.startsAt,
            duration_minutes: state.bookingData.duration,
            price: state.bookingData.price,
            notes: state.bookingData.notes
        });

        document.getElementById('booking-step-4').style.display = 'none';
        document.getElementById('booking-success').style.display = 'block';
        refs.successDatetime.textContent = formatDateTime(booking.starts_at);
        refs.successExpert.textContent = booking.expert_name;
        refs.successType.textContent = SESSION_CONFIG[booking.session_type]?.label || booking.session_type;
        state.upcomingBooking = booking;
        localStorage.setItem('peaceflow_dashboard_refresh', '1');
        renderSummary();
        loadMyBookings();
        showToast('Đã gửi yêu cầu đặt lịch — chờ chuyên gia xác nhận.');
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
    return ['pending', 'confirmed'].includes(b.status) && new Date(b.starts_at).getTime() >= Date.now();
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
}

function renderMyBookingCard(b) {
    const badge = BOOKING_STATUS_BADGE[b.status] || BOOKING_STATUS_BADGE.pending;
    const typeLabel = SESSION_CONFIG[b.session_type]?.label || b.session_type;
    let action = '';
    if (b.status === 'completed') {
        action = b.review_rating
            ? `<div style="color:#f5a623;font-weight:800;white-space:nowrap;">${'★'.repeat(b.review_rating)}</div>`
            : `<button class="btn-primary" style="padding:6px 14px;font-size:0.82rem;" data-review-id="${b.id}" data-review-expert="${escapeHtml(b.expert_name || '')}">Đánh giá</button>`;
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
window.selectBookingDate = selectBookingDate;
window.selectBookingTime = selectBookingTime;
window.changeMonth = changeMonth;
window.confirmBooking = confirmBooking;
window.closeBookingIfOutside = closeBookingIfOutside;
window.closeProfileIfOutside = closeProfileIfOutside;
window.loadData = loadSidebarProgress;

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
