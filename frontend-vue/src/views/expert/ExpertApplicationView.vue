<template>
  <main class="expert-main">
    <header class="expert-topbar">
      <div>
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Hồ sơ chuyên gia</h1>
        <p class="expert-page-subtitle">Hoàn tất hồ sơ nghiệp vụ sau khi xác minh email. Khi hồ sơ đã được duyệt, bạn có thể cập nhật trực tiếp profile chuyên gia theo đúng cấu trúc dữ liệu hiện có trong hệ thống.</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <router-link to="/dashboard" class="btn-outline" style="font-size:.85rem;white-space:nowrap;">🏠 Về app người dùng</router-link>
        <div class="expert-badge">Verification-first flow</div>
      </div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <section class="expert-panel expert-form-panel">
      <div class="expert-steps">
        <article class="expert-step">
          <small>Bước 1</small>
          <strong>Tạo tài khoản chuyên gia</strong>
          <p>Tài khoản được tạo tách riêng khỏi hồ sơ chuyên môn để đảm bảo đăng nhập và liên hệ chính xác.</p>
        </article>
        <article class="expert-step">
          <small>Bước 2</small>
          <strong>Xác minh email</strong>
          <p>Chỉ sau khi email được xác nhận, hệ thống mới mở bước nộp hồ sơ để tránh hồ sơ mồ côi.</p>
        </article>
        <article class="expert-step">
          <small>Bước 3</small>
          <strong>Gửi hồ sơ chuyên gia</strong>
          <p>Admin xem xét bằng cấp, kinh nghiệm và thông tin chuyên môn trước khi cấp quyền đầy đủ.</p>
        </article>
      </div>

      <form v-if="showForm" @submit.prevent="submit">
        <div class="expert-form-grid">
          <div class="form-group full">
            <label class="form-label" for="fullName">Họ tên chuyên gia</label>
            <input v-model="fullName" type="text" id="fullName" class="form-input" placeholder="Nhập họ tên đầy đủ" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Số điện thoại</label>
            <input v-model="phone" type="text" id="phone" class="form-input" placeholder="Nhập số điện thoại liên hệ" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="experienceYears">Số năm kinh nghiệm</label>
            <input v-model="experienceYears" type="number" id="experienceYears" class="form-input" min="0" max="80" placeholder="0" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="avatarEmoji">Avatar emoji</label>
            <input v-model="avatarEmoji" type="text" id="avatarEmoji" class="form-input" placeholder="👩‍⚕️" maxlength="16">
          </div>

          <div class="form-group" v-if="mode === 'profile'">
            <label class="form-label">Ảnh đại diện thật</label>
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:52px;height:52px;border-radius:50%;background:var(--kraft-light,#e8ddd0);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                <img v-if="avatarPhotoUrl" :src="avatarPhotoUrl" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">
                <template v-else>{{ avatarEmoji || '👩‍⚕️' }}</template>
              </div>
              <button type="button" class="btn-outline" :disabled="avatarUploading" @click="triggerAvatarUpload">Tải ảnh lên</button>
              <button v-if="hasAvatarPhoto" type="button" class="btn-outline" :disabled="avatarRemoving" @click="removeAvatarPhoto">Xoá ảnh</button>
              <input ref="avatarFileInput" type="file" accept="image/*" style="display:none;" @change="onAvatarFileChange">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="expertStatus">Trạng thái làm việc</label>
            <select v-model="expertStatus" id="expertStatus" class="form-input">
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="busy">Busy</option>
            </select>
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

          <div class="form-group">
            <label class="form-label" for="basePrice">Giá phiên tham khảo</label>
            <input v-model="basePrice" type="number" id="basePrice" class="form-input" min="0" step="1000" placeholder="0">
          </div>

          <div class="form-group">
            <label class="form-label" for="nextSlotLabel">Nhãn lịch trống</label>
            <input v-model="nextSlotLabel" type="text" id="nextSlotLabel" class="form-input" placeholder="Ví dụ: Trống chiều thứ 5">
          </div>

          <div class="form-group full">
            <label class="form-label" for="bio">Giới thiệu ngắn</label>
            <textarea v-model="bio" id="bio" class="form-input" rows="5" placeholder="Kinh nghiệm, thế mạnh chuyên môn, cách bạn hỗ trợ thân chủ..."></textarea>
          </div>

          <div class="form-group full">
            <label class="form-label" for="credentials">Chứng chỉ / thành tựu</label>
            <input v-model="credentials" type="text" id="credentials" class="form-input" placeholder="Ví dụ: CBT, EMDR, thành viên hội chuyên môn">
            <div class="field-hint">Ngăn cách bằng dấu phẩy.</div>
          </div>

          <div class="form-group full">
            <label class="form-label" for="approaches">Phương pháp làm việc</label>
            <input v-model="approaches" type="text" id="approaches" class="form-input" placeholder="Ví dụ: CBT, mindfulness, trị liệu sang chấn">
            <div class="field-hint">Ngăn cách bằng dấu phẩy.</div>
          </div>

          <div class="form-group full" v-if="mode === 'application'">
            <label class="form-label" for="credentialFile">File bằng cấp</label>
            <input ref="credentialFileInput" type="file" id="credentialFile" class="form-input" accept=".pdf,image/*,.doc,.docx,application/pdf" required>
            <div class="field-hint">Hỗ trợ PDF hoặc ảnh, tối đa 10MB.</div>
          </div>
        </div>

        <div class="expert-form-actions">
          <p>{{ helperText }}</p>
          <button type="submit" class="btn-primary" :disabled="submitting">{{ submitLabel }}</button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useExpertPortalStore } from '../../stores/expertPortal';
