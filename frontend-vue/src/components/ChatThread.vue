<template>
  <div class="chat-thread">
    <div class="ct-messages" ref="messagesEl">
      <div v-if="!loading && !messages.length" class="ct-empty">{{ t('messages.threadEmpty') }}</div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        :ref="(el) => setMsgRef(msg.id, el)"
        class="ct-msg"
        :class="{ mine: msg.sender_user_id === currentUserId, 'show-actions': actionMessageId === msg.id }"
        @touchstart.passive="startTouch(msg, $event)"
        @touchmove.passive="onTouchMove(msg, $event)"
        @touchend="endTouch(msg, $event)"
        @touchcancel="resetTouch(msg)"
        @contextmenu.prevent
      >
        <div class="ct-msg-row">
          <div class="ct-message-content" :class="{ 'has-reply': msg.reply_to_message_id }">
            <div v-if="msg.reply_to_message_id" class="ct-reply-quote" @click.stop="jumpToMessage(msg.reply_to_message_id)">
              <span class="ct-reply-quote-label">↩</span>
              <span>{{ replyPreview(msg) }}</span>
            </div>
            <div v-if="msg.attachment_id" class="ct-attachment">
              <div v-if="attachmentErrors[msg.id]" class="ct-attach-error">⚠️ Không tải được tệp</div>
              <div v-else-if="!attachmentUrls[msg.id]" class="ct-attach-loading">Đang tải...</div>
              <img
                v-else-if="isImageMime(msg.attachment_mime)"
                :src="attachmentUrls[msg.id]"
                class="ct-attach-img"
                @click="openFull(attachmentUrls[msg.id])"
              >
              <audio v-else-if="isAudioMime(msg.attachment_mime)" :src="attachmentUrls[msg.id]" controls controlslist="nodownload noplaybackrate" class="ct-attach-audio"></audio>
              <a v-else :href="attachmentUrls[msg.id]" :download="msg.attachment_filename" class="ct-attach-file">📎 {{ msg.attachment_filename || 'Tệp đính kèm' }}</a>
            </div>
            <div v-if="msg.content" class="ct-bubble">{{ msg.content }}</div>
          </div>
          <button type="button" class="ct-reply-btn" :aria-label="t('messages.reply')" :title="t('messages.reply')" @click="chooseReply(msg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17 4 12l5-5"/><path d="M20 18v-1a5 5 0 0 0-5-5H4"/></svg>
          </button>
        </div>
        <div class="ct-time">{{ formatTime(msg.created_at) }}</div>
      </div>
    </div>

    <div v-if="pendingFile" class="ct-pending-file">
      <img v-if="pendingFilePreview" :src="pendingFilePreview" class="ct-pending-thumb">
      <span v-else class="ct-pending-name">📎 {{ pendingFile.name }}</span>
      <button type="button" class="ct-pending-cancel" @click="clearPendingFile">✕</button>
    </div>
    <div v-if="micError" class="ct-mic-error">{{ micError }}</div>

    <div v-if="replyTo" class="ct-replying">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17 4 12l5-5"/><path d="M20 18v-1a5 5 0 0 0-5-5H4"/></svg>
      <span>{{ replyPreview(replyTo) }}</span>
      <button type="button" :aria-label="t('messages.cancelReply')" :title="t('messages.cancelReply')" @click="replyTo = null">×</button>
    </div>

    <div class="ct-input-row">
      <input ref="fileInputEl" type="file" class="ct-file-input-hidden" @change="onFileSelected">
      <button type="button" class="ct-icon-btn" :disabled="isRecording" title="Đính kèm ảnh/file" @click="fileInputEl?.click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      </button>
      <button
        type="button"
        class="ct-icon-btn"
        :class="{ recording: isRecording }"
        :title="isRecording ? 'Dừng ghi âm' : 'Ghi âm'"
        @click="toggleRecording"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4M8 23h8"/></svg>
      </button>
      <input
        ref="inputEl"
        v-model="draft"
        class="ct-input"
        :placeholder="t('messages.inputPlaceholder')"
        maxlength="4000"
        :disabled="isRecording"
        @keydown.enter="submit"
      >
      <button type="button" class="ct-send-btn" :disabled="sending || (!draft.trim() && !pendingFile)" @click="submit" :title="t('messages.sendBtn')">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </div>
  </div>
