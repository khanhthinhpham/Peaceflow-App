<template>
  <div class="auth-container">
    <div class="paper-card auth-card" style="border-color: var(--peach);">
      <div class="auth-logo">🌸</div>
      <h1 class="auth-title">Bắt đầu hành trình</h1>
      <p class="auth-subtitle">
        Tạo tài khoản để lưu giữ nhật ký, tiến trình hồi phục
        và trải nghiệm cá nhân hóa cùng PeaceFlow.
      </p>

      <div v-if="message" :class="['auth-message', messageType]">
        {{ message }}
        <div v-if="showResend" style="margin-top:10px;">
          <button type="button" class="btn-primary" style="padding: 8px 18px;" :disabled="resending" @click="handleResend">
            {{ resending ? 'Đang gửi...' : 'Gửi lại email xác nhận' }}
          </button>
          <p style="font-size:0.85rem;margin:8px 0 0;">{{ resendNote }}</p>
        </div>
      </div>

      <!-- Google đặt LÊN TRƯỚC form email: tài khoản Google được xác thực email sẵn nên
           dùng được ngay, không phụ thuộc hạn mức gửi mail (sự cố 29/08/2026).
           Chỉ áp dụng cho tài khoản người dùng thường, không dùng cho chuyên gia.
           Bản app mobile phải dùng SDK native vì Google chặn OAuth trong WebView nhúng. -->
      <template v-if="!success && mode === 'user'">
        <button
          v-if="isNativeApp"
          type="button"
          class="btn-google-native"
          :disabled="nativeGoogleLoading"
          @click="handleNativeGoogleLogin"
        >
          <span v-if="nativeGoogleLoading">Đang mở Google...</span>
          <span v-else>Đăng ký với Google</span>
        </button>
        <div v-else ref="googleBtnEl" style="display:flex;justify-content:center;"></div>
        <p class="auth-google-hint">thuận tiện — Nhanh chóng</p>
        <div class="divider" style="margin:18px 0;">hoặc dùng email</div>
      </template>

      <form v-if="!success" class="auth-form" @submit.prevent="handleSubmit">
        <div class="account-toggle" aria-label="Loại tài khoản">
          <button type="button" :class="['toggle-chip', { active: mode === 'user' }]" @click="setMode('user')">Người dùng</button>
          <button type="button" :class="['toggle-chip', { active: mode === 'expert' }]" @click="setMode('expert')">Chuyên gia</button>
        </div>

        <div class="form-group">
          <label class="form-label" for="name">Tên hiển thị</label>
          <input v-model="name" type="text" id="name" class="form-input" placeholder="Bạn muốn được gọi là gì?" required maxlength="80" autocomplete="name">
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input v-model="email" type="email" id="email" class="form-input" placeholder="Nhập email của bạn" required autocomplete="email">
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Mật khẩu</label>
          <input v-model="password" type="password" id="password" class="form-input" placeholder="Tạo mật khẩu (ít nhất 8 ký tự)" required minlength="8" autocomplete="new-password">
          <div class="field-hint">Nên dùng ít nhất 8 ký tự, bao gồm chữ và số để tăng độ an toàn.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="confirmPassword">Xác nhận mật khẩu</label>
          <input v-model="confirmPassword" type="password" id="confirmPassword" class="form-input" placeholder="Nhập lại mật khẩu" required minlength="8" autocomplete="new-password">
        </div>

        <label class="checkbox-group">
          <input v-model="agreeTerms" type="checkbox" required>
          <span>
            Tôi đồng ý với
            <a href="#" @click.prevent="goToLegacyPage('terms.html')">Điều khoản sử dụng</a>
            và
            <a href="#" @click.prevent="goToLegacyPage('privacy.html')">Chính sách quyền riêng tư</a>
            của PeaceFlow.
          </span>
        </label>

        <button type="submit" class="btn-secondary-auth" :disabled="submitting">
          {{ submitting ? 'Đang tạo tài khoản...' : 'Đăng ký bằng email' }}
        </button>
      </form>

      <div class="auth-links">
        Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/apiClient';
