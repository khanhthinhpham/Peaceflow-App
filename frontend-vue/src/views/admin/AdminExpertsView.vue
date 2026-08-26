<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Chuyên gia</h1>
        <p class="admin-page-sub">Xét duyệt hồ sơ đăng ký & quản lý đội ngũ chuyên gia đang hoạt động.</p>
      </div>
      <button class="btn-outline" type="button" @click="reload">
        <span class="admin-inline-icon" v-html="icon('refresh')"></span>
        Tải lại
      </button>
    </div>

    <div class="admin-tabs">
      <button type="button" class="admin-tab" :class="{ active: mode === 'applications' }" @click="switchMode('applications')">Hồ sơ đăng ký</button>
      <button type="button" class="admin-tab" :class="{ active: mode === 'experts' }" @click="switchMode('experts')">Danh sách chuyên gia</button>
    </div>

    <!-- Hồ sơ đăng ký -->
    <div v-show="mode === 'applications'">
      <div class="admin-tabs">
        <button v-for="s in ['pending', 'approved', 'rejected', 'all']" :key="s" type="button" class="admin-tab" :class="{ active: currentStatus === s }" @click="loadApplications(s, 0)">
          {{ { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', all: 'Tất cả' }[s] }}
        </button>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <select v-model="appLimit" class="admin-input" aria-label="Số hồ sơ mỗi trang" title="Số hồ sơ mỗi trang" style="max-width:130px;" @change="loadApplications(currentStatus, 0)">
          <option :value="10">10 / trang</option>
          <option :value="25">25 / trang</option>
          <option :value="50">50 / trang</option>
          <option :value="100">100 / trang</option>
        </select>
      </div>
      <div style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">{{ appMetaText }}</div>

      <div v-if="appLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="appError" class="admin-card admin-empty" style="color:var(--coral);">{{ appError }}</div>
      <div v-else-if="!appRows.length" class="admin-card admin-empty">
        <span v-if="currentStatus === 'pending'"><span v-html="icon('check')"></span> Không có hồ sơ nào đang chờ duyệt.</span>
        <span v-else>Không có hồ sơ nào.</span>
      </div>
      <template v-else>
        <div v-for="a in appRows" :key="a.id" class="admin-card">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
            <div style="min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-weight:800;font-size:1.05rem;">{{ a.full_name }}</span>
                <span :style="statusBadgeStyle(a.status)">{{ statusBadgeLabel(a.status) }}</span>
              </div>
              <div style="color:var(--text-secondary);font-size:.85rem;margin-top:3px;">{{ a.email || '' }}{{ a.phone ? ' · ' + a.phone : '' }}</div>
            </div>
            <div style="font-size:.78rem;color:var(--text-light);text-align:right;white-space:nowrap;">
              Gửi: {{ dt(a.created_at) }}<br v-if="a.reviewed_at">{{ a.reviewed_at ? `Xử lý: ${dt(a.reviewed_at)}` : '' }}
            </div>
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:.86rem;color:var(--text-secondary);">
            <span><strong>Bằng cấp:</strong> {{ a.degree || '—' }}</span>
            <span><strong>Kinh nghiệm:</strong> {{ Number(a.experience_years || 0) }} năm</span>
            <span v-if="a.location"><strong>Khu vực:</strong> {{ a.location }}</span>
          </div>
          <div v-if="specialties(a.specialties).length" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
            <span v-for="sp in specialties(a.specialties)" :key="sp" style="font-size:.74rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">{{ sp }}</span>
          </div>
          <div v-if="a.bio" style="margin-top:10px;font-size:.86rem;color:var(--text-secondary);line-height:1.55;">{{ a.bio }}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;">
            <div>
              <a v-if="a.credential_path" :href="`${API_BASE_URL}${a.credential_path}`" target="_blank" rel="noopener" class="btn-outline" style="font-size:.82rem;">
                <span v-html="icon('file-text')"></span> Xem bằng cấp{{ a.credential_filename ? ` (${a.credential_filename})` : '' }}
              </a>
              <span v-else style="color:var(--text-light);font-size:.82rem;">Không có file bằng cấp</span>
            </div>
            <div v-if="a.status === 'pending'" style="display:flex;gap:10px;">
              <button type="button" class="btn-outline" :disabled="actingId === a.id" @click="appAct(`/admin/expert-applications/${a.id}/reject`, a.id, 'Từ chối hồ sơ này?')"><span v-html="icon('alert')"></span> Từ chối</button>
              <button type="button" class="btn-primary" :disabled="actingId === a.id" @click="appAct(`/admin/expert-applications/${a.id}/approve`, a.id, 'Duyệt hồ sơ này và mở quyền chuyên gia?')"><span v-html="icon('check')"></span> Duyệt hồ sơ</button>
            </div>
          </div>
        </div>
      </template>
      <AdminPager :page="appPage" :total-pages="appTotalPages" @go="(p) => loadApplications(currentStatus, p)" />
    </div>

    <!-- Danh sách chuyên gia -->
    <div v-show="mode === 'experts'">
      <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <input v-model="expertSearchInput" type="search" placeholder="Tìm theo tên, mã hoặc email..." class="admin-input" style="flex:1;min-width:220px;" @keydown.enter="applyExpertSearch">
        <button type="button" class="btn-primary" @click="applyExpertSearch">Tìm</button>
        <select v-model="expLimit" class="admin-input" aria-label="Số chuyên gia mỗi trang" title="Số chuyên gia mỗi trang" style="max-width:130px;" @change="loadExperts(0)">
          <option :value="10">10 / trang</option>
          <option :value="25">25 / trang</option>
          <option :value="50">50 / trang</option>
          <option :value="100">100 / trang</option>
        </select>
      </div>
      <div class="admin-tabs">
        <button v-for="opt in [{ v: '', l: 'Tất cả' }, { v: 'true', l: 'Đang hoạt động' }, { v: 'false', l: 'Đã tắt' }]" :key="opt.v" type="button" class="admin-tab" :class="{ active: expertActiveFilter === opt.v }" @click="expertActiveFilter = opt.v; loadExperts(0)">
          {{ opt.l }}
        </button>
      </div>
      <div style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">{{ expMetaText }}</div>

      <div v-if="expLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="expError" class="admin-card admin-empty" style="color:var(--coral);">{{ expError }}</div>
      <div v-else-if="!expertRows.length" class="admin-card admin-empty">Không có chuyên gia nào.</div>
      <template v-else>
        <div v-for="e in expertRows" :key="e.id" class="admin-card">
          <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;justify-content:space-between;">
            <div style="display:flex;gap:12px;min-width:0;">
              <div class="admin-user-bubble" style="background:var(--mint-light,#c5e8d2);overflow:hidden;">
                <img v-if="avatarUrls[e.id]" :src="avatarUrls[e.id]" alt="" style="width:100%;height:100%;object-fit:cover;">
                <span v-else-if="!e.has_avatar_photo" v-html="icon('user')"></span>
              </div>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                  <span style="font-weight:800;">{{ e.full_name }}</span>
                  <span :style="{ fontSize: '.7rem', fontWeight: 800, padding: '1px 8px', borderRadius: '6px', background: e.active ? 'var(--mint-light,#c5e8d2)' : 'rgba(74,55,40,.1)', color: e.active ? 'var(--mint-dark,#4a9e8e)' : 'var(--text-secondary,#7a6555)' }">{{ e.active ? 'Đang hoạt động' : 'Đã tắt' }}</span>
                  <span style="font-size:.7rem;color:var(--text-light);font-family:monospace;">{{ e.code || '' }}</span>
                </div>
                <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">{{ e.email || '' }}</div>
                <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">
                  <span v-html="icon('star')"></span> {{ Number(e.rating || 0).toFixed(1) }} · {{ Number(e.sessions_count || 0) }} buổi · Giá: {{ money(e.base_price) }} · Số dư: <strong>{{ money(e.balance) }}</strong>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn-outline" style="font-size:.82rem;" @click="goToBookings(e.full_name || '')"><span v-html="icon('calendar')"></span> Lịch hẹn</button>
              <button type="button" class="btn-outline" style="font-size:.82rem;" @click="triggerAvatarInput(e.id)">{{ e.has_avatar_photo ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện' }}</button>
              <button v-if="e.has_avatar_photo" type="button" class="btn-outline" style="font-size:.82rem;" @click="removeAvatar(e.id)">Xoá ảnh</button>
              <input :ref="(el) => setAvatarInputRef(e.id, el)" type="file" accept="image/*" style="display:none;" @change="onAvatarFileChange(e.id, $event)">
              <button type="button" :class="e.active ? 'btn-outline' : 'btn-primary'" style="font-size:.82rem;" :disabled="actingId === e.id" @click="toggleExpertActive(e)">{{ e.active ? 'Tắt hoạt động' : 'Bật hoạt động' }}</button>
            </div>
          </div>
          <div v-if="specialties(e.specialties).length" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
            <span v-for="sp in specialties(e.specialties)" :key="sp" style="font-size:.74rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">{{ sp }}</span>
          </div>
          <div class="admin-expert-payout-card" style="margin-top:12px;">
            <template v-if="e.payout_account_number">
              <div class="admin-expert-payout-info">
                <div class="admin-expert-payout-line"><span v-html="icon('card')"></span> <strong>{{ e.payout_bank_name || '' }}</strong></div>
                <div class="admin-expert-payout-line">Số tài khoản: <span class="admin-expert-payout-mono">{{ e.payout_account_number }}</span></div>
                <div class="admin-expert-payout-line">Chủ tài khoản: <strong>{{ e.payout_account_name || 'Chưa cập nhật' }}</strong></div>
              </div>
              <a v-if="e.payout_qr_url" class="admin-expert-qr-card" :href="e.payout_qr_url" target="_blank" rel="noopener" :aria-label="`Xem mã QR nhận tiền của ${e.full_name}`">
                <img class="admin-expert-qr-image" :src="e.payout_qr_url" :alt="`QR nhận tiền của ${e.full_name}`">
                <span class="admin-expert-qr-caption">Mã QR nhận tiền</span>
              </a>
              <div v-else class="admin-expert-qr-card admin-expert-qr-empty">
                <span class="admin-expert-qr-caption">Chưa tạo được mã QR</span>
              </div>
            </template>
            <span v-else style="color:var(--coral-dark);"><span v-html="icon('alert')"></span> Chưa cập nhật phương thức nhận thanh toán</span>
          </div>
        </div>
      </template>
      <AdminPager :page="expPage" :total-pages="expTotalPages" @go="loadExperts" />
    </div>
  </main>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient, API_BASE_URL } from '../../lib/apiClient';
import { useAdminBadgesStore } from '../../stores/adminBadges';
import { icon } from '../../lib/adminIcons';
import { cropAvatarFile } from '../../lib/avatarCropper';
import AdminPager from '../../components/AdminPager.vue';

const router = useRouter();
const badges = useAdminBadgesStore();

function dt(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function specialties(v) {
  let arr = v;
  if (typeof v === 'string') { try { arr = JSON.parse(v); } catch (_e) { arr = []; } }
  return Array.isArray(arr) ? arr : [];
}

const STATUS_BADGE = {
  pending: { label: 'Chờ duyệt', bg: 'rgba(245,176,65,.16)', color: '#b5791b', border: 'rgba(245,176,65,.5)' },
  approved: { label: 'Đã duyệt', bg: 'var(--mint-light,#c5e8d2)', color: 'var(--mint-dark,#4a9e8e)', border: 'var(--mint,#a8d5ba)' },
  rejected: { label: 'Từ chối', bg: 'rgba(255,139,139,.14)', color: 'var(--coral-dark,#e05555)', border: 'var(--coral,#ff8b8b)' }
};
function statusBadgeLabel(status) { return (STATUS_BADGE[status] || STATUS_BADGE.pending).label; }
function statusBadgeStyle(status) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return { fontSize: '.72rem', fontWeight: 800, padding: '2px 9px', borderRadius: '999px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' };
}

const mode = ref('applications');
const expertsLoaded = ref(false);
const actingId = ref(null);

function switchMode(next) {
  mode.value = next;
  if (next === 'experts' && !expertsLoaded.value) {
    expertsLoaded.value = true;
    loadExperts();
  }
}

function reload() {
  if (mode.value === 'applications') loadApplications(currentStatus.value);
  else loadExperts();
}

// ===== Hồ sơ đăng ký =====
const currentStatus = ref('pending');
const appLimit = ref(10);
const appPage = ref(0);
const appTotal = ref(0);
const appRows = ref([]);
const appLoading = ref(false);
const appError = ref('');

const appTotalPages = computed(() => Math.max(1, Math.ceil(appTotal.value / appLimit.value)));
const appMetaText = computed(() => {
  if (!appRows.value.length) return '';
  return `${appPage.value * appLimit.value + 1}–${appPage.value * appLimit.value + appRows.value.length} trong ${appTotal.value} hồ sơ · Trang ${appPage.value + 1}/${appTotalPages.value}`;
});

async function loadApplications(status = currentStatus.value, page = appPage.value) {
  if (status !== currentStatus.value) page = 0;
  currentStatus.value = status;
  appPage.value = Math.max(0, page);
  appLoading.value = true;
  appError.value = '';
  try {
    const qs = new URLSearchParams({ status, limit: String(appLimit.value), offset: String(appPage.value * appLimit.value) });
    const data = await apiClient.get(`/admin/expert-applications?${qs.toString()}`, { noCache: true });
    appRows.value = data?.applications || [];
    appTotal.value = data?.total || 0;
    if (status === 'pending') badges.setBadge('experts', appTotal.value);
  } catch (_e) {
    appError.value = 'Không tải được danh sách (cần quyền admin).';
  } finally {
    appLoading.value = false;
  }
}

async function appAct(url, id, confirmMsg) {
  if (!window.confirm(confirmMsg)) return;
  actingId.value = id;
  try {
    await apiClient.post(url, {});
    await loadApplications(currentStatus.value, appPage.value);
    await refreshPendingBadge();
  } catch (e) {
    alert(e.message || 'Thao tác thất bại.');
  } finally {
    actingId.value = null;
  }
}

async function refreshPendingBadge() {
  try {
    const data = await apiClient.get('/admin/expert-applications?status=pending&limit=1', { noCache: true });
    badges.setBadge('experts', data?.total || 0);
  } catch (_e) { /* ignore */ }
}

// ===== Danh sách chuyên gia =====
const expertSearchInput = ref('');
const expertSearch = ref('');
const expertActiveFilter = ref('');
const expLimit = ref(10);
const expPage = ref(0);
const expTotal = ref(0);
const expertRows = ref([]);
const expLoading = ref(false);
const expError = ref('');
const avatarUrls = reactive({});
const avatarInputs = {};

const expTotalPages = computed(() => Math.max(1, Math.ceil(expTotal.value / expLimit.value)));
const expMetaText = computed(() => {
  if (!expertRows.value.length) return '';
  return `${expPage.value * expLimit.value + 1}–${expPage.value * expLimit.value + expertRows.value.length} trong ${expTotal.value} chuyên gia · Trang ${expPage.value + 1}/${expTotalPages.value}`;
});

function setAvatarInputRef(id, el) {
  if (el) avatarInputs[id] = el;
}

function triggerAvatarInput(id) {
  avatarInputs[id]?.click();
}

async function loadAvatarThumb(id) {
  try {
    const blob = await apiClient.getBlob(`/experts/${id}/avatar`);
    avatarUrls[id] = URL.createObjectURL(blob);
  } catch (_e) { /* giữ nguyên emoji mặc định nếu tải lỗi */ }
}

async function loadExperts(page = expPage.value) {
  expPage.value = Math.max(0, page);
  expLoading.value = true;
  expError.value = '';
  try {
    const qs = new URLSearchParams({ limit: String(expLimit.value), offset: String(expPage.value * expLimit.value) });
    if (expertSearch.value) qs.set('search', expertSearch.value);
    if (expertActiveFilter.value) qs.set('active', expertActiveFilter.value);
    const data = await apiClient.get(`/admin/experts?${qs.toString()}`, { noCache: true });
    expertRows.value = data?.experts || [];
    expTotal.value = data?.total || 0;
    expertRows.value.filter((e) => e.has_avatar_photo).forEach((e) => loadAvatarThumb(e.id));
  } catch (_e) {
    expError.value = 'Không tải được danh sách chuyên gia.';
  } finally {
    expLoading.value = false;
  }
}

function applyExpertSearch() {
  expertSearch.value = (expertSearchInput.value || '').trim();
  loadExperts(0);
}

function goToBookings(filter) {
  sessionStorage.setItem('admin_bookings_filter', filter || '');
  router.push({ name: 'admin-bookings' });
}

async function onAvatarFileChange(id, event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const cropped = await cropAvatarFile(file);
    if (!cropped) return;
    const fd = new FormData();
    fd.append('image', cropped);
    await apiClient.postForm(`/admin/experts/${id}/avatar`, fd);
    loadExperts(expPage.value);
  } catch (e) {
    alert(e.message || 'Tải ảnh thất bại.');
  } finally {
    event.target.value = '';
  }
}

async function removeAvatar(id) {
  if (!window.confirm('Xoá ảnh đại diện thật, quay về emoji mặc định?')) return;
  try {
    await apiClient.delete(`/admin/experts/${id}/avatar`);
    loadExperts(expPage.value);
  } catch (e) {
    alert(e.message || 'Xoá ảnh thất bại.');
  }
}

async function toggleExpertActive(expert) {
  const next = !expert.active;
  if (!window.confirm(next ? 'Bật hoạt động cho chuyên gia này?' : 'Tắt hoạt động? Chuyên gia sẽ không nhận lịch mới.')) return;
  actingId.value = expert.id;
  try {
    await apiClient.patch(`/admin/experts/${expert.id}`, { active: next });
    await loadExperts(expPage.value);
  } catch (e) {
    alert(e.message || 'Cập nhật thất bại.');
  } finally {
    actingId.value = null;
  }
}

onMounted(() => {
  loadApplications('pending');
});
</script>
