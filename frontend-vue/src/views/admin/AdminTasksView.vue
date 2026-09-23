<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Quản lý nhiệm vụ</h1>
        <p class="admin-page-sub">Tạo, sửa, bật/tắt nhiệm vụ (bài tập chữa lành) hiển thị trong mục Nhiệm vụ của người dùng.</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">+ Nhiệm vụ mới</button>
    </div>

    <!-- FORM tạo/sửa -->
    <div v-if="formOpen" class="admin-card" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-weight:800;">{{ editingId ? 'Sửa nhiệm vụ' : 'Nhiệm vụ mới' }}</div>
        <button type="button" class="btn-outline" @click="closeForm">Đóng</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;max-width:640px;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mã nhiệm vụ (code) — để trống sẽ tự sinh</label>
          <input v-model="form.code" type="text" class="admin-input" style="width:100%;" placeholder="vd: 2.10, hoặc tự để trống">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Tên nhiệm vụ</label>
          <input v-model="form.title" type="text" class="admin-input" style="width:100%;" placeholder="Tên nhiệm vụ">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Ảnh minh hoạ</label>
          <input type="file" accept="image/*" @change="onCoverChange">
          <div v-if="coverPreview" style="margin-top:8px;">
            <img :src="coverPreview" style="max-width:200px;border-radius:10px;display:block;">
          </div>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:160px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mức độ</label>
            <select v-model="form.category" class="admin-input" style="width:100%;">
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Nâng cao</option>
              <option value="emergency">Khẩn cấp</option>
              <option value="community">Cộng đồng</option>
            </select>
          </div>
          <div style="flex:1;min-width:140px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Thời lượng (phút)</label>
            <input v-model.number="form.duration_minutes" type="number" min="1" class="admin-input" style="width:100%;">
          </div>
          <div style="flex:1;min-width:140px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">XP thưởng</label>
            <input v-model.number="form.xp_reward" type="number" min="0" class="admin-input" style="width:100%;">
          </div>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mô tả</label>
          <textarea v-model="form.description" rows="3" class="admin-input" style="width:100%;font-family:inherit;" placeholder="Mô tả ngắn về nhiệm vụ..."></textarea>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Các bước thực hiện (mỗi dòng 1 bước)</label>
          <textarea v-model="stepsText" rows="5" class="admin-input" style="width:100%;font-family:inherit;" placeholder="Bước 1...&#10;Bước 2...&#10;Bước 3..."></textarea>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Lưu ý an toàn (mỗi dòng 1 lưu ý, để trống nếu không có)</label>
          <textarea v-model="safetyNotesText" rows="2" class="admin-input" style="width:100%;font-family:inherit;" placeholder="Không bắt buộc"></textarea>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Thẻ tag (phân cách bằng dấu phẩy)</label>
          <input v-model="tagsText" type="text" class="admin-input" style="width:100%;" placeholder="Tâm lý, Cảm xúc">
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <input v-model="form.active" type="checkbox"> Hiển thị cho người dùng (active)
        </label>

        <div v-if="formError" style="color:var(--coral);font-size:0.85rem;">{{ formError }}</div>
        <button type="button" class="btn-primary" :disabled="saving" @click="save" style="align-self:flex-start;">
          {{ saving ? 'Đang lưu...' : 'Lưu nhiệm vụ' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!tasks.length" class="admin-card admin-empty">Chưa có nhiệm vụ nào.</div>
    <template v-else>
      <div v-for="task in tasks" :key="task.id" class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span style="font-weight:800;">{{ task.title }}</span>
            <span style="font-size:0.72rem;font-weight:700;padding:1px 8px;border-radius:6px;background:var(--cream,#fff8f0);border:1px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555);">{{ CATEGORY_LABELS[task.category] || task.category }}</span>
            <span
              style="font-size:0.72rem;font-weight:800;padding:1px 8px;border-radius:999px;"
              :style="task.active ? 'background:rgba(120,200,150,.18);color:#2f8f5a;' : 'background:rgba(74,55,40,.1);color:var(--text-secondary,#7a6555);'"
            >{{ task.active ? 'Đang hiện' : 'Đã ẩn' }}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-light);margin-top:4px;">{{ task.code }} · {{ task.duration_minutes }} phút · +{{ task.xp_reward }} XP</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-outline" style="font-size:0.82rem;" @click="openEdit(task)">Sửa</button>
          <button type="button" class="btn-outline" style="font-size:0.82rem;" @click="toggleActive(task)">{{ task.active ? 'Ẩn' : 'Hiện lại' }}</button>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';

const CATEGORY_LABELS = { easy: 'Dễ', medium: 'Trung bình', hard: 'Nâng cao', emergency: 'Khẩn cấp', community: 'Cộng đồng' };

const tasks = ref([]);
const loading = ref(true);
const loadError = ref('');

const formOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({ code: '', title: '', category: 'easy', duration_minutes: 10, xp_reward: 10, description: '', active: true });
const stepsText = ref('');
const safetyNotesText = ref('');
const tagsText = ref('');
const coverFile = ref(null);
const coverPreview = ref('');

function linesToArray(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await apiClient.get('/admin/tasks', { noCache: true });
    tasks.value = data?.tasks || [];
  } catch (_e) {
    loadError.value = 'Không tải được danh sách nhiệm vụ (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.code = '';
  form.title = '';
  form.category = 'easy';
  form.duration_minutes = 10;
  form.xp_reward = 10;
  form.description = '';
  form.active = true;
  stepsText.value = '';
  safetyNotesText.value = '';
  tagsText.value = '';
  formError.value = '';
  coverFile.value = null;
  coverPreview.value = '';
}

function onCoverChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  coverFile.value = file;
  coverPreview.value = URL.createObjectURL(file);
}

