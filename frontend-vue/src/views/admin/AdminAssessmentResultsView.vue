<template>
  <main class="admin-main">
    <div class="admin-page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <p class="admin-page-kicker">PeaceFlow Admin</p>
        <h1 class="admin-page-title">Bài test</h1>
        <p class="admin-page-sub">Toàn bộ kết quả bài test tự làm trong hệ thống, của mọi tài khoản (không riêng chuyên gia nào).</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn-primary" :disabled="exportingAll" @click="openExportOwnerModal">{{ exportAllLabel }}</button>
        <button type="button" class="btn-outline" @click="load(page)">
          <span v-html="icon('refresh')"></span>
          Tải lại
        </button>
      </div>
    </div>

    <div class="admin-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div style="flex:1;min-width:180px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Tên người làm bài</label>
        <input v-model="searchName" type="search" class="admin-input" placeholder="Nhập tên để tìm..." @keydown.enter="runSearch">
      </div>
      <div style="flex:1;min-width:180px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Tài khoản đã nhập (email/tên)</label>
        <input v-model="searchOwner" type="search" class="admin-input" placeholder="Email hoặc tên chuyên gia..." @keydown.enter="runSearch">
      </div>
      <div style="min-width:170px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Bài test</label>
        <select v-model="searchCode" class="admin-input">
          <option value="">Tất cả bài test</option>
          <option v-for="t in TEST_CODES" :key="t.code" :value="t.code">{{ t.label }}</option>
        </select>
      </div>
      <div style="width:90px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">Tuổi từ</label>
        <input v-model="searchAgeMin" type="number" class="admin-input" min="0" max="120">
      </div>
      <div style="width:90px;">
        <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:4px;">đến</label>
        <input v-model="searchAgeMax" type="number" class="admin-input" min="0" max="120">
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.85rem;padding:10px 4px;white-space:nowrap;">
        <input v-model="searchFlagged" type="checkbox" @change="runSearch"> ⭐ Đã đánh dấu
      </label>
      <button type="button" class="btn-primary" @click="runSearch">🔍 Tìm</button>
      <button type="button" class="btn-outline" @click="resetSearch">Xoá lọc</button>
      <button type="button" class="btn-outline" @click="togglePatientView">{{ patientViewActive ? '📋 Xem theo lần test' : '👤 Xem theo bệnh nhân' }}</button>
    </div>

    <div style="font-size:.82rem;color:var(--text-light);margin-bottom:10px;">{{ metaText }}</div>

    <template v-if="!patientViewActive">
      <div v-if="loading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="loadError" class="admin-card admin-empty" style="color:var(--coral);">{{ loadError }}</div>
      <div v-else-if="!items.length" class="admin-card admin-empty">Không có kết quả nào khớp.</div>
      <template v-else>
        <div v-for="item in items" :key="item.id" class="admin-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;" @click="openDetail(item)">
          <button type="button" class="ca-flag-btn" :class="{ active: item.flagged }" :title="item.flagged ? 'Bỏ đánh dấu' : 'Đánh dấu'" @click.stop="toggleFlag(item)">{{ item.flagged ? '⭐' : '☆' }}</button>
          <div style="flex:1 1 220px;min-width:0;">
            <span style="font-weight:800;">{{ item.respondent_name || 'Chưa rõ tên' }}{{ item.respondent_age ? ` — ${item.respondent_age} tuổi` : '' }}</span>
            <div style="color:var(--text-secondary);font-size:.84rem;margin-top:3px;">{{ item.name }} · {{ dt(item.created_at) }}</div>
            <div style="color:var(--text-light);font-size:.78rem;margin-top:3px;">Tài khoản: {{ item.owner_name || item.owner_email }}</div>
          </div>
          <div style="text-align:right;font-size:.85rem;font-weight:700;white-space:nowrap;flex-shrink:0;">{{ item.severity || 'Đã hoàn thành' }}<br>{{ item.total_score }}</div>
        </div>
      </template>
      <AdminPager :page="page" :total-pages="totalPages" @go="load" />
    </template>

    <template v-else>
      <div v-if="patientLoading" class="admin-card admin-empty">Đang tải...</div>
      <div v-else-if="patientError" class="admin-card admin-empty" style="color:var(--coral);">Không tải được danh sách.</div>
      <div v-else-if="!patientGroups.length" class="admin-card admin-empty">Không có bệnh nhân nào khớp với bộ lọc.</div>
      <template v-else>
        <div v-for="(g, idx) in patientGroups" :key="idx" class="admin-card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer;" @click="openPatientModal(g)">
          <div>
            <div style="font-weight:800;">{{ g.name }}{{ g.age ? ` — ${g.age} tuổi` : '' }}</div>
            <div style="color:var(--text-secondary);font-size:.82rem;margin-top:3px;">Lần gần nhất: {{ dt(g.tests[0].created_at) }}</div>
          </div>
          <div style="font-weight:700;white-space:nowrap;">{{ g.tests.length }} lần test</div>
        </div>
      </template>
    </template>

    <!-- Detail modal -->
    <div class="ca-detail-overlay" :class="{ show: showDetail }">
      <div class="ca-detail-box">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ detailItem?.name }}</div>
            <div class="ca-detail-meta">{{ detailMetaText }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="closeDetail">✕</button>
        </div>

        <div v-if="detailItem?.has_attachment" style="margin-bottom:14px;">
          <button v-if="!attachmentUrl && !attachmentLoading && !attachmentError" type="button" class="btn-outline" @click="viewAttachment">🖼️ Xem ảnh đính kèm</button>
          <p v-else-if="attachmentLoading" style="color:var(--text-secondary);">Đang tải ảnh...</p>
          <p v-else-if="attachmentError" style="color:var(--coral);">Không tải được ảnh đính kèm.</p>
          <img v-else :src="attachmentUrl" alt="Ảnh đính kèm" style="max-width:100%;border-radius:12px;border:1.5px solid var(--kraft-light);">
        </div>

        <div v-if="detailEditing" class="ca-edit-panel">
          <div class="ca-edit-grid">
            <div class="form-group">
              <label class="form-label">Tên người làm bài</label>
              <input v-model="editName" type="text" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tuổi</label>
              <input v-model="editAge" type="number" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Điểm tổng</label>
              <input v-model="editScore" type="number" step="0.5" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Xếp loại</label>
              <input v-model="editSeverity" type="text" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ghi chú</label>
            <textarea v-model="editNote" class="form-input ca-edit-note"></textarea>
          </div>
          <p class="ca-edit-hint">Sửa câu trả lời/điểm từng câu ở bảng dưới — với các bài có trong danh mục, điểm tổng ở trên tự tính lại theo đúng công thức của bài đó. Bài không có công thức (Raven CPM, CARS...) thì tự nhập điểm tổng.</p>
        </div>

        <table class="ca-detail-table">
          <thead>
            <tr>
              <th style="width:36px;">#</th>
              <th>Câu hỏi / Mục</th>
              <th style="width:180px;">Trả lời</th>
              <th style="width:180px;">Điểm</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!displayRows.length"><td colspan="4" style="color:var(--text-secondary);">Không có dữ liệu chi tiết từng câu.</td></tr>
            <tr v-for="r in displayRows" :key="r.no">
              <td>{{ r.no }}</td>
              <td>{{ r.question }}</td>
              <template v-if="!detailEditing">
                <td>{{ r.answer }}</td>
                <td>{{ r.score }}</td>
              </template>
              <template v-else-if="r.options">
                <td>
                  <select v-model="r.selIdx" class="form-input" @change="recomputeTotal">
                    <option v-for="(opt, i) in r.options" :key="i" :value="i">{{ opt.label }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="r.selIdx" class="form-input" @change="recomputeTotal">
                    <option v-for="(opt, i) in r.options" :key="i" :value="i">{{ opt.score }}</option>
                  </select>
                </td>
              </template>
              <template v-else>
                <td><input v-model="r.answer" type="text" class="form-input"></td>
                <td><input v-model="r.score" type="number" step="0.5" class="form-input" @input="recomputeTotal"></td>
              </template>
            </tr>
          </tbody>
        </table>

        <div v-if="showSharePanel" class="ca-edit-panel">
          <div class="ca-share-list">
            <span v-if="shareLoading">Đang tải...</span>
            <span v-else-if="shareError" style="color:var(--coral);">Không tải được danh sách chia sẻ.</span>
            <span v-else-if="!shareEntries.length" style="color:var(--text-secondary);">Chưa chia sẻ với ai.</span>
            <template v-else>
              <strong>Đã chia sẻ với:</strong>
              <ul style="margin:6px 0 0;padding-left:18px;">
                <li v-for="s in shareEntries" :key="s.shared_with_user_id">
                  {{ s.full_name || s.email }}
                  <button type="button" style="border:none;background:none;color:var(--coral);cursor:pointer;font-size:.78rem;" @click="removeShare(s.shared_with_user_id)">Gỡ</button>
                </li>
              </ul>
            </template>
          </div>
          <p class="form-label" style="margin-bottom:6px;">Chia sẻ cho (chọn nhiều được)</p>
          <div class="ca-share-checklist">
            <span v-if="!colleagues.length" style="color:var(--text-secondary);font-size:.85rem;">Không có chuyên gia nào khác.</span>
            <label v-for="c in colleagues" :key="c.user_id">
              <input type="checkbox" :value="c.user_id" v-model="selectedColleagueIds"> {{ c.full_name }}
            </label>
          </div>
          <button type="button" class="btn-primary" style="margin-top:8px;" @click="confirmShare">🔗 Chia sẻ cho những người đã chọn</button>
          <div class="ca-transfer-box">
            <p class="form-label" style="margin-bottom:6px;">Hoặc chuyển hẳn hồ sơ này cho</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <select v-model="transferTarget" class="form-input" style="max-width:280px;">
                <option value="">Chọn chuyên gia...</option>
                <option v-for="c in colleagues" :key="c.user_id" :value="c.user_id">{{ c.full_name }}</option>
              </select>
              <button type="button" class="btn-danger" @click="doTransfer">🔁 Chuyển hẳn</button>
            </div>
          </div>
        </div>

        <div class="ca-detail-actions">
          <button type="button" class="ca-export-btn" @click="toggleFlagInDetail">{{ detailItem?.flagged ? '⭐ Đã đánh dấu' : '☆ Đánh dấu' }}</button>
          <button type="button" class="ca-export-btn" @click="toggleEdit">{{ detailEditing ? 'Hủy sửa' : '✏️ Sửa kết quả' }}</button>
          <button v-if="detailEditing" type="button" class="ca-export-btn" :disabled="saving" @click="saveEdit">💾 Lưu thay đổi</button>
          <button type="button" class="ca-export-btn" @click="toggleSharePanel">🔗 Chia sẻ / Chuyển</button>
          <button type="button" class="ca-export-btn" @click="exportCsv">📊 Xuất Excel (CSV)</button>
          <button type="button" class="ca-export-btn" @click="exportPdf">📄 Xuất PDF</button>
          <button type="button" class="btn-danger" @click="deleteResult">🗑️ Xoá kết quả</button>
          <button type="button" @click="closeDetail">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Patient modal -->
    <div class="ca-detail-overlay" :class="{ show: showPatientModal }">
      <div class="ca-detail-box">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">{{ selectedPatientGroup?.name }}</div>
            <div class="ca-detail-meta">{{ selectedPatientGroup ? `${selectedPatientGroup.age ? `${selectedPatientGroup.age} tuổi · ` : ''}${selectedPatientGroup.tests.length} lần test` : '' }}</div>
          </div>
          <button type="button" class="ca-detail-close" @click="showPatientModal = false">✕</button>
        </div>
        <div>
          <div
            v-for="t in sortedPatientTests"
            :key="t.id"
            style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px dashed var(--kraft-light);cursor:pointer;"
            @click="openTestFromPatientModal(t)"
          >
            <div>
              <div style="font-weight:800;">{{ t.name }}</div>
              <div style="color:var(--text-secondary);font-size:.82rem;">{{ dt(t.created_at) }} · Tài khoản: {{ t.owner_name || t.owner_email }}</div>
            </div>
            <div style="font-weight:700;text-align:right;white-space:nowrap;">{{ t.severity || 'Đã hoàn thành' }}<br>{{ t.total_score }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export owner modal -->
    <div class="ca-detail-overlay" :class="{ show: showExportOwnerModal }">
      <div class="ca-detail-box" style="max-width:520px;">
        <div class="ca-detail-head">
          <div>
            <div class="ca-detail-title">Chọn tài khoản để xuất Excel</div>
            <div class="ca-detail-meta">Không chọn tài khoản nào = xuất toàn bộ hệ thống.</div>
          </div>
          <button type="button" class="ca-detail-close" @click="showExportOwnerModal = false">✕</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button type="button" class="btn-outline" @click="ownerList.forEach((o) => (o.active = true))">Chọn tất cả</button>
          <button type="button" class="btn-outline" @click="ownerList.forEach((o) => (o.active = false))">Bỏ chọn</button>
        </div>
        <div class="ca-owner-tags" style="max-height:320px;overflow-y:auto;">
          <span v-if="ownerLoading">Đang tải...</span>
          <span v-else-if="ownerError" style="color:var(--coral);">Không tải được danh sách tài khoản.</span>
          <span v-else-if="!ownerList.length" style="color:var(--text-secondary);">Chưa có tài khoản nào có kết quả.</span>
          <button
            v-for="o in ownerList"
            :key="o.owner_user_id"
            type="button"
            class="ca-owner-tag"
            :class="{ active: o.active, 'is-expert': o.owner_role === 'expert' }"
            @click="o.active = !o.active"
          >
            {{ o.owner_role === 'expert' ? '🧑‍⚕️' : '👤' }} {{ o.owner_name || o.owner_email }}
            <span v-if="o.owner_role === 'expert'" class="ca-owner-role-badge">Chuyên gia</span>
            <span class="ca-owner-tag-count">({{ o.result_count }})</span>
          </button>
        </div>
        <div class="ca-detail-actions">
          <button type="button" class="btn-primary" @click="confirmExportOwners">📊 Xuất Excel</button>
          <button type="button" @click="showExportOwnerModal = false">Huỷ</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { apiClient } from '../../lib/apiClient';
import { icon } from '../../lib/adminIcons';
import AdminPager from '../../components/AdminPager.vue';

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dt(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(v));
  } catch (_e) { return v; }
}

const TEST_CODES = [
  { code: 'DASS21', label: 'DASS-21' },
  { code: 'GAD7', label: 'GAD-7' },
  { code: 'HARS', label: 'HARS' },
  { code: 'PHQ9', label: 'PHQ-9' },
  { code: 'PSQI', label: 'PSQI' },
  { code: 'PSS', label: 'PSS' },
  { code: 'SDQ25', label: 'SDQ-25' },
  { code: 'MMSE', label: 'MMSE' },
  { code: 'ISI', label: 'ISI' },
  { code: 'IAT', label: 'IAT' },
  { code: 'AUDIT', label: 'AUDIT' },
  { code: 'RAVEN_CPM', label: 'Raven CPM' },
  { code: 'CARS', label: 'CARS' },
  { code: 'SDQ25_OBS', label: 'SDQ-25 (quan sát)' }
];

function normalizeAnswerRow(entry, index) {
  if (entry === null || typeof entry !== 'object') {
    return { no: index + 1, question: `Câu ${index + 1}`, answer: entry === null || entry === undefined ? '(không có dữ liệu)' : String(entry), score: '' };
  }
  const question = entry.question || entry.domain || entry.item || `Câu ${index + 1}`;
  const answer = entry.answer ?? (entry.choice !== undefined && entry.choice !== null ? `Đáp án ${entry.choice}` : '');
  const score = entry.score ?? entry.choice ?? '';
  return { no: index + 1, question, answer, score };
}

let answerCatalogPromise = null;
function loadAnswerCatalog() {
  if (!answerCatalogPromise) {
    answerCatalogPromise = fetch('/data/self-test-answer-catalog.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return answerCatalogPromise;
}

function findCatalogOptions(catalog, testCode, row) {
  const test = catalog?.[String(testCode || '').toLowerCase()];
  if (!test) return null;
  const byIndex = test.questions[row.no - 1];
  if (byIndex && byIndex.text === row.question) return byIndex.options;
  const byText = test.questions.find((q) => q.text === row.question);
  return byText ? byText.options : null;
}

function computeTotalFromRowScores(testCode, catalog, scoresByIndex) {
  const test = catalog?.[String(testCode || '').toLowerCase()];
  if (!test?.scoring) return null;
  const subScores = {};
  Object.entries(test.scoring).forEach(([key, sc]) => {
    let sum = 0;
    sc.indices.forEach((idx) => { sum += Number(scoresByIndex[idx]) || 0; });
    subScores[key] = sum * sc.multiplier;
  });
  if (subScores.total !== undefined) return subScores.total;
  return Object.values(subScores).reduce((a, b) => a + b, 0);
}

function groupResultsByPerson(results) {
  const groups = new Map();
  results.forEach((item) => {
    const rawName = (item.respondent_name || '').trim() || 'Chưa rõ tên';
    const normName = rawName.normalize('NFC').toLowerCase();
    const hasAge = item.respondent_age !== null && item.respondent_age !== undefined && item.respondent_age !== '';
    const ageKey = hasAge ? String(item.respondent_age) : '__unknown__';
    const key = `${normName}|${ageKey}`;
    if (!groups.has(key)) {
      groups.set(key, { name: rawName, age: hasAge ? ageKey : '', tests: [] });
    }
    groups.get(key).tests.push(item);
  });

  const nameOccurrence = new Map();
  groups.forEach((group) => {
    const key = group.name.normalize('NFC').toLowerCase();
    nameOccurrence.set(key, (nameOccurrence.get(key) || 0) + 1);
  });

  const finalGroups = Array.from(groups.values()).map((group) => {
    const key = group.name.normalize('NFC').toLowerCase();
    const needsSuffix = nameOccurrence.get(key) > 1;
    const sheetSuffix = needsSuffix ? (group.age ? ` (${group.age} tuổi)` : ' (chưa rõ tuổi)') : '';
    return { ...group, sheetSuffix };
  });

  return finalGroups.sort((a, b) => {
    const aMax = Math.max(...a.tests.map((t) => new Date(t.created_at).getTime()));
    const bMax = Math.max(...b.tests.map((t) => new Date(t.created_at).getTime()));
    return bMax - aMax;
  });
}

// ===== Search / list state =====
const searchName = ref('');
const searchOwner = ref('');
const searchCode = ref('');
const searchAgeMin = ref('');
const searchAgeMax = ref('');
const searchFlagged = ref(false);

const filters = reactive({ search: '', owner: '', code: '', ageMin: '', ageMax: '', flaggedOnly: false });

const patientViewActive = ref(false);
const items = ref([]);
const page = ref(0);
const limit = 20;
const total = ref(0);
const loading = ref(false);
const loadError = ref('');

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)));
const metaText = computed(() => {
  if (patientViewActive.value) {
    if (patientLoading.value || patientError.value || !patientGroups.value.length) return '';
    return `${patientGroups.value.length} bệnh nhân · ${patientGroups.value.reduce((a, g) => a + g.tests.length, 0)} lượt test`;
  }
  if (loading.value || loadError.value || !items.value.length) return '';
  return `${page.value * limit + 1}–${page.value * limit + items.value.length} trong ${total.value} kết quả · Trang ${page.value + 1}/${totalPages.value}`;
});

