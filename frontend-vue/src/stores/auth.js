import { defineStore } from 'pinia';
import { apiClient } from '../lib/apiClient';
import { EventLogger } from '../lib/eventLogger';

function readStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser(),
    // Cờ reactive theo dõi việc có access_token hay không — KHÔNG đọc thẳng localStorage
    // trong getter, vì Pinia getter là computed() của Vue: computed chỉ theo dõi được các
    // dependency reactive, còn localStorage là nguồn ngoài Vue nên không được track. Hệ quả:
    // getter kiểu `() => !!localStorage.getItem(...)` chỉ tính đúng 1 lần (lần đọc đầu tiên)
    // rồi cache mãi giá trị đó — nếu lần đọc đầu xảy ra trước khi đăng nhập (isAuthenticated
    // = false), nó sẽ luôn trả false trong suốt phiên trang, dù setSession() sau đó đã lưu
    // token thật vào localStorage. Đây đã từng gây bug: đăng nhập Google báo thành công,
    // điều hướng ban đầu chạy đúng nhưng bị các guard dựa vào isAuthenticated bật lại về
    // /login ngay sau đó (chỉ f5 lại trang mới hết vì lúc đó computed được tính lại từ đầu).
    hasSession: !!localStorage.getItem('access_token'),
    _authCheckPromise: null
  }),

  getters: {
    isAuthenticated: (state) => state.hasSession
  },

  actions: {
    async signup(email, password, fullName, consents = {}) {
      EventLogger.log('auth', 'signup:attempt');
      const data = await apiClient.post('/auth/register', {
        email: String(email || '').trim().toLowerCase(),
        password,
        full_name: fullName,
        display_name: fullName,
        consent_privacy: consents.consent_privacy ?? true,
        consent_terms: consents.consent_terms ?? true,
        consent_sensitive_data: consents.consent_sensitive_data ?? false
      });
      EventLogger.log('auth', 'signup:success');
      this.setSession(data);
      return data;
    },

    async signupExpert(payload) {
      EventLogger.log('auth', 'signup_expert:attempt');
      const data = await apiClient.post('/auth/register-expert', {
        email: String(payload?.email || '').trim().toLowerCase(),
        password: payload?.password,
        full_name: payload?.full_name,
        display_name: payload?.display_name,
        consent_privacy: payload?.consent_privacy ?? true,
        consent_terms: payload?.consent_terms ?? true
      });
      EventLogger.log('auth', 'signup_expert:success');
      return data;
    },

    async getMyExpertApplication() {
      return apiClient.get('/auth/expert-application/me', { noCache: true });
    },

    async login(email, password) {
      EventLogger.log('auth', 'login:attempt');
      const data = await apiClient.post('/auth/login', {
        email: String(email || '').trim().toLowerCase(),
        password
      });
      EventLogger.log('auth', 'login:success');
      this.setSession(data);
      return data;
    },

    async loginWithGoogle(idToken) {
      const data = await apiClient.post('/auth/google', { id_token: idToken });
      this.setSession(data);
      return data;
    },

    async logout() {
      EventLogger.log('auth', 'logout:request');
      await apiClient.logout();
      this.user = null;
      this.hasSession = false;
    },

    setSession(data) {
      const accessToken = data.session?.access_token || data.access_token;
      const refreshToken = data.session?.refresh_token || data.refresh_token;
      const user = data.user;

      // Dọn cache SWR ngay khi có phiên đăng nhập mới — tránh việc /me (hay bất kỳ GET nào
      // khác) còn giữ dữ liệu của tài khoản/phiên trước đó (vd: vừa đăng xuất rồi đăng nhập
      // tài khoản khác trong vòng chưa tới 5 phút vẫn thấy role/hồ sơ của tài khoản cũ).
      apiClient.clearCache();

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        this.hasSession = true;
      }
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        this.user = user;
      }
    },

    async waitForAuth() {
      if (!this.isAuthenticated) return false;

      if (!this._authCheckPromise) {
        this._authCheckPromise = apiClient.get('/me', { noCache: true })
          .then((user) => {
            if (user) {
              this.user = { ...(this.user || {}), ...user };
              localStorage.setItem('user', JSON.stringify(this.user));
              window.dispatchEvent(new CustomEvent('user-profile-updated'));
            }
            return true;
          })
          .catch((error) => {
            EventLogger.error('auth', 'session:verify:failed', error);
            return this.isAuthenticated;
          })
          .finally(() => {
            this._authCheckPromise = null;
          });
      }

      return this._authCheckPromise;
    },

    clearSession() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      this.user = null;
      this.hasSession = false;
    }
  }
});
