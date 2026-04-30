import { apiClient } from './api-client.js';

const achievementsPage = {
    badges: [],
    myBadges: [],
    progress: null,

    async init() {
        try {
            this.showLoading(true);

            const [badgesRes, myBadgesRes, meRes] = await Promise.all([
                apiClient.get('/badges'),
                apiClient.get('/badges/me'),
                apiClient.get('/me')
            ]);

            this.badges = badgesRes.data?.data || [];
            this.myBadges = myBadgesRes.data?.data || [];
            this.progress = meRes.data?.data?.progress || null;

            this.renderHero();
            this.renderBadges();
        } catch (error) {
            console.error('Load achievements failed:', error);
            this.showError('Không thể tải huy hiệu và thành tích.');
        } finally {
            this.showLoading(false);
        }
    },

    renderHero() {
        const user = window.currentUser || {};
        const displayName = user.display_name || user.full_name || 'Người dùng';

        const nameEl = document.querySelector('[data-achievement-user-name]');
        const levelEl = document.querySelector('[data-achievement-level]');
        const xpEl = document.querySelector('[data-achievement-xp]');
        const streakEl = document.querySelector('[data-achievement-streak]');
        const totalBadgesEl = document.querySelector('[data-achievement-total-badges]');

        if (nameEl) nameEl.textContent = displayName;
        if (levelEl) levelEl.textContent = `Level ${this.progress?.current_level || 1}`;
        if (xpEl) xpEl.textContent = `${this.progress?.total_xp || 0} XP`;
        if (streakEl) streakEl.textContent = `${this.progress?.current_streak || 0} ngày`;
        if (totalBadgesEl) totalBadgesEl.textContent = `${this.myBadges.length}`;
    },

    renderBadges() {
        const container = document.querySelector('[data-badges-grid]');
        if (!container) return;

        const ownedCodes = new Set(this.myBadges.map(b => b.code));

        container.innerHTML = this.badges.map(badge => {
            const earned = ownedCodes.has(badge.code);
            return `
        <div class="badge-card ${earned ? 'earned' : 'locked'}">
          <div class="badge-icon">${badge.icon || '🏅'}</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-description">${badge.description || ''}</div>
          <div class="badge-rarity">${badge.rarity || 'common'}</div>
          <div class="badge-status">${earned ? 'Đã mở khóa' : 'Chưa mở khóa'}</div>
        </div>
      `;
        }).join('');
    },

    showLoading(isLoading) {
        const el = document.querySelector('[data-achievements-loading]');
        if (el) el.style.display = isLoading ? 'block' : 'none';
    },

    showError(message) {
        const el = document.querySelector('[data-achievements-error]');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    achievementsPage.init();

    // Refresh data when user profile is updated
    window.addEventListener('user-updated', () => {
        achievementsPage.init();
    });
});
