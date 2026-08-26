<template>
  <main class="admin-main">
    <div class="admin-page-head">
      <p class="admin-page-kicker">PeaceFlow Admin</p>
      <h1 class="admin-page-title">Người dùng</h1>
      <p class="admin-page-sub">Tìm kiếm, khoá/mở tài khoản, đổi vai trò và xem số dư ví.</p>
    </div>

    <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <input v-model="searchInput" type="search" placeholder="Tìm theo email hoặc tên..." class="admin-input" style="flex:1;min-width:220px;" @keydown.enter="applySearch">
      <select v-model="roleFilter" class="admin-input" aria-label="Lọc theo vai trò" title="Lọc theo vai trò" style="max-width:170px;" @change="applySearch">
        <option value="">Mọi vai trò</option>
        <option value="user">Người dùng</option>
        <option value="expert">Chuyên gia</option>
        <option value="admin">Quản trị</option>
      </select>
      <button type="button" class="btn-primary" @click="applySearch">Tìm</button>
      <select v-model="limit" class="admin-input" aria-label="Số người dùng mỗi trang" title="Số người dùng mỗi trang" style="max-width:130px;" @change="load(0)">
        <option :value="10">10 / trang</option>
        <option :value="25">25 / trang</option>
        <option :value="50">50 / trang</option>
        <option :value="100">100 / trang</option>
      </select>
    </div>

    <div class="admin-tabs">
      <button v-for="opt in [{ v: '', l: 'Tất cả' }, { v: 'active', l: 'Hoạt động' }, { v: 'suspended', l: 'Đã khoá' }]" :key="opt.v" type="button" class="admin-tab" :class="{ active: status === opt.v }" @click="status = opt.v; load(0)">
        {{ opt.l }}
      </button>
    </div>

    <div style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">{{ metaText }}</div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!rows.length" class="admin-card admin-empty">Không tìm thấy người dùng nào.</div>
    <template v-else>
      <div v-for="u in rows" :key="u.id" class="admin-card">
        <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;justify-content:space-between;">
          <div style="display:flex;gap:12px;min-width:0;">
            <div class="admin-user-bubble">{{ initials(u.display_name || u.full_name) }}</div>
            <div style="min-width:0;">
              <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                <span style="font-weight:800;">{{ u.display_name || u.full_name || 'Ẩn danh' }}</span>
                <span :style="roleChipStyle(u.role)">{{ ROLE_LABEL[u.role] || u.role }}</span>
                <span :style="statusChipStyle(u.status)">{{ statusLabel(u.status) }}</span>
                <span v-if="u.id === myId" style="font-size:.68rem;color:var(--text-light);">(bạn)</span>
              </div>
              <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">
                {{ u.email }}<span v-if="!u.email_verified"> · <span style="color:var(--coral-dark);">chưa xác thực</span></span>
              </div>
              <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">Ví: <strong>{{ money(u.wallet_balance) }}</strong> · Tạo: {{ dt(u.created_at) }} · Đăng nhập: {{ dt(u.last_login_at) }}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <select
              :value="u.role"
              :disabled="u.id === myId || roleChangingId === u.id"
              :title="u.id === myId ? 'Không thể tự đổi vai trò của chính mình' : ''"
              style="font-size:.82rem;padding:6px 10px;border-radius:8px;border:1.5px solid var(--kraft-light);background:var(--warm-white,#fffdf7);font-family:inherit;"
              @change="onRoleChange(u, $event)"
            >
              <option value="user">Người dùng</option>
              <option value="expert">Chuyên gia</option>
              <option value="admin">Quản trị</option>
            </select>
            <button type="button" class="btn-outline" style="font-size:.82rem;" @click="goToBookings(u.email || '')"><span v-html="icon('calendar')"></span> Lịch hẹn</button>
            <button type="button" :class="u.status === 'suspended' ? 'btn-primary' : 'btn-outline'" :disabled="u.id === myId || actingId === u.id" style="font-size:.82rem;" @click="toggleLock(u)">{{ u.status === 'suspended' ? 'Mở khoá' : 'Khoá' }}</button>
          </div>
        </div>
      </div>
    </template>
    <AdminPager :page="page" :total-pages="totalPages" @go="load" />
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/auth';
import { icon } from '../../lib/adminIcons';
import AdminPager from '../../components/AdminPager.vue';

const router = useRouter();
const auth = useAuthStore();
const myId = auth.user?.id || null;

