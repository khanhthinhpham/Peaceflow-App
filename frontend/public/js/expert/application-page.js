import { auth } from '../auth.js';
import { mountExpertShell, requireExpertUser, showExpertBanner } from './shell.js';

let applicationState = null;

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'application',
        title: 'Hồ sơ chuyên gia',
        subtitle: 'Hoàn tất hồ sơ nghiệp vụ sau khi xác minh email. Chúng ta tách bước này khỏi đăng ký để đảm bảo danh tính liên hệ được xác thực trước.',
        badgeText: 'Verification-first flow'
    });

    try {
        applicationState = await auth.getMyExpertApplication();
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

    if (!applicationState?.email_verified) {
      showExpertBanner('Bạn cần xác minh email trước khi nộp hồ sơ chuyên gia.', 'info');
      form.style.display = 'none';
      return;
    }

    const status = applicationState?.application?.status;
    if (status === 'pending') {
      showExpertBanner('Hồ sơ của bạn đang chờ admin duyệt. Trong thời gian này bạn chưa cần gửi lại hồ sơ mới.', 'info');
      form.style.display = 'none';
      return;
    }

    if (status === 'approved') {
      showExpertBanner('Hồ sơ đã được duyệt. Bạn có thể quay lại dashboard chuyên gia để theo dõi hoạt động.', 'success');
      form.style.display = 'none';
      return;
    }

    if (status === 'rejected') {
      showExpertBanner('Hồ sơ trước đó chưa được duyệt. Bạn có thể cập nhật lại thông tin và gửi lại tại đây.', 'error');
    } else {
      showExpertBanner('Email đã xác minh. Bây giờ bạn có thể gửi hồ sơ chuyên gia và file bằng cấp.', 'success');
    }
}

function wireSubmit() {
    const form = document.getElementById('expertApplicationForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phone = document.getElementById('phone').value.trim();
        const degree = document.getElementById('degree').value.trim();
        const specialties = document.getElementById('specialties').value.trim();
        const experienceYears = document.getElementById('experienceYears').value.trim();
        const location = document.getElementById('location').value.trim();
        const bio = document.getElementById('bio').value.trim();
        const credentialFile = document.getElementById('credentialFile').files[0];

        if (!phone || phone.length < 6) {
            showExpertBanner('Vui lòng nhập số điện thoại hợp lệ.', 'error');
            return;
        }
        if (!degree || degree.length < 2) {
            showExpertBanner('Vui lòng nhập bằng cấp.', 'error');
            return;
        }
        if (!credentialFile) {
            showExpertBanner('Vui lòng tải lên file bằng cấp.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi hồ sơ...';

        try {
            const formData = new FormData();
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
        } catch (error) {
            showExpertBanner(error.message || 'Không thể gửi hồ sơ chuyên gia.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi hồ sơ chuyên gia';
        }
    });
}

init();
