const GUEST_EMERGENCY_KEY = 'peaceflow_guest_emergency';

function getParsedUrl(value = window.location.href) {
    return new URL(value, window.location.href);
}

export function getCurrentPageName(url = window.location.href) {
    const parsed = getParsedUrl(url);
    return parsed.pathname.split('/').pop() || 'index.html';
}

export function buildGuestEmergencyUrl(page) {
    const target = String(page || 'tasks.html').trim() || 'tasks.html';
    return `${target}${target.includes('?') ? '&' : '?'}guest_emergency=1`;
}

export function isGuestEmergencyRequested(url = window.location.href) {
    const parsed = getParsedUrl(url);
    const requested = parsed.searchParams.get('guest_emergency') === '1';

    if (requested) {
        sessionStorage.setItem(GUEST_EMERGENCY_KEY, '1');
        return true;
    }

    return sessionStorage.getItem(GUEST_EMERGENCY_KEY) === '1';
}

export function clearGuestEmergencyMode() {
    sessionStorage.removeItem(GUEST_EMERGENCY_KEY);
}

export function isGuestEmergencyModeActive(isAuthenticated) {
    if (isAuthenticated) {
        clearGuestEmergencyMode();
        return false;
    }

    return isGuestEmergencyRequested();
}

export function guardGuestEmergencyPage(options = {}) {
    const {
        isAuthenticated = false,
        allowedPages = ['tasks.html', 'task-detail.html', 'task-breathing.html', 'task-meditation.html'],
        loginUrl = 'login.html'
    } = options;

    const active = isGuestEmergencyModeActive(isAuthenticated);
    if (!active) return false;

    const currentPage = getCurrentPageName();
    if (!new Set(allowedPages).has(currentPage)) {
        window.location.replace(loginUrl);
        return false;
    }

    return true;
}

export function applyGuestEmergencyLinkGuards(options = {}) {
    const {
        selectors = ['.nav-item', '.sidebar-logo', '.mobile-topbar a', '.breadcrumb a'],
        allowedPages = ['tasks.html', 'task-detail.html', 'task-breathing.html', 'task-meditation.html'],
        loginUrl = 'login.html'
    } = options;

    const allowed = new Set(allowedPages);

    selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((anchor) => {
            if (!(anchor instanceof HTMLAnchorElement)) return;

            const href = anchor.getAttribute('href') || '';
            if (!href || href.startsWith('#')) return;

            const pageName = getCurrentPageName(href);
            if (allowed.has(pageName)) {
                anchor.href = buildGuestEmergencyUrl(pageName);
                return;
            }

            anchor.href = loginUrl;
        });
    });
}
