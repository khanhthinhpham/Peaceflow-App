<template>
  <main class="expert-main expert-dashboard-main">
    <header class="expert-topbar expert-dashboard-topbar">
      <div class="expert-topbar-copy">
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">{{ pageTitle }}</h1>
        <p class="expert-page-subtitle"></p>
      </div>

      <div class="expert-topbar-tools">
        <button type="button" class="expert-bell-btn" aria-label="Thông báo" @click="notif.togglePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span class="expert-bell-badge" :style="{ display: notif.unread > 0 ? 'flex' : 'none' }">{{ Math.min(notif.unread, 9) }}</span>
        </button>
        <div class="expert-status-toggle-slot">
          <div v-if="hasProfile" class="expert-status-dropdown" ref="statusDropdownEl">
            <button type="button" class="expert-status-trigger" :aria-expanded="statusMenuOpen" @click.stop="statusMenuOpen = !statusMenuOpen">
              <span class="expert-status-dot" :class="`is-${currentStatus}`"></span>
              <span>{{ STATUS_LABELS[currentStatus] }}</span>
              <span class="expert-status-caret">∨</span>
            </button>
            <div v-if="statusMenuOpen" class="expert-status-menu">
              <div class="expert-status-menu-title">Trạng thái hoạt động</div>
              <button
                v-for="s in STATUSES"
                :key="s.key"
                type="button"
                class="expert-status-option"
                :class="{ 'is-active': s.key === currentStatus }"
                @click="changeStatus(s.key)"
              >
                <span class="expert-status-dot" :class="`is-${s.key}`"></span>
                <span class="expert-status-option-copy">
                  <strong>{{ s.label }}</strong>
                  <small>{{ s.hint }}</small>
                </span>
              </button>
            </div>
          </div>
        </div>
        <div class="expert-avatar-chip" aria-hidden="true">{{ avatarInitials }}</div>
      </div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <section v-if="hasProfile" class="expert-kpi-row">
      <article v-for="card in kpiCards" :key="card.label" class="expert-kpi-card" :class="`is-${card.tone}`">
        <span class="expert-kpi-icon">{{ card.icon }}</span>
        <div class="expert-kpi-copy">
          <span class="expert-kpi-label">{{ card.label }}</span>
          <span class="expert-kpi-value">{{ card.value }}</span>
          <span class="expert-kpi-hint">{{ card.hint }}</span>
        </div>
      </article>
    </section>

    <section v-if="hasProfile" class="expert-dashboard-grid">
      <section class="expert-panel expert-section expert-booking-panel">
        <div class="expert-section-head">
          <div>
            <h2 class="expert-section-title">Lịch hẹn</h2>
            <p class="expert-section-copy">Trung tâm điều phối các buổi tư vấn của bạn.</p>
          </div>
        </div>
        <div id="expertBookings">
          <div v-if="bookingsLoading" style="color:var(--text-secondary);">Đang tải lịch hẹn...</div>
          <div v-else-if="bookingsError" style="color:var(--text-secondary);">Không tải được danh sách lịch hẹn.</div>
          <template v-else>
            <div class="expert-booking-toolbar">
              <div class="expert-booking-tabs">
                <button
                  v-for="tab in BOOKING_TABS"
                  :key="tab.key"
                  type="button"
                  class="expert-booking-tab"
                  :class="{ 'is-active': tab.key === activeTab }"
                  @click="activeTab = tab.key"
                >
                  <span>{{ tab.label }}</span>
                  <span class="expert-booking-tab-count">{{ tabCounts[tab.key] || 0 }}</span>
                </button>
              </div>
            </div>
            <div class="expert-booking-body">
              <template v-if="filteredBookings.length">
                <article v-for="booking in filteredBookings" :key="booking.id" class="expert-booking-card">
                  <div class="expert-booking-card-head">
                    <div>
                      <strong>{{ booking.client_name || 'Thân chủ' }}</strong>
                      <div class="expert-booking-meta">
                        {{ SESSION_TYPE_LABELS[booking.session_type] || booking.session_type }} ·
                        {{ formatDateTime(booking.starts_at) }} · {{ booking.duration_minutes }} phút · {{ money(booking.price) }}
                      </div>
                      <div v-if="booking.notes" class="expert-booking-notes">{{ booking.notes }}</div>
                      <MedicalRecordsViewer :booking-id="booking.id" />
                      <div v-if="booking.review_rating" class="expert-booking-extra">Đánh giá: {{ booking.review_rating }}/5</div>
                      <a v-if="booking.status === 'confirmed' && booking.zoom_start_url" :href="booking.zoom_start_url" target="_blank" rel="noopener" class="expert-booking-zoom-link">🎥 Vào phòng Zoom</a>
                    </div>
                    <span class="expert-booking-status-chip">{{ BOOKING_STATUS_LABELS[booking.status] || booking.status }}</span>
                  </div>
                  <div v-if="rowActions(booking).length" class="expert-booking-actions">
                    <button
                      v-for="a in rowActions(booking)"
                      :key="a.status"
                      type="button"
                      class="expert-booking-action"
                      :class="{ 'is-primary': a.variant === 'primary' }"
                      @click="updateBooking(booking.id, a.status)"
                    >{{ a.label }}</button>
                  </div>
                </article>
              </template>
              <div v-else class="expert-booking-empty">
                <div class="expert-booking-empty-icon" aria-hidden="true">📅</div>
                <h3>{{ emptyState.title }}</h3>
                <p>{{ emptyState.text }}</p>
                <p class="expert-booking-empty-note">Bạn sẽ nhận được thông báo khi có lịch hẹn mới.</p>
              </div>
            </div>
          </template>
        </div>
      </section>

      <aside class="expert-dashboard-secondary">
        <section class="expert-panel expert-section expert-pending-panel">
          <div class="expert-section-head">
            <div>
              <h2 class="expert-section-title">Lịch chờ bạn nhận</h2>
              <p class="expert-section-copy">Lịch đã thanh toán — nhận hoặc từ chối (từ chối sẽ hoàn tiền cho thân chủ).</p>
            </div>
            <span class="expert-pending-badge" :class="{ 'is-alert': pendingBookings.length > 0 }">{{ pendingBookings.length }}</span>
          </div>
          <div id="expertPending">
            <p v-if="!pendingBookings.length" class="expert-pending-empty">Không có lịch nào chờ bạn nhận. Lịch đã thanh toán sẽ xuất hiện ở đây.</p>
            <div v-else style="max-height:520px;overflow-y:auto;">
              <article v-for="booking in pendingBookings" :key="booking.id" class="expert-pending-card">
                <strong>{{ booking.client_name || 'Thân chủ' }}</strong>
                <div class="expert-pending-meta">{{ SESSION_TYPE_LABELS[booking.session_type] || booking.session_type }} · {{ formatDateTime(booking.starts_at) }} · {{ booking.duration_minutes }} phút</div>
                <div v-if="booking.notes" class="expert-pending-note">{{ booking.notes }}</div>
                <div v-else class="expert-pending-note is-empty">Thân chủ chưa để lại mô tả tình trạng.</div>
                <MedicalRecordsViewer :booking-id="booking.id" />
                <div class="expert-booking-actions">
                  <button type="button" class="expert-booking-action is-primary" @click="updateBooking(booking.id, 'confirmed')">Nhận lịch</button>
                  <button type="button" class="expert-booking-action" @click="updateBooking(booking.id, 'cancelled')">Từ chối</button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="expert-panel expert-section expert-profile-panel">
          <div class="expert-section-head">
            <div>
              <h2 class="expert-section-title">Hồ sơ</h2>
            </div>
            <router-link class="expert-inline-link" :to="{ name: 'expert-application' }">Chỉnh sửa</router-link>
          </div>
          <div id="expertProfile">
            <template v-if="profile">
              <div class="expert-profile-chips">
                <span class="expert-pchip is-accent">⭐ {{ ratingText }}</span>
                <span class="expert-pchip">🎓 {{ profile.degree || '—' }}</span>
                <span class="expert-pchip">💼 {{ profile.experience_years || 0 }} năm</span>
                <span class="expert-pchip">📍 {{ profile.location || 'Chưa cập nhật' }}</span>
                <span class="expert-pchip">💵 {{ priceText }}</span>
              </div>
              <div class="expert-tag-row">
                <template v-if="(profile.specialties || []).length">
                  <span v-for="item in profile.specialties" :key="item" class="expert-chip">{{ item }}</span>
                </template>
                <span v-else class="expert-chip">Chưa có chuyên môn</span>
              </div>
            </template>
            <div v-else class="expert-empty">
              <h3>Hồ sơ chuyên gia chưa được tạo</h3>
              <p>Gửi hồ sơ chuyên gia để hệ thống khởi tạo profile, lịch hẹn và các chỉ số vận hành.</p>
              <router-link class="btn-primary" :to="{ name: 'expert-application' }">Mở hồ sơ chuyên gia</router-link>
            </div>
          </div>
        </section>

        <section class="expert-panel expert-section">
          <div class="expert-section-head">
            <div>
              <h2 class="expert-section-title">Doanh thu &amp; số dư</h2>
              <p class="expert-section-copy">Số dư được nền tảng đối soát &amp; chi trả theo chu kỳ.</p>
            </div>
          </div>
          <div id="expertEarnings">
            <p v-if="earningsError" style="color:var(--text-secondary);">Không tải được doanh thu.</p>
            <template v-else-if="earnings">
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin:20px;">
                <div style="flex:1;min-width:120px;background:var(--mint-light);border:1.5px solid var(--mint);border-radius:14px;padding:12px 14px;">
                  <div style="font-size:0.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mint-dark);">Số dư khả dụng</div>
                  <div style="font-size:1.4rem;font-weight:800;color:var(--mint-dark);">{{ money(earnings.balance) }}</div>
                </div>
                <div style="flex:1;min-width:120px;background:var(--warm-white);border:1.5px solid var(--kraft-light);border-radius:14px;padding:12px 14px;">
                  <div style="font-size:0.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);">Tổng đã nhận</div>
                  <div style="font-size:1.4rem;font-weight:800;">{{ money(earnings.total_earned) }}</div>
                </div>
              </div>
              <div v-if="earnings.pending" style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">⏳ Chờ hoàn thành buổi: {{ money(earnings.pending) }}</div>
              <div>
                <template v-if="(earnings.recent || []).length">
                  <div v-for="r in earnings.recent.slice(0, 8)" :key="r.id || r.created_at" style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed var(--kraft-light);font-size:0.85rem;">
                    <span style="color:var(--text-secondary);">{{ r.client_name || 'Thân chủ' }} · {{ formatDateTime(r.created_at) }}</span>
                    <strong style="color:var(--mint-dark);white-space:nowrap;">+{{ money(r.expert_earning) }}</strong>
                  </div>
                </template>
                <p v-else style="color:var(--text-secondary);font-size:0.85rem;margin:20px 30px;">Chưa có doanh thu.</p>
              </div>
            </template>
          </div>
        </section>
      </aside>
    </section>

    <section v-if="hasProfile" class="expert-panel expert-section expert-availability-panel" id="expertAvailabilitySection">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">Lịch làm việc hàng tuần</h2>
          <p class="expert-section-copy">Bấm để tô xanh những khung giờ bạn <strong>rảnh</strong> — thân chủ chỉ đặt được lịch vào các khung giờ đó. Khung giờ để trống nghĩa là bạn bận.</p>
        </div>
      </div>
      <div id="expertAvailability">
        <div class="expert-availability-toolbar compact">
          <div class="expert-availability-legend">
            <span class="expert-availability-legend-item"><span class="legend-swatch is-free"></span> {{ freeCellsCount }} giờ rảnh</span>
            <span class="expert-availability-legend-item"><span class="legend-swatch is-busy"></span> {{ busyCellsCount }} giờ bận</span>
          </div>
        </div>
        <div class="expert-availability-matrix">
          <div class="expert-availability-heads">
            <div class="availability-time-spacer"></div>
            <div class="availability-head-cells">
              <div v-for="day in AVAILABILITY_DAY_ORDER" :key="day" class="availability-day-head compact">{{ AVAILABILITY_DAY_LABELS[day] }}</div>
            </div>
          </div>
          <div class="expert-availability-rows">
            <div v-for="row in availabilityRows" :key="row.startMinutes" class="availability-row">
              <div class="availability-time-head">{{ minutesToTime(row.startMinutes) }}</div>
              <div class="availability-row-cells">
                <button
                  v-for="cell in row.cells"
                  :key="cell.key"
                  type="button"
                  class="availability-cell"
                  :class="cell.free ? 'is-free' : 'is-busy'"
                  :aria-pressed="cell.free ? 'true' : 'false'"
                  :title="`${WEEKDAYS[cell.weekday]} ${row.label}: ${cell.free ? 'Rảnh' : 'Bận'}`"
                  @click="toggleAvailabilityCell(cell.key)"
                >
                  <span></span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="expert-availability-note">Bấm vào ô để đánh dấu giờ <strong>rảnh</strong>. Mỗi ô là 1 giờ; ô để trống nghĩa là bạn bận và thân chủ sẽ không đặt được vào lúc đó.</div>
        <div class="expert-availability-footer">
          <button type="button" class="btn-primary" :disabled="savingAvailability" @click="saveAvailability">Lưu lịch</button>
        </div>
      </div>
    </section>

    <section v-if="hasProfile" class="expert-panel expert-section">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">Nghỉ / bận riêng theo ngày cụ thể</h2>
          <p class="expert-section-copy">Cộng thêm vào lịch tuần ở trên — dùng cho nghỉ lễ, nghỉ phép, bận đột xuất đúng 1 ngày.</p>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px;">
        <div>
          <label style="display:block;font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">Ngày</label>
          <input type="date" v-model="exceptionForm.date" :min="todayIso" style="padding:7px 10px;border:1.5px solid var(--kraft-light);border-radius:8px;font:inherit;">
        </div>
        <label style="display:flex;align-items:center;gap:6px;font-size:0.84rem;cursor:pointer;padding-bottom:8px;">
          <input type="checkbox" v-model="exceptionForm.fullDay">
          Nghỉ cả ngày
        </label>
        <template v-if="!exceptionForm.fullDay">
          <div>
            <label style="display:block;font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">Từ</label>
            <input type="time" v-model="exceptionForm.startTime" style="padding:7px 10px;border:1.5px solid var(--kraft-light);border-radius:8px;font:inherit;">
          </div>
          <div>
            <label style="display:block;font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">Đến</label>
            <input type="time" v-model="exceptionForm.endTime" style="padding:7px 10px;border:1.5px solid var(--kraft-light);border-radius:8px;font:inherit;">
          </div>
        </template>
        <div style="flex:1;min-width:160px;">
          <label style="display:block;font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">Lý do (tuỳ chọn)</label>
          <input type="text" v-model="exceptionForm.reason" maxlength="200" placeholder="VD: Nghỉ lễ, việc riêng..." style="width:100%;box-sizing:border-box;padding:7px 10px;border:1.5px solid var(--kraft-light);border-radius:8px;font:inherit;">
        </div>
        <button type="button" class="btn-primary" :disabled="addingException" @click="addAvailabilityException">Thêm</button>
      </div>
      <div v-if="exceptionError" style="color:var(--coral);font-size:0.82rem;margin-bottom:10px;">{{ exceptionError }}</div>
      <div v-if="!availabilityExceptions.length" style="color:var(--text-secondary);font-size:0.85rem;">Chưa có ngày ngoại lệ nào sắp tới.</div>
      <div v-else style="display:flex;flex-direction:column;gap:8px;">
        <div v-for="ex in availabilityExceptions" :key="ex.id" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;background:var(--cream);border:1px solid var(--kraft-light);border-radius:10px;font-size:0.84rem;">
          <div><strong>{{ formatExceptionDate(ex.date) }}</strong> · {{ ex.start_time }}–{{ ex.end_time }}{{ ex.reason ? ` · ${ex.reason}` : '' }}</div>
          <button type="button" style="border:none;background:none;color:var(--coral);cursor:pointer;font-size:0.8rem;" @click="removeAvailabilityException(ex.id)">✕ Xoá</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../../lib/apiClient';
