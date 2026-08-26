<template>
  <div class="apply-body">
    <header class="apply-topbar">
      <div class="apply-brand">
        <span class="logo-icon">🌿</span> Peace<span>Flow</span>
      </div>
      <div class="apply-actions">
        <router-link to="/dashboard" class="btn-outline">🏠 Về app người dùng</router-link>
        <button type="button" class="btn-outline" @click="auth.logout()">Đăng xuất</button>
      </div>
    </header>

    <main class="apply-wrap">
      <div class="apply-card">
        <p class="apply-kicker">PeaceFlow Expert</p>
        <h1 class="apply-title">Gửi hồ sơ chuyên gia</h1>
        <p class="apply-sub">Hoàn tất hồ sơ chuyên môn và tải lên bằng cấp để admin xét duyệt. Sau khi được duyệt, bạn mới vào được khu chuyên gia.</p>

        <div class="apply-banner" :class="{ show: !!banner.message, [banner.type]: !!banner.message }">{{ banner.message }}</div>

        <div v-if="loading" style="padding:30px 12px;text-align:center;color:var(--text-light);">Đang tải trạng thái hồ sơ…</div>

        <form v-if="showForm" @submit.prevent="submit">
          <div class="apply-grid">
            <div class="form-group full">
              <label class="form-label" for="fullName">Họ tên chuyên gia</label>
              <input v-model="fullName" type="text" id="fullName" class="form-input" placeholder="Nhập họ tên đầy đủ" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Số điện thoại</label>
              <input v-model="phone" type="text" id="phone" class="form-input" placeholder="Số điện thoại liên hệ" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="experienceYears">Số năm kinh nghiệm</label>
              <input v-model="experienceYears" type="number" id="experienceYears" class="form-input" min="0" max="80" placeholder="0" required>
            </div>
            <div class="form-group full">
              <label class="form-label" for="degree">Bằng cấp</label>
              <input v-model="degree" type="text" id="degree" class="form-input" placeholder="Ví dụ: Thạc sĩ Tâm lý lâm sàng" required>
            </div>
            <div class="form-group full">
              <label class="form-label" for="specialties">Chuyên môn</label>
              <input v-model="specialties" type="text" id="specialties" class="form-input" placeholder="Ví dụ: trị liệu cá nhân, CBT, sang chấn">
              <div class="field-hint">Ngăn cách bằng dấu phẩy.</div>
            </div>
            <div class="form-group full">
              <label class="form-label" for="location">Nơi công tác</label>
              <input v-model="location" type="text" id="location" class="form-input" placeholder="Bệnh viện, phòng khám, trung tâm...">
            </div>
            <div class="form-group full">
              <label class="form-label" for="bio">Giới thiệu ngắn</label>
              <textarea v-model="bio" id="bio" class="form-input" rows="5" placeholder="Kinh nghiệm, thế mạnh chuyên môn, cách bạn hỗ trợ thân chủ..."></textarea>
            </div>
            <div class="form-group full">
              <label class="form-label" for="credentialFile">File bằng cấp</label>
              <input ref="credentialFileInput" type="file" id="credentialFile" class="form-input" accept=".pdf,image/*,.doc,.docx,application/pdf" required>
              <div class="field-hint">Hỗ trợ PDF hoặc ảnh, tối đa 10MB.</div>
            </div>
          </div>

          <div class="expert-form-actions" style="margin-top:16px;">
            <p style="margin:0;color:var(--text-secondary);font-size:0.85rem;">{{ helperText }}</p>
            <button type="submit" class="btn-primary" :disabled="submitting">{{ submitLabel }}</button>
          </div>
        </form>

        <div v-if="doneMessage" class="apply-done">
          <div class="done-ico">⏳</div>
          <h2 style="margin:8px 0 6px;">Hồ sơ đang chờ duyệt</h2>
          <p style="color:var(--text-secondary);line-height:1.6;margin:0 auto 18px;max-width:440px;">{{ doneMessage }}</p>
          <router-link to="/dashboard" class="btn-primary" style="text-decoration:none;">Về app người dùng</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const showForm = ref(false);
const doneMessage = ref('');
const banner = ref({ message: '', type: 'info' });
const helperText = ref('');
const submitting = ref(false);

const fullName = ref('');
const phone = ref('');
const experienceYears = ref('');
const degree = ref('');
const specialties = ref('');
const location = ref('');
const bio = ref('');
const credentialFileInput = ref(null);

