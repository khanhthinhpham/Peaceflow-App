const fs = require('fs');
const path = require('path');

const dir = 'c:/Dự án/PeaceFlow.vn/frontend/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const sidebarTemplate = `    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

    <div class="mobile-topbar">
        <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
        <a href="index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;">
            <div style="width:32px;height:32px;background:var(--mint);border-radius:8px;border:2px solid var(--mint-dark);display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:2px 2px 0px var(--mint-dark);">🌿</div>
            <span style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">Peace<span style="color:var(--mint-dark);">Flow</span></span>
        </a>
        <span style="background:var(--peach-light);padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:700;color:var(--peach-dark);border:1.5px solid var(--peach);">⭐ <span data-user-field="xp">0</span> XP</span>
    </div>

    <aside class="sidebar" id="sidebar">
        <a href="index.html" class="sidebar-logo">
            <div class="logo-icon">🌿</div>
            <div class="logo-text">Peace<span>Flow</span></div>
        </a>

        <nav class="sidebar-nav">
            <div class="nav-section-label">Chính</div>
            <a href="dashboard.html" class="nav-item{{dashboard}}">
                <span class="ni">🏡</span> Tổng quan
            </a>
            <a href="mood-checkin.html" class="nav-item{{mood-checkin}}">
                <span class="ni">💭</span> Tâm trạng
            </a>
            <a href="mood-assessment.html" class="nav-item{{mood-assessment}}">
                <span class="ni">📋</span> Bài kiểm tra
            </a>
            <a href="tasks.html" class="nav-item{{tasks}}">
                <span class="ni">🎮</span> Nhiệm vụ
            </a>
            <a href="journal.html" class="nav-item{{journal}}">
                <span class="ni">📝</span> Nhật ký
            </a>

            <div class="nav-section-label" style="margin-top:8px;">Kết nối</div>
            <a href="experts.html" class="nav-item{{experts}}">
                <span class="ni">🩺</span> Chuyên gia
            </a>
            <a href="community.html" class="nav-item{{community}}">
                <span class="ni">👥</span> Cộng đồng
            </a>

            <div class="nav-section-label" style="margin-top:8px;">Phân tích</div>
            <a href="report.html" class="nav-item{{report}}">
                <span class="ni">📊</span> Báo cáo
            </a>
            <a href="achievements.html" class="nav-item{{achievements}}">
                <span class="ni">🏅</span> Thành tích
            </a>

            <div class="nav-section-label" style="margin-top:8px;">Cài đặt</div>
            <a href="profile.html" class="nav-item{{profile}}">
                <span class="ni">👤</span> Hồ sơ
            </a>
            <a href="settings.html" class="nav-item{{settings}}">
                <span class="ni">⚙️</span> Cài đặt
            </a>
            <a href="#" class="nav-item" onclick="handleLogout()" style="color:var(--coral); margin-top: 10px; border-top: 1px dashed var(--kraft-light); padding-top: 15px;">
                <span class="ni">🚪</span> Đăng xuất
            </a>
        </nav>

        <div class="sidebar-bottom">
            <div class="user-card-mini">
                <div class="user-avatar-mini" data-user-field="avatar">🐱</div>
                <div class="user-info-mini">
                    <div class="user-name" data-user-field="display_name">Người dùng</div>
                    <div class="user-level" data-user-field="level_progress">⭐ <span data-user-field="xp">0</span> XP · Level <span data-user-field="level">1</span></div>
                </div>
            </div>
            <a href="emergency.html" class="emergency-btn">
                🆘 Hỗ trợ khẩn cấp
            </a>
        </div>
    </aside>`;

const filesToSkip = ['index.html', 'login.html', 'signup.html', '404.html', 'onboarding.html'];

for (const file of files) {
    if (filesToSkip.includes(file)) continue;

    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Also match if it only has `<aside class="sidebar"` without overlay
    const regexFull = /(<!-- Sidebar Overlay -->\s*)?(<div class="sidebar-overlay"[\s\S]*?<\/aside>)/i;
    const regexAsideOnly = /(<aside class="sidebar"[\s\S]*?<\/aside>)/i;

    let regexToUse = regexFull.test(content) ? regexFull : (regexAsideOnly.test(content) ? regexAsideOnly : null);

    if (regexToUse) {
        let replacement = sidebarTemplate;

        const pageName = file.replace('.html', '');
        const possiblePages = [
            'dashboard', 'mood-checkin', 'mood-assessment', 'tasks', 'journal', 
            'experts', 'community', 'report', 'achievements', 'profile', 'settings'
        ];
        
        for (let p of possiblePages) {
            if (pageName === p || (p === 'tasks' && pageName.startsWith('task-'))) {
                replacement = replacement.replace(new RegExp(`{{${p}}}`, 'g'), ' active');
            } else {
                replacement = replacement.replace(new RegExp(`{{${p}}}`, 'g'), '');
            }
        }
        replacement = replacement.replace(/{{[a-zA-Z-]+}}/g, '');

        content = content.replace(regexToUse, replacement);
        fs.writeFileSync(filePath, content);
        console.log('Successfully updated sidebar in ' + file);
    } else {
        console.log('Could not find sidebar block in ' + file);
    }
}
