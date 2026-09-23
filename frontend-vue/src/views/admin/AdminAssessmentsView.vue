<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Tạo bài test mới</h1>
        <p class="admin-page-sub">Tự tạo bài test tự đánh giá (kiểu cộng điểm câu hỏi → phân loại mức độ) — không cần lập trình viên. Mỗi câu hỏi tự có lựa chọn trả lời + điểm số riêng.</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate">+ Bài test mới</button>
    </div>

    <!-- FORM tạo/sửa -->
    <div v-if="formOpen" class="admin-card" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-weight:800;">{{ editingCode ? 'Sửa bài test' : 'Bài test mới' }}</div>
        <button type="button" class="btn-outline" @click="closeForm">Đóng</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;max-width:720px;">
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:180px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mã bài test (code) — để trống sẽ tự sinh từ tên</label>
            <input v-model="form.code" type="text" class="admin-input" style="width:100%;" placeholder="vd: MY_TEST" :disabled="Boolean(editingCode)">
          </div>
          <div style="width:90px;">
            <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Icon</label>
            <input v-model="form.icon" type="text" class="admin-input" style="width:100%;text-align:center;" placeholder="📝">
          </div>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Tên bài test</label>
          <input v-model="form.name" type="text" class="admin-input" style="width:100%;" placeholder="Tên hiển thị">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Danh mục</label>
          <select v-model="form.category" class="admin-input" style="width:100%;">
            <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mô tả ngắn</label>
          <textarea v-model="form.description" rows="2" class="admin-input" style="width:100%;font-family:inherit;"></textarea>
        </div>

        <!-- CÂU HỎI — mỗi câu luôn tự có lựa chọn trả lời + điểm số riêng của nó -->
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Danh sách câu hỏi</label>
          <div v-for="(q, idx) in questions" :key="idx" style="border:1.5px solid var(--kraft-light,#e8cba7);border-radius:10px;padding:10px;margin-bottom:10px;">
            <div style="display:flex;gap:8px;align-items:center;">
              <span style="font-size:0.78rem;color:var(--text-light);width:22px;">{{ idx + 1 }}.</span>
              <input v-model="q.label" type="text" class="admin-input" style="flex:1;" :placeholder="`Nội dung câu hỏi ${idx + 1}`">
              <button type="button" class="btn-outline" style="font-size:0.75rem;color:var(--coral-dark);border-color:var(--coral);" :disabled="questions.length <= 1" @click="removeQuestion(idx)">Xoá câu</button>
            </div>
            <div style="margin-left:30px;margin-top:8px;">
              <div style="font-size:0.72rem;color:var(--text-light);margin-bottom:6px;">Lựa chọn trả lời cho câu này:</div>
              <div v-for="(opt, oIdx) in q.options" :key="oIdx" style="display:flex;gap:8px;margin-bottom:6px;align-items:center;">
                <input v-model="opt.label" type="text" class="admin-input" style="flex:1;" placeholder="Nhãn (vd: Không bao giờ)">
                <input v-model.number="opt.score" type="number" class="admin-input" style="width:80px;" placeholder="Điểm">
                <button type="button" class="btn-outline" style="font-size:0.72rem;color:var(--coral-dark);border-color:var(--coral);" :disabled="q.options.length <= 2" @click="q.options.splice(oIdx, 1)">Xoá</button>
              </div>
              <button type="button" class="btn-outline" style="font-size:0.75rem;" @click="q.options.push({ label: '', score: q.options.length })">+ Thêm lựa chọn</button>
            </div>
          </div>
          <button type="button" class="btn-outline" style="font-size:0.8rem;" @click="addQuestion">+ Thêm câu hỏi</button>
        </div>

        <!-- BANDS -->
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:6px;">Mức phân loại kết quả (theo tổng điểm, xếp từ thấp đến cao — mức cuối nên để điểm tối đa thật lớn để phủ hết các điểm cao)</label>
          <div v-for="(band, idx) in bands" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
            <span style="font-size:0.75rem;color:var(--text-light);white-space:nowrap;">Điểm ≤</span>
            <input v-model.number="band.max" type="number" class="admin-input" style="width:90px;">
            <input v-model="band.label" type="text" class="admin-input" style="flex:1;" placeholder="Nhãn phân loại (vd: Nhẹ)">
            <button type="button" class="btn-outline" style="font-size:0.75rem;color:var(--coral-dark);border-color:var(--coral);" :disabled="bands.length <= 1" @click="removeBand(idx)">Xoá</button>
          </div>
          <button type="button" class="btn-outline" style="font-size:0.8rem;" @click="addBand">+ Thêm mức phân loại</button>
        </div>

        <div style="font-size:0.75rem;color:var(--text-light);background:var(--cream,#fff8f0);border-radius:8px;padding:8px 12px;">
          Điểm tối đa hiện tại (cộng toàn bộ câu hỏi): <strong>{{ maxPossibleScore }}</strong> — mức phân loại cuối cùng nên đặt điểm tối đa ≥ số này.
        </div>

        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
          <input v-model="form.active" type="checkbox"> Hiển thị cho người dùng (active)
        </label>

        <div v-if="formError" style="color:var(--coral);font-size:0.85rem;">{{ formError }}</div>
        <button type="button" class="btn-primary" :disabled="saving" @click="save" style="align-self:flex-start;">
          {{ saving ? 'Đang lưu...' : 'Lưu bài test' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
    <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
    <template v-else>
      <div style="font-weight:800;margin:18px 0 10px;">Bài test tự tạo (chỉnh sửa được)</div>
      <div v-if="!customTests.length" class="admin-card admin-empty">Chưa có bài test tự tạo nào.</div>
      <div v-for="a in customTests" :key="a.code" class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span>{{ a.icon }}</span>
            <span style="font-weight:800;">{{ a.name }}</span>
            <span
              style="font-size:0.72rem;font-weight:800;padding:1px 8px;border-radius:999px;"
              :style="a.active ? 'background:rgba(120,200,150,.18);color:#2f8f5a;' : 'background:rgba(74,55,40,.1);color:var(--text-secondary,#7a6555);'"
            >{{ a.active ? 'Đang hiện' : 'Đã ẩn' }}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-light);margin-top:4px;">{{ a.code }} · {{ (a.question_schema || []).length }} câu hỏi</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-outline" style="font-size:0.82rem;" @click="openEdit(a)">Sửa</button>
          <button type="button" class="btn-outline" style="font-size:0.82rem;" @click="toggleActive(a)">{{ a.active ? 'Ẩn' : 'Hiện lại' }}</button>
          <button type="button" class="btn-outline" style="font-size:0.82rem;color:var(--coral-dark);border-color:var(--coral);" @click="remove(a)">Xoá</button>
        </div>
      </div>

      <div style="font-weight:800;margin:22px 0 10px;">Bài test có sẵn trong hệ thống (chỉ xem)</div>
      <div v-for="a in builtinTests" :key="a.code" class="admin-card admin-empty" style="text-align:left;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <span style="font-weight:700;">{{ a.name }}</span>
          <span style="font-size:0.75rem;color:var(--text-light);"> · {{ a.code }}</span>
        </div>
        <span style="font-size:0.75rem;color:var(--text-light);">Được lập trình sẵn — không sửa được ở đây</span>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';

const CATEGORY_LABELS = {
  depression: 'Trầm cảm', anxiety: 'Lo âu', stress: 'Căng thẳng / Cảm xúc', sleep: 'Giấc ngủ',
  substance: 'Rượu bia / Chất gây nghiện', behavior_addiction: 'Hành vi / Nghiện',
  child_teen: 'Trẻ em / Thanh thiếu niên', cognitive: 'Nhận thức', personality: 'Nhân cách', clinician: 'Chuyên gia đánh giá'
};

const allTests = ref([]);
const loading = ref(true);
const loadError = ref('');
const customTests = computed(() => allTests.value.filter((a) => a.is_custom));
const builtinTests = computed(() => allTests.value.filter((a) => !a.is_custom));

const formOpen = ref(false);
const editingCode = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({ code: '', name: '', icon: '📝', category: 'clinician', description: '', active: true });
function defaultOptions() { return [{ label: 'Không bao giờ', score: 0 }, { label: 'Thỉnh thoảng', score: 1 }, { label: 'Thường xuyên', score: 2 }]; }
const questions = ref([{ label: '', options: defaultOptions() }]);
const bands = ref([{ max: 3, label: 'Bình thường' }, { max: 999, label: 'Cần chú ý' }]);

const maxPossibleScore = computed(() => questions.value.reduce(
  (sum, q) => sum + Math.max(0, ...(q.options || []).map((o) => Number(o.score) || 0)),
  0
));

function addQuestion() { questions.value.push({ label: '', options: defaultOptions() }); }
function removeQuestion(idx) { questions.value.splice(idx, 1); }
function addBand() { bands.value.push({ max: 999, label: '' }); }
function removeBand(idx) { bands.value.splice(idx, 1); }

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    allTests.value = await apiClient.get('/admin/assessments', { noCache: true });
  } catch (_e) {
    loadError.value = 'Không tải được danh sách bài test (cần quyền admin).';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.code = '';
  form.name = '';
  form.icon = '📝';
  form.category = 'clinician';
  form.description = '';
  form.active = true;
  questions.value = [{ label: '', options: defaultOptions() }];
  bands.value = [{ max: 3, label: 'Bình thường' }, { max: 999, label: 'Cần chú ý' }];
  formError.value = '';
}

