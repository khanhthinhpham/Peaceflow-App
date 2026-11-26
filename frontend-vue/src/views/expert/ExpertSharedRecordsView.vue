<template>
  <main class="expert-main expert-dashboard-main">
    <header class="expert-topbar expert-dashboard-topbar">
      <div class="expert-topbar-copy">
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Hồ sơ thân chủ</h1>
        <p class="expert-page-subtitle">Nhật ký, check-in tâm trạng và kết quả test của thân chủ. Thân chủ đã đặt lịch và bật chia sẻ thì dữ liệu tự cập nhật; thân chủ chưa đặt lịch thì là những gì họ chủ động gửi cho bạn.</p>
      </div>
      <div class="expert-topbar-tools">
        <button type="button" class="expert-bell-btn" data-notif-bell aria-label="Thông báo" @click="notif.togglePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span class="expert-bell-badge" :style="{ display: notif.unread > 0 ? 'flex' : 'none' }">{{ Math.min(notif.unread, 9) }}</span>
        </button>
      </div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <!-- Danh sách & chi tiết dùng CHUNG khu vực nội dung chính (không che sidebar/topbar của
         ExpertLayout nữa — trước đây .sr-fullscreen dùng position:fixed; inset:0 nên phủ
         luôn cả sidebar, khiến bấm vào 1 hồ sơ là mất hết điều hướng). Chỉ ẩn/hiện qua lại
         giữa 2 section, vẫn nằm trong <main> như mọi trang khác trong Expert Portal. -->
    <!-- Danh sách theo TỪNG THÂN CHỦ (không còn theo từng lần gửi), chia 2 nhóm: đã đặt lịch
         (dữ liệu tự cập nhật khi thân chủ bật chia sẻ) và chưa đặt lịch (chỉ những gì họ gửi). -->
    <section v-if="!showDetail" class="expert-panel expert-section">
      <div class="sr-list-body">
        <p v-if="loading" class="ca-empty">Đang tải...</p>
        <p v-else-if="loadError" class="ca-empty">Không tải được danh sách thân chủ.</p>
        <p v-else-if="!clients.length" class="ca-empty">Chưa có thân chủ nào đặt lịch hoặc gửi hồ sơ cho bạn.</p>
        <template v-else>
          <div v-for="group in clientGroups" :key="group.key" class="sr-group">
            <h2 class="expert-section-title sr-group-title">{{ group.title }} <span class="sr-tab-count">{{ group.items.length }}</span></h2>
            <p class="expert-section-copy sr-group-copy">{{ group.copy }}</p>
            <p v-if="!group.items.length" class="ca-empty">{{ group.empty }}</p>
            <div v-for="c in group.items" :key="c.client_id" class="sr-list-row" @click="openDetail(c)">
              <div class="sr-list-main">
                <div class="ca-selftest-name">{{ c.client_name }}</div>
                <div class="ca-selftest-meta">
                  {{ c.email || '' }}
                  <template v-if="c.booked"> · Lịch gần nhất {{ formatDateTime(c.last_booking_at) }}</template>
                  <template v-if="c.record_count"> · Gửi hồ sơ gần nhất {{ formatDateTime(c.last_sent_at) }}</template>
                </div>
              </div>
              <div class="sr-list-meta">
                <span v-if="c.booked" class="mb-badge" :style="sharedLabel(c) ? { color: 'var(--mint-dark)', background: 'var(--mint-light)' } : { color: 'var(--text-secondary)', background: 'var(--cream)' }">{{ sharedLabel(c) ? `Tự cập nhật: ${sharedLabel(c)}` : 'Chưa bật chia sẻ' }}</span>
                <span v-if="c.record_count" class="ca-selftest-meta">Đã gửi {{ c.record_count }} lần · {{ c.response_count > 0 ? `${c.response_count} phản hồi` : 'chưa phản hồi' }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <section v-else class="expert-panel expert-section sr-detail-panel">
      <div class="ca-detail-head">
        <div>
          <div class="ca-detail-title">{{ detailRecord?.clientName || '...' }}</div>
          <div class="ca-detail-meta" v-if="detailRecord">{{ detailMeta }}</div>
        </div>
        <button type="button" class="ca-detail-close" @click="closeDetail">✕ Quay lại danh sách</button>
      </div>

      <p v-if="detailLoading" class="ca-empty">Đang tải...</p>
      <template v-else-if="detailRecord">
        <div v-if="detailRecord.revokedCount" class="sr-revoked-banner">⚠️ Thân chủ đã thu hồi {{ detailRecord.revokedCount }} lần gửi hồ sơ; nội dung các lần đó không hiện ở đây.</div>

        <!-- 2 cột: trái 2/3 là tổng quan (biểu đồ tâm trạng + lịch gộp), phải 1/3 là tab lọc
             chi tiết từng loại (như bản cũ trước khi có lịch) — xem đủ cả 2 kiểu cùng lúc. -->
        <div class="sr-detail-columns">
          <div class="sr-detail-col-left">
            <!-- Biểu đồ xu hướng tâm trạng — khác bản chất với lịch (đường theo thời gian
                 thay vì xem theo từng ngày rời rạc) nên giữ riêng, không gộp vào lịch. -->
            <ExpertMoodChart v-if="detailRecord.moodCheckins?.length" :checkins="detailRecord.moodCheckins" />

            <!-- Toàn bộ dữ liệu gộp vào 1 lịch, mỗi loại 1 màu chấm riêng — bấm vào ngày có
                 dữ liệu để xem nhanh đúng ngày đó. -->
            <ExpertRecordsCalendar
              :bookings="detailRecord.bookings || []"
              :journal-entries="detailRecord.journalEntries || []"
              :mood-checkins="detailRecord.moodCheckins || []"
              :assessment-results="detailRecord.assessmentResults || []"
              :responses="detailRecord.responses || []"
            />
          </div>

          <div class="sr-detail-col-right">
            <!-- Dropdown lọc nội bộ: tách từng loại thông tin ra, thay vì dồn hết xuống 1
                 trang dài phải cuộn qua nhiều mục không liên quan tới nhau. -->
            <div class="sr-tab-filter-wrap">
              <button type="button" class="sr-tab-filter-btn" data-sr-tab-filter-btn @click="tabFilterOpen = !tabFilterOpen">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {{ activeTabInfo.label }}
                <span v-if="activeTabInfo.count !== null" class="sr-tab-count">{{ activeTabInfo.count }}</span>
                <span class="sr-tab-filter-caret">▾</span>
              </button>
              <div v-if="tabFilterOpen" ref="tabFilterDropdownEl" class="sr-tab-filter-menu">
                <button
                  v-for="tab in detailTabs"
                  :key="tab.key"
                  type="button"
                  class="sr-tab-filter-item"
                  :class="{ active: detailTab === tab.key }"
                  @click="detailTab = tab.key; tabFilterOpen = false"
                >{{ tab.label }}<span v-if="tab.count !== null" class="sr-tab-count">{{ tab.count }}</span></button>
              </div>
            </div>

            <!-- Lịch hẹn & mô tả tình trạng: mỗi lịch gọn 1 dòng, bấm vào mới mở ra xem mô
                 tả + hồ sơ khám — tránh dồn 5-10 lịch cũ/huỷ/hết hạn đập thẳng vào mắt. -->
            <div v-show="detailTab === 'bookings'" class="sr-detail-section">
              <p v-if="!detailRecord.bookings?.length" class="ca-empty">Thân chủ chưa từng đặt lịch với bạn.</p>

              <template v-if="detailRecord.bookings?.length">
                <p v-if="!activeBookings.length" class="ca-empty" style="margin-bottom:10px;">Không có lịch hẹn nào đang hoạt động.</p>
                <div v-for="b in activeBookings" :key="b.id" class="sr-booking-row">
                  <button type="button" class="sr-booking-summary" @click="toggleBookingOpen(b.id)">
                    <span class="sr-booking-status-dot" :class="`is-${b.status}`"></span>
                    <span class="sr-booking-summary-main">
                      <strong>Hồ sơ cuộc gọi ngày {{ formatDate(b.starts_at) }}</strong>
                      <span class="ca-selftest-meta">{{ formatTime(b.starts_at) }} · {{ BOOKING_STATUS_LABELS[b.status] || b.status }}</span>
                    </span>
                    <span class="sr-booking-caret" :class="{ open: openBookingIds.has(b.id) }">▾</span>
                  </button>
                  <div v-if="openBookingIds.has(b.id)" class="sr-booking-detail">
                    <p v-if="b.notes" class="sr-detail-content">{{ b.notes }}</p>
                    <p v-else class="sr-detail-content" style="color:var(--text-light);">Thân chủ chưa để lại mô tả tình trạng.</p>
                    <MedicalRecordsViewer :booking-id="b.id" />
                  </div>
                </div>

                <!-- Lịch sử (đã xong/huỷ/hết hạn) gộp vào 1 khối đóng sẵn. -->
                <div v-if="historyBookings.length" class="sr-booking-history">
                  <button type="button" class="sr-booking-history-toggle" @click="historyOpen = !historyOpen">
                    <span>🗂️ Lịch sử ({{ historyBookings.length }})</span>
                    <span class="sr-booking-caret" :class="{ open: historyOpen }">▾</span>
                  </button>
                  <div v-if="historyOpen" class="sr-booking-history-body">
                    <div v-for="b in historyBookings" :key="b.id" class="sr-booking-row is-history">
                      <button type="button" class="sr-booking-summary" @click="toggleBookingOpen(b.id)">
                        <span class="sr-booking-status-dot" :class="`is-${b.status}`"></span>
                        <span class="sr-booking-summary-main">
                          <strong>Hồ sơ cuộc gọi ngày {{ formatDate(b.starts_at) }}</strong>
                          <span class="ca-selftest-meta">{{ formatTime(b.starts_at) }} · {{ BOOKING_STATUS_LABELS[b.status] || b.status }}</span>
                        </span>
                        <span class="sr-booking-caret" :class="{ open: openBookingIds.has(b.id) }">▾</span>
                      </button>
                      <div v-if="openBookingIds.has(b.id)" class="sr-booking-detail">
                        <p v-if="b.notes" class="sr-detail-content">{{ b.notes }}</p>
                        <p v-else class="sr-detail-content" style="color:var(--text-light);">Thân chủ chưa để lại mô tả tình trạng.</p>
                        <MedicalRecordsViewer :booking-id="b.id" />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div v-show="detailTab === 'journal'" class="sr-detail-section">
              <p v-if="!detailRecord.journalEntries?.length" class="ca-empty">{{ emptyText('journal', 'nhật ký') }}</p>
              <div v-for="j in detailRecord.journalEntries" :key="j.id" class="sr-detail-item">
                <div class="ca-selftest-name">{{ j.title || '(Không có tiêu đề)' }}</div>
                <div class="ca-selftest-meta">{{ formatDateTime(j.created_at) }}{{ j.fromRecord ? ' · từ hồ sơ gửi' : '' }}</div>
                <p class="sr-detail-content">{{ j.content }}</p>
              </div>
            </div>

            <div v-show="detailTab === 'mood'" class="sr-detail-section">
              <p v-if="!detailRecord.moodCheckins?.length" class="ca-empty">{{ emptyText('mood', 'check-in') }}</p>
              <div v-for="m in detailRecord.moodCheckins" :key="m.id" class="sr-detail-item">
                <div class="ca-selftest-name">{{ m.dominant_emotion || '—' }} ({{ m.mood_score }}/10)</div>
                <div class="ca-selftest-meta">{{ formatDateTime(m.created_at) }}{{ m.fromRecord ? ' · từ hồ sơ gửi' : '' }}</div>
                <p v-if="m.notes" class="sr-detail-content">{{ m.notes }}</p>
              </div>
            </div>

            <div v-show="detailTab === 'tests'" class="sr-detail-section">
              <p v-if="!detailRecord.assessmentResults?.length" class="ca-empty">{{ emptyText('assessments', 'kết quả bài test') }}</p>
              <div v-for="a in detailRecord.assessmentResults" :key="a.id" class="sr-detail-item">
                <div class="ca-selftest-name">{{ a.assessment_name }} — {{ a.severity || '—' }} ({{ a.total_score }})</div>
                <div class="ca-selftest-meta">{{ formatDateTime(a.created_at) }}{{ a.fromRecord ? ' · từ hồ sơ gửi' : '' }}</div>
              </div>
            </div>

          </div>
        </div>

        <!-- Phản hồi đứng RIÊNG, không nằm trong dropdown tab — đây là trao đổi trực tiếp
             với thân chủ, bác sĩ cần thấy/gửi được ngay, không phải chọn đúng tab mới thấy. -->
        <div class="sr-response-section">
          <h3 class="sr-response-title">💬 Phản hồi cho thân chủ</h3>
          <p v-if="!detailRecord.records.length" class="ca-empty">Thân chủ chưa gửi hồ sơ nào nên chưa có chỗ phản hồi ở đây — trao đổi với thân chủ qua mục Tin nhắn.</p>
          <p v-else-if="!detailRecord.responses.length" class="ca-empty">Bạn chưa phản hồi hồ sơ của thân chủ này.</p>
          <div v-for="resp in detailRecord.responses" :key="resp.id" class="sr-response-bubble">
            <div>{{ resp.content }}</div>
            <div class="ca-selftest-meta">{{ formatDateTime(resp.created_at) }}</div>
          </div>

          <div v-if="detailRecord.records.length" class="sr-reply-box">
            <textarea v-model="replyText" class="form-input sr-reply-textarea" placeholder="Nhập phản hồi hoặc phương án/đơn thuốc cho thân chủ..."></textarea>
            <p v-if="replyError" style="color:var(--coral);font-size:0.85rem;margin:4px 0 0;">{{ replyError }}</p>
            <button type="button" class="ca-export-btn" style="margin-top:8px;" :disabled="sendingReply" @click="submitReply">{{ sendingReply ? 'Đang gửi...' : '💬 Gửi phản hồi' }}</button>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { useNotificationsStore } from '../../stores/notifications';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';
import ExpertRecordsCalendar from '../../components/ExpertRecordsCalendar.vue';
import ExpertMoodChart from '../../components/ExpertMoodChart.vue';
import MedicalRecordsViewer from '../../components/MedicalRecordsViewer.vue';

const notif = useNotificationsStore();
const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

function formatDateTime(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function formatDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
}
function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(value));
}