function buildQuery(extra = {}) {
  const qs = new URLSearchParams(extra);
  if (filters.search) qs.set('search', filters.search);
  if (filters.owner) qs.set('owner', filters.owner);
  if (filters.code) qs.set('code', filters.code);
  if (filters.ageMin) qs.set('age_min', filters.ageMin);
  if (filters.ageMax) qs.set('age_max', filters.ageMax);
  if (filters.flaggedOnly) qs.set('flagged', 'true');
  return qs;
}

async function load(p = page.value) {
  page.value = Math.max(0, p);
  loading.value = true;
  loadError.value = '';
  try {
    const qs = buildQuery({ limit: String(limit), offset: String(page.value * limit) });
    const data = await apiClient.get(`/admin/assessment-results?${qs.toString()}`, { noCache: true });
    items.value = data?.items || [];
    total.value = data?.total || 0;
  } catch (_e) {
    loadError.value = 'Không tải được danh sách.';
  } finally {
    loading.value = false;
  }
}

const patientGroups = ref([]);
const patientLoading = ref(false);
const patientError = ref(false);

async function loadPatientSummaryView() {
  patientLoading.value = true;
  patientError.value = false;
  patientGroups.value = [];
  try {
    const qs = buildQuery({ limit: '0' });
    const data = await apiClient.get(`/admin/assessment-results?${qs.toString()}`, { noCache: true });
    const results = data?.items || [];
    patientGroups.value = groupResultsByPerson(results);
  } catch (_e) {
    patientError.value = true;
  } finally {
    patientLoading.value = false;
  }
}

