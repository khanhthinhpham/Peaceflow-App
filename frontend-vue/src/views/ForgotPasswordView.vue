<template>
  <div class="auth-container">
    <div class="paper-card auth-card">
      <div class="auth-logo">🔐</div>
      <h1 style="font-size:1.4rem;margin-bottom:8px;">Quên mật khẩu?</h1>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:24px;">Nhập email và chúng tôi sẽ gửi link đặt lại mật khẩu.</p>

      <div v-if="message" :class="['auth-message', messageType]">{{ message }}</div>

      <form v-if="!sent" style="text-align:left;" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-input" placeholder="Nhập email của bạn" required autocomplete="email">
        </div>
        <button type="submit" class="btn-primary" style="width:100%;font-size:1rem;padding:12px;margin-top:8px;" :disabled="submitting">
          {{ submitting ? 'Đang gửi...' : 'Gửi link đặt lại' }}
        </button>
      </form>

      <div class="auth-links">
        <router-link to="/login">← Quay lại đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiClient } from '../lib/apiClient';

const email = ref('');
const submitting = ref(false);
const sent = ref(false);
const message = ref('');
const messageType = ref('error');

async function handleSubmit() {
  submitting.value = true;
  try {
    await apiClient.post('/auth/forgot-password', { email: email.value.trim().toLowerCase() });
    message.value = 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.';
    messageType.value = 'success';
    sent.value = true;
  } catch (err) {
    message.value = err.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
    messageType.value = 'error';
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
.auth-links { margin-top: 20px; font-size: 0.85rem; color: var(--text-secondary); }
.auth-links a { color: var(--mint-dark); font-weight: 700; }
</style>
