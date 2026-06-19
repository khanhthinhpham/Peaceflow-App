import { apiClient } from '../api-client.js';
import { mountExpertShell, requireExpertUser, showExpertBanner, loadExpertData } from './shell.js';
import { escapeHtml, formatCurrency } from './utils.js';

const FALLBACK_BANKS = [
    { bin: '970436', name: 'Vietcombank' },
    { bin: '970418', name: 'BIDV' },
    { bin: '970415', name: 'VietinBank' },
    { bin: '970407', name: 'Techcombank' },
    { bin: '970422', name: 'MB Bank' },
    { bin: '970432', name: 'VPBank' },
    { bin: '970403', name: 'Sacombank' },
    { bin: '970405', name: 'Agribank' },
    { bin: '970416', name: 'ACB' },
    { bin: '970423', name: 'TPBank' },
    { bin: '970441', name: 'VIB' },
    { bin: '970400', name: 'Saigonbank' },
    { bin: '970448', name: 'OCB' },
    { bin: '970437', name: 'HDBank' },
    { bin: '970440', name: 'SeABank' },
    { bin: '970438', name: 'BaoViet Bank' }
];

let bankOptions = [...FALLBACK_BANKS];
let paymentMethodState = null;
let earningsState = null;

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'payments',
        title: 'Thanh toán & payout',
        subtitle: 'Cập nhật thủ công tài khoản nhận tiền và theo dõi số dư chờ chi trả của bạn.',
        badgeText: 'Payout settings'
    });

    try {
        const { application, overview } = await loadExpertData();
        if (!overview?.expert) {
            const status = application?.application?.status;
            const target = status === 'pending' ? 'review-status.html' : 'application.html';
            const router = window.ExpertRouter;
            if (router?.navigate && !router.navigating) {
                router.navigate(target, { history: 'replace' });
            } else {
                window.location.replace(`app.html?page=${target}`);
            }
            return;
        }

        await Promise.all([loadBankOptions(), loadPageData()]);
        renderPage();
    } catch (error) {
        console.error('Expert payments load failed:', error);
        showExpertBanner('Không thể tải cài đặt thanh toán lúc này.', 'error');
    }
}

async function loadPageData() {
    const [paymentMethod, earnings] = await Promise.all([
        apiClient.get('/expert-portal/payment-method', { noCache: true }),
        apiClient.get('/expert-portal/earnings', { noCache: true })
    ]);

    paymentMethodState = paymentMethod || {};
    earningsState = earnings || {};
}

async function loadBankOptions() {
    try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const json = await response.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (rows.length) {
            bankOptions = rows
                .map((item) => ({
                    bin: String(item.bin || '').trim(),
                    name: String(item.shortName || item.name || '').trim()
                }))
                .filter((item) => item.bin && item.name);
        }
    } catch (_error) {
        bankOptions = [...FALLBACK_BANKS];
    }
}

function renderPage() {
    renderSummary();
    renderEarningsSummary();
    renderForm();
}

function renderSummary() {
    const el = document.getElementById('paymentMethodSummary');
    if (!el) return;

    if (!paymentMethodState?.has_method) {
        el.innerHTML = `
            <div class="expert-payment-state">
                <div class="expert-payment-state-card">
                    <span class="expert-payment-state-label">Trạng thái hiện tại</span>
                    <div class="expert-payment-state-value">Chưa có tài khoản nhận tiền</div>
                    <p class="expert-payment-state-sub">Hãy thêm tài khoản payout để admin có thể đối soát và chi trả thu nhập cho bạn.</p>
                </div>
            </div>
        `;
        return;
    }

    const qrBlock = paymentMethodState.payout_qr_url
        ? `
            <div class="expert-payment-state-card expert-payment-qr-card">
                <span class="expert-payment-state-label">QR tài khoản chuyên gia</span>
                <img src="${escapeHtml(paymentMethodState.payout_qr_url)}" alt="QR tài khoản chuyên gia" class="expert-payment-qr-image">
                <p class="expert-payment-state-sub">Bạn có thể dùng mã này để chia sẻ nhanh thông tin tài khoản nhận tiền khi cần.</p>
            </div>
        `
        : `
            <div class="expert-payment-state-card">
                <span class="expert-payment-state-label">QR tài khoản chuyên gia</span>
                <div class="expert-payment-state-value">Chưa tạo được QR</div>
                <p class="expert-payment-state-sub">Cần lưu tài khoản với ngân hàng từ danh sách để hệ thống tạo ảnh QR VietQR.</p>
            </div>
        `;

    el.innerHTML = `
        <div class="expert-payment-state expert-payment-state-with-qr">
            <div class="expert-payment-state-main">
                <div class="expert-payment-state-card">
                    <span class="expert-payment-state-label">Ngân hàng hiện tại</span>
                    <div class="expert-payment-state-value">${escapeHtml(paymentMethodState.payout_bank_name || 'Chưa cập nhật')}</div>
                    <p class="expert-payment-state-sub">Chủ tài khoản: <strong>${escapeHtml(paymentMethodState.payout_account_name || 'Chưa có')}</strong></p>
                </div>
                <div class="expert-payment-state-card">
                    <span class="expert-payment-state-label">Số tài khoản hiển thị</span>
                    <div class="expert-payment-state-value">${escapeHtml(paymentMethodState.payout_account_masked || 'Chưa có')}</div>
                    <p class="expert-payment-state-sub">Hệ thống chỉ hiển thị số đã che để tránh lộ đầy đủ thông tin nhạy cảm.</p>
                </div>
            </div>
            ${qrBlock}
        </div>
    `;
}

