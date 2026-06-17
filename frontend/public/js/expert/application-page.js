import { auth } from '../auth.js';
import { mountExpertShell, requireExpertUser, showExpertBanner, loadExpertData, invalidateExpertData } from './shell.js';

let applicationState = null;
let overviewState = null;
let mode = 'application';

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'application',
        title: 'Hồ sơ chuyên gia',
        subtitle: 'Hoàn tất hồ sơ nghiệp vụ sau khi xác minh email. Khi hồ sơ đã được duyệt, bạn có thể cập nhật trực tiếp profile chuyên gia theo đúng cấu trúc dữ liệu hiện có trong hệ thống.',
        badgeText: 'Verification-first flow'
    });

    try {
        ({ application: applicationState, overview: overviewState } = await loadExpertData());
        renderState();
        wireSubmit();
    } catch (error) {
        console.error('Expert application load failed:', error);
        showExpertBanner('Không thể tải trạng thái hồ sơ chuyên gia.', 'error');
        document.getElementById('expertApplicationForm').style.display = 'none';
    }
}

function renderState() {
    const form = document.getElementById('expertApplicationForm');
    const status = applicationState?.application?.status;

    if (!applicationState?.email_verified) {
        showExpertBanner('Bạn cần xác minh email trước khi nộp hoặc cập nhật hồ sơ chuyên gia.', 'info');
        form.style.display = 'none';
        return;
    }

    if (status === 'pending') {
        showExpertBanner('Hồ sơ của bạn đang chờ admin duyệt. Trong thời gian này chưa thể sửa tiếp để tránh lệch phiên bản hồ sơ đang xét duyệt.', 'info');
        form.style.display = 'none';
        return;
    }

    if (status === 'approved' && overviewState?.expert) {
        mode = 'profile';
        hydrateFromExpertProfile(overviewState.expert);
        document.getElementById('credentialFileGroup').style.display = 'none';
        document.getElementById('credentialFile').required = false;
        document.getElementById('submitBtn').textContent = 'Cập nhật hồ sơ chuyên gia';
        document.getElementById('expertFormHelper').textContent = 'Bạn đang chỉnh sửa profile đã được duyệt trong bảng experts. Các thay đổi này cập nhật trực tiếp hồ sơ chuyên gia hiện hành.';
        showExpertBanner('Hồ sơ đã được duyệt. Bạn có thể cập nhật profile chuyên gia ngay trên hệ thống.', 'success');
        document.getElementById('expertFormHelper').textContent = 'Nếu bạn muốn nộp lại bằng cấp hoặc chứng chỉ mới để xét duyệt lại, hãy dùng trang Lịch sử xét duyệt.';
        return;
    }

    mode = 'application';
    hydrateFromLatestApplication(applicationState?.application);
    document.getElementById('credentialFileGroup').style.display = '';
    document.getElementById('credentialFile').required = true;
    document.getElementById('submitBtn').textContent = 'Gửi hồ sơ chuyên gia';
    document.getElementById('expertFormHelper').textContent = 'Bạn có thể gửi lại hồ sơ nếu hồ sơ trước đó bị từ chối.';

    if (status === 'rejected') {
        showExpertBanner('Hồ sơ trước đó chưa được duyệt. Bạn có thể cập nhật lại thông tin và gửi lại tại đây.', 'error');
    } else {
        showExpertBanner('Email đã xác minh. Bây giờ bạn có thể gửi hồ sơ chuyên gia và file bằng cấp.', 'success');
    }
}

function hydrateFromLatestApplication(application) {
    const user = auth.getUser() || {};
    document.getElementById('fullName').value = application?.full_name || user.full_name || user.display_name || '';
    document.getElementById('phone').value = application?.phone || '';
    document.getElementById('experienceYears').value = String(application?.experience_years ?? 0);
    document.getElementById('avatarEmoji').value = '👩‍⚕️';
    document.getElementById('expertStatus').value = 'offline';
    document.getElementById('degree').value = application?.degree || '';
    document.getElementById('specialties').value = Array.isArray(application?.specialties) ? application.specialties.join(', ') : '';
    document.getElementById('location').value = application?.location || '';
    document.getElementById('basePrice').value = '0';
    document.getElementById('nextSlotLabel').value = '';
    document.getElementById('bio').value = application?.bio || '';
    document.getElementById('credentials').value = '';
    document.getElementById('approaches').value = '';
}