</template>

<script>
// Cache blob URL tệp đính kèm theo attachment_id, dùng chung mọi ChatThread trong phiên (trang
// Tin nhắn + cửa sổ chat nổi) — tệp không đổi sau khi gửi nên không cần tải lại.
const sharedAttachmentUrls = new Map();
const pendingAttachmentLoads = new Map();
</script>

<script setup>
import { ref, reactive, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
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
const replyTo = ref(null);
const actionMessageId = ref(null);
const inputEl = ref(null);
let holdTimer = null;
let touchStart = null;

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
function replyPreview(message) {
  const original = props.messages.find((item) => item.id === message.reply_to_message_id);
  return message.reply_to_content || original?.content || message.reply_to_attachment_filename || original?.attachment_filename || message.content || message.attachment_filename || '';
}

function jumpToMessage(id) {
  const el = msgEls.get(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('flash-highlight');
  setTimeout(() => el.classList.remove('flash-highlight'), 900);
}

function chooseReply(message) {
  cancelHold();
  replyTo.value = message;
  actionMessageId.value = null;
  // Giống Messenger: bấm reply thì focus thẳng vào ô nhập để gõ luôn, không cần chạm thêm
  // lần nữa — nextTick vì ô nhập có thể đang :disabled (đang ghi âm) lúc gọi, focus ngay sẽ
  // không ăn nếu DOM chưa cập nhật xong trạng thái disabled.
  nextTick(() => inputEl.value?.focus());
}

// Vuốt ngang 1 tin nhắn để reply nhanh (giống Messenger) — tin nhắn kéo theo ngón tay (giới
// hạn khoảng kéo), thả tay ra thì bật lại vị trí cũ; nếu kéo đủ xa (>SWIPE_THRESHOLD) thì kích
// hoạt reply luôn lúc bật lại. Giữ lâu (không di chuyển) vẫn hiện nút reply như trước.
const SWIPE_THRESHOLD = 54;
const SWIPE_MAX = 70;
const msgEls = new Map();
let isSwiping = false;

function setMsgRef(id, el) {
  if (el) msgEls.set(id, el);
  else msgEls.delete(id);
}

function startTouch(message, event) {
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
  isSwiping = false;
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    actionMessageId.value = message.id;
    holdTimer = null;
  }, 450);
}

function onTouchMove(message, event) {
  if (!touchStart) return;
  const touch = event.touches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (!isSwiping) {
    // Chưa rõ hướng kéo (có thể đang cuộn dọc danh sách) — chỉ coi là vuốt ngang khi di
    // chuyển đủ xa VÀ nghiêng hẳn về trục ngang.
    if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) return;
    isSwiping = true;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  }
  const el = msgEls.get(message.id);
  if (!el) return;
  const clamped = Math.max(Math.min(dx, SWIPE_MAX), -SWIPE_MAX);
  el.style.transition = 'none';
  el.style.transform = `translateX(${clamped}px)`;
}

function endTouch(message, event) {
  const touch = event.changedTouches[0];
  const dx = touchStart ? touch.clientX - touchStart.x : 0;
  const dy = touchStart ? touch.clientY - touchStart.y : 0;
  const wasSwiping = isSwiping;
  const wasHeld = !holdTimer;
  snapBack(message.id);
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
  touchStart = null;
  isSwiping = false;
  if (wasSwiping && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
    chooseReply(message);
    return;
  }
  // Chạm nhanh (chưa đủ 450ms để kích hoạt giữ lâu) cũng hiện/ẩn nút reply luôn — không bắt
  // người dùng phải giữ lâu mới thấy nút, vì trên di động thao tác chạm nhanh thường gặp hơn.
  if (!wasSwiping && !wasHeld) {
    actionMessageId.value = actionMessageId.value === message.id ? null : message.id;
  }
}

function snapBack(id) {
  const el = msgEls.get(id);
  if (!el) return;
  el.style.transition = 'transform 0.2s ease';
  el.style.transform = '';
}

