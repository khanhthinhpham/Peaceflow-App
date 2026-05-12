function normalizeApiBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function getApiBaseUrl() {
    return 'https://standard-standings-raymond-laptop.trycloudflare.com/api/v1';
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
        window.location.replace('login.html');
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

async function refreshAccessToken() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        throw new Error('Missing refresh token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refresh_token: refreshToken
        })
    });

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
}

async function ensureAccessToken() {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export const apiClient = {
    async request(endpoint, options = {}, retryOptions = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = retryOptions.accessToken ?? getStoredAccessToken();
        const isAuthRefreshRequest = endpoint === '/auth/refresh';
        const isPublicAuthRequest = endpoint === '/auth/login' || endpoint === '/auth/register';
        const shouldRetryAuth = retryOptions.retryAuth !== false;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token && !isPublicAuthRequest) {
            headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const result = await parseResponse(response);

            if (!response.ok) {
                if (response.status === 401 && shouldRetryAuth && !isAuthRefreshRequest) {
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

                throw new Error(result.message || result.error || 'API request failed');
            }

            return result.data || result;
        } catch (error) {
            console.error(`[API] Request failed for ${endpoint}:`, error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint) {
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
