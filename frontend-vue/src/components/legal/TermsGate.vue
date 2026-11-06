<template>
  <Teleport to="body">
    <div v-if="open" class="lg-dialog-overlay lg-gate">
      <div class="lg-dialog" role="dialog" aria-modal="true" aria-labelledby="lg-gate-title">
        <div class="lg-gate-body">
          <h2 id="lg-gate-title" class="lg-gate-title">{{ updated ? t('legal.gate.titleUpdated') : t('legal.gate.titleNew') }}</h2>
          <p class="lg-gate-intro">{{ updated ? t('legal.gate.introUpdated') : t('legal.gate.introNew') }}</p>

          <div class="lg-consent" style="margin-top:0;">
            <p class="lg-consent-title">{{ t('legal.gate.summaryTitle') }}</p>
            <ul class="lg-consent-points">
              <li>{{ t('legal.gate.s1') }}</li>
              <li>{{ t('legal.gate.s2') }}</li>
              <li>{{ t('legal.gate.s3') }}</li>
            </ul>
            <button type="button" class="lg-link" @click="showTerms = true">{{ t('legal.readFull') }}</button>
          </div>

          <label class="lg-check">
            <input v-model="agreeTerms" type="checkbox">
            <span>
              {{ t('legal.signup.termsPrefix') }}
              <button type="button" class="lg-link" @click.prevent="showTerms = true">{{ t('legal.termsName') }}</button>
              {{ t('legal.signup.and') }}
              <a class="lg-link" href="/privacy-policy.html" target="_blank" rel="noopener">{{ t('legal.privacyName') }}</a>
              {{ t('legal.signup.termsSuffix') }}
            </span>
          </label>
          <label class="lg-check">
            <input v-model="ageConfirmed" type="checkbox">
            <span>{{ t('legal.signup.age') }}</span>
          </label>
          <!-- Đồng ý xử lý Dữ liệu sức khỏe: tách riêng, không bắt buộc (Điều 7.1–7.2) -->
          <label class="lg-check">
            <input v-model="sensitiveData" type="checkbox">
            <span>{{ t('legal.signup.sensitive') }}<span class="lg-check-hint">{{ t('legal.signup.sensitiveHint') }}</span></span>
          </label>
          <p v-if="error" class="lg-consent-error" role="alert">{{ error }}</p>
        </div>
        <div class="lg-gate-actions">
          <button type="button" class="lg-btn" :disabled="saving" @click="logout">{{ t('legal.gate.logout') }}</button>
          <button type="button" class="lg-btn lg-btn-primary" :disabled="!agreeTerms || !ageConfirmed || saving" @click="accept">
            {{ saving ? t('legal.gate.saving') : t('legal.gate.accept') }}
          </button>
        </div>
      </div>
    </div>
    <TermsDialog v-if="showTerms" @close="showTerms = false" />
  </Teleport>
</template>

<script setup>
// Bắt khách hàng đã có tài khoản đồng ý điều khoản hiện hành nếu chưa có bằng chứng đồng ý:
// tài khoản tạo bằng Google (không qua form đăng ký), tài khoản cũ trước khi có điều khoản này,
// hoặc khi điều khoản đổi phiên bản (Điều 12). Chỉ áp dụng cho Khách hàng, không áp dụng chuyên gia/admin.
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/auth';
import { TERMS_VERSION } from '../../lib/legalTerms';
import TermsDialog from './TermsDialog.vue';
import '../../assets/legal.css';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const open = ref(false);
const updated = ref(false);
const agreeTerms = ref(false);
const ageConfirmed = ref(false);
const sensitiveData = ref(false);
const saving = ref(false);
const error = ref('');
const showTerms = ref(false);

async function check() {
  const role = auth.user?.role;
  if (!auth.isAuthenticated || (role && role !== 'user')) { open.value = false; return; }
  try {
    const s = await apiClient.get('/consents/status', { noCache: true });
    if (s && !s.termsAccepted) {
      updated.value = !!s.termsAcceptedAt;
      sensitiveData.value = !!s.sensitiveData;
      open.value = true;
    }
  } catch (_e) {
    // Lỗi mạng / server chưa chạy migration: không chặn người dùng, lần mở app sau sẽ hỏi lại.
  }
}

async function accept() {
  saving.value = true;
  error.value = '';
  try {
    await apiClient.post('/consents/accept', {
      version: TERMS_VERSION, terms: true, age_confirmed: true, sensitive_data: sensitiveData.value
    });
    open.value = false;
  } catch (e) {
    error.value = e?.message || t('legal.gate.saveFailed');
  } finally {
    saving.value = false;
  }
}

async function logout() {
  try { await auth.logout(); } catch (_e) { /* vẫn rời trang */ }
  open.value = false;
  router.push('/login');
}

watch(() => [auth.isAuthenticated, auth.user?.id], check, { immediate: true });
</script>
