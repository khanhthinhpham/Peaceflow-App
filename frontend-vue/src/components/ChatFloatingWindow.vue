<template>
  <div class="chat-floating-window" :style="{ right: `${16 + index * 296}px` }">
    <div class="cfw-header">
      <div class="cfw-avatar">{{ conversation.avatar }}</div>
      <div class="cfw-name">{{ conversation.name }}</div>
      <button type="button" class="cfw-close" @click="chat.closeWindow(conversation.id)" aria-label="Đóng">✕</button>
    </div>
    <div class="cfw-body">
      <ChatThread
        :messages="messages"
        :current-user-id="auth.user?.id"
        :loading="messagesLoading"
        :sending="sending"
        @send="handleSend"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { useChatWidgetStore } from '../stores/chatWidget';
import { subscribeChatMessages, unsubscribeChatMessages } from '../lib/supabaseRealtime';
import ChatThread from './ChatThread.vue';

const props = defineProps({
  conversation: { type: Object, required: true },
  index: { type: Number, required: true }
});

const auth = useAuthStore();
const chat = useChatWidgetStore();

const messages = ref([]);
const messagesLoading = ref(false);
const sending = ref(false);

async function loadMessages() {
  messagesLoading.value = true;
  try {
    messages.value = await apiClient.get(`/chat/conversations/${props.conversation.id}/messages`, { noCache: true });
    await apiClient.post(`/chat/conversations/${props.conversation.id}/read`, {});
  } catch (_e) {
    messages.value = [];
  } finally {
    messagesLoading.value = false;
  }
}

async function handleSend({ content, file }) {
  sending.value = true;
  try {
    let created;
    if (file) {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('attachment', file);
      created = await apiClient.postForm(`/chat/conversations/${props.conversation.id}/messages`, fd);
    } else {
      created = await apiClient.post(`/chat/conversations/${props.conversation.id}/messages`, { content });
    }
    messages.value.push(created);
  } catch (_e) {
    // v1: lỗi mạng thì người dùng gõ lại.
  } finally {
    sending.value = false;
  }
}

function onRealtimeMessage(row) {
  if (messages.value.some((m) => m.id === row.id)) return;
  messages.value.push(row);
  if (row.sender_user_id !== auth.user?.id) {
    apiClient.post(`/chat/conversations/${props.conversation.id}/read`, {}).catch(() => {});
  }
}

onMounted(() => {
  loadMessages();
  subscribeChatMessages(props.conversation.id, onRealtimeMessage);
});
onBeforeUnmount(() => unsubscribeChatMessages(props.conversation.id));
</script>

<style scoped>
.chat-floating-window {
  position: fixed;
  bottom: 0;
  z-index: 250;
  width: 280px;
  height: 380px;
  display: flex;
  flex-direction: column;
  background: var(--warm-white);
  border: 2px solid var(--kraft-light, #e8cba7);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  box-shadow: 2px 0px 10px rgba(74, 55, 40, 0.12);
  overflow: hidden;
}
.cfw-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1.5px solid var(--kraft-light, #e8cba7);
  background: var(--mint-light);
  flex-shrink: 0;
}
.cfw-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--lavender-light);
  border: 1.5px solid var(--kraft-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}
.cfw-name {
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cfw-close {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.cfw-body {
  flex: 1;
  min-height: 0;
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .chat-floating-window {
    display: none !important;
  }
}
</style>
