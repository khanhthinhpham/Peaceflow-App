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

init();
