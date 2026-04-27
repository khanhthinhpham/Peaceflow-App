import { apiClient } from './api-client.js';

export const auth = {
    async signup(email, password, fullName) {
        const data = await apiClient.post('/auth/register', {
            email,
            password,
            full_name: fullName
        });
        this.setSession(data);
        return data;
    },

    async login(email, password) {
        const data = await apiClient.post('/auth/login', {
            email,
            password
        });
        this.setSession(data);
        return data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    },

    setSession(data) {
        // Handle Supabase session object or direct token
        const accessToken = data.session?.access_token || data.access_token;
        const user = data.user;

        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
        }
        if (user) {
            // Map Supabase user metadata to our expected format if needed
            const userToSave = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.full_name,
                display_name: user.user_metadata?.display_name || user.display_name,
                avatar_url: user.user_metadata?.avatar_url || user.avatar_url
            };
            localStorage.setItem('user', JSON.stringify(userToSave));
        }
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    },

    // ===== Google Auth Integration =====

    async signInWithGoogle() {
        if (!window.supabaseClient) {
            console.error("Supabase client is not initialized.");
            return;
        }
        await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/frontend/pages/dashboard.html'
            }
        });
    },

    async handleSupabaseRedirect() {
        if (!window.supabaseClient) return;

        // 1. Check for initial session (e.g. after redirect)
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            await this.syncWithBackend(session);
        }

        // 2. Listen for auth state changes
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await this.syncWithBackend(session);
            } else if (event === 'SIGNED_OUT') {
                this.clearSession();
            }
        });
    },

    async syncWithBackend(session) {
        if (!session) return;
        
        const lastSynced = localStorage.getItem('last_supabase_session_id');
        if (lastSynced === session.access_token) return;

        console.log("Syncing Supabase session with backend...");
        try {
            const data = await apiClient.post('/auth/sync-google', {
                supabase_token: session.access_token
            });

            this.setSession(data);
            localStorage.setItem('last_supabase_session_id', session.access_token);
            
            // Re-trigger UI update
            window.updateGlobalUI && window.updateGlobalUI();
            
            // Clear hash if still present
            if (window.location.hash) {
                window.history.replaceState(null, null, window.location.pathname);
            }
        } catch (error) {
            console.error("Failed to sync with backend:", error);
        }
    },

    clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('last_supabase_session_id');
    },

    /**
     * Helper for pages to wait until auth is fully initialized/synced
     */
    async waitForAuth() {
        // If already authenticated, return true
        if (this.isAuthenticated()) return true;

        // If there's a hash with access_token, we are likely in a redirect flow
        if (window.location.hash.includes('access_token')) {
            console.log("Auth redirect detected, waiting for sync...");
            
            // Wait for up to 5 seconds for access_token to appear in localStorage
            return new Promise((resolve) => {
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (this.isAuthenticated()) {
                        clearInterval(interval);
                        resolve(true);
                    } else if (attempts > 50) { // 5 seconds
                        clearInterval(interval);
                        resolve(false);
                    }
                }, 100);
            });
        }

        return false;
    }
};

// Initialize Supabase Listener on load
function initAuthAndUI() {
    auth.handleSupabaseRedirect();
    
    // Expose global for the onclick buttons
    window.signInWithGoogle = () => auth.signInWithGoogle();
    
    // Global UI updater helper
    window.updateGlobalUI = () => {
        const user = auth.getUser();
        if (user) {
            const name = user.display_name || user.full_name || "Người dùng";
            document.querySelectorAll('.user-name, .ph-name').forEach(el => el.innerText = name);
            
            if (user.avatar_url) {
                document.querySelectorAll('.user-avatar, .user-avatar-mini, .ph-avatar').forEach(el => {
                    el.style.backgroundImage = `url('${user.avatar_url}')`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                    el.innerText = ''; // Clear fallback emoji
                });
            }
        }
    };

    // Run UI update on load
    window.updateGlobalUI();
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthAndUI);
    } else {
        initAuthAndUI();
    }
}