const submitLabel = computed(() => (submitting.value ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ chuyên gia'));

function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

function showWaiting(message) {
  loading.value = false;
  showForm.value = false;
  setBanner('');
  doneMessage.value = message;
}

function prefill(application) {
  if (!application) return;
  fullName.value = application.full_name || '';
  phone.value = application.phone || '';
  experienceYears.value = String(application.experience_years ?? 0);
  degree.value = application.degree || '';
  specialties.value = Array.isArray(application.specialties) ? application.specialties.join(', ') : '';
  location.value = application.location || '';
  bio.value = application.bio || '';
}

async function submit() {
  const credentialFile = credentialFileInput.value?.files?.[0];

  if (!fullName.value || fullName.value.trim().length < 2) { setBanner('Vui lòng nhập họ tên chuyên gia.', 'error'); return; }
  if (!phone.value || phone.value.trim().length < 6) { setBanner('Vui lòng nhập số điện thoại hợp lệ.', 'error'); return; }
  if (!degree.value || degree.value.trim().length < 2) { setBanner('Vui lòng nhập bằng cấp.', 'error'); return; }
  if (!credentialFile) { setBanner('Vui lòng tải lên file bằng cấp.', 'error'); return; }

  submitting.value = true;
  try {
    const formData = new FormData();
    formData.set('full_name', fullName.value.trim());
    formData.set('phone', phone.value.trim());
    formData.set('degree', degree.value.trim());
    formData.set('specialties', specialties.value.trim());
    formData.set('experience_years', String(experienceYears.value ?? '').trim() || '0');
    formData.set('location', location.value.trim());
    formData.set('bio', bio.value.trim());
    formData.set('credential_file', credentialFile);

    await auth.submitExpertApplication(formData);
    showWaiting('Cảm ơn bạn! Admin sẽ xem xét bằng cấp & thông tin chuyên môn và phản hồi qua email. Khi được duyệt, bạn sẽ vào được khu chuyên gia.');
  } catch (error) {
    setBanner(error.message || 'Không thể gửi hồ sơ. Vui lòng thử lại.', 'error');
    submitting.value = false;
  }
}

onMounted(async () => {
  const ok = await auth.waitForAuth();
  if (!ok) { router.replace('/login'); return; }

  const user = auth.user;
  if (user?.role !== 'expert') { router.replace('/dashboard'); return; }

  let state;
  try {
    state = await auth.getMyExpertApplication();
  } catch (_e) {
    loading.value = false;
    setBanner('Không tải được trạng thái hồ sơ. Vui lòng tải lại trang.', 'error');
    showForm.value = false;
    return;
  }

  if (state?.has_expert_profile) {
    router.replace({ name: 'expert-dashboard' });
    return;
  }

  if (!state?.email_verified) {
    loading.value = false;
    setBanner('Bạn cần xác minh email trước khi gửi hồ sơ chuyên gia.', 'info');
    showForm.value = false;
    return;
  }

  const status = state?.application?.status;
  if (status === 'pending') {
    showWaiting('Hồ sơ của bạn đang được admin xem xét. Chúng tôi sẽ phản hồi qua email sớm nhất.');
    return;
  }

  loading.value = false;
  showForm.value = true;
  if (status === 'rejected') {
    prefill(state.application);
    setBanner('Hồ sơ trước đó chưa được duyệt. Bạn có thể cập nhật và gửi lại.', 'error');
    helperText.value = 'Bạn có thể gửi lại hồ sơ với thông tin/bằng cấp cập nhật.';
  } else {
    helperText.value = 'Email đã xác minh. Điền đầy đủ thông tin và tải bằng cấp để gửi hồ sơ.';
  }
});
</script>

<style scoped>
.apply-body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 203, 164, 0.2), transparent 28%),
    radial-gradient(circle at bottom right, rgba(168, 213, 186, 0.2), transparent 32%),
    var(--cream);
  color: var(--text-primary);
}
.apply-topbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  padding: 14px 24px;
  background: var(--warm-white);
  border-bottom: 2px solid var(--kraft-light);
}
.apply-brand { display: flex; align-items: center; font-size: 1.2rem; font-weight: 800; }
.apply-brand .logo-icon { width: 34px; height: 34px; display: grid; place-items: center; background: var(--mint); border-radius: 10px; box-shadow: 2px 2px 0 var(--mint-dark); margin: 14px}
.apply-brand span { color: var(--mint-dark); }
.apply-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.apply-wrap { max-width: 760px; margin: 0 auto; padding: 28px 18px 60px; }
.apply-card {
  background: var(--warm-white);
  border: 2px solid var(--kraft-light);
  border-radius: 18px;
  box-shadow: 4px 4px 0 rgba(74, 55, 40, 0.1);
  padding: 26px 28px;
}
.apply-kicker { margin: 0; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-light); }
.apply-title { margin: 6px 0 4px; font-size: 1.8rem; font-weight: 800; }
.apply-sub { margin: 0 0 18px; color: var(--text-secondary); line-height: 1.6; }
.apply-banner { display: none; margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; }
.apply-banner.show { display: block; }
.apply-banner.info { background: #eef3fb; color: #2b5b9e; }
.apply-banner.success { background: #e9f6ee; color: #2f7d52; }
.apply-banner.error { background: #fdeceb; color: #b42318; }
.apply-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.apply-grid .full { grid-column: 1 / -1; }
.apply-done { text-align: center; padding: 24px 12px; }
.apply-done .done-ico { font-size: 2.6rem; }
@media (max-width: 560px) { .apply-grid { grid-template-columns: 1fr; } }
</style>
