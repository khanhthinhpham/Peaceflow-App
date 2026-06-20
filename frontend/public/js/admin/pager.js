// Phân trang dùng chung cho mọi danh sách admin (kiểu như tab Người dùng).
export function pageWindow(current, total) {
    const pages = new Set([0, total - 1, current, current - 1, current + 1]);
    const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
    const out = [];
    let prev = null;
    for (const p of sorted) {
        if (prev !== null && p - prev > 1) out.push('…');
        out.push(p);
        prev = p;
    }
    return out;
}

// el: phần tử chứa pager. page: trang hiện tại (0-based). totalPages. onGo(p): callback đổi trang.
export function renderPager(el, { page, totalPages, onGo }) {
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    const cur = page;
    const last = totalPages - 1;
    const parts = [];
    parts.push(`<button type="button" class="admin-page-btn" data-page="0" ${cur === 0 ? 'disabled' : ''} title="Trang đầu">« Đầu</button>`);
    parts.push(`<button type="button" class="admin-page-btn" data-page="${cur - 1}" ${cur === 0 ? 'disabled' : ''}>‹ Trước</button>`);
    for (const p of pageWindow(cur, totalPages)) {
        parts.push(p === '…'
            ? '<span class="admin-page-ellipsis">…</span>'
            : `<button type="button" class="admin-page-btn${p === cur ? ' active' : ''}" data-page="${p}">${p + 1}</button>`);
    }
    parts.push(`<button type="button" class="admin-page-btn" data-page="${cur + 1}" ${cur >= last ? 'disabled' : ''}>Sau ›</button>`);
    parts.push(`<button type="button" class="admin-page-btn" data-page="${last}" ${cur >= last ? 'disabled' : ''} title="Trang cuối">Cuối »</button>`);
    el.innerHTML = parts.join('');
    el.querySelectorAll('.admin-page-btn[data-page]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (!Number.isNaN(p) && p !== page) {
                onGo(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}
