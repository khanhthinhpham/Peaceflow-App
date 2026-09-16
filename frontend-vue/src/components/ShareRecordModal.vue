<template>
  <div class="modal-overlay" :class="{ show: true }" @click.self="$emit('close')">
    <div class="booking-modal sr-modal">
      <div class="bm-header">
        <button class="bm-close" @click="$emit('close')">✕</button>
        <div class="bm-avatar">📋</div>
        <div>
          <div class="bm-name">{{ t('experts.shareRecord.modalTitle') }}</div>
          <div class="bm-degree">{{ expertName }}</div>
        </div>
      </div>

      <div class="bm-body">
        <p v-if="loading" class="ca-empty">{{ t('experts.shareRecord.loading') }}</p>
        <p v-else-if="loadError" class="ca-empty">{{ t('experts.shareRecord.loadError') }}</p>

        <template v-else>
          <!-- ===== LIST ===== -->
          <template v-if="view === 'list'">
            <button type="button" class="btn-primary sr-send-new-btn" @click="startPick">{{ t('experts.shareRecord.sendNewBtn') }}</button>

            <div class="bm-section">
              <div class="bm-section-title">{{ t('experts.shareRecord.sentListTitle') }}</div>
              <p v-if="!sentRecords.length" class="ca-empty">{{ t('experts.shareRecord.noSentYet') }}</p>
              <div v-for="r in sentRecords" :key="r.id" class="mb-item sr-clickable" @click="openDetail(r)">
                <div class="mb-info">
                  <div class="mb-name">{{ t('experts.shareRecord.sentAtLabel') }}: {{ formatDateTime(r.sent_at) }}</div>
                  <div class="mb-meta">{{ r.response_count > 0 ? t('experts.shareRecord.responseCount', { n: r.response_count }) : t('experts.shareRecord.noResponseYet') }}</div>
                </div>
                <span class="mb-badge" :style="statusBadgeStyle(r.status)">{{ r.status === 'revoked' ? t('experts.shareRecord.statusRevoked') : t('experts.shareRecord.statusActive') }}</span>
              </div>
            </div>
          </template>

          <!-- ===== PICK ===== -->
          <template v-else-if="view === 'pick'">
            <div class="bm-section-title">{{ t('experts.shareRecord.pickTitle') }}</div>
            <p style="font-size:0.82rem;color:var(--text-secondary);margin:-4px 0 12px;">{{ t('experts.shareRecord.pickSubtitle', { expertName }) }}</p>

            <div class="sr-pick-toolbar">
              <span class="sr-pick-count">{{ t('experts.shareRecord.selectedCount', { n: selectedCount }) }}</span>
              <div class="sr-pick-toolbar-btns">
                <button type="button" class="sr-link-btn" @click="selectAllGlobal">{{ t('experts.shareRecord.selectAllGlobal') }}</button>
                <button type="button" class="sr-link-btn" @click="clearAllGlobal">{{ t('experts.shareRecord.clearAllGlobal') }}</button>
              </div>
            </div>

            <div class="sr-pick-tabs">
              <button type="button" class="sr-pick-tab" :class="{ active: pickTab === 'journal' }" @click="pickTab = 'journal'">
                📔 {{ t('experts.shareRecord.journalTab', { n: summary.journalEntries.length }) }}
                <span v-if="selectedJournal.length" class="sr-pick-tab-badge">{{ selectedJournal.length }}</span>
              </button>
              <button type="button" class="sr-pick-tab" :class="{ active: pickTab === 'mood' }" @click="pickTab = 'mood'">
                🌤️ {{ t('experts.shareRecord.moodTab', { n: summary.moodCheckins.length }) }}
                <span v-if="selectedMood.length" class="sr-pick-tab-badge">{{ selectedMood.length }}</span>
              </button>
              <button type="button" class="sr-pick-tab" :class="{ active: pickTab === 'assessment' }" @click="pickTab = 'assessment'">
                🩺 {{ t('experts.shareRecord.assessmentTab', { n: summary.assessmentResults.length }) }}
                <span v-if="selectedAssessment.length" class="sr-pick-tab-badge">{{ selectedAssessment.length }}</span>
              </button>
            </div>

            <div v-show="pickTab === 'journal'">
              <p v-if="!summary.journalEntries.length" class="ca-empty">{{ t('experts.shareRecord.emptyJournal') }}</p>
              <template v-else>
                <label class="sr-select-all-row">
                  <input type="checkbox" :checked="isAllSelected('journal')" @change="toggleSelectAll('journal', $event.target.checked)">
                  <span>{{ t('experts.shareRecord.selectAllInTab') }}</span>
                </label>
                <div class="sr-pick-scroll">
                  <label v-for="j in summary.journalEntries" :key="j.id" class="sr-pick-item">
                    <input type="checkbox" :value="j.id" v-model="selectedJournal">
                    <span class="sr-pick-text">
                      <strong>{{ j.title || t('experts.shareRecord.untitledJournal') }}</strong>
                      <span class="sr-pick-meta">{{ formatDateTime(j.created_at) }}</span>
                    </span>
                  </label>
                </div>
              </template>
            </div>

            <div v-show="pickTab === 'mood'">
              <p v-if="!summary.moodCheckins.length" class="ca-empty">{{ t('experts.shareRecord.emptyMood') }}</p>
              <template v-else>
                <label class="sr-select-all-row">
                  <input type="checkbox" :checked="isAllSelected('mood')" @change="toggleSelectAll('mood', $event.target.checked)">
                  <span>{{ t('experts.shareRecord.selectAllInTab') }}</span>
                </label>
                <div class="sr-pick-scroll">
                  <label v-for="m in summary.moodCheckins" :key="m.id" class="sr-pick-item">
                    <input type="checkbox" :value="m.id" v-model="selectedMood">
                    <span class="sr-pick-text">
                      <strong>{{ m.dominant_emotion || '—' }} ({{ m.mood_score }}/10)</strong>
                      <span class="sr-pick-meta">{{ formatDateTime(m.created_at) }}</span>
                    </span>
                  </label>
                </div>
              </template>
            </div>

            <div v-show="pickTab === 'assessment'">
              <p v-if="!summary.assessmentResults.length" class="ca-empty">{{ t('experts.shareRecord.emptyAssessment') }}</p>
              <template v-else>
                <label class="sr-select-all-row">
                  <input type="checkbox" :checked="isAllSelected('assessment')" @change="toggleSelectAll('assessment', $event.target.checked)">
                  <span>{{ t('experts.shareRecord.selectAllInTab') }}</span>
                </label>
                <div class="sr-pick-scroll">
                  <label v-for="a in summary.assessmentResults" :key="a.id" class="sr-pick-item">
                    <input type="checkbox" :value="a.id" v-model="selectedAssessment">
                    <span class="sr-pick-text">
                      <strong>{{ a.assessment_name }}</strong>
                      <span class="sr-pick-meta">{{ a.severity || '—' }} · {{ formatDateTime(a.created_at) }}</span>
                    </span>
                  </label>
                </div>
              </template>
            </div>

            <div class="bm-footer-actions">
              <button type="button" class="btn-outline" @click="view = 'list'">{{ t('experts.shareRecord.cancelBtn') }}</button>
              <button type="button" class="btn-primary" :disabled="!selectedCount" @click="view = 'confirm'">{{ t('experts.shareRecord.continueBtn') }} ({{ selectedCount }})</button>
            </div>
          </template>

          <!-- ===== CONFIRM ===== -->
          <template v-else-if="view === 'confirm'">
            <div class="bm-section-title">{{ t('experts.shareRecord.confirmTitle') }}</div>
            <div class="sr-banner sr-banner-info">{{ t('experts.shareRecord.confirmWarning', { expertName }) }}</div>

            <div v-if="selectedJournalItems.length" class="bm-section">
              <div class="bm-section-title">{{ t('experts.shareRecord.journalSection') }}</div>
              <div v-for="j in selectedJournalItems" :key="j.id" class="sr-confirm-row">{{ j.title || t('experts.shareRecord.untitledJournal') }} — {{ formatDateTime(j.created_at) }}</div>
            </div>
            <div v-if="selectedMoodItems.length" class="bm-section">
              <div class="bm-section-title">{{ t('experts.shareRecord.moodSection') }}</div>
              <div v-for="m in selectedMoodItems" :key="m.id" class="sr-confirm-row">{{ m.dominant_emotion || '—' }} ({{ m.mood_score }}/10) — {{ formatDateTime(m.created_at) }}</div>
            </div>
            <div v-if="selectedAssessmentItems.length" class="bm-section">
              <div class="bm-section-title">{{ t('experts.shareRecord.assessmentSection') }}</div>
              <div v-for="a in selectedAssessmentItems" :key="a.id" class="sr-confirm-row">{{ a.assessment_name }} — {{ a.severity || '—' }} — {{ formatDateTime(a.created_at) }}</div>
            </div>

            <p v-if="sendError" style="color:var(--coral);font-size:0.85rem;margin:0 0 10px;">{{ sendError }}</p>
            <div class="bm-footer-actions">
              <button type="button" class="btn-outline" :disabled="sending" @click="view = 'pick'">{{ t('experts.shareRecord.backBtn') }}</button>
              <button type="button" class="btn-primary" :disabled="sending" @click="confirmSend">{{ sending ? t('experts.shareRecord.sending') : t('experts.shareRecord.confirmSendBtn') }}</button>
            </div>
          </template>

          <!-- ===== SUCCESS ===== -->
          <template v-else-if="view === 'success'">
            <div class="sr-success">
              <div style="font-size:2.4rem;">✅</div>
              <div class="bm-section-title" style="margin-top:8px;">{{ t('experts.shareRecord.successTitle') }}</div>
              <p style="color:var(--text-secondary);font-size:0.88rem;">{{ t('experts.shareRecord.successText', { expertName }) }}</p>
              <button type="button" class="btn-primary" @click="view = 'list'; reloadSentRecords()">{{ t('experts.shareRecord.doneBtn') }}</button>
            </div>
          </template>

          <!-- ===== DETAIL ===== -->
          <template v-else-if="view === 'detail'">
            <p v-if="detailLoading" class="ca-empty">{{ t('experts.shareRecord.loading') }}</p>
            <template v-else-if="detailRecord">
              <div class="bm-section-title">{{ t('experts.shareRecord.detailTitle') }}</div>
              <div v-if="detailRecord.status === 'revoked'" class="sr-banner sr-banner-warn">
                {{ t('experts.shareRecord.revokedBanner', { time: formatDateTime(detailRecord.revokedAt) }) }}
              </div>

              <div v-if="detailRecord.snapshot?.journalEntries?.length" class="bm-section">
                <div class="bm-section-title">{{ t('experts.shareRecord.journalSection') }}</div>
                <div v-for="j in detailRecord.snapshot.journalEntries" :key="j.id" class="sr-confirm-row">{{ j.title || t('experts.shareRecord.untitledJournal') }} — {{ formatDateTime(j.created_at) }}</div>
              </div>
              <div v-if="detailRecord.snapshot?.moodCheckins?.length" class="bm-section">
                <div class="bm-section-title">{{ t('experts.shareRecord.moodSection') }}</div>
                <div v-for="m in detailRecord.snapshot.moodCheckins" :key="m.id" class="sr-confirm-row">{{ m.dominant_emotion || '—' }} ({{ m.mood_score }}/10) — {{ formatDateTime(m.created_at) }}</div>
              </div>
              <div v-if="detailRecord.snapshot?.assessmentResults?.length" class="bm-section">
                <div class="bm-section-title">{{ t('experts.shareRecord.assessmentSection') }}</div>
                <div v-for="a in detailRecord.snapshot.assessmentResults" :key="a.id" class="sr-confirm-row">{{ a.assessment_name }} — {{ a.severity || '—' }} — {{ formatDateTime(a.created_at) }}</div>
              </div>

              <div class="bm-section">
                <div class="bm-section-title">{{ t('experts.shareRecord.doctorResponseTitle') }}</div>
                <p v-if="!detailRecord.responses.length" class="ca-empty">{{ t('experts.shareRecord.noResponseYet') }}</p>
                <div v-for="resp in detailRecord.responses" :key="resp.id" class="sr-response-bubble">
                  <div>{{ resp.content }}</div>
                  <div class="sr-pick-meta">{{ formatDateTime(resp.created_at) }}</div>
                </div>
              </div>

              <p v-if="revokeError" style="color:var(--coral);font-size:0.85rem;margin:0 0 10px;">{{ revokeError }}</p>
              <div class="bm-footer-actions">
                <button type="button" class="btn-outline" @click="view = 'list'">{{ t('experts.shareRecord.backBtn') }}</button>
                <button v-if="detailRecord.status === 'active'" type="button" class="btn-danger" :disabled="revoking" @click="doRevoke">{{ t('experts.shareRecord.revokeBtn') }}</button>
              </div>
            </template>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';

