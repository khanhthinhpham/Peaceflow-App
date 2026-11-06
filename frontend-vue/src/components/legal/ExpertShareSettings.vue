<template>
  <div class="lg-share">
    <p v-if="showDesc" class="lg-share-sub" style="margin:0 0 10px;">{{ t('legal.shares.desc') }}</p>
    <p v-if="showDesc && show.includes('journal')" class="lg-share-sub" style="margin:-4px 0 10px;">{{ t('legal.shares.journalDesc') }}</p>
    <p v-if="loading" class="lg-share-empty">{{ t('legal.shares.loading') }}</p>
    <p v-else-if="loadError" class="lg-share-empty">{{ t('legal.shares.loadError') }}</p>
    <p v-else-if="!rows.length" class="lg-share-empty">{{ t('legal.shares.empty') }}</p>
    <div v-else class="lg-share-list">
      <div v-for="r in rows" :key="r.expert_id" class="lg-share-item">
        <div class="lg-share-name">{{ r.full_name }}</div>
        <div class="lg-share-sub">{{ r.expert_group === 'practitioner' ? t('legal.expert.groupPractitioner') : t('legal.expert.groupCounselor') }}<template v-if="r.degree"> · {{ r.degree }}</template></div>
        <div class="lg-share-toggles">
          <label v-if="show.includes('mood')" class="lg-check">
            <input type="checkbox" :checked="r.share_mood" :disabled="savingId === r.expert_id" @change="save(r, 'share_mood', $event.target.checked)">
            <span>{{ t('legal.shares.mood') }}</span>
          </label>
          <label v-if="show.includes('assessments')" class="lg-check">
            <input type="checkbox" :checked="r.share_assessments" :disabled="savingId === r.expert_id" @change="save(r, 'share_assessments', $event.target.checked)">
            <span>{{ t('legal.shares.assessments') }}</span>
          </label>
          <label v-if="show.includes('journal')" class="lg-check">
            <input type="checkbox" :checked="r.share_journal" :disabled="savingId === r.expert_id" @change="save(r, 'share_journal', $event.target.checked)">
            <span>{{ t('legal.shares.journal') }}</span>
          </label>
        </div>
        <p v-if="errorId === r.expert_id" class="lg-consent-error" role="alert">{{ t('legal.shares.saveError') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Điều 7.3: khách bật/tắt chia sẻ check-in & kết quả sàng lọc cho TỪNG chuyên gia đã đặt lịch.
// Mỗi lần đổi đều được server ghi vào nhật ký đồng ý (user_consents, kind = 'expert_share').
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../../lib/apiClient';
import '../../assets/legal.css';

defineProps({
  // loại dữ liệu hiển thị công tắc: ['mood'], ['assessments'] hoặc cả hai
  show: { type: Array, default: () => ['mood', 'assessments', 'journal'] },
  showDesc: { type: Boolean, default: true }
});
const emit = defineEmits(['change']);
const { t } = useI18n();

const rows = ref([]);
const loading = ref(true);
const loadError = ref(false);
const savingId = ref(null);
const errorId = ref(null);

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    rows.value = (await apiClient.get('/my-expert-shares', { noCache: true })) || [];
    emit('change', rows.value);
  } catch (_e) {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function save(row, field, value) {
  const prev = row[field];
  row[field] = value;
  savingId.value = row.expert_id;
  errorId.value = null;
  try {
    await apiClient.put(`/my-expert-shares/${row.expert_id}`, { share_mood: row.share_mood, share_assessments: row.share_assessments, share_journal: row.share_journal });
    emit('change', rows.value);
  } catch (_e) {
    row[field] = prev;
    errorId.value = row.expert_id;
  } finally {
    savingId.value = null;
  }
}

onMounted(load);
defineExpose({ reload: load });
</script>
