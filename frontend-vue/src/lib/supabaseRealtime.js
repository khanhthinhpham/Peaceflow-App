import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ikbdhvjbnfzxogcztyhw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYmRodmpibmZ6eG9nY3p0eWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTY1NTEsImV4cCI6MjA5NTU3MjU1MX0.N7UTmXa-sHE1PTsmf3FrxxQvDKeNzRW3dFpxvvTRU_s';

let _client = null;
let _channel = null;

function getUserId() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)).sub;
  } catch {
    return null;
  }
}

export function subscribeNotifications(onNew) {
  const userId = getUserId();
  if (!userId || SUPABASE_ANON_KEY === 'REPLACE_WITH_ANON_KEY') return;

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  _channel = _client
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`
    }, (payload) => {
      onNew(payload.new);
    })
    .subscribe();
}

export function unsubscribeNotifications() {
  if (_channel && _client) {
    _client.removeChannel(_channel);
    _channel = null;
  }
}

// Kênh riêng cho 1 hội thoại chat đang mở — tách biến/channel riêng với notifications ở trên
// vì có thể cả 2 cùng chạy song song (khung chat mở + badge thông báo chung vẫn cần sống).
let _chatClient = null;
let _chatChannel = null;

export function subscribeChatMessages(conversationId, onNew) {
  if (!conversationId) return;
  console.log('[chat-realtime] subscribing to conversation', conversationId);
  _chatClient = _chatClient || createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  _chatChannel = _chatClient
    .channel(`chat_messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      console.log('[chat-realtime] received new message', payload.new);
      onNew(payload.new);
    })
    .subscribe((status) => {
      console.log('[chat-realtime] channel status:', status);
    });
}

export function unsubscribeChatMessages() {
  if (_chatChannel && _chatClient) {
    _chatClient.removeChannel(_chatChannel);
    _chatChannel = null;
  }
}