// Giữ đúng nhãn như ExpertDashboardView.vue để nhất quán xuyên suốt expert portal.
const BOOKING_STATUS_LABELS = {
  awaiting_expert: 'Chờ bạn nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã huỷ',
  expired: 'Đã hết hạn'
};

// Danh sách THÂN CHỦ (GET /expert-portal/client-records), chia 2 nhóm: đã đặt lịch / chưa đặt lịch.
const clients = ref([]);
const loading = ref(false);
const loadError = ref(false);
const clientGroups = computed(() => [
  {
    key: 'booked',
    title: '📅 Đã đặt lịch với bạn',
    copy: 'Thân chủ có lịch hẹn đã xác nhận/hoàn thành. Mục nào thân chủ bật chia sẻ thì tự cập nhật, không cần gửi lại.',
    empty: 'Chưa có thân chủ nào đặt lịch với bạn.',
    items: clients.value.filter((c) => c.booked)
  },
  {
    key: 'sent-only',
    title: '📨 Chưa đặt lịch — chỉ gửi hồ sơ',
    copy: 'Thân chủ chủ động gửi hồ sơ cho bạn nhưng chưa có lịch hẹn. Chỉ xem được những gì họ đã gửi.',
    empty: 'Không có thân chủ nào ở nhóm này.',
    items: clients.value.filter((c) => !c.booked)
  }
]);
function sharedLabel(c) {
  return [c.share_journal && 'nhật ký', c.share_mood && 'check-in', c.share_assessments && 'bài test'].filter(Boolean).join(', ');
}

