import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ikbdhvjbnfzxogcztyhw.supabase.co';
// Lấy từ Supabase Dashboard → Project Settings → API → anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYmRodmpibmZ6eG9nY3p0eWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTY1NTEsImV4cCI6MjA5NTU3MjU1MX0.N7UTmXa-sHE1PTsmf3FrxxQvDKeNzRW3dFpxvvTRU_s';

let _client = null;
let _channel = null;

function getUserId() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
        // JWT dùng base64url (-_), atob() chỉ hiểu base64 tiêu chuẩn (+/)
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