function resetTouch(message) {
  snapBack(message.id);
  cancelHold();
}

function cancelHold() {
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
  touchStart = null;
  isSwiping = false;
}

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
  emit('send', { content, file: pendingFile.value, replyToMessageId: replyTo.value?.id || null });
  draft.value = '';
  clearPendingFile();
  replyTo.value = null;
}

// Tải trước bytes của các tin nhắn có đính kèm (ảnh/audio/file) qua endpoint có auth — không
// dùng thẳng <img src="/api/..."> được vì thẻ ảnh/audio gốc không tự gắn header Authorization,
// phải fetch qua apiClient (có Bearer token) rồi tạo blob URL, giống cách app đang làm cho
// ảnh bìa bài viết (AdminArticlesView.vue).
const attachmentUrls = reactive({});
const attachmentErrors = reactive({});
// Trước đây tải lần lượt từng tệp (tệp sau chờ tệp trước) và tải lại mỗi lần mở hội thoại. Giờ:
// tải song song tối đa 4 tệp, ưu tiên tin mới nhất (đang hiện ở cuối khung), và giữ blob URL
// theo attachment_id trong cả phiên (sharedAttachmentUrls ở cấp module) để mở lại là hiện ngay.
const ATTACHMENT_CONCURRENCY = 4;
async function loadAttachment(msg) {
  const cachedUrl = sharedAttachmentUrls.get(msg.attachment_id);
  if (cachedUrl) { attachmentUrls[msg.id] = cachedUrl; return; }
  try {
    let pending = pendingAttachmentLoads.get(msg.attachment_id);
    if (!pending) {
      pending = apiClient.getBlob(`/chat/attachments/${msg.attachment_id}`).then((blob) => URL.createObjectURL(blob));
      pendingAttachmentLoads.set(msg.attachment_id, pending);
    }
    const url = await pending;
    sharedAttachmentUrls.set(msg.attachment_id, url);
    attachmentUrls[msg.id] = url;
  } catch (e) {
    console.error('[chat attachment] tải thất bại cho message', msg.id, e);
    attachmentErrors[msg.id] = true;
  } finally {
    pendingAttachmentLoads.delete(msg.attachment_id);
  }
}
async function resolveAttachmentUrls(list) {
  const queue = list
    .filter((msg) => msg.attachment_id && !attachmentUrls[msg.id] && !attachmentErrors[msg.id])
    .reverse();
  const worker = async () => {
    while (queue.length) await loadAttachment(queue.shift());
  };
  await Promise.all(Array.from({ length: Math.min(ATTACHMENT_CONCURRENCY, queue.length) }, worker));
}

watch(() => props.messages.length, () => {
  scrollToBottom();
  resolveAttachmentUrls(props.messages);
});
resolveAttachmentUrls(props.messages);

onBeforeUnmount(() => {
  // Không revoke blob URL của tệp đính kèm: chúng được giữ lại trong sharedAttachmentUrls để
  // dùng lại khi mở lại hội thoại trong cùng phiên.
  if (pendingFilePreview.value) URL.revokeObjectURL(pendingFilePreview.value);
  micStream?.getTracks().forEach((track) => track.stop());
  cancelHold();
  document.removeEventListener('touchstart', closeActionsOutside);
});

