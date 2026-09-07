<template>
  <div class="auth-container">
    <div class="paper-card auth-card">
      <div class="auth-logo">🌿</div>
      <h1 class="auth-title">{{ t('login.title') }}</h1>
      <p class="auth-subtitle">{{ t('login.subtitle') }}</p>

      <div v-if="message" :class="['auth-message', messageType]" v-html="message"></div>

      <!-- Google đặt LÊN TRƯỚC form email: không phụ thuộc email xác nhận nên vào được
           ngay, kể cả khi hạn mức gửi mail đã cạn (sự cố 29/08/2026).
           Google chặn OAuth trong WebView nhúng (app mobile) nên bản native phải dùng
           SDK riêng (Credential Manager) thay cho nút SDK JS của web. -->
      <button
        v-if="isNativeApp"
        type="button"
        class="btn-google-native"
        :disabled="nativeGoogleLoading"
        @click="handleNativeGoogleLogin"
      >
        <span v-if="nativeGoogleLoading">{{ t('login.googleOpening') }}</span>
        <span v-else>{{ t('login.googleButton') }}</span>
      </button>
      <div v-else id="btnGoogleLogin" ref="googleBtnEl" style="display:flex;justify-content:center;"></div>
      <p class="auth-google-hint">{{ t('login.googleHint') }}</p>

      <div class="divider" style="margin:18px 0;">{{ t('login.dividerEmail') }}</div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">{{ t('login.emailLabel') }}</label>
          <input v-model="email" type="email" class="form-input" :placeholder="t('login.emailPlaceholder')" required autocomplete="email">
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <label class="form-label">{{ t('login.passwordLabel') }}</label>
          <input v-model="password" type="password" class="form-input" :placeholder="t('login.passwordPlaceholder')" required autocomplete="current-password">
        </div>
        <div style="text-align:right;margin-bottom:16px;">
          <router-link to="/forgot-password" style="font-size:0.82rem;color:var(--text-light);">{{ t('login.forgotPassword') }}</router-link>
        </div>
        <button type="submit" class="btn-secondary-auth" :disabled="submitting">
          {{ submitting ? t('login.submitting') : t('login.submit') }}
        </button>
      </form>

      <div class="auth-links">
        {{ t('login.noAccount') }} <router-link to="/signup">{{ t('login.signupNow') }}</router-link>
      </div>
      <div class="auth-links" style="margin-top: 10px;">
        <router-link to="/" style="color: var(--text-light); font-weight: normal;">&larr; {{ t('login.backHome') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/apiClient';
import { goToLegacyPage, resolveAppRedirect } from '../lib/legacyApp';
import { isNativeApp } from '../lib/native';
import { getCurrentLocale } from '../locales';

const GOOGLE_CLIENT_ID = '287402483358-uiec013q9obn1m8j82ejhkdmuoi3ku6v.apps.googleusercontent.com';
const nativeGoogleLoading = ref(false);

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

function redirectTo(pageSpec) {
  const resolved = resolveAppRedirect(pageSpec);
  if (resolved.internal) router.push(resolved.path);
  else goToLegacyPage(resolved.page);
}

const email = ref('');
const password = ref('');
const submitting = ref(false);
const message = ref('');
const messageType = ref('info');
const googleBtnEl = ref(null);

function showMessage(text, type = 'info') {
  message.value = text;
  messageType.value = type;
}

function escapeHtml(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Trả về KEY để dịch (t(key)) thay vì chuỗi hiển thị cứng — phần SO KHỚP vẫn phải dựa vào
// nguyên văn tiếng Việt backend trả về, vì backend hiện chỉ nói tiếng Việt (chưa nằm trong
// phạm vi đợt dịch này). Người dùng chọn tiếng Anh vẫn thấy lỗi hiển thị đúng tiếng Anh nhờ
// bước dịch key này — chỉ riêng nhánh "không nhận diện được" (fallback cuối) là hiển thị
// nguyên văn tiếng Việt từ backend, vì không có gì để dịch.
function getLoginErrorKey(error) {
  const msg = String(error?.message || '').trim();

  if (msg === 'Account not found' || msg === 'Không tìm thấy tài khoản.') return 'login.errors.accountNotFound';
  if (msg === 'Incorrect password' || msg === 'Sai mật khẩu.') return 'login.errors.wrongPassword';
  if (msg === 'Account is inactive' || msg === 'Tài khoản hiện đang bị vô hiệu hóa.') return 'login.errors.accountInactive';
  if (msg === 'EMAIL_NOT_VERIFIED') return '__EMAIL_NOT_VERIFIED__';
  if (msg === 'GOOGLE_ACCOUNT') return '__GOOGLE_ACCOUNT__';
  if (msg === 'Hồ sơ chuyên gia của bạn đang chờ admin duyệt.') return '__EXPERT_PENDING__';
  if (msg === 'Invalid email or password') return 'login.errors.invalidCredentials';

  return msg ? `__RAW__${msg}` : 'login.errors.loginFailed';
}

// Chuyển key ở trên thành chuỗi hiển thị thật — tách riêng khỏi getLoginErrorKey() vì các
// nhánh đặc biệt (__EMAIL_NOT_VERIFIED__...) cần lắp thêm HTML, không chỉ dịch đơn thuần.
function resolveErrorDisplay(key) {
  if (key.startsWith('__RAW__')) {
    // message.value được render qua v-html (nhánh __EMAIL_NOT_VERIFIED__ cần chèn link
    // resend-verify) — escape để phòng backend sau này phản chiếu input người dùng.
    return escapeHtml(key.slice('__RAW__'.length));
  }
  return t(key);
}

function getPostLoginRedirect() {
  const target = sessionStorage.getItem('peaceflow_post_login_redirect');
  if (!target || target.includes('login')) return 'dashboard.html';
  return target;
}

async function redirectAfterLogin() {
  sessionStorage.removeItem('peaceflow_post_login_redirect');
  sessionStorage.removeItem('peaceflow_last_login_redirect_at');

  const user = auth.user;
  if (user?.role === 'expert') {
    try {
      const expertState = await auth.getMyExpertApplication();
      if (expertState?.has_expert_profile || expertState?.application?.status === 'approved') {
        router.push({ name: 'expert-dashboard' });
        return;
      }
    } catch (e) {
      console.error('Expert application check failed:', e.message);
    }
  }

  const onboardingDone = localStorage.getItem('peaceflow_onboarding_done');
  if (onboardingDone) {
    redirectTo(getPostLoginRedirect());
    return;
  }

  try {
    const res = await apiClient.get('/profile');
    const hasOnboarded = res?.onboarding_answers != null;
    if (hasOnboarded) {
      localStorage.setItem('peaceflow_onboarding_done', '1');
      redirectTo(getPostLoginRedirect());
      return;
    }
  } catch (e) {
    console.error('Profile check failed:', e.message);
    redirectTo(getPostLoginRedirect());
    return;
  }

  router.push({ name: 'onboarding' });
}

async function handleGoogleCredential(response) {
  showMessage(t('login.authenticatingGoogle'), 'info');
  try {
    await auth.loginWithGoogle(response.credential);
    showMessage(t('login.success'), 'success');
    setTimeout(() => redirectAfterLogin(), 700);
  } catch (err) {
    showMessage(err.message ? escapeHtml(err.message) : t('login.errors.googleLoginFailed'), 'error');
  }
}

// App mobile: chọn tài khoản Google qua Credential Manager của hệ thống (không qua
// WebView) rồi lấy idToken gửi lên backend — cùng API loginWithGoogle như bản web.
async function handleNativeGoogleLogin() {
  if (nativeGoogleLoading.value) return;
  nativeGoogleLoading.value = true;
  showMessage('');
  try {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    await SocialLogin.initialize({ google: { webClientId: GOOGLE_CLIENT_ID } });
    // Không truyền "scopes" — plugin đã tự thêm sẵn email/profile/openid cho mọi lượt
    // đăng nhập; tự truyền scopes riêng sẽ bắt phải sửa MainActivity, không cần thiết.
    const res = await SocialLogin.login({ provider: 'google' });
    const idToken = res?.result?.idToken;
    if (!idToken) {
      throw new Error(t('login.errors.noGoogleCredential'));
    }
    await handleGoogleCredential({ credential: idToken });
  } catch (err) {
    const cancelled = /cancel/i.test(err?.message || '') || /cancel/i.test(String(err?.code || ''));
    if (!cancelled) {
      showMessage(err?.message ? escapeHtml(err.message) : t('login.errors.googleLoginFailed'), 'error');
    }
  } finally {
    nativeGoogleLoading.value = false;
  }
}

async function handleSubmit() {
  showMessage('');

  const emailValue = email.value.trim().toLowerCase();
  const passwordValue = password.value;

  if (!emailValue) {
    showMessage(t('login.errors.pleaseEnterEmail'), 'error');
    return;
  }
  if (!passwordValue) {
    showMessage(t('login.errors.pleaseEnterPassword'), 'error');
    return;
  }

  submitting.value = true;

  try {
    await auth.login(emailValue, passwordValue);
    showMessage(t('login.success'), 'success');
    setTimeout(() => redirectAfterLogin(), 700);
  } catch (err) {
    const errKey = getLoginErrorKey(err);
    if (errKey === '__GOOGLE_ACCOUNT__') {
      messageType.value = 'info';
      message.value = [
        `${t('login.googleAccountLine1')}<br>`,
        `<span style="font-size:0.85rem;">${t('login.googleAccountLine2')}</span>`
      ].join('');
    } else if (errKey === '__EMAIL_NOT_VERIFIED__') {
      messageType.value = 'info';
      message.value = `${t('login.emailNotVerifiedTitle')}<br>
        <span style="font-size:0.85rem;">${t('login.emailNotVerifiedHint')}
        <a href="#" id="resendVerify" style="color:var(--mint-dark);font-weight:700;">${t('login.resendLink')}</a></span>`;
      setTimeout(() => {
        document.getElementById('resendVerify')?.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await apiClient.post('/auth/resend-verification', { email: emailValue });
            e.target.textContent = t('login.resendSent');
          } catch (_) {}
        });
      }, 0);
    } else if (errKey === '__EXPERT_PENDING__') {
      showMessage(t('login.errors.expertPending'), 'info');
    } else {
      showMessage(resolveErrorDisplay(errKey), 'error');
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  if (route.query.verified === '1') {
    showMessage(t('login.emailVerifiedNotice'), 'success');
  }

  const authenticated = await auth.waitForAuth();
  if (authenticated) {
    redirectAfterLogin();
    return;
  }

  if (isNativeApp) return;

  window.handleCredentialResponse = handleGoogleCredential;

  const initGoogle = () => {
    if (!window.google?.accounts) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    const width = Math.min(googleBtnEl.value?.offsetWidth || 360, 360);
    window.google.accounts.id.renderButton(googleBtnEl.value, {
      theme: 'outline',
      size: 'large',
      width,
      text: 'signin_with',
      shape: 'pill',
      locale: getCurrentLocale()
    });
  };

  if (window.google?.accounts) {
    initGoogle();
  } else {
    window.addEventListener('load', initGoogle, { once: true });
  }
});
</script>

<style scoped>
.btn-google-native {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 16px;
  border: 2px solid var(--mint-dark, #7BBF95);
  border-radius: 999px;
  background: var(--mint, #A8D5BA);
  color: var(--text-primary);
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-google-native:hover:not(:disabled) {
  background: var(--mint-dark, #7BBF95);
}
.btn-google-native:disabled {
  opacity: 0.7;
  cursor: default;
}
.auth-google-hint {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: var(--text-light);
  text-align: center;
}
/* Đăng nhập bằng email giờ là lựa chọn phụ — làm nhạt hơn nút Google để hướng người
   dùng sang cách không phụ thuộc email xác nhận. */
.btn-secondary-auth {
  width: 100%;
  padding: 11px 16px;
  border: 1.5px solid var(--kraft-light, #d9c9a8);
  border-radius: 999px;
  background: var(--warm-white);
  color: var(--text-secondary, #7a6555);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-secondary-auth:hover:not(:disabled) {
  background: var(--cream);
}
.btn-secondary-auth:disabled {
  opacity: 0.7;
  cursor: default;
}
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--cream) 0%, var(--mint-light) 100%);
  padding: 20px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  text-align: center;
  background: var(--warm-white);
}
.auth-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--mint);
  border-radius: var(--radius-sm);
  border: 2px solid var(--mint-dark);
  font-size: 1.8rem;
  box-shadow: 3px 3px 0 var(--mint-dark);
  margin-bottom: 20px;
}
.auth-title {
  font-size: 1.5rem;
  margin-bottom: 8px;
}
.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 24px;
}
.auth-form {
  text-align: left;
}
.auth-links {
  margin-top: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.auth-links a {
  color: var(--mint-dark);
  font-weight: 700;
}
.auth-message {
  display: block;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  margin-bottom: 15px;
  border: 1px solid transparent;
  line-height: 1.5;
}
.auth-message.error   { color:#8A2F2F; background:#FFE3E3; border-color:#FFB8B8; }
.auth-message.success { color:var(--mint-dark); background:var(--mint-light); border-color:var(--mint); }
.auth-message.info    { color:#6B5B2A; background:#FFF4CC; border-color:#FFE08A; }
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: var(--text-light);
  font-size: 0.85rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px dashed var(--kraft-light);
}
.divider:not(:empty)::before { margin-right: .5em; }
.divider:not(:empty)::after { margin-left: .5em; }
</style>