import { useExpertPortalStore } from '../../stores/expertPortal';
import { useNotificationsStore } from '../../stores/notifications';
import MedicalRecordsViewer from '../../components/MedicalRecordsViewer.vue';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';

const SESSION_TYPE_LABELS = { chat: 'Chat', voice: 'Gọi thoại', video: 'Video', inperson: 'Trực tiếp' };
const BOOKING_STATUS_LABELS = { pending: 'Chờ xác nhận', confirmed: 'Sắp tới', completed: 'Đã hoàn thành', cancelled: 'Đã hủy' };
const BOOKING_TABS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'completed', label: 'Đã hoàn thành' }
];
const STATUSES = [
  { key: 'online', label: 'Online', hint: 'Sẵn sàng nhận lịch' },
  { key: 'busy', label: 'Bận', hint: 'Tạm không nhận lịch mới' },
  { key: 'offline', label: 'Offline', hint: 'Không hoạt động' }
];
const STATUS_LABELS = { online: 'Online', busy: 'Bận', offline: 'Offline' };
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const AVAILABILITY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const AVAILABILITY_DAY_LABELS = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
const AVAILABILITY_START_HOUR = 8;
const AVAILABILITY_END_HOUR = 21;
const AVAILABILITY_SLOT_MINUTES = 60;

