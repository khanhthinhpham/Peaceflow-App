<template>
  <main class="admin-main">
    <div class="admin-page-head">
      <p class="admin-page-kicker">PeaceFlow Admin</p>
      <h1 class="admin-page-title">Gửi thông báo hàng loạt</h1>
      <p class="admin-page-sub">Gửi trực tiếp qua chuông thông báo + push trong app (không giới hạn số lượng). Email chỉ nên dùng cho nhóm nhỏ vì quota rất hạn chế.</p>
    </div>

    <div class="admin-card" style="max-width:640px;">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Gửi cho</label>
          <select v-model="audience" class="admin-input" style="width:100%;">
            <option value="all">Tất cả người dùng</option>
            <option value="user">Chỉ người dùng thường</option>
            <option value="expert">Chỉ chuyên gia</option>
          </select>
          <div style="font-size:0.78rem;color:var(--text-light);margin-top:6px;">
            {{ audienceLoading ? 'Đang đếm...' : `${audienceCount ?? '?'} người sẽ nhận được thông báo.` }}
          </div>
        </div>

        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Tiêu đề thông báo</label>
          <input v-model="title" type="text" class="admin-input" style="width:100%;" placeholder="VD: PeaceFlow có tính năng mới!">
        </div>

        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Nội dung</label>
          <textarea v-model="message" rows="5" class="admin-input" style="width:100%;font-family:inherit;" placeholder="Nội dung thông báo..."></textarea>
        </div>

        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Dẫn tới trang (khi bấm vào thông báo)</label>
          <input v-model="actionUrl" type="text" class="admin-input" style="width:100%;" placeholder="/dashboard">
        </div>

        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <input v-model="sendEmail" type="checkbox">
          Gửi kèm email
        </label>
        <div v-if="sendEmail" class="admin-card" style="background:rgba(255,193,7,.1);border-color:rgba(255,193,7,.4);padding:12px 14px;font-size:0.8rem;color:#8a6d00;">
          ⚠️ Quota email dùng chung toàn app chỉ ~400/ngày (kể cả mail xác nhận đăng ký, quên mật khẩu...).
          {{ audienceCount != null && emailSafeLimit != null && audienceCount > emailSafeLimit
            ? `Chỉ ${emailSafeLimit} người đầu tiên nhận được email lần này, ${audienceCount - emailSafeLimit} người còn lại sẽ KHÔNG nhận email (vẫn nhận thông báo trong app).`
            : 'Số người nhận hiện tại nằm trong giới hạn an toàn.' }}
        </div>

        <div v-if="resultMsg" class="admin-card" style="background:rgba(120,200,150,.12);border-color:rgba(120,200,150,.4);padding:12px 14px;font-size:0.85rem;">{{ resultMsg }}</div>
        <div v-if="errorMsg" style="color:var(--coral);font-size:0.85rem;">{{ errorMsg }}</div>

        <button type="button" class="btn-primary" :disabled="sending || !title.trim() || !message.trim()" @click="send">
          {{ sending ? 'Đang gửi...' : '📣 Gửi thông báo' }}
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';

const audience = ref('all');
const audienceCount = ref(null);
const emailSafeLimit = ref(null);
const audienceLoading = ref(false);

const title = ref('');
const message = ref('');
const actionUrl = ref('/dashboard');
const sendEmail = ref(false);
const sending = ref(false);
const resultMsg = ref('');
const errorMsg = ref('');

async function loadAudienceCount() {
  audienceLoading.value = true;
  try {
    const data = await apiClient.get(`/admin/broadcast/audience?audience=${audience.value}`, { noCache: true });
    audienceCount.value = data?.count ?? null;
    emailSafeLimit.value = data?.emailSafeLimit ?? null;
  } catch (_e) {
    audienceCount.value = null;
  } finally {
    audienceLoading.value = false;
  }
}

async function send() {
  if (!window.confirm(`Gửi thông báo cho ${audienceCount ?? '?'} người dùng? Hành động này không thể huỷ giữa chừng.`)) return;
  sending.value = true;
  resultMsg.value = '';
  errorMsg.value = '';
  try {
    const data = await apiClient.post('/admin/broadcast', {
      title: title.value.trim(),
      message: message.value.trim(),
      audience: audience.value,
      actionUrl: actionUrl.value.trim() || '/dashboard',
      sendEmail: sendEmail.value
    });
    resultMsg.value = `Đã gửi thông báo cho ${data.targetCount} người dùng.` + (sendEmail.value ? ` Email đang gửi nền cho tối đa ${data.emailTargetCount} người (kiểm tra log server để biết kết quả chi tiết).` : '');
    title.value = '';
    message.value = '';
  } catch (e) {
    errorMsg.value = e.message || 'Gửi thất bại.';
  } finally {
    sending.value = false;
  }
}

watch(audience, loadAudienceCount);
onMounted(loadAudienceCount);
</script>