async function loadClients() {
  loading.value = true;
  loadError.value = false;
  try {
    clients.value = (await apiClient.get('/expert-portal/client-records', { noCache: true })) || [];
  } catch (_error) {
    clients.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

const showDetail = ref(false);
const detailLoading = ref(false);
const detailRecord = ref(null);
const replyText = ref('');
const replyError = ref('');
const sendingReply = ref(false);

// Tab lọc chi tiết ở cột phải — mặc định mở "Lịch hẹn" vì đó là thứ bác sĩ cần xem đầu
// tiên trước buổi hẹn, các mục còn lại xem khi cần.
const detailTab = ref('bookings');
const openBookingIds = ref(new Set());
function toggleBookingOpen(id) {
  const next = new Set(openBookingIds.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  openBookingIds.value = next;
}

// Lịch "đang hoạt động" (chờ nhận/đã xác nhận) nổi bật lên trên; lịch đã xong/huỷ/hết hạn
// gộp vào khối "Lịch sử" đóng sẵn — tránh 5-10 dòng cũ đè lên lịch còn liên quan.
const HISTORY_STATUSES = new Set(['completed', 'cancelled', 'expired']);
const activeBookings = computed(() => (detailRecord.value?.bookings || []).filter((b) => !HISTORY_STATUSES.has(b.status)));
const historyBookings = computed(() => (detailRecord.value?.bookings || []).filter((b) => HISTORY_STATUSES.has(b.status)));
const historyOpen = ref(false);
const detailTabs = computed(() => [
  { key: 'bookings', label: '📅 Lịch hẹn', count: detailRecord.value?.bookings?.length ?? null },
  { key: 'journal', label: '📔 Nhật ký', count: detailRecord.value?.journalEntries?.length ?? null },
  { key: 'mood', label: '🌤️ Check-in', count: detailRecord.value?.moodCheckins?.length ?? null },
  { key: 'tests', label: '🩺 Kết quả test', count: detailRecord.value?.assessmentResults?.length ?? null }
]);
const activeTabInfo = computed(() => detailTabs.value.find((tab) => tab.key === detailTab.value) || detailTabs.value[0]);

const detailMeta = computed(() => {
  const d = detailRecord.value;
  if (!d) return '';
  if (!d.booked) return `Chưa đặt lịch với bạn · dữ liệu từ ${d.records.length} lần gửi hồ sơ`;
  const on = [d.live.journal && 'nhật ký', d.live.mood && 'check-in', d.live.assessments && 'bài test'].filter(Boolean);
  return on.length ? `Đã đặt lịch · tự cập nhật: ${on.join(', ')}` : 'Đã đặt lịch · thân chủ chưa bật chia sẻ mục nào';
});
function emptyText(kind, noun) {
  const d = detailRecord.value;
  if (d?.booked && !d.live[kind]) return `Thân chủ chưa bật chia sẻ ${noun} với bạn.`;
  return `Chưa có ${noun} nào.`;
}

const tabFilterOpen = ref(false);
const tabFilterDropdownEl = ref(null);
function handleTabFilterOutsideClick(event) {
  if (!tabFilterOpen.value) return;
  if (tabFilterDropdownEl.value && tabFilterDropdownEl.value.contains(event.target)) return;
  if (event.target.closest('[data-sr-tab-filter-btn]')) return;
  tabFilterOpen.value = false;
}
onMounted(() => document.addEventListener('click', handleTabFilterOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', handleTabFilterOutsideClick));

async function openDetail(client) {
  showDetail.value = true;
  detailLoading.value = true;
  detailRecord.value = null;
  detailTab.value = 'bookings';
  tabFilterOpen.value = false;
  openBookingIds.value = new Set();
  historyOpen.value = false;
  replyText.value = '';
  replyError.value = '';
  try {
    detailRecord.value = await apiClient.get(`/expert-portal/client-records/${client.client_id}`, { noCache: true });
    // Chỉ 1 lịch hẹn: mở sẵn luôn cho khỏi phải bấm thêm 1 lần.
    if (detailRecord.value?.bookings?.length === 1) {
      openBookingIds.value = new Set([detailRecord.value.bookings[0].id]);
    }
  } catch (_error) {
    setBanner('Không tải được chi tiết hồ sơ.', 'error');
    showDetail.value = false;
  } finally {
    detailLoading.value = false;
  }
}
function closeDetail() {
  showDetail.value = false;
  detailRecord.value = null;
}

async function submitReply() {
  const content = replyText.value.trim();
  if (!content) {
    replyError.value = 'Vui lòng nhập nội dung phản hồi.';
    return;
  }
  sendingReply.value = true;
  replyError.value = '';
  try {
    const latest = detailRecord.value.records[0];
    const inserted = await apiClient.post(`/shared-records/${latest.id}/responses`, { content });
    detailRecord.value.responses.push({ id: inserted.id, shared_record_id: latest.id, content, created_at: inserted.created_at });
    replyText.value = '';
    const listed = clients.value.find((c) => c.client_id === detailRecord.value.clientId);
    if (listed) listed.response_count = (listed.response_count || 0) + 1;
    setBanner('Đã gửi phản hồi cho thân chủ.', 'success');
  } catch (error) {
    replyError.value = error.message || 'Không gửi được phản hồi.';
  } finally {
    sendingReply.value = false;
  }
}

onMounted(loadClients);
</script>

<style scoped src="../../assets/expertDashboard.css"></style>
<style scoped src="../../assets/clientAssessments.css"></style>
<style scoped>
.sr-list-body {
    padding: 18px 24px 24px;
}
.sr-group + .sr-group {
    margin-top: 26px;
    padding-top: 20px;
    border-top: 1.5px dashed var(--kraft-light, #e8cba7);
}
.sr-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
}
.sr-group-title .sr-tab-count { margin-left: 0; }
.sr-group-copy {
    margin: 4px 0 8px;
}
.sr-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px dashed var(--kraft-light, #e8cba7);
    cursor: pointer;
}
.sr-list-row:last-child { border-bottom: none; }
.sr-list-row:hover { background: var(--cream, #fff8f0); border-radius: 10px; }
.sr-list-main { min-width: 0; }
.sr-list-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
}
.sr-revoked-banner {
    background: var(--coral-light);
    color: var(--coral-dark);
    font-weight: 600;
    font-size: 0.85rem;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 14px;
}
/* Khung chi tiết đứng NGAY TRONG <main> (cùng khu vực với danh sách), không còn
   position:fixed phủ toàn màn hình — xem ghi chú trong template vì sao đổi.
   .expert-section (expertPortal.css) đặt padding:0 cho CẢ class này (để .sr-list-body tự
   lo padding riêng) — section danh sách có .sr-list-body bù lại, còn section chi tiết này
   thì không có lớp bọc nào bù, nên phải tự thêm padding ở đây. */
.sr-detail-panel {
    padding: 24px 28px 32px;
}
.sr-detail-panel .ca-detail-head {
    position: sticky;
    top: 0;
    background: var(--warm-white, #fffdf7);
    z-index: 2;
    padding-bottom: 14px;
    margin-bottom: 10px;
}
/* .ca-detail-close dùng chung (clientAssessments.css) vốn chỉ để làm nút "✕" nhỏ đóng
   popup — giờ nút này mang chữ "Quay lại danh sách" nên ghi đè riêng tại đây thành dạng
   nút bo tròn bình thường, KHÔNG sửa file CSS dùng chung (ExpertClientAssessmentsView.vue
   vẫn cần giữ nguyên nút "✕" trơn của nó). */
.sr-detail-panel .ca-detail-close {
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
    padding: 8px 16px;
    border: 1.5px solid var(--kraft-light, #e8cba7);
    border-radius: 50px;
    background: var(--warm-white, #fffdf7);
    color: var(--text-secondary);
}
.sr-detail-panel .ca-detail-close:hover {
    background: var(--mint-light);
    border-color: var(--mint);
}

/* 2 cột: trái 2/3 (biểu đồ + lịch), phải 1/3 (tab chi tiết) — bên trái từng tràn hết cỡ
   màn hình khi đứng 1 mình (chart/lịch kéo giãn méo), giới hạn lại bằng cột 2fr/1fr. */
.sr-detail-columns {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    align-items: start;
}
@media (max-width: 900px) {
    .sr-detail-columns { grid-template-columns: 1fr; }
}

.sr-tab-filter-wrap {
    position: relative;
    margin-bottom: 18px;
}
.sr-tab-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 14px;
    border: 2px solid var(--kraft-light, #e8cba7);
    border-radius: 50px;
    background: var(--warm-white, #fffdf7);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition);
}
.sr-tab-filter-btn:hover { background: var(--mint-light); border-color: var(--mint); }
.sr-tab-filter-caret { margin-left: 2px; }
.sr-tab-filter-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 220px;
    padding: 6px;
    background: var(--warm-white, #fffdf7);
    border: 1.5px solid var(--kraft-light, #e8cba7);
    border-radius: var(--radius-md);
    box-shadow: 3px 3px 0px rgba(74, 55, 40, 0.15);
}
.sr-tab-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: none;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    background: none;
    color: var(--text-secondary);
    transition: var(--transition);
}
.sr-tab-filter-item:hover { background: var(--kraft-light, #e8cba7); }
.sr-tab-filter-item.active { background: var(--mint-light); color: var(--text-primary); }
.sr-tab-count {
    background: var(--kraft-light, #e8cba7);
    color: var(--text-primary);
    border-radius: 999px;
    font-size: 0.68rem;
    padding: 1px 7px;
    font-weight: 800;
    margin-left: auto;
}
.sr-tab-filter-item.active .sr-tab-count { background: var(--mint); color: var(--mint-dark); }

.sr-booking-row {
    border: 1.5px solid var(--kraft-light, #e8cba7);
    border-radius: 12px;
    margin-bottom: 10px;
    overflow: hidden;
}
.sr-booking-summary {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--cream, #fff8f0);
    border: none;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: var(--text-primary);
}
.sr-booking-summary-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}
.sr-booking-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: 0 0 auto;
    background: var(--kraft-light);
}
.sr-booking-status-dot.is-confirmed,
.sr-booking-status-dot.is-completed { background: #12b981; }
.sr-booking-status-dot.is-awaiting_expert { background: #f59e0b; }
.sr-booking-status-dot.is-cancelled,
.sr-booking-status-dot.is-expired { background: #a8acbb; }
.sr-booking-caret {
    transition: transform 0.2s ease;
    color: var(--text-light);
}
.sr-booking-caret.open { transform: rotate(180deg); }
.sr-booking-detail {
    padding: 12px 14px 14px;
    border-top: 1px dashed var(--kraft-light, #e8cba7);
}
.sr-booking-history {
    margin-top: 6px;
}
.sr-booking-history-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    background: none;
    border: 1.5px dashed var(--kraft-light, #e8cba7);
    border-radius: 12px;
    font: inherit;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-secondary);
    cursor: pointer;
}
.sr-booking-history-toggle:hover { background: var(--cream, #fff8f0); }
.sr-booking-history-body {
    margin-top: 8px;
}
.sr-booking-row.is-history { opacity: 0.72; }

.sr-detail-section {
    margin-bottom: 18px;
}
.sr-detail-item {
    padding: 8px 0;
    border-bottom: 1px dashed var(--kraft-light, #e8cba7);
}
.sr-detail-item:last-child { border-bottom: none; }
.sr-detail-content {
    font-size: 0.86rem;
    color: var(--text-secondary);
    margin: 4px 0 0;
    white-space: pre-wrap;
}
.sr-response-bubble {
    background: var(--cream, #fff8f0);
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 8px;
    font-size: 0.86rem;
}
.sr-response-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1.5px dashed var(--kraft-light, #e8cba7);
}
.sr-response-title {
    font-weight: 800;
    font-size: 1rem;
    margin: 0 0 12px;
}
.sr-reply-box {
    margin-top: 10px;
}
.sr-reply-textarea {
    width: 100%;
    min-height: 90px;
    resize: vertical;
    font-family: inherit;
}
</style>
