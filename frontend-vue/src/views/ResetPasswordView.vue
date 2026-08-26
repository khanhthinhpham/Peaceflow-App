<template>
  <div class="auth-container">
    <div class="paper-card auth-card">
      <div class="auth-logo">🔑</div>
      <h1 style="font-size:1.4rem;margin-bottom:8px;">Đặt lại mật khẩu</h1>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:24px;">Tạo mật khẩu mới cho tài khoản của bạn.</p>

      <div v-if="message" :class="['auth-message', messageType]">{{ message }}</div>
      <div v-if="invalidToken" style="color:var(--coral-dark);text-align:center;">
        Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.<br>
        <router-link to="/forgot-password" style="color:var(--mint-dark);font-weight:700;">Yêu cầu link mới</router-link>
      </div>

      <form v-if="token && !invalidToken && !done" style="text-align:left;" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Mật khẩu mới</label>
          <input v-model="password" type="password" class="form-input" placeholder="Ít nhất 8 ký tự" required minlength="8" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">Xác nhận mật khẩu</label>
          <input v-model="confirmPassword" type="password" class="form-input" placeholder="Nhập lại mật khẩu" required minlength="8" autocomplete="new-password">
        </div>
        <button type="submit" class="btn-primary" style="width:100%;font-size:1rem;padding:12px;margin-top:8px;" :disabled="submitting">
          {{ submitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';

const route = useRoute();
const router = useRouter();

const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const submitting = ref(false);
const done = ref(false);
const invalidToken = ref(false);
const message = ref('');
const messageType = ref('error');

onMounted(() => {
  token.value = String(route.query.token || '');
  if (!token.value) invalidToken.value = true;
});

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    message.value = 'Mật khẩu xác nhận không khớp.';
    messageType.value = 'error';
    return;
  }

  submitting.value = true;
  try {
    await apiClient.post('/auth/reset-password', { token: token.value, password: password.value });
    message.value = 'Mật khẩu đã được đặt lại thành công!';
    messageType.value = 'success';
    done.value = true;
    setTimeout(() => router.push('/login'), 2000);
  } catch (err) {
    if (err.message?.includes('hợp lệ') || err.message?.includes('hết hạn')) {
      invalidToken.value = true;
    } else {
      message.value = err.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      messageType.value = 'error';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--cream) 0%, var(--mint-light) 100%); padding: 20px; }
.auth-card { width: 100%; max-width: 400px; padding: 40px 30px; text-align: center; background: var(--warm-white); }
.auth-logo { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: var(--mint); border-radius: var(--radius-sm); border: 2px solid var(--mint-dark); font-size: 1.8rem; box-shadow: 3px 3px 0px var(--mint-dark); margin-bottom: 20px; }
.auth-message { display: block; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 0.9rem; margin-bottom: 16px; border: 1px solid transparent; }
.auth-message.error { color: #8A2F2F; background: #FFE3E3; border-color: #FFB8B8; }
.auth-message.success { color: var(--mint-dark); background: var(--mint-light); border-color: var(--mint); }
</style>
