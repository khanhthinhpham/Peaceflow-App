import { defineStore } from 'pinia';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from './auth';

const MAX_OPEN_WINDOWS = 2;

export const useChatWidgetStore = defineStore('chatWidget', {
  state: () => ({
    conversations: [],
    loading: false,
    dropdownOpen: false,
    openWindows: [],
    _initialized: false
  }),

  getters: {
    totalUnread(state) {
      return state.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    }
  },

  actions: {
    // Gộp hội thoại vai trò client + vai trò expert thành 1 danh sách — y hệt logic trong
    // MessagesView.vue, giữ riêng ở đây (chấp nhận trùng nhẹ) để không đụng/refactor trang
    // đầy đủ đã chạy ổn.
    async loadConversations() {
      this.loading = true;
      try {
        const auth = useAuthStore();
        const isExpert = auth.user?.role === 'expert';
        const [asClient, asExpert] = await Promise.all([
          apiClient.get('/chat/conversations', { noCache: true }).catch(() => []),
          isExpert ? apiClient.get('/expert-portal/chat/conversations', { noCache: true }).catch(() => []) : Promise.resolve([])
        ]);
        const merged = [
          ...asClient.map((c) => ({ id: c.id, name: c.expert_name, avatar: c.expert_avatar || '🩺', last_message_at: c.last_message_at, last_message_preview: c.last_message_preview, unread_count: c.unread_count })),
          ...asExpert.map((c) => ({ id: c.id, name: c.client_name, avatar: '🙂', last_message_at: c.last_message_at, last_message_preview: c.last_message_preview, unread_count: c.unread_count }))
        ];
        merged.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
        this.conversations = merged;
      } finally {
        this.loading = false;
      }
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
      if (this.dropdownOpen) this.loadConversations();
    },
    closeDropdown() {
      this.dropdownOpen = false;
    },

    openWindow(conv) {
      if (this.openWindows.some((w) => w.id === conv.id)) {
        this.dropdownOpen = false;
        return;
      }
      if (this.openWindows.length >= MAX_OPEN_WINDOWS) this.openWindows.shift();
      this.openWindows.push({ id: conv.id, name: conv.name, avatar: conv.avatar });
      const c = this.conversations.find((x) => x.id === conv.id);
      if (c) c.unread_count = 0;
      this.dropdownOpen = false;
    },
    closeWindow(id) {
      this.openWindows = this.openWindows.filter((w) => w.id !== id);
    },

    // Tin nhắn mới tới (từ sự kiện 'peaceflow:chat-message' đã có sẵn ở notifications.js) cho
    // 1 hội thoại KHÔNG đang mở trong khung nổi — tăng số chưa đọc để hiện badge trên nút tròn
    // + trong dropdown, không cần tự subscribe lại kênh notifications riêng.
    _handleChatMessageEvent(e) {
      const conversationId = e.detail?.params?.conversationId;
      if (!conversationId) return;
      if (this.openWindows.some((w) => w.id === conversationId)) return;
      const conv = this.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      } else {
        // Hội thoại chưa từng nằm trong danh sách (vd mới nhận booking) — tải lại cho chắc.
        this.loadConversations();
      }
    },

    init() {
      if (this._initialized) return;
      this._initialized = true;
      window.addEventListener('peaceflow:chat-message', this._handleChatMessageEvent.bind(this));
      this.loadConversations();
    }
  }
});
