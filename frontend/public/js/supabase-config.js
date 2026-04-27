const SUPABASE_URL = 'https://ccymyblzvdyvemcnuwmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FMh8PYXvqdd_7uGuahgABw_XKkMndUd';

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.handleLogout = async function() {
  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
  }
  window.location.href = 'login.html';
};