function runSearch() {
  filters.search = searchName.value.trim();
  filters.owner = searchOwner.value.trim();
  filters.code = searchCode.value;
  filters.ageMin = searchAgeMin.value.toString().trim();
  filters.ageMax = searchAgeMax.value.toString().trim();
  filters.flaggedOnly = searchFlagged.value;
  if (patientViewActive.value) loadPatientSummaryView();
  else load(0);
}

function resetSearch() {
  searchName.value = '';
  searchOwner.value = '';
  searchCode.value = '';
  searchAgeMin.value = '';
  searchAgeMax.value = '';
  searchFlagged.value = false;
  filters.search = '';
  filters.owner = '';
  filters.code = '';
  filters.ageMin = '';
  filters.ageMax = '';
  filters.flaggedOnly = false;
  if (patientViewActive.value) loadPatientSummaryView();
  else load(0);
}

function togglePatientView() {
  patientViewActive.value = !patientViewActive.value;
  if (patientViewActive.value) loadPatientSummaryView();
  else load(0);
}

function toggleFlag(item) {
  apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged })
    .then((updated) => { item.flagged = updated.flagged; load(page.value); })
    .catch((error) => alert(error.message || 'Không thể đánh dấu.'));
}

// ===== Patient modal =====
const showPatientModal = ref(false);
const selectedPatientGroup = ref(null);
const sortedPatientTests = computed(() => {
  if (!selectedPatientGroup.value) return [];
  return selectedPatientGroup.value.tests.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});
