import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ikbdhvjbnfzxogcztyhw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYmRodmpibmZ6eG9nY3p0eWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTY1NTEsImV4cCI6MjA5NTU3MjU1MX0.N7UTmXa-sHE1PTsmf3FrxxQvDKeNzRW3dFpxvvTRU_s';

// 1 CLIENT SUPABASE DUY NHẤT dùng chung cho mọi kênh realtime (notifications, chat...) trong
// toàn bộ tab. Trước đây notifications và chat mỗi cái tự tạo 1 createClient() riêng — Supabase
// cảnh báo thẳng "Multiple GoTrueClient instances detected... may produce undefined behavior"
// vì cả 2 client cùng tranh nhau 1 storage key, và trên thực tế nó khiến kênh thứ 2 báo
// "SUBSCRIBED" nhưng không bao giờ nhận được event (đã xác nhận qua test thật). Chỉ tạo 1
// lần, tái dùng cho mọi subscribe sau đó.
let _client = null;
function getClient() {
  _client = _client || createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

let _notifChannel = null;

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

  _notifChannel = getClient()
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
  if (_notifChannel) {
    getClient().removeChannel(_notifChannel);
    _notifChannel = null;
  }
}

// Kênh riêng cho 1 hội thoại chat đang mở — biến channel tách riêng với notifications (2 kênh
// độc lập chạy song song trên cùng 1 client), nhưng dùng chung getClient() ở trên.
let _chatChannel = null;

export function subscribeChatMessages(conversationId, onNew) {
  if (!conversationId) return;

  _chatChannel = getClient()
    .channel(`chat_messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      onNew(payload.new);
    })
    .subscribe();
}

export function unsubscribeChatMessages() {
  if (_chatChannel) {
    getClient().removeChannel(_chatChannel);
    _chatChannel = null;
  }
}
