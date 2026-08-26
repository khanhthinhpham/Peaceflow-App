<template>
  <main class="expert-main">
    <header class="expert-topbar">
      <div>
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Lịch sử xét duyệt</h1>
        <p class="expert-page-subtitle">Theo dõi toàn bộ các lần gửi hồ sơ chuyên gia, trạng thái xét duyệt và gửi lại bằng cấp/chứng chỉ mới khi bạn cần admin xem xét lại.</p>
      </div>
      <div class="expert-badge">Review timeline</div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <section class="expert-review-layout">
      <article class="expert-panel expert-review-panel">
        <h2 class="expert-section-title">Timeline hồ sơ</h2>
        <div class="expert-review-list">
          <div v-if="!applications.length" class="expert-empty">
            <h3>Chưa có lịch sử hồ sơ</h3>
            <p>Bạn chưa gửi hồ sơ chuyên gia nào. Hãy bắt đầu ở mục Hồ sơ chuyên gia.</p>
            <router-link class="btn-primary" :to="{ name: 'expert-application' }">Mở hồ sơ chuyên gia</router-link>
          </div>
          <article v-for="item in applications" :key="item.id" class="expert-review-item">
            <div class="expert-review-head">
              <div>
                <h3 class="expert-review-title">{{ item.degree || 'Hồ sơ chuyên gia' }}</h3>
                <p class="expert-review-sub">Nộp lúc {{ formatDateTime(item.created_at) }}</p>
              </div>
              <span class="expert-status-pill" :class="item.status">{{ labelForStatus(item.status) }}</span>
            </div>
            <div class="expert-review-meta">
              <div><strong>Họ tên:</strong> {{ item.full_name || '-' }}</div>
              <div><strong>Điện thoại:</strong> {{ item.phone || '-' }}</div>
              <div><strong>File:</strong> {{ item.credential_filename || '-' }}</div>
              <div><strong>Xem xét lúc:</strong> {{ item.reviewed_at ? formatDateTime(item.reviewed_at) : 'Chưa xem xét' }}</div>
            </div>
          </article>
        </div>
      </article>

      <aside class="expert-panel expert-rereview-box">
        <h2>Gửi lại bằng cấp / chứng chỉ</h2>
        <p>
          Khi profile chuyên gia của bạn đã hoạt động nhưng có bằng cấp, chứng chỉ hoặc tài liệu xác thực mới,
          bạn có thể gửi lại hồ sơ để admin xét duyệt lại mà không làm gián đoạn profile hiện hành.
        </p>

        <div class="expert-rereview-summary">
          <div v-if="!expert" class="expert-empty">
            <h3>Chưa có profile chuyên gia active</h3>
            <p>Khi hồ sơ đầu tiên được duyệt, bạn sẽ có thể dùng khu vực này để gửi lại chứng chỉ mới cho admin review.</p>
          </div>
          <template v-else>
            <div><span>Hồ sơ hiện hành</span><strong>{{ expert.full_name || '-' }}</strong></div>
            <div><span>Bằng cấp hiện tại</span><strong>{{ expert.degree || '-' }}</strong></div>
            <div><span>Chuyên môn</span><strong>{{ (expert.specialties || []).join(', ') || '-' }}</strong></div>
            <div><span>Kinh nghiệm</span><strong>{{ expert.experience_years || 0 }} năm</strong></div>
          </template>
        </div>

        <form v-if="showResubmitForm" @submit.prevent="submitResubmit">
          <div class="form-group">
            <label class="form-label" for="rereviewCredentialFile">File mới để xét duyệt lại</label>
            <input ref="rereviewFileInput" type="file" id="rereviewCredentialFile" class="form-input" accept=".pdf,image/*,.doc,.docx,application/pdf" required>
            <div class="field-hint">Hệ thống sẽ dùng hồ sơ chuyên gia hiện tại của bạn và gắn file mới để admin review lại.</div>
          </div>

          <button type="submit" class="btn-primary" style="width:100%;" :disabled="submitting">{{ submitLabel }}</button>
        </form>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useExpertPortalStore } from '../../stores/expertPortal';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';

const router = useRouter();
const auth = useAuthStore();
const expertPortal = useExpertPortalStore();

const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

const applicationState = ref(null);
const overviewState = ref(null);
const applications = computed(() => applicationState.value?.applications || []);
const expert = computed(() => overviewState.value?.expert || null);
const showResubmitForm = ref(false);
const submitting = ref(false);
const rereviewFileInput = ref(null);
const submitLabel = computed(() => (submitting.value ? 'Đang gửi xét duyệt lại...' : 'Gửi lại để xét duyệt'));

function formatDateTime(value) {
  if (!value) return 'Chưa có lịch';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function labelForStatus(status) {
  switch (status) {
    case 'approved': return 'Đã duyệt';
    case 'pending': return 'Chờ duyệt';
    case 'rejected': return 'Từ chối';
    default: return status || 'Không rõ';
  }
}

function renderHistory() {
  if (!applicationState.value?.email_verified) {
    setBanner('Bạn cần xác minh email trước khi theo dõi hoặc gửi lại hồ sơ xét duyệt.', 'info');
  } else if (applications.value[0]?.status === 'pending') {
    setBanner('Hiện đang có một hồ sơ chờ admin duyệt. Bạn chưa thể gửi thêm một hồ sơ khác cho tới khi hồ sơ này có kết quả.', 'info');
  } else if (applicationState.value?.has_expert_profile) {
    setBanner('Bạn đang có profile chuyên gia hoạt động. Nếu cần cập nhật chứng chỉ/bằng cấp mới, hãy gửi lại hồ sơ xét duyệt từ panel bên phải.', 'success');
  } else {
    setBanner('Lịch sử xét duyệt sẽ xuất hiện tại đây sau khi bạn gửi hồ sơ chuyên gia đầu tiên.', 'info');
  }

  const latest = applications.value[0];
  showResubmitForm.value = !!(applicationState.value?.email_verified && expert.value && latest?.status !== 'pending');
}

async function submitResubmit() {
  const file = rereviewFileInput.value?.files?.[0];
  if (!file) {
    setBanner('Vui lòng chọn file bằng cấp/chứng chỉ mới để gửi xét duyệt lại.', 'error');
    return;
  }

  submitting.value = true;
  try {
    const e = expert.value;
    const formData = new FormData();
    formData.set('full_name', e.full_name || '');
    formData.set('phone', e.phone || '');
    formData.set('degree', e.degree || '');
    formData.set('specialties', JSON.stringify(e.specialties || []));
    formData.set('experience_years', String(e.experience_years || 0));
    formData.set('location', e.location || '');
    formData.set('bio', e.bio || '');
    formData.set('credential_file', file);

    await auth.submitExpertApplication(formData);
    expertPortal.invalidate();
    setBanner('Đã gửi hồ sơ xét duyệt lại thành công. Admin sẽ xem xét bản bằng cấp/chứng chỉ mới trong khi profile hiện tại của bạn vẫn hoạt động.', 'success');
    showResubmitForm.value = false;
  } catch (error) {
    setBanner(error.message || 'Không thể gửi hồ sơ xét duyệt lại.', 'error');
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    const { application, overview } = await expertPortal.load();
    applicationState.value = application;
    overviewState.value = overview;
    if (!overview?.expert) {
      router.replace('/expert-apply');
      return;
    }
    renderHistory();
  } catch (error) {
    console.error('Review status load failed:', error);
    setBanner('Không thể tải lịch sử xét duyệt lúc này.', 'error');
  }
});
</script>

<style scoped src="../../assets/expertReviewStatus.css"></style>