import { apiClient } from '../../lib/apiClient';
import { cropAvatarFile } from '../../lib/avatarCropper';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';

const router = useRouter();
const auth = useAuthStore();
const expertPortal = useExpertPortalStore();

// Vue 3 tự ép giá trị v-model của <input type="number"> thành số (không phải chuỗi) ngay khi
// người dùng tương tác với ô, dù không dùng v-model.number — String() trước khi .trim() để
// basePrice/experienceYears luôn an toàn dù đang là số hay chuỗi.
function str(v) {
  return String(v ?? '').trim();
}

const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

const showForm = ref(false);
const mode = ref('application');
const submitting = ref(false);
const helperText = ref('');

const fullName = ref('');
const phone = ref('');
const experienceYears = ref('');
const avatarEmoji = ref('👩‍⚕️');
const expertStatus = ref('offline');
const degree = ref('');
const specialties = ref('');
const location = ref('');
const basePrice = ref('0');
const nextSlotLabel = ref('');
const bio = ref('');
const credentials = ref('');
const approaches = ref('');
const credentialFileInput = ref(null);

const hasAvatarPhoto = ref(false);
const avatarPhotoUrl = ref(null);
const avatarUploading = ref(false);
const avatarRemoving = ref(false);
const avatarFileInput = ref(null);

const submitLabel = computed(() => {
  if (submitting.value) return mode.value === 'profile' ? 'Đang cập nhật...' : 'Đang gửi hồ sơ...';
  return mode.value === 'profile' ? 'Cập nhật hồ sơ chuyên gia' : 'Gửi hồ sơ chuyên gia';
});

function hydrateFromLatestApplication(application) {
  const user = auth.user || {};
  fullName.value = application?.full_name || user.full_name || user.display_name || '';
  phone.value = application?.phone || '';
  experienceYears.value = String(application?.experience_years ?? 0);
  avatarEmoji.value = '👩‍⚕️';
  expertStatus.value = 'offline';
  degree.value = application?.degree || '';
  specialties.value = Array.isArray(application?.specialties) ? application.specialties.join(', ') : '';
  location.value = application?.location || '';
  basePrice.value = '0';
  nextSlotLabel.value = '';
  bio.value = application?.bio || '';
  credentials.value = '';
  approaches.value = '';
}

