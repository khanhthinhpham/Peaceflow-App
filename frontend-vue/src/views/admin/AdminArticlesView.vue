<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Quản lý bài viết</h1>
        <p class="admin-page-sub">Đăng bài cho mục "Góc chia sẻ" — tạo, sửa, xoá, công khai hoặc lưu nháp.</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button type="button" class="btn-outline" @click="catPanelOpen = !catPanelOpen">🏷️ Quản lý danh mục</button>
        <button type="button" class="btn-primary" @click="openCreate">+ Bài viết mới</button>
      </div>
    </div>

    <!-- QUẢN LÝ DANH MỤC -->
    <div v-if="catPanelOpen" class="admin-card" style="margin-bottom:20px;">
      <div style="font-weight:800;margin-bottom:12px;">Danh mục bài viết</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div v-for="c in catList" :key="c.key" style="display:flex;align-items:center;gap:10px;">
          <template v-if="catEditingKey === c.key">
            <input v-model="catEditLabel" type="text" class="admin-input" style="flex:1;">
            <button type="button" class="btn-primary" style="font-size:0.8rem;" @click="saveCategoryLabel(c.key)">Lưu</button>
            <button type="button" class="btn-outline" style="font-size:0.8rem;" @click="catEditingKey = null">Huỷ</button>
          </template>
          <template v-else>
            <span style="flex:1;font-weight:600;">{{ c.label }}</span>
            <span style="font-size:0.75rem;color:var(--text-light);">{{ c.article_count }} bài</span>
            <button type="button" class="btn-outline" style="font-size:0.78rem;" @click="startEditCategory(c)">Sửa</button>
            <button
              type="button"
              class="btn-outline"
              style="font-size:0.78rem;"
              :disabled="c.key === 'khac'"
              :style="c.key === 'khac' ? 'opacity:.4;cursor:not-allowed;' : 'color:var(--coral-dark);border-color:var(--coral);'"
              @click="removeCategory(c)"
            >Xoá</button>
          </template>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <input v-model="newCategoryLabel" type="text" class="admin-input" style="flex:1;" placeholder="Tên danh mục mới...">
        <button type="button" class="btn-primary" style="font-size:0.85rem;" @click="addCategory">+ Thêm</button>
      </div>
      <div v-if="catError" style="color:var(--coral);font-size:0.85rem;margin-top:8px;">{{ catError }}</div>
    </div>

    <!-- FORM tạo/sửa -->
    <div v-if="formOpen" class="admin-card" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-weight:800;">{{ editingId ? 'Sửa bài viết' : 'Bài viết mới' }}</div>
        <button type="button" class="btn-outline" @click="closeForm">Đóng</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;max-width:640px;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Tiêu đề</label>
          <input v-model="form.title" type="text" class="admin-input" style="width:100%;" placeholder="Tiêu đề bài viết">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Danh mục</label>
          <select v-model="form.category" class="admin-input" style="width:100%;">
            <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Tác giả hiển thị</label>
          <input v-model="form.authorName" type="text" class="admin-input" style="width:100%;" placeholder="Đội ngũ PeaceFlow">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Ảnh bìa</label>
          <input type="file" accept="image/*" @change="onCoverChange">
          <div v-if="coverPreview" style="margin-top:8px;">
            <img :src="coverPreview" style="max-width:240px;border-radius:10px;display:block;">
          </div>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Nội dung</label>
          <textarea v-model="form.content" rows="10" class="admin-input" style="width:100%;font-family:inherit;" placeholder="Nội dung bài viết..."></textarea>
        </div>

        <button type="button" class="btn-outline" style="font-size:0.8rem;align-self:flex-start;" @click="enOpen = !enOpen">
          🌐 {{ enOpen ? 'Ẩn' : 'Thêm' }} bản dịch tiếng Anh (không bắt buộc)
        </button>
        <div v-if="enOpen" style="display:flex;flex-direction:column;gap:12px;padding:14px;background:var(--cream,#fff8f0);border:1px dashed var(--kraft-light,#e8cba7);border-radius:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="font-size:0.75rem;color:var(--text-secondary);">Để trống thì người dùng chọn tiếng Anh vẫn thấy bản tiếng Việt (không lỗi, chỉ chưa dịch).</div>
            <button type="button" class="btn-outline" style="font-size:0.78rem;white-space:nowrap;" :disabled="translating" @click="autoTranslate">
              {{ translating ? 'Đang dịch...' : '✨ Tự động dịch' }}
            </button>
          </div>
          <div v-if="translateError" style="color:var(--coral);font-size:0.8rem;">{{ translateError }}</div>
          <div>
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Title (English)</label>
            <input v-model="form.titleEn" type="text" class="admin-input" style="width:100%;" placeholder="English title...">
          </div>
          <div>
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Content (English)</label>
            <textarea v-model="form.contentEn" rows="8" class="admin-input" style="width:100%;font-family:inherit;" placeholder="English content..."></textarea>
          </div>
          <div style="font-size:0.72rem;color:var(--text-light);">Dịch máy chỉ là bản nháp — nhớ đọc lại và chỉnh sửa trước khi lưu.</div>
        </div>

        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <input v-model="form.published" type="checkbox">
          Công khai ngay (bỏ chọn = lưu nháp)
        </label>
        <label v-if="form.published" style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <input v-model="form.notifyUsers" type="checkbox">
          📣 Gửi thông báo (in-app + push) cho toàn bộ người dùng khi đăng bài này
        </label>
        <div v-if="formError" style="color:var(--coral);font-size:0.85rem;">{{ formError }}</div>
        <div style="display:flex;gap:10px;">
          <button type="button" class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Đang lưu...' : 'Lưu bài viết' }}</button>
          <button type="button" class="btn-outline" @click="closeForm">Huỷ</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!articles.length" class="admin-card admin-empty">Chưa có bài viết nào.</div>
    <template v-else>
      <div v-for="a in articles" :key="a.id" class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span style="font-weight:800;">{{ a.title }}</span>
            <span style="font-size:0.72rem;font-weight:700;padding:1px 8px;border-radius:6px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">{{ a.categoryLabel }}</span>
            <span
              style="font-size:0.72rem;font-weight:800;padding:1px 8px;border-radius:999px;"
              :style="a.status === 'published'
                ? 'background:rgba(120,200,150,.18);color:#2f8f5a;'
                : 'background:rgba(74,55,40,.1);color:var(--text-secondary,#7a6555);'"
            >{{ a.status === 'published' ? 'Đã đăng' : 'Nháp' }}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-light);margin-top:4px;">{{ a.authorName }} · {{ dt(a.publishedAt || a.createdAt) }}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-outline" style="font-size:0.82rem;" @click="openEdit(a.id)">Sửa</button>
          <button type="button" class="btn-outline" style="font-size:0.82rem;color:var(--coral-dark);border-color:var(--coral);" @click="remove(a)">Xoá</button>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';

