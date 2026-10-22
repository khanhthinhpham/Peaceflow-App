<template>
  <div class="chat-thread">
    <div class="ct-messages" ref="messagesEl">
      <div v-if="!loading && !messages.length" class="ct-empty">{{ t('messages.threadEmpty') }}</div>
      <div v-for="msg in messages" :key="msg.id" class="ct-msg" :class="{ mine: msg.sender_user_id === currentUserId }">
        <div v-if="msg.attachment_id" class="ct-attachment">
          <img
            v-if="isImageMime(msg.attachment_mime)"
            :src="attachmentUrls[msg.id]"
            class="ct-attach-img"
            @click="attachmentUrls[msg.id] && openFull(attachmentUrls[msg.id])"
          >
          <audio v-else-if="isAudioMime(msg.attachment_mime)" :src="attachmentUrls[msg.id]" controls class="ct-attach-audio"></audio>
          <a v-else :href="attachmentUrls[msg.id]" :download="msg.attachment_filename" class="ct-attach-file">📎 {{ msg.attachment_filename || 'Tệp đính kèm' }}</a>
        </div>
        <div v-if="msg.content" class="ct-bubble">{{ msg.content }}</div>
        <div class="ct-time">{{ formatTime(msg.created_at) }}</div>
      </div>
    </div>

    <div v-if="pendingFile" class="ct-pending-file">
      <img v-if="pendingFilePreview" :src="pendingFilePreview" class="ct-pending-thumb">
      <span v-else class="ct-pending-name">📎 {{ pendingFile.name }}</span>
      <button type="button" class="ct-pending-cancel" @click="clearPendingFile">✕</button>
    </div>
    <div v-if="micError" class="ct-mic-error">{{ micError }}</div>

    <div class="ct-input-row">
      <input ref="fileInputEl" type="file" class="ct-file-input-hidden" @change="onFileSelected">
      <button type="button" class="ct-icon-btn" :disabled="isRecording" title="Đính kèm ảnh/file" @click="fileInputEl?.click()">📎</button>
      <button
        type="button"
        class="ct-icon-btn"
        :class="{ recording: isRecording }"
        :title="isRecording ? 'Dừng ghi âm' : 'Ghi âm'"
        @click="toggleRecording"
      >🎤</button>
      <input
        v-model="draft"
        class="ct-input"
        :placeholder="t('messages.inputPlaceholder')"
        maxlength="4000"
        :disabled="isRecording"
        @keydown.enter="submit"
      >
      <button type="button" class="ct-send-btn" :disabled="sending || (!draft.trim() && !pendingFile)" @click="submit">{{ t('messages.sendBtn') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  currentUserId: { type: String, default: null },
  loading: { type: Boolean, default: false },
  sending: { type: Boolean, default: false }
});
const emit = defineEmits(['send']);

const { t, locale } = useI18n();
const draft = ref('');
const messagesEl = ref(null);
const fileInputEl = ref(null);
const pendingFile = ref(null);
const pendingFilePreview = ref('');

function formatTime(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(v));
  } catch (_e) { return ''; }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  });
}

function isImageMime(mime) { return (mime || '').startsWith('image/'); }
function isAudioMime(mime) { return (mime || '').startsWith('audio/'); }
function openFull(url) { window.open(url, '_blank'); }

// Ô nhập file (chọn ảnh/file) ====
function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  setPendingFile(file);
  if (fileInputEl.value) fileInputEl.value.value = '';
}

function setPendingFile(file) {
  pendingFile.value = file;
  if (pendingFilePreview.value) URL.revokeObjectURL(pendingFilePreview.value);
  pendingFilePreview.value = isImageMime(file.type) ? URL.createObjectURL(file) : '';
}

function clearPendingFile() {
  pendingFile.value = null;
  if (pendingFilePreview.value) URL.revokeObjectURL(pendingFilePreview.value);
  pendingFilePreview.value = '';
}

// Ghi âm voice (MediaRecorder) ====
const isRecording = ref(false);
const micError = ref('');
let mediaRecorder = null;
let recordedChunks = [];
let micStream = null;

async function toggleRecording() {
  if (isRecording.value) {
    mediaRecorder?.stop();
    return;
  }
  micError.value = '';
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(micStream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      setPendingFile(new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
      micStream?.getTracks().forEach((track) => track.stop());
      micStream = null;
      isRecording.value = false;
    };
    mediaRecorder.start();
    isRecording.value = true;
  } catch (_e) {
    micError.value = 'Không truy cập được micro — kiểm tra quyền trình duyệt.';
  }
}

function submit() {
  const content = draft.value.trim();
  if ((!content && !pendingFile.value) || props.sending) return;
  emit('send', { content, file: pendingFile.value });
  draft.value = '';
  clearPendingFile();
}

