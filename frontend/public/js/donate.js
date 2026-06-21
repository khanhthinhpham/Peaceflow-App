import { apiClient } from './api-client.js';

// Modal ủng hộ (donate) nhẹ — mở từ bất kỳ nút [data-donate]. Không cần trang riêng.
const PRESETS = [20000, 50000, 100000, 200000];
let bankInfo = null;
let selectedAmount = 50000;

function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }

function qrUrl(amount) {
    if (!bankInfo) return '';
    const bank = encodeURIComponent(bankInfo.bank_id);
    const acc = encodeURIComponent(bankInfo.account_no);
    const name = encodeURIComponent(bankInfo.account_name || 'PEACEFLOW');
    const info = encodeURIComponent('UNG HO PEACEFLOW');
    const amt = amount ? `&amount=${amount}` : '';
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?addInfo=${info}${amt}&accountName=${name}`;
}

function renderQr() {
    const img = document.getElementById('donateQrImg');
    const amtLabel = document.getElementById('donateAmtLabel');
    if (img) img.src = qrUrl(selectedAmount);
    if (amtLabel) amtLabel.textContent = selectedAmount ? money(selectedAmount) : 'Tuỳ tâm';
    document.querySelectorAll('[data-amt]').forEach((b) => {
        b.classList.toggle('donate-amt-active', Number(b.getAttribute('data-amt')) === selectedAmount);
    });
}

export async function openDonateModal() {
    if (document.getElementById('donateModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'donateModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(74,55,40,.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:18px;';
    overlay.innerHTML = `
        <div style="background:var(--warm-white,#fffdf7);border:2px solid var(--kraft-light,#e8cba7);border-radius:18px;box-shadow:4px 4px 0 rgba(74,55,40,.15);max-width:380px;width:100%;max-height:92vh;overflow:auto;padding:22px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div>
                    <div style="font-size:1.6rem;">❤️</div>
                    <h2 style="margin:4px 0 2px;font-size:1.2rem;font-weight:800;">Ủng hộ PeaceFlow</h2>
                    <p style="margin:0;font-size:0.82rem;color:var(--text-secondary,#7a6555);line-height:1.5;">Đóng góp của bạn giúp PeaceFlow tiếp tục miễn phí cho mọi người. Cảm ơn bạn 🌿</p>
                </div>
                <button type="button" id="donateClose" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-light,#a89585);line-height:1;">✕</button>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 6px;">
                ${PRESETS.map((a) => `<button type="button" class="donate-amt" data-amt="${a}">${money(a)}</button>`).join('')}
                <button type="button" class="donate-amt" data-amt="0">Tuỳ tâm</button>
            </div>

            <div id="donateBody" style="text-align:center;margin-top:12px;color:var(--text-secondary,#7a6555);font-size:0.85rem;">Đang tải mã QR…</div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => { overlay.remove(); document.body.style.overflow = ''; };
    document.getElementById('donateClose').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // style cho nút mức tiền
    if (!document.getElementById('donateStyle')) {
        const st = document.createElement('style');
        st.id = 'donateStyle';
        st.textContent = `
            .donate-amt{flex:1;min-width:84px;padding:9px 8px;border:1.5px solid var(--kraft-light,#e8cba7);background:var(--warm-white,#fffdf7);border-radius:10px;font-family:inherit;font-weight:800;font-size:.85rem;cursor:pointer;color:var(--text-secondary,#7a6555);}
            .donate-amt:hover{background:var(--mint-light,#c5e8d2);}
            .donate-amt.donate-amt-active{background:var(--mint,#a8d5ba);border-color:var(--mint-dark,#7bbf95);color:var(--text-primary,#4a3728);}
        `;
        document.head.appendChild(st);
    }

    try {
        if (!bankInfo) bankInfo = await apiClient.get('/donate/info', { noCache: true });
    } catch (_e) {
        document.getElementById('donateBody').innerHTML = '<span style="color:var(--coral);">Không tải được thông tin ủng hộ. Vui lòng thử lại.</span>';
        return;
    }

    document.getElementById('donateBody').innerHTML = `
        <img id="donateQrImg" alt="QR ủng hộ PeaceFlow" style="width:200px;height:200px;object-fit:contain;border:1px solid var(--kraft-light,#e8cba7);border-radius:12px;background:#fff;">
        <div style="font-size:0.82rem;margin-top:10px;line-height:1.6;">
            Quét QR bằng app ngân hàng · Số tiền: <strong id="donateAmtLabel"></strong>
        </div>
        <div style="font-size:0.8rem;color:var(--text-light,#a89585);margin-top:8px;line-height:1.6;">
            ${bankInfo.account_name || ''}<br>
            <strong style="font-family:monospace;">${bankInfo.account_no || ''}</strong> · ${bankInfo.bank_id || ''}<br>
            Nội dung: <strong>UNG HO PEACEFLOW</strong>
        </div>
    `;
    overlay.querySelectorAll('[data-amt]').forEach((b) => {
        b.addEventListener('click', () => { selectedAmount = Number(b.getAttribute('data-amt')); renderQr(); });
    });
    renderQr();
}

window.openDonateModal = openDonateModal;

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-donate]');
    if (trigger) { e.preventDefault(); openDonateModal(); }
});
