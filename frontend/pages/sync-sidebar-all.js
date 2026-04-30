const fs = require('fs');
const path = require('path');

const dir = 'c:/Dự án/PeaceFlow.vn/frontend/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const filesToSkip = ['login.html', 'signup.html', '404.html', 'onboarding.html', 'index.html'];

function updateSidebar(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    if (filesToSkip.includes(fileName)) return;

    console.log(`Updating ${fileName}...`);

    // 1. Update Favicon
    content = content.replace(/<link rel="icon" href="[^"]+">/, '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>">');

    // 2. Remove old sidebar blocks
    // This is tricky because the structure varies slightly, but we can target the main parts
    content = content.replace(/<div class="sidebar-overlay"[\s\S]*?<\/aside>/, '<div id="app-sidebar"></div>');
    
    // Also remove any mobile-topbar that might be outside the aside
    content = content.replace(/<div class="mobile-topbar"[\s\S]*?<\/div>\s*/, '');

    // 3. Add sidebar.js script if not present
    if (!content.includes('sidebar.js')) {
        content = content.replace('</body>', '    <script src="./sidebar.js"></script>\n</body>');
    } else {
        // Ensure path is ./sidebar.js
        content = content.replace(/<script src="(\.\/)?sidebar\.js"><\/script>/, '<script src="./sidebar.js"></script>');
    }

    // 4. Update CSS for spacing
    // We'll target the .sidebar-nav and .nav-item blocks
    content = content.replace(/\.sidebar-nav\s*{[\s\S]*?}/, `.sidebar-nav {
            flex: 1;
            padding: 0 12px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow-y: auto;
        }`);

    content = content.replace(/\.nav-item\s*{[\s\S]*?}/, `.nav-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: var(--border-radius-sm);
            text-decoration: none;
            color: var(--text-secondary);
            font-weight: 600;
            font-size: 0.88rem;
            transition: var(--transition);
            line-height: 1.2;
        }`);

    content = content.replace(/\.nav-section-label\s*{[\s\S]*?}/, `.nav-section-label {
            font-size: 0.68rem;
            font-weight: 700;
            color: var(--text-light);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 8px 12px 2px;
        }`);
        
    content = content.replace(/\.user-card-mini\s*{[\s\S]*?}/, `.user-card-mini {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: var(--cream);
            border-radius: var(--border-radius-sm);
            border: 1.5px solid var(--kraft-light);
            line-height: 1.2;
        }`);

    content = content.replace(/\.emergency-btn\s*{[\s\S]*?}/, `.emergency-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(255, 139, 139, 0.1);
            border: 1.5px solid var(--coral);
            border-radius: var(--border-radius-sm);
            color: var(--coral);
            font-size: 0.78rem;
            font-weight: 700;
            line-height: 1.2;
        }`);

    fs.writeFileSync(filePath, content);
}

files.forEach(f => updateSidebar(path.join(dir, f)));
console.log('Done!');
