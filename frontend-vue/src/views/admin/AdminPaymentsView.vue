<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Thanh toán và payout</h1>
        <p class="admin-page-sub">Xác nhận tiền vào tài khoản nền tảng và chốt chi trả cho chuyên gia.</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <select v-model="limit" class="admin-input" aria-label="Số dòng mỗi trang" title="Số dòng mỗi trang" style="max-width:130px;" @change="limit = Number(limit); loadPayments(0); loadPayouts(0)">
          <option :value="10">10 / trang</option>
          <option :value="25">25 / trang</option>
          <option :value="50">50 / trang</option>
          <option :value="100">100 / trang</option>
        </select>
        <button type="button" class="btn-outline" @click="refreshAll">Tải lại</button>
      </div>
    </div>

    <h2 style="margin:6px 0 12px;font-size:1.25rem;font-weight:800;">Chờ xác nhận thanh toán</h2>
    <div class="admin-card" style="font-size:.85rem;color:var(--text-secondary);line-height:1.55;">
      Đối chiếu đúng số tiền và nội dung chuyển khoản rồi bấm xác nhận để chuyển booking sang bước chờ chuyên gia nhận lịch.
      Nếu không thấy tiền, có thể từ chối để hủy đơn.
    </div>
    <div style="font-size:.82rem;color:var(--text-light);margin-bottom:8px;">{{ payMetaText }}</div>

    <div v-if="payLoading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="payError" class="admin-card admin-empty" style="color:var(--coral);">{{ payError }}</div>
    <div v-else-if="!payRows.length" class="admin-card admin-empty">Không có booking nào đang chờ xác nhận thanh toán.</div>
    <template v-else>
      <div v-for="booking in payRows" :key="booking.id" class="admin-card">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:800;">{{ booking.client_name }} <span style="color:var(--text-light);font-weight:600;">→ {{ booking.expert_name }}</span></div>
            <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">{{ TYPE[booking.session_type] || booking.session_type }} · {{ dt(booking.starts_at) }}</div>
            <div v-if="booking.notes" style="color:var(--text-secondary);font-size:0.82rem;margin-top:6px;">Ghi chú: {{ booking.notes }}</div>
          </div>
          <div style="text-align:right;min-width:160px;">
            <div style="font-size:1.2rem;font-weight:800;color:var(--coral);">{{ money(booking.amount) }}</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);">Nội dung chuyển khoản</div>
            <div style="font-weight:800;font-family:monospace;">{{ booking.content || '' }}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end;">
          <button type="button" class="btn-outline" :disabled="actingId === booking.id" @click="rejectPayment(booking.id)">Từ chối</button>
          <button type="button" class="btn-primary" :disabled="actingId === booking.id" @click="act(`/admin/bookings/${booking.id}/confirm-payment`, booking.id)">Xác nhận đã nhận tiền</button>
        </div>
      </div>
    </template>
    <AdminPager :page="payPage" :total-pages="payTotalPages" @go="loadPayments" />

    <h2 style="margin:30px 0 12px;font-size:1.25rem;font-weight:800;">Chi trả cho chuyên gia</h2>
    <div class="admin-card" style="font-size:.85rem;color:var(--text-secondary);line-height:1.55;">
      Đây là số dư khả dụng đang chờ đối soát. Sau khi chuyển khoản thực tế cho chuyên gia, bấm chi trả để ghi nhận và đưa số dư về 0.
    </div>
    <div style="font-size:.82rem;color:var(--text-light);margin-bottom:8px;">{{ poMetaText }}</div>

    <div v-if="poLoading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="poError" class="admin-card admin-empty" style="color:var(--coral);">{{ poError }}</div>
    <div v-else-if="!poRows.length" class="admin-card admin-empty">Không có số dư nào cần chi trả.</div>
    <template v-else>
      <div v-for="expert in poRows" :key="expert.id" class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-weight:800;">{{ expert.full_name }}</div>
          <div style="font-size:0.82rem;color:var(--text-secondary);">{{ expert.email || '' }}</div>
          <div v-if="expert.payout_account_number" style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;">
            <span v-html="icon('card')"></span> {{ expert.payout_bank_name || '' }} · <strong style="font-family:monospace;">{{ expert.payout_account_number }}</strong>{{ expert.payout_account_name ? ' · ' + expert.payout_account_name : '' }}
          </div>
          <div v-else style="font-size:0.82rem;color:var(--coral-dark);margin-top:4px;">
            <span v-html="icon('alert')"></span> Chưa cập nhật tài khoản nhận tiền
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.2rem;font-weight:800;color:var(--mint-dark,#7BBF95);">{{ money(expert.balance) }}</div>
          <button type="button" class="btn-primary" style="margin-top:6px;" :disabled="actingId === expert.id" @click="payoutExpert(expert.id)">Chi trả</button>
        </div>
      </div>
    </template>
    <AdminPager :page="poPage" :total-pages="poTotalPages" @go="loadPayouts" />
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { useAdminBadgesStore } from '../../stores/adminBadges';
import { icon } from '../../lib/adminIcons';
import AdminPager from '../../components/AdminPager.vue';

const badges = useAdminBadgesStore();

function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
  try {
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}

const TYPE = { chat: 'Chat text', voice: 'Gọi thoại', video: 'Video call', inperson: 'Gặp trực tiếp' };

const limit = ref(10);
const actingId = ref(null);

const payPage = ref(0);
const payTotal = ref(0);
const payRows = ref([]);
const payLoading = ref(false);
const payError = ref('');
const payTotalPages = computed(() => Math.max(1, Math.ceil(payTotal.value / limit.value)));
const payMetaText = computed(() => {
  if (payLoading.value || payError.value || !payRows.value.length) return '';
  return `${payPage.value * limit.value + 1}–${payPage.value * limit.value + payRows.value.length} trong ${payTotal.value} đơn · Trang ${payPage.value + 1}/${payTotalPages.value}`;
});

async function loadPayments(page = payPage.value) {
  payPage.value = Math.max(0, page);
  payLoading.value = true;
  payError.value = '';
  try {
    const qs = new URLSearchParams({ limit: String(limit.value), offset: String(payPage.value * limit.value) });
    const data = await apiClient.get(`/admin/bookings/pending-payment?${qs.toString()}`, { noCache: true });
    payRows.value = data?.bookings || [];
    payTotal.value = data?.total || 0;
    badges.setBadge('payments', payTotal.value);
  } catch (_e) {
    payError.value = 'Không tải được danh sách chờ xác nhận thanh toán.';
  } finally {
    payLoading.value = false;
  }
}

const poPage = ref(0);
const poTotal = ref(0);
const poRows = ref([]);
const poLoading = ref(false);
const poError = ref('');
const poTotalPages = computed(() => Math.max(1, Math.ceil(poTotal.value / limit.value)));
const poMetaText = computed(() => {
  if (poLoading.value || poError.value || !poRows.value.length) return '';
  return `${poPage.value * limit.value + 1}–${poPage.value * limit.value + poRows.value.length} trong ${poTotal.value} chuyên gia · Trang ${poPage.value + 1}/${poTotalPages.value}`;
});

async function loadPayouts(page = poPage.value) {
  poPage.value = Math.max(0, page);
  poLoading.value = true;
  poError.value = '';
  try {
    const qs = new URLSearchParams({ limit: String(limit.value), offset: String(poPage.value * limit.value) });
    const data = await apiClient.get(`/admin/payouts/pending?${qs.toString()}`, { noCache: true });
    poRows.value = data?.experts || [];
    poTotal.value = data?.total || 0;
  } catch (_e) {
    poError.value = 'Không tải được danh sách payout.';
  } finally {
    poLoading.value = false;
  }
}

async function act(url, id) {
  actingId.value = id;
  try {
    await apiClient.post(url, {});
    await refreshAll();
  } catch (error) {
    alert(error.message || 'Thao tác thất bại.');
  } finally {
    actingId.value = null;
  }
}

function rejectPayment(id) {
  if (!window.confirm('Từ chối thanh toán này và hủy booking?')) return;
  act(`/admin/bookings/${id}/reject-payment`, id);
}

function payoutExpert(id) {
  if (!window.confirm('Xác nhận đã chuyển khoản cho chuyên gia và đưa số dư về 0?')) return;
  act(`/admin/payouts/${id}`, id);
}

async function refreshAll() {
  await Promise.all([loadPayments(), loadPayouts()]);
}

onMounted(refreshAll);
</script>
