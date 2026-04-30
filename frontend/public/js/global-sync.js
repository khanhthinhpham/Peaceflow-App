/**
 * global-sync.js
 * Script toàn cục chạy trên MỌI trang — tự động đồng bộ:
 * 1. Tên người dùng (.user-name, .ph-name, data-user-field)
 * 2. XP & Level (.user-level, mobile-xp-badge)
 * Dữ liệu lấy từ localStorage (offline) + API (online)
 */

const GlobalSync = {
    // Level system
    LEVELS: [
        { level: 1, name: 'Người mới bắt đầu', min: 0, max: 100 },
        { level: 2, name: 'Người khám phá',     min: 100, max: 300 },
        { level: 3, name: 'Người đồng hành',    min: 300, max: 600 },
        { level: 4, name: 'Chiến binh bình yên', min: 600, max: 1000 },
        { level: 5, name: 'Bậc thầy tĩnh tâm',  min: 1000, max: 2000 },
    ],

    getLevelInfo(xp) {
        for (let i = this.LEVELS.length - 1; i >= 0; i--) {
            if (xp >= this.LEVELS[i].min) return this.LEVELS[i];
        }
        return this.LEVELS[0];
    },

    init() {
        this.syncFromLocalStorage();
        this.fetchAndSync();

        // Re-sync khi profile được cập nhật
        window.addEventListener('user-profile-updated', () => this.syncFromLocalStorage());
        window.addEventListener('user-updated', (e) => {
            if (e.detail) {
                window.currentUser = e.detail;
            }
            this.syncFromLocalStorage();
        });

        // Re-sync sau khi app.js's Store.syncFromRemote() hoàn tất
        window.addEventListener('dataSynced', () => {
            setTimeout(() => this.syncFromLocalStorage(), 100);
        });

        // ★ Delayed re-sync: chạy lại sau 500ms để ghi đè mọi inline scripts
        setTimeout(() => this.syncFromLocalStorage(), 500);
        // Và lần nữa sau 1.5s (phòng trường hợp Supabase auth chậm)
        setTimeout(() => this.syncFromLocalStorage(), 1500);
    },

    // ─── SYNC TỪ LOCALSTORAGE (nhanh, không cần chờ API) ───
    syncFromLocalStorage() {
        // 1. Sync tên người dùng
        const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (!window.currentUser) window.currentUser = user;
                const name = user.display_name || user.full_name || 'Người dùng';
                
                // Cập nhật TẤT CẢ phần tử hiển thị tên
                document.querySelectorAll('.user-name').forEach(el => el.innerText = name);
                document.querySelectorAll('.ph-name').forEach(el => el.innerText = name);
                document.querySelectorAll('[data-user-field="display_name"]').forEach(el => {
                    const tpl = el.getAttribute('data-user-template');
                    if (tpl) {
                        el.innerText = tpl.replace('{display_name}', name);
                    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.value = name;
                    } else {
                        el.innerText = name;
                    }
                });
                document.querySelectorAll('[data-user-field="full_name"]').forEach(el => {
                    el.innerText = user.full_name || name;
                });

                // ★ ĐỒNG BỘ NGƯỢC: Cập nhật PeaceFlow_user_stats.name để app.js lấy đúng
                const statsStr = localStorage.getItem('PeaceFlow_user_stats');
                if (statsStr) {
                    try {
                        const stats = JSON.parse(statsStr);
                        if (stats.name !== name) {
                            stats.name = name;
                            localStorage.setItem('PeaceFlow_user_stats', JSON.stringify(stats));
                        }
                    } catch(e) {}
                }

                // Cập nhật avatar
                if (user.avatar_url) {
                    document.querySelectorAll('.user-avatar, .user-avatar-mini, .ph-avatar, [data-user-field="avatar_url"]').forEach(el => {
                        if (el.tagName === 'IMG') {
                            el.src = user.avatar_url;
                        } else {
                            el.style.backgroundImage = `url('${user.avatar_url}')`;
                            el.style.backgroundSize = 'cover';
                            el.style.backgroundPosition = 'center';
                            if (el.innerText.length <= 2) el.innerText = '';
                        }
                    });
                }
            } catch (e) { /* ignore parse errors */ }
        }

        // 2. Sync XP & Level từ cache (thử nhiều nguồn)
        let xp = 0;
        const progressStr = localStorage.getItem('peaceflow_progress');
        if (progressStr) {
            try {
                const progress = JSON.parse(progressStr);
                xp = progress.total_xp || progress.xp || 0;
            } catch (e) {}
        }
        // Fallback: đọc từ PeaceFlow_user_stats nếu peaceflow_progress chưa có
        if (xp === 0) {
            const statsStr = localStorage.getItem('PeaceFlow_user_stats');
            if (statsStr) {
                try {
                    const stats = JSON.parse(statsStr);
                    xp = stats.xp || 0;
                } catch(e) {}
            }
        }
        this.renderXpEverywhere(xp);
    },

    // ─── FETCH TỪ API VÀ SYNC (chính xác, cần backend chạy) ───
    async fetchAndSync() {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const API_BASE = window.location.hostname === 'peaceflow.vn'
            ? 'https://api.peaceflow.vn/api/v1'
            : 'http://localhost:4000/api/v1';

        try {
            const res = await fetch(`${API_BASE}/progress`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                const progress = data.data || data;
                // Cache cho lần sau
                localStorage.setItem('peaceflow_progress', JSON.stringify(progress));
                this.renderXpEverywhere(progress.total_xp || progress.xp || 0);
            }
        } catch (e) {
            console.warn('GlobalSync: API fetch failed, using cached data');
        }
    },

    // ─── RENDER XP/LEVEL TRÊN TẤT CẢ PHẦN TỬ TRONG TRANG ───
    renderXpEverywhere(xp) {
        const info = this.getLevelInfo(xp);

        // 1. Sidebar .user-level
        document.querySelectorAll('.user-level').forEach(el => {
            el.innerText = `⭐ ${xp} XP · Level ${info.level}`;
        });

        // 2. Mobile topbar XP badge
        const mobileBadge = document.getElementById('mobile-xp-badge');
        if (mobileBadge) mobileBadge.innerText = `⭐ ${xp} XP`;

        // 3. Tìm tất cả các nơi khác hiển thị XP tĩnh → cập nhật
        // XP total elements
        document.querySelectorAll('.xp-total').forEach(el => {
            el.innerText = `${xp} XP`;
        });

        // Level circle
        document.querySelectorAll('.xp-level-circle').forEach(el => {
            el.innerText = info.level;
        });

        // Level name
        const xlName = document.getElementById('xp-level-name');
        if (xlName) xlName.innerText = info.name;
        const xlRange = document.getElementById('xp-level-range');
        if (xlRange) xlRange.innerText = `${info.min} – ${info.max} XP`;

        // XP bar
        const barFill = document.getElementById('xp-bar-fill');
        if (barFill) {
            const pct = info.max > info.min ? Math.min(100, ((xp - info.min) / (info.max - info.min)) * 100) : 0;
            barFill.style.width = `${pct}%`;
        }
        const barLeft = document.getElementById('xp-bar-left');
        if (barLeft) barLeft.innerText = `${info.min} XP`;
        const barRight = document.getElementById('xp-bar-right');
        if (barRight) barRight.innerText = `${info.max} XP`;
        const barRemaining = document.getElementById('xp-bar-remaining');
        if (barRemaining) {
            const remaining = Math.max(0, info.max - xp);
            if (xp === 0) barRemaining.innerText = 'Hãy hoàn thành nhiệm vụ để nhận XP!';
            else if (remaining > 0) barRemaining.innerText = `Còn ${remaining} XP → Level ${info.level + 1} 🎉`;
            else barRemaining.innerText = `Đã đạt Level ${info.level}! 🏅`;
        }

        // Profile page specific
        document.querySelectorAll('.ph-level-badge').forEach(el => {
            el.innerText = `⭐ Level ${info.level} — ${info.name}`;
        });
        document.querySelectorAll('.ph-xp-label').forEach(el => {
            const remaining = Math.max(0, info.max - xp);
            el.innerHTML = `<span>${xp} XP</span><span>Còn ${remaining} XP → Level ${info.level + 1}</span>`;
        });

        // Achievement page hero
        document.querySelectorAll('.hb-level').forEach(el => {
            el.innerText = `⭐ Level ${info.level} — ${info.name}`;
        });
        document.querySelectorAll('.hb-name').forEach(el => {
            const userStr = localStorage.getItem('user');
            const name = userStr ? (JSON.parse(userStr).display_name || 'Người dùng') : 'Người dùng';
            el.innerText = `${name} — ${info.name}`;
        });
        document.querySelectorAll('.hof-xp').forEach(el => {
            el.innerText = `${xp} XP`;
        });

        // Quick stats Level
        document.querySelectorAll('.qs-num').forEach(el => {
            if (el.closest && el.closest('.quick-stat')) {
                const label = el.closest('.quick-stat').querySelector('.qs-label');
                if (label && label.innerText.includes('Level')) {
                    el.innerText = `Level ${info.level}`;
                }
            }
        });
    }
};

// Auto-init
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GlobalSync.init());
    } else {
        GlobalSync.init();
    }
}

window.GlobalSync = GlobalSync;
