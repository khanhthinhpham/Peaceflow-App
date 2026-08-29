<template>
  <main class="admin-main">
    <div class="admin-page-head">
      <p class="admin-page-kicker">PeaceFlow Admin</p>
      <h1 class="admin-page-title">Quản lý AI</h1>
      <p class="admin-page-sub">Theo dõi lượng dùng, chi phí, chủ đề người dùng quan tâm và lỗi của các tính năng AI.</p>
    </div>

    <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <select v-model.number="days" class="admin-input" aria-label="Khoảng thời gian" title="Khoảng thời gian" style="max-width:170px;" @change="loadAll">
        <option :value="1">Hôm nay</option>
        <option :value="7">7 ngày</option>
        <option :value="30">30 ngày</option>
        <option :value="90">90 ngày</option>
      </select>
      <button type="button" class="btn-outline" :disabled="loading" @click="loadAll">↻ Tải lại</button>
      <span style="font-size:.78rem;color:var(--text-light);margin-left:auto;">
        🔒 Không lưu nội dung tin nhắn của người dùng — chỉ lưu số liệu và từ khóa chủ đề.
      </span>
    </div>

    <div v-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>

    <!-- ===== TỔNG QUAN ===== -->
    <div class="admin-ov-section">
      <div class="admin-ov-h">Tổng quan {{ days === 1 ? 'hôm nay' : `${days} ngày qua` }}</div>
      <div v-if="loading && !overview" class="admin-card admin-empty">Đang tải...</div>
      <div v-else class="admin-ov-grid">
        <article class="admin-stat admin-stat--hero">
          <div class="admin-stat-top"><span class="admin-stat-label">Lượt gọi AI</span><span class="admin-stat-ico">🤖</span></div>
          <div class="admin-stat-value">{{ num(totals.calls) }}</div>
          <div class="admin-stat-hint">{{ num(totals.users) }} người dùng · {{ num(totals.avg_latency_ms) }}ms trung bình</div>
        </article>
        <article class="admin-stat admin-stat--finance">
          <div class="admin-stat-top"><span class="admin-stat-label">Chi phí ước tính</span><span class="admin-stat-ico">💰</span></div>
          <div class="admin-stat-value">{{ money(totals.cost_vnd) }}</div>
          <div class="admin-stat-hint">${{ (totals.cost_usd || 0).toFixed(4) }} · {{ num(costPerCall) }}đ/lượt</div>
        </article>
        <article class="admin-stat admin-stat--ops">
          <div class="admin-stat-top"><span class="admin-stat-label">Token đã dùng</span><span class="admin-stat-ico">🔢</span></div>
          <div class="admin-stat-value">{{ num(Number(totals.prompt_tokens || 0) + Number(totals.output_tokens || 0)) }}</div>
          <div class="admin-stat-hint">Vào {{ num(totals.prompt_tokens) }} · Ra {{ num(totals.output_tokens) }} · Cache {{ num(totals.cached_tokens) }}</div>
        </article>
        <article class="admin-stat admin-stat--ops">
          <div class="admin-stat-top"><span class="admin-stat-label">Tiết kiệm nhờ cache</span><span class="admin-stat-ico">♻️</span></div>
          <div class="admin-stat-value">{{ money(totals.saved_vnd) }}</div>
          <div class="admin-stat-hint">{{ num(totals.cache_hits) }} lượt dùng lại ({{ totals.cache_rate || 0 }}%) · 0 token</div>
        </article>
        <article class="admin-stat" :class="totals.errors > 0 ? 'admin-stat--alert' : 'admin-stat--ops'">
          <div class="admin-stat-top"><span class="admin-stat-label">Lỗi</span><span class="admin-stat-ico">{{ totals.errors > 0 ? '⚠️' : '✅' }}</span></div>
          <div class="admin-stat-value">{{ num(totals.errors) }}</div>
          <div class="admin-stat-hint">Tỷ lệ lỗi {{ totals.error_rate || 0 }}%</div>
        </article>
      </div>
    </div>

    <!-- ===== THEO TÍNH NĂNG ===== -->
    <div class="admin-ov-section">
      <div class="admin-ov-h">Theo tính năng</div>
      <div v-if="!byFeature.length" class="admin-card admin-empty">Chưa có dữ liệu trong khoảng thời gian này.</div>
      <div v-else class="admin-kpi-grid">
        <div v-for="f in byFeature" :key="f.feature" class="admin-kpi">
          <div class="admin-kpi-label">{{ FEATURE_LABEL[f.feature] || f.feature }}</div>
          <div class="admin-kpi-value">{{ num(f.calls) }}</div>
          <div class="admin-kpi-hint">
            {{ money(f.cost_vnd) }} · {{ num(f.avg_latency_ms) }}ms
            <span v-if="f.errors > 0" style="color:var(--coral-dark);"> · {{ num(f.errors) }} lỗi</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== BIỂU ĐỒ THEO NGÀY ===== -->
    <div v-if="chartDays.length" class="admin-ov-section">
      <div class="admin-ov-h">Lượt gọi theo ngày</div>
      <div class="admin-card">
        <div style="display:flex;align-items:flex-end;gap:3px;height:130px;">
          <div
            v-for="d in chartDays"
            :key="d.day"
            :title="`${dayLabel(d.day)}: ${d.calls} lượt${d.errors ? `, ${d.errors} lỗi` : ''}`"
            style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:1px;min-width:3px;"
          >
            <div v-if="d.errors" :style="{ height: barHeight(d.errors) + 'px', background: 'var(--coral)', borderRadius: '3px 3px 0 0' }"></div>
            <div :style="{ height: barHeight(d.calls - d.errors) + 'px', background: 'var(--mint-dark)', borderRadius: d.errors ? '0' : '3px 3px 0 0', minHeight: d.calls ? '2px' : '0' }"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-light);margin-top:6px;">
          <span>{{ dayLabel(chartDays[0].day) }}</span>
          <span>Cao nhất: {{ num(maxCalls) }} lượt/ngày</span>
          <span>{{ dayLabel(chartDays[chartDays.length - 1].day) }}</span>
        </div>
      </div>
    </div>

    <!-- ===== TOP NGƯỜI DÙNG + CHỦ ĐỀ ===== -->
    <div class="admin-ov-section">
      <div class="admin-ov-h">Người dùng dùng AI nhiều nhất</div>
      <div v-if="!topUsers.length" class="admin-card admin-empty">Chưa có dữ liệu.</div>
      <div v-else class="admin-card">
        <div class="admin-list">
          <div v-for="(u, idx) in topUsers" :key="u.user_id || idx" class="admin-list-item">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
              <span style="font-weight:800;color:var(--text-light);min-width:22px;">{{ idx + 1 }}.</span>
              <div style="min-width:0;">
                <div class="admin-list-title">{{ u.name }}</div>
                <div class="admin-list-sub">{{ u.email || '—' }} · lần cuối {{ dt(u.last_used_at) }}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-weight:800;">{{ num(u.calls) }} lượt</div>
              <div class="admin-list-sub">
                {{ money(u.cost_vnd) }}
                <span v-if="u.errors > 0" style="color:var(--coral-dark);"> · {{ num(u.errors) }} lỗi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-ov-section">
      <div class="admin-ov-h">Chủ đề được hỏi nhiều nhất</div>
      <div v-if="!topics.length" class="admin-card admin-empty">Chưa có dữ liệu chủ đề.</div>
      <div v-else class="admin-card" style="display:flex;flex-wrap:wrap;gap:8px;">
        <span
          v-for="t in topics"
          :key="t.topic"
          :title="`${t.count} lượt · ${t.users} người dùng`"
          :style="topicChipStyle(t.count)"
        >{{ t.topic }} <strong>{{ t.count }}</strong></span>
      </div>
    </div>

    <!-- ===== LOG CHI TIẾT ===== -->
    <div class="admin-ov-section">
      <div class="admin-ov-h">Log chi tiết từng lượt gọi</div>

      <div class="admin-tabs">
        <button
          v-for="opt in [{ v: '', l: 'Tất cả' }, { v: 'error', l: 'Chỉ lỗi' }, { v: 'success', l: 'Chỉ thành công' }]"
          :key="opt.v"
          type="button"
          class="admin-tab"
          :class="{ active: logStatus === opt.v }"
          @click="logStatus = opt.v; loadLogs(0)"
        >{{ opt.l }}</button>
        <button
          v-for="opt in featureTabs"
          :key="opt.v"
          type="button"
          class="admin-tab"
          :class="{ active: logFeature === opt.v }"
          @click="logFeature = opt.v; loadLogs(0)"
        >{{ opt.l }}</button>
      </div>

      <!-- Tra cứu một người cụ thể đã dùng AI làm gì. Gõ xong dừng 400ms mới gọi API để
           không bắn một request cho mỗi ký tự. -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <input
          v-model="logSearch"
          type="search"
          class="admin-input"
          placeholder="Tìm theo tên hoặc email người dùng..."
          aria-label="Tìm log theo tên hoặc email"
          style="flex:1;min-width:220px;"
          @input="onSearchInput"
          @keyup.enter="loadLogs(0)"
        >
        <button
          v-if="logSearch"
          type="button"
          class="admin-tab"
          title="Xoá tìm kiếm"
          @click="logSearch = ''; loadLogs(0)"
        >✕ Xoá</button>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <span style="font-size:.82rem;color:var(--text-light);">{{ logMetaText }}</span>
        <select v-model.number="logLimit" class="admin-input" aria-label="Số log mỗi trang" title="Số log mỗi trang" style="max-width:130px;margin-left:auto;" @change="loadLogs(0)">
          <option :value="5">5 / trang</option>
          <option :value="10">10 / trang</option>
          <option :value="25">25 / trang</option>
          <option :value="50">50 / trang</option>
          <option :value="100">100 / trang</option>
        </select>
      </div>

      <div v-if="logsLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="!logs.length" class="admin-card admin-empty">Không có log nào khớp bộ lọc.</div>
      <template v-else>
        <div v-for="log in logs" :key="log.id" class="admin-card" style="padding:12px 14px;">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;">
            <div style="min-width:0;flex:1;">
              <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                <span :style="log.success ? chipOk : chipErr">{{ log.success ? 'OK' : 'LỖI' }}</span>
                <span v-if="log.from_cache" :style="chipCache" title="Dùng lại kết quả có sẵn — không tốn token">♻️ CACHE</span>
                <strong style="font-size:.88rem;">{{ FEATURE_LABEL[log.feature] || log.feature }}</strong>
                <span style="font-size:.78rem;color:var(--text-secondary);">
                  {{ log.user_name }}
                  <span v-if="log.user_email && log.user_email !== log.user_name" style="color:var(--text-light);">· {{ log.user_email }}</span>
                </span>
              </div>
              <div style="font-size:.76rem;color:var(--text-light);margin-top:4px;">
                {{ dtFull(log.created_at) }} · {{ log.model || '—' }} ·
                vào {{ num(log.prompt_tokens) }} / ra {{ num(log.output_tokens) }} token
                <span v-if="log.cached_tokens > 0"> · cache {{ num(log.cached_tokens) }}</span>
                · {{ num(log.latency_ms) }}ms · {{ money(log.cost_vnd) }}
              </div>
              <div v-if="(log.topics || []).length" style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">
                <span v-for="(t, i) in log.topics" :key="i" style="font-size:.68rem;padding:1px 7px;border-radius:6px;background:var(--mint-light);color:var(--mint-dark);">{{ t }}</span>
              </div>
              <div v-if="log.error_message" style="font-size:.75rem;color:var(--coral-dark);margin-top:6px;word-break:break-word;">
                {{ log.error_message }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <AdminPager :page="logPage" :total-pages="logTotalPages" @go="loadLogs" />
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { apiClient } from '../../lib/apiClient';
import AdminPager from '../../components/AdminPager.vue';

const FEATURE_LABEL = {
  chat: 'Chat PeaceCat',
  assessment_summary: 'Nhận xét bài test',
  daily_message: 'Lời khuyên (bấm nút)'
};

const featureTabs = [
  { v: 'chat', l: 'Chat' },
  { v: 'assessment_summary', l: 'Bài test' },
  { v: 'daily_message', l: 'Lời khuyên' }
];

const chipOk = { fontSize: '.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: '6px', background: 'var(--mint-light)', color: 'var(--mint-dark)' };
const chipErr = { fontSize: '.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: '6px', background: 'rgba(255,139,139,.16)', color: 'var(--coral-dark)' };
const chipCache = { fontSize: '.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: '6px', background: 'var(--sky-light)', color: '#4a90aa' };

function num(v) { return Number(v || 0).toLocaleString('vi-VN'); }
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }
function dt(v) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}
function dtFull(v) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}
function dayLabel(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}

const days = ref(30);
const loading = ref(false);
const loadError = ref('');
const overview = ref(null);
const topUsers = ref([]);
const topics = ref([]);

const totals = computed(() => overview.value?.totals || {});
const byFeature = computed(() => overview.value?.by_feature || []);
const chartDays = computed(() => overview.value?.by_day || []);
const maxCalls = computed(() => Math.max(1, ...chartDays.value.map((d) => Number(d.calls || 0))));
const costPerCall = computed(() => {
  const calls = Number(totals.value.calls || 0);
  return calls ? Math.round(Number(totals.value.cost_vnd || 0) / calls) : 0;
});

function barHeight(value) {
  const v = Math.max(0, Number(value || 0));
  if (!v) return 0;
  return Math.max(2, Math.round((v / maxCalls.value) * 110));
}

// Chip chủ đề: chủ đề càng nhiều lượt càng đậm màu, để nhìn ra ngay điều người dùng
// quan tâm nhất mà không cần đọc số.
function topicChipStyle(count) {
  const ratio = topics.value.length ? Number(count) / Number(topics.value[0].count || 1) : 0;
  return {
    fontSize: '.8rem',
    padding: '4px 11px',
    borderRadius: '50px',
    background: `rgba(123, 191, 149, ${(0.12 + ratio * 0.4).toFixed(2)})`,
    border: '1px solid var(--mint)',
    color: 'var(--text-primary)'
  };
}

const logs = ref([]);
const logsLoading = ref(false);
const logTotal = ref(0);
const logPage = ref(0);
const logLimit = ref(25);
const logStatus = ref('');
const logFeature = ref('');
const logSearch = ref('');

// Gõ xong dừng 400ms mới gọi API, tránh mỗi ký tự một request.
let searchTimer = null;
function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadLogs(0), 400);
}
onBeforeUnmount(() => clearTimeout(searchTimer));

