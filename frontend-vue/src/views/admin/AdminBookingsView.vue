<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Quản lý lịch hẹn</h1>
        <p class="admin-page-sub">Quan sát toàn bộ lịch hẹn giữa thân chủ và chuyên gia trên nền tảng.</p>
      </div>
      <button type="button" class="btn-outline" @click="load(page)">↻ Tải lại</button>
    </div>

    <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <input v-model="searchInput" type="search" placeholder="Tìm theo thân chủ / chuyên gia / email..." class="admin-input" style="flex:1;min-width:240px;" @keydown.enter="applySearch">
      <button type="button" class="btn-primary" @click="applySearch">Tìm</button>
      <select v-model="limit" class="admin-input" aria-label="Số lịch hẹn mỗi trang" title="Số lịch hẹn mỗi trang" style="max-width:130px;" @change="load(0)">
        <option :value="10">10 / trang</option>
        <option :value="25">25 / trang</option>
        <option :value="50">50 / trang</option>
        <option :value="100">100 / trang</option>
      </select>
    </div>

    <div class="admin-tabs">
      <button
        v-for="st in TAB_ORDER"
        :key="st"
        type="button"
        class="admin-tab"
        :class="{ active: status === st }"
        @click="status = st; load(0)"
      >{{ st === '' ? 'Tất cả' : (STATUS[st]?.label || st) }} ({{ st === '' ? summaryTotal : (summary[st] || 0) }})</button>
    </div>

    <div style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">
      {{ metaText }}
      <a v-if="search" href="#" style="color:var(--coral-dark,#e05555);font-weight:700;" @click.prevent="clearSearch"> · ✕ Bỏ lọc "{{ search }}"</a>
    </div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!rows.length" class="admin-card admin-empty">Không có lịch hẹn nào.</div>
    <template v-else>
      <div v-for="b in rows" :key="b.id" class="admin-card">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
          <div style="min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span title="Chỉ xem lịch của người này" style="font-weight:800;cursor:pointer;text-decoration:underline dotted;" @click="filterBy(b.client_email || b.client_name || '')">{{ b.client_name || 'Thân chủ' }}</span>
              <span style="color:var(--text-light);">→</span>
              <span title="Chỉ xem lịch của chuyên gia này" style="font-weight:800;color:var(--mint-dark,#2f7d52);cursor:pointer;text-decoration:underline dotted;" @click="filterBy(b.expert_name || '')">{{ b.expert_name || 'Chuyên gia' }}</span>
              <span :style="statusBadgeStyle(b.status)">{{ statusLabel(b.status) }}</span>
            </div>
            <div style="color:var(--text-secondary);font-size:.84rem;margin-top:4px;">
              {{ SESSION_TYPE[b.session_type] || b.session_type }} · {{ dt(b.starts_at) }} · {{ Number(b.duration_minutes || 0) }} phút
            </div>
            <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">
              {{ b.client_email || '' }}{{ b.expert_code ? ` · ${b.expert_code}` : '' }}
            </div>
          </div>
          <div style="text-align:right;white-space:nowrap;">
            <div style="font-size:1.15rem;font-weight:800;color:var(--coral);">{{ money(b.amount) }}</div>
            <div style="font-size:.74rem;color:var(--text-light);">Tạo: {{ dt(b.created_at) }}</div>
            <div v-if="b.paid_at" style="font-size:.74rem;color:var(--text-light);">TT: {{ dt(b.paid_at) }}</div>
          </div>
        </div>
        <div v-if="b.notes" style="margin-top:10px;font-size:.84rem;color:var(--text-secondary);background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);border-radius:10px;padding:8px 12px;">📝 {{ b.notes }}</div>
        <div v-if="b.status === 'cancelled' && b.cancel_reason" style="margin-top:8px;font-size:.8rem;color:var(--coral-dark);">Lý do huỷ: {{ b.cancel_reason }}</div>
        <div v-if="b.order_code" style="margin-top:8px;font-size:.82rem;color:var(--text-secondary);">
          Mã CK: <strong style="font-family:monospace;">{{ b.payment_content || b.order_code }}</strong>{{ b.payment_status ? ` · TT: ${b.payment_status}` : '' }}
        </div>
      </div>
    </template>
    <AdminPager :page="page" :total-pages="totalPages" @go="load" />
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';
import AdminPager from '../../components/AdminPager.vue';

