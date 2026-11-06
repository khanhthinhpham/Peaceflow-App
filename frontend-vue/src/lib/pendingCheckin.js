// Check-in làm ở trang chủ khi CHƯA đăng nhập: giữ tạm trên máy, chuyển sang đăng nhập,
// đăng nhập xong thì tự lưu (AppLayout gọi processPendingCheckin) — khách không phải làm lại.
import { apiClient } from './apiClient';

const KEY = 'pf.pendingCheckin';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // quá 1 ngày thì bỏ (không còn là cảm xúc "hôm nay")

export function stashCheckinAndLogin(payload, redirectTo = '/dashboard') {
  try { localStorage.setItem(KEY, JSON.stringify({ payload, at: Date.now() })); } catch { /* bỏ qua */ }
  sessionStorage.setItem('peaceflow_post_login_redirect', redirectTo);
  window.location.assign('/login');
}

export async function processPendingCheckin() {
  let item = null;
  try { item = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { item = null; }
  if (!item) return false;
  try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
  if (!item.payload || !item.at || Date.now() - item.at > MAX_AGE_MS) return false;
  try {
    await apiClient.post('/moods', item.payload);
    window.dispatchEvent(new CustomEvent('peaceflow:mood-saved'));
    return true;
  } catch (e) {
    console.error('Could not save pending check-in:', e);
    return false;
  }
}
