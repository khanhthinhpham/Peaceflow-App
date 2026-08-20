import './env.js';

function normalizeApiBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function isDebugEnabled() {
    return localStorage.getItem('peaceflow_debug') === '1';
}

function createTraceId() {
    return `fe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function previewPayload(value, maxLength = 500) {
    try {
        if (value === undefined) return '';
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        if (!text) return '';
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    } catch (_error) {
        return '[unserializable]';
    }
}

function isNgrokUrl(url) {
    return /\.ngrok(-free)?\.(app|dev)$/i.test(String(url || ''));
}

export function getApiBaseUrl() {
    const explicitOverride = window.__PEACEFLOW_API_BASE_URL__;
    if (typeof explicitOverride === 'string' && explicitOverride.trim()) {
        return normalizeApiBaseUrl(explicitOverride);
    }

    const storedOverride = localStorage.getItem('peaceflow_api_base_url');
    if (storedOverride && storedOverride.trim()) {
        return normalizeApiBaseUrl(storedOverride);
    }

    const { protocol, hostname, port, origin } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (port === '4000') {
        return `${origin}/api/v1`;
    }

    if (isLocalHost) {
        return 'http://localhost:4000/api/v1';
    }

    if (port) {
        return `${protocol}//${hostname}:4000/api/v1`;
    }

    const configuredDefault = window.__PEACEFLOW_ENV__?.API_BASE_URL;
    if (typeof configuredDefault === 'string' && configuredDefault.trim()) {
        return normalizeApiBaseUrl(configuredDefault);
    }

    return `${origin}/api/v1`;
}

export const API_BASE_URL = getApiBaseUrl();

let refreshPromise = null;

function getStoredAccessToken() {
    return localStorage.getItem('access_token');
}

function getStoredRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

function redirectToLogin() {
    if (!window.location.pathname.includes('login.html')) {
        const now = Date.now();
        const lastRedirectAt = Number(sessionStorage.getItem('peaceflow_last_login_redirect_at') || '0');
        if (now - lastRedirectAt < 1500) {
            return;
        }

        sessionStorage.setItem('peaceflow_last_login_redirect_at', String(now));
        sessionStorage.setItem(
            'peaceflow_post_login_redirect',
            `${window.location.pathname}${window.location.search}${window.location.hash}`
        );
        // Trỏ về pages/login.html (không dùng đường dẫn tương đối — khu lồng sâu
        // như pages/expert, pages/admin sẽ thành expert/login.html gây 404).
        const path = window.location.pathname;
        const idx = path.indexOf('/pages/');
        window.location.replace(idx >= 0 ? `${path.slice(0, idx + 7)}login.html` : 'login.html');
    }
}

async function parseResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();
    return { success: false, message: text || `Error ${response.status}` };
}

function getErrorMessage(result, response) {
    if (typeof result === 'string' && result.trim()) {
        return result;
    }

    if (result && typeof result === 'object') {
        if (typeof result.message === 'string' && result.message.trim()) {
            return result.message;
        }

        if (typeof result.error === 'string' && result.error.trim()) {
            return result.error;
        }
    }

    return `API request failed (${response.status})`;
}

function normalizeRequestError(error) {
    const message = String(error?.message || '').trim();

    if (
        error instanceof TypeError ||
        message === 'Failed to fetch' ||
        message === 'Load failed' ||
        message.includes('NetworkError')
    ) {
        return new Error('Không kết nối được máy chủ.');
    }

    return error;
}

async function refreshAccessToken() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        throw new Error('Missing refresh token');
    }

    const traceId = createTraceId();
    const startedAt = performance.now();

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-trace-id': traceId,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });
        if (isDebugEnabled()) {
            console.info(`[FE_API] trace=${traceId} method=POST endpoint=/auth/refresh status=${response.status} duration_ms=${Math.round(performance.now() - startedAt)}`);
        }

        const result = await parseResponse(response);
        if (!response.ok) {
            throw new Error(result.message || 'Refresh token request failed');
        }

        const data = result.data || result;
        const nextAccessToken = data.session?.access_token || data.access_token;
        const nextRefreshToken = data.session?.refresh_token || data.refresh_token;
        const user = data.user;

        if (!nextAccessToken || !nextRefreshToken) {
            throw new Error('Refresh token response missing session');
        }

        localStorage.setItem('access_token', nextAccessToken);
        localStorage.setItem('refresh_token', nextRefreshToken);
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('user-profile-updated'));
        }

        return nextAccessToken;
    } catch (error) {
        throw normalizeRequestError(error);
    }
}

