import { auth } from './auth.js';

export const guards = {
    checkAuth() {
        if (!auth.isAuthenticated()) {
            window.location.href = '/pages/login.html';
        }
    },

    checkGuest() {
        if (auth.isAuthenticated()) {
            window.location.href = '/pages/dashboard.html';
        }
    }
};
