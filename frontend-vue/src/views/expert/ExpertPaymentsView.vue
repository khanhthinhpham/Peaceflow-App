<template>
  <main class="expert-main expert-payments-main">
    <header class="expert-topbar">
      <div>
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Thanh toán &amp; payout</h1>
        <p class="expert-page-subtitle">Cập nhật thủ công tài khoản nhận tiền và theo dõi số dư chờ chi trả của bạn.</p>
      </div>
      <div class="expert-badge">Payout settings</div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <section class="expert-payments-grid">
      <section class="expert-panel expert-section">
        <div class="expert-section-head">
          <div>
            <h2 class="expert-section-title">Tài khoản nhận payout</h2>
            <p class="expert-section-copy">PeaceFlow sẽ dùng thông tin này để đối soát và chi trả thu nhập cho bạn.</p>
          </div>
        </div>
        <div class="expert-payment-block">
          <div v-if="!paymentMethod?.has_method" class="expert-payment-state">
            <div class="expert-payment-state-card">
              <span class="expert-payment-state-label">Trạng thái hiện tại</span>
              <div class="expert-payment-state-value">Chưa có tài khoản nhận tiền</div>
              <p class="expert-payment-state-sub">Hãy thêm tài khoản payout để admin có thể đối soát và chi trả thu nhập cho bạn.</p>
            </div>
          </div>
          <div v-else class="expert-payment-state expert-payment-state-with-qr">
            <div class="expert-payment-state-main">
              <div class="expert-payment-state-card">
                <span class="expert-payment-state-label">Ngân hàng hiện tại</span>
                <div class="expert-payment-state-value">{{ paymentMethod.payout_bank_name || 'Chưa cập nhật' }}</div>
                <p class="expert-payment-state-sub">Chủ tài khoản: <strong>{{ paymentMethod.payout_account_name || 'Chưa có' }}</strong></p>
              </div>
              <div class="expert-payment-state-card">
                <span class="expert-payment-state-label">Số tài khoản hiển thị</span>
                <div class="expert-payment-state-value">{{ paymentMethod.payout_account_masked || 'Chưa có' }}</div>
                <p class="expert-payment-state-sub">Hệ thống chỉ hiển thị số đã che để tránh lộ đầy đủ thông tin nhạy cảm.</p>
              </div>
            </div>
            <div v-if="paymentMethod.payout_qr_url" class="expert-payment-state-card expert-payment-qr-card">
              <span class="expert-payment-state-label">QR tài khoản chuyên gia</span>
              <img :src="paymentMethod.payout_qr_url" alt="QR tài khoản chuyên gia" class="expert-payment-qr-image">
              <p class="expert-payment-state-sub">Bạn có thể dùng mã này để chia sẻ nhanh thông tin tài khoản nhận tiền khi cần.</p>
            </div>
            <div v-else class="expert-payment-state-card">
              <span class="expert-payment-state-label">QR tài khoản chuyên gia</span>
              <div class="expert-payment-state-value">Chưa tạo được QR</div>
              <p class="expert-payment-state-sub">Cần lưu tài khoản với ngân hàng từ danh sách để hệ thống tạo ảnh QR VietQR.</p>
            </div>
          </div>
        </div>
        <div class="expert-payment-block">
          <form class="expert-payment-form" @submit.prevent="savePaymentMethod">
            <div class="expert-payment-grid">
              <div class="expert-payment-field is-wide">
                <label class="expert-payment-label" for="payoutBankSelect">Ngân hàng</label>
                <select v-model="bankSelectValue" id="payoutBankSelect" class="expert-payment-select" @change="handleBankModeChange">
                  <option value="">Chọn ngân hàng</option>
                  <option v-for="bank in bankOptions" :key="bank.bin" :value="bank.bin">{{ bank.name }}</option>
                  <option value="__custom__">Khác / nhập tay</option>
                </select>
                <input v-if="bankSelectValue === '__custom__'" v-model="bankCustomName" class="expert-payment-input" type="text" maxlength="120" placeholder="Nhập tên ngân hàng">
                <div class="expert-payment-help">Nếu ngân hàng không có trong danh sách, bạn vẫn có thể nhập tay tên ngân hàng.</div>
              </div>
              <div class="expert-payment-field">
                <label class="expert-payment-label" for="payoutAccountNumber">Số tài khoản</label>
                <div style="display:flex;gap:8px;">
                  <input v-model="accountNumber" id="payoutAccountNumber" class="expert-payment-input" type="text" inputmode="numeric" maxlength="40" placeholder="Chỉ gồm chữ số" style="flex:1;min-width:0;">
                  <button v-if="paymentMethod?.lookup_enabled" type="button" class="btn-outline" style="white-space:nowrap;" :disabled="lookingUp" @click="lookupAccountName">Tra cứu tên</button>
                </div>
                <div v-if="paymentMethod?.lookup_enabled" class="expert-payment-help">Chọn ngân hàng + nhập số tài khoản rồi bấm <strong>Tra cứu tên</strong> để tự điền tên chủ tài khoản.</div>
              </div>
              <div class="expert-payment-field">
                <label class="expert-payment-label" for="payoutAccountName">Tên chủ tài khoản</label>
                <input v-model="accountName" id="payoutAccountName" class="expert-payment-input" type="text" maxlength="255" :placeholder="paymentMethod?.lookup_enabled ? 'Tự điền sau khi tra cứu (có thể sửa)' : 'Tên chủ tài khoản trên sao kê'">
              </div>
            </div>
            <div class="expert-payment-inline">
              <button type="submit" class="btn-primary" :disabled="saving">Lưu tài khoản nhận tiền</button>
              <span class="expert-payment-message" :class="messageTone ? `is-${messageTone}` : ''">{{ message }}</span>
            </div>
            <div class="expert-payment-help">
              Điền thủ công đúng tên chủ tài khoản như trên sao kê ngân hàng. Sau khi thay đổi, hệ thống sẽ gửi email thông báo cho bạn.
            </div>
          </form>
        </div>
      </section>

      <aside class="expert-payments-side">
        <section class="expert-panel expert-section">
          <div class="expert-section-head">
            <div>
              <h2 class="expert-section-title">Số dư chờ chi trả</h2>
              <p class="expert-section-copy">Theo dõi tiền khả dụng, tổng đã nhận và phần còn chờ hoàn tất phiên.</p>
            </div>
          </div>
          <div class="expert-payment-block">
            <div class="expert-payment-summary-grid">
              <article class="expert-payment-earning-card is-highlight">
                <span class="expert-payment-earning-label">Số dư khả dụng</span>
                <div class="expert-payment-earning-value">{{ money(earnings?.balance || 0) }}</div>
              </article>
              <article class="expert-payment-earning-card">
                <span class="expert-payment-earning-label">Tổng đã nhận</span>
                <div class="expert-payment-earning-value">{{ money(earnings?.total_earned || 0) }}</div>
              </article>
            </div>
            <div class="expert-payment-state-card" style="margin-top:14px;">
              <span class="expert-payment-state-label">Đang chờ hoàn tất phiên</span>
              <div class="expert-payment-state-value">{{ money(earnings?.pending || 0) }}</div>
              <p class="expert-payment-state-sub">Khoản này sẽ chuyển sang số dư khả dụng sau khi buổi tư vấn được hoàn thành và đối soát.</p>
            </div>
          </div>
        </section>

        <section class="expert-panel expert-section">
          <div class="expert-section-head">
            <div>
              <h2 class="expert-section-title">Lưu ý vận hành</h2>
              <p class="expert-section-copy">Các điểm tối thiểu để payout an toàn hơn khi chạy production.</p>
            </div>
          </div>
          <div class="expert-payment-block">
            <ul class="expert-payment-note-list">
              <li>Đổi tài khoản nhận tiền sẽ gửi email thông báo cho chính bạn.</li>
              <li>UI chỉ hiển thị số tài khoản đã che, tránh lộ toàn bộ thông tin nhạy cảm.</li>
              <li>Điền đúng tên chủ tài khoản như trên sao kê để admin đối soát và chi trả chính xác.</li>
            </ul>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../../lib/apiClient';