function openPatientModal(group) {
  selectedPatientGroup.value = group;
  showPatientModal.value = true;
}
function openTestFromPatientModal(t) {
  showPatientModal.value = false;
  openDetail(t);
}

// ===== Detail modal =====
const showDetail = ref(false);
const detailItem = ref(null);
const detailRows = ref([]);
const editRows = ref([]);
const detailEditing = ref(false);
const detailCatalog = ref(null);
const saving = ref(false);

const attachmentUrl = ref(null);
const attachmentLoading = ref(false);
const attachmentError = ref(false);

const editName = ref('');
const editAge = ref('');
const editScore = ref('');
const editSeverity = ref('');
const editNote = ref('');

const displayRows = computed(() => (detailEditing.value ? editRows.value : detailRows.value));

const detailMetaText = computed(() => {
  const item = detailItem.value;
  if (!item) return '';
  const parts = [];
  parts.push(`Tài khoản: ${item.owner_name || item.owner_email} (${item.owner_email})`);
  if (item.respondent_name) parts.push(`Người làm bài: ${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
  parts.push(`Điểm: ${item.total_score}`);
  parts.push(`Xếp loại: ${item.severity || 'Đã hoàn thành'}`);
  parts.push(dt(item.created_at));
  if (item.note) parts.push(`Ghi chú: ${item.note}`);
  if (item.edited_at) parts.push(`(đã sửa lúc ${dt(item.edited_at)})`);
  return parts.join(' · ');
});

function openDetail(item) {
  detailItem.value = item;
  detailRows.value = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];
  editRows.value = [];
  detailEditing.value = false;
  detailCatalog.value = null;
  attachmentUrl.value = null;
  attachmentLoading.value = false;
  attachmentError.value = false;
  showSharePanel.value = false;
  showDetail.value = true;
}
function closeDetail() {
  showDetail.value = false;
  detailItem.value = null;
}

async function viewAttachment() {
  attachmentLoading.value = true;
  attachmentError.value = false;
  try {
    const blob = await apiClient.getBlob(`/assessments/results/${detailItem.value.id}/attachment`);
    attachmentUrl.value = URL.createObjectURL(blob);
  } catch (_e) {
    attachmentError.value = true;
  } finally {
    attachmentLoading.value = false;
  }
}

function toggleFlagInDetail() {
  const item = detailItem.value;
  apiClient.patch(`/assessments/results/${item.id}/flag`, { flagged: !item.flagged })
    .then((updated) => {
      item.flagged = updated.flagged;
      const listed = items.value.find((r) => r.id === item.id);
      if (listed) listed.flagged = item.flagged;
    })
    .catch((error) => alert(error.message || 'Không thể đánh dấu.'));
}

async function toggleEdit() {
  if (!detailItem.value) return;
  detailEditing.value = !detailEditing.value;
  const item = detailItem.value;

  if (detailEditing.value) {
    editName.value = item.respondent_name || '';
    editAge.value = item.respondent_age ?? '';
    editScore.value = item.total_score ?? '';
    editSeverity.value = item.severity || '';
    editNote.value = item.note || '';

    const catalog = await loadAnswerCatalog();
    if (!detailItem.value || detailItem.value !== item) return;
    detailCatalog.value = catalog;
    editRows.value = detailRows.value.map((r) => {
      const options = findCatalogOptions(catalog, item.code, r);
      if (options) {
        let selIdx = options.findIndex((opt) => opt.label === r.answer);
        if (selIdx === -1) selIdx = options.findIndex((opt) => opt.score === r.score);
        if (selIdx === -1) selIdx = 0;
        return { ...r, options, selIdx };
      }
      return { ...r, options: null, answer: r.answer, score: r.score };
    });
    recomputeTotal();
  } else {
    detailCatalog.value = null;
  }
}

function recomputeTotal() {
  const item = detailItem.value;
  const scoresByIndex = editRows.value.map((r) => (r.options ? Number(r.options[r.selIdx]?.score) : Number(r.score)));
  const total = computeTotalFromRowScores(item?.code, detailCatalog.value, scoresByIndex);
  if (total !== null) editScore.value = total;
}

async function saveEdit() {
  const item = detailItem.value;
  const editedRows = editRows.value.map((r, i) => {
    if (r.options) {
      const opt = r.options[r.selIdx];
      return { question: r.question, answer: opt ? opt.label : r.answer, score: opt ? opt.score : r.score };
    }
    const original = detailRows.value[i];
    return {
      question: r.question,
      answer: r.answer,
      score: r.score !== '' ? Number(r.score) : original.score
    };
  });

  const payload = {
    respondent_name: String(editName.value || '').trim() || null,
    respondent_age: String(editAge.value || '').trim() || null,
    total_score: Number(editScore.value),
    severity: String(editSeverity.value || '').trim() || null,
    note: String(editNote.value || '').trim() || null,
    raw_answers: editedRows
  };
  if (!Number.isFinite(payload.total_score)) {
    alert('Điểm tổng không hợp lệ.');
    return;
  }

  saving.value = true;
  try {
    const updated = await apiClient.patch(`/assessments/results/${item.id}`, payload);
    Object.assign(item, updated, { raw_answers: editedRows });
    detailRows.value = editedRows.map(normalizeAnswerRow);
    detailEditing.value = false;
    load(page.value);
  } catch (error) {
    alert(error.message || 'Không thể lưu thay đổi.');
  } finally {
    saving.value = false;
  }
}

// ===== Share / transfer =====
const showSharePanel = ref(false);
const shareEntries = ref([]);
const shareLoading = ref(false);
const shareError = ref(false);
const colleagues = ref([]);
let colleaguesLoaded = false;
const selectedColleagueIds = ref([]);
const transferTarget = ref('');

async function ensureColleaguesLoaded() {
  if (colleaguesLoaded) return colleagues.value;
  try {
    const data = await apiClient.get('/admin/experts?limit=100&active=true', { noCache: true });
    colleagues.value = (data?.experts || []).filter((e) => e.user_id);
  } catch (_error) {
    colleagues.value = [];
  }
  colleaguesLoaded = true;
  return colleagues.value;
}

async function refreshShareList() {
  shareLoading.value = true;
  shareError.value = false;
  try {
    shareEntries.value = await apiClient.get(`/assessments/results/${detailItem.value.id}/shares`, { noCache: true });
  } catch (_error) {
    shareError.value = true;
  } finally {
    shareLoading.value = false;
  }
}

async function toggleSharePanel() {
  showSharePanel.value = !showSharePanel.value;
  if (!showSharePanel.value) return;
  await ensureColleaguesLoaded();
  selectedColleagueIds.value = [];
  transferTarget.value = '';
  refreshShareList();
}

async function removeShare(targetId) {
  try {
    await apiClient.delete(`/assessments/results/${detailItem.value.id}/share/${targetId}`);
    refreshShareList();
  } catch (error) {
    alert(error.message || 'Không thể gỡ chia sẻ.');
  }
}

async function confirmShare() {
  if (!selectedColleagueIds.value.length) {
    alert('Vui lòng chọn ít nhất 1 chuyên gia cần chia sẻ.');
    return;
  }
  try {
    await apiClient.post(`/assessments/results/${detailItem.value.id}/share`, { target_user_ids: selectedColleagueIds.value });
    selectedColleagueIds.value = [];
    refreshShareList();
  } catch (error) {
    alert(error.message || 'Không thể chia sẻ.');
  }
}

async function doTransfer() {
  if (!transferTarget.value) {
    alert('Vui lòng chọn chuyên gia cần chuyển hồ sơ.');
    return;
  }
  const targetName = colleagues.value.find((c) => c.user_id === transferTarget.value)?.full_name || 'chuyên gia này';
  const item = detailItem.value;
  if (!window.confirm(`Chuyển hẳn kết quả "${item.name}" của ${item.respondent_name || 'người này'} sang tài khoản ${targetName}?`)) return;
  try {
    await apiClient.post(`/assessments/results/${item.id}/transfer`, { target_user_id: transferTarget.value });
    closeDetail();
    if (patientViewActive.value) loadPatientSummaryView();
    else load(page.value);
  } catch (error) {
    alert(error.message || 'Không thể chuyển hồ sơ.');
  }
}

async function deleteResult() {
  const item = detailItem.value;
  if (!window.confirm(`Xoá kết quả "${item.name}" của ${item.respondent_name || 'người này'}? Không thể hoàn tác.`)) return;
  try {
    await apiClient.delete(`/admin/assessment-results/${item.id}`);
    closeDetail();
    if (patientViewActive.value) loadPatientSummaryView();
    else load(page.value);
  } catch (error) {
    alert(error.message || 'Không thể xoá kết quả.');
  }
}

// ===== CSV / PDF export (single result) =====
function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(filename, lines) {
  const csvContent = '﻿' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCsv() {
  if (!detailItem.value) return;
  const item = detailItem.value;
  const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];
  const lines = [];
  lines.push(['Bài test', item.name].map(csvEscape).join(','));
  lines.push(['Tài khoản', `${item.owner_name || ''} (${item.owner_email})`].map(csvEscape).join(','));
  if (item.respondent_name) lines.push(['Người làm bài', `${item.respondent_name}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`].map(csvEscape).join(','));
  lines.push(['Điểm', item.total_score].map(csvEscape).join(','));
  lines.push(['Xếp loại', item.severity || ''].map(csvEscape).join(','));
  lines.push(['Ngày', dt(item.created_at)].map(csvEscape).join(','));
  if (item.note) lines.push(['Ghi chú', item.note].map(csvEscape).join(','));
  lines.push('');
  lines.push(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm'].map(csvEscape).join(','));
  rows.forEach((r) => lines.push([r.no, r.question, r.answer, r.score].map(csvEscape).join(',')));
  downloadCsv(`${(item.name || 'ket-qua').replace(/\s+/g, '-')}-${item.id.slice(0, 8)}.csv`, lines);
}

function exportPdf() {
  if (!detailItem.value) return;
  const item = detailItem.value;
  const rows = Array.isArray(item.raw_answers) ? item.raw_answers.map(normalizeAnswerRow) : [];

  const metaLines = [];
  metaLines.push(`Tài khoản: ${esc(item.owner_name || '')} (${esc(item.owner_email)})`);
  if (item.respondent_name) metaLines.push(`Người làm bài: ${esc(item.respondent_name)}${item.respondent_age ? ` (${item.respondent_age} tuổi)` : ''}`);
  metaLines.push(`Điểm: ${esc(String(item.total_score))}`);
  metaLines.push(`Xếp loại: ${esc(item.severity || 'Đã hoàn thành')}`);
  metaLines.push(`Ngày: ${esc(dt(item.created_at))}`);
  if (item.note) metaLines.push(`Ghi chú: ${esc(item.note)}`);

  const tableRows = rows.map((r) => `
        <tr><td>${r.no}</td><td>${esc(String(r.question))}</td><td>${esc(String(r.answer))}</td><td>${esc(String(r.score))}</td></tr>
    `).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để xuất PDF.');
    return;
  }
  printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>${esc(item.name)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
                h1 { font-size: 20px; margin-bottom: 4px; }
                .meta { font-size: 13px; color: #555; margin-bottom: 16px; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
                th { background: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>${esc(item.name)}</h1>
            <div class="meta">${metaLines.join('<br>')}</div>
            <table>
                <thead><tr><th>#</th><th>Câu hỏi / Mục</th><th>Trả lời</th><th>Điểm</th></tr></thead>
                <tbody>${tableRows || '<tr><td colspan="4">Không có dữ liệu chi tiết.</td></tr>'}</tbody>
            </table>
        </body>
        </html>
    `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

// ===== Export all (Excel, all accounts) =====
const showExportOwnerModal = ref(false);
const ownerList = ref([]);
const ownerLoading = ref(false);
const ownerError = ref(false);
const exportingAll = ref(false);
const exportAllLabel = computed(() => (exportingAll.value ? '⏳ Đang tạo file...' : '📊 Xuất Excel toàn bộ'));

async function openExportOwnerModal() {
  showExportOwnerModal.value = true;
  ownerLoading.value = true;
  ownerError.value = false;
  ownerList.value = [];
  try {
    const owners = await apiClient.get('/admin/assessment-results/owners', { noCache: true });
    ownerList.value = (owners || []).map((o) => ({ ...o, active: false }));
  } catch (_e) {
    ownerError.value = true;
  } finally {
    ownerLoading.value = false;
  }
}

async function confirmExportOwners() {
  const ownerIds = ownerList.value.filter((o) => o.active).map((o) => o.owner_user_id);
  showExportOwnerModal.value = false;
  await runExportAll(ownerIds);
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

function buildInterpretation(item) {
  const ir = item.interpreted_result;
  if (ir && typeof ir === 'object') {
    if (ir.summary_html) return stripHtml(ir.summary_html);
    if (ir.scored && ir.standard_score !== undefined) {
      const parts = [`Điểm thô: ${ir.raw_total}/36`];
      if (ir.standard_score !== null) {
        parts.push(`SS: ${ir.standard_score}`, `Percentile: ${ir.percentile}`, `Xếp loại: ${ir.iq_label}`);
      } else if (ir.note) {
        parts.push(ir.note);
      }
      return parts.join(' — ');
    }
    if (ir.note) return ir.note;
  }
  if (item.dimension_scores && typeof item.dimension_scores === 'object' && Object.keys(item.dimension_scores).length) {
    return Object.entries(item.dimension_scores)
      .map(([key, value]) => `${key}: ${value?.severity || value?.score || ''}`)
      .join('; ');
  }
  return `Điểm ${item.total_score} — ${item.severity || 'Đã hoàn thành'}`;
}

function sanitizeSheetName(raw, usedNames) {
  let base = String(raw).replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet';
  let candidate = base;
  let counter = 2;
  while (usedNames.has(candidate)) {
    const suffix = ` (${counter})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
    counter += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

const XLS_COLORS = {
  header: 'FF7BBF95',
  headerText: 'FFFFFFFF',
  section: 'FFE8CBA7',
  subHeader: 'FFC5E8F5',
  borderLine: 'FFD4A574',
  zebra: 'FFFFF8F0',
  darkText: 'FF4A3728'
};

function xlsThinBorder() {
  const style = { style: 'thin', color: { argb: XLS_COLORS.borderLine } };
  return { top: style, left: style, bottom: style, right: style };
}

function xlsStyleHeaderRow(row, fillArgb = XLS_COLORS.header, fontArgb = XLS_COLORS.headerText) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
    cell.font = { bold: true, color: { argb: fontArgb } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = xlsThinBorder();
  });
}

function xlsStyleDataRow(row, zebra) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = xlsThinBorder();
    cell.alignment = { vertical: 'top', wrapText: true };
    if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLS_COLORS.zebra } };
  });
}

function xlsStyleSectionRow(row, span) {
  row.font = { bold: true, color: { argb: XLS_COLORS.darkText } };
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLS_COLORS.section } };
  });
  if (span) row.worksheet.mergeCells(`A${row.number}:${span}${row.number}`);
}

async function runExportAll(ownerIds) {
  exportingAll.value = true;
  try {
    const qs = new URLSearchParams({ limit: '0' });
    if (ownerIds && ownerIds.length) qs.set('owner_ids', ownerIds.join(','));
    const allData = await apiClient.get(`/admin/assessment-results?${qs.toString()}`, { noCache: true });
    const allResults = allData?.items || [];
    if (!allResults.length) {
      alert('Chưa có kết quả nào để xuất.');
      return;
    }

    const mod = await import('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm');
    const ExcelJS = mod.default || mod;
    const wb = new ExcelJS.Workbook();
    const groupList = groupResultsByPerson(allResults);

    const summarySheet = wb.addWorksheet('Danh sách chung');
    summarySheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Họ tên', key: 'name', width: 22 },
      { header: 'Tuổi', key: 'age', width: 8 },
      { header: 'Tài khoản đã nhập', key: 'owner', width: 26 },
      { header: 'Ghi chú', key: 'note', width: 24 },
      { header: 'Bài test', key: 'test', width: 28 },
      { header: 'Điểm tổng', key: 'score', width: 10 },
      { header: 'Xếp loại', key: 'severity', width: 16 },
      { header: 'Diễn giải kết quả', key: 'interp', width: 60 },
      { header: 'Thời gian', key: 'time', width: 20 }
    ];
    xlsStyleHeaderRow(summarySheet.getRow(1));
    summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

    let stt = 0;
    groupList.forEach((group) => {
      const startRow = summarySheet.rowCount + 1;
      group.tests.forEach((t, i) => {
        stt += 1;
        const row = summarySheet.addRow({
          stt,
          name: group.name,
          age: group.age,
          owner: `${t.owner_name || ''} (${t.owner_email})`,
          note: t.note || '',
          test: t.name,
          score: t.total_score,
          severity: t.severity || '',
          interp: buildInterpretation(t),
          time: dt(t.created_at)
        });
        xlsStyleDataRow(row, i % 2 === 1);
      });
      const endRow = summarySheet.rowCount;
      if (endRow > startRow) {
        summarySheet.mergeCells(`B${startRow}:B${endRow}`);
        summarySheet.mergeCells(`C${startRow}:C${endRow}`);
        summarySheet.getCell(`B${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        summarySheet.getCell(`C${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    const usedNames = new Set(['Danh sách chung']);
    let personIndex = 0;
    groupList.forEach((group) => {
      personIndex += 1;
      const sheetName = sanitizeSheetName(`${personIndex}. ${group.name}${group.sheetSuffix}`, usedNames);
      const sheet = wb.addWorksheet(sheetName);
      sheet.columns = [{ key: 'c1', width: 28 }, { key: 'c2', width: 42 }, { key: 'c3', width: 22 }, { key: 'c4', width: 18 }];

      const titleRow = sheet.addRow([`Họ tên: ${group.name}`]);
      xlsStyleSectionRow(titleRow, 'D');
      titleRow.font = { bold: true, size: 13, color: { argb: XLS_COLORS.darkText } };

      const infoText = group.sheetSuffix
        ? `Tuổi: ${group.age || 'Không rõ'}    |    Số bài đã làm: ${group.tests.length}    |    ⚠️ Có người khác trùng tên nhưng khác tuổi — đã tách riêng sheet.`
        : `Tuổi: ${group.age || 'Không rõ'}    |    Số bài đã làm: ${group.tests.length}`;
      const infoRow = sheet.addRow([infoText]);
      sheet.mergeCells(`A${infoRow.number}:D${infoRow.number}`);
      infoRow.font = { italic: true };

      sheet.addRow([]);

      const summaryTitleRow = sheet.addRow(['Bảng tổng hợp các bài đã làm']);
      xlsStyleSectionRow(summaryTitleRow, 'D');

      const summaryHeaderRow = sheet.addRow(['Bài test', 'Điểm / Xếp loại', 'Tài khoản đã nhập', 'Thời gian']);
      xlsStyleHeaderRow(summaryHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);
      group.tests.forEach((t, i) => {
        const row = sheet.addRow([t.name, `${t.total_score} — ${t.severity || ''}`, `${t.owner_name || ''} (${t.owner_email})`, dt(t.created_at)]);
        xlsStyleDataRow(row, i % 2 === 1);
      });

      sheet.addRow([]);

      group.tests.forEach((t) => {
        const rows = Array.isArray(t.raw_answers) ? t.raw_answers.map(normalizeAnswerRow) : [];
        const sectionRow = sheet.addRow([`Chi tiết: ${t.name} — ${dt(t.created_at)} — Tài khoản: ${t.owner_name || t.owner_email}`]);
        xlsStyleSectionRow(sectionRow, 'D');

        const qHeaderRow = sheet.addRow(['#', 'Câu hỏi / Mục', 'Trả lời', 'Điểm']);
        xlsStyleHeaderRow(qHeaderRow, XLS_COLORS.subHeader, XLS_COLORS.darkText);

        if (rows.length) {
          rows.forEach((r, i) => {
            const row = sheet.addRow([r.no, r.question, r.answer, r.score]);
            xlsStyleDataRow(row, i % 2 === 1);
          });
        } else {
          xlsStyleDataRow(sheet.addRow(['', 'Không có dữ liệu chi tiết từng câu.', '', '']));
        }
        sheet.addRow([]);
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-tu-test-toan-he-thong-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export all assessment results failed:', error);
    alert('Không thể tạo file Excel. Vui lòng thử lại.');
  } finally {
    exportingAll.value = false;
  }
}

onMounted(() => load(0));
</script>

<style scoped src="../../assets/clientAssessments.css"></style>
