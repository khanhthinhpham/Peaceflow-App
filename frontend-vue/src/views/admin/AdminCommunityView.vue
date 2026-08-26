<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Kiểm duyệt cộng đồng</h1>
        <p class="admin-page-sub">Bài tự ẩn khi ≥ 5 báo cáo. Xem lại, ẩn/hiện, bỏ qua báo cáo hoặc gỡ bài.</p>
      </div>
      <button type="button" class="btn-outline" @click="load(currentFilter)">
        <span v-html="icon('refresh')"></span>
        Tải lại
      </button>
    </div>

    <div class="admin-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.v"
        type="button"
        class="admin-tab"
        :class="{ active: currentFilter === tab.v }"
        @click="load(tab.v)"
      >{{ tab.l }}</button>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <select v-model="limit" class="admin-input" aria-label="Số bài mỗi trang" title="Số bài mỗi trang" style="max-width:130px;" @change="load(currentFilter, 0)">
        <option :value="10">10 / trang</option>
        <option :value="25">25 / trang</option>
        <option :value="50">50 / trang</option>
        <option :value="100">100 / trang</option>
      </select>
    </div>

    <div style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">{{ metaText }}</div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!posts.length" class="admin-card admin-empty">
      <span v-if="currentFilter === 'hidden'">Không có bài nào đang bị ẩn.</span>
      <span v-else><span v-html="icon('star')"></span> Không có bài viết nào bị báo cáo.</span>
    </div>
    <template v-else>
      <div v-for="p in posts" :key="p.id" class="admin-card">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span style="font-weight:800;">{{ author(p) }}</span>
            <span style="font-size:.72rem;font-weight:700;padding:1px 8px;border-radius:6px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">{{ CATEGORY[p.category] || p.category }}</span>
            <span style="font-size:.72rem;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(255,139,139,.14);color:var(--coral-dark,#e05555);border:1px solid var(--coral,#ff8b8b);">⚑ {{ Number(p.reports_count || 0) }} báo cáo</span>
            <span v-if="p.is_hidden" style="font-size:.72rem;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(74,55,40,.1);color:var(--text-secondary,#7a6555);">Đang ẩn</span>
          </div>
          <span style="font-size:.78rem;color:var(--text-light);white-space:nowrap;">{{ dt(p.created_at) }}</span>
        </div>

        <div style="margin-top:10px;font-size:.9rem;color:var(--text-primary);line-height:1.6;white-space:pre-wrap;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);border-radius:var(--radius-sm,10px);padding:12px 14px;">{{ p.content }}</div>

        <div v-if="reasonCounts(p).length" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
          <span v-for="([k, n]) in reasonCounts(p)" :key="k" style="font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">{{ REASON[k] || k }} ×{{ n }}</span>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px;">
          <button type="button" class="btn-outline" :disabled="actingId === p.id" style="font-size:.82rem;" @click="dismissReports(p)">Bỏ qua báo cáo</button>
          <button type="button" :class="p.is_hidden ? 'btn-primary' : 'btn-outline'" :disabled="actingId === p.id" style="font-size:.82rem;" @click="toggleHide(p)">{{ p.is_hidden ? 'Hiện lại' : 'Ẩn bài' }}</button>
          <button type="button" class="btn-outline" :disabled="actingId === p.id" style="font-size:.82rem;color:var(--coral-dark);border-color:var(--coral);" @click="removePost(p)">Gỡ bài</button>
        </div>
      </div>
    </template>
    <AdminPager :page="page" :total-pages="totalPages" @go="load(currentFilter, $event)" />
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { useAdminBadgesStore } from '../../stores/adminBadges';
import { icon } from '../../lib/adminIcons';
import AdminPager from '../../components/AdminPager.vue';

const badges = useAdminBadgesStore();

function dt(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}
function author(p) {
  return p.is_anonymous ? 'Ẩn danh' : (p.author_name || p.author_email || 'Ẩn danh');
}

const CATEGORY = { gratitude: 'Biết ơn', story: 'Câu chuyện', milestone: 'Cột mốc', question: 'Hỏi đáp', tip: 'Mẹo' };
const REASON = { inappropriate: 'Không phù hợp', spam: 'Spam', harassment: 'Quấy rối', misinformation: 'Sai sự thật', other: 'Khác' };
const TABS = [{ v: 'reported', l: 'Bị báo cáo' }, { v: 'hidden', l: 'Đã ẩn' }, { v: 'all', l: 'Tất cả' }];

function reasonCounts(p) {
  if (!Array.isArray(p.reports) || !p.reports.length) return [];
  const counts = {};
  p.reports.forEach((r) => { const k = r.reason || 'other'; counts[k] = (counts[k] || 0) + 1; });
  return Object.entries(counts);
}

const currentFilter = ref('reported');
const limit = ref(10);
const page = ref(0);
const total = ref(0);
const posts = ref([]);
const loading = ref(false);
const loadError = ref('');
const actingId = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));
const metaText = computed(() => {
  if (loading.value || loadError.value || !posts.value.length) return '';
  return `${page.value * limit.value + 1}–${page.value * limit.value + posts.value.length} trong ${total.value} bài viết · Trang ${page.value + 1}/${totalPages.value}`;
});

async function load(filter = currentFilter.value, p = page.value) {
  if (filter !== currentFilter.value) p = 0;
  currentFilter.value = filter;
  page.value = Math.max(0, p);
  loading.value = true;
  loadError.value = '';
  try {
    const qs = new URLSearchParams({ filter, limit: String(limit.value), offset: String(page.value * limit.value) });
    const data = await apiClient.get(`/admin/community/reports?${qs.toString()}`, { noCache: true });
    posts.value = data?.posts || [];
    total.value = data?.total || 0;
  } catch (_e) {
    loadError.value = 'Không tải được danh sách (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

async function act(fn, p) {
  actingId.value = p.id;
  try {
    await fn();
    await load(currentFilter.value, page.value);
    refreshBadge();
  } catch (e) {
    alert(e.message || 'Thao tác thất bại.');
  } finally {
    actingId.value = null;
  }
}

function toggleHide(p) {
  act(() => apiClient.patch(`/admin/community/posts/${p.id}`, { is_hidden: !p.is_hidden }), p);
}
function dismissReports(p) {
  if (!window.confirm('Bỏ qua báo cáo của bài này (xem như hợp lệ) và hiện lại?')) return;
  act(() => apiClient.post(`/admin/community/posts/${p.id}/dismiss-reports`, {}), p);
}
function removePost(p) {
  if (!window.confirm('Gỡ hẳn bài viết này? Hành động không thể hoàn tác (xoá cả bình luận & cảm xúc).')) return;
  act(() => apiClient.delete(`/admin/community/posts/${p.id}`), p);
}

async function refreshBadge() {
  try {
    const o = await apiClient.get('/admin/overview', { noCache: true });
    badges.setBadge('community', o.reported_community_posts);
  } catch (_e) { /* ignore */ }
}

onMounted(() => {
  load('reported');
  refreshBadge();
});
</script>
