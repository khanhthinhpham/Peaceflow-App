import { apiClient } from '../api-client.js';
import { mountExpertShell, requireExpertUser, showExpertBanner, loadExpertData } from './shell.js';
import { escapeHtml, formatCurrency, formatDateTime } from './utils.js';

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
    const stats = overview?.stats || {};
    const sessions = overview?.upcoming_sessions || [];

    if (!applicationState?.email_verified) {
        showExpertBanner('Bạn cần xác minh email trước khi tiếp tục dùng khu vực chuyên gia.', 'info');
    } else if (appStatus === 'pending') {
        showExpertBanner('Hồ sơ của bạn đang chờ admin duyệt. Trong lúc này bạn có thể rà lại thông tin và chuẩn bị cho bước onboarding chuyên gia.', 'info');
    } else if (appStatus === 'rejected') {
        showExpertBanner('Hồ sơ gần nhất chưa được duyệt. Bạn có thể cập nhật lại và gửi hồ sơ mới trong mục Hồ sơ chuyên gia.', 'error');
    } else if (appStatus === 'approved') {
        showExpertBanner('Hồ sơ chuyên gia đã được duyệt. Bạn đang ở đúng workspace dành riêng cho chuyên gia.', 'success');
    } else {
        showExpertBanner('Bạn chưa gửi hồ sơ chuyên gia. Hãy hoàn tất hồ sơ để mở quyền chuyên gia đầy đủ.', 'info');
    }

    document.getElementById('expertHero').innerHTML = `
        <div class="expert-hero-grid">
            <div>
                <h2>${profile ? `Xin chào ${escapeHtml(profile.full_name)}` : 'Chào mừng đến expert portal'}</h2>
                <p>
                    ${profile
                        ? `Hồ sơ của bạn đang được gắn với mã ${escapeHtml(profile.code)}. Từ đây chúng ta có thể quản lý trạng thái chuyên gia, theo dõi lịch hẹn và mở rộng các công cụ vận hành riêng cho đội ngũ chuyên môn.`
                        : 'Không gian này tách riêng khỏi dashboard người dùng để chúng ta phát triển các nghiệp vụ chuyên gia một cách sạch sẽ, có cấu trúc và dễ mở rộng.'}
                </p>
            </div>
            <div class="expert-highlight-list">
                <div class="expert-highlight-item">
                    <span class="expert-highlight-label">Trạng thái hồ sơ</span>
                    <span class="expert-highlight-value">${labelForStatus(appStatus)}</span>
                </div>
                <div class="expert-highlight-item">
                    <span class="expert-highlight-label">Giá phiên tham khảo</span>
                    <span class="expert-highlight-value">${profile ? formatCurrency(profile.base_price) : 'Chưa thiết lập'}</span>
                </div>
                <div class="expert-highlight-item">
                    <span class="expert-highlight-label">Chuyên môn nổi bật</span>
                    <span class="expert-highlight-value">${profile?.specialties?.length ? escapeHtml(profile.specialties[0]) : 'Bổ sung ở hồ sơ chuyên gia'}</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('expertStats').innerHTML = [
        { label: 'Lịch sắp tới', value: stats.upcoming_sessions ?? 0 },
        { label: 'Phiên đã hoàn tất', value: stats.completed_sessions ?? 0 },
        { label: 'Số thân chủ', value: stats.total_clients ?? 0 },
        { label: 'Doanh thu tháng', value: formatCurrency(stats.monthly_revenue ?? 0) }
    ].map((item) => `
        <article class="expert-panel expert-stat-card">
            <p>${item.label}</p>
            <h3>${item.value}</h3>
        </article>
    `).join('');

    document.getElementById('expertSessions').innerHTML = sessions.length
        ? sessions.map((session) => `
            <article class="expert-session-item">
                <strong>${escapeHtml(session.client_name || 'Thân chủ')}</strong>
                <div class="expert-session-meta">
                    ${formatDateTime(session.starts_at)}<br>
                    ${escapeHtml(session.session_type)} · ${session.duration_minutes} phút · ${formatCurrency(session.price)}
                </div>
            </article>
        `).join('')
        : `
            <div class="expert-empty">
                <h3>Chưa có lịch hẹn sắp tới</h3>
                <p>Khi khu vực chuyên gia được mở rộng, danh sách lịch hẹn và trạng thái thân chủ sẽ hiển thị tại đây.</p>
            </div>
        `;

    document.getElementById('expertProfile').innerHTML = profile
        ? `
            <div class="expert-profile-list">
                <div class="expert-profile-row"><span>Bằng cấp</span><strong>${escapeHtml(profile.degree || '-')}</strong></div>
                <div class="expert-profile-row"><span>Kinh nghiệm</span><strong>${profile.experience_years || 0} năm</strong></div>
                <div class="expert-profile-row"><span>Khu vực công tác</span><strong>${escapeHtml(profile.location || 'Chưa cập nhật')}</strong></div>
                <div class="expert-profile-row"><span>Đánh giá</span><strong>${Number(profile.rating || 0).toFixed(1)} / 5</strong></div>
                <div class="expert-profile-row"><span>Trạng thái hoạt động</span><strong>${escapeHtml(profile.status || 'offline')}</strong></div>
            </div>
            <div style="margin-top:16px;">
                <div class="expert-tag-row">
                    ${(profile.specialties || []).map((item) => `<span class="expert-chip">${escapeHtml(item)}</span>`).join('') || '<span class="expert-chip">Chưa có chuyên môn</span>'}
                </div>
            </div>
        `
        : `
            <div class="expert-empty">
                <h3>Hồ sơ chuyên gia chưa được tạo</h3>
                <p>Gửi hồ sơ chuyên gia để hệ thống khởi tạo profile, lịch hẹn và các chỉ số vận hành chuyên môn.</p>
                <a class="btn-primary" href="application.html">Mở hồ sơ chuyên gia</a>
            </div>
        `;
}

function labelForStatus(status) {
    switch (status) {
        case 'approved':
            return 'Đã duyệt';
        case 'pending':
            return 'Chờ duyệt';
        case 'rejected':
            return 'Cần bổ sung';
        default:
            return 'Chưa gửi hồ sơ';
    }
}

// ===== Vận hành expert: trạng thái, quản lý lịch hẹn, lịch rảnh =====

const SESSION_TYPE_LABELS = { chat: 'Chat', voice: 'Gọi thoại', video: 'Video', inperson: 'Trực tiếp' };
const BOOKING_STATUS_LABELS = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', completed: 'Đã hoàn thành', cancelled: 'Đã huỷ' };
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

let availabilityState = [];

function setupExpertOperations(overview) {
    const hasProfile = Boolean(overview?.expert);
    const toggle = document.getElementById('expertStatusToggle');
    const bookingsSection = document.getElementById('expertBookings')?.closest('section');
    const availabilitySection = document.getElementById('expertAvailability')?.closest('section');

    if (!hasProfile) {
        if (toggle) toggle.style.display = 'none';
        if (bookingsSection) bookingsSection.style.display = 'none';
        if (availabilitySection) availabilitySection.style.display = 'none';
        return;
    }

    renderStatusToggle(overview.expert.status || 'offline');
    loadBookingManagement();
    loadAvailabilityEditor();
}

function renderStatusToggle(currentStatus) {
    const el = document.getElementById('expertStatusToggle');
    if (!el) return;
    const STATUSES = [
        { key: 'online', label: '🟢 Online' },
        { key: 'busy', label: '🟡 Bận' },
        { key: 'offline', label: '⚪ Offline' }
    ];
    el.innerHTML = `
        <div class="expert-panel" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px;">
            <strong style="margin-right:4px;">Trạng thái hoạt động:</strong>
            ${STATUSES.map((s) => `
                <button type="button" class="expert-status-btn" data-status="${s.key}"
                    style="padding:8px 14px;border-radius:999px;border:1.5px solid var(--expert-line);background:${s.key === currentStatus ? 'var(--mint-light)' : 'transparent'};font-weight:700;cursor:pointer;font-family:inherit;">
                    ${s.label}
                </button>`).join('')}
        </div>`;
    el.querySelectorAll('.expert-status-btn').forEach((btn) => {
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
}

async function loadBookingManagement() {
    const el = document.getElementById('expertBookings');
    if (!el) return;
    el.innerHTML = '<p style="color:var(--text-secondary);">Đang tải lịch hẹn...</p>';
    try {
        const bookings = await apiClient.get('/expert-portal/bookings', { noCache: true });
        renderBookings(Array.isArray(bookings) ? bookings : []);
    } catch (_error) {
        el.innerHTML = '<p style="color:var(--text-secondary);">Không tải được danh sách lịch hẹn.</p>';
    }
}

function bookingActionBtn(id, status, label, variant) {
    const bg = variant === 'primary' ? 'var(--mint)' : 'transparent';
    return `<button type="button" data-booking-action="${status}" data-booking-id="${id}"
        style="padding:7px 14px;border-radius:10px;border:1.5px solid var(--mint-dark);background:${bg};font-weight:700;cursor:pointer;font-family:inherit;">${label}</button>`;
}

function renderBookingRow(b) {
    const actions = [];
    if (b.status === 'pending') {
        actions.push(bookingActionBtn(b.id, 'confirmed', 'Xác nhận', 'primary'));
        actions.push(bookingActionBtn(b.id, 'cancelled', 'Từ chối', 'ghost'));
    } else if (b.status === 'confirmed') {
        actions.push(bookingActionBtn(b.id, 'completed', 'Hoàn thành', 'primary'));
        actions.push(bookingActionBtn(b.id, 'cancelled', 'Huỷ', 'ghost'));
    }
    const reviewLine = b.review_rating
        ? `<div style="margin-top:6px;color:var(--mint-dark);font-weight:700;">⭐ Đánh giá: ${b.review_rating}/5</div>`
        : '';
    const notesLine = b.notes
        ? `<div style="margin-top:6px;color:var(--text-secondary);">📝 ${escapeHtml(b.notes)}</div>`
        : '';
    return `
        <article style="border:1px solid var(--expert-line);border-radius:16px;padding:14px 16px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                <div>
                    <strong>${escapeHtml(b.client_name || 'Thân chủ')}</strong>
                    <div style="color:var(--text-secondary);margin-top:4px;">
                        ${escapeHtml(SESSION_TYPE_LABELS[b.session_type] || b.session_type)} ·
                        ${formatDateTime(b.starts_at)} · ${b.duration_minutes} phút · ${formatCurrency(b.price)}
                    </div>
                    ${notesLine}
                    ${reviewLine}
                </div>
                <span style="padding:4px 10px;border-radius:999px;font-size:0.78rem;font-weight:800;background:var(--mint-light);color:var(--mint-dark);white-space:nowrap;">
                    ${escapeHtml(BOOKING_STATUS_LABELS[b.status] || b.status)}
                </span>
            </div>
            ${actions.length ? `<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">${actions.join('')}</div>` : ''}
        </article>`;
}

function renderBookings(bookings) {
    const el = document.getElementById('expertBookings');
    if (!el) return;
    if (!bookings.length) {
        el.innerHTML = `
            <div class="expert-empty">
                <h3>Chưa có lịch hẹn</h3>
                <p>Khi thân chủ đặt lịch, lịch hẹn sẽ xuất hiện ở đây để bạn xác nhận hoặc hoàn thành.</p>
            </div>`;
        return;
    }
    el.innerHTML = bookings.map(renderBookingRow).join('');
    el.querySelectorAll('[data-booking-action]').forEach((btn) => {
        btn.addEventListener('click', () => updateBooking(
            btn.getAttribute('data-booking-id'),
            btn.getAttribute('data-booking-action')
        ));
    });
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
        availabilityState = Array.isArray(slots) ? slots.map((s) => ({
            weekday: Number(s.weekday),
            start_time: s.start_time,
            end_time: s.end_time
        })) : [];
    } catch (_error) {
        availabilityState = [];
    }
    renderAvailabilityEditor();
}

function availabilityRow(slot, index) {
    return `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">
            <select data-avail-field="weekday" data-avail-index="${index}" class="form-input" style="max-width:140px;">
                ${WEEKDAYS.map((d, wd) => `<option value="${wd}" ${wd === Number(slot.weekday) ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <input type="time" data-avail-field="start_time" data-avail-index="${index}" value="${escapeHtml(slot.start_time || '09:00')}" class="form-input" style="max-width:120px;">
            <span>→</span>
            <input type="time" data-avail-field="end_time" data-avail-index="${index}" value="${escapeHtml(slot.end_time || '10:00')}" class="form-input" style="max-width:120px;">
            <button type="button" data-avail-remove="${index}" class="btn-outline" style="padding:6px 12px;">Xoá</button>
        </div>`;
}

function renderAvailabilityEditor() {
    const el = document.getElementById('expertAvailability');
    if (!el) return;
    const rows = availabilityState.map(availabilityRow).join('')
        || '<p style="color:var(--text-secondary);">Chưa có khung giờ nào.</p>';
    el.innerHTML = `
        <div>${rows}</div>
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
            <button type="button" id="availAdd" class="btn-outline">+ Thêm khung giờ</button>
            <button type="button" id="availSave" class="btn-primary">Lưu lịch rảnh</button>
        </div>`;

    el.querySelector('#availAdd').addEventListener('click', () => {
        availabilityState.push({ weekday: 1, start_time: '09:00', end_time: '10:00' });
        renderAvailabilityEditor();
    });
    el.querySelector('#availSave').addEventListener('click', saveAvailability);
    el.querySelectorAll('[data-avail-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
            availabilityState.splice(Number(btn.getAttribute('data-avail-remove')), 1);
            renderAvailabilityEditor();
        });
    });
    el.querySelectorAll('[data-avail-field]').forEach((input) => {
        input.addEventListener('change', () => {
            const i = Number(input.getAttribute('data-avail-index'));
            const field = input.getAttribute('data-avail-field');
            if (!availabilityState[i]) return;
            availabilityState[i][field] = field === 'weekday' ? Number(input.value) : input.value;
        });
    });
}

async function saveAvailability() {
    try {
        await apiClient.put('/expert-portal/availability', { slots: availabilityState });
        showExpertBanner('Đã lưu lịch rảnh.', 'success');
        loadAvailabilityEditor();
    } catch (error) {
        showExpertBanner(error.message || 'Không thể lưu lịch rảnh.', 'error');
    }
}

init();