const logTotalPages = computed(() => Math.max(1, Math.ceil(logTotal.value / logLimit.value)));
const logMetaText = computed(() => {
  if (logsLoading.value) return '';
  const from = logTotal.value ? logPage.value * logLimit.value + 1 : 0;
  const to = logPage.value * logLimit.value + logs.value.length;
  const base = `${from}–${to} trong ${logTotal.value} lượt gọi · Trang ${logPage.value + 1}/${logTotalPages.value}`;
  return logSearch.value.trim() ? `${base} · đang tìm "${logSearch.value.trim()}"` : base;
});

async function loadOverview() {
  const [ov, users, tps] = await Promise.all([
    apiClient.get(`/admin/ai/overview?days=${days.value}`, { noCache: true }),
    apiClient.get(`/admin/ai/top-users?days=${days.value}&limit=10`, { noCache: true }),
    apiClient.get(`/admin/ai/topics?days=${days.value}&limit=25`, { noCache: true })
  ]);
  overview.value = ov || null;
  topUsers.value = users?.users || [];
  topics.value = tps?.topics || [];
}

async function loadLogs(p = logPage.value) {
  logPage.value = Math.max(0, p);
  logsLoading.value = true;
  try {
    const qs = new URLSearchParams({ limit: String(logLimit.value), offset: String(logPage.value * logLimit.value) });
    if (logStatus.value) qs.set('status', logStatus.value);
    if (logFeature.value) qs.set('feature', logFeature.value);
    if (logSearch.value.trim()) qs.set('q', logSearch.value.trim());
    const data = await apiClient.get(`/admin/ai/logs?${qs.toString()}`, { noCache: true });
    logs.value = data?.logs || [];
    logTotal.value = data?.total || 0;
  } catch (_e) {
    logs.value = [];
    logTotal.value = 0;
  } finally {
    logsLoading.value = false;
  }
}

async function loadAll() {
  loading.value = true;
  loadError.value = '';
  try {
    await Promise.all([loadOverview(), loadLogs(0)]);
  } catch (_e) {
    loadError.value = 'Không tải được dữ liệu AI (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
</script>
