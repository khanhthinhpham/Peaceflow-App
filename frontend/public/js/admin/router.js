import { requireAdmin } from './shell.js';

const ADMIN_PAGES = new Set([
    'dashboard.html',
    'experts.html',
    'bookings.html',
    'payments.html',
    'users.html',
    'community.html',
    'assessment-results.html'
]);

const SESSION_VERSION = Date.now();
let navSeq = 0;

function resolvePageName(value) {
    const name = new URL(value, window.location.href).pathname.split('/').pop() || 'dashboard.html';
    return ADMIN_PAGES.has(name) ? name : 'dashboard.html';
}

function getPageFromShellUrl(url = window.location.href) {
    const parsed = new URL(url, window.location.href);
    return resolvePageName(parsed.searchParams.get('page') || 'dashboard.html');
}

const AdminRouter = {
    navigating: false,

    async init() {
        this.host = document.getElementById('adminPageHost');
        if (!this.host) {
            console.error('Admin router host not found');
            return;
        }

        const user = await requireAdmin();
        if (!user) return;

        document.addEventListener('click', (event) => this.handleDocumentClick(event));
        window.addEventListener('popstate', () => {
            this.navigate(getPageFromShellUrl(window.location.href), { history: 'replace' });
        });

        this.navigate(getPageFromShellUrl(window.location.href), { history: 'replace' });
    },

    handleDocumentClick(event) {
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;
        if (anchor.target && anchor.target !== '_self') return;
        if (anchor.hasAttribute('download')) return;
        if ((anchor.getAttribute('href') || '').startsWith('#')) return;

        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        if (!nextUrl.pathname.includes('/admin/')) return;

        const rawName = nextUrl.pathname.split('/').pop() || '';
        const page = resolvePageName(nextUrl.searchParams.get('page') || rawName);
        if (!nextUrl.searchParams.has('page') && !ADMIN_PAGES.has(rawName)) return;

        event.preventDefault();
        this.navigate(page, { history: 'push' });
    },

    async navigate(page, options = {}) {
        if (this.navigating) return;
        this.navigating = true;
        const mySeq = ++navSeq;
        const shellUrl = `app.html?page=${encodeURIComponent(page)}`;

        try {
            if (options.history === 'replace') {
                window.history.replaceState({ page }, '', shellUrl);
            } else {
                window.history.pushState({ page }, '', shellUrl);
            }

            const pageUrl = new URL(`./${page}`, window.location.href).href;
            const response = await fetch(pageUrl, { credentials: 'same-origin' });
            if (!response.ok) {
                throw new Error(`Failed to load admin page ${pageUrl}: ${response.status}`);
            }

            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            if (mySeq !== navSeq) return;

            document.title = doc.querySelector('title')?.textContent || 'Trang quản trị - PeaceFlow';

            const main = doc.querySelector('main.admin-main');
            this.host.replaceChildren(main ? document.importNode(main, true) : document.createElement('main'));
            window.scrollTo({ top: 0, behavior: 'auto' });

            const scriptSrc = doc.querySelector('script[type="module"][src]')?.getAttribute('src');
            if (scriptSrc) {
                const moduleUrl = new URL(scriptSrc, pageUrl);
                moduleUrl.searchParams.set('__v', `${SESSION_VERSION}-${mySeq}`);
                await import(moduleUrl.href);
            }
        } catch (error) {
            console.error('Admin SPA navigation failed, switching to full load:', error);
            window.location.href = new URL(`./${page}`, window.location.href).href;
        } finally {
            this.navigating = false;
        }
    }
};

window.AdminRouter = AdminRouter;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminRouter.init(), { once: true });
} else {
    AdminRouter.init();
}
