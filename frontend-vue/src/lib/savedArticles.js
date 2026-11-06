import { reactive } from 'vue';
import { apiClient } from './apiClient';
import { useAuthStore } from '../stores/auth';

// Bài viết đã lưu — dùng chung cho thẻ bài viết, trang chi tiết và tab "Đã lưu" của trang Cảm hứng.
// Khách chưa đăng nhập bấm "Lưu": nhớ bài muốn lưu rồi chuyển sang đăng nhập; đăng nhập xong quay về
// đúng bài đó và bài được lưu luôn (processPending gọi khi app đã biết người dùng — xem AppLayout).
const PENDING_KEY = 'pf.pendingSaveArticle';
export const savedArticles = reactive({ ids: new Set(), loaded: false, busy: new Set() });

let loading = null;
export function loadSavedIds(force = false) {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) return Promise.resolve();
  if (loading && !force) return loading;
  loading = apiClient.get('/articles/saved/ids', { noCache: true })
    .then((d) => { savedArticles.ids = new Set(d?.ids || []); savedArticles.loaded = true; })
    .catch(() => { loading = null; });
  return loading;
}

export const isArticleSaved = (id) => savedArticles.ids.has(id);

function goLoginToSave(id) {
  try { localStorage.setItem(PENDING_KEY, String(id)); } catch { /* bỏ qua */ }
  sessionStorage.setItem('peaceflow_post_login_redirect', `${window.location.pathname}${window.location.search}`);
  window.location.assign('/login');
}

// trả về true nếu sau thao tác bài đang ở trạng thái đã lưu
export async function toggleSaveArticle(id) {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) { goLoginToSave(id); return false; }
  if (savedArticles.busy.has(id)) return isArticleSaved(id);
  const wasSaved = isArticleSaved(id);
  savedArticles.busy.add(id);
  const next = new Set(savedArticles.ids); if (wasSaved) next.delete(id); else next.add(id); savedArticles.ids = next; // cập nhật ngay cho mượt
  try {
    if (wasSaved) await apiClient.delete(`/articles/${id}/save`); else await apiClient.put(`/articles/${id}/save`, {});
  } catch (_e) {
    const back = new Set(savedArticles.ids); if (wasSaved) back.add(id); else back.delete(id); savedArticles.ids = back; // lỗi → trả lại như cũ
  } finally {
    savedArticles.busy.delete(id);
  }
  return isArticleSaved(id);
}

// sau khi đăng nhập: lưu nốt bài khách đã bấm "Lưu" trước đó
export async function processPendingSave() {
  const auth = useAuthStore();
  let id = null;
  try { id = localStorage.getItem(PENDING_KEY); } catch { /* bỏ qua */ }
  if (!id || !auth.isAuthenticated) { await loadSavedIds(); return; }
  try { localStorage.removeItem(PENDING_KEY); } catch { /* bỏ qua */ }
  await loadSavedIds();
  if (!isArticleSaved(id)) await toggleSaveArticle(id);
}
