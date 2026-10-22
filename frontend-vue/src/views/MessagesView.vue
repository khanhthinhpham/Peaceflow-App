<template>
  <main class="messages-page" :class="{ 'expert-main': isExpertPortal }">
    <div class="messages-layout" :class="{ 'show-thread': activeId }">
      <aside class="conv-list">
        <h1 class="conv-list-title">{{ t('messages.title') }}</h1>
        <div v-if="loading" style="padding:16px;font-size:0.8rem;color:var(--text-light);">...</div>
        <div v-else-if="!conversations.length" class="conv-empty">
          <div>{{ t('messages.listEmpty') }}</div>
          <div style="font-size:0.75rem;color:var(--text-light);margin-top:6px;">{{ t('messages.listEmptyHint') }}</div>
        </div>
        <button
          v-for="c in conversations"
          :key="c.id"
          type="button"
          class="conv-item"
          :class="{ active: c.id === activeId }"
          @click="selectConversation(c.id)"
        >
          <div class="conv-avatar">{{ c.avatar }}</div>
          <div class="conv-info">
            <div class="conv-name">{{ c.name }}</div>
            <div class="conv-preview">{{ c.last_message_preview || '' }}</div>
          </div>
          <div v-if="c.unread_count > 0" class="conv-badge">{{ c.unread_count }}</div>
        </button>
      </aside>

      <section class="thread-pane">
        <div v-if="activeId" class="thread-header">
          <button type="button" class="thread-back" @click="activeId = null">{{ t('messages.backToList') }}</button>
          <div class="thread-header-name">{{ activeConversation?.name }}</div>
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
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { subscribeChatMessages, unsubscribeChatMessages } from '../lib/supabaseRealtime';
import ChatThread from '../components/ChatThread.vue';

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
// Trang này được dùng chung cho cả 2 route (/messages trong shell user thường, /expert/messages
// trong shell Chuyên gia dạng CSS grid) — cần biết đang ở shell nào để áp đúng class layout
// (.expert-main bù padding-top cho topbar mobile riêng của khu Chuyên gia).
const isExpertPortal = computed(() => route.path.startsWith('/expert'));

// Gộp CHUNG 1 danh sách: hội thoại với vai trò thân chủ (mình đặt lịch người khác) VÀ vai
// trò chuyên gia (người khác đặt lịch mình) — vì với 1 tài khoản vừa là chuyên gia vừa có
// thể tự đặt lịch người khác, "tin nhắn với thân chủ" theo đúng nghĩa thực tế là CẢ 2 chiều,
// không nên tách 2 trang riêng chỉ vì khác route. 2 mục sidebar (chính + khu Chuyên gia) đều
// trỏ về đúng trang này.
async function loadConversations() {
  loading.value = true;
  try {
    const isExpert = auth.user?.role === 'expert';
    const [asClient, asExpert] = await Promise.all([
      apiClient.get('/chat/conversations', { noCache: true }).catch(() => []),
      isExpert ? apiClient.get('/expert-portal/chat/conversations', { noCache: true }).catch(() => []) : Promise.resolve([])
    ]);
    const merged = [
      ...asClient.map((c) => ({ id: c.id, expertId: c.expert_id, name: c.expert_name, avatar: c.expert_avatar || '🩺', last_message_at: c.last_message_at, last_message_preview: c.last_message_preview, unread_count: c.unread_count })),
      ...asExpert.map((c) => ({ id: c.id, userId: c.user_id, name: c.client_name, avatar: '🙂', last_message_at: c.last_message_at, last_message_preview: c.last_message_preview, unread_count: c.unread_count }))
    ];
    merged.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
    conversations.value = merged;
  } catch (_e) {
    // Danh sách rỗng là đủ, không cần chặn trang bằng lỗi.
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
    // Tránh trùng với tin nhắn optimistic vừa tự thêm khi chính mình gửi.
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
    // Gửi lỗi — người dùng vẫn thấy ô nhập còn nội dung (ChatThread chỉ xoá draft khi emit
    // thành công phía component, nhưng emit xảy ra trước khi biết kết quả API nên không rollback
    // nội dung ở đây — chấp nhận v1, người dùng gõ lại nếu lỗi mạng).
  } finally {
    sending.value = false;
  }
}

// Mở thẳng hội thoại với 1 expert cụ thể qua query ?expert=<id> (nút "Nhắn tin" ở ExpertsView) —
// tự tạo hội thoại nếu chưa có (API tự xử lý upsert + kiểm tra có booking hợp lệ hay không).
async function openByExpertQuery() {
  const expertId = route.query.expert;
  if (!expertId) return;
  const existing = conversations.value.find((c) => c.expertId === expertId);
  if (existing) {
    selectConversation(existing.id);
    return;
  }
  try {
    const created = await apiClient.post('/chat/conversations', { expertId });
    await loadConversations();
    selectConversation(created.id);
  } catch (_e) {
    // Không có booking hợp lệ -> giữ nguyên danh sách, không mở được hội thoại mới.
  }
}

// Hội thoại khác (không phải đang mở) có tin nhắn mới trong lúc đang ở trang Tin nhắn — chỉ
// cần tăng số chưa đọc cạnh hội thoại đó, không cần popup (đã tắt popup ở notifications.js
// khi đang ở trang này). Hội thoại ĐANG MỞ thì kênh subscribeChatMessages riêng đã lo rồi.
function handleChatMessageEvent(e) {
  const conversationId = e.detail?.params?.conversationId;
  if (!conversationId || conversationId === activeId.value) return;
  const conv = conversations.value.find((c) => c.id === conversationId);
  if (conv) conv.unread_count = (conv.unread_count || 0) + 1;
}

onMounted(async () => {
  window.addEventListener('peaceflow:chat-message', handleChatMessageEvent);
  await loadConversations();
  // Mở thẳng 1 hội thoại cụ thể khi nhảy từ thông báo "có tin nhắn mới" (?conversation=<id>) —
  // ưu tiên trước query ?expert vì đã biết chính xác hội thoại nào, không cần dò/tạo lại.
  if (route.query.conversation) {
    selectConversation(route.query.conversation);
  } else {
    await openByExpertQuery();
  }
});
onBeforeUnmount(() => {
  unsubscribeChatMessages();
  window.removeEventListener('peaceflow:chat-message', handleChatMessageEvent);
});
</script>

<style scoped>
.messages-page {
  margin-left: 0;
  padding: 0;
  height: 100vh;
}
.messages-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100%;
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
  .messages-layout {
    grid-template-columns: 1fr;
  }
  .conv-list, .thread-pane {
    display: none;
  }
  .messages-layout:not(.show-thread) .conv-list {
    display: block;
  }
  .messages-layout.show-thread .thread-pane {
    display: flex;
  }
  .thread-header {
    display: flex;
  }
}
</style>
