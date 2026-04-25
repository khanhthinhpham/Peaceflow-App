/**
 * Cấu hình Supabase Client
 * Vui lòng thay thế các giá trị bên dưới bằng thông tin từ Project Supabase của bạn.
 */

// 1. Khởi tạo hằng số (Cần thay đổi)
const SUPABASE_URL = 'https://ccymyblzvdyvemcnuwmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FMh8PYXvqdd_7uGuahgABw_XKkMndUd';

// 2. Khởi tạo Supabase client (sẽ được sử dụng toàn cục)
// Lưu ý: Cần import thư viện Supabase CDN vào HTML trước:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
let supabaseClient;

try {
  if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
    console.log('Supabase client initialized.');
  } else {
    console.warn('Vui lòng cấu hình SUPABASE_URL và SUPABASE_ANON_KEY trong js/supabase-config.js');
  }
} catch (error) {
  console.error('Lỗi khởi tạo Supabase:', error);
}

const AuthModule = {
  async signUp(email, password, name) {
    if (!supabaseClient) return { error: { message: 'Chưa cấu hình Supabase' } };
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, level: 1, xp: 0, streak: 0 }
      }
    });
    return { data, error };
  },

  async signIn(email, password) {
    if (!supabaseClient) return { error: { message: 'Chưa cấu hình Supabase' } };
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  },

  async getSession() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  }
};