async function hydrateFromExpertProfile(expert) {
  fullName.value = expert?.full_name || '';
  phone.value = expert?.phone || '';
  experienceYears.value = String(expert?.experience_years ?? 0);
  avatarEmoji.value = expert?.avatar_emoji || '👩‍⚕️';
  expertStatus.value = expert?.status || 'offline';
  degree.value = expert?.degree || '';
  specialties.value = Array.isArray(expert?.specialties) ? expert.specialties.join(', ') : '';
  location.value = expert?.location || '';
  basePrice.value = String(expert?.base_price ?? 0);
  nextSlotLabel.value = expert?.next_slot_label || '';
  bio.value = expert?.bio || '';
  credentials.value = Array.isArray(expert?.credentials) ? expert.credentials.join(', ') : '';
  approaches.value = Array.isArray(expert?.approaches) ? expert.approaches.join(', ') : '';
  await renderAvatarPhotoPreview(expert);
}

async function renderAvatarPhotoPreview(expert) {
  hasAvatarPhoto.value = !!expert?.has_avatar_photo;
  avatarPhotoUrl.value = null;
  if (!expert?.has_avatar_photo) return;
  try {
    const blob = await apiClient.getBlob(`/experts/${expert.id}/avatar`);
    avatarPhotoUrl.value = URL.createObjectURL(blob);
  } catch (_e) {
    avatarPhotoUrl.value = null;
  }
}

function renderState(applicationState, overviewState) {
  const status = applicationState?.application?.status;
  showForm.value = true;

  if (!applicationState?.email_verified) {
    setBanner('Bạn cần xác minh email trước khi nộp hoặc cập nhật hồ sơ chuyên gia.', 'info');
    showForm.value = false;
    return;
  }

  if (status === 'pending') {
    setBanner('Hồ sơ của bạn đang chờ admin duyệt. Trong thời gian này chưa thể sửa tiếp để tránh lệch phiên bản hồ sơ đang xét duyệt.', 'info');
    showForm.value = false;
    return;
  }

  if (overviewState?.expert) {
    mode.value = 'profile';
    hydrateFromExpertProfile(overviewState.expert);
    helperText.value = 'Nếu bạn muốn nộp lại bằng cấp hoặc chứng chỉ mới để xét duyệt lại, hãy dùng trang Lịch sử xét duyệt.';
    setBanner('Hồ sơ đã được duyệt. Bạn có thể cập nhật profile chuyên gia ngay trên hệ thống.', 'success');
    return;
  }

  mode.value = 'application';
  hydrateFromLatestApplication(applicationState?.application);
  helperText.value = 'Bạn có thể gửi lại hồ sơ nếu hồ sơ trước đó bị từ chối.';

  if (status === 'rejected') {
    setBanner('Hồ sơ trước đó chưa được duyệt. Bạn có thể cập nhật lại thông tin và gửi lại tại đây.', 'error');
  } else {
    setBanner('Email đã xác minh. Bây giờ bạn có thể gửi hồ sơ chuyên gia và file bằng cấp.', 'success');
  }
}

