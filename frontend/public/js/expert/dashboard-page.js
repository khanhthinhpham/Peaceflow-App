import { apiClient } from '../api-client.js';
import { mountExpertShell, requireExpertUser, showExpertBanner, loadExpertData, setExpertNavLock } from './shell.js';
import { escapeHtml, formatCurrency, formatDateTime } from './utils.js';

const SESSION_TYPE_LABELS = {
    chat: 'Chat',
    voice: 'Gọi thoại',
    video: 'Video',
    inperson: 'Trực tiếp'
};

const BOOKING_STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Sắp tới',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
};

const BOOKING_TABS = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'upcoming', label: 'Sắp tới' },
    { key: 'completed', label: 'Đã hoàn thành' }
];

const ACTIVITY_STATUS_LABELS = { online: 'Online', busy: 'Bận', offline: 'Offline' };

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const AVAILABILITY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const AVAILABILITY_DAY_LABELS = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
const AVAILABILITY_START_HOUR = 8;
const AVAILABILITY_END_HOUR = 21;
const AVAILABILITY_SLOT_MINUTES = 60;

let availabilityState = { active: new Set() };
let bookingState = { items: [], activeTab: 'today' };

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'dashboard',
        title: 'Bảng điều khiển chuyên gia',
        subtitle: 'Theo dõi trạng thái hồ sơ, lịch hẹn sắp tới và các tín hiệu vận hành quan trọng trong một nơi riêng cho chuyên gia.',
        badgeText: 'Expert overview'
    });

    try {
        const { application: applicationState, overview } = await loadExpertData();

        // Cổng duyệt: chỉ chuyên gia ĐÃ ĐƯỢC DUYỆT (có profile) mới vào được dashboard chính.
        // Chưa duyệt thì đưa về trang nộp hồ sơ / theo dõi xét duyệt.
        if (!overview?.expert) {
            // Chưa được duyệt → màn nộp hồ sơ riêng (ngoài khu expert, không sidebar).
            window.location.replace('apply.html');
            return;
        }

        setExpertNavLock(false);
        renderDashboard(applicationState, overview);
        setupExpertOperations(overview);
    } catch (error) {
        console.error('Expert dashboard load failed:', error);
        showExpertBanner('Không thể tải dữ liệu chuyên gia lúc này.', 'error');
    }
}

function renderDashboard(applicationState, overview) {
    const appStatus = applicationState?.application?.status || 'draft';
    const profile = overview?.expert;

    // Lời chào gọn ở tiêu đề thay cho hero to.
    const titleEl = document.getElementById('expertPageTitle');
    if (titleEl) {
        const name = profile?.full_name || 'chuyên gia';
        titleEl.textContent = `Xin chào, ${name} 👋`;
    }
    const subtitleEl = document.getElementById('expertPageSubtitle');
    if (subtitleEl) subtitleEl.textContent = '';

    // Chỉ hiện banner khi có việc cần làm (ẩn lời chúc mừng "đã duyệt").
    if (!applicationState?.email_verified) {
        showExpertBanner('Bạn cần xác minh email trước khi tiếp tục dùng khu vực chuyên gia.', 'info');
    } else if (appStatus === 'pending') {
        showExpertBanner('Hồ sơ của bạn đang chờ admin duyệt.', 'info');
    } else if (appStatus === 'rejected') {
        showExpertBanner('Hồ sơ gần nhất chưa được duyệt. Bạn có thể cập nhật và gửi lại trong mục Hồ sơ chuyên gia.', 'error');
    } else if (!profile) {
        showExpertBanner('Bạn chưa gửi hồ sơ chuyên gia. Hãy hoàn tất hồ sơ để mở quyền chuyên gia đầy đủ.', 'info');
    } else {
        showExpertBanner('', 'info');
    }

    const ratingText = Number(profile?.rating) > 0 ? Number(profile.rating).toFixed(1) : '—';
    const priceText = profile && Number(profile.base_price) > 0 ? formatCurrency(profile.base_price) : 'Chưa đặt giá';

    document.getElementById('expertProfile').innerHTML = profile
        ? `
            <div class="expert-profile-chips">
                <span class="expert-pchip is-accent">⭐ ${ratingText}</span>
                <span class="expert-pchip">🎓 ${escapeHtml(profile.degree || '—')}</span>
                <span class="expert-pchip">💼 ${profile.experience_years || 0} năm</span>
                <span class="expert-pchip">📍 ${escapeHtml(profile.location || 'Chưa cập nhật')}</span>
                <span class="expert-pchip">💵 ${priceText}</span>
            </div>
            <div class="expert-tag-row">
                ${(profile.specialties || []).map((item) => `<span class="expert-chip">${escapeHtml(item)}</span>`).join('') || '<span class="expert-chip">Chưa có chuyên môn</span>'}
            </div>
        `
        : `
            <div class="expert-empty">
                <h3>Hồ sơ chuyên gia chưa được tạo</h3>
                <p>Gửi hồ sơ chuyên gia để hệ thống khởi tạo profile, lịch hẹn và các chỉ số vận hành.</p>
                <a class="btn-primary" href="application.html">Mở hồ sơ chuyên gia</a>
            </div>
        `;
}