function money(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0));
}
function formatDateTime(value) {
  if (!value) return 'Chưa có lịch';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function timeToMinutes(value) {
  const [hours, minutes] = String(value || '00:00').split(':').map((part) => Number(part) || 0);
  return (hours * 60) + minutes;
}
function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, '0');
  const minutes = String(value % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}
function availabilityCellKey(weekday, startMinutes) {
  return `${weekday}-${minutesToTime(startMinutes)}`;
}
function getAvailabilityCells() {
  const cells = [];
  for (let weekday = 0; weekday < WEEKDAYS.length; weekday += 1) {
    for (let startMinutes = AVAILABILITY_START_HOUR * 60; startMinutes < AVAILABILITY_END_HOUR * 60; startMinutes += AVAILABILITY_SLOT_MINUTES) {
      cells.push({ weekday, startMinutes, endMinutes: startMinutes + AVAILABILITY_SLOT_MINUTES, key: availabilityCellKey(weekday, startMinutes) });
    }
  }
  return cells;
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function isToday(value) {
  if (!value) return false;
  const d = new Date(value);
  const today = startOfToday();
  const tomorrow = new Date(today.getTime() + 86400000);
  return d >= today && d < tomorrow;
}
function isThisWeek(value) {
  if (!value) return false;
  const d = new Date(value);
  const today = startOfToday();
  const weekday = (today.getDay() + 6) % 7;
  const monday = new Date(today.getTime() - weekday * 86400000);
  const nextMonday = new Date(monday.getTime() + 7 * 86400000);
  return d >= monday && d < nextMonday;
}

const router = useRouter();
const expertPortal = useExpertPortalStore();
const notif = useNotificationsStore();

const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

const hasProfile = ref(false);
const profile = ref(null);
const pageTitle = ref('Bảng điều khiển chuyên gia');
const avatarInitials = ref('EX');

const ratingText = computed(() => (Number(profile.value?.rating) > 0 ? Number(profile.value.rating).toFixed(1) : '—'));
const priceText = computed(() => (profile.value && Number(profile.value.base_price) > 0 ? money(profile.value.base_price) : 'Chưa đặt giá'));

const currentStatus = ref('offline');
const statusMenuOpen = ref(false);
const statusDropdownEl = ref(null);
function handleOutsideClick(event) {
  if (statusMenuOpen.value && statusDropdownEl.value && !statusDropdownEl.value.contains(event.target)) {
    statusMenuOpen.value = false;
  }
}
onMounted(() => document.addEventListener('click', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick));

async function changeStatus(status) {
  statusMenuOpen.value = false;
  try {
    await apiClient.patch('/expert-portal/status', { status });
    currentStatus.value = status;
    setBanner('Đã cập nhật trạng thái hoạt động.', 'success');
  } catch (error) {
    setBanner(error.message || 'Không thể cập nhật trạng thái.', 'error');
  }
}

const bookings = ref([]);
const bookingsLoading = ref(false);
const bookingsError = ref(false);
const activeTab = ref('today');

function bookingsForTab(items, tab) {
  if (tab === 'completed') return items.filter((b) => b.status === 'completed');
  if (tab === 'upcoming') return items.filter((b) => b.status === 'confirmed' && !isToday(b.starts_at));
  return items.filter((b) => b.status === 'confirmed' && isToday(b.starts_at));
}
const tabCounts = computed(() => ({
  today: bookingsForTab(bookings.value, 'today').length,
  upcoming: bookingsForTab(bookings.value, 'upcoming').length,
  completed: bookingsForTab(bookings.value, 'completed').length
}));
const filteredBookings = computed(() => bookingsForTab(bookings.value, activeTab.value));
const pendingBookings = computed(() => bookings.value.filter((b) => b.status === 'awaiting_expert'));

const kpiCards = computed(() => {
  const todayCount = bookings.value.filter((b) => b.status === 'confirmed' && isToday(b.starts_at)).length;
  const pendingCount = pendingBookings.value.length;
  const weekIncome = bookings.value
    .filter((b) => b.status === 'completed' && isThisWeek(b.starts_at))
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  return [
    { icon: '🗓️', label: 'Hôm nay', value: `${todayCount} buổi`, hint: todayCount ? 'Đã xác nhận' : 'Chưa có lịch', tone: 'today' },
    { icon: '⏳', label: 'Chờ bạn nhận', value: String(pendingCount), hint: pendingCount ? 'Đã thanh toán' : 'Không có', tone: pendingCount ? 'alert' : 'today' },
    { icon: '💰', label: 'Thu nhập tuần', value: money(weekIncome), hint: 'Từ buổi đã hoàn thành', tone: 'income' }
  ];
});

const emptyState = computed(() => {
  const map = {
    today: { title: 'Hôm nay chưa có lịch', text: 'Các buổi đã xác nhận diễn ra trong hôm nay sẽ hiển thị tại đây.' },
    upcoming: { title: 'Chưa có lịch sắp tới', text: 'Các buổi đã xác nhận cho những ngày tới sẽ hiển thị tại đây.' },
    completed: { title: 'Chưa có phiên hoàn thành', text: 'Các buổi tư vấn đã kết thúc sẽ được lưu trữ tại đây kèm ghi chú và đánh giá từ thân chủ.' }
  };
  return map[activeTab.value] || map.today;
});

function rowActions(booking) {
  if (booking.status === 'pending') return [{ status: 'confirmed', label: 'Xác nhận', variant: 'primary' }, { status: 'cancelled', label: 'Từ chối', variant: 'ghost' }];
  if (booking.status === 'confirmed') return [{ status: 'completed', label: 'Hoàn thành', variant: 'primary' }, { status: 'cancelled', label: 'Hủy', variant: 'ghost' }];
  return [];
}

async function loadBookingManagement() {
  bookingsLoading.value = true;
  bookingsError.value = false;
  try {
    const data = await apiClient.get('/expert-portal/bookings', { noCache: true });
    bookings.value = Array.isArray(data) ? data : [];
  } catch (_error) {
    bookings.value = [];
    bookingsError.value = true;
  } finally {
    bookingsLoading.value = false;
  }
}

async function updateBooking(id, status) {
  try {
    await apiClient.patch(`/expert-portal/bookings/${id}`, { status });
    setBanner('Đã cập nhật lịch hẹn.', 'success');
    loadBookingManagement();
  } catch (error) {
    setBanner(error.message || 'Không thể cập nhật lịch hẹn.', 'error');
  }
}

const earnings = ref(null);
const earningsError = ref(false);
async function loadEarnings() {
  earningsError.value = false;
  try {
    earnings.value = await apiClient.get('/expert-portal/earnings', { noCache: true });
  } catch (_error) {
    earnings.value = null;
    earningsError.value = true;
  }
}

// availabilityActive = tập hợp các ô RẢNH mà chuyên gia đã bấm chọn (đổi hướng UX: bấm để
// chọn rảnh thay vì chọn bận). Backend/expert_availability vẫn lưu khung giờ BẬN như cũ (dùng
// ở nhiều chỗ: chặn đặt lịch, tính slot trống...) — nên khi tải lên/lưu xuống phải lấy PHẦN BÙ.
const availabilityActive = ref(new Set());
const availabilityRows = computed(() => {
  const rows = [];
  for (let startMinutes = AVAILABILITY_START_HOUR * 60; startMinutes < AVAILABILITY_END_HOUR * 60; startMinutes += AVAILABILITY_SLOT_MINUTES) {
    const label = `${minutesToTime(startMinutes)} - ${minutesToTime(startMinutes + AVAILABILITY_SLOT_MINUTES)}`;
    const cells = AVAILABILITY_DAY_ORDER.map((weekday) => {
      const key = availabilityCellKey(weekday, startMinutes);
      return { key, weekday, free: availabilityActive.value.has(key) };
    });
    rows.push({ startMinutes, label, cells });
  }
  return rows;
});
const freeCellsCount = computed(() => availabilityActive.value.size);
const busyCellsCount = computed(() => Math.max(0, getAvailabilityCells().length - freeCellsCount.value));

function toggleAvailabilityCell(key) {
  const next = new Set(availabilityActive.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  availabilityActive.value = next;
}

// slots tải về là khung giờ BẬN (đúng như backend lưu) — chuyển thành tập RẢNH = phần bù,
// để chuyên gia mới (chưa lưu gì, slots rỗng) thấy đúng thực tế hiện tại: toàn bộ đều rảnh.
function buildAvailabilityState(slots) {
  const allCells = getAvailabilityCells();
  const busy = new Set();
  if (Array.isArray(slots) && slots.length > 0) {
    slots.forEach((slot) => {
      const weekday = Number(slot.weekday);
      const start = timeToMinutes(slot.start_time);
      const end = timeToMinutes(slot.end_time);
      allCells.forEach((cell) => {
        if (cell.weekday !== weekday) return;
        if (cell.startMinutes >= start && cell.endMinutes <= end) busy.add(cell.key);
      });
    });
  }
  const free = new Set();
  allCells.forEach((cell) => {
    if (!busy.has(cell.key)) free.add(cell.key);
  });
  return free;
}

const savingAvailability = ref(false);
async function loadAvailabilityEditor() {
  try {
    const slots = await apiClient.get('/expert-portal/availability', { noCache: true });
    availabilityActive.value = buildAvailabilityState(Array.isArray(slots) ? slots : []);
  } catch (_error) {
    availabilityActive.value = buildAvailabilityState([]);
  }
}

// Gửi backend đúng hợp đồng cũ (khung giờ BẬN) = phần bù của tập RẢNH đang chọn trên UI.
function buildAvailabilityPayload() {
  const busyCells = getAvailabilityCells()
    .filter((cell) => !availabilityActive.value.has(cell.key))
    .sort((a, b) => (a.weekday - b.weekday) || (a.startMinutes - b.startMinutes));

  const merged = [];
  busyCells.forEach((cell) => {
    const last = merged[merged.length - 1];
    if (last && last.weekday === cell.weekday && last.endMinutes === cell.startMinutes) {
      last.endMinutes = cell.endMinutes;
      return;
    }
    merged.push({ weekday: cell.weekday, startMinutes: cell.startMinutes, endMinutes: cell.endMinutes });
  });

  return merged.map((slot) => ({ weekday: slot.weekday, start_time: minutesToTime(slot.startMinutes), end_time: minutesToTime(slot.endMinutes) }));
}

async function saveAvailability() {
  savingAvailability.value = true;
  try {
    await apiClient.put('/expert-portal/availability', { slots: buildAvailabilityPayload() });
    setBanner('Đã lưu lịch làm việc.', 'success');
    await loadAvailabilityEditor();
  } catch (error) {
    setBanner(error.message || 'Không thể lưu lịch rảnh.', 'error');
  } finally {
    savingAvailability.value = false;
  }
}

const todayIso = new Date().toISOString().slice(0, 10);
const availabilityExceptions = ref([]);
const exceptionForm = reactive({ date: '', fullDay: false, startTime: '09:00', endTime: '17:00', reason: '' });
const addingException = ref(false);
const exceptionError = ref('');

function formatExceptionDate(iso) {
  try {
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
  } catch (_e) {
    return iso;
  }
}

async function loadAvailabilityExceptions() {
  try {
    const data = await apiClient.get('/expert-portal/availability-exceptions', { noCache: true });
    availabilityExceptions.value = Array.isArray(data) ? data : [];
  } catch (_error) {
    availabilityExceptions.value = [];
  }
}

async function addAvailabilityException() {
  exceptionError.value = '';
  if (!exceptionForm.date) {
    exceptionError.value = 'Chọn ngày trước.';
    return;
  }
  if (!exceptionForm.fullDay && (!exceptionForm.startTime || !exceptionForm.endTime || exceptionForm.endTime <= exceptionForm.startTime)) {
    exceptionError.value = 'Khung giờ không hợp lệ.';
    return;
  }
  addingException.value = true;
  try {
    await apiClient.post('/expert-portal/availability-exceptions', {
      date: exceptionForm.date,
      full_day: exceptionForm.fullDay,
      start_time: exceptionForm.fullDay ? undefined : exceptionForm.startTime,
      end_time: exceptionForm.fullDay ? undefined : exceptionForm.endTime,
      reason: exceptionForm.reason.trim() || undefined
    });
    exceptionForm.date = '';
    exceptionForm.reason = '';
    await loadAvailabilityExceptions();
  } catch (error) {
    exceptionError.value = error.message || 'Không thêm được ngoại lệ.';
  } finally {
    addingException.value = false;
  }
}

async function removeAvailabilityException(id) {
  try {
    await apiClient.delete(`/expert-portal/availability-exceptions/${id}`);
    await loadAvailabilityExceptions();
  } catch (error) {
    exceptionError.value = error.message || 'Không xoá được.';
  }
}

function renderDashboard(applicationState, overview) {
  const appStatus = applicationState?.application?.status || 'draft';
  profile.value = overview?.expert || null;

  const name = profile.value?.full_name || 'chuyên gia';
  pageTitle.value = `Xin chào, ${name} 👋`;
  avatarInitials.value = (profile.value?.full_name || 'Expert').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || 'EX';

  if (!applicationState?.email_verified) {
    setBanner('Bạn cần xác minh email trước khi tiếp tục dùng khu vực chuyên gia.', 'info');
  } else if (appStatus === 'pending') {
    setBanner('Hồ sơ của bạn đang chờ admin duyệt.', 'info');
  } else if (appStatus === 'rejected') {
    setBanner('Hồ sơ gần nhất chưa được duyệt. Bạn có thể cập nhật và gửi lại trong mục Hồ sơ chuyên gia.', 'error');
  } else if (!profile.value) {
    setBanner('Bạn chưa gửi hồ sơ chuyên gia. Hãy hoàn tất hồ sơ để mở quyền chuyên gia đầy đủ.', 'info');
  } else {
    setBanner('', 'info');
  }
}

function setupExpertOperations(overview) {
  hasProfile.value = Boolean(overview?.expert);
  if (!hasProfile.value) return;

  currentStatus.value = overview.expert.status || 'offline';
  loadBookingManagement();
  loadAvailabilityEditor();
  loadAvailabilityExceptions();
  loadEarnings();
}

function handleBookingChanged() {
  loadBookingManagement();
}
onMounted(() => window.addEventListener('peaceflow:booking-changed', handleBookingChanged));
onBeforeUnmount(() => window.removeEventListener('peaceflow:booking-changed', handleBookingChanged));

onMounted(async () => {
  try {
    const { application, overview } = await expertPortal.load();
    if (!overview?.expert) {
      router.replace('/expert-apply');
      return;
    }
    renderDashboard(application, overview);
    setupExpertOperations(overview);
  } catch (error) {
    console.error('Expert dashboard load failed:', error);
    setBanner('Không thể tải dữ liệu chuyên gia lúc này.', 'error');
  }
});
</script>

<style scoped src="../../assets/expertDashboard.css"></style>