import { goToLegacyPage } from '../lib/legacyApp';
import { isNativeApp } from '../lib/native';

const GOOGLE_CLIENT_ID = '287402483358-uiec013q9obn1m8j82ejhkdmuoi3ku6v.apps.googleusercontent.com';
const nativeGoogleLoading = ref(false);

const auth = useAuthStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreeTerms = ref(false);
const mode = ref('user');
const submitting = ref(false);
const resending = ref(false);
const message = ref('');
const messageType = ref('info');
const success = ref(false);
const showResend = ref(false);
const resendNote = ref('');
const googleBtnEl = ref(null);

function showMessage(text, type = 'info') {
  message.value = text;
  messageType.value = type;
}

function setMode(next) {
  mode.value = next === 'expert' ? 'expert' : 'user';
  if (mode.value === 'expert') {
    showMessage('Chuyên gia sẽ xác minh email trước. Sau khi đăng nhập, bạn sẽ được chuyển sang bước nộp hồ sơ và file bằng cấp.', 'info');
  } else {
    showMessage('');
  }
}

function getSignupErrorMessage(error) {
  const msg = String(error?.message || '').trim();

  if (!msg) return 'Đăng ký thất bại.';
  if (msg === 'EMAIL_UNVERIFIED') return 'Email này đã đăng ký nhưng chưa xác minh.';
  if (msg === 'Email already registered' || msg === 'Email đã được đăng ký.') return 'Email đã được đăng ký.';
  if (
    msg === 'Failed to fetch' ||
    msg === 'Load failed' ||
    msg.includes('NetworkError') ||
    msg === 'Không kết nối được máy chủ.' ||
    msg === 'Mất kết nối máy chủ.'
  ) return 'Không kết nối được máy chủ.';
  if (msg === 'Invalid email') return 'Email chưa hợp lệ.';
  return msg;
}

async function handleResend() {
  resending.value = true;
  resendNote.value = '';
  try {
    await apiClient.post('/auth/resend-verification', { email: email.value.trim().toLowerCase() });
    resendNote.value = `Đã gửi link xác nhận mới tới ${email.value}. Hãy kiểm tra cả hộp thư rác.`;
    showResend.value = false;
  } catch (err) {
    resendNote.value = err?.message || 'Không gửi được email. Vui lòng thử lại sau.';
  } finally {
    resending.value = false;
  }
}

async function handleGoogleCredential(response) {
  showMessage('Đang xác thực với Google...', 'info');
  try {
    await auth.loginWithGoogle(response.credential);
    showMessage('Đăng ký thành công! Đang chuyển hướng...', 'success');
    setTimeout(() => router.push('/dashboard'), 700);
  } catch (err) {
    showMessage(err.message || 'Đăng nhập Google thất bại.', 'error');
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
      throw new Error('Không lấy được thông tin xác thực từ Google.');
    }
    await handleGoogleCredential({ credential: idToken });
  } catch (err) {
    const cancelled = /cancel/i.test(err?.message || '') || /cancel/i.test(String(err?.code || ''));
    if (!cancelled) {
      showMessage(err?.message || 'Đăng nhập Google thất bại.', 'error');
    }
  } finally {
    nativeGoogleLoading.value = false;
  }
}

