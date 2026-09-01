<template>
  <div class="mr-viewer">
    <button type="button" class="mr-viewer-toggle" @click="toggle">
      📎 Hồ sơ khám cũ đính kèm{{ loaded && files.length ? ` (${files.length})` : '' }}
      <span class="mr-viewer-caret">{{ open ? '▲' : '▼' }}</span>
    </button>
    <div v-if="open" class="mr-viewer-body">
      <p v-if="loading" class="mr-viewer-empty">Đang tải...</p>
      <template v-else>
        <p v-if="note" class="mr-viewer-note">{{ note }}</p>
        <div v-if="files.length" class="mr-viewer-list">
          <button
            v-for="f in files"
            :key="f.id"
            type="button"
            class="mr-viewer-item"
            :disabled="openingId === f.id"
            @click="openFile(f)"
          >📄 {{ f.filename }} <span class="mr-viewer-item-size">({{ formatSize(f.file_size) }})</span></button>
        </div>
        <p v-else-if="!note" class="mr-viewer-empty">Thân chủ chưa đính kèm hồ sơ nào.</p>
        <p v-if="error" class="mr-viewer-error">{{ error }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiClient } from '../lib/apiClient';

const props = defineProps({
  bookingId: { type: String, required: true }
});

const open = ref(false);
const loaded = ref(false);
const loading = ref(false);
const files = ref([]);
const note = ref('');
const error = ref('');
const openingId = ref(null);

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

async function toggle() {
  open.value = !open.value;
  // Chỉ tải lúc mở lần đầu — tránh gọi API cho mọi booking trong danh sách dài.
  if (open.value && !loaded.value) {
    loading.value = true;
    error.value = '';
    try {
      const res = await apiClient.get(`/bookings/${props.bookingId}/medical-records`, { noCache: true });
      files.value = res?.files || [];
      note.value = res?.note || '';
      loaded.value = true;
    } catch (e) {
      error.value = e.message || 'Không tải được hồ sơ.';
    } finally {
      loading.value = false;
    }
  }
}

async function openFile(f) {
  openingId.value = f.id;
  error.value = '';
  try {
    const blob = await apiClient.getBlob(`/bookings/${props.bookingId}/medical-records/${f.id}/file`);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    error.value = e.message || 'Không mở được file.';
  } finally {
    openingId.value = null;
  }
}
</script>

<style scoped>
.mr-viewer { margin-top: 8px; }
.mr-viewer-toggle {
  display: inline-flex; align-items: center; gap: 6px; background: none; border: none;
  color: var(--mint-dark); font-weight: 700; font-size: 0.82rem; cursor: pointer; padding: 0;
}
.mr-viewer-caret { font-size: 0.65rem; }
.mr-viewer-body { margin-top: 8px; padding: 10px 12px; background: var(--cream); border-radius: 10px; }
.mr-viewer-note { font-size: 0.84rem; margin: 0 0 8px; white-space: pre-wrap; }
.mr-viewer-list { display: flex; flex-direction: column; gap: 6px; }
.mr-viewer-item {
  text-align: left; background: var(--warm-white); border: 1px solid var(--kraft-light); border-radius: 8px;
  padding: 6px 10px; font-size: 0.82rem; cursor: pointer; color: var(--text-primary);
}
.mr-viewer-item:disabled { opacity: 0.6; cursor: default; }
.mr-viewer-item-size { color: var(--text-light); }
.mr-viewer-empty { font-size: 0.82rem; color: var(--text-secondary); margin: 0; }
.mr-viewer-error { font-size: 0.8rem; color: var(--coral); margin: 6px 0 0; }
</style>