function renderEarningsSummary() {
    const el = document.getElementById('paymentEarningsSummary');
    if (!el) return;

    el.innerHTML = `
        <div class="expert-payment-summary-grid">
            <article class="expert-payment-earning-card is-highlight">
                <span class="expert-payment-earning-label">Số dư khả dụng</span>
                <div class="expert-payment-earning-value">${formatCurrency(earningsState?.balance || 0)}</div>
            </article>
            <article class="expert-payment-earning-card">
                <span class="expert-payment-earning-label">Tổng đã nhận</span>
                <div class="expert-payment-earning-value">${formatCurrency(earningsState?.total_earned || 0)}</div>
            </article>
        </div>
        <div class="expert-payment-state-card" style="margin-top:14px;">
            <span class="expert-payment-state-label">Đang chờ hoàn tất phiên</span>
            <div class="expert-payment-state-value">${formatCurrency(earningsState?.pending || 0)}</div>
            <p class="expert-payment-state-sub">Khoản này sẽ chuyển sang số dư khả dụng sau khi buổi tư vấn được hoàn thành và đối soát.</p>
        </div>
    `;
}

function renderForm() {
    const el = document.getElementById('paymentMethodForm');
    if (!el) return;

    const currentBin = paymentMethodState?.payout_bank_bin || '';
    const currentName = paymentMethodState?.payout_bank_name || '';
    const selectedValue = bankOptions.some((item) => item.bin === currentBin) ? currentBin : '__custom__';
    const customVisible = selectedValue === '__custom__';
    const lookupEnabled = !!paymentMethodState?.lookup_enabled;

    el.innerHTML = `
        <form id="expertPaymentForm" class="expert-payment-form">
            <div class="expert-payment-grid">
                <div class="expert-payment-field is-wide">
                    <label class="expert-payment-label" for="payoutBankSelect">Ngân hàng</label>
                    <select id="payoutBankSelect" class="expert-payment-select">
                        <option value="">Chọn ngân hàng</option>
                        ${bankOptions.map((bank) => `<option value="${escapeHtml(bank.bin)}" ${bank.bin === currentBin ? 'selected' : ''}>${escapeHtml(bank.name)}</option>`).join('')}
                        <option value="__custom__" ${customVisible ? 'selected' : ''}>Khác / nhập tay</option>
                    </select>
                    <input id="payoutBankCustom" class="expert-payment-input" type="text" maxlength="120" placeholder="Nhập tên ngân hàng" value="${escapeHtml(customVisible ? currentName : '')}" style="${customVisible ? '' : 'display:none;'}">
                    <div class="expert-payment-help">Nếu ngân hàng không có trong danh sách, bạn vẫn có thể nhập tay tên ngân hàng.</div>
                </div>
                <div class="expert-payment-field">
                    <label class="expert-payment-label" for="payoutAccountNumber">Số tài khoản</label>
                    <div style="display:flex;gap:8px;">
                        <input id="payoutAccountNumber" class="expert-payment-input" type="text" inputmode="numeric" maxlength="40" placeholder="Chỉ gồm chữ số" style="flex:1;min-width:0;">
                        ${lookupEnabled ? '<button type="button" id="lookupBtn" class="btn-outline" style="white-space:nowrap;">Tra cứu tên</button>' : ''}
                    </div>
                    ${lookupEnabled ? '<div class="expert-payment-help">Chọn ngân hàng + nhập số tài khoản rồi bấm <strong>Tra cứu tên</strong> để tự điền tên chủ tài khoản.</div>' : ''}
                </div>
                <div class="expert-payment-field">
                    <label class="expert-payment-label" for="payoutAccountName">Tên chủ tài khoản</label>
                    <input id="payoutAccountName" class="expert-payment-input" type="text" maxlength="255" placeholder="${lookupEnabled ? 'Tự điền sau khi tra cứu (có thể sửa)' : 'Tên chủ tài khoản trên sao kê'}">
                </div>
            </div>
            <div class="expert-payment-inline">
                <button type="submit" id="savePaymentBtn" class="btn-primary">Lưu tài khoản nhận tiền</button>
                <span id="paymentMethodMsg" class="expert-payment-message is-muted"></span>
            </div>
            <div class="expert-payment-help">
                Điền thủ công đúng tên chủ tài khoản như trên sao kê ngân hàng. Sau khi thay đổi, hệ thống sẽ gửi email thông báo cho bạn.
            </div>
        </form>
    `;

    document.getElementById('payoutBankSelect')?.addEventListener('change', handleBankModeChange);
    document.getElementById('expertPaymentForm')?.addEventListener('submit', savePaymentMethod);
    document.getElementById('lookupBtn')?.addEventListener('click', lookupAccountName);
}