function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}
function initials(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

const ROLE_LABEL = { user: 'Người dùng', expert: 'Chuyên gia', admin: 'Quản trị' };
const ROLE_COLORS = {
  user: ['var(--cream,#fff8f0)', 'var(--text-secondary,#7a6555)', 'var(--kraft-light,#e8cba7)'],
  expert: ['var(--mint-light,#c5e8d2)', 'var(--mint-dark,#4a9e8e)', 'var(--mint,#a8d5ba)'],
  admin: ['rgba(255,139,139,.14)', 'var(--coral-dark,#e05555)', 'var(--coral,#ff8b8b)']
};
function roleChipStyle(role) {
  const [bg, color, border] = ROLE_COLORS[role] || ROLE_COLORS.user;
  return { fontSize: '.7rem', fontWeight: 800, padding: '1px 8px', borderRadius: '6px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' };
}

const STATUS_MAP = {
  active: ['Hoạt động', 'var(--mint-light,#c5e8d2)', 'var(--mint-dark,#4a9e8e)'],
  suspended: ['Đã khoá', 'rgba(255,139,139,.14)', 'var(--coral-dark,#e05555)'],
  inactive: ['Ngừng', 'var(--cream,#fff8f0)', 'var(--text-light,#a89585)'],
  deleted: ['Đã xoá', 'var(--cream,#fff8f0)', 'var(--text-light,#a89585)'],
  pending: ['Chờ duyệt', 'rgba(245,176,65,.16)', '#b5791b']
};
function statusLabel(status) { return (STATUS_MAP[status] || [status])[0]; }
function statusChipStyle(status) {
  const [, bg, color] = STATUS_MAP[status] || [status, 'var(--cream)', 'var(--text-light)'];
  return { fontSize: '.7rem', fontWeight: 800, padding: '1px 8px', borderRadius: '6px', background: bg, color, whiteSpace: 'nowrap' };
}

const searchInput = ref('');
const search = ref('');
const roleFilter = ref('');
const status = ref('');
const limit = ref(10);
const page = ref(0);
const total = ref(0);
const rows = ref([]);
const loading = ref(false);
const loadError = ref('');
const actingId = ref(null);
const roleChangingId = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));
const metaText = computed(() => {
  if (loading.value || loadError.value) return '';
  const from = total.value ? page.value * limit.value + 1 : 0;
  const to = page.value * limit.value + rows.value.length;
  return `${from}–${to} trong ${total.value} người dùng · Trang ${page.value + 1}/${totalPages.value}`;
});

async function load(p = page.value) {
  page.value = Math.max(0, p);
  loading.value = true;
  loadError.value = '';
  try {
    const qs = new URLSearchParams({ limit: String(limit.value), offset: String(page.value * limit.value) });
    if (search.value) qs.set('search', search.value);
    if (roleFilter.value) qs.set('role', roleFilter.value);
    if (status.value) qs.set('status', status.value);
    const data = await apiClient.get(`/admin/users?${qs.toString()}`, { noCache: true });
    rows.value = data?.users || [];
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

function goToBookings(filter) {
  sessionStorage.setItem('admin_bookings_filter', filter || '');
  router.push({ name: 'admin-bookings' });
}

async function toggleLock(user) {
  const locked = user.status === 'suspended';
  const nextStatus = locked ? 'active' : 'suspended';
  const msg = locked ? 'Mở khoá tài khoản này?' : 'Khoá tài khoản này? Người dùng sẽ không đăng nhập được.';
  if (!window.confirm(msg)) return;
  actingId.value = user.id;
  try {
    await apiClient.patch(`/admin/users/${user.id}`, { status: nextStatus });
    await load(page.value);
  } catch (e) {
    alert(e.message || 'Cập nhật thất bại.');
  } finally {
    actingId.value = null;
  }
}

async function onRoleChange(user, event) {
  const select = event.target;
  const newRole = select.value;
  const prevRole = user.role;
  if (newRole === prevRole) return;
  const warn = newRole === 'admin' ? ' Người này sẽ có toàn quyền quản trị hệ thống.' : '';
  if (!window.confirm(`Đổi vai trò thành "${ROLE_LABEL[newRole]}"?${warn}`)) {
    select.value = prevRole;
    return;
  }
  roleChangingId.value = user.id;
  try {
    const updated = await apiClient.patch(`/admin/users/${user.id}`, { role: newRole });
    if (updated?.expert_profile_created) {
      alert('Đã đổi vai trò và tự tạo hồ sơ chuyên gia — tài khoản này vào thẳng được dashboard chuyên gia (cần đăng xuất/đăng nhập lại để cập nhật).');
    }
    await load(page.value);
  } catch (e) {
    alert(e.message || 'Đổi vai trò thất bại.');
    select.value = prevRole;
  } finally {
    roleChangingId.value = null;
  }
}

onMounted(() => load(0));
</script>
