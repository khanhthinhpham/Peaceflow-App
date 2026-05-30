import { apiClient } from './api-client.js';
import { EventLogger } from './event-logger.js';

export const journalManager = {
    async init() {
        const hasLegacyJournalUi = document.getElementById('journalForm') || document.getElementById('journalEntries');
        if (!hasLegacyJournalUi) {
            return;
        }

        this.setupListeners();
        await this.loadEntries();
    },

    setupListeners() {
        const form = document.getElementById('journalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                // Người dùng submit form nhật ký
                EventLogger.log('journal', 'form:submit');
                e.preventDefault();
                await this.saveEntry();
            });
        }
    },

    async loadEntries() {
        try {
            const entries = await apiClient.get('/journal');
            EventLogger.log('journal', 'entries:load', { count: Array.isArray(entries) ? entries.length : 0 });
            this.renderEntries(entries);
        } catch (error) {
            EventLogger.error('journal', 'entries:load:failed', error);
            console.error('Error loading journals:', error);
        }
    },

    async saveEntry() {
        const content = document.getElementById('journalContent').value;
        const mood = document.getElementById('journalMood')?.value || 'neutral';

        if (!content) return;

        // Người dùng lưu bài nhật ký lên server (không log nội dung để bảo vệ riêng tư)
        EventLogger.log('journal', 'save:attempt', { wordCount: content.trim().split(/\s+/).length, mood });

        try {
            await apiClient.post('/journal', { content, mood });
            EventLogger.log('journal', 'save:success', { mood });
            document.getElementById('journalContent').value = '';
            await this.loadEntries();
            alert('Nhật ký đã được lưu!');
            localStorage.setItem('peaceflow_dashboard_refresh', '1');
            window.dispatchEvent(new CustomEvent('peaceflow:invalidate-cache', { detail: { endpoint: '/dashboard' } }));
            window.dispatchEvent(new CustomEvent('peaceflow:journal-saved', { detail: { mood } }));
        } catch (error) {
            EventLogger.error('journal', 'save:failed', error, { mood });
            console.error('Error saving journal:', error);
            alert('Lỗi khi lưu nhật ký');
        }
    },

    renderEntries(entries) {
        const container = document.getElementById('journalEntries');
        if (!container) return;

        if (!entries || entries.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px 20px;color:var(--text-secondary);">
                    <div style="font-size:2.5rem;margin-bottom:12px;">📝</div>
                    <div style="font-weight:700;font-size:1rem;margin-bottom:6px;color:var(--text-primary);">Chưa có nhật ký nào</div>
                    <div style="font-size:0.88rem;line-height:1.6;margin-bottom:16px;">
                        Viết nhật ký giúp bạn hiểu cảm xúc và giải tỏa căng thẳng.<br>Chỉ cần vài dòng thôi!
                    </div>
                </div>`;
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

let _justBooted = false;

if (document.getElementById('journalForm') || document.getElementById('journalEntries')) {
    _justBooted = true;
    journalManager.init();
}

window.addEventListener('peaceflow:route-mounted', (event) => {
    if ((event.detail?.page || '').split('?')[0] !== 'journal.html') return;
    if (_justBooted) { _justBooted = false; return; }
    journalManager.init();
});