async function handleSubmit() {
  const fullName = name.value.trim();
  const emailValue = email.value.trim().toLowerCase();
  const isExpert = mode.value === 'expert';

  if (!fullName || fullName.length < 2) {
    showMessage('Vui lòng nhập tên hiển thị ít nhất 2 ký tự.', 'error');
    return;
  }
  if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    showMessage('Email chưa hợp lệ.', 'error');
    return;
  }
  if (!password.value || password.value.length < 8) {
    showMessage('Mật khẩu cần có ít nhất 8 ký tự.', 'error');
    return;
  }
  if (password.value !== confirmPassword.value) {
    showMessage('Mật khẩu xác nhận không khớp.', 'error');
    return;
  }
  if (!agreeTerms.value) {
    showMessage('Bạn cần đồng ý điều khoản để tiếp tục.', 'error');
    return;
  }

  submitting.value = true;
  showResend.value = false;

  try {
    if (isExpert) {
      await auth.signupExpert({
        email: emailValue,
        password: password.value,
        full_name: fullName,
        display_name: fullName,
        consent_privacy: true,
        consent_terms: true
      });
    } else {
      await auth.signup(emailValue, password.value, fullName, {
        consent_privacy: true,
        consent_terms: true,
        consent_sensitive_data: false
      });
    }

    auth.clearSession();
    localStorage.removeItem('peaceflow_onboarding_done');

    success.value = true;
    showMessage(
      isExpert
        ? `✅ Tài khoản chuyên gia đã được tạo cho ${emailValue}. Hãy xác minh email, đăng nhập để gửi hồ sơ + bằng cấp, và chờ admin duyệt trước khi vào khu chuyên gia.`
        : `✅ Đăng ký thành công! Chúng tôi đã gửi email xác nhận đến ${emailValue}. Vui lòng kiểm tra hộp thư và nhấn vào liên kết để kích hoạt tài khoản.`,
      'success'
    );
  } catch (error) {
    showMessage(getSignupErrorMessage(error), 'error');
    if (String(error?.message || '').trim() === 'EMAIL_UNVERIFIED') {
      showResend.value = true;
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  if (isNativeApp) return;

  const initGoogle = () => {
    if (!window.google?.accounts || !googleBtnEl.value) return;
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
      text: 'signup_with',
      shape: 'pill',
      locale: 'vi'
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
/* Đăng ký bằng email là lựa chọn phụ — làm nhạt hơn nút Google. */
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
  background: linear-gradient(135deg, var(--cream) 0%, var(--peach-light) 100%);
  padding: 20px;
}
.auth-card {
  width: 100%;
  max-width: 520px;
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
  background: var(--peach);
  border-radius: var(--radius-sm);
  border: 2px solid var(--peach-dark);
  font-size: 1.8rem;
  box-shadow: 3px 3px 0 var(--peach-dark);
  margin-bottom: 20px;
}
.auth-title { font-size: 1.5rem; margin-bottom: 8px; }
.auth-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6; }
.auth-form { text-align: left; }
.auth-links { margin-top: 20px; font-size: 0.85rem; color: var(--text-secondary); }
.auth-links a { color: var(--peach-dark); font-weight: 700; text-decoration: none; }
.auth-links a:hover { text-decoration: underline; }
.auth-message {
  display: block;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-bottom: 16px;
  border: 1px solid transparent;
  line-height: 1.5;
}
.auth-message.error { color: #8A2F2F; background: #FFE3E3; border-color: #FFB8B8; }
.auth-message.success { color: var(--mint-dark); background: var(--mint-light); border-color: var(--mint); }
.auth-message.info { color: #6B5B2A; background: #FFF4CC; border-color: #FFE08A; }
.checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
.checkbox-group input { margin-top: 3px; accent-color: var(--peach-dark); }
.checkbox-group a { color: var(--peach-dark); font-weight: 700; text-decoration: none; }
.checkbox-group a:hover { text-decoration: underline; }
.btn-primary[disabled] { opacity: 0.7; cursor: not-allowed; }
.field-hint { font-size: 0.8rem; color: var(--text-light); margin-top: 6px; }
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: var(--text-light);
  font-size: 0.85rem;
}
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px dashed var(--kraft-light); }
.divider:not(:empty)::before { margin-right: .5em; }
.divider:not(:empty)::after { margin-left: .5em; }
.account-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.toggle-chip {
  border: 2px solid var(--kraft-light);
  border-radius: 999px;
  background: #fff;
  padding: 10px 14px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}
.toggle-chip.active {
  background: var(--peach);
  border-color: var(--peach-dark);
  color: var(--text-primary);
  box-shadow: 2px 2px 0 var(--peach-dark);
}
</style>
