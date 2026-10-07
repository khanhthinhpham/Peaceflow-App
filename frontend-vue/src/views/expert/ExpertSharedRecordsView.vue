<template>
  <main class="expert-main expert-dashboard-main">
    <header class="expert-topbar expert-dashboard-topbar">
      <div class="expert-topbar-copy">
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Hồ sơ thân chủ gửi</h1>
        <p class="expert-page-subtitle">Nhật ký, check-in tâm trạng và kết quả test mà thân chủ chủ động gửi cho bạn trước hoặc trong buổi hẹn.</p>
      </div>
      <div class="expert-topbar-tools">
        <button type="button" class="expert-bell-btn" data-notif-bell aria-label="Thông báo" @click="notif.togglePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span class="expert-bell-badge" :style="{ display: notif.unread > 0 ? 'flex' : 'none' }">{{ Math.min(notif.unread, 9) }}</span>
        </button>
      </div>
    </header>

    <ExpertStatusBanner :message="banner.message" :type="banner.type" />

    <section class="expert-panel expert-section">
      <div class="expert-section-head">
        <div>
          <h2 class="expert-section-title">Danh sách hồ sơ đã nhận</h2>
          <p class="expert-section-copy">Bấm vào một dòng để xem chi tiết và phản hồi/kê đơn cho thân chủ.</p>
        </div>
      </div>
      <div class="sr-list-body">
        <p v-if="loading" class="ca-empty">Đang tải...</p>
        <p v-else-if="loadError" class="ca-empty">Không tải được danh sách hồ sơ.</p>
        <p v-else-if="!records.length" class="ca-empty">Chưa có thân chủ nào gửi hồ sơ cho bạn.</p>
        <div v-for="r in records" :key="r.id" class="sr-list-row" @click="openDetail(r)">
          <div class="sr-list-main">
            <div class="ca-selftest-name">{{ r.client_name }}</div>
            <div class="ca-selftest-meta">Gửi lúc {{ formatDateTime(r.sent_at) }}{{ r.status === 'revoked' ? ` · Đã thu hồi lúc ${formatDateTime(r.revoked_at)}` : '' }}</div>
          </div>
          <div class="sr-list-meta">
            <span class="mb-badge" :style="r.status === 'revoked' ? { color: 'var(--coral-dark)', background: 'var(--coral-light)' } : { color: 'var(--mint-dark)', background: 'var(--mint-light)' }">{{ r.status === 'revoked' ? 'Đã thu hồi' : 'Đang chia sẻ' }}</span>
            <span class="ca-selftest-meta">{{ r.response_count > 0 ? `${r.response_count} phản hồi đã gửi` : 'Chưa phản hồi' }}</span>
          </div>
        </div>
        <div class="ca-pager">
          <template v-if="total">
            <span class="ca-pager-meta">{{ pageFrom }}–{{ pageTo }} trong {{ total }}</span>
            <template v-if="totalPages > 1">
              <button type="button" class="ca-page-btn" :disabled="page === 0" title="Trang đầu" @click="loadRecords(0)">« Đầu</button>
              <button type="button" class="ca-page-btn" :disabled="page === 0" @click="loadRecords(page - 1)">‹ Trước</button>
              <template v-for="(p, idx) in pageWindowList" :key="idx">
                <span v-if="p === '…'" class="ca-page-ellipsis">…</span>
                <button v-else type="button" class="ca-page-btn" :class="{ active: p === page }" @click="loadRecords(p)">{{ p + 1 }}</button>
              </template>
              <button type="button" class="ca-page-btn" :disabled="page >= totalPages - 1" @click="loadRecords(page + 1)">Sau ›</button>
              <button type="button" class="ca-page-btn" :disabled="page >= totalPages - 1" title="Trang cuối" @click="loadRecords(totalPages - 1)">Cuối »</button>
            </template>
          </template>
        </div>
      </div>
    </section>

    <!-- Detail: full màn hình (không phải popup nhỏ nữa) — thông tin 1 thân chủ nhiều khi
         khá dài (nhiều lịch hẹn + nhật ký + test), cần đủ chỗ để đọc thoải mái. -->
    <div class="sr-fullscreen" :class="{ show: showDetail }">
      <div class="sr-fullscreen-inner" v-if="showDetail">
        <div class="ca-detail-head sr-fullscreen-head">
          <div>
            <div class="ca-detail-title">{{ detailRecord?.clientName || '...' }}</div>
            <div class="ca-detail-meta" v-if="detailRecord">Gửi lúc {{ formatDateTime(detailRecord.sentAt) }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="closeDetail">✕</button>
        </div>

        <p v-if="detailLoading" class="ca-empty">Đang tải...</p>
        <template v-else-if="detailRecord">
          <div v-if="detailRecord.status === 'revoked'" class="sr-revoked-banner">⚠️ Thân chủ đã thu hồi hồ sơ này lúc {{ formatDateTime(detailRecord.revokedAt) }}.</div>

          <!-- Dropdown lọc nội bộ: tách từng loại thông tin ra, thay vì dồn hết xuống 1 trang
               dài phải cuộn qua nhiều mục không liên quan tới nhau (và đỡ vỡ dòng như tab bar
               ngang cũ với 5 mục). -->
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

          <!-- Lịch hẹn & mô tả tình trạng: mỗi lịch gọn 1 dòng, bấm vào mới mở ra xem mô tả +
               hồ sơ khám — tránh dồn 5-10 lịch cũ/huỷ/hết hạn đập thẳng vào mắt cùng lúc. -->
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

              <!-- Lịch sử (đã xong/huỷ/hết hạn) gộp vào 1 khối đóng sẵn, tránh dàn hàng ngang
                   hàng với lịch đang hoạt động và làm loãng mắt người xem. -->
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
            <p v-if="!detailRecord.snapshot?.journalEntries?.length" class="ca-empty">Không có nhật ký nào trong hồ sơ này.</p>
            <div v-for="j in detailRecord.snapshot?.journalEntries" :key="j.id" class="sr-detail-item">
              <div class="ca-selftest-name">{{ j.title || '(Không có tiêu đề)' }}</div>
              <div class="ca-selftest-meta">{{ formatDateTime(j.created_at) }}</div>
              <p class="sr-detail-content">{{ j.content }}</p>
            </div>
          </div>

          <div v-show="detailTab === 'mood'" class="sr-detail-section">
            <p v-if="!detailRecord.snapshot?.moodCheckins?.length" class="ca-empty">Không có check-in nào trong hồ sơ này.</p>
            <div v-for="m in detailRecord.snapshot?.moodCheckins" :key="m.id" class="sr-detail-item">
              <div class="ca-selftest-name">{{ m.dominant_emotion || '—' }} ({{ m.mood_score }}/10)</div>
              <div class="ca-selftest-meta">{{ formatDateTime(m.created_at) }}</div>
              <p v-if="m.notes" class="sr-detail-content">{{ m.notes }}</p>
            </div>
          </div>

          <div v-show="detailTab === 'tests'" class="sr-detail-section">
            <p v-if="!detailRecord.snapshot?.assessmentResults?.length" class="ca-empty">Không có kết quả bài test nào trong hồ sơ này.</p>
            <div v-for="a in detailRecord.snapshot?.assessmentResults" :key="a.id" class="sr-detail-item">
              <div class="ca-selftest-name">{{ a.assessment_name }} — {{ a.severity || '—' }} ({{ a.total_score }})</div>
              <div class="ca-selftest-meta">{{ formatDateTime(a.created_at) }}</div>
            </div>
          </div>

          <div v-show="detailTab === 'responses'" class="sr-detail-section">
            <p v-if="!detailRecord.responses.length" class="ca-empty">Bạn chưa phản hồi hồ sơ này.</p>
            <div v-for="resp in detailRecord.responses" :key="resp.id" class="sr-response-bubble">
              <div>{{ resp.content }}</div>
              <div class="ca-selftest-meta">{{ formatDateTime(resp.created_at) }}</div>
            </div>

            <div class="sr-reply-box">
              <textarea v-model="replyText" class="form-input sr-reply-textarea" placeholder="Nhập phản hồi hoặc phương án/đơn thuốc cho thân chủ..."></textarea>
              <p v-if="replyError" style="color:var(--coral);font-size:0.85rem;margin:4px 0 0;">{{ replyError }}</p>
              <button type="button" class="ca-export-btn" style="margin-top:8px;" :disabled="sendingReply" @click="submitReply">{{ sendingReply ? 'Đang gửi...' : '💬 Gửi phản hồi' }}</button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { useNotificationsStore } from '../../stores/notifications';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';
import MedicalRecordsViewer from '../../components/MedicalRecordsViewer.vue';

const notif = useNotificationsStore();
const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

// Giữ đúng nhãn như ExpertDashboardView.vue để nhất quán xuyên suốt expert portal.
const SESSION_TYPE_LABELS = { voice: '📞 Gọi thoại', video: '🎥 Video call' };
const BOOKING_STATUS_LABELS = {
  awaiting_expert: 'Chờ bạn nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã huỷ',
  expired: 'Đã hết hạn'
};

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

const records = ref([]);
const loading = ref(false);
const loadError = ref(false);
const page = ref(0);
const limit = 10;
const total = ref(0);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)));
const pageFrom = computed(() => page.value * limit + 1);
const pageTo = computed(() => Math.min(total.value, (page.value + 1) * limit));
function pageWindow(current, totalP) {
  const pages = new Set([0, totalP - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < totalP).sort((a, b) => a - b);
  const out = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}
const pageWindowList = computed(() => pageWindow(page.value, totalPages.value));

async function loadRecords(nextPage = 0) {
  page.value = Math.max(0, nextPage);
  loading.value = true;
  loadError.value = false;
  try {
    const data = await apiClient.get(`/expert-portal/shared-records?limit=${limit}&offset=${page.value * limit}`, { noCache: true });
    records.value = data?.items || [];
    total.value = data?.total || 0;
  } catch (_error) {
    records.value = [];
    total.value = 0;
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

// Tab nội bộ trong trang chi tiết full-screen — mặc định mở "Lịch hẹn" vì đó là thứ bác sĩ
// cần xem đầu tiên trước buổi hẹn, các mục còn lại xem khi cần.
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
  { key: 'journal', label: '📔 Nhật ký', count: detailRecord.value?.snapshot?.journalEntries?.length ?? null },
  { key: 'mood', label: '🌤️ Check-in', count: detailRecord.value?.snapshot?.moodCheckins?.length ?? null },
  { key: 'tests', label: '🩺 Kết quả test', count: detailRecord.value?.snapshot?.assessmentResults?.length ?? null },
  { key: 'responses', label: '💬 Phản hồi', count: detailRecord.value?.responses?.length ?? null }
]);
const activeTabInfo = computed(() => detailTabs.value.find((tab) => tab.key === detailTab.value) || detailTabs.value[0]);

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

async function openDetail(record) {
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
    detailRecord.value = await apiClient.get(`/shared-records/${record.id}`, { noCache: true });
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
    const inserted = await apiClient.post(`/shared-records/${detailRecord.value.id}/responses`, { content });
    detailRecord.value.responses.push({ id: inserted.id, content, created_at: inserted.created_at });
    replyText.value = '';
    const listed = records.value.find((r) => r.id === detailRecord.value.id);
    if (listed) listed.response_count = (listed.response_count || 0) + 1;
    setBanner('Đã gửi phản hồi cho thân chủ.', 'success');
  } catch (error) {
    replyError.value = error.message || 'Không gửi được phản hồi.';
  } finally {
    sendingReply.value = false;
  }
}

onMounted(loadRecords);
</script>

<style scoped src="../../assets/expertDashboard.css"></style>
<style scoped src="../../assets/clientAssessments.css"></style>
<style scoped>
.sr-list-body {
    padding: 18px 24px 24px;
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
/* Full màn hình thay cho popup nhỏ giữa trang — tách riêng class để KHÔNG đụng tới
   .ca-detail-overlay/.ca-detail-box dùng chung với ExpertClientAssessmentsView.vue. */
.sr-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 900;
    background: var(--warm-white, #fffdf7);
    display: none;
    flex-direction: column;
}
.sr-fullscreen.show {
    display: flex;
}
.sr-fullscreen-inner {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 24px 32px 40px;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
}
.sr-fullscreen-head {
    position: sticky;
    top: 0;
    background: var(--warm-white, #fffdf7);
    padding-top: 4px;
    padding-bottom: 14px;
    margin-bottom: 10px;
    z-index: 2;
}
@media (max-width: 640px) {
    .sr-fullscreen-inner { padding: 16px 16px 28px; }
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
