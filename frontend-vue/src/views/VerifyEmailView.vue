<template>
  <div class="auth-container">
    <div class="paper-card auth-card">
      <div class="result-icon">{{ icon }}</div>
      <h1 style="font-size:1.4rem;margin-bottom:8px;">{{ title }}</h1>
      <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">{{ desc }}</p>
      <div style="margin-top:24px;">
        <router-link v-if="verified" to="/login?verified=1" class="btn-primary" style="display:inline-block;padding:10px 24px;">{{ t('verifyEmail.loginNowBtn') }}</router-link>
        <form v-else-if="showResend" style="display:flex;flex-direction:column;gap:10px;" @submit.prevent="handleResend">
          <input v-model="resendEmail" type="email" required :placeholder="t('verifyEmail.emailPlaceholder')" style="padding:10px 14px;border:1px solid var(--mint-light);border-radius:8px;font:inherit;">
          <button type="submit" class="btn-primary" style="padding:10px 24px;" :disabled="resending">{{ resending ? t('verifyEmail.resending') : t('verifyEmail.resendBtn') }}</button>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">{{ resendMsg }}</p>
          <router-link to="/login" style="font-size:0.85rem;">{{ t('verifyEmail.backToLogin') }}</router-link>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';

const route = useRoute();
const { t } = useI18n();

const KNOWN_FAILURE_CODES = ['TOKEN_EXPIRED', 'TOKEN_USED', 'TOKEN_INVALID'];

// Trạng thái thuần (không phải chuỗi đã dịch) — icon/title/desc computed từ đây, tránh kẹt bản
// dịch cũ nếu người dùng đổi ngôn ngữ trong lúc trang đang ở một trạng thái nhất định.
const status = ref({ kind: 'verifying' }); // 'verifying' | 'noToken' | 'success' | 'failure'
const verified = ref(false);
const showResend = ref(false);
const resendEmail = ref('');
const resending = ref(false);
const resendMsgKey = ref('');
const resendMsgParams = ref({});
const resendMsgRaw = ref(''); // dùng khi backend trả message riêng (không có khoá dịch tương ứng)
const resendMsg = computed(() => (resendMsgKey.value ? t(resendMsgKey.value, resendMsgParams.value) : resendMsgRaw.value));

const icon = computed(() => {
  if (status.value.kind === 'verifying') return '⏳';
  if (status.value.kind === 'success') return '✅';
  return '❌';
});
const title = computed(() => {
  const s = status.value;
  if (s.kind === 'verifying') return t('verifyEmail.status.verifyingTitle');
  if (s.kind === 'noToken') return t('verifyEmail.status.noTokenTitle');
  if (s.kind === 'success') return s.alreadyVerified ? t('verifyEmail.status.successTitleAlready') : t('verifyEmail.status.successTitleFirst');
  return t('verifyEmail.status.failureTitle');
});
const desc = computed(() => {
  const s = status.value;
  if (s.kind === 'verifying') return t('verifyEmail.status.verifyingDesc');
  if (s.kind === 'noToken') return t('verifyEmail.status.noTokenDesc');
  if (s.kind === 'success') return t('verifyEmail.status.successDesc');
  if (s.kind === 'failure') {
    return KNOWN_FAILURE_CODES.includes(s.code)
      ? t(`verifyEmail.failureReasons.${s.code}`)
      : t('verifyEmail.status.failureDefault');
  }
  return '';
});

function showFailure(code) {
  status.value = { kind: 'failure', code };
  showResend.value = true;
}

async function verify() {
  const token = route.query.token;
  if (!token) {
    status.value = { kind: 'noToken' };
    showResend.value = true;
    return;
  }

  try {
    const data = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`, { noCache: true });
    status.value = { kind: 'success', alreadyVerified: Boolean(data?.already_verified) };
    verified.value = true;
  } catch (err) {
    showFailure(String(err?.message || ''));
  }
}

async function handleResend() {
  resending.value = true;
  resendMsgKey.value = '';
  resendMsgRaw.value = '';
  const email = resendEmail.value.trim().toLowerCase();
  try {
    await apiClient.post('/auth/resend-verification', { email });
    resendMsgKey.value = 'verifyEmail.resendMsg.success';
    resendMsgParams.value = { email };
  } catch (err) {
    if (err?.message) {
      resendMsgRaw.value = err.message;
    } else {
      resendMsgKey.value = 'verifyEmail.resendMsg.failed';
    }
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
