<template>
  <main class="expert-main" style="padding:0;">
    <div class="expert-messages-layout" :class="{ 'show-thread': activeId }">
      <aside class="conv-list">
        <h1 class="conv-list-title">{{ t('messages.title') }}</h1>
        <div v-if="loading" style="padding:16px;font-size:0.8rem;color:var(--text-light);">...</div>
        <div v-else-if="!conversations.length" class="conv-empty">{{ t('messages.listEmpty') }}</div>
        <button
          v-for="c in conversations"
          :key="c.id"
          type="button"
          class="conv-item"
          :class="{ active: c.id === activeId }"
          @click="selectConversation(c.id)"
        >
          <div class="conv-avatar">🙂</div>
          <div class="conv-info">
            <div class="conv-name">{{ c.client_name }}</div>
            <div class="conv-preview">{{ c.last_message_preview || '' }}</div>
          </div>
          <div v-if="c.unread_count > 0" class="conv-badge">{{ c.unread_count }}</div>
        </button>
      </aside>

      <section class="thread-pane">
        <div v-if="activeId" class="thread-header">
          <button type="button" class="thread-back" @click="activeId = null">{{ t('messages.backToList') }}</button>
          <div class="thread-header-name">{{ activeConversation?.client_name }}</div>
        </div>
        <ChatThread
          v-if="activeId"
          :messages="messages"
          :current-user-id="auth.user?.id"
          :loading="messagesLoading"
          :sending="sending"
          @send="handleSend"
        />
        <div v-else class="thread-placeholder">{{ t('messages.selectConversation') }}</div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/auth';
import { subscribeChatMessages, unsubscribeChatMessages } from '../../lib/supabaseRealtime';
import ChatThread from '../../components/ChatThread.vue';

const { t } = useI18n();
const route = useRoute();
const auth = useAuthStore();

const conversations = ref([]);
const loading = ref(true);
const activeId = ref(null);
const messages = ref([]);
const messagesLoading = ref(false);
const sending = ref(false);

const activeConversation = computed(() => conversations.value.find((c) => c.id === activeId.value));

async function loadConversations() {
  loading.value = true;
  try {
    conversations.value = await apiClient.get('/expert-portal/chat/conversations', { noCache: true });
  } catch (_e) {
    // Danh sách rỗng là đủ.
  } finally {
    loading.value = false;
  }
}

async function loadMessages(conversationId) {
  messagesLoading.value = true;
  try {
    messages.value = await apiClient.get(`/chat/conversations/${conversationId}/messages`, { noCache: true });
    await apiClient.post(`/chat/conversations/${conversationId}/read`, {});
    const conv = conversations.value.find((c) => c.id === conversationId);
    if (conv) conv.unread_count = 0;
  } catch (_e) {
    messages.value = [];
  } finally {
    messagesLoading.value = false;
  }
}

function selectConversation(id) {
  activeId.value = id;
}

watch(activeId, (id, prevId) => {
  unsubscribeChatMessages();
  if (prevId) messages.value = [];
  if (!id) return;
  loadMessages(id);
  subscribeChatMessages(id, (row) => {
    if (messages.value.some((m) => m.id === row.id)) return;
    messages.value.push(row);
    if (row.sender_user_id !== auth.user?.id) {
      apiClient.post(`/chat/conversations/${id}/read`, {}).catch(() => {});
    }
  });
});

async function handleSend(content) {
  if (!activeId.value) return;
  sending.value = true;
  try {
    const created = await apiClient.post(`/chat/conversations/${activeId.value}/messages`, { content });
    messages.value.push(created);
    const conv = conversations.value.find((c) => c.id === activeId.value);
    if (conv) conv.last_message_preview = content.slice(0, 200);
  } catch (_e) {
    // v1: lỗi mạng thì người dùng gõ lại, không rollback input.
  } finally {
    sending.value = false;
  }
}

onMounted(async () => {
  await loadConversations();
  if (route.query.conversation) selectConversation(route.query.conversation);
});
onBeforeUnmount(() => unsubscribeChatMessages());
</script>

<style scoped>
.expert-messages-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 0px);
}
.conv-list {
  border-right: 1.5px solid var(--kraft-light, #e8cba7);
  overflow-y: auto;
  background: var(--warm-white);
}
.conv-list-title {
  padding: 18px 16px 10px;
  font-size: 1.1rem;
  font-weight: 800;
}
.conv-empty {
  padding: 16px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--kraft-light, #e8cba7);
}
.conv-item:hover, .conv-item.active {
  background: var(--mint-light);
}
.conv-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--lavender-light);
  border: 1.5px solid var(--kraft-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.conv-name {
  font-size: 0.85rem;
  font-weight: 700;
}
.conv-preview {
  font-size: 0.72rem;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-badge {
  background: var(--coral);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}
.thread-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.thread-header {
  display: none;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1.5px solid var(--kraft-light, #e8cba7);
}
.thread-back {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--mint-dark);
}
.thread-header-name {
  font-weight: 800;
}
.thread-placeholder {
  margin: auto;
  font-size: 0.85rem;
  color: var(--text-light);
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .expert-messages-layout {
    grid-template-columns: 1fr;
  }
  .conv-list, .thread-pane {
    display: none;
  }
  .expert-messages-layout:not(.show-thread) .conv-list {
    display: block;
  }
  .expert-messages-layout.show-thread .thread-pane {
    display: flex;
  }
  .thread-header {
    display: flex;
  }
}
</style>