function labelForStatus(status) {
    switch (status) {
        case 'approved': return 'Đã duyệt';
        case 'pending': return 'Chờ duyệt';
        case 'rejected': return 'Cần bổ sung';
        default: return 'Chưa gửi hồ sơ';
    }
}

function setupExpertOperations(overview) {
    const hasProfile = Boolean(overview?.expert);
    const toggle = document.getElementById('expertStatusToggle');
    const kpiRow = document.getElementById('expertKpis');
    const bookingsSection = document.getElementById('expertBookings')?.closest('section');
    const pendingSection = document.getElementById('expertPending')?.closest('section');
    const availabilitySection = document.getElementById('expertAvailabilitySection');
    const earningsSection = document.getElementById('expertEarnings')?.closest('section');

    if (!hasProfile) {
        [toggle, kpiRow, bookingsSection, pendingSection, availabilitySection, earningsSection].forEach((node) => {
            if (node) node.style.display = 'none';
        });
        return;
    }

    renderStatusToggle(overview.expert.status || 'offline');
    loadBookingManagement();
    loadAvailabilityEditor();
    loadEarnings();
}

async function loadEarnings() {
    const el = document.getElementById('expertEarnings');
    if (!el) return;
    let data = null;
    try {
        data = await apiClient.get('/expert-portal/earnings', { noCache: true });
    } catch (_error) {
        el.innerHTML = '<p style="color:var(--text-secondary);">Không tải được doanh thu.</p>';
        return;
    }
    const rows = (data.recent || []).slice(0, 8).map((r) => `
        <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed var(--kraft-light);font-size:0.85rem;">
            <span style="color:var(--text-secondary);">${escapeHtml(r.client_name || 'Thân chủ')} · ${formatDateTime(r.created_at)}</span>
            <strong style="color:var(--mint-dark);white-space:nowrap;">+${formatCurrency(r.expert_earning)}</strong>
        </div>
    `).join('') || '<p style="color:var(--text-secondary);font-size:0.85rem; margin:20px 30px;">Chưa có doanh thu.</p>';
    el.innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:20px;">
            <div style="flex:1;min-width:120px;background:var(--mint-light);border:1.5px solid var(--mint);border-radius:14px;padding:12px 14px;">
                <div style="font-size:0.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mint-dark);">Số dư khả dụng</div>
                <div style="font-size:1.4rem;font-weight:800;color:var(--mint-dark);">${formatCurrency(data.balance)}</div>
            </div>
            <div style="flex:1;min-width:120px;background:var(--warm-white);border:1.5px solid var(--kraft-light);border-radius:14px;padding:12px 14px;">
                <div style="font-size:0.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);">Tổng đã nhận</div>
                <div style="font-size:1.4rem;font-weight:800;">${formatCurrency(data.total_earned)}</div>
            </div>
        </div>
        ${data.pending ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">⏳ Chờ hoàn thành buổi: ${formatCurrency(data.pending)}</div>` : ''}
        <div>${rows}</div>
    `;
}

function renderStatusToggle(currentStatus) {
    const el = document.getElementById('expertStatusToggle');
    if (!el) return;

    const statuses = [
        { key: 'online', label: 'Online', hint: 'Sẵn sàng nhận lịch', color: '#12b981' },
        { key: 'busy', label: 'Bận', hint: 'Tạm không nhận lịch mới', color: '#f59e0b' },
        { key: 'offline', label: 'Offline', hint: 'Không hoạt động', color: '#a8acbb' }
    ];
    const current = statuses.find((status) => status.key === currentStatus) || statuses[2];

    el.innerHTML = `
        <div style="position:relative;">
            <button
                type="button"
                id="expertStatusTrigger"
                aria-expanded="false"
                style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border-radius:999px;border:1px solid rgba(242,176,76,.45);background:rgba(255,248,238,.96);color:#bf6f00;font:inherit;font-weight:800;cursor:pointer;min-width:132px;justify-content:center;"
            >
                <span style="width:12px;height:12px;border-radius:50%;display:inline-block;background:${current.color};"></span>
                <span>${current.label}</span>
                <span style="font-size:.8rem;">∨</span>
            </button>
            <div
                id="expertStatusMenu"
                hidden
                style="position:absolute;top:calc(100% + 12px);right:0;width:290px;border-radius:22px;background:rgba(255,252,247,.98);border:1px solid rgba(62,52,40,.12);box-shadow:0 24px 42px rgba(62,52,40,.14);overflow:hidden;z-index:30;"
            >
                <div style="padding:18px 18px 12px;font-weight:800;color:var(--expert-muted);border-bottom:1px solid rgba(62,52,40,.08);">Trạng thái hoạt động</div>
                ${statuses.map((status) => `
                    <button
                        type="button"
                        data-status="${status.key}"
                        style="width:100%;display:flex;align-items:flex-start;gap:14px;padding:16px 18px;border:0;border-top:1px solid rgba(62,52,40,.06);background:${status.key === currentStatus ? 'rgba(111,143,114,.14)' : 'transparent'};text-align:left;cursor:pointer;font:inherit;color:var(--expert-ink);"
                    >
                        <span style="width:12px;height:12px;border-radius:50%;display:inline-block;flex:0 0 auto;margin-top:5px;background:${status.color};"></span>
                        <span style="display:flex;flex-direction:column;gap:4px;">
                            <strong>${status.label}</strong>
                            <small style="color:var(--expert-muted);font-size:.95rem;">${status.hint}</small>
                        </span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    const trigger = el.querySelector('#expertStatusTrigger');
    const menu = el.querySelector('#expertStatusMenu');
    const closeMenu = () => {
        if (!menu || !trigger) return;
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
    };

    trigger?.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!menu || !trigger) return;
        const opening = menu.hidden;
        menu.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
    });

    menu?.querySelectorAll('[data-status]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const status = btn.getAttribute('data-status');
            try {
                await apiClient.patch('/expert-portal/status', { status });
                renderStatusToggle(status);
                showExpertBanner('Đã cập nhật trạng thái hoạt động.', 'success');
            } catch (error) {
                showExpertBanner(error.message || 'Không thể cập nhật trạng thái.', 'error');
            }
        });
    });

    setTimeout(() => {
        const handler = (event) => {
            if (!el.contains(event.target)) {
                closeMenu();
                document.removeEventListener('click', handler);
            }
        };
        document.addEventListener('click', handler);
    }, 0);
}

async function loadBookingManagement() {
    const el = document.getElementById('expertBookings');
    if (!el) return;
    el.innerHTML = '<p style="color:var(--text-secondary);">Đang tải lịch hẹn...</p>';

    try {
        const bookings = await apiClient.get('/expert-portal/bookings', { noCache: true });
        bookingState.items = Array.isArray(bookings) ? bookings : [];
    } catch (_error) {
        bookingState.items = [];
        el.innerHTML = '<p style="color:var(--text-secondary);">Không tải được danh sách lịch hẹn.</p>';
    }
    renderKpis();
    renderBookings();
    renderPending();
}

function bookingsForTab(items, tab) {
    if (tab === 'completed') return items.filter((b) => b.status === 'completed');
    if (tab === 'upcoming') return items.filter((b) => b.status === 'confirmed' && !isToday(b.starts_at));
    // today
    return items.filter((b) => b.status === 'confirmed' && isToday(b.starts_at));
}

function renderKpis() {
    const el = document.getElementById('expertKpis');
    if (!el) return;
    const items = bookingState.items;

    const todayCount = items.filter((b) => b.status === 'confirmed' && isToday(b.starts_at)).length;
    const pendingCount = items.filter((b) => b.status === 'awaiting_expert').length;
    const weekIncome = items
        .filter((b) => b.status === 'completed' && isThisWeek(b.starts_at))
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    const cards = [
        { icon: '🗓️', label: 'Hôm nay', value: `${todayCount} buổi`, hint: todayCount ? 'Đã xác nhận' : 'Chưa có lịch', tone: 'today' },
        { icon: '⏳', label: 'Chờ bạn nhận', value: String(pendingCount), hint: pendingCount ? 'Đã thanh toán' : 'Không có', tone: pendingCount ? 'alert' : 'today' },
        { icon: '💰', label: 'Thu nhập tuần', value: formatCurrency(weekIncome), hint: 'Từ buổi đã hoàn thành', tone: 'income' }
    ];

    el.innerHTML = cards.map((card) => `
        <article class="expert-kpi-card is-${card.tone}">
            <span class="expert-kpi-icon">${card.icon}</span>
            <div class="expert-kpi-copy">
                <span class="expert-kpi-label">${card.label}</span>
                <span class="expert-kpi-value">${card.value}</span>
                <span class="expert-kpi-hint">${card.hint}</span>
            </div>
        </article>
    `).join('');
}

function renderBookings() {
    const el = document.getElementById('expertBookings');
    if (!el) return;

    const items = bookingState.items;
    const counts = {
        today: bookingsForTab(items, 'today').length,
        upcoming: bookingsForTab(items, 'upcoming').length,
        completed: bookingsForTab(items, 'completed').length
    };
    if (!BOOKING_TABS.some((tab) => tab.key === bookingState.activeTab)) bookingState.activeTab = 'today';
    const filtered = bookingsForTab(items, bookingState.activeTab);

    el.innerHTML = `
        <div class="expert-booking-toolbar">
            <div class="expert-booking-tabs">
                ${BOOKING_TABS.map((tab) => `
                    <button type="button" class="expert-booking-tab ${tab.key === bookingState.activeTab ? 'is-active' : ''}" data-booking-tab="${tab.key}">
                        <span>${tab.label}</span>
                        <span class="expert-booking-tab-count">${counts[tab.key] || 0}</span>
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="expert-booking-body">
            ${filtered.length ? renderBookingList(filtered) : renderBookingEmpty(bookingState.activeTab)}
        </div>
    `;

    el.querySelectorAll('[data-booking-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            bookingState.activeTab = button.getAttribute('data-booking-tab') || 'today';
            renderBookings();
        });
    });

    el.querySelectorAll('[data-booking-action]').forEach((button) => {
        button.addEventListener('click', () => updateBooking(
            button.getAttribute('data-booking-id'),
            button.getAttribute('data-booking-action')
        ));
    });
}

function renderPending() {
    const el = document.getElementById('expertPending');
    const badge = document.getElementById('expertPendingBadge');
    if (!el) return;
    const pending = bookingState.items.filter((b) => b.status === 'awaiting_expert');
    if (badge) {
        badge.textContent = String(pending.length);
        badge.classList.toggle('is-alert', pending.length > 0);
    }

    if (!pending.length) {
        el.innerHTML = '<p class="expert-pending-empty">Không có lịch nào chờ bạn nhận. Lịch đã thanh toán sẽ xuất hiện ở đây.</p>';
        return;
    }

    const cards = pending.map((booking) => `
        <article class="expert-pending-card">
            <strong>${escapeHtml(booking.client_name || 'Thân chủ')}</strong>
            <div class="expert-pending-meta">${escapeHtml(SESSION_TYPE_LABELS[booking.session_type] || booking.session_type)} · ${formatDateTime(booking.starts_at)} · ${booking.duration_minutes} phút</div>
            ${booking.notes
                ? `<div class="expert-pending-note">${escapeHtml(booking.notes)}</div>`
                : '<div class="expert-pending-note is-empty">Thân chủ chưa để lại mô tả tình trạng.</div>'}
            <div class="expert-booking-actions">
                ${bookingActionBtn(booking.id, 'confirmed', 'Nhận lịch', 'primary')}
                ${bookingActionBtn(booking.id, 'cancelled', 'Từ chối', 'ghost')}
            </div>
        </article>
    `).join('');
    el.innerHTML = `<div style="max-height:520px;overflow-y:auto;">${cards}</div>`;

    el.querySelectorAll('[data-booking-action]').forEach((button) => {
        button.addEventListener('click', () => updateBooking(
            button.getAttribute('data-booking-id'),
            button.getAttribute('data-booking-action')
        ));
    });
}

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function isToday(value) {
    if (!value) return false;
    const d = new Date(value);
    const today = startOfToday();
    const tomorrow = new Date(today.getTime() + 86400000);
    return d >= today && d < tomorrow;
}

function isThisWeek(value) {
    if (!value) return false;
    const d = new Date(value);
    const today = startOfToday();
    const weekday = (today.getDay() + 6) % 7; // Thứ 2 = 0
    const monday = new Date(today.getTime() - weekday * 86400000);
    const nextMonday = new Date(monday.getTime() + 7 * 86400000);
    return d >= monday && d < nextMonday;
}

function renderBookingList(bookings) {
    return bookings.map((booking) => renderBookingRow(booking)).join('');
}

function renderBookingRow(booking) {
    const actions = [];
    if (booking.status === 'pending') {
        actions.push(bookingActionBtn(booking.id, 'confirmed', 'Xác nhận', 'primary'));
        actions.push(bookingActionBtn(booking.id, 'cancelled', 'Từ chối', 'ghost'));
    } else if (booking.status === 'confirmed') {
        actions.push(bookingActionBtn(booking.id, 'completed', 'Hoàn thành', 'primary'));
        actions.push(bookingActionBtn(booking.id, 'cancelled', 'Hủy', 'ghost'));
    }

    const reviewLine = booking.review_rating ? `<div class="expert-booking-extra">Đánh giá: ${booking.review_rating}/5</div>` : '';
    const notesLine = booking.notes ? `<div class="expert-booking-notes">${escapeHtml(booking.notes)}</div>` : '';

    return `
        <article class="expert-booking-card">
            <div class="expert-booking-card-head">
                <div>
                    <strong>${escapeHtml(booking.client_name || 'Thân chủ')}</strong>
                    <div class="expert-booking-meta">
                        ${escapeHtml(SESSION_TYPE_LABELS[booking.session_type] || booking.session_type)} ·
                        ${formatDateTime(booking.starts_at)} · ${booking.duration_minutes} phút · ${formatCurrency(booking.price)}
                    </div>
                    ${notesLine}
                    ${reviewLine}
                </div>
                <span class="expert-booking-status-chip">${escapeHtml(BOOKING_STATUS_LABELS[booking.status] || booking.status)}</span>
            </div>
            ${actions.length ? `<div class="expert-booking-actions">${actions.join('')}</div>` : ''}
        </article>
    `;
}

function bookingActionBtn(id, status, label, variant) {
    return `
        <button type="button" class="expert-booking-action ${variant === 'primary' ? 'is-primary' : ''}" data-booking-action="${status}" data-booking-id="${id}">
            ${label}
        </button>
    `;
}

function renderBookingEmpty(tabKey) {
    const map = {
        today: { title: 'Hôm nay chưa có lịch', text: 'Các buổi đã xác nhận diễn ra trong hôm nay sẽ hiển thị tại đây.' },
        upcoming: { title: 'Chưa có lịch sắp tới', text: 'Các buổi đã xác nhận cho những ngày tới sẽ hiển thị tại đây.' },
        completed: { title: 'Chưa có phiên hoàn thành', text: 'Các buổi tư vấn đã kết thúc sẽ được lưu trữ tại đây kèm ghi chú và đánh giá từ thân chủ.' }
    };
    const state = map[tabKey] || map.today;

    return `
        <div class="expert-booking-empty">
            <div class="expert-booking-empty-icon" aria-hidden="true">📅</div>
            <h3>${state.title}</h3>
            <p>${state.text}</p>
            <p class="expert-booking-empty-note">Bạn sẽ nhận được thông báo khi có lịch hẹn mới.</p>
        </div>
    `;
}

async function updateBooking(id, status) {
    try {
        await apiClient.patch(`/expert-portal/bookings/${id}`, { status });
        showExpertBanner('Đã cập nhật lịch hẹn.', 'success');
        loadBookingManagement();
    } catch (error) {
        showExpertBanner(error.message || 'Không thể cập nhật lịch hẹn.', 'error');
    }
}

async function loadAvailabilityEditor() {
    try {
        const slots = await apiClient.get('/expert-portal/availability', { noCache: true });
        availabilityState = buildAvailabilityState(Array.isArray(slots) ? slots : []);
    } catch (_error) {
        availabilityState = buildAvailabilityState([]);
    }
    renderAvailabilityEditor();
}

function buildAvailabilityState(slots) {
    const allCells = getAvailabilityCells();
    const active = new Set();

    if (Array.isArray(slots) && slots.length > 0) {
        slots.forEach((slot) => {
            const weekday = Number(slot.weekday);
            const start = timeToMinutes(slot.start_time);
            const end = timeToMinutes(slot.end_time);
            allCells.forEach((cell) => {
                if (cell.weekday !== weekday) return;
                if (cell.startMinutes >= start && cell.endMinutes <= end) active.add(cell.key);
            });
        });
    }

    return { active };
}

function renderAvailabilityEditor() {
    const el = document.getElementById('expertAvailability');
    if (!el) return;
    const totalCells = getAvailabilityCells().length;
    const busyCells = availabilityState.active.size;
    const freeCells = Math.max(0, totalCells - busyCells);

    el.innerHTML = `
        <div class="expert-availability-toolbar compact">
            <div class="expert-availability-legend">
                <span class="expert-availability-legend-item"><span class="legend-swatch is-free"></span> ${freeCells} giờ rảnh</span>
                <span class="expert-availability-legend-item"><span class="legend-swatch is-busy"></span> ${busyCells} giờ bận</span>
            </div>
        </div>
        <div class="expert-availability-matrix">
            <div class="expert-availability-heads">
                <div class="availability-time-spacer"></div>
                <div class="availability-head-cells">
                    ${AVAILABILITY_DAY_ORDER.map((day) => `<div class="availability-day-head compact">${AVAILABILITY_DAY_LABELS[day]}</div>`).join('')}
                </div>
            </div>
            <div class="expert-availability-rows">
                ${buildAvailabilityRows().join('')}
            </div>
        </div>
        <div class="expert-availability-note">Bấm vào ô để đánh dấu giờ <strong>bận</strong>. Mỗi ô là 1 giờ; ô để trống nghĩa là bạn rảnh và thân chủ có thể đặt lịch.</div>
        <div class="expert-availability-footer">
            <button type="button" id="availSave" class="btn-primary">Lưu lịch</button>
        </div>
    `;

    el.querySelector('#availSave')?.addEventListener('click', saveAvailability);
    el.querySelectorAll('[data-avail-cell]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-avail-cell');
            if (!key) return;
            if (availabilityState.active.has(key)) availabilityState.active.delete(key);
            else availabilityState.active.add(key);
            renderAvailabilityEditor();
        });
    });
}