function openCreate() {
  editingId.value = null;
  resetForm();
  formOpen.value = true;
}

async function openEdit(task) {
  editingId.value = task.id;
  resetForm();
  form.code = task.code;
  form.title = task.title;
  form.category = task.category;
  form.duration_minutes = task.duration_minutes;
  form.xp_reward = task.xp_reward;
  form.description = task.description || '';
  form.active = task.active;
  stepsText.value = (task.steps || []).join('\n');
  safetyNotesText.value = (task.safety_notes || []).join('\n');
  tagsText.value = (task.tags || []).join(', ');
  formOpen.value = true;
  if (task.has_cover) {
    try {
      const blob = await apiClient.getBlob(`/tasks/${task.id}/cover`);
      coverPreview.value = URL.createObjectURL(blob);
    } catch (_e) { /* khong sao neu tai anh loi, form van dung duoc */ }
  }
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
}

async function save() {
  if (!form.title.trim()) {
    formError.value = 'Cần nhập tên nhiệm vụ.';
    return;
  }
  if (!form.duration_minutes || form.duration_minutes <= 0) {
    formError.value = 'Thời lượng phải lớn hơn 0.';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    const fd = new FormData();
    fd.append('code', form.code.trim());
    fd.append('title', form.title.trim());
    fd.append('category', form.category);
    fd.append('duration_minutes', form.duration_minutes);
    fd.append('xp_reward', form.xp_reward);
    fd.append('description', form.description.trim());
    fd.append('steps', JSON.stringify(linesToArray(stepsText.value)));
    fd.append('safety_notes', JSON.stringify(linesToArray(safetyNotesText.value)));
    fd.append('tags', JSON.stringify(tagsText.value.split(',').map((s) => s.trim()).filter(Boolean)));
    fd.append('active', form.active ? 'true' : 'false');
    if (coverFile.value) fd.append('cover', coverFile.value);

    if (editingId.value) {
      await apiClient.putForm(`/admin/tasks/${editingId.value}`, fd);
    } else {
      await apiClient.postForm('/admin/tasks', fd);
    }
    formOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.message || 'Lưu thất bại.';
  } finally {
    saving.value = false;
  }
}

async function toggleActive(task) {
  try {
    await apiClient.patch(`/admin/tasks/${task.id}/active`, { active: !task.active });
    await load();
  } catch (e) {
    alert(e.message || 'Không đổi được trạng thái.');
  }
}

onMounted(() => {
  load();
});
</script>
