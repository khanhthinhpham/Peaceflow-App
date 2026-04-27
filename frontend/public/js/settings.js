�import { apiClient } from './api-client.js';
import { auth } from './auth.js';

export const settings = {
    async init() {
        try {
            const profile = await this.fetchProfile();
            this.fillForm(profile);
            this.setupListeners();
        } catch (error) {
            console.error('Settings init error:', error);
        }
    },

    async fetchProfile() {
        return await apiClient.get('/profile');
    },

    fillForm(profile) {
        if (profile.full_name) document.getElementById('fullName').value = profile.full_name;
        if (profile.occupation) document.getElementById('occupation').value = profile.occupation;
        if (profile.preferred_task_duration) document.getElementById('taskDuration').value = profile.preferred_task_duration;
        
        // Fill weights if they exist
        const weights = profile.personalization_weights || {};
        if (weights.sleep_weight) document.getElementById('sleepWeight').value = weights.sleep_weight;
    },

    setupListeners() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveProfile();
            });
        }
    },

    async saveProfile() {
        const payload = {
            full_name: document.getElementById('fullName').value,
            occupation: document.getElementById('occupation').value,
            preferred_task_duration: parseInt(document.getElementById('taskDuration').value, 10),
            personalization_weights: {
                sleep_weight: parseFloat(document.getElementById('sleepWeight').value) || 0.3
            }
        };

        try {
            await apiClient.put('/profile', payload);
            alert('Cài �ặt �ã �ược lưu thành công!');
        } catch (error) {
            alert('L�i khi lưu cài �ặt: ' + error.message);
        }
    }
};

if (window.location.pathname.includes('settings.html')) {
    settings.init();
}