// Tải trước bytes của các tin nhắn có đính kèm (ảnh/audio/file) qua endpoint có auth — không
// dùng thẳng <img src="/api/..."> được vì thẻ ảnh/audio gốc không tự gắn header Authorization,
// phải fetch qua apiClient (có Bearer token) rồi tạo blob URL, giống cách app đang làm cho
// ảnh bìa bài viết (AdminArticlesView.vue).
const attachmentUrls = reactive({});
async function resolveAttachmentUrls(list) {
  for (const msg of list) {
    if (!msg.attachment_id || attachmentUrls[msg.id]) continue;
    try {
      const blob = await apiClient.getBlob(`/chat/attachments/${msg.attachment_id}`);
      attachmentUrls[msg.id] = URL.createObjectURL(blob);
    } catch (_e) {
      // Bỏ qua — 1 đính kèm lỗi không nên chặn cả khung chat.
    }
  }
}

watch(() => props.messages.length, () => {
  scrollToBottom();
  resolveAttachmentUrls(props.messages);
});
resolveAttachmentUrls(props.messages);

onBeforeUnmount(() => {
  Object.values(attachmentUrls).forEach((url) => URL.revokeObjectURL(url));
  if (pendingFilePreview.value) URL.revokeObjectURL(pendingFilePreview.value);
  micStream?.getTracks().forEach((track) => track.stop());
});

defineExpose({ scrollToBottom });
</script>

<style scoped>
.chat-thread {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.ct-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ct-empty {
  margin: auto;
  font-size: 0.82rem;
  color: var(--text-light);
  font-style: italic;
}
.ct-msg {
  display: flex;
  flex-direction: column;
  max-width: 72%;
  align-self: flex-start;
}
.ct-msg.mine {
  align-self: flex-end;
  align-items: flex-end;
}
.ct-bubble {
  padding: 9px 13px;
  border-radius: var(--radius-sm, 10px);
  background: var(--cream, #fff8f0);
  border: 1.5px solid var(--kraft-light, #e8cba7);
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.ct-msg.mine .ct-bubble {
  background: var(--mint-light);
  border-color: var(--mint-dark);
}
.ct-attachment {
  margin-bottom: 4px;
}
.ct-attach-img {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--radius-sm, 10px);
  border: 1.5px solid var(--kraft-light, #e8cba7);
  cursor: pointer;
  display: block;
}
.ct-attach-audio {
  max-width: 220px;
  height: 36px;
}
.ct-attach-file {
  display: inline-block;
  padding: 9px 13px;
  border-radius: var(--radius-sm, 10px);
  background: var(--cream, #fff8f0);
  border: 1.5px solid var(--kraft-light, #e8cba7);
  font-size: 0.82rem;
  color: var(--text-primary);
  text-decoration: none;
}
.ct-time {
  font-size: 0.62rem;
  color: var(--text-light);
  margin-top: 3px;
  padding: 0 2px;
}
.ct-pending-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1.5px solid var(--kraft-light, #e8cba7);
  background: var(--cream, #fff8f0);
}
.ct-pending-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  border: 1.5px solid var(--kraft-light, #e8cba7);
}
.ct-pending-name {
  font-size: 0.78rem;
  color: var(--text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ct-pending-cancel {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--coral-dark);
  font-size: 0.85rem;
}
.ct-mic-error {
  padding: 6px 12px;
  font-size: 0.72rem;
  color: var(--coral-dark);
  background: var(--coral-light, #ffe5e5);
}
.ct-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-top: 1.5px solid var(--kraft-light, #e8cba7);
  background: var(--warm-white);
}
.ct-file-input-hidden {
  display: none;
}
.ct-icon-btn {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid var(--kraft-light, #e8cba7);
  background: var(--cream, #fff8f0);
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ct-icon-btn:hover {
  background: var(--mint-light);
  border-color: var(--mint);
}
.ct-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ct-icon-btn.recording {
  background: var(--coral-light, #ffe5e5);
  border-color: var(--coral);
  color: var(--coral-dark);
  animation: ct-pulse 1.2s ease-in-out infinite;
}
@keyframes ct-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.ct-input {
  flex: 1;
  padding: 9px 14px;
  border: 1.5px solid var(--kraft-light, #e8cba7);
  border-radius: 50px;
  background: var(--cream, #fff8f0);
  font-family: 'Nunito', sans-serif;
  font-size: 0.85rem;
  outline: none;
}
.ct-input:focus {
  border-color: var(--mint);
}
.ct-input:disabled {
  opacity: 0.6;
}
.ct-send-btn {
  padding: 9px 18px;
  border: 1.5px solid var(--mint-dark);
  border-radius: 50px;
  background: var(--mint);
  color: var(--text-primary);
  font-family: 'Nunito', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}
.ct-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ct-send-btn:not(:disabled):hover {
  background: var(--mint-dark);
  color: #fff;
}
</style>
