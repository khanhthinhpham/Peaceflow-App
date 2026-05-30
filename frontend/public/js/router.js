// Cố định trong suốt session — reset khi user reload trang (sau deploy mới)
const SESSION_VERSION = Date.now();
const _htmlCache = new Map(); // spec -> { html, cachedAt }
const HTML_CACHE_MS = 300_000; // 5 phút

const ROUTE_PAGE_NAMES = new Set([
    'dashboard.html',
    'mood-checkin.html',
    'mood-chat.html',
    'mood-assessment.html',
    'tasks.html',
    'task-detail.html',
    'task-breathing.html',
    'task-meditation.html',
    'journal.html',
    'experts.html',
    'expert-booking.html',
    'community.html',
    'report.html',
    'achievements.html',
    'profile.html',
    'settings.html',
    'emergency.html'
]);

const SHARED_SCRIPT_MARKERS = [
    '../public/components/sidebar.js',
    '../public/js/user-sync.js',
    '../public/js/app.js',
    '../public/js/router.js'
];

const PAGE_STYLE_ATTR = 'data-router-page-style';
const EMBED_STYLE_ID = 'router-embedded-page-style';
const ROUTER_DEBUG = () => localStorage.getItem('peaceflow_debug') === '1';

function logRouter(message, extra = '') {
    if (!ROUTER_DEBUG()) return;
    if (extra) {
        console.info(`[FE_ROUTER] ${message} ${extra}`);
        return;
    }
    console.info(`[FE_ROUTER] ${message}`);
}

function normalizeContentSpec(value) {
    const raw = String(value || 'dashboard.html').trim();
    const parsed = new URL(raw, window.location.href);
    const pageName = parsed.pathname.split('/').pop() || 'dashboard.html';

    if (!ROUTE_PAGE_NAMES.has(pageName)) {
        return 'dashboard.html';
    }

    return `${pageName}${parsed.search}${parsed.hash}`;
}

function getShellContentSpec(url = window.location.href) {
    const parsed = new URL(url, window.location.href);
    const pathname = parsed.pathname.split('/').pop() || '';
    if (pathname !== 'app.html') {
        return normalizeContentSpec(pathname || 'dashboard.html');
    }
    return normalizeContentSpec(parsed.searchParams.get('page') || 'dashboard.html');
}

function buildShellUrl(contentSpec) {
    return `app.html?page=${encodeURIComponent(normalizeContentSpec(contentSpec))}`;
}

function getContentFetchUrl(contentSpec) {
    return new URL(contentSpec, window.location.href).href;
}

function shouldSkipScript(scriptNode) {
    const src = scriptNode.getAttribute('src') || '';
    return SHARED_SCRIPT_MARKERS.some((marker) => src.includes(marker));
}

function shouldExecutePageScript(scriptNode) {
    if (shouldSkipScript(scriptNode)) {
        return false;
    }

    const rawType = (scriptNode.getAttribute('type') || '').trim().toLowerCase();
    const isJavaScriptType = !rawType
        || rawType === 'text/javascript'
        || rawType === 'application/javascript'
        || rawType === 'module';

    if (!isJavaScriptType) {
        return false;
    }
    return true;
}

function rewriteModuleImports(code, baseUrl) {
    const replacer = (_match, prefix, specifier, suffix) => {
        if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
            return `${prefix}${specifier}${suffix}`;
        }
        return `${prefix}${new URL(specifier, baseUrl).href}${suffix}`;
    };

    return code
        .replace(/(\bfrom\s+['"])([^'"]+)(['"])/g, replacer)
        .replace(/(\bimport\s*[\(\s]*['"])([^'"]+)(['"]\s*[\)]?)/g, replacer);
}

async function executeExternalScript(scriptNode, baseUrl) {
    const srcUrl = new URL(scriptNode.getAttribute('src'), baseUrl);
    // Dùng SESSION_VERSION thay vì navVersion — cùng session → cùng URL → browser cache module
    // Reload trang sau deploy mới → SESSION_VERSION đổi → scripts fresh
    srcUrl.searchParams.set('__v', String(SESSION_VERSION));
    await import(srcUrl.href);
}