function hydrateFromExpertProfile(expert) {
    document.getElementById('fullName').value = expert?.full_name || '';
    document.getElementById('phone').value = expert?.phone || '';
    document.getElementById('experienceYears').value = String(expert?.experience_years ?? 0);
    document.getElementById('avatarEmoji').value = expert?.avatar_emoji || '👩‍⚕️';
    document.getElementById('expertStatus').value = expert?.status || 'offline';
    document.getElementById('degree').value = expert?.degree || '';
    document.getElementById('specialties').value = Array.isArray(expert?.specialties) ? expert.specialties.join(', ') : '';
    document.getElementById('location').value = expert?.location || '';
    document.getElementById('basePrice').value = String(expert?.base_price ?? 0);
    document.getElementById('nextSlotLabel').value = expert?.next_slot_label || '';
    document.getElementById('bio').value = expert?.bio || '';
    document.getElementById('credentials').value = Array.isArray(expert?.credentials) ? expert.credentials.join(', ') : '';
    document.getElementById('approaches').value = Array.isArray(expert?.approaches) ? expert.approaches.join(', ') : '';
}

function wireSubmit() {
    const form = document.getElementById('expertApplicationForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const degree = document.getElementById('degree').value.trim();
        const specialties = document.getElementById('specialties').value.trim();
        const experienceYears = document.getElementById('experienceYears').value.trim();
        const location = document.getElementById('location').value.trim();
        const bio = document.getElementById('bio').value.trim();
        const credentialFile = document.getElementById('credentialFile').files[0];
        const avatarEmoji = document.getElementById('avatarEmoji').value.trim() || '👩‍⚕️';
        const expertStatus = document.getElementById('expertStatus').value;
        const basePrice = document.getElementById('basePrice').value.trim();
        const credentials = document.getElementById('credentials').value.trim();
        const approaches = document.getElementById('approaches').value.trim();
        const nextSlotLabel = document.getElementById('nextSlotLabel').value.trim();

        if (!fullName || fullName.length < 2) {
            showExpertBanner('Vui lòng nhập họ tên chuyên gia.', 'error');
            return;
        }
        if (!phone || phone.length < 6) {
            showExpertBanner('Vui lòng nhập số điện thoại hợp lệ.', 'error');
            return;
        }
        if (!degree || degree.length < 2) {
            showExpertBanner('Vui lòng nhập bằng cấp.', 'error');
            return;
        }
        if (mode === 'application' && !credentialFile) {
            showExpertBanner('Vui lòng tải lên file bằng cấp.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = mode === 'profile' ? 'Đang cập nhật...' : 'Đang gửi hồ sơ...';

        try {
            if (mode === 'profile') {
                const updated = await auth.updateExpertProfile({
                    full_name: fullName,
                    phone,
                    degree,
                    avatar_emoji: avatarEmoji,
                    status: expertStatus,
                    base_price: basePrice || '0',
                    location,
                    experience_years: experienceYears || '0',
                    specialties,
                    bio,
                    credentials,
                    approaches,
                    next_slot_label: nextSlotLabel
                });
                overviewState = { ...overviewState, expert: updated };
                const user = auth.getUser() || {};
                user.full_name = fullName;
                user.display_name = fullName;
                localStorage.setItem('user', JSON.stringify(user));
                showExpertBanner('Hồ sơ chuyên gia đã được cập nhật thành công.', 'success');
                hydrateFromExpertProfile(updated);
            } else {
                const formData = new FormData();
                formData.set('full_name', fullName);
                formData.set('phone', phone);
                formData.set('degree', degree);
                formData.set('specialties', specialties);
                formData.set('experience_years', experienceYears || '0');
                formData.set('location', location);
                formData.set('bio', bio);
                formData.set('credential_file', credentialFile);

                await auth.submitExpertApplication(formData);
                showExpertBanner('Hồ sơ chuyên gia đã được gửi thành công. Admin sẽ xem xét và phản hồi qua email.', 'success');
                form.style.display = 'none';
            }
            invalidateExpertData();
        } catch (error) {
            showExpertBanner(error.message || 'Không thể xử lý hồ sơ chuyên gia.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'profile' ? 'Cập nhật hồ sơ chuyên gia' : 'Gửi hồ sơ chuyên gia';
        }
    });
}

init();
