<template>
  <button type="button" class="lg-share-pill" :title="t('legal.shares.desc')" @click="open = true">
    {{ count ? t('legal.shares.pillCount', { n: count }) : t('legal.shares.pill') }}
  </button>
  <Teleport to="body">
    <div v-if="open" class="lg-dialog-overlay" @click.self="open = false">
      <div class="lg-dialog" role="dialog" aria-modal="true" :aria-label="t('legal.shares.dialogTitle')" style="max-width:520px;">
        <div class="lg-dialog-head">
          <strong>{{ t('legal.shares.dialogTitle') }}</strong>
          <button type="button" class="lg-dialog-x" :aria-label="t('legal.close')" @click="open = false">✕</button>
        </div>
        <div class="lg-dialog-body" style="padding-top:14px;">
          <ExpertShareSettings :show="[kind]" @change="onChange" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Nút nhỏ ở đầu trang Check-in / Bài test: thay cho công tắc "chia sẻ với mọi chuyên gia" cũ —
// mở danh sách để chọn từng chuyên gia (Điều 7.3).
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../../lib/apiClient';
import ExpertShareSettings from './ExpertShareSettings.vue';
import '../../assets/legal.css';

const props = defineProps({ kind: { type: String, default: 'mood' } }); // 'mood' | 'assessments' | 'journal'
const { t } = useI18n();
const open = ref(false);
const count = ref(0);
const field = () => ({ assessments: 'share_assessments', journal: 'share_journal' }[props.kind] || 'share_mood');

function onChange(rows) {
  count.value = (rows || []).filter((r) => r[field()]).length;
}
onMounted(async () => {
  try { onChange(await apiClient.get('/my-expert-shares', { noCache: true })); } catch (_e) { /* giữ 0 */ }
});
</script>
