const API_BASE_URL = window.location.hostname === 'peaceflow.vn' 
    ? 'https://api.peaceflow.vn/api/v1' 
    : 'http://localhost:4000/api/v1';

export const apiClient = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('access_token');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            let result;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                result = { success: false, message: text || `Error ${response.status}` };
            }

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    // Use a safer redirect that handles different path structures
                    if (!window.location.pathname.includes('login.html')) {
                        window.location.href = 'login.html';
                    }
                }
                throw new Error(result.message || result.error || 'API request failed');
            }

            return result.data || result;
        } catch (error) {
            console.error(`ðŸŒ [API] Request failed for ${endpoint}:`, error);
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
    }
};
