<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Quản lý thử thách cộng đồng</h1>
        <p class="admin-page-sub">Xếp hàng đợi nhiều thử thách — hết thử thách này (đạt 100% mục tiêu) sẽ tự động hiện thử thách kế tiếp trong danh sách. Chưa đạt thì giữ nguyên, không tự đổi khi hết tuần. Bấm "Kích hoạt ngay" để tự tay đổi bất cứ lúc nào.</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">+ Thử thách mới</button>
    </div>

    <!-- FORM tạo/sửa -->
    <div v-if="formOpen" class="admin-card" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-weight:800;">{{ editingId ? 'Sửa thử thách' : 'Thử thách mới' }}</div>
        <button type="button" class="btn-outline" @click="closeForm">Đóng</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;max-width:640px;">
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Tên thử thách</label>
            <input v-model="form.title" type="text" class="admin-input" style="width:100%;" placeholder="vd: 🧘 Cùng nhau thiền 1.000 phút">
          </div>
          <div style="width:90px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Icon</label>
            <input v-model="form.icon" type="text" class="admin-input" style="width:100%;text-align:center;" placeholder="🎯">
          </div>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mô tả (hướng dẫn cách tham gia)</label>
          <textarea v-model="form.description" rows="2" class="admin-input" style="width:100%;font-family:inherit;"></textarea>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:220px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Đo theo loại</label>
            <select v-model="form.metric_type" class="admin-input" style="width:100%;">
              <option v-for="(meta, key) in metricTypes" :key="key" :value="key">{{ meta.labelVi }} ({{ meta.unitVi }})</option>
            </select>
          </div>
          <div style="width:140px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mục tiêu chung</label>
            <input v-model.number="form.goal_amount" type="number" min="1" class="admin-input" style="width:100%;">
          </div>
        </div>

        <div v-if="form.metric_type === 'specific_tasks'">
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Chọn nhiệm vụ tính vào thử thách này (đã chọn {{ form.task_ids.length }})</label>
          <input v-model="taskSearch" type="text" class="admin-input" style="width:100%;margin-bottom:8px;" placeholder="🔍 Tìm nhiệm vụ theo tên...">
          <div style="max-height:260px;overflow-y:auto;border:1.5px solid var(--kraft-light,#e8cba7);border-radius:10px;padding:8px;">
            <label v-for="task in filteredTaskOptions" :key="task.id" style="display:flex;align-items:center;gap:8px;padding:5px 4px;font-size:0.82rem;">
              <input type="checkbox" :value="task.id" v-model="form.task_ids">
              {{ task.title }} <span style="color:var(--text-light);font-size:0.7rem;">({{ task.code }})</span>
            </label>
            <div v-if="!filteredTaskOptions.length" style="font-size:0.78rem;color:var(--text-light);padding:6px;">Không tìm thấy nhiệm vụ phù hợp.</div>
          </div>
        </div>

        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Ngưỡng đóng góp cá nhân để nhận thưởng (để trống = ai tham gia cũng được thưởng)</label>
            <input v-model.number="form.personal_threshold" type="number" min="0" class="admin-input" style="width:100%;" placeholder="vd: 30">
          </div>
          <div style="width:140px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">XP thưởng</label>
            <input v-model.number="form.reward_xp" type="number" min="0" class="admin-input" style="width:100%;">
          </div>
        </div>
        <div style="width:160px;">
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Thứ tự trong hàng đợi</label>
          <input v-model.number="form.queue_order" type="number" class="admin-input" style="width:100%;">
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <input v-model="form.active" type="checkbox"> Cho phép nằm trong hàng đợi (active)
        </label>

        <div v-if="formError" style="color:var(--coral);font-size:0.85rem;">{{ formError }}</div>
        <button type="button" class="btn-primary" :disabled="saving" @click="save" style="align-self:flex-start;">
          {{ saving ? 'Đang lưu...' : 'Lưu thử thách' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!challenges.length" class="admin-card admin-empty">Chưa có thử thách nào. Bấm "+ Thử thách mới" để tạo cái đầu tiên.</div>
    <template v-else>
      <div v-for="c in challenges" :key="c.id" class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span>{{ c.icon }}</span>
            <span style="font-weight:800;">{{ c.title }}</span>
            <span v-if="c.id === currentChallengeId" style="font-size:0.72rem;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(120,200,150,.18);color:#2f8f5a;">🔥 Đang active</span>
            <span
              v-if="!c.active"
              style="font-size:0.72rem;font-weight:800;padding:1px 8px;border-radius:999px;background:rgba(74,55,40,.1);color:var(--text-secondary,#7a6555);"
            >Đã ẩn</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-light);margin-top:4px;">
            Thứ tự #{{ c.queue_order }} · Mục tiêu {{ formatNum(c.goal_amount) }} {{ c.unit_label }} · +{{ c.reward_xp }} XP
            <span v-if="c.personal_threshold !== null"> · Cần đóng góp cá nhân ≥{{ c.personal_threshold }} {{ c.unit_label }}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-outline" style="font-size:0.82rem;" :disabled="c.id === currentChallengeId" @click="activateNow(c)">Kích hoạt ngay</button>
          <button type="button" class="btn-outline" style="font-size:0.82rem;" @click="openEdit(c)">Sửa</button>
          <button type="button" class="btn-outline" style="font-size:0.82rem;color:var(--coral-dark);border-color:var(--coral);" :disabled="c.id === currentChallengeId" @click="remove(c)">Xoá</button>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';

const challenges = ref([]);
const currentChallengeId = ref(null);
const metricTypes = ref({});
const loading = ref(true);
const loadError = ref('');
const taskOptions = ref([]);
const taskSearch = ref('');

const formOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  title: '', description: '', icon: '🎯', metric_type: 'meditation_minutes',
  goal_amount: 1000, personal_threshold: null, reward_xp: 100, queue_order: 0, active: true, task_ids: []
});