function openCreate() {
  editingCode.value = null;
  resetForm();
  formOpen.value = true;
}

function openEdit(test) {
  editingCode.value = test.code;
  resetForm();
  form.code = test.code;
  form.name = test.name;
  form.icon = test.icon || '📝';
  form.category = test.category || 'clinician';
  form.description = test.description || '';
  form.active = test.active;
  questions.value = (test.question_schema || []).map((q) => ({
    label: q.label,
    options: Array.isArray(q.options) && q.options.length ? q.options.map((o) => ({ ...o })) : defaultOptions()
  }));
  if (!questions.value.length) questions.value = [{ label: '', options: defaultOptions() }];
  bands.value = (test.interpretation_rules?.bands || []).map((b) => ({ ...b })) || bands.value;
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  editingCode.value = null;
}

async function save() {
  if (!form.name.trim()) { formError.value = 'Cần nhập tên bài test.'; return; }
  const cleanQuestions = questions.value.filter((q) => q.label.trim());
  if (!cleanQuestions.length) { formError.value = 'Cần ít nhất 1 câu hỏi có nội dung.'; return; }
  for (const q of cleanQuestions) {
    const cleanOpts = (q.options || []).filter((o) => o.label.trim());
    if (cleanOpts.length < 2) {
      formError.value = `Câu "${q.label}" cần ít nhất 2 lựa chọn trả lời.`;
      return;
    }
  }
  const cleanBands = bands.value.filter((b) => b.label.trim());
  if (!cleanBands.length) { formError.value = 'Cần ít nhất 1 mức phân loại.'; return; }

  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      icon: form.icon.trim() || '📝',
      category: form.category,
      description: form.description.trim(),
      active: form.active,
      question_schema: cleanQuestions.map((q, idx) => ({
        key: `q${idx + 1}`,
        label: q.label.trim(),
        options: (q.options || []).filter((o) => o.label.trim()).map((o) => ({ label: o.label.trim(), score: Number(o.score) || 0 }))
      })),
      scoring_rules: {},
      interpretation_rules: { bands: cleanBands.map((b) => ({ max: Number(b.max), label: b.label.trim() })) }
    };
    if (editingCode.value) {
      await apiClient.put(`/admin/assessments/${editingCode.value}`, payload);
    } else {
      await apiClient.post('/admin/assessments', payload);
    }
    formOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.message || 'Lưu thất bại.';
  } finally {
    saving.value = false;
  }
}

async function toggleActive(test) {
  try {
    await apiClient.patch(`/admin/assessments/${test.code}/active`, { active: !test.active });
    await load();
  } catch (e) {
    alert(e.message || 'Không đổi được trạng thái.');
  }
}

async function remove(test) {
  if (!window.confirm(`Xoá bài test "${test.name}"? Không thể hoàn tác.`)) return;
  try {
    await apiClient.delete(`/admin/assessments/${test.code}`);
    await load();
  } catch (e) {
    alert(e.message || 'Xoá thất bại.');
  }
}

onMounted(() => {
  load();
});
</script>