import { useExpertPortalStore } from '../../stores/expertPortal';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';

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

function money(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0));
}

const router = useRouter();
const expertPortal = useExpertPortalStore();

const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

const bankOptions = ref([...FALLBACK_BANKS]);
const paymentMethod = ref(null);
const earnings = ref(null);

const bankSelectValue = ref('');
const bankCustomName = ref('');
const accountNumber = ref('');
const accountName = ref('');
const message = ref('');
const messageTone = ref('');
const saving = ref(false);
const lookingUp = ref(false);

function setMessage(text, tone = '') {
  message.value = text || '';
  messageTone.value = tone;
}

function handleBankModeChange() {
  setMessage('');
}

async function loadBankOptions() {
  try {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const json = await response.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    if (rows.length) {
      bankOptions.value = rows
        .map((item) => ({ bin: String(item.bin || '').trim(), name: String(item.shortName || item.name || '').trim() }))
        .filter((item) => item.bin && item.name);
    }
  } catch (_error) {
    bankOptions.value = [...FALLBACK_BANKS];
  }
}

async function loadPageData() {
  const [pm, e] = await Promise.all([
    apiClient.get('/expert-portal/payment-method', { noCache: true }),
    apiClient.get('/expert-portal/earnings', { noCache: true })
  ]);
  paymentMethod.value = pm || {};
  earnings.value = e || {};
  applyFormFromState();
}

