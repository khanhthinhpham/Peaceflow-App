import { auth } from '../auth.js';
import { mountExpertShell, requireExpertUser, showExpertBanner, loadExpertData, invalidateExpertData, setExpertNavLock } from './shell.js';
import { escapeHtml, formatDateTime } from './utils.js';

let applicationState = null;
let overviewState = null;

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'review-status',
        title: 'Lịch sử xét duyệt',
        subtitle: 'Theo dõi toàn bộ các lần gửi hồ sơ chuyên gia, trạng thái xét duyệt và gửi lại bằng cấp/chứng chỉ mới khi bạn cần admin xem xét lại.',
        badgeText: 'Review timeline'
    });

    try {
        ({ application: applicationState, overview: overviewState } = await loadExpertData());
        if (!overviewState?.expert) {
            window.location.replace('apply.html');
            return;
        }
        setExpertNavLock(false);
        renderHistory();
        wireResubmit();
    } catch (error) {
        console.error('Review status load failed:', error);
        showExpertBanner('Không thể tải lịch sử xét duyệt lúc này.', 'error');
    }
}

function renderHistory() {
    const applications = applicationState?.applications || [];
    const historyEl = document.getElementById('reviewHistory');

    if (!applicationState?.email_verified) {
        showExpertBanner('Bạn cần xác minh email trước khi theo dõi hoặc gửi lại hồ sơ xét duyệt.', 'info');
    } else if (applications[0]?.status === 'pending') {
        showExpertBanner('Hiện đang có một hồ sơ chờ admin duyệt. Bạn chưa thể gửi thêm một hồ sơ khác cho tới khi hồ sơ này có kết quả.', 'info');
    } else if (applicationState?.has_expert_profile) {
        showExpertBanner('Bạn đang có profile chuyên gia hoạt động. Nếu cần cập nhật chứng chỉ/bằng cấp mới, hãy gửi lại hồ sơ xét duyệt từ panel bên phải.', 'success');
    } else {
        showExpertBanner('Lịch sử xét duyệt sẽ xuất hiện tại đây sau khi bạn gửi hồ sơ chuyên gia đầu tiên.', 'info');
    }

    if (!applications.length) {
        historyEl.innerHTML = `
            <div class="expert-empty">
                <h3>Chưa có lịch sử hồ sơ</h3>
                <p>Bạn chưa gửi hồ sơ chuyên gia nào. Hãy bắt đầu ở mục Hồ sơ chuyên gia.</p>
                <a class="btn-primary" href="application.html">Mở hồ sơ chuyên gia</a>
            </div>
        `;
        return;
    }

    historyEl.innerHTML = applications.map((item) => `
        <article class="expert-review-item">
            <div class="expert-review-head">
                <div>
                    <h3 class="expert-review-title">${escapeHtml(item.degree || 'Hồ sơ chuyên gia')}</h3>
                    <p class="expert-review-sub">Nộp lúc ${formatDateTime(item.created_at)}</p>
                </div>
                <span class="expert-status-pill ${escapeHtml(item.status)}">${labelForStatus(item.status)}</span>
            </div>
            <div class="expert-review-meta">
                <div><strong>Họ tên:</strong> ${escapeHtml(item.full_name || '-')}</div>
                <div><strong>Điện thoại:</strong> ${escapeHtml(item.phone || '-')}</div>
                <div><strong>File:</strong> ${escapeHtml(item.credential_filename || '-')}</div>
                <div><strong>Xem xét lúc:</strong> ${item.reviewed_at ? formatDateTime(item.reviewed_at) : 'Chưa xem xét'}</div>
            </div>
        </article>
    `).join('');

    renderResubmitSummary();
}

function renderResubmitSummary() {
    const summary = document.getElementById('rereviewSummary');
    const expert = overviewState?.expert;

    if (!expert) {
        summary.innerHTML = `
            <div class="expert-empty">
                <h3>Chưa có profile chuyên gia active</h3>
                <p>Khi hồ sơ đầu tiên được duyệt, bạn sẽ có thể dùng khu vực này để gửi lại chứng chỉ mới cho admin review.</p>
            </div>
        `;
        return;
    }

    summary.innerHTML = `
        <div><span>Hồ sơ hiện hành</span><strong>${escapeHtml(expert.full_name || '-')}</strong></div>
        <div><span>Bằng cấp hiện tại</span><strong>${escapeHtml(expert.degree || '-')}</strong></div>
        <div><span>Chuyên môn</span><strong>${escapeHtml((expert.specialties || []).join(', ') || '-')}</strong></div>
        <div><span>Kinh nghiệm</span><strong>${expert.experience_years || 0} năm</strong></div>
    `;
}

function wireResubmit() {
    const form = document.getElementById('rereviewForm');
    const submitBtn = document.getElementById('rereviewBtn');
    const expert = overviewState?.expert;
    const latest = applicationState?.applications?.[0];

    if (!applicationState?.email_verified || !expert || latest?.status === 'pending') {
        form.style.display = 'none';
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const file = document.getElementById('rereviewCredentialFile').files[0];
        if (!file) {
            showExpertBanner('Vui lòng chọn file bằng cấp/chứng chỉ mới để gửi xét duyệt lại.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi xét duyệt lại...';

        try {
            const formData = new FormData();
            formData.set('full_name', expert.full_name || '');
            formData.set('phone', expert.phone || '');
            formData.set('degree', expert.degree || '');
            formData.set('specialties', JSON.stringify(expert.specialties || []));
            formData.set('experience_years', String(expert.experience_years || 0));
            formData.set('location', expert.location || '');
            formData.set('bio', expert.bio || '');
            formData.set('credential_file', file);

            await auth.submitExpertApplication(formData);
            invalidateExpertData();
            showExpertBanner('Đã gửi hồ sơ xét duyệt lại thành công. Admin sẽ xem xét bản bằng cấp/chứng chỉ mới trong khi profile hiện tại của bạn vẫn hoạt động.', 'success');
            form.style.display = 'none';
        } catch (error) {
            showExpertBanner(error.message || 'Không thể gửi hồ sơ xét duyệt lại.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi lại để xét duyệt';
        }
    });
}

function labelForStatus(status) {
    switch (status) {
        case 'approved':
            return 'Đã duyệt';
        case 'pending':
            return 'Chờ duyệt';
        case 'rejected':
            return 'Từ chối';
        default:
            return status || 'Không rõ';
    }
}

init();