const articles = ref([]);
const categories = ref({});
const loading = ref(true);
const loadError = ref('');

const formOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');
const coverFile = ref(null);
const coverPreview = ref('');

const form = reactive({ title: '', category: 'khac', authorName: '', content: '', published: false, notifyUsers: false, titleEn: '', contentEn: '' });
const enOpen = ref(false);
const translating = ref(false);
const translateError = ref('');

async function autoTranslate() {
  if (!form.title.trim() && !form.content.trim()) {
    translateError.value = 'Cần nhập tiêu đề/nội dung tiếng Việt trước đã.';
    return;
  }
  if ((form.titleEn || form.contentEn) && !window.confirm('Đã có bản dịch, ghi đè bằng bản dịch máy mới?')) return;
  translating.value = true;
  translateError.value = '';
  try {
    const data = await apiClient.post('/admin/articles/translate-preview', {
      title: form.title,
      content: form.content
    });
    form.titleEn = data.titleEn;
    form.contentEn = data.contentEn;
  } catch (e) {
    translateError.value = e.message || 'Dịch thất bại, thử lại sau.';
  } finally {
    translating.value = false;
  }
}

const catPanelOpen = ref(false);
const catList = ref([]);
const catError = ref('');
const newCategoryLabel = ref('');
const catEditingKey = ref(null);
const catEditLabel = ref('');

async function loadCategories() {
  try {
    catList.value = await apiClient.get('/admin/article-categories', { noCache: true });
  } catch (_e) {
    catError.value = 'Không tải được danh sách danh mục.';
  }
}

