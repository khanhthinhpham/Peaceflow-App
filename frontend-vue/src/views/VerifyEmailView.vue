<template>
  <div class="auth-container">
    <div class="paper-card auth-card">
      <div class="result-icon">{{ icon }}</div>
      <h1 style="font-size:1.4rem;margin-bottom:8px;">{{ title }}</h1>
      <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">{{ desc }}</p>
      <div style="margin-top:24px;">
        <router-link v-if="verified" to="/login?verified=1" class="btn-primary" style="display:inline-block;padding:10px 24px;">Đăng nhập ngay →</router-link>
        <form v-else-if="showResend" style="display:flex;flex-direction:column;gap:10px;" @submit.prevent="handleResend">
          <input v-model="resendEmail" type="email" required placeholder="Email bạn đã đăng ký" style="padding:10px 14px;border:1px solid var(--mint-light);border-radius:8px;font:inherit;">
          <button type="submit" class="btn-primary" style="padding:10px 24px;" :disabled="resending">{{ resending ? 'Đang gửi...' : 'Gửi lại email xác nhận' }}</button>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">{{ resendMsg }}</p>
          <router-link to="/login" style="font-size:0.85rem;">Về trang đăng nhập</router-link>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '../lib/apiClient';

const FAILURE_TEXT = {
  TOKEN_EXPIRED: 'Link xác nhận đã hết hạn (24 giờ). Hãy nhập email để nhận link mới.',
  TOKEN_USED: 'Link này đã được dùng rồi. Nếu bạn chưa kích hoạt được, hãy nhập email để nhận link mới.',
  TOKEN_INVALID: 'Link xác nhận không hợp lệ. Hãy kiểm tra lại hoặc nhập email để nhận link mới.'
};

const route = useRoute();

const icon = ref('⏳');
const title = ref('Đang xác nhận...');
const desc = ref('Vui lòng chờ trong giây lát.');
const verified = ref(false);
const showResend = ref(false);
const resendEmail = ref('');
const resending = ref(false);
const resendMsg = ref('');

function showFailure(code) {
  icon.value = '❌';
  title.value = 'Xác nhận thất bại';
  desc.value = FAILURE_TEXT[code] || 'Không xác nhận được email. Hãy nhập email để nhận link mới.';
  showResend.value = true;
}

async function verify() {
  const token = route.query.token;
  if (!token) {
    icon.value = '❌';
    title.value = 'Link không hợp lệ';
    desc.value = 'Không tìm thấy token xác nhận trong link này. Hãy nhập email để nhận link mới.';
    showResend.value = true;
    return;
  }

  try {
    const data = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`, { noCache: true });
    icon.value = '✅';
    title.value = data?.already_verified ? 'Email đã được xác nhận trước đó' : 'Email đã được xác nhận!';
    desc.value = 'Tài khoản đã kích hoạt. Hãy đăng nhập để bắt đầu hành trình.';
    verified.value = true;
  } catch (err) {
    showFailure(String(err?.message || ''));
  }
}

async function handleResend() {
  resending.value = true;
  resendMsg.value = '';
  const email = resendEmail.value.trim().toLowerCase();
  try {
    await apiClient.post('/auth/resend-verification', { email });
    resendMsg.value = `Nếu ${email} đã đăng ký và chưa xác minh, link mới đã được gửi. Hãy kiểm tra cả hộp thư rác.`;
  } catch (err) {
    resendMsg.value = err?.message || 'Không gửi được email. Vui lòng thử lại sau.';
  } finally {
    resending.value = false;
  }
}

onMounted(() => {
  verify();
});
</script>

<style scoped>
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--cream) 0%, var(--mint-light) 100%); padding: 20px; }
.auth-card { width: 100%; max-width: 400px; padding: 48px 30px; text-align: center; background: var(--warm-white); }
.result-icon { font-size: 3rem; margin-bottom: 16px; }
</style>