// Chạm ra ngoài tin nhắn đang mở nút reply (kể cả ra ngoài hẳn khung chat, không chỉ trong
// danh sách tin nhắn) thì ẩn nút đi luôn — tránh nút bị "dính" mãi trên di động.
function closeActionsOutside(event) {
  if (!actionMessageId.value) return;
  const activeEl = msgEls.get(actionMessageId.value);
  if (activeEl && !activeEl.contains(event.target)) actionMessageId.value = null;
}
onMounted(() => {
  document.addEventListener('touchstart', closeActionsOutside, { passive: true });
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
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 72%;
  align-self: flex-start;
}
.ct-msg.mine {
  align-self: flex-end;
  align-items: flex-end;
}
.ct-msg-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ct-msg.mine .ct-msg-row {
  flex-direction: row-reverse;
}
.ct-message-content {
  min-width: 0;
  flex-shrink: 1;
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
.ct-message-content.has-reply {
  overflow: hidden;
  border: 1.5px solid var(--kraft-light, #e8cba7);
  border-radius: var(--radius-sm, 10px);
  background: var(--cream, #fff8f0);
}
.ct-message-content.has-reply .ct-bubble {
  border: none;
  border-radius: 0;
}
.ct-msg.mine .ct-bubble {
  background: var(--mint-light);
  border-color: var(--mint-dark);
}
.ct-msg.mine .ct-message-content.has-reply {
  border-color: var(--mint-dark);
  background: var(--mint-light);
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
  display: block;
  width: 240px;
  height: 32px;
  border-radius: var(--radius-sm, 10px);
  background: var(--cream, #fff8f0);
  border: 1.5px solid var(--kraft-light, #e8cba7);
}
.ct-msg.mine .ct-attach-audio {
  background: var(--mint-light);
  border-color: var(--mint-dark);
}
/* Ẩn nút menu 3 chấm và thanh chỉnh âm lượng, thu nhỏ chữ thời gian — chỉ Chromium/WebKit
   hỗ trợ các pseudo-element này để tuỳ biến giao diện <audio> gốc trình duyệt. */
.ct-attach-audio::-webkit-media-controls-overflow-button,
.ct-attach-audio::-webkit-media-controls-mute-button,
.ct-attach-audio::-webkit-media-controls-volume-slider,
.ct-attach-audio::-webkit-media-controls-volume-control-container {
  display: none !important;
}
.ct-attach-audio::-webkit-media-controls-current-time-display,
.ct-attach-audio::-webkit-media-controls-time-remaining-display {
  font-size: 11px;
}
.ct-msg:has(.ct-attach-audio) {
  max-width: 88%;
}
.ct-attach-loading,
.ct-attach-error {
  padding: 9px 13px;
  border-radius: var(--radius-sm, 10px);
  background: var(--cream, #fff8f0);
  border: 1.5px solid var(--kraft-light, #e8cba7);
  font-size: 0.78rem;
  color: var(--text-light);
}
.ct-attach-error {
  color: var(--coral-dark);
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
  max-height: 0;
  margin-top: 0;
  padding: 0 2px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.15s ease, max-height 0.15s ease, margin 0.15s ease;
}
.ct-msg:focus-within .ct-time,
.ct-msg.show-actions .ct-time {
  max-height: 16px;
  margin-top: 3px;
  opacity: 1;
}
@media (hover: hover) {
  .ct-msg:hover .ct-time {
    max-height: 16px;
    margin-top: 3px;
    opacity: 1;
  }
}
.ct-reply-btn {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--warm-white);
  color: var(--text-secondary);
  box-shadow: 0 1px 4px rgba(74, 55, 40, 0.18);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.ct-reply-btn svg { width: 17px; height: 17px; }
.ct-msg:focus-within .ct-reply-btn,
.ct-msg.show-actions .ct-reply-btn {
  opacity: 1;
  pointer-events: auto;
}
@media (hover: hover) {
  .ct-msg:hover .ct-reply-btn {
    opacity: 1;
    pointer-events: auto;
  }
}
.ct-reply-quote {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 6px 8px 0;
  padding-bottom: 3px;
  color: currentColor;
  font-size: 0.74rem;
  font-style: italic;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.ct-reply-quote-label { flex: 0 0 auto; font-size: 0.8rem; opacity: 0.8; }
.ct-reply-quote span:last-child { overflow: hidden; text-overflow: ellipsis; }
@keyframes ct-flash-highlight {
  0%, 100% { background-color: transparent; }
  30% { background-color: var(--mint-light, rgba(120, 190, 160, 0.35)); }
}
.ct-msg.flash-highlight .ct-bubble,
.ct-msg.flash-highlight .ct-message-content.has-reply,
.ct-msg.flash-highlight .ct-attach-audio,
.ct-msg.flash-highlight .ct-attach-file,
.ct-msg.flash-highlight .ct-attach-img {
  animation: ct-flash-highlight 0.9s ease;
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
.ct-replying {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-top: 1.5px solid var(--kraft-light, #e8cba7);
  background: var(--cream, #fff8f0);
  color: var(--text-secondary);
  font-size: 0.76rem;
}
.ct-replying svg { width: 17px; height: 17px; flex: 0 0 auto; }
.ct-replying span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ct-replying button { border: none; background: none; color: var(--text-secondary); font-size: 1.1rem; cursor: pointer; }
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
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ct-icon-btn svg {
  width: 20px;
  height: 20px;
}
.ct-icon-btn:hover {
  color: var(--mint-dark);
}
.ct-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ct-icon-btn.recording {
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
  border: none;
  border-radius: 50px;
  background: var(--cream, #fff8f0);
  font-family: 'Nunito', sans-serif;
  font-size: 0.85rem;
  outline: none;
}
.ct-input:disabled {
  opacity: 0.6;
}
.ct-send-btn {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--mint);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ct-send-btn svg {
  width: 16px;
  height: 16px;
}
.ct-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ct-send-btn:not(:disabled):hover {
  background: var(--mint-dark);
  color: #fff;
}

/* ---- Đồng bộ với trang tổng quan: bong bóng phẳng không viền (của mình: xanh thương hiệu nhạt,
   của người kia: nền ngà), ô nhập bo mềm, nút gửi màu thương hiệu, đường kẻ mảnh liền nét. ---- */
.chat-thread { font-family: var(--font-body); color: var(--color-text); }
.ct-empty { font-size: 14px; color: var(--color-text-subtle); }
.ct-bubble, .ct-message-content.has-reply, .ct-attach-loading, .ct-attach-file, .ct-attach-audio {
  border: none; border-radius: 16px; background: var(--color-canvas); color: var(--color-text);
}
.ct-bubble { font-size: 14.5px; line-height: 1.5; padding: 10px 14px; }
.ct-message-content.has-reply .ct-bubble { border-radius: 0; background: transparent; }
.ct-msg.mine .ct-bubble, .ct-msg.mine .ct-message-content.has-reply, .ct-msg.mine .ct-attach-audio {
  background: var(--color-brand-soft); border: none;
}
.ct-msg.mine .ct-message-content.has-reply .ct-bubble { background: transparent; }
.ct-msg:not(.mine) .ct-bubble { border-bottom-left-radius: 6px; }
.ct-msg.mine .ct-bubble { border-bottom-right-radius: 6px; }
.ct-attach-img { border: none; border-radius: 14px; }
.ct-attach-error { border: none; border-radius: 14px; background: var(--color-danger-soft); color: var(--color-danger); }
.ct-time { font-size: 11px; color: var(--color-text-subtle); }
.ct-reply-btn { background: var(--color-surface); color: var(--color-text-muted); box-shadow: var(--shadow-soft); }
.ct-reply-btn:hover { color: var(--color-brand); }
.ct-pending-file, .ct-replying { border-top: 1px solid var(--color-surface-muted); background: var(--color-canvas); color: var(--color-text-muted); }
.ct-pending-thumb { border: none; border-radius: var(--radius-control); }
.ct-pending-cancel, .ct-mic-error { color: var(--color-danger); }
.ct-mic-error { background: var(--color-danger-soft); }
.ct-input-row { border-top: 1px solid var(--color-surface-muted); background: var(--color-surface); padding: 12px 14px; gap: 8px; }
.ct-icon-btn { width: 38px; height: 38px; border-radius: var(--radius-control); color: var(--color-text-muted); }
.ct-icon-btn:hover { color: var(--color-brand); background: var(--color-canvas); }
.ct-icon-btn.recording { color: var(--color-danger); }
.ct-input {
  min-height: 40px; padding: 9px 14px; border: 1px solid transparent; border-radius: var(--radius-control);
  background: var(--color-canvas); font-family: inherit; font-size: 14.5px; color: var(--color-text);
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.ct-input:focus { border-color: var(--color-brand); background: var(--color-surface); }
.ct-send-btn { width: 40px; height: 40px; border-radius: var(--radius-control); background: var(--color-brand); color: var(--color-on-brand); }
.ct-send-btn:not(:disabled):hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); }
.ct-icon-btn:focus-visible, .ct-send-btn:focus-visible, .ct-reply-btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
</style>
