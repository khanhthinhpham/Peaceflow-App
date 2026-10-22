<template>
  <div class="rte">
    <div class="rte-toolbar">
      <button type="button" class="rte-btn" title="Đậm" @mousedown.prevent="exec('bold')"><strong>B</strong></button>
      <button type="button" class="rte-btn" title="Nghiêng" @mousedown.prevent="exec('italic')"><em>I</em></button>
      <button type="button" class="rte-btn" title="Gạch chân" @mousedown.prevent="exec('underline')"><u>U</u></button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" title="Căn trái" @mousedown.prevent="exec('justifyLeft')">⬅</button>
      <button type="button" class="rte-btn" title="Căn giữa" @mousedown.prevent="exec('justifyCenter')">↔</button>
      <button type="button" class="rte-btn" title="Căn phải" @mousedown.prevent="exec('justifyRight')">➡</button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" title="Danh sách đánh số" @mousedown.prevent="exec('insertOrderedList')">1.</button>
      <button type="button" class="rte-btn" title="Danh sách gạch đầu dòng" @mousedown.prevent="exec('insertUnorderedList')">•</button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" title="Chèn liên kết" @mousedown.prevent="insertLink">🔗</button>
      <button type="button" class="rte-btn" title="Xoá định dạng" @mousedown.prevent="exec('removeFormat')">⌫</button>
    </div>
    <div
      ref="editorEl"
      class="rte-body admin-input"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="onInput"
      @blur="onInput"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);

const editorEl = ref(null);

function exec(command, value = null) {
  editorEl.value?.focus();
  document.execCommand(command, false, value);
  onInput();
}

function insertLink() {
  const url = window.prompt('Nhập địa chỉ liên kết (URL):', 'https://');
  if (!url) return;
  exec('createLink', url);
}

function onInput() {
  emit('update:modelValue', editorEl.value?.innerHTML || '');
}

// Chỉ đồng bộ innerHTML từ ngoài vào khi khác nội dung hiện có trong editor (vd khi mở form
// sửa bài, hoặc reset form) — không set lại mỗi lần modelValue đổi để tránh nhảy con trỏ khi
// người dùng đang gõ (input event tự phát ra modelValue mới nhưng DOM đã khớp sẵn).
watch(() => props.modelValue, (val) => {
  if (editorEl.value && editorEl.value.innerHTML !== (val || '')) {
    editorEl.value.innerHTML = val || '';
  }
});

onMounted(() => {
  if (editorEl.value) editorEl.value.innerHTML = props.modelValue || '';
});
</script>

<style scoped>
.rte {
  border: 1.5px solid var(--kraft-light, #e8cba7);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.rte-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: var(--cream, #fff8f0);
  border-bottom: 1.5px solid var(--kraft-light, #e8cba7);
  flex-wrap: wrap;
}
.rte-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 0.82rem;
  line-height: 1;
  color: var(--text-primary, #4a3728);
}
.rte-btn:hover {
  background: #fff;
  border-color: var(--kraft-light, #e8cba7);
}
.rte-sep {
  width: 1px;
  height: 18px;
  background: var(--kraft-light, #e8cba7);
  margin: 0 2px;
}
.rte-body {
  min-height: 180px;
  max-height: 480px;
  overflow-y: auto;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.6;
  outline: none;
  border: none;
  border-radius: 0;
}
.rte-body:empty::before {
  content: attr(data-placeholder);
  color: var(--text-light, #b0a08f);
}
.rte-body :deep(p) {
  margin: 0 0 10px;
}
.rte-body :deep(ul),
.rte-body :deep(ol) {
  margin: 0 0 10px;
  padding-left: 24px;
}
</style>
