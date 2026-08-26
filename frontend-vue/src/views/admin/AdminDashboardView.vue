<template>
  <main class="admin-main">
    <div class="admin-ov-header">
      <p v-if="loading" class="admin-page-sub">Đang tải số liệu...</p>
      <div v-else class="admin-ov-header-row">
        <div>
          <p class="admin-page-kicker">PeaceFlow Admin</p>
          <h1 class="admin-page-title">Xin chào, {{ greetingName }}</h1>
        </div>
        <div class="admin-ov-header-meta">
          <span>{{ nowStamp }}</span>
          <button type="button" class="admin-ov-refresh" aria-label="Làm mới" @click="load">
            <span v-html="icon('refresh')"></span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>

    <template v-else-if="o">
      <!-- Alert banner -->
      <div class="admin-alert-banner" :class="`admin-alert-banner--${alertInfo.variant}`">
        <span class="admin-alert-banner-ico" v-html="alertInfo.ico"></span>
        <div class="admin-alert-banner-body">
          <span class="admin-alert-banner-title">{{ alertInfo.title }}</span>
          <span class="admin-alert-banner-sub">{{ alertInfo.sub }}</span>
        </div>
        <router-link v-if="alertInfo.cta" :to="alertInfo.to" class="admin-alert-banner-cta">{{ alertInfo.cta }} →</router-link>
      </div>

      <!-- Quick actions -->
      <div id="ovActions">
        <h3 class="admin-ov-h"><span v-html="icon('bolt')"></span> Thao tác nhanh</h3>
        <div class="admin-quick-grid">
          <router-link to="/admin/experts" class="admin-quick">
            <span class="admin-quick-ico" v-html="icon('clipboard-check')"></span>
            <span class="admin-quick-title">Duyệt chuyên gia</span>
            <span class="admin-quick-count">{{ num(o.pending_expert_applications) }} chờ</span>
          </router-link>
          <router-link to="/admin/payments" class="admin-quick">
            <span class="admin-quick-ico" v-html="icon('card')"></span>
            <span class="admin-quick-title">Thanh toán & payout</span>
            <span class="admin-quick-count">{{ num(o.pending_payment_bookings) }} chờ</span>
          </router-link>
          <router-link to="/admin/community" class="admin-quick">
            <span class="admin-quick-ico" v-html="icon('shield')"></span>
            <span class="admin-quick-title">Kiểm duyệt cộng đồng</span>
            <span class="admin-quick-count">{{ num(o.reported_community_posts) }} báo cáo</span>
          </router-link>
          <router-link to="/admin/users" class="admin-quick">
            <span class="admin-quick-ico" v-html="icon('users')"></span>
            <span class="admin-quick-title">Quản lý người dùng</span>
            <span class="admin-quick-count">{{ num(o.total_users) }} tổng</span>
          </router-link>
        </div>
      </div>

      <!-- Vận hành -->
      <div class="admin-ov-section">
        <h3 class="admin-ov-h"><span v-html="icon('chart')"></span> Vận hành</h3>
        <div class="admin-ov-grid">
          <article class="admin-stat admin-stat--ops">
            <div class="admin-stat-top"><span class="admin-stat-label">Tổng người dùng</span><span class="admin-stat-ico" v-html="icon('users')"></span></div>
            <div class="admin-stat-value">{{ num(o.total_users) }}</div>
            <div class="admin-stat-hint">{{ deltaText(o.new_users_7d, o.new_users_prev_7d) }} · +{{ num(o.new_users_today) }} hôm nay</div>
          </article>
          <article class="admin-stat admin-stat--ops">
            <div class="admin-stat-top"><span class="admin-stat-label">Chuyên gia hoạt động</span><span class="admin-stat-ico" v-html="icon('badge')"></span></div>
            <div class="admin-stat-value">{{ num(o.active_experts) }}<span class="admin-stat-frac">/{{ num(o.total_experts) }}</span></div>
            <div class="admin-stat-hint">{{ o.total_experts ? Math.round((o.active_experts / o.total_experts) * 100) : 0 }}% hoạt động</div>
          </article>
          <article class="admin-stat admin-stat--ops">
            <div class="admin-stat-top"><span class="admin-stat-label">Lịch hẹn</span><span class="admin-stat-ico" v-html="icon('calendar')"></span></div>
            <div class="admin-stat-value">{{ num(o.bookings_total) }}</div>
            <div class="admin-stat-hint">Hôm nay {{ num(o.bookings_today) }} · hoàn thành {{ num(o.bookings_completed) }}</div>
          </article>
          <article class="admin-stat admin-stat--ops">
            <div class="admin-stat-top"><span class="admin-stat-label">Lịch sắp tới</span><span class="admin-stat-ico" v-html="icon('clock')"></span></div>
            <div class="admin-stat-value">{{ num(o.bookings_upcoming) }}</div>
            <div class="admin-stat-hint">{{ num(o.bookings_awaiting_expert) }} chờ chuyên gia nhận</div>
          </article>
        </div>
      </div>

      <!-- Tài chính -->
      <div class="admin-ov-section">
        <h3 class="admin-ov-h"><span v-html="icon('money')"></span> Tài chính</h3>
        <div class="admin-finance-layout">
          <div class="admin-card admin-finance-hero">
            <div class="admin-finance-hero-head">
              <div>
                <span class="admin-stat-label">Doanh thu nền tảng</span>
                <div class="admin-finance-hero-value">{{ money(o.platform_revenue) }}</div>
                <div class="admin-stat-hint">Phí 25% từ buổi đã đối soát · tháng này {{ money(o.platform_revenue_month) }}</div>
              </div>
              <span class="admin-chart-range">30 ngày qua</span>
            </div>
            <div class="admin-finance-hero-chart">
              <div v-if="revenueSum <= 0" class="admin-finance-empty">Chưa có doanh thu. Biểu đồ sẽ hiện khi có giao dịch đầu tiên.</div>
              <div v-else v-html="revenueChartSvg"></div>
            </div>
          </div>
          <div class="admin-finance-side">
            <article class="admin-stat admin-stat--finance">
              <div class="admin-stat-top"><span class="admin-stat-label">Tổng GMV</span><span class="admin-stat-ico" v-html="icon('card')"></span></div>
              <div class="admin-stat-value">{{ money(o.gmv) }}</div>
              <div class="admin-stat-hint">Tổng giá trị giao dịch</div>
            </article>
            <article class="admin-stat admin-stat--finance">
              <div class="admin-stat-top"><span class="admin-stat-label">Đã chi trả chuyên gia</span><span class="admin-stat-ico" v-html="icon('check')"></span></div>
              <div class="admin-stat-value">{{ money(o.total_paid_experts) }}</div>
              <div class="admin-stat-hint">Cộng dồn các đợt payout</div>
            </article>
            <article class="admin-stat admin-stat--finance">
              <div class="admin-stat-top"><span class="admin-stat-label">Số dư ví đang giữ</span><span class="admin-stat-ico" v-html="icon('wallet')"></span></div>
              <div class="admin-stat-value">{{ money(o.total_wallet_balance) }}</div>
              <div class="admin-stat-hint">Nghĩa vụ hoàn cho người dùng</div>
            </article>
            <article class="admin-stat admin-stat--finance">
              <div class="admin-stat-top"><span class="admin-stat-label">Chờ payout</span><span class="admin-stat-ico" v-html="icon('clock')"></span></div>
              <div class="admin-stat-value">{{ money(o.pending_payout_amount) }}</div>
              <div class="admin-stat-hint">{{ num(o.pending_payout_experts) }} chuyên gia đang chờ</div>
            </article>
          </div>
        </div>
      </div>

      <!-- Cộng đồng -->
      <div class="admin-ov-section">
        <h3 class="admin-ov-h"><span v-html="icon('message')"></span> Cộng đồng</h3>
        <div class="admin-ov-grid">
          <article class="admin-stat admin-stat--ops">
            <div class="admin-stat-top"><span class="admin-stat-label">Bài cộng đồng</span><span class="admin-stat-ico" v-html="icon('message')"></span></div>
            <div class="admin-stat-value">{{ num(o.total_community_posts) }}</div>
            <div class="admin-stat-hint">+{{ num(o.community_posts_today) }} hôm nay</div>
          </article>
          <article class="admin-stat" :class="o.reported_community_posts > 0 ? 'admin-stat--alert' : 'admin-stat--warn'">
            <div class="admin-stat-top"><span class="admin-stat-label">Bài bị báo cáo</span><span class="admin-stat-ico" v-html="icon('flag')"></span></div>
            <div class="admin-stat-value">{{ num(o.reported_community_posts) }}</div>
            <div class="admin-stat-hint">{{ num(o.hidden_community_posts) }} đang ẩn</div>
          </article>
        </div>
      </div>

      <!-- Booking 30 ngày -->
      <div class="admin-ov-section">
        <h3 class="admin-ov-h"><span v-html="icon('calendar')"></span> Booking 30 ngày</h3>
        <div class="admin-card admin-chart-card">
          <div class="admin-chart-head">
            <p class="admin-chart-total">{{ num(bookingSum) }} lượt</p>
            <span class="admin-chart-range">Tổng {{ num(bookingSum) }}</span>
          </div>
          <div class="admin-chart-body">
            <div v-if="!bookingChartSvg" class="admin-empty" style="padding:20px;">Chưa có dữ liệu</div>
            <div v-else v-html="bookingChartSvg"></div>
          </div>
          <div v-if="bookings.length" class="admin-chart-xaxis">
            <span>{{ dayLabel(bookings[0].day) }}</span>
            <span>{{ dayLabel(bookings[bookings.length - 1].day) }}</span>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/auth';
