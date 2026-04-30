/**
 * user-sync.js
 * Synchronize user information from localStorage to the UI using data-user-field attributes.
 */

const UserSync = {
    init() {
        this.sync();
        
        // Listen for user profile updates
        window.addEventListener('user-profile-updated', () => this.sync());
        window.addEventListener('user-updated', () => this.sync());
        
        // Use a MutationObserver to handle dynamically added content (e.g. from AJAX/React/Vue)
        this.observe();
    },

    sync() {
        const user = this.getUser();
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
        const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('UserSync: Failed to parse user from localStorage', e);
            return null;
        }
    },

    updateAvatar(el, value) {
        if (el.tagName === 'IMG') {
            el.src = value;
        } else {
            el.style.backgroundImage = `url('${value}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            // If it's a div with an emoji fallback, clear the emoji
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

// Initialize
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UserSync.init());
    } else {
        UserSync.init();
    }
}

// Export to global scope
window.UserSync = UserSync;