// Tra cứu tên chủ tài khoản qua VietQR (nếu admin đã cấu hình key).
async function lookupAccountName() {
    const bank = resolveSelectedBank();
    const accountNumber = document.getElementById('payoutAccountNumber')?.value.trim() || '';
    const btn = document.getElementById('lookupBtn');

    if (!bank.bin) {
        setMessage('Chọn ngân hàng trong danh sách để tra cứu (ngân hàng nhập tay không tra cứu được).', 'error');
        return;
    }
    if (!/^[0-9]+$/.test(accountNumber)) {
        setMessage('Nhập số tài khoản hợp lệ trước khi tra cứu.', 'error');
        return;
    }

    if (btn) btn.disabled = true;
    setMessage('Đang tra cứu tên chủ tài khoản...', 'muted');
    try {
        const res = await apiClient.post('/expert-portal/payment-method/lookup', {
            bin: bank.bin,
            account_number: accountNumber
        });
        const nameInput = document.getElementById('payoutAccountName');
        if (nameInput && res?.account_name) nameInput.value = res.account_name;
        setMessage('✓ Đã tra cứu tên chủ tài khoản.', 'success');
    } catch (error) {
        setMessage(error.message || 'Không tra cứu được. Bạn có thể nhập tên thủ công.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

function handleBankModeChange() {
    const select = document.getElementById('payoutBankSelect');
    const custom = document.getElementById('payoutBankCustom');
    const isCustom = select?.value === '__custom__';
    if (custom) custom.style.display = isCustom ? '' : 'none';
    setMessage('');
}

function resolveSelectedBank() {
    const select = document.getElementById('payoutBankSelect');
    const custom = document.getElementById('payoutBankCustom');
    const value = select?.value || '';

    if (value === '__custom__') {
        return {
            bin: null,
            name: custom?.value.trim() || ''
        };
    }

    const bank = bankOptions.find((item) => item.bin === value);
    return {
        bin: bank?.bin || null,
        name: bank?.name || ''
    };
}

async function savePaymentMethod(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('savePaymentBtn');
    const accountInput = document.getElementById('payoutAccountNumber');
    const accountNameInput = document.getElementById('payoutAccountName');
    const bank = resolveSelectedBank();
    const accountNumber = accountInput?.value.trim() || '';
    const accountName = (accountNameInput?.value || '').trim();

    if (!bank.name) {
        setMessage('Vui lòng chọn hoặc nhập tên ngân hàng.', 'error');
        return;
    }
    if (!/^[0-9]+$/.test(accountNumber)) {
        setMessage('Số tài khoản chỉ gồm chữ số.', 'error');
        return;
    }
    if (!accountName) {
        setMessage('Vui lòng nhập tên chủ tài khoản.', 'error');
        return;
    }

    saveBtn.disabled = true;
    setMessage('Đang lưu tài khoản nhận tiền...', 'muted');
    try {
        await apiClient.put('/expert-portal/payment-method', {
            payout_bank_name: bank.name,
            payout_bank_bin: bank.bin,
            payout_account_number: accountNumber,
            payout_account_name: accountName
        });

        await loadPageData();
        renderPage();
        setMessage('Đã lưu tài khoản nhận tiền. Hệ thống cũng đã gửi email thông báo thay đổi.', 'success');
        showExpertBanner('Đã cập nhật phương thức nhận thanh toán.', 'success');
    } catch (error) {
        setMessage(error.message || 'Không thể lưu tài khoản nhận tiền.', 'error');
    } finally {
        saveBtn.disabled = false;
    }
}

function setMessage(text, tone = '') {
    const el = document.getElementById('paymentMethodMsg');
    if (!el) return;
    el.textContent = text || '';
    el.className = `expert-payment-message${tone ? ` is-${tone}` : ''}`;
}

init();
