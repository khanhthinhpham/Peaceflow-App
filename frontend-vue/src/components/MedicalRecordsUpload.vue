<template>
  <div class="mr-upload">
    <div class="mr-upload-title">📎 Hồ sơ khám cũ (nếu có)</div>
    <p class="mr-upload-hint">Bệnh án, đơn thuốc, chỉ số thăm khám từ nơi khác — giúp chuyên gia hiểu tình trạng của bạn hơn. Hoàn toàn tuỳ chọn, có thể bỏ qua. Dữ liệu được mã hoá, chỉ chuyên gia buổi hẹn này xem được.</p>

    <div v-if="files.length" class="mr-upload-list">
      <div v-for="f in files" :key="f.id" class="mr-upload-item">
        📄 {{ f.filename }} <span class="mr-upload-item-size">({{ formatSize(f.file_size) }})</span>
      </div>
    </div>

    <label class="mr-upload-picker">
      <input ref="fileInput" type="file" multiple accept="image/*,application/pdf" style="display:none;" @change="onPick">
      <span>+ Thêm ảnh/PDF</span>
    </label>
    <div v-if="pending.length" class="mr-upload-pending">
      <span v-for="(p, i) in pending" :key="i" class="mr-upload-pending-chip">
        {{ p.name }} <button type="button" @click="pending.splice(i, 1)">✕</button>
      </span>
    </div>

    <textarea
      v-model="note"
      class="mr-upload-note"
      rows="2"
      placeholder="Ghi chú chung cho hồ sơ đính kèm (ví dụ: đơn thuốc từ BV X, kê ngày ...)"
      maxlength="2000"
    ></textarea>

    <div class="mr-upload-actions">
      <span v-if="message" class="mr-upload-message" :class="{ error: messageError }">{{ message }}</span>
      <button type="button" class="btn-outline" :disabled="submitting || (!pending.length && !note.trim())" @click="submit">
        {{ submitting ? 'Đang gửi...' : 'Gửi hồ sơ' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '../lib/apiClient';

const props = defineProps({
  bookingId: { type: String, required: true }
});

const files = ref([]);
const pending = ref([]);
const note = ref('');
const submitting = ref(false);
const message = ref('');
const messageError = ref(false);
const fileInput = ref(null);

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

function onPick(e) {
  const picked = Array.from(e.target.files || []);
  // Server chặn > 5 file/lượt gửi và > 5MB/file — báo trước để người dùng không phải chờ
  // request thất bại mới biết.
  const tooBig = picked.filter((f) => f.size > 5 * 1024 * 1024);
  if (tooBig.length) {
    message.value = `File "${tooBig[0].name}" vượt quá 5MB, vui lòng chọn file nhỏ hơn.`;
    messageError.value = true;
  } else {
    message.value = '';
  }
  pending.value = pending.value.concat(picked.filter((f) => f.size <= 5 * 1024 * 1024)).slice(0, 5);
  if (fileInput.value) fileInput.value.value = '';
}

async function loadExisting() {
  try {
    const res = await apiClient.get(`/bookings/${props.bookingId}/medical-records`, { noCache: true });
    files.value = res?.files || [];
    if (res?.note) note.value = res.note;
  } catch (_e) {
    // Chưa có gì đính kèm hoặc chưa tạo xong booking — bỏ qua, không chặn form.
  }
}

async function submit() {
  submitting.value = true;
  message.value = '';
  messageError.value = false;
  try {
    const formData = new FormData();
    pending.value.forEach((f) => formData.append('files', f));
    if (note.value.trim()) formData.set('note', note.value.trim());

    await apiClient.postForm(`/bookings/${props.bookingId}/medical-records`, formData);
    pending.value = [];
    message.value = '✓ Đã gửi hồ sơ.';
    await loadExisting();
  } catch (error) {
    message.value = error.message || 'Không gửi được hồ sơ, vui lòng thử lại.';
    messageError.value = true;
  } finally {
    submitting.value = false;
  }
}

onMounted(loadExisting);
</script>

<style scoped>
.mr-upload {
  margin-top: 14px;
  padding: 14px;
  border: 1.5px dashed var(--kraft-light);
  border-radius: var(--radius-sm);
  background: var(--warm-white);
  text-align: left;
}
.mr-upload-title { font-weight: 800; font-size: 0.92rem; margin-bottom: 4px; }
.mr-upload-hint { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 10px; }
.mr-upload-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.mr-upload-item { font-size: 0.82rem; }
.mr-upload-item-size { color: var(--text-light); }
.mr-upload-picker {
  display: inline-flex; align-items: center; padding: 7px 14px; border: 1.5px solid var(--mint-dark);
  border-radius: 999px; background: var(--mint-light); color: var(--text-primary); font-weight: 700;
  font-size: 0.82rem; cursor: pointer;
}
.mr-upload-pending { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.mr-upload-pending-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px;
  background: var(--cream); font-size: 0.78rem; border: 1px solid var(--kraft-light);
}
.mr-upload-pending-chip button { border: none; background: none; cursor: pointer; color: var(--coral); font-size: 0.8rem; padding: 0; }
.mr-upload-note {
  width: 100%; box-sizing: border-box; margin-top: 10px; border: 1.5px solid var(--kraft-light);
  border-radius: 12px; padding: 8px 10px; font-family: inherit; font-size: 0.85rem; resize: vertical;
}
.mr-upload-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 10px; }
.mr-upload-message { font-size: 0.8rem; color: var(--mint-dark); }
.mr-upload-message.error { color: var(--coral); }
</style>