async function executeInlineScript(scriptNode, baseUrl) {
    const moduleSource = rewriteModuleImports(String(scriptNode.textContent || ''), baseUrl);
    const blob = new Blob([`${moduleSource}\n//# sourceURL=router-inline.mjs`], { type: 'text/javascript' });
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

    try {
        const allScriptNodes = Array.from(parsedDocument.body.querySelectorAll('script'));
        const scriptNodes = allScriptNodes.filter((node) => shouldExecutePageScript(node));

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
        try {
            listener.call(document, new Event('DOMContentLoaded'));
        } catch (error) {
            console.error('DOMContentLoaded callback failed during route navigation:', error);
        }
    });

    captured.windowLoad.forEach((listener) => {
        try {
            listener.call(window, new Event('load'));
        } catch (error) {
            console.error('Load callback failed during route navigation:', error);
        }
    });

    if (window.onload && window.onload !== previousOnload && typeof window.onload === 'function') {
        try {
            window.onload.call(window, new Event('load'));
        } catch (error) {
            console.error('window.onload failed during route navigation:', error);
        }
    }
}

function getPageBodyNodes(parsedDocument) {
    return Array.from(parsedDocument.body.children).filter((node) => {
        if (node.tagName === 'SCRIPT') return false;
        if (node.id === 'sharedSidebarOverlayMount') return false;
        if (node.id === 'sharedMobileTopbarMount') return false;
        if (node.id === 'sharedSidebarMount') return false;
        if (node.id === 'spaPageHost') return false;
        if (node.id === 'sidebar') return false;
        if (node.id === 'sidebarOverlay') return false;
        if (node.classList?.contains('sidebar')) return false;
        if (node.classList?.contains('mobile-topbar')) return false;
        if (node.classList?.contains('sidebar-overlay')) return false;
        return true;
    });
}

function syncPageStyles(parsedDocument) {
    document.head.querySelectorAll(`style[${PAGE_STYLE_ATTR}="true"]`).forEach((node) => node.remove());
    parsedDocument.head.querySelectorAll('style').forEach((styleNode) => {
        const clone = document.createElement('style');
        clone.setAttribute(PAGE_STYLE_ATTR, 'true');
        clone.textContent = styleNode.textContent;
        document.head.appendChild(clone);
    });

    let embedStyle = document.getElementById(EMBED_STYLE_ID);
    if (!embedStyle) {
        embedStyle = document.createElement('style');
        embedStyle.id = EMBED_STYLE_ID;
        embedStyle.textContent = `
            #spaPageHost .sidebar,
            #spaPageHost .mobile-topbar,
            #spaPageHost .sidebar-overlay,
            #spaPageHost #sidebar,
            #spaPageHost #sidebarOverlay {
                display: none !important;
            }

            #spaPageHost .main-content,
            #spaPageHost main.main-content {
                margin-left: 0 !important;
                padding-top: 28px !important;
            }

            @media (max-width: 900px) {
                #spaPageHost .main-content,
                #spaPageHost main.main-content {
                    margin-left: 0 !important;
                    padding-top: 28px !important;
                }
            }
        `;
        document.head.appendChild(embedStyle);
    }
}