const filteredTaskOptions = computed(() => {
  const q = taskSearch.value.trim().toLowerCase();
  if (!q) return taskOptions.value;
  return taskOptions.value.filter((t) => t.title.toLowerCase().includes(q));
});

async function loadTaskOptions() {
  try {
    const data = await apiClient.get('/admin/tasks?limit=200', { noCache: true });
    taskOptions.value = (data?.tasks || []).map((t) => ({ id: t.id, title: t.title, code: t.code }));
  } catch (_e) { /* danh sach task chi can cho picker, loi thi de trong khong chan form */ }
}

function formatNum(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await apiClient.get('/admin/community-challenges', { noCache: true });
    challenges.value = data?.challenges || [];
    currentChallengeId.value = data?.current_challenge_id || null;
    metricTypes.value = data?.metric_types || {};
  } catch (_e) {
    loadError.value = 'Không tải được danh sách thử thách (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.title = '';
  form.description = '';
  form.icon = '🎯';
  form.metric_type = 'meditation_minutes';
  form.goal_amount = 1000;
  form.personal_threshold = null;
  form.reward_xp = 100;
  form.queue_order = challenges.value.length;
  form.active = true;
  form.task_ids = [];
  taskSearch.value = '';
  formError.value = '';
}

function openCreate() {
  editingId.value = null;
  resetForm();
  formOpen.value = true;
}

function openEdit(c) {
  editingId.value = c.id;
  resetForm();
  form.title = c.title;
  form.description = c.description || '';
  form.icon = c.icon;
  form.metric_type = c.metric_type;
  form.goal_amount = c.goal_amount;
  form.personal_threshold = c.personal_threshold;
  form.reward_xp = c.reward_xp;
  form.queue_order = c.queue_order;
  form.active = c.active;
  form.task_ids = Array.isArray(c.task_ids) ? [...c.task_ids] : [];
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
}

async function save() {
  if (!form.title.trim()) { formError.value = 'Cần nhập tên thử thách.'; return; }
  if (!form.goal_amount || form.goal_amount <= 0) { formError.value = 'Mục tiêu phải lớn hơn 0.'; return; }
  if (form.metric_type === 'specific_tasks' && !form.task_ids.length) {
    formError.value = 'Chọn "Chỉ tính nhiệm vụ được chọn riêng" thì cần chọn ít nhất 1 nhiệm vụ.';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon.trim() || '🎯',
      metric_type: form.metric_type,
      goal_amount: form.goal_amount,
      personal_threshold: form.personal_threshold === '' || form.personal_threshold === null ? null : Number(form.personal_threshold),
      reward_xp: form.reward_xp,
      queue_order: form.queue_order,
      active: form.active,
      task_ids: form.metric_type === 'specific_tasks' ? form.task_ids : null
    };
    if (editingId.value) {
      await apiClient.put(`/admin/community-challenges/${editingId.value}`, payload);
    } else {
      await apiClient.post('/admin/community-challenges', payload);
    }
    formOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.message || 'Lưu thất bại.';
  } finally {
    saving.value = false;
  }
}

async function activateNow(c) {
  if (!window.confirm(`Chuyển ngay sang thử thách "${c.title}"? Thử thách đang active sẽ dừng lại (tiến độ hiện tại không mất, chỉ không tính nữa).`)) return;
  try {
    await apiClient.post(`/admin/community-challenges/${c.id}/activate-now`, {});
    await load();
  } catch (e) {
    alert(e.message || 'Không kích hoạt được.');
  }
}

async function remove(c) {
  if (!window.confirm(`Xoá thử thách "${c.title}"? Không thể hoàn tác.`)) return;
  try {
    await apiClient.delete(`/admin/community-challenges/${c.id}`);
    await load();
  } catch (e) {
    alert(e.message || 'Xoá thất bại.');
  }
}

onMounted(() => {
  load();
  loadTaskOptions();
});
</script>