import { useAdminBadgesStore } from '../../stores/adminBadges';
import { icon } from '../../lib/adminIcons';

const auth = useAuthStore();
const badges = useAdminBadgesStore();

const loading = ref(true);
const loadError = ref('');
const o = ref(null);
const t = ref(null);
const nowStamp = ref('');

const greetingName = computed(() => {
  const name = auth.user?.display_name || auth.user?.full_name || 'Admin';
  return name.split(' ').slice(-1)[0];
});

function num(v) { return Number(v || 0).toLocaleString('vi-VN'); }
function money(v) { return `${Number(v || 0).toLocaleString('vi-VN')}đ`; }

function deltaText(cur, prev) {
  const diff = Number(cur || 0) - Number(prev || 0);
  if (diff === 0) return '±0 vs tuần trước';
  return `${diff > 0 ? '+' : '−'}${Math.abs(diff)} vs tuần trước`;
}

function dayLabel(iso) {
  if (!iso) return '';
  const [, m, d] = String(iso).split('-');
  return `${d}/${m}`;
}

function areaChart(series, color) {
  const w = 600, h = 150, pad = 8;
  if (!series.length) return '';
  const max = Math.max(1, ...series.map((s) => s.value));
  const stepX = (w - 2 * pad) / Math.max(1, series.length - 1);
  const pts = series.map((s, i) => [pad + i * stepX, h - pad - (s.value / max) * (h - 2 * pad - 6)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `M${pts[0][0].toFixed(1)},${(h - pad).toFixed(1)} ${pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} L${pts[pts.length - 1][0].toFixed(1)},${(h - pad).toFixed(1)} Z`;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="admin-chart-svg" role="img">
        <path d="${area}" fill="${color}" fill-opacity="0.14"/>
        <path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
}

function barChart(series, color) {
  const w = 600, h = 150, pad = 8;
  if (!series.length) return '';
  const max = Math.max(1, ...series.map((s) => s.value));
  const gap = (w - 2 * pad) / series.length;
  const bw = gap * 0.62;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="admin-chart-svg" role="img">${series.map((s, i) => {
    const bh = (s.value / max) * (h - 2 * pad);
    const x = pad + i * gap + (gap - bw) / 2;
    const y = h - pad - bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, bh).toFixed(1)}" rx="1.5" fill="${color}" fill-opacity="0.85"/>`;
  }).join('')}</svg>`;
}

const revenue = computed(() => t.value?.revenue || []);
const revenueSum = computed(() => revenue.value.reduce((acc, s) => acc + s.value, 0));
const revenueChartSvg = computed(() => areaChart(revenue.value, '#4a9e8e'));

const bookings = computed(() => t.value?.bookings || []);
const bookingSum = computed(() => bookings.value.reduce((acc, s) => acc + s.value, 0));
const bookingChartSvg = computed(() => barChart(bookings.value, '#e0955a'));

const alertInfo = computed(() => {
  if (!o.value) return { variant: 'ok', ico: '', title: '', sub: '', cta: '', to: '' };
  if (o.value.high_risk_users_7d > 0) {
    return { variant: 'critical', ico: icon('alert'), title: `${num(o.value.high_risk_users_7d)} người dùng nguy cơ cao`, sub: `7 ngày · mức high/critical · ${deltaText(o.value.high_risk_users_7d, o.value.high_risk_users_prev_7d)}`, cta: 'Xem chi tiết', to: '/admin/users' };
  }
  if (o.value.emergencies_7d > 0) {
    return { variant: 'critical', ico: icon('alert'), title: `${num(o.value.emergencies_7d)} lượt khẩn cấp`, sub: '7 ngày qua', cta: 'Xem', to: '/admin/users' };
  }
  if (o.value.pending_payment_bookings > 0) {
    return { variant: 'warn', ico: icon('wallet'), title: `${num(o.value.pending_payment_bookings)} booking chờ đối soát`, sub: 'Cần xác nhận tiền vào', cta: 'Đối soát', to: '/admin/payments' };
  }
  return { variant: 'ok', ico: icon('check'), title: 'Mọi thứ đang ổn', sub: 'Không có việc nào cần xử lý gấp hôm nay.', cta: '', to: '' };
});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const [overview, trends] = await Promise.all([
      apiClient.get('/admin/overview', { noCache: true }),
      apiClient.get('/admin/overview/trends', { noCache: true }).catch(() => ({ revenue: [], bookings: [], signups: [] }))
    ]);
    o.value = overview;
    t.value = trends;
    badges.setBadge('experts', overview.pending_expert_applications);
    badges.setBadge('payments', overview.pending_payment_bookings);
    badges.setBadge('community', overview.reported_community_posts);
    try {
      nowStamp.value = new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_e) {
      nowStamp.value = '';
    }
  } catch (error) {
    loadError.value = error.message || 'Không tải được tổng quan admin.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
