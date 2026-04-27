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
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });
    },

    async handleSupabaseRedirect() {
        if (!window.supabaseClient) return;

        // Listen for auth state changes (which fires on redirect from Google)
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Check if we already synced this session
                const lastSynced = localStorage.getItem('last_supabase_session_id');
                if (lastSynced === session.access_token) return; // Prevent loop

                console.log("Supabase SIGNED_IN event detected. Syncing with Node API...");
                
                try {
                    // Send Supabase token to our Node.js API to get Custom JWT
                    const data = await apiClient.post('/auth/sync-google', {
                        supabase_token: session.access_token
                    });

                    // Save custom JWT and User Profile
                    this.setSession(data);
                    localStorage.setItem('last_supabase_session_id', session.access_token);
                    
                    // Redirect or reload
                    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
                        window.location.href = 'dashboard.html';
                    } else {
                        // Force a refresh of user info on the current page
                        window.updateGlobalUI && window.updateGlobalUI();
                    }
                } catch (error) {
                    console.error("Failed to sync Google Auth with Node API:", error);
                }
            }
        });
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