function applyFormFromState() {
  const currentBin = paymentMethod.value?.payout_bank_bin || '';
  const currentName = paymentMethod.value?.payout_bank_name || '';
  const known = bankOptions.value.some((item) => item.bin === currentBin);
  bankSelectValue.value = known ? currentBin : '__custom__';
  bankCustomName.value = known ? '' : currentName;
  accountNumber.value = '';
  accountName.value = '';
}

function resolveSelectedBank() {
  if (bankSelectValue.value === '__custom__') {
    return { bin: null, name: bankCustomName.value.trim() };
  }
  const bank = bankOptions.value.find((item) => item.bin === bankSelectValue.value);
  return { bin: bank?.bin || null, name: bank?.name || '' };
}

async function lookupAccountName() {
  const bank = resolveSelectedBank();
  const number = accountNumber.value.trim();

  if (!bank.bin) {
    setMessage('Chọn ngân hàng trong danh sách để tra cứu (ngân hàng nhập tay không tra cứu được).', 'error');
    return;
  }
  if (!/^[0-9]+$/.test(number)) {
    setMessage('Nhập số tài khoản hợp lệ trước khi tra cứu.', 'error');
    return;
  }

  lookingUp.value = true;
  setMessage('Đang tra cứu tên chủ tài khoản...', 'muted');
  try {
    const res = await apiClient.post('/expert-portal/payment-method/lookup', { bin: bank.bin, account_number: number });
    if (res?.account_name) accountName.value = res.account_name;
    setMessage('✓ Đã tra cứu tên chủ tài khoản.', 'success');
  } catch (error) {
    setMessage(error.message || 'Không tra cứu được. Bạn có thể nhập tên thủ công.', 'error');
  } finally {
    lookingUp.value = false;
  }
}

async function savePaymentMethod() {
  const bank = resolveSelectedBank();
  const number = accountNumber.value.trim();
  const name = accountName.value.trim();

  if (!bank.name) { setMessage('Vui lòng chọn hoặc nhập tên ngân hàng.', 'error'); return; }
  if (!/^[0-9]+$/.test(number)) { setMessage('Số tài khoản chỉ gồm chữ số.', 'error'); return; }
  if (!name) { setMessage('Vui lòng nhập tên chủ tài khoản.', 'error'); return; }

  saving.value = true;
  setMessage('Đang lưu tài khoản nhận tiền...', 'muted');
  try {
    await apiClient.put('/expert-portal/payment-method', {
      payout_bank_name: bank.name,
      payout_bank_bin: bank.bin,
      payout_account_number: number,
      payout_account_name: name
    });

    await loadPageData();
    setMessage('Đã lưu tài khoản nhận tiền. Hệ thống cũng đã gửi email thông báo thay đổi.', 'success');
    setBanner('Đã cập nhật phương thức nhận thanh toán.', 'success');
  } catch (error) {
    setMessage(error.message || 'Không thể lưu tài khoản nhận tiền.', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const { overview } = await expertPortal.load();
    if (!overview?.expert) {
      router.replace('/expert-apply');
      return;
    }

    await Promise.all([loadBankOptions(), loadPageData()]);
  } catch (error) {
    console.error('Expert payments load failed:', error);
    setBanner('Không thể tải cài đặt thanh toán lúc này.', 'error');
  }
});
</script>

<style scoped src="../../assets/expertPayments.css"></style>
