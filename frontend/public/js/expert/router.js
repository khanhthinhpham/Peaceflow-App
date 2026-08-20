import { requireExpertUser } from './shell.js';

// Các trang nội dung của khu expert. Router chỉ chặn click trong phạm vi /expert/
// nên không đụng tới route trùng tên (vd dashboard.html của app người dùng).
const EXPERT_PAGES = new Set(['dashboard.html', 'payments.html', 'application.html', 'review-status.html', 'client-assessments.html']);

// Cố định trong session — reload trang (sau deploy mới) sẽ đổi version.
const SESSION_VERSION = Date.now();
let navSeq = 0;

function resolvePageName(value) {
    const name = new URL(value, window.location.href).pathname.split('/').pop() || 'dashboard.html';
    return EXPERT_PAGES.has(name) ? name : 'dashboard.html';
}

function getPageFromShellUrl(url = window.location.href) {
    const parsed = new URL(url, window.location.href);
    return resolvePageName(parsed.searchParams.get('page') || 'dashboard.html');
}

const ExpertRouter = {
    navigating: false,

    async init() {
        this.host = document.getElementById('expertPageHost');
        if (!this.host) {
            console.error('Expert router host not found');
            return;
        }

        // Gác cổng auth một lần cho cả khu expert (requireExpertUser tự redirect nếu fail).
        const user = await requireExpertUser();
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

        const name = nextUrl.pathname.split('/').pop() || '';
        // Chỉ SPA-hoá điều hướng nội bộ khu expert. Link "Về dashboard người dùng"
        // (../dashboard.html) nằm ngoài /expert/ → để trình duyệt điều hướng thật.
        if (!EXPERT_PAGES.has(name) || !nextUrl.pathname.includes('/expert/')) return;

        event.preventDefault();
        this.navigate(name, { history: 'push' });
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
                throw new Error(`Failed to load expert page ${pageUrl}: ${response.status}`);
            }
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            if (mySeq !== navSeq) return; // đã có điều hướng mới hơn, bỏ kết quả cũ

            document.title = doc.querySelector('title')?.textContent || 'Expert Portal — PeaceFlow';

            // Chỉ thay phần <main>; sidebar (#expertSidebar) nằm ngoài host nên giữ nguyên.
            const main = doc.querySelector('main.expert-main');
            this.host.replaceChildren(main ? document.importNode(main, true) : document.createElement('main'));
            window.scrollTo({ top: 0, behavior: 'auto' });

            // Chạy lại module của trang để init() dựng nội dung. Cache-bust theo lượt
            // điều hướng để init() chạy lại; các import dùng chung (auth/shell/api-client)
            // resolve về URL không query nên vẫn là singleton.
            const scriptSrc = doc.querySelector('script[type="module"][src]')?.getAttribute('src');
            if (scriptSrc) {
                const moduleUrl = new URL(scriptSrc, pageUrl);
                moduleUrl.searchParams.set('__v', `${SESSION_VERSION}-${mySeq}`);
                await import(moduleUrl.href);
            }
        } catch (error) {
            console.error('Expert SPA navigation failed, falling back to full load:', error);
            window.location.href = new URL(`./${page}`, window.location.href).href;
        } finally {
            this.navigating = false;
        }
    }
};

window.ExpertRouter = ExpertRouter;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ExpertRouter.init(), { once: true });
} else {
    ExpertRouter.init();
}