async function addCategory() {
  const label = newCategoryLabel.value.trim();
  if (!label) return;
  catError.value = '';
  try {
    await apiClient.post('/admin/article-categories', { label });
    newCategoryLabel.value = '';
    await loadCategories();
    await load();
  } catch (e) {
    catError.value = e.message || 'Không thêm được danh mục.';
  }
}

function startEditCategory(c) {
  catEditingKey.value = c.key;
  catEditLabel.value = c.label;
}

async function saveCategoryLabel(key) {
  const label = catEditLabel.value.trim();
  if (!label) return;
  catError.value = '';
  try {
    await apiClient.put(`/admin/article-categories/${key}`, { label });
    catEditingKey.value = null;
    await loadCategories();
    await load();
  } catch (e) {
    catError.value = e.message || 'Không sửa được danh mục.';
  }
}

async function removeCategory(c) {
  if (c.key === 'khac') return;
  const msg = c.article_count > 0
    ? `Xoá danh mục "${c.label}"? ${c.article_count} bài viết đang dùng sẽ tự chuyển sang "Khác".`
    : `Xoá danh mục "${c.label}"?`;
  if (!window.confirm(msg)) return;
  catError.value = '';
  try {
    await apiClient.delete(`/admin/article-categories/${c.key}`);
    await loadCategories();
    await load();
  } catch (e) {
    catError.value = e.message || 'Không xoá được danh mục.';
  }
}

function dt(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v));
  } catch (_e) { return v; }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await apiClient.get('/admin/articles', { noCache: true });
    articles.value = data?.articles || [];
    categories.value = data?.categories || {};
  } catch (_e) {
    loadError.value = 'Không tải được danh sách bài viết (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.title = '';
  form.category = 'khac';
  form.authorName = '';
  form.content = '';
  form.published = false;
  form.notifyUsers = false;
  form.titleEn = '';
  form.contentEn = '';
  enOpen.value = false;
  coverFile.value = null;
  coverPreview.value = '';
  formError.value = '';
}

function openCreate() {
  editingId.value = null;
  resetForm();
  formOpen.value = true;
}

async function openEdit(id) {
  editingId.value = id;
  resetForm();
  formOpen.value = true;
  try {
    const data = await apiClient.get(`/admin/articles/${id}`, { noCache: true });
    form.title = data.title;
    form.category = data.category;
    form.authorName = data.authorName;
    form.content = data.content;
    form.published = data.status === 'published';
    form.titleEn = data.titleEn || '';
    form.contentEn = data.contentEn || '';
    enOpen.value = Boolean(form.titleEn || form.contentEn);
    if (data.hasCover) {
      const blob = await apiClient.getBlob(`/articles/${id}/cover`);
      coverPreview.value = URL.createObjectURL(blob);
    }
  } catch (_e) {
    formError.value = 'Không tải được nội dung bài viết.';
  }
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
}

function onCoverChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  coverFile.value = file;
  coverPreview.value = URL.createObjectURL(file);
}

async function save() {
  if (!form.title.trim() || !form.content.trim()) {
    formError.value = 'Cần nhập tiêu đề và nội dung.';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('category', form.category);
    fd.append('content', form.content);
    fd.append('author_name', form.authorName.trim());
    fd.append('status', form.published ? 'published' : 'draft');
    fd.append('notify_users', form.published && form.notifyUsers ? 'true' : 'false');
    fd.append('title_en', form.titleEn.trim());
    fd.append('content_en', form.contentEn.trim());
    if (coverFile.value) fd.append('cover', coverFile.value);

    if (editingId.value) {
      await apiClient.putForm(`/admin/articles/${editingId.value}`, fd);
    } else {
      await apiClient.postForm('/admin/articles', fd);
    }
    formOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.message || 'Lưu thất bại.';
  } finally {
    saving.value = false;
  }
}

async function remove(a) {
  if (!window.confirm(`Xoá bài viết "${a.title}"? Không thể hoàn tác.`)) return;
  try {
    await apiClient.delete(`/admin/articles/${a.id}`);
    await load();
  } catch (e) {
    alert(e.message || 'Xoá thất bại.');
  }
}

onMounted(() => {
  load();
  loadCategories();
});
</script>
