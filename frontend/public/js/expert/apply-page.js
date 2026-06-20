import { auth } from '../auth.js';

const form = document.getElementById('expertApplicationForm');
const bannerEl = document.getElementById('applyBanner');
const doneEl = document.getElementById('applyDone');
const submitBtn = document.getElementById('submitBtn');
const helperEl = document.getElementById('expertFormHelper');

function banner(message, type = 'info') {
    if (!bannerEl) return;
    bannerEl.textContent = message || '';
    bannerEl.className = message ? `apply-banner show ${type}` : 'apply-banner';
}

function showWaiting(message) {
    if (form) form.style.display = 'none';
    banner('');
    if (doneEl) {
        doneEl.style.display = '';
        doneEl.innerHTML = `
            <div class="done-ico">⏳</div>
            <h2 style="margin:8px 0 6px;">Hồ sơ đang chờ duyệt</h2>
            <p style="color:var(--text-secondary);line-height:1.6;margin:0 auto 18px;max-width:440px;">${message}</p>
            <a href="../dashboard.html" class="btn-primary" style="text-decoration:none;">Về app người dùng</a>
        `;
    }
}

function prefill(application) {
    if (!application) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('fullName', application.full_name || '');
    set('phone', application.phone || '');
    set('experienceYears', String(application.experience_years ?? 0));
    set('degree', application.degree || '');
    set('specialties', Array.isArray(application.specialties) ? application.specialties.join(', ') : '');
    set('location', application.location || '');
    set('bio', application.bio || '');
}

function wireSubmit() {
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const get = (id) => (document.getElementById(id)?.value || '').trim();
        const fullName = get('fullName');
        const phone = get('phone');
        const degree = get('degree');
        const specialties = get('specialties');
        const experienceYears = get('experienceYears');
        const location = get('location');
        const bio = get('bio');
        const credentialFile = document.getElementById('credentialFile')?.files[0];

        if (!fullName || fullName.length < 2) { banner('Vui lòng nhập họ tên chuyên gia.', 'error'); return; }
        if (!phone || phone.length < 6) { banner('Vui lòng nhập số điện thoại hợp lệ.', 'error'); return; }
        if (!degree || degree.length < 2) { banner('Vui lòng nhập bằng cấp.', 'error'); return; }
        if (!credentialFile) { banner('Vui lòng tải lên file bằng cấp.', 'error'); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi hồ sơ...';
        try {
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
            showWaiting('Cảm ơn bạn! Admin sẽ xem xét bằng cấp & thông tin chuyên môn và phản hồi qua email. Khi được duyệt, bạn sẽ vào được khu chuyên gia.');
        } catch (error) {
            banner(error.message || 'Không thể gửi hồ sơ. Vui lòng thử lại.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi hồ sơ chuyên gia';
        }
    });
}

function loginUrl() {
    const path = window.location.pathname;
    const idx = path.indexOf('/pages/');
    return idx >= 0 ? `${path.slice(0, idx + 7)}login.html` : '../login.html';
}

async function init() {
    document.getElementById('applyLogout')?.addEventListener('click', () => auth.logout());

    const ok = await auth.waitForAuth();
    if (!ok) { window.location.replace(loginUrl()); return; }

    const user = auth.getUser();
    if (user?.role !== 'expert') { window.location.replace('../dashboard.html'); return; }

    let state;
    try {
        state = await auth.getMyExpertApplication();
    } catch (_e) {
        banner('Không tải được trạng thái hồ sơ. Vui lòng tải lại trang.', 'error');
        if (form) form.style.display = 'none';
        return;
    }

    // Đã được duyệt (có profile) → vào thẳng khu chuyên gia.
    if (state?.has_expert_profile) {
        window.location.replace('app.html?page=dashboard.html');
        return;
    }

    if (!state?.email_verified) {
        banner('Bạn cần xác minh email trước khi gửi hồ sơ chuyên gia.', 'info');
        if (form) form.style.display = 'none';
        return;
    }

    const status = state?.application?.status;
    if (status === 'pending') {
        showWaiting('Hồ sơ của bạn đang được admin xem xét. Chúng tôi sẽ phản hồi qua email sớm nhất.');
        return;
    }

    if (status === 'rejected') {
        prefill(state.application);
        banner('Hồ sơ trước đó chưa được duyệt. Bạn có thể cập nhật và gửi lại.', 'error');
        if (helperEl) helperEl.textContent = 'Bạn có thể gửi lại hồ sơ với thông tin/bằng cấp cập nhật.';
    } else if (helperEl) {
        helperEl.textContent = 'Email đã xác minh. Điền đầy đủ thông tin và tải bằng cấp để gửi hồ sơ.';
    }

    wireSubmit();
}

init();
