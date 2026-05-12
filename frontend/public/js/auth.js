import { apiClient } from './api-client.js';

export const auth = {
    _authCheckPromise: null,

    async signup(email, password, fullName, consents = {}) {
        const data = await apiClient.post('/auth/register', {
            email: String(email || '').trim().toLowerCase(),
            password,
            full_name: fullName,
            display_name: fullName,
            consent_privacy: consents.consent_privacy ?? true,
            consent_terms: consents.consent_terms ?? true,
            consent_sensitive_data: consents.consent_sensitive_data ?? false
        });
        this.setSession(data);
        return data;
    },

    async login(email, password) {
        const data = await apiClient.post('/auth/login', {
            email: String(email || '').trim().toLowerCase(),
            password
        });
        this.setSession(data);
        return data;
    },

    async logout() {
        await apiClient.logout();
        window.location.href = 'login.html';
    },

    setSession(data) {
        const accessToken = data.session?.access_token || data.access_token;
        const refreshToken = data.session?.refresh_token || data.refresh_token;
        const user = data.user;

        if (accessToken) localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        if (user) localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    },

    async waitForAuth() {
        if (!this.isAuthenticated()) {
            return false;
        }

        if (!this._authCheckPromise) {
            this._authCheckPromise = apiClient.get('/me')
                .then((user) => {
                    if (user) {
                        const current = this.getUser() || {};
                        localStorage.setItem('user', JSON.stringify({ ...current, ...user }));
                    }
                    return true;
                })
                .catch((error) => {
                    console.error('Auth verification failed:', error);
                    this.clearSession();
                    return false;
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
    }
};

function initAuthAndUI() {
    window.updateGlobalUI = () => {
        if (window.UserSync) {
            window.UserSync.sync();
            return;
        }

        const user = auth.getUser();
        if (!user) return;

        const name = user.display_name || user.full_name || 'Nguoi dung';
        document.querySelectorAll('.user-name, .ph-name').forEach(el => {
            el.innerText = name;
        });

        if (user.avatar_url) {
            document.querySelectorAll('.user-avatar, .user-avatar-mini, .ph-avatar').forEach(el => {
                el.style.backgroundImage = `url('${user.avatar_url}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.innerText = '';
            });
        }
    };

    window.handleLogout = () => auth.logout();
    window.updateGlobalUI();
}

if (typeof document !== 'undefined') {
    initAuthAndUI();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthAndUI);
    }
}