const AppRouter = {
    state: {
        currentSpec: null,
        navigating: false,
        navVersion: 0
    },

    init() {
        this.host = document.getElementById('spaPageHost');
        this.loading = document.getElementById('spaPageLoading');

        if (!this.host) {
            console.error('Router host not found');
            return;
        }

        document.addEventListener('click', (event) => this.handleDocumentClick(event));
        window.addEventListener('popstate', () => {
            this.navigate(getShellContentSpec(window.location.href), { history: 'replace' });
        });

        this.navigate(getShellContentSpec(window.location.href), { history: 'replace' });
    },

    showLoading() {
        this.host.classList.add('is-loading');
        if (this.loading) this.loading.hidden = false;
    },

    hideLoading() {
        this.host.classList.remove('is-loading');
        if (this.loading) this.loading.hidden = true;
    },

    async navigate(contentSpec, options = {}) {
        if (this.state.navigating) return;

        const nextSpec = normalizeContentSpec(contentSpec);
        const shellUrl = buildShellUrl(nextSpec);
        const historyMode = options.history || 'push';

        this.state.navigating = true;
        this.state.navVersion += 1;
        const currentVersion = this.state.navVersion;
        const startedAt = performance.now();

        try {
            if (historyMode === 'replace') {
                window.history.replaceState({ page: nextSpec }, '', shellUrl);
            } else if (historyMode === 'push') {
                window.history.pushState({ page: nextSpec }, '', shellUrl);
            }

            this.showLoading();
            if (typeof window.markSharedNav === 'function') {
                window.markSharedNav(shellUrl);
            }
            if (typeof window.closeSidebar === 'function') {
                window.closeSidebar();
            }

            const fetchUrl = getContentFetchUrl(nextSpec);
            logRouter('navigate:start', `to=${nextSpec} mode=${historyMode}`);

            // Dùng cache HTML nếu còn trong TTL, tránh fetch lại mỗi lần chuyển tab
            const cachedPage = _htmlCache.get(nextSpec);
            let html;
            if (cachedPage && (Date.now() - cachedPage.cachedAt) < HTML_CACHE_MS) {
                html = cachedPage.html;
                logRouter('navigate:cache-hit', `spec=${nextSpec}`);
            } else {
                const response = await fetch(fetchUrl, { credentials: 'same-origin' });
                if (!response.ok) {
                    throw new Error(`Failed to load route ${fetchUrl}: ${response.status}`);
                }
                html = await response.text();
                _htmlCache.set(nextSpec, { html, cachedAt: Date.now() });
            }

            const parsedDocument = new DOMParser().parseFromString(html, 'text/html');

            document.title = parsedDocument.querySelector('title')?.textContent || 'PeaceFlow';
            syncPageStyles(parsedDocument);
            this.host.replaceChildren(
                ...(this.loading ? [this.loading] : []),
                ...getPageBodyNodes(parsedDocument).map((node) => document.importNode(node, true))
            );
            await executePageScripts(parsedDocument, fetchUrl);

            if (this.loading && !this.host.contains(this.loading)) {
                this.host.prepend(this.loading);
            }

            this.state.currentSpec = nextSpec;
            window.__peaceflowCurrentPageSpec = nextSpec;
            if (window.UserSync?.sync) {
                window.UserSync.sync();
            }
            window.dispatchEvent(new CustomEvent('peaceflow:route-mounted', {
                detail: {
                    page: nextSpec
                }
            }));
            logRouter('navigate:done', `to=${nextSpec} duration_ms=${Math.round(performance.now() - startedAt)}`);
            window.scrollTo({ top: 0, behavior: 'auto' });
        } catch (error) {
            console.error('Route navigation failed:', error);
            logRouter('navigate:error', `to=${nextSpec} message=${error.message}`);
            window.location.href = nextSpec;
            return;
        } finally {
            this.hideLoading();
            this.state.navigating = false;
        }
    },

    handleDocumentClick(event) {
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;
        if (anchor.target && anchor.target !== '_self') return;
        if (anchor.hasAttribute('download')) return;
        if ((anchor.getAttribute('href') || '').startsWith('#')) return;

        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;

        const pageName = nextUrl.pathname.split('/').pop() || '';
        if (pageName === 'app.html') {
            event.preventDefault();
            this.navigate(getShellContentSpec(nextUrl.href), { history: 'push' });
            return;
        }

        if (!ROUTE_PAGE_NAMES.has(pageName)) return;

        event.preventDefault();
        this.navigate(`${pageName}${nextUrl.search}${nextUrl.hash}`, { history: 'push' });
    }
};

window.AppRouter = AppRouter;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppRouter.init(), { once: true });
} else {
    AppRouter.init();
}