async function submit() {
  const trimmedFullName = fullName.value.trim();
  const trimmedPhone = phone.value.trim();
  const trimmedDegree = degree.value.trim();
  const credentialFile = credentialFileInput.value?.files?.[0];

  if (!trimmedFullName || trimmedFullName.length < 2) { setBanner('Vui lòng nhập họ tên chuyên gia.', 'error'); return; }
  if (!trimmedPhone || trimmedPhone.length < 6) { setBanner('Vui lòng nhập số điện thoại hợp lệ.', 'error'); return; }
  if (!trimmedDegree || trimmedDegree.length < 2) { setBanner('Vui lòng nhập bằng cấp.', 'error'); return; }
  if (mode.value === 'application' && !credentialFile) { setBanner('Vui lòng tải lên file bằng cấp.', 'error'); return; }

  submitting.value = true;
  try {
    if (mode.value === 'profile') {
      const updated = await auth.updateExpertProfile({
        full_name: trimmedFullName,
        phone: trimmedPhone,
        degree: trimmedDegree,
        avatar_emoji: avatarEmoji.value.trim() || '👩‍⚕️',
        status: expertStatus.value,
        base_price: str(basePrice.value) || '0',
        location: location.value.trim(),
        experience_years: str(experienceYears.value) || '0',
        specialties: specialties.value.trim(),
        bio: bio.value.trim(),
        credentials: credentials.value.trim(),
        approaches: approaches.value.trim(),
        next_slot_label: nextSlotLabel.value.trim()
      });
      expertPortal.overview = { ...expertPortal.overview, expert: updated };
      const user = { ...(auth.user || {}), full_name: trimmedFullName, display_name: trimmedFullName };
      localStorage.setItem('user', JSON.stringify(user));
      auth.user = user;
      setBanner('Hồ sơ chuyên gia đã được cập nhật thành công.', 'success');
      await hydrateFromExpertProfile(updated);
    } else {
      const formData = new FormData();
      formData.set('full_name', trimmedFullName);
      formData.set('phone', trimmedPhone);
      formData.set('degree', trimmedDegree);
      formData.set('specialties', specialties.value.trim());
      formData.set('experience_years', str(experienceYears.value) || '0');
      formData.set('location', location.value.trim());
      formData.set('bio', bio.value.trim());
      formData.set('credential_file', credentialFile);

      await auth.submitExpertApplication(formData);
      setBanner('Hồ sơ chuyên gia đã được gửi thành công. Admin sẽ xem xét và phản hồi qua email.', 'success');
      showForm.value = false;
    }
    expertPortal.invalidate();
  } catch (error) {
    setBanner(error.message || 'Không thể xử lý hồ sơ chuyên gia.', 'error');
  } finally {
    submitting.value = false;
  }
}

function triggerAvatarUpload() {
  avatarFileInput.value?.click();
}

async function onAvatarFileChange() {
  const file = avatarFileInput.value?.files?.[0];
  if (!file) return;
  avatarUploading.value = true;
  try {
    const cropped = await cropAvatarFile(file);
    if (!cropped) return;
    const formData = new FormData();
    formData.set('image', cropped);
    await apiClient.postForm('/expert-portal/avatar', formData);
    expertPortal.invalidate();
    const { overview } = await expertPortal.load();
    await renderAvatarPhotoPreview(overview.expert);
    setBanner('Đã cập nhật ảnh đại diện.', 'success');
  } catch (error) {
    setBanner(error.message || 'Không thể tải ảnh lên.', 'error');
  } finally {
    avatarUploading.value = false;
    if (avatarFileInput.value) avatarFileInput.value.value = '';
  }
}

async function removeAvatarPhoto() {
  if (!window.confirm('Xoá ảnh đại diện thật, quay về avatar emoji?')) return;
  avatarRemoving.value = true;
  try {
    await apiClient.delete('/expert-portal/avatar');
    expertPortal.invalidate();
    const { overview } = await expertPortal.load();
    await renderAvatarPhotoPreview(overview.expert);
    setBanner('Đã xoá ảnh đại diện.', 'success');
  } catch (error) {
    setBanner(error.message || 'Không thể xoá ảnh.', 'error');
  } finally {
    avatarRemoving.value = false;
  }
}

onMounted(async () => {
  try {
    const { application, overview } = await expertPortal.load();
    if (!overview?.expert) {
      router.replace('/expert-apply');
      return;
    }
    renderState(application, overview);
  } catch (error) {
    console.error('Expert application load failed:', error);
    setBanner('Không thể tải trạng thái hồ sơ chuyên gia.', 'error');
    showForm.value = false;
  }
});
</script>

<style scoped src="../../assets/expertApplication.css"></style>
