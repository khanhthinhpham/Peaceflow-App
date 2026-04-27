import { apiClient } from './api-client.js';

export const journalManager = {
    async init() {
        this.setupListeners();
        await this.loadEntries();
    },

    setupListeners() {
        const form = document.getElementById('journalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveEntry();
            });
        }
    },

    async loadEntries() {
        try {
            const entries = await apiClient.get('/journal');
            this.renderEntries(entries);
        } catch (error) {
            console.error('Error loading journals:', error);
        }
    },

    async saveEntry() {
        const content = document.getElementById('journalContent').value;
        const mood = document.getElementById('journalMood')?.value || 'neutral';
        
        if (!content) return;

        try {
            await apiClient.post('/journal', { content, mood });
            document.getElementById('journalContent').value = '';
            await this.loadEntries();
            alert('Nhật ký đã được lưu!');
        } catch (error) {
            console.error('Error saving journal:', error);
            alert('Lỗi khi lưu nhật ký');
        }
    },

    renderEntries(entries) {
        const container = document.getElementById('journalEntries');
        if (!container) return;

        if (!entries || entries.length === 0) {
            container.innerHTML = '<div class="empty-state">Hôm nay bạn chưa viết gì...</div>';
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="journal-card paper-card">
                <div class="jc-date">${new Date(entry.created_at).toLocaleDateString('vi-VN')}</div>
                <div class="jc-content">${entry.content}</div>
                <div class="jc-footer">
                    <span class="jc-mood">${this.getMoodEmoji(entry.mood)}</span>
                </div>
            </div>
        `).join('');
    },

    getMoodEmoji(mood) {
        const mapping = {
            'happy': '😊',
            'sad': '😢',
            'neutral': '😐',
            'angry': '😡'
        };
        return mapping[mood] || '😐';
    }
};

window.saveEntry = () => journalManager.saveEntry();

if (window.location.pathname.includes('journal.html')) {
    journalManager.init();
}