const props = defineProps({
  expertId: { type: String, required: true },
  expertName: { type: String, default: '' }
});
defineEmits(['close']);

const { t, locale } = useI18n();
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(intlLocale.value, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

const loading = ref(true);
const loadError = ref(false);
const summary = ref(null);
const sentRecords = ref([]);
const view = ref('list');

async function loadAll() {
  loading.value = true;
  loadError.value = false;
  try {
    const [summaryData, myRecords] = await Promise.all([
      apiClient.get(`/experts/${props.expertId}/shareable-summary`, { noCache: true }),
      apiClient.get(`/my-shared-records?expertId=${props.expertId}`, { noCache: true })
    ]);
    summary.value = summaryData;
    sentRecords.value = myRecords || [];
  } catch (_error) {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}
async function reloadSentRecords() {
  try {
    sentRecords.value = await apiClient.get(`/my-shared-records?expertId=${props.expertId}`, { noCache: true }) || [];
  } catch (_error) { /* keep current list */ }
}

function statusBadgeStyle(status) {
  return status === 'revoked'
    ? { color: 'var(--coral-dark)', background: 'var(--coral-light)' }
    : { color: 'var(--mint-dark)', background: 'var(--mint-light)' };
}

// ===== Pick / confirm / send =====
const selectedJournal = ref([]);
const selectedMood = ref([]);
const selectedAssessment = ref([]);
const pickTab = ref('journal');
const sending = ref(false);
const sendError = ref('');

function startPick() {
  selectedJournal.value = [];
  selectedMood.value = [];
  selectedAssessment.value = [];
  pickTab.value = 'journal';
  sendError.value = '';
  view.value = 'pick';
}
const selectedCount = computed(() => selectedJournal.value.length + selectedMood.value.length + selectedAssessment.value.length);
const selectedJournalItems = computed(() => (summary.value?.journalEntries || []).filter((j) => selectedJournal.value.includes(j.id)));
const selectedMoodItems = computed(() => (summary.value?.moodCheckins || []).filter((m) => selectedMood.value.includes(m.id)));
const selectedAssessmentItems = computed(() => (summary.value?.assessmentResults || []).filter((a) => selectedAssessment.value.includes(a.id)));

function itemsForTab(tab) {
  if (tab === 'journal') return summary.value?.journalEntries || [];
  if (tab === 'mood') return summary.value?.moodCheckins || [];
  return summary.value?.assessmentResults || [];
}
function selectedRefForTab(tab) {
  if (tab === 'journal') return selectedJournal;
  if (tab === 'mood') return selectedMood;
  return selectedAssessment;
}
function isAllSelected(tab) {
  const items = itemsForTab(tab);
  const sel = selectedRefForTab(tab).value;
  return items.length > 0 && items.every((it) => sel.includes(it.id));
}
function toggleSelectAll(tab, checked) {
  selectedRefForTab(tab).value = checked ? itemsForTab(tab).map((it) => it.id) : [];
}
function selectAllGlobal() {
  selectedJournal.value = (summary.value?.journalEntries || []).map((j) => j.id);
  selectedMood.value = (summary.value?.moodCheckins || []).map((m) => m.id);
  selectedAssessment.value = (summary.value?.assessmentResults || []).map((a) => a.id);
}
function clearAllGlobal() {
  selectedJournal.value = [];
  selectedMood.value = [];
  selectedAssessment.value = [];
}

async function confirmSend() {
  sending.value = true;
  sendError.value = '';
  try {
    await apiClient.post(`/experts/${props.expertId}/shared-records`, {
      journalEntryIds: selectedJournal.value,
      moodCheckinIds: selectedMood.value,
      assessmentResultIds: selectedAssessment.value
    });
    view.value = 'success';
  } catch (error) {
    sendError.value = error.message || t('experts.shareRecord.sendFailed');
  } finally {
    sending.value = false;
  }
}

// ===== Detail / revoke =====
const detailLoading = ref(false);
const detailRecord = ref(null);
const revoking = ref(false);
const revokeError = ref('');

async function openDetail(record) {
  view.value = 'detail';
  detailLoading.value = true;
  detailRecord.value = null;
  revokeError.value = '';
  try {
    detailRecord.value = await apiClient.get(`/shared-records/${record.id}`, { noCache: true });
  } catch (_error) {
    detailRecord.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function doRevoke() {
  if (!window.confirm(t('experts.shareRecord.revokeConfirm'))) return;
  revoking.value = true;
  revokeError.value = '';
  try {
    await apiClient.post(`/shared-records/${detailRecord.value.id}/revoke`);
    detailRecord.value.status = 'revoked';
    detailRecord.value.revokedAt = new Date().toISOString();
    reloadSentRecords();
  } catch (error) {
    revokeError.value = error.message || t('experts.shareRecord.revokeFailed');
  } finally {
    revoking.value = false;
  }
}

onMounted(loadAll);
</script>

<style scoped src="../assets/experts.css"></style>
