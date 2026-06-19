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
let lookedUpAccountName = '';

async function init() {
    const user = await requireExpertUser();
    if (!user) return;

    mountExpertShell({
        active: 'payments',
        title: 'Thanh toán & payout',
        subtitle: 'Cập nhật tài khoản nhận tiền, tra cứu tên chủ tài khoản và theo dõi số dư chờ chi trả.',
        badgeText: 'Payout settings'
    });

    try {
        const { application, overview } = await loadExpertData();
        if (!overview?.expert) {
            const status = application?.application?.status;
            const target = status === 'pending' ? 'review-status.html' : 'application.html';
            window.location.replace(`app.html?page=${target}`);
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

    el.innerHTML = `
        <div class="expert-payment-state">
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
    const lookupReady = Boolean(paymentMethodState?.lookup_enabled);
    const accountNameReadonly = lookupReady && !customVisible;

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
                    <div class="expert-payment-help">Nếu ngân hàng không có trong danh sách, bạn vẫn có thể nhập tay tên ngân hàng ở chế độ dự phòng.</div>
                </div>
                <div class="expert-payment-field">
                    <label class="expert-payment-label" for="payoutAccountNumber">Số tài khoản</label>
                    <input id="payoutAccountNumber" class="expert-payment-input" type="text" inputmode="numeric" maxlength="40" placeholder="Chỉ gồm chữ số">
                </div>
                <div class="expert-payment-field">
                    <label class="expert-payment-label" for="payoutAccountName">Tên chủ tài khoản</label>
                    <input id="payoutAccountName" class="expert-payment-input" type="text" placeholder="${accountNameReadonly ? 'Bấm tra cứu để tự điền' : 'Tên chủ tài khoản trên sao kê'}" value="" ${accountNameReadonly ? 'readonly' : ''}>
                </div>
            </div>
            <div class="expert-payment-inline">
                <button type="button" id="lookupAccountBtn" class="btn-outline">Tra cứu tên tài khoản</button>
                <button type="submit" id="savePaymentBtn" class="btn-primary">Lưu tài khoản nhận tiền</button>
                <span id="paymentMethodMsg" class="expert-payment-message is-muted"></span>
            </div>
            <div class="expert-payment-help">
                ${lookupReady
                    ? 'Khi server đã cấu hình VietQR, tên chủ tài khoản sẽ được backend xác minh lại trước khi lưu.'
                    : 'Server chưa cấu hình VietQR lookup. Bạn vẫn có thể lưu theo chế độ dự phòng, nhưng nên bật lookup trên production.'}
            </div>
        </form>
    `;

    document.getElementById('payoutBankSelect')?.addEventListener('change', handleBankModeChange);
    document.getElementById('lookupAccountBtn')?.addEventListener('click', lookupAccountName);
    document.getElementById('expertPaymentForm')?.addEventListener('submit', savePaymentMethod);
}

function handleBankModeChange() {
    const select = document.getElementById('payoutBankSelect');
    const custom = document.getElementById('payoutBankCustom');
    const accountName = document.getElementById('payoutAccountName');
    const isCustom = select?.value === '__custom__';
    const shouldReadonly = Boolean(paymentMethodState?.lookup_enabled) && !isCustom;
    if (custom) custom.style.display = isCustom ? '' : 'none';
    if (accountName) {
        accountName.value = '';
        accountName.readOnly = shouldReadonly;
        accountName.placeholder = shouldReadonly ? 'Bấm tra cứu để tự điền' : 'Tên chủ tài khoản trên sao kê';
    }
    lookedUpAccountName = '';
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

async function lookupAccountName() {
    const accountInput = document.getElementById('payoutAccountNumber');
    const accountName = document.getElementById('payoutAccountName');
    const lookupBtn = document.getElementById('lookupAccountBtn');
    const bank = resolveSelectedBank();
    const accountNumber = accountInput?.value.trim() || '';

    if (!bank.name) {
        setMessage('Vui lòng chọn ngân hàng trước khi tra cứu.', 'error');
        return;
    }
    if (!bank.bin) {
        setMessage('Ngân hàng nhập tay không hỗ trợ tra cứu tự động. Bạn có thể lưu theo chế độ dự phòng.', 'error');
        return;
    }
    if (!/^[0-9]+$/.test(accountNumber)) {
        setMessage('Số tài khoản chỉ gồm chữ số.', 'error');
        return;
    }

    lookupBtn.disabled = true;
    setMessage('Đang tra cứu tên chủ tài khoản...', 'muted');
    try {
        const result = await apiClient.post('/expert-portal/payment-method/lookup', {
            bin: bank.bin,
            account_number: accountNumber
        });
        lookedUpAccountName = result.account_name || '';
        if (accountName) {
            accountName.value = lookedUpAccountName;
        }
        setMessage('Đã tra cứu thành công. Bạn có thể lưu tài khoản này.', 'success');
    } catch (error) {
        lookedUpAccountName = '';
        if (accountName) accountName.value = '';
        setMessage(error.message || 'Không tra cứu được tên tài khoản.', 'error');
    } finally {
        lookupBtn.disabled = false;
    }
}

async function savePaymentMethod(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('savePaymentBtn');
    const accountInput = document.getElementById('payoutAccountNumber');
    const accountNameInput = document.getElementById('payoutAccountName');
    const bank = resolveSelectedBank();
    const accountNumber = accountInput?.value.trim() || '';
    const accountName = (accountNameInput?.value || lookedUpAccountName || '').trim();

    if (!bank.name) {
        setMessage('Vui lòng chọn hoặc nhập tên ngân hàng.', 'error');
        return;
    }
    if (!/^[0-9]+$/.test(accountNumber)) {
        setMessage('Số tài khoản chỉ gồm chữ số.', 'error');
        return;
    }
    if (!accountName) {
        setMessage('Vui lòng tra cứu hoặc nhập tên chủ tài khoản.', 'error');
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
        lookedUpAccountName = '';
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