function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}

const SESSION_TYPE = { chat: 'Chat text', voice: 'Gọi thoại', video: 'Video call', inperson: 'Gặp trực tiếp' };
const STATUS = {
  pending_payment: { label: 'Chờ thanh toán', bg: 'rgba(245,176,65,.16)', color: '#b5791b' },
  pending: { label: 'Chờ đối soát', bg: 'rgba(245,176,65,.16)', color: '#b5791b' },
  awaiting_expert: { label: 'Chờ chuyên gia nhận', bg: '#eef3fb', color: '#2b5b9e' },
  confirmed: { label: 'Đã xác nhận', bg: 'var(--mint-light,#c5e8d2)', color: 'var(--mint-dark,#2f7d52)' },
  completed: { label: 'Hoàn thành', bg: '#e9f6ee', color: '#2f7d52' },
  cancelled: { label: 'Đã huỷ', bg: 'rgba(255,139,139,.14)', color: 'var(--coral-dark,#e05555)' },
  expired: { label: 'Hết hạn', bg: 'rgba(74,55,40,.08)', color: 'var(--text-light,#a89585)' }
};
const TAB_ORDER = ['', 'pending_payment', 'pending', 'awaiting_expert', 'confirmed', 'completed', 'cancelled', 'expired'];

function statusLabel(status) { return STATUS[status]?.label || status; }
function statusBadgeStyle(status) {
  const s = STATUS[status] || { label: status, bg: 'var(--cream)', color: 'var(--text-light)' };
  return { fontSize: '.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: '999px', background: s.bg, color: s.color, whiteSpace: 'nowrap' };
}

const searchInput = ref('');
const search = ref('');
const status = ref('');
const limit = ref(10);
const page = ref(0);
const total = ref(0);
const rows = ref([]);
const summary = reactive({});
const loading = ref(false);
const loadError = ref('');

const summaryTotal = computed(() => Object.values(summary).reduce((a, c) => a + c, 0));
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));
const metaText = computed(() => {
  if (loading.value || loadError.value) return '';
  const from = total.value ? page.value * limit.value + 1 : 0;
  const to = page.value * limit.value + rows.value.length;
  return `${from}–${to} trong ${total.value} lịch hẹn · Trang ${page.value + 1}/${totalPages.value}`;
});

async function load(p = page.value) {
  page.value = Math.max(0, p);
  loading.value = true;
  loadError.value = '';
  try {
    const qs = new URLSearchParams({ limit: String(limit.value), offset: String(page.value * limit.value) });
    if (status.value) qs.set('status', status.value);
    if (search.value) qs.set('search', search.value);
    const data = await apiClient.get(`/admin/bookings?${qs.toString()}`, { noCache: true });
    Object.keys(summary).forEach((k) => delete summary[k]);
    Object.assign(summary, data?.summary || {});
    rows.value = data?.bookings || [];
    total.value = data?.total || 0;
  } catch (_e) {
    loadError.value = 'Không tải được danh sách (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

function applySearch() {
  search.value = (searchInput.value || '').trim();
  load(0);
}

function clearSearch() {
  search.value = '';
  searchInput.value = '';
  load(0);
}

function filterBy(value) {
  if (!value) return;
  searchInput.value = value;
  search.value = value;
  load(0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  const preset = sessionStorage.getItem('admin_bookings_filter');
  if (preset) {
    sessionStorage.removeItem('admin_bookings_filter');
    search.value = preset;
    searchInput.value = preset;
  }
  load(0);
});
</script>