async function saveAvailability() {
    try {
        await apiClient.put('/expert-portal/availability', { slots: buildAvailabilityPayload() });
        showExpertBanner('Đã lưu lịch làm việc.', 'success');
        loadAvailabilityEditor();
    } catch (error) {
        showExpertBanner(error.message || 'Không thể lưu lịch rảnh.', 'error');
    }
}

function buildAvailabilityRows() {
    return getHourLabels().map((label, rowIndex) => {
        const startMinutes = (AVAILABILITY_START_HOUR * 60) + (rowIndex * AVAILABILITY_SLOT_MINUTES);
        const cells = [];

        for (const weekday of AVAILABILITY_DAY_ORDER) {
            const key = availabilityCellKey(weekday, startMinutes);
            const busy = availabilityState.active.has(key);
            cells.push(`
                <button type="button" class="availability-cell ${busy ? 'is-busy' : 'is-free'}" data-avail-cell="${key}" aria-pressed="${busy ? 'true' : 'false'}" title="${WEEKDAYS[weekday]} ${label}: ${busy ? 'Bận' : 'Rảnh'}">
                    <span></span>
                </button>
            `);
        }

        return `
            <div class="availability-row">
                <div class="availability-time-head">${minutesToTime(startMinutes)}</div>
                <div class="availability-row-cells">${cells.join('')}</div>
            </div>
        `;
    });
}

