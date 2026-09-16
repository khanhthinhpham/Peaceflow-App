<template>
  <main class="expert-main expert-dashboard-main">
    <header class="expert-topbar expert-dashboard-topbar">
      <div class="expert-topbar-copy">
        <p class="expert-page-kicker">PeaceFlow Expert</p>
        <h1 class="expert-page-title">Hồ sơ thân chủ gửi</h1>
        <p class="expert-page-subtitle">Nhật ký, check-in tâm trạng và kết quả test mà thân chủ chủ động gửi cho bạn trước hoặc trong buổi hẹn.</p>
      </div>
      <div class="expert-topbar-tools">
        <button type="button" class="expert-bell-btn" aria-label="Thông báo" @click="notif.togglePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span class="expert-bell-badge" :style="{ display: notif.unread > 0 ? 'flex' : 'none' }">{{ Math.min(notif.unread, 9) }}</span>
        </button>
        <div class="expert-avatar-chip" aria-hidden="true">EX</div>
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

    <!-- Detail overlay -->
    <div class="ca-detail-overlay" :class="{ show: showDetail }">
      <div class="ca-detail-box" v-if="showDetail">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ detailRecord?.clientName || '...' }}</div>
            <div class="ca-detail-meta" v-if="detailRecord">Gửi lúc {{ formatDateTime(detailRecord.sentAt) }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="closeDetail">✕</button>
        </div>

        <p v-if="detailLoading" class="ca-empty">Đang tải...</p>
        <template v-else-if="detailRecord">
          <div v-if="detailRecord.status === 'revoked'" class="sr-revoked-banner">⚠️ Thân chủ đã thu hồi hồ sơ này lúc {{ formatDateTime(detailRecord.revokedAt) }}.</div>

          <div v-if="detailRecord.snapshot?.journalEntries?.length" class="sr-detail-section">
            <div class="ca-selftest-name" style="margin-bottom:6px;">📔 Nhật ký cảm xúc</div>
            <div v-for="j in detailRecord.snapshot.journalEntries" :key="j.id" class="sr-detail-item">
              <div class="ca-selftest-name">{{ j.title || '(Không có tiêu đề)' }}</div>
              <div class="ca-selftest-meta">{{ formatDateTime(j.created_at) }}</div>
              <p class="sr-detail-content">{{ j.content }}</p>
            </div>
          </div>

          <div v-if="detailRecord.snapshot?.moodCheckins?.length" class="sr-detail-section">
            <div class="ca-selftest-name" style="margin-bottom:6px;">🌤️ Check-in tâm trạng</div>
            <div v-for="m in detailRecord.snapshot.moodCheckins" :key="m.id" class="sr-detail-item">
              <div class="ca-selftest-name">{{ m.dominant_emotion || '—' }} ({{ m.mood_score }}/10)</div>
              <div class="ca-selftest-meta">{{ formatDateTime(m.created_at) }}</div>
              <p v-if="m.notes" class="sr-detail-content">{{ m.notes }}</p>
            </div>
          </div>

          <div v-if="detailRecord.snapshot?.assessmentResults?.length" class="sr-detail-section">
            <div class="ca-selftest-name" style="margin-bottom:6px;">🩺 Kết quả bài test</div>
            <div v-for="a in detailRecord.snapshot.assessmentResults" :key="a.id" class="sr-detail-item">
              <div class="ca-selftest-name">{{ a.assessment_name }} — {{ a.severity || '—' }} ({{ a.total_score }})</div>
              <div class="ca-selftest-meta">{{ formatDateTime(a.created_at) }}</div>
            </div>
          </div>

          <div class="sr-detail-section">
            <div class="ca-selftest-name" style="margin-bottom:6px;">💬 Phản hồi / kê đơn</div>
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
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { useNotificationsStore } from '../../stores/notifications';
import ExpertStatusBanner from '../../components/ExpertStatusBanner.vue';

const notif = useNotificationsStore();
const banner = ref({ message: '', type: 'info' });
function setBanner(message, type = 'info') {
  banner.value = { message: message || '', type };
}

function formatDateTime(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
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

async function openDetail(record) {
  showDetail.value = true;
  detailLoading.value = true;
  detailRecord.value = null;
  replyText.value = '';
  replyError.value = '';
  try {
    detailRecord.value = await apiClient.get(`/shared-records/${record.id}`, { noCache: true });
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