async function ensureAccessToken() {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

const _swrCache = new Map(); // endpoint -> { data, cachedAt }
const SWR_FRESH_MS = 30_000;  // dưới 30s: trả cache ngay
const SWR_MAX_MS   = 300_000; // trên 5 phút: bỏ cache, fetch lại

// Cho phép app.js (non-module) invalidate cache qua event
if (typeof window !== 'undefined') {
    window.addEventListener('peaceflow:invalidate-cache', (event) => {
        const endpoint = event.detail?.endpoint;
        if (endpoint) {
            _swrCache.delete(endpoint);
        } else {
            _swrCache.clear();
        }
    });
}

export const apiClient = {
    async request(endpoint, options = {}, retryOptions = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = retryOptions.accessToken ?? getStoredAccessToken();
        const isAuthRefreshRequest = endpoint === '/auth/refresh';
        const isPublicAuthRequest = endpoint === '/auth/login' || endpoint === '/auth/register' || endpoint === '/auth/google' || endpoint === '/auth/forgot-password' || endpoint === '/auth/reset-password';
        const shouldRetryAuth = retryOptions.retryAuth !== false;
        const traceId = createTraceId();
        const startedAt = performance.now();

        const headers = {
            'x-client-trace-id': traceId,
            ...options.headers
        };

        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        if (isNgrokUrl(API_BASE_URL)) {
            headers['ngrok-skip-browser-warning'] = 'true';
        }

        if (token && !isPublicAuthRequest) {
            headers.Authorization = `Bearer ${token}`;
        }

        try {
            if (isDebugEnabled()) {
                console.info(`[FE_API] trace=${traceId} method=${options.method || 'GET'} endpoint=${endpoint} request_body=${previewPayload(options.body)}`);
            }

            const response = await fetch(url, {
                ...options,
                headers
            });

            const result = await parseResponse(response);
            const durationMs = Math.round(performance.now() - startedAt);

            if (isDebugEnabled()) {
                const requestId = response.headers.get('x-request-id') || '-';
                console.info(`[FE_API] trace=${traceId} method=${options.method || 'GET'} endpoint=${endpoint} status=${response.status} duration_ms=${durationMs} request_id=${requestId}`);
            }

            if (!response.ok) {
                if (response.status === 401 && shouldRetryAuth && !isAuthRefreshRequest && !isPublicAuthRequest) {
                    try {
                        const nextToken = await ensureAccessToken();
                        return this.request(endpoint, options, {
                            retryAuth: false,
                            accessToken: nextToken
                        });
                    } catch (refreshError) {
                        clearSession();
                        redirectToLogin();
                        throw refreshError;
                    }
                }

                throw new Error(getErrorMessage(result, response));
            }

            return result.data || result;
        } catch (error) {
            const normalizedError = normalizeRequestError(error);
            console.error(`[API] Request failed for ${endpoint} trace=${traceId}:`, normalizedError);
            throw normalizedError;
        }
    },

    get(endpoint, { noCache = false } = {}) {
        if (noCache) return this.request(endpoint, { method: 'GET' });

        const cached = _swrCache.get(endpoint);
        const now = Date.now();

        if (cached) {
            const age = now - cached.cachedAt;

            if (age < SWR_FRESH_MS) {
                return Promise.resolve(cached.data);
            }

            if (age < SWR_MAX_MS) {
                // Stale: trả cache ngay, fetch ngầm ở background
                this.request(endpoint, { method: 'GET' })
                    .then((data) => {
                        _swrCache.set(endpoint, { data, cachedAt: Date.now() });
                        window.dispatchEvent(new CustomEvent('peaceflow:swr-update', {
                            detail: { endpoint, data }
                        }));
                    })
                    .catch(() => {});
                return Promise.resolve(cached.data);
            }
        }

        // Không có cache hoặc đã hết hạn: fetch và lưu cache
        return this.request(endpoint, { method: 'GET' }).then((data) => {
            _swrCache.set(endpoint, { data, cachedAt: Date.now() });
            return data;
        });
    },

    _invalidateRelated(endpoint) {
        // Xóa cache của resource liên quan và dashboard
        const base = '/' + endpoint.split('/').filter(Boolean)[0];
        for (const key of _swrCache.keys()) {
            if (key === base || key.startsWith(base + '/') || key === '/dashboard') {
                _swrCache.delete(key);
            }
        }
    },

    post(endpoint, data) {
        this._invalidateRelated(endpoint);
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    postForm(endpoint, formData) {
        this._invalidateRelated(endpoint);
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {}
        });
    },

    // Tải file nhị phân (ảnh...) có xác thực — request()/get() luôn parse JSON nên
    // không dùng được cho response dạng binary như ảnh đính kèm kết quả test.
    async getBlob(endpoint) {
        const token = getStoredAccessToken();
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
        if (!response.ok) {
            throw new Error(`Không tải được file (HTTP ${response.status})`);
        }
        return response.blob();
    },

    put(endpoint, data) {
        this._invalidateRelated(endpoint);
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    patch(endpoint, data) {
        this._invalidateRelated(endpoint);
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint) {
        this._invalidateRelated(endpoint);
        return this.request(endpoint, { method: 'DELETE' });
    },

    async logout() {
        const refreshToken = getStoredRefreshToken();

        if (refreshToken) {
            try {
                await this.post('/auth/logout', {
                    refresh_token: refreshToken
                });
            } catch (error) {
                console.error('[API] Logout request failed:', error);
            }
        }

        clearSession();
    }
};
