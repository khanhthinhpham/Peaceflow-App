(function () {
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

    let sidebarMounted = false;
    let navigating = false;

    function markCurrentPageStyles() {
        document.head.querySelectorAll('style').forEach((node) => {
            node.setAttribute('data-spa-page-style', 'true');
        });
    }

    function getCurrentPageFromUrl(url = window.location.href) {
        const pathname = new URL(url, window.location.href).pathname;
        const segments = pathname.split('/');
        return segments[segments.length - 1] || 'index.html';
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

    function executeScriptNode(scriptNode) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            if (scriptNode.type) script.type = scriptNode.type;
            if (scriptNode.noModule) script.noModule = true;

            if (scriptNode.src) {
                script.src = new URL(scriptNode.getAttribute('src'), window.location.href).href;
                script.onload = () => {
                    script.remove();
                    resolve();
                };
                script.onerror = (error) => {
                    script.remove();
                    reject(error);
                };
            } else {
                script.textContent = scriptNode.textContent;
            }

            document.body.appendChild(script);

            if (!scriptNode.src) {
                script.remove();
                resolve();
            }
        });
    }

    async function executePageScripts(parsedDocument) {
        const captured = {
            windowLoad: [],
            documentReady: []
        };

        const originalWindowAdd = window.addEventListener.bind(window);
        const originalDocumentAdd = document.addEventListener.bind(document);
        const previousOnload = window.onload;

        window.addEventListener = function patchedWindowAddEventListener(type, listener, options) {
            if (type === 'load') {
                captured.windowLoad.push(listener);
                return;
            }
            return originalWindowAdd(type, listener, options);
        };

        document.addEventListener = function patchedDocumentAddEventListener(type, listener, options) {
            if (type === 'DOMContentLoaded') {
                captured.documentReady.push(listener);
                return;
            }
            return originalDocumentAdd(type, listener, options);
        };

        const scriptNodes = Array.from(parsedDocument.body.querySelectorAll('script')).filter((node) => !shouldSkipScript(node));

        try {
            for (const node of scriptNodes) {
                await executeScriptNode(node);
            }
        } finally {
            window.addEventListener = originalWindowAdd;
            document.addEventListener = originalDocumentAdd;
        }

        captured.documentReady.forEach((listener) => {
            try {
                listener.call(document, new Event('DOMContentLoaded'));
            } catch (error) {
                console.error('DOMContentLoaded callback failed during SPA navigation:', error);
            }
        });

        captured.windowLoad.forEach((listener) => {
            try {
                listener.call(window, new Event('load'));
            } catch (error) {
                console.error('Load callback failed during SPA navigation:', error);
            }
        });

        if (window.onload && window.onload !== previousOnload && typeof window.onload === 'function') {
            try {
                window.onload.call(window, new Event('load'));
            } catch (error) {
                console.error('window.onload failed during SPA navigation:', error);
            }
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
            const response = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Failed to load page ${url}: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const parsedDocument = parser.parseFromString(html, 'text/html');

            updatePageMeta(parsedDocument);
            syncPageStyles(parsedDocument);
            clearCurrentPageNodes();
            insertPageNodes(parsedDocument);
            await executePageScripts(parsedDocument);

            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                markActiveNav(sidebar, url);
            }

            closeSidebarIfOpen();
            window.scrollTo({ top: 0, behavior: 'auto' });

            if (window.UserSync?.sync) {
                window.UserSync.sync();
            }

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
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;

        if (anchor.target && anchor.target !== '_self') return;
        if (anchor.hasAttribute('download')) return;
        if (anchor.getAttribute('href').startsWith('#')) return;

        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        if (!isSpaPageUrl(nextUrl.href)) return;

        event.preventDefault();
        loadSpaPage(nextUrl.href);
    }

    async function mountSharedSidebar() {
        const sidebarMount = document.getElementById('sharedSidebarMount');
        const topbarMount = document.getElementById('sharedMobileTopbarMount');
        const overlayMount = document.getElementById('sharedSidebarOverlayMount');

        if (!sidebarMount || !topbarMount || !overlayMount) return;
        if (sidebarMounted) return;

        try {
            const response = await fetch(templateUrl, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Sidebar template load failed: ${response.status}`);
            }

            const html = await response.text();
            const parts = parseTemplateParts(html);

            if (!parts.overlay || !parts.topbar || !parts.sidebar) {
                throw new Error('Sidebar template is missing required parts');
            }

            markActiveNav(parts.sidebar, window.location.href);

            overlayMount.replaceChildren(parts.overlay);
            topbarMount.replaceChildren(parts.topbar);
            sidebarMount.replaceChildren(parts.sidebar);

            sidebarMounted = true;

            if (window.UserSync?.sync) {
                window.UserSync.sync();
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

    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('popstate', () => {
        if (isSpaPageUrl(window.location.href)) {
            loadSpaPage(window.location.href, { pushState: false });
        }
    });

    markCurrentPageStyles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountSharedSidebar);
    } else {
        mountSharedSidebar();
    }
})();
