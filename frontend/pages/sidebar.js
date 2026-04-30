(function () {
    function getCurrentPage() {
        const path = window.location.pathname.split('/').pop() || 'dashboard.html';
        return path;
    }

    function getUserData() {
        try {
            const raw =
                localStorage.getItem('currentUser') ||
                localStorage.getItem('PeaceFlow_user') ||
                localStorage.getItem('PeaceFlow_user_stats');

            if (!raw) {
                return {
                    display_name: 'Khánh Thịnh',
                    avatar: '🐱',
                    xp: 140,
                    level: 2
                };
            }

            const parsed = JSON.parse(raw);

            return {
                display_name:
                    parsed.display_name ||
                    parsed.full_name ||
                    parsed.name ||
                    'Khánh Thịnh',
                avatar:
                    parsed.avatar ||
                    parsed.avatar_emoji ||
                    '🐱',
                xp:
                    parsed.xp ||
                    parsed.total_xp ||
                    140,
                level:
                    parsed.level ||
                    parsed.current_level ||
                    2
            };
        } catch (e) {
            return {
                display_name: 'Khánh Thịnh',
                avatar: '🐱',
                xp: 140,
                level: 2
            };
        }
    }

    function isActive(page, current) {
        return current === page ? ' active' : '';
    }

    function renderSidebar() {
        const currentPage = getCurrentPage();
        const user = getUserData();

        const html = `
<div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

<div class="mobile-topbar">
    <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
    <a href="index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;">
        <div style="width:32px;height:32px;background:var(--mint);border-radius:8px;border:2px solid var(--mint-dark);display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:2px 2px 0px var(--mint-dark);">🌿</div>
        <span style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">Peace<span style="color:var(--mint-dark);">Flow</span></span>
    </a>
    <span style="background:var(--peach-light);padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:700;color:var(--peach-dark);border:1.5px solid var(--peach);">⭐ ${user.xp} XP</span>
</div>

<aside class="sidebar" id="sidebar">
    <a href="index.html" class="sidebar-logo">
        <div class="logo-icon">🌿</div>
        <div class="logo-text">Peace<span>Flow</span></div>
    </a>

    <nav class="sidebar-nav">
        <div class="nav-section-label">Chính</div>
        <a href="dashboard.html" class="nav-item${isActive('dashboard.html', currentPage)}"><span class="ni">🏡</span> Tổng quan</a>
        <a href="mood-checkin.html" class="nav-item${isActive('mood-checkin.html', currentPage)}"><span class="ni">💭</span> Tâm trạng</a>
        <a href="mood-assessment.html" class="nav-item${isActive('mood-assessment.html', currentPage)}"><span class="ni">📋</span> Bài kiểm tra</a>
        <a href="tasks.html" class="nav-item${isActive('tasks.html', currentPage)}"><span class="ni">🎮</span> Nhiệm vụ</a>
        <a href="journal.html" class="nav-item${isActive('journal.html', currentPage)}"><span class="ni">📝</span> Nhật ký</a>

        <div class="nav-section-label" style="margin-top:8px;">Kết nối</div>
        <a href="experts.html" class="nav-item${isActive('experts.html', currentPage)}"><span class="ni">🩺</span> Chuyên gia</a>
        <a href="community.html" class="nav-item${isActive('community.html', currentPage)}"><span class="ni">👥</span> Cộng đồng</a>

        <div class="nav-section-label" style="margin-top:8px;">Phân tích</div>
        <a href="report.html" class="nav-item${isActive('report.html', currentPage)}"><span class="ni">📊</span> Báo cáo</a>
        <a href="achievements.html" class="nav-item${isActive('achievements.html', currentPage)}"><span class="ni">🏅</span> Thành tích</a>

        <div class="nav-section-label" style="margin-top:8px;">Cài đặt</div>
        <a href="profile.html" class="nav-item${isActive('profile.html', currentPage)}"><span class="ni">👤</span> Hồ sơ</a>
        <a href="settings.html" class="nav-item${isActive('settings.html', currentPage)}"><span class="ni">⚙️</span> Cài đặt</a>
        <a href="#" class="nav-item" onclick="handleLogout(); return false;" style="color:var(--coral); margin-top:10px; border-top:1px dashed var(--kraft-light); padding-top:15px;">
            <span class="ni">🚪</span> Đăng xuất
        </a>
    </nav>

    <div class="sidebar-bottom">
        <div class="user-card-mini">
            <div class="user-avatar-mini" data-user-field="avatar">${user.avatar}</div>
            <div class="user-info-mini">
                <div class="user-name" data-user-field="display_name">${user.display_name}</div>
                <div class="user-level" data-user-field="level_progress">
                    ⭐ <span data-user-field="xp">${user.xp}</span> XP · Level <span data-user-field="level">${user.level}</span>
                </div>
            </div>
        </div>
        <a href="emergency.html" class="emergency-btn">
            🆘 Hỗ trợ khẩn cấp
        </a>
    </div>
</aside>`;

        const mount = document.getElementById('app-sidebar');

        if (!mount) {
            console.error('[sidebar.js] Không tìm thấy #app-sidebar trên trang:', currentPage);
            return;
        }

        mount.innerHTML = html;
        console.log('[sidebar.js] Sidebar đã render cho:', currentPage);
    }

    window.renderAppSidebar = renderSidebar;

    // Global toggle functions
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
            document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
        }
    };

    window.closeSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    document.addEventListener('DOMContentLoaded', renderSidebar);
})();
