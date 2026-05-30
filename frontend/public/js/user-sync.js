/**
 * user-sync.js
 * Synchronize user information from localStorage to the UI using data-user-field attributes.
 */

const UserSync = {
    init() {
        this.sync();
        
        // Listen for user profile updates
        window.addEventListener('user-profile-updated', () => this.sync());
        
        // Use a MutationObserver to handle dynamically added content (e.g. from AJAX/React/Vue)
        this.observe();
    },

    sync() {
        const user = this.getUser();
        if (typeof window.syncSidebarAuthAction === 'function') {
            window.syncSidebarAuthAction();
        }
        if (!user) return;


        const fields = document.querySelectorAll('[data-user-field]');
        fields.forEach(el => {
            const field = el.getAttribute('data-user-field');
            const value = user[field];

            if (value !== undefined && value !== null) {
                if (field === 'avatar_url' || field === 'avatar') {
                    this.updateAvatar(el, value);
                } else {
                    this.updateText(el, field, value);
                }
            }
        });
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('UserSync: Failed to parse user from localStorage', e);
            return null;
        }
    },

    updateAvatar(el, value) {
        if (!value) return;
        if (value.startsWith('emoji:')) {
            // Avatar dạng emoji từ onboarding
            el.textContent = value.replace('emoji:', '');
            el.style.backgroundImage = '';
        } else if (el.tagName === 'IMG') {
            el.src = value;
        } else {
            el.style.backgroundImage = `url('${value}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            if (el.innerText.length <= 2) el.innerText = '';
        }
    },

    updateText(el, field, value) {
        const template = el.getAttribute('data-user-template');
        if (template) {
            el.innerText = template.replace(`{${field}}`, value);
        } else {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = value;
            } else {
                el.innerText = value;
            }
        }
    },

    observe() {
        const observer = new MutationObserver((mutations) => {
            let shouldSync = false;
            mutations.forEach(m => {
                if (m.addedNodes.length > 0) {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.hasAttribute('data-user-field') || node.querySelector('[data-user-field]'))) {
                            shouldSync = true;
                        }
                    });
                }
            });
            if (shouldSync) this.sync();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
};

// Cập nhật XP hiển thị trên topbar và sidebar khi có progress data
window.addEventListener('peaceflow:progress-updated', (event) => {
    const xp = event.detail?.xp ?? event.detail?.total_xp;
    const level = event.detail?.level ?? event.detail?.current_level;
    if (xp === undefined) return;

    const xpBadge = document.getElementById('topbarXpBadge');
    const xpLevel = document.getElementById('sidebarXpLevel');
    if (xpBadge) xpBadge.textContent = `⭐ ${xp} XP`;
    if (xpLevel) xpLevel.textContent = `⭐ ${xp} XP · Level ${level ?? '--'}`;
});

// Initialize
if (typeof document !== 'undefined') {
    UserSync.init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UserSync.sync());
    }
}

// Export to global scope
window.UserSync = UserSync;