function buildAvailabilityPayload() {
    const activeCells = getAvailabilityCells()
        .filter((cell) => availabilityState.active.has(cell.key))
        .sort((a, b) => (a.weekday - b.weekday) || (a.startMinutes - b.startMinutes));

    const merged = [];
    activeCells.forEach((cell) => {
        const last = merged[merged.length - 1];
        if (last && last.weekday === cell.weekday && last.endMinutes === cell.startMinutes) {
            last.endMinutes = cell.endMinutes;
            return;
        }
        merged.push({ weekday: cell.weekday, startMinutes: cell.startMinutes, endMinutes: cell.endMinutes });
    });

    return merged.map((slot) => ({
        weekday: slot.weekday,
        start_time: minutesToTime(slot.startMinutes),
        end_time: minutesToTime(slot.endMinutes)
    }));
}

function getAvailabilityCells() {
    const cells = [];
    for (let weekday = 0; weekday < WEEKDAYS.length; weekday += 1) {
        for (let startMinutes = AVAILABILITY_START_HOUR * 60; startMinutes < AVAILABILITY_END_HOUR * 60; startMinutes += AVAILABILITY_SLOT_MINUTES) {
            cells.push({
                weekday,
                startMinutes,
                endMinutes: startMinutes + AVAILABILITY_SLOT_MINUTES,
                key: availabilityCellKey(weekday, startMinutes)
            });
        }
    }
    return cells;
}

function getHourLabels() {
    const labels = [];
    for (let startMinutes = AVAILABILITY_START_HOUR * 60; startMinutes < AVAILABILITY_END_HOUR * 60; startMinutes += AVAILABILITY_SLOT_MINUTES) {
        labels.push(`${minutesToTime(startMinutes)} - ${minutesToTime(startMinutes + AVAILABILITY_SLOT_MINUTES)}`);
    }
    return labels;
}

function availabilityCellKey(weekday, startMinutes) {
    return `${weekday}-${minutesToTime(startMinutes)}`;
}

function timeToMinutes(value) {
    const [hours, minutes] = String(value || '00:00').split(':').map((part) => Number(part) || 0);
    return (hours * 60) + minutes;
}

function minutesToTime(value) {
    const hours = String(Math.floor(value / 60)).padStart(2, '0');
    const minutes = String(value % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Tự cập nhật khi có lịch hẹn mới/đổi trạng thái (realtime) — không cần reload.
if (!window.__expertBookingRealtimeBound) {
    window.__expertBookingRealtimeBound = true;
    window.addEventListener('peaceflow:booking-changed', () => {
        if (document.getElementById('expertBookings')) loadBookingManagement();
    });
}

init();
