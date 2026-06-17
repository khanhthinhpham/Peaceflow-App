(function () {
    const SPA_NAV_ENABLED = true;
    const DEBUG_ENABLED = () => localStorage.getItem('peaceflow_debug') === '1';
    const PAGE_TO_NAV_KEY = {
        'dashboard.html': 'dashboard',
        'mood-checkin.html': 'mood',
        'mood-chat.html': 'mood',
        'mood-assessment.html': 'mood',
        'tasks.html': 'tasks',
        'task-detail.html': 'tasks',
        'task-breathing.html': 'tasks',
        'task-meditation.html': 'tasks',
        'journal.html': 'journal',
        'experts.html': 'experts',
        'expert-booking.html': 'experts',
        'community.html': 'community',
        'report.html': 'report',
        'achievements.html': 'achievements',
        'profile.html': 'profile',
        'settings.html': 'settings'
    };

    const SPA_PAGES = new Set(Object.keys(PAGE_TO_NAV_KEY));
    const PERSISTENT_MOUNT_IDS = new Set([
        'sharedSidebarOverlayMount',
        'sharedMobileTopbarMount',
        'sharedSidebarMount'
    ]);
    const SHARED_SCRIPT_MARKERS = [
        '../public/components/sidebar.js',
        '../public/js/user-sync.js',
        '../public/js/app.js'
    ];

    const scriptUrl = document.currentScript?.src
        ? new URL(document.currentScript.src, window.location.href)
        : null;
    const templateUrl = scriptUrl
        ? new URL('./sidebar.html', scriptUrl).href
        : '../public/components/sidebar.html';
    const SIDEBAR_TEMPLATE_CACHE_KEY = 'peaceflow_sidebar_template_v4';
    const _spaHtmlCache = new Map(); // url -> { html, cachedAt }
    const SPA_HTML_CACHE_MS = 300_000; // 5 phút
    const SPA_SESSION_VERSION = Date.now();

    let sidebarMounted = false;
    let navigating = false;

    function markCurrentPageStyles() {
        document.head.querySelectorAll('style').forEach((node) => {
            node.setAttribute('data-spa-page-style', 'true');
        });
    }

    function getCurrentPageFromUrl(url = window.location.href) {
        const parsed = new URL(url, window.location.href);
        const pathname = parsed.pathname;
        const segments = pathname.split('/');
        const pageName = segments[segments.length - 1] || 'index.html';

        if (pageName === 'app.html') {
            const pageParam = parsed.searchParams.get('page');
            if (!pageParam) return 'dashboard.html';

            try {
                const nested = new URL(pageParam, window.location.href);
                const nestedSegments = nested.pathname.split('/');
                return nestedSegments[nestedSegments.length - 1] || 'dashboard.html';
            } catch (_error) {
                return String(pageParam).split('?')[0].split('#')[0] || 'dashboard.html';
            }
        }

        return pageName;
    }

    function isAppShellUrl(url = window.location.href) {
        const parsed = new URL(url, window.location.href);
        const pathname = parsed.pathname.split('/').pop() || '';
        return pathname === 'app.html' || Boolean(document.getElementById('spaPageHost'));
    }

    function isSpaPageUrl(url) {
        return SPA_PAGES.has(getCurrentPageFromUrl(url));
    }

    function markActiveNav(sidebarElement, url = window.location.href) {
        const currentPage = getCurrentPageFromUrl(url);
        const activeKey = PAGE_TO_NAV_KEY[currentPage];
        if (!activeKey) return;

        sidebarElement.querySelectorAll('[data-nav-key]').forEach((node) => {
            if (node.getAttribute('data-nav-key') === activeKey) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
    }

    function markSharedNav(url = window.location.href) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            markActiveNav(sidebar, url);
        }
    }

    function hasStoredUser() {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) return false;

        try {
            const user = JSON.parse(rawUser);
            return Boolean(user && typeof user === 'object' && (user.id || user.email || user.display_name || user.full_name));
        } catch (_error) {
            return false;
        }
    }

    function isAuthenticated() {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
            return false;
        }

        return hasStoredUser();
    }

    function syncSidebarAuthAction() {
        const actionLink = document.getElementById('sidebarAuthAction');
        const actionIcon = document.getElementById('sidebarAuthActionIcon');
        const actionText = document.getElementById('sidebarAuthActionText');
        if (!actionLink || !actionIcon || !actionText) return;

        if (isAuthenticated()) {
            actionLink.setAttribute('href', '#');
            actionLink.setAttribute('onclick', 'handleLogout()');
            actionText.textContent = 'Đăng xuất';
            actionIcon.textContent = '🚪';
        } else {
            actionLink.setAttribute('href', 'login.html');
            actionLink.removeAttribute('onclick');
            actionText.textContent = 'Đăng nhập';
            actionIcon.textContent = '🔐';
        }
    }

    function isApprovedExpert() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            return Boolean(user && user.is_expert);
        } catch (_error) {
            return false;
        }
    }

    // Hiện tag "Chuyên gia" cạnh tên và nút "Quản lý chuyên gia" khi user đã được duyệt.
    // Mọi phần tử có [data-expert-only] (vd tag cạnh lời chào ở dashboard) cũng được bật/tắt theo.
    function syncExpertUi() {
        const expert = isApprovedExpert();
        const tag = document.getElementById('sidebarExpertTag');
        const portalLink = document.getElementById('sidebarExpertPortal');
        if (tag) tag.style.display = expert ? '' : 'none';
        if (portalLink) portalLink.style.display = expert ? '' : 'none';
        document.querySelectorAll('[data-expert-only]').forEach((el) => {
            el.style.display = expert ? '' : 'none';
        });
    }

    function parseTemplateParts(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        return {
            overlay: doc.querySelector('[data-sidebar-part="overlay"]'),
            topbar: doc.querySelector('[data-sidebar-part="topbar"]'),
            sidebar: doc.querySelector('[data-sidebar-part="sidebar"]')
        };
    }

    function isPersistentBodyNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        if (PERSISTENT_MOUNT_IDS.has(node.id)) return true;
        if (node.tagName === 'SCRIPT') return true;
        return false;
    }

    function getReplaceableBodyNodes(root) {
        return Array.from(root.body.children).filter((node) => !isPersistentBodyNode(node));
    }

    function clearCurrentPageNodes() {
        getReplaceableBodyNodes(document).forEach((node) => node.remove());
    }

    function insertPageNodes(parsedDocument) {
        const scriptAnchor = Array.from(document.body.children).find((node) => node.tagName === 'SCRIPT') || null;
        const nodes = getReplaceableBodyNodes(parsedDocument).map((node) => document.importNode(node, true));

        if (!nodes.length) return;

        const fragment = document.createDocumentFragment();
        nodes.forEach((node) => fragment.appendChild(node));

        if (scriptAnchor) {
            document.body.insertBefore(fragment, scriptAnchor);
        } else {
            document.body.appendChild(fragment);
        }
    }

    function syncPageStyles(parsedDocument) {
        document.head.querySelectorAll('style[data-spa-page-style="true"]').forEach((node) => node.remove());

        parsedDocument.head.querySelectorAll('style').forEach((styleNode) => {
            const clone = document.createElement('style');
            clone.setAttribute('data-spa-page-style', 'true');
            clone.textContent = styleNode.textContent;
            document.head.appendChild(clone);
        });
    }

    function shouldSkipScript(scriptNode) {
        const src = scriptNode.getAttribute('src') || '';
        return SHARED_SCRIPT_MARKERS.some((marker) => src.includes(marker));
    }

    function rewriteModuleImports(code, baseUrl) {
        const replacer = (_match, prefix, specifier, suffix) => {
            if (!specifier.startsWith('./') && !specifier.startsWith('../')) return `${prefix}${specifier}${suffix}`;
            return `${prefix}${new URL(specifier, baseUrl).href}${suffix}`;
        };
        return code
            .replace(/(\bfrom\s+['"])([^'"]+)(['"])/g, replacer)
            .replace(/(\bimport\s*[\(\s]*['"])([^'"]+)(['"]\s*[\)]?)/g, replacer);
    }

    async function executeExternalScript(scriptNode, baseUrl) {
        const srcUrl = new URL(scriptNode.getAttribute('src'), baseUrl);
        srcUrl.searchParams.set('__v', String(SPA_SESSION_VERSION));
        await import(srcUrl.href);
    }

    async function executeInlineScript(scriptNode, baseUrl) {
        const moduleSource = rewriteModuleImports(String(scriptNode.textContent || ''), baseUrl);
        const blob = new Blob([`${moduleSource}\n//# sourceURL=spa-inline.mjs`], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        try {
            await import(blobUrl);
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    }

    async function executePageScripts(parsedDocument, baseUrl) {
        const captured = { windowLoad: [], documentReady: [] };
        const originalWindowAdd = window.addEventListener.bind(window);
        const originalDocumentAdd = document.addEventListener.bind(document);
        const previousOnload = window.onload;

        window.addEventListener = function (type, listener, options) {
            if (type === 'load') { captured.windowLoad.push(listener); return; }
            return originalWindowAdd(type, listener, options);
        };
        document.addEventListener = function (type, listener, options) {
            if (type === 'DOMContentLoaded') { captured.documentReady.push(listener); return; }
            return originalDocumentAdd(type, listener, options);
        };

        const scriptNodes = Array.from(parsedDocument.body.querySelectorAll('script')).filter((node) => !shouldSkipScript(node));

        try {
            for (const node of scriptNodes) {
                if (node.getAttribute('src')) {
                    await executeExternalScript(node, baseUrl);
                } else {
                    await executeInlineScript(node, baseUrl);
                }
            }
        } finally {
            window.addEventListener = originalWindowAdd;
            document.addEventListener = originalDocumentAdd;
        }

        captured.documentReady.forEach((listener) => {
            try { listener.call(document, new Event('DOMContentLoaded')); } catch (e) { console.error(e); }
        });
        captured.windowLoad.forEach((listener) => {
            try { listener.call(window, new Event('load')); } catch (e) { console.error(e); }
        });
        if (window.onload && window.onload !== previousOnload && typeof window.onload === 'function') {
            try { window.onload.call(window, new Event('load')); } catch (e) { console.error(e); }
        }
    }

    function updatePageMeta(parsedDocument) {
        const nextTitle = parsedDocument.querySelector('title');
        if (nextTitle) {
            document.title = nextTitle.textContent;
        }
    }

    function closeSidebarIfOpen() {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    async function loadSpaPage(url, options = {}) {
        if (navigating) return;
        navigating = true;

        try {
            const cached = _spaHtmlCache.get(url);
            let html;
            if (cached && (Date.now() - cached.cachedAt) < SPA_HTML_CACHE_MS) {
                html = cached.html;
            } else {
                const response = await fetch(url, { credentials: 'same-origin' });
                if (!response.ok) {
                    throw new Error(`Failed to load page ${url}: ${response.status}`);
                }
                html = await response.text();
                _spaHtmlCache.set(url, { html, cachedAt: Date.now() });
            }
            const parser = new DOMParser();
            const parsedDocument = parser.parseFromString(html, 'text/html');

            updatePageMeta(parsedDocument);
            syncPageStyles(parsedDocument);
            clearCurrentPageNodes();
            insertPageNodes(parsedDocument);
            await executePageScripts(parsedDocument, url);

            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                markActiveNav(sidebar, url);
            }

            closeSidebarIfOpen();
            window.scrollTo({ top: 0, behavior: 'auto' });

            const pageName = url.split('/').pop()?.split('?')[0] || '';
            window.__peaceflowCurrentPageSpec = pageName;

            if (window.UserSync?.sync) {
                window.UserSync.sync();
            }

            window.dispatchEvent(new CustomEvent('peaceflow:route-mounted', {
                detail: { page: pageName }
            }));

            if (options.pushState !== false) {
                window.history.pushState({ spa: true, url }, '', url);
            }
        } catch (error) {
            console.error('SPA navigation failed, falling back to full load:', error);
            window.location.href = url;
        } finally {
            navigating = false;
        }
    }

    function handleDocumentClick(event) {
        if (isAppShellUrl()) return;

        const anchor = event.target.closest('a[href]');
        if (!anchor) return;

        if (anchor.target && anchor.target !== '_self') return;
        if (anchor.hasAttribute('download')) return;
        if (anchor.getAttribute('href').startsWith('#')) return;

        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        if (!isSpaPageUrl(nextUrl.href)) return;
        if (DEBUG_ENABLED()) {
            console.info(`[FE_NAV] full_page_navigation from=${window.location.href} to=${nextUrl.href}`);
        }

        event.preventDefault();
        loadSpaPage(nextUrl.href);
    }

    async function mountSharedSidebar() {
        const startedAt = performance.now();
        const sidebarMount = document.getElementById('sharedSidebarMount');
        const topbarMount = document.getElementById('sharedMobileTopbarMount');
        const overlayMount = document.getElementById('sharedSidebarOverlayMount');

        if (!sidebarMount || !topbarMount || !overlayMount) return;
        if (sidebarMounted) return;

        try {
            let html = sessionStorage.getItem(SIDEBAR_TEMPLATE_CACHE_KEY);

            if (!html) {
                // Gắn version vào URL: force-cache chỉ so theo URL, nên khi template đổi
                // (bump version) URL mới sẽ không khớp cache cũ → fetch lại bản mới.
                const versionedUrl = `${templateUrl}${templateUrl.includes('?') ? '&' : '?'}v=4`;
                const response = await fetch(versionedUrl, { cache: 'force-cache' });
                if (!response.ok) {
                    throw new Error(`Sidebar template load failed: ${response.status}`);
                }
                html = await response.text();
                sessionStorage.setItem(SIDEBAR_TEMPLATE_CACHE_KEY, html);
            }
            const parts = parseTemplateParts(html);

            if (!parts.overlay || !parts.topbar || !parts.sidebar) {
                throw new Error('Sidebar template is missing required parts');
            }

            markActiveNav(parts.sidebar, window.location.href);

            overlayMount.replaceChildren(parts.overlay);
            topbarMount.replaceChildren(parts.topbar);
            sidebarMount.replaceChildren(parts.sidebar);

            sidebarMounted = true;
            if (DEBUG_ENABLED()) {
                console.info(`[FE_SIDEBAR] mounted duration_ms=${Math.round(performance.now() - startedAt)}`);
            }

            if (window.UserSync?.sync) {
                window.UserSync.sync();
            }
            syncSidebarAuthAction();
            syncExpertUi();

            // Render notification bell sau khi sidebar mount xong
            if (window.NotificationManager?.renderBell) {
                window.NotificationManager.renderBell();
            }
        } catch (error) {
            console.error('Failed to mount shared sidebar:', error);
        }
    }

    window.toggleSidebar = window.toggleSidebar || function toggleSidebar() {
        document.getElementById('sidebar')?.classList.toggle('open');
        document.getElementById('sidebarOverlay')?.classList.toggle('open');
        document.body.style.overflow = document.getElementById('sidebar')?.classList.contains('open') ? 'hidden' : '';
    };

    window.closeSidebar = window.closeSidebar || function closeSidebar() {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
        document.body.style.overflow = '';
    };

    window.mountSharedSidebar = mountSharedSidebar;
    window.loadSpaPage = loadSpaPage;
    window.markSharedNav = markSharedNav;
    window.syncSidebarAuthAction = syncSidebarAuthAction;
    window.syncExpertUi = syncExpertUi;

    window.addEventListener('storage', (event) => {
        if (event.key === 'access_token' || event.key === 'user') {
            syncSidebarAuthAction();
            syncExpertUi();
        }
    });

    // Khi /me trả về và merge vào localStorage (waitForAuth), cập nhật lại tag/nút chuyên gia.
    window.addEventListener('user-profile-updated', syncExpertUi);
    // Khi SPA mount trang mới, phần tử [data-expert-only] trong nội dung trang cần được cập nhật lại.
    window.addEventListener('peaceflow:route-mounted', syncExpertUi);

    if (SPA_NAV_ENABLED) {
        document.addEventListener('click', handleDocumentClick);
        window.addEventListener('popstate', () => {
            if (isAppShellUrl()) return;
            if (isSpaPageUrl(window.location.href)) {
                loadSpaPage(window.location.href, { pushState: false });
            }
        });
    }

    markCurrentPageStyles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            mountSharedSidebar();
            syncSidebarAuthAction();
        });
    } else {
        mountSharedSidebar();
        syncSidebarAuthAction();
    }
})();
