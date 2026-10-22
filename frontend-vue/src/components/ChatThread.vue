<template>
  <div class="chat-thread">
    <div class="ct-messages" ref="messagesEl">
      <div v-if="!loading && !messages.length" class="ct-empty">{{ t('messages.threadEmpty') }}</div>
      <div v-for="msg in messages" :key="msg.id" class="ct-msg" :class="{ mine: msg.sender_user_id === currentUserId }">
        <div class="ct-bubble">{{ msg.content }}</div>
        <div class="ct-time">{{ formatTime(msg.created_at) }}</div>
      </div>
    </div>
    <div class="ct-input-row">
      <input
        v-model="draft"
        class="ct-input"
        :placeholder="t('messages.inputPlaceholder')"
        maxlength="4000"
        @keydown.enter="submit"
      >
      <button type="button" class="ct-send-btn" :disabled="sending || !draft.trim()" @click="submit">{{ t('messages.sendBtn') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

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

function submit() {
  const content = draft.value.trim();
  if (!content || props.sending) return;
  emit('send', content);
  draft.value = '';
}

watch(() => props.messages.length, scrollToBottom);
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
.ct-time {
  font-size: 0.62rem;
  color: var(--text-light);
  margin-top: 3px;
  padding: 0 2px;
}
.ct-input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1.5px solid var(--kraft-light, #e8cba7);
  background: var(--warm-white);
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
