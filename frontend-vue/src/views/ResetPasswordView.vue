<template>
  <div class="auth-container">
    <div class="paper-card auth-card">
      <div class="auth-logo">🔑</div>
      <h1 style="font-size:1.4rem;margin-bottom:8px;">{{ t('resetPassword.title') }}</h1>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:24px;">{{ t('resetPassword.subtitle') }}</p>

      <div v-if="message" :class="['auth-message', messageType]">{{ message }}</div>
      <div v-if="invalidToken" style="color:var(--coral-dark);text-align:center;">
        {{ t('resetPassword.invalidToken.text') }}<br>
        <router-link to="/forgot-password" style="color:var(--mint-dark);font-weight:700;">{{ t('resetPassword.invalidToken.requestNewLink') }}</router-link>
      </div>

      <form v-if="token && !invalidToken && !done" style="text-align:left;" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">{{ t('resetPassword.form.newPasswordLabel') }}</label>
          <input v-model="password" type="password" class="form-input" :placeholder="t('resetPassword.form.newPasswordPlaceholder')" required minlength="8" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('resetPassword.form.confirmPasswordLabel') }}</label>
          <input v-model="confirmPassword" type="password" class="form-input" :placeholder="t('resetPassword.form.confirmPasswordPlaceholder')" required minlength="8" autocomplete="new-password">
        </div>
        <button type="submit" class="btn-primary" style="width:100%;font-size:1rem;padding:12px;margin-top:8px;" :disabled="submitting">
          {{ submitting ? t('resetPassword.form.submitting') : t('resetPassword.form.submitBtn') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

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
    message.value = t('resetPassword.messages.passwordMismatch');
    messageType.value = 'error';
    return;
  }

  submitting.value = true;
  try {
    await apiClient.post('/auth/reset-password', { token: token.value, password: password.value });
    message.value = t('resetPassword.messages.success');
    messageType.value = 'success';
    done.value = true;
    setTimeout(() => router.push('/login'), 2000);
  } catch (err) {
    // Backend luôn trả message tiếng Việt (không đổi theo ngôn ngữ UI) — so khớp chuỗi gốc để
    // phát hiện lỗi token hết hạn/không hợp lệ, không liên quan tới bản dịch hiển thị.
    if (err.message?.includes('hợp lệ') || err.message?.includes('hết hạn')) {
      invalidToken.value = true;
    } else {
      message.value = err.message || t('resetPassword.messages.genericError');
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
