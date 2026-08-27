<template>
  <div class="assessment-page">
    <!-- Emergency Overlay -->
    <div class="emergency-overlay" :class="{ show: emergencyOpen }">
      <div class="emergency-popup">
        <div class="ep-icon">❤️</div>
        <div class="ep-title">Bạn không đơn độc</div>
        <p class="ep-text">Nếu điểm số cao và bạn đang cảm thấy khó khăn, hãy để ai đó giúp bạn ngay bây giờ.</p>
        <div class="ep-hotline">
          <div class="eph-num">📞 0931773637</div>
          <div class="eph-label">Đường dây nóng sức khỏe tâm thần — Miễn phí, 24/7</div>
        </div>
        <div class="ep-actions">
          <a href="tel:1800599920" class="ep-btn ep-btn-red">📞 Gọi ngay hotline</a>
          <router-link to="/experts" class="ep-btn ep-btn-green">💬 Kết nối chuyên gia</router-link>
          <button class="ep-btn ep-btn-ghost" @click="emergencyOpen = false">Tôi hiểu, đóng lại</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <!-- ===== TEST SELECTOR VIEW ===== -->
      <div v-show="view === 'selector'">
        <div class="page-header">
          <div>
            <div class="page-title">📋 Bài Kiểm Tra Tâm Lý Chuẩn Hóa</div>
            <div class="page-subtitle">Các thang đo lâm sàng được sử dụng rộng rãi — giúp bạn hiểu sâu hơn về
              bản thân</div>
          </div>
          <div style="display:flex;gap:8px;">
            <router-link to="/mood-checkin" class="btn-outline">← Quay lại</router-link>
            <router-link to="/mood-chat" class="btn-outline">💬 Chat AI</router-link>
          </div>
        </div>

        <div class="disclaimer-banner">
          <span class="db-icon">⚠️</span>
          <div><strong>Lưu ý quan trọng:</strong> Các bài kiểm tra này là công cụ <strong>sàng lọc tham
              khảo</strong>, không phải chẩn đoán y khoa. Kết quả chỉ mang tính định hướng. Nếu điểm số ở mức
            cao, hãy tham khảo ý kiến chuyên gia tâm lý lâm sàng. Ứng dụng này <strong>không thay thế</strong>
            dịch vụ y tế chuyên nghiệp.</div>
        </div>

        <div class="respondent-card">
          <h3>📝 Thông tin người làm test</h3>
          <p class="rc-sub">Điền tên của <strong>người sẽ làm bài</strong> (khách hàng, học sinh, người thân...) — không phải tên tài khoản đang đăng nhập. Thông tin này dùng chung cho mọi bài test bên dưới, chỉ cần điền một lần.
            <br>⚠️ Nếu <strong>2 người khác nhau trùng cả tên lẫn tuổi</strong>, hãy thêm ký hiệu phân biệt vào tên (VD: "Nguyễn Văn A - lớp 5A") để tránh bị gộp nhầm khi chuyên gia xuất báo cáo. Khác tuổi thì hệ thống đã tự tách riêng.
            <br>ℹ️ "Tháng lẻ" chỉ cần điền khi làm bài <strong>Raven CPM</strong> cho trẻ 4-11 tuổi — dùng để tính điểm chuẩn (IQ) đúng theo mốc tuổi tháng. Các bài khác không cần.
            <br>📅 Có thể điền <strong>Ngày sinh</strong> để hệ thống tự tính Tuổi/Tháng lẻ, hoặc bỏ qua và điền trực tiếp Tuổi/Tháng lẻ — chọn 1 trong 2 cách đều được.</p>
          <div class="rc-fields">
            <div class="rp-field">
              <label for="respondentName">Họ và tên người làm bài *</label>
              <input type="text" id="respondentName" v-model="respondent.name" placeholder="Nguyễn Văn A">
            </div>
            <div class="rp-field">
              <label for="respondentDob" title="Điền ngày sinh để tự tính Tuổi/Tháng lẻ, hoặc bỏ trống và điền trực tiếp Tuổi/Tháng lẻ bên cạnh">Ngày sinh (tuỳ chọn)</label>
              <input type="date" id="respondentDob" v-model="respondent.dob" @input="onDobInput">
            </div>
            <div class="rp-field">
              <label for="respondentAge">Tuổi</label>
              <input type="number" id="respondentAge" v-model="respondent.age" min="0" max="120" placeholder="VD: 15">
            </div>
            <div class="rp-field">
              <label for="respondentAgeMonths" title="Chỉ cần điền cho bài Raven CPM (trẻ 4-11 tuổi) để tính điểm chuẩn theo đúng độ tuổi tháng">Tháng lẻ</label>
              <input type="number" id="respondentAgeMonths" v-model="respondent.ageMonths" min="0" max="11" placeholder="0-11">
            </div>
            <div class="rp-field rc-field-note">
              <label for="respondentNote">Ghi chú</label>
              <textarea id="respondentNote" v-model="respondent.note" placeholder="Ghi chú thêm (nếu có)..."></textarea>
            </div>
          </div>
        </div>

        <div class="test-grid">
          <div
            v-for="card in testCards"
            :key="card.key"
            class="test-select-card"
            :class="card.meta.cardClass"
            @click="startTest(card.key)"
          >
            <div class="tsc-icon" :style="card.meta.iconStyle">{{ card.meta.icon }}</div>
            <div class="tsc-name">{{ card.meta.name }}</div>
            <div class="tsc-fullname">{{ card.meta.fullname }}</div>
            <div class="tsc-desc">{{ card.meta.desc }}</div>
            <div class="tsc-meta">
              <span
                v-for="(badge, bIdx) in card.meta.badges"
                :key="bIdx"
                class="badge-pill"
                :class="badge.className || ''"
                :style="badge.style || null"
              >{{ badge.label }}</span>
              <span v-if="card.scorePill !== null" class="badge-pill badge-mint">Điểm gần nhất: {{ card.scorePill }}</span>
            </div>
            <div class="tsc-last">🕐 Lần cuối: {{ card.latestLabel }}</div>
          </div>

          <div class="test-select-card sdq" @click="router.push('/raven-test')">
            <div class="tsc-icon" style="background:var(--sky-light);border-color:var(--lavender);">🧩</div>
            <div class="tsc-name">Raven CPM</div>
            <div class="tsc-fullname">Coloured Progressive Matrices</div>
            <div class="tsc-desc">Trắc nghiệm phi ngôn ngữ đo tư duy logic bằng hình ảnh. Chuyên gia sẽ chấm điểm theo đáp án gốc.</div>
            <div class="tsc-meta">
              <span class="badge-pill badge-sky">36 câu hỏi</span>
              <span class="badge-pill badge-mint">~20 phút</span>
              <span class="badge-pill" style="background:var(--lavender-light);color:#8a6aaa;border:1.5px solid var(--lavender);">Chuyên gia chấm</span>
            </div>
            <div class="tsc-last">🕐 Xem trong lịch sử sau khi có kết quả chấm</div>
          </div>
        </div>

        <!-- History -->
        <div class="history-section">
          <div class="history-title">📅 Lịch sử kiểm tra gần đây</div>
          <div class="history-grid">
            <div v-if="!history.length" class="paper-card" style="padding:18px;color:var(--text-secondary);line-height:1.6;">
              Chưa có kết quả assessment nào được lưu trong hồ sơ của bạn.
            </div>
            <div
              v-for="(item, hIdx) in historyCards"
              :key="hIdx"
              class="paper-card history-card"
              @click="openHistoryReview(item)"
            >
              <div class="hc-test">{{ item.name }}</div>
              <div class="hc-date">{{ item.dateLabel }}</div>
              <div class="hc-scores">
                <span
                  v-for="(pill, pIdx) in item.pills"
                  :key="pIdx"
                  class="hc-score-item"
                  :style="pill.style"
                >{{ pill.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MODAL XEM LẠI KẾT QUẢ CŨ ===== -->
      <div v-if="reviewDetail" class="review-overlay" @click.self="closeHistoryReview">
        <div class="review-modal paper-card">
          <div class="review-head">
            <div>
              <div class="review-title">{{ reviewDetail.name }}</div>
              <div class="review-date">Hoàn thành lúc {{ reviewDetail.dateLabel }}</div>
            </div>
            <button class="review-close" @click="closeHistoryReview" aria-label="Đóng">✕</button>
          </div>

          <div class="review-total">
            <div class="review-total-score">{{ reviewDetail.totalScore }}</div>
            <span v-if="reviewDetail.severity" class="hc-score-item" :style="reviewDetail.severityStyle">{{ reviewDetail.severity }}</span>
          </div>

          <div v-if="reviewDetail.dimensions.length" class="review-dims">
            <div v-for="dim in reviewDetail.dimensions" :key="dim.key" class="review-dim">
              <span class="review-dim-label">{{ dim.label }}</span>
              <span class="review-dim-score">{{ dim.score }}</span>
              <span v-if="dim.severity" class="hc-score-item" :style="dim.style">{{ dim.severity }}</span>
            </div>
          </div>

          <div v-if="reviewDetail.respondentName || reviewDetail.note || reviewDetail.hasAttachment" class="review-meta">
            <div v-if="reviewDetail.respondentName">
              Người làm bài: <strong>{{ reviewDetail.respondentName }}</strong>
              <span v-if="reviewDetail.respondentAge"> ({{ reviewDetail.respondentAge }} tuổi)</span>
            </div>
            <div v-if="reviewDetail.note">Ghi chú: {{ reviewDetail.note }}</div>
            <div v-if="reviewDetail.hasAttachment">📎 Có ảnh đính kèm</div>
          </div>

          <div class="review-actions">
            <button class="btn-primary" @click="retakeFromReview">🔄 Làm lại bài này</button>
            <button class="btn-outline" @click="closeHistoryReview">Đóng</button>
          </div>
        </div>
      </div>

      <!-- ===== TEST AREA ===== -->
      <div class="test-area" :style="{ display: view === 'test' ? 'block' : 'none' }">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <button class="btn-outline" @click="backToSelector">← Chọn bài khác</button>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge-pill badge-mint">{{ currentTest?.name }}</span>
            <button class="btn-outline" style="font-size:0.78rem;padding:7px 14px;" @click="emergencyOpen = true">🆘
              Khẩn cấp</button>
          </div>
        </div>

        <!-- Test Header -->
        <div class="paper-card test-header-card" v-if="currentTest">
          <div class="th-top">
            <div class="th-icon" :style="{ background: currentTest.iconBg, borderColor: currentTest.iconBorder }">{{ currentTest.icon }}</div>
            <div class="th-info">
              <div class="th-name">{{ currentTest.name }}</div>
              <div class="th-fullname">{{ currentTest.fullname }}</div>
            </div>
            <div style="margin-left:auto;text-align:right;">
              <div style="font-size:1.2rem;font-weight:800;">{{ currentQIndex + 1 }}/{{ currentTest.totalQ }}</div>
              <div style="font-size:0.72rem;color:var(--text-secondary);">câu hỏi</div>
            </div>
          </div>
          <div class="th-progress-wrap">
            <div class="th-progress-bar">
              <div class="th-progress-fill" :style="{ width: displayedProgressPct + '%' }"></div>
            </div>
            <div class="th-progress-labels">
              <span>Câu {{ currentQIndex + 1 }}</span>
              <span>{{ displayedProgressPct }}%</span>
            </div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="question-wrap" v-if="currentQuestion">
          <div class="paper-card question-card">
            <div class="q-num">Câu {{ currentQIndex + 1 }} / {{ currentTest.totalQ }}</div>
            <div class="q-category badge-pill badge-peach">{{ currentQuestion.catLabel }}</div>
            <div class="q-text">{{ currentQuestion.text }}</div>
            <div class="q-subtext">{{ currentTest.timeRef ? `Trong thời gian: ${currentTest.timeRef}` : '' }}</div>
            <div class="likert-wrap" :class="`cols-${currentOptions.length}`">
              <div
                v-for="(opt, oIdx) in currentOptions"
                :key="oIdx"
                class="likert-option"
                :class="{ selected: answers[currentQIndex] === opt.score }"
                @click="selectAnswer(opt.score)"
              >
                <span class="lo-emoji">{{ opt.emoji }}</span>
                <span class="lo-label">{{ opt.label }}</span>
              </div>
            </div>
            <div class="q-nav">
              <button class="btn-outline" v-show="currentQIndex > 0" @click="prevQuestion">← Câu
                trước</button>
              <div class="q-nav-info">{{ answers[currentQIndex] !== undefined ? 'Đã chọn. Nhấn Câu tiếp ->' : 'Chọn một đáp án để tiếp tục' }}</div>
              <button class="btn-primary" v-show="answers[currentQIndex] !== undefined" @click="nextQuestion">Câu tiếp
                →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== RESULT PANEL ===== -->
      <div class="result-panel" :class="{ active: view === 'result' }" v-if="result">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <button class="btn-outline" @click="backToSelector">← Chọn bài khác</button>
          <div style="display:flex;gap:8px;">
            <button class="btn-outline" @click="retakeTest">🔄 Làm lại</button>
            <button class="btn-primary" @click="printResult">📄 Xuất PDF</button>
          </div>
        </div>

        <div class="paper-card result-header">
          <div class="rh-mascot">{{ result.icon }}</div>
          <div class="rh-title">Kết quả {{ result.testName }} của bạn</div>
          <div class="rh-subtitle">{{ resultSubtitle }}</div>
        </div>

        <div class="result-scores-grid" :class="`rsg-${Math.min(3, result.cards.length)}`">
          <div v-for="card in result.cards" :key="card.key" class="rs-card" :class="card.levelClass">
            <div class="rs-icon">{{ card.icon }}</div>
            <div class="rs-label">{{ card.displayLabel }}</div>
            <div><span class="rs-score">{{ card.score }}</span><span class="rs-max">/ {{ result.maxScore }}</span></div>
            <div class="rs-level-badge" style="background:rgba(255,255,255,0.4); border:1px solid currentColor;">{{ card.levelLabel }}</div>
          </div>
        </div>

        <div class="paper-card result-interpretation">
          <div class="ri-title">🔍 Diễn giải kết quả</div>
          <div>
            <ul style="padding:0; margin:0; list-style:none;">
              <li v-for="item in result.interpretation" :key="item.key" class="ri-item" :class="item.tone">
                <span class="ri-icon">{{ item.icon }}</span>
                <div><strong>{{ item.displayLabel }}:</strong> Mức điểm {{ item.score }} — thuộc nhóm <strong>{{ item.levelLabel }}</strong>. {{ item.note }}</div>
              </li>
            </ul>
          </div>
        </div>

        <div class="paper-card result-ai-summary" v-if="aiSummaryLoading || aiSummaryText">
          <div class="ai-summary-header">
            <span class="ai-summary-icon">🤖</span>
            <span class="ri-title" style="margin-bottom:0;">Nhận xét từ AI</span>
            <span class="badge-pill badge-mint" style="margin-left:auto;">AI</span>
          </div>
          <div v-if="aiSummaryLoading" class="ai-summary-loading">Đang phân tích kết quả...</div>
          <div v-else class="ai-summary-text">{{ aiSummaryText }}</div>
          <template v-if="aiRecommendedTasks.length">
            <div class="ai-summary-task-title">🎯 Nhiệm vụ phù hợp với kết quả này</div>
            <div
              v-for="task in aiRecommendedTasks"
              :key="task.id"
              class="ai-summary-task"
              @click="router.push({ path: '/task-detail', query: { id: task.id } })"
            >
              <div class="ai-summary-task-icon">{{ task.icon || '🧩' }}</div>
              <div class="ai-summary-task-info">
                <div class="ai-summary-task-name">{{ task.title }}</div>
                <div class="ai-summary-task-reason">{{ task.reason }}</div>
              </div>
              <div class="ai-summary-task-xp" v-if="task.xp_reward">+{{ task.xp_reward }} XP</div>
            </div>
          </template>
        </div>

        <div class="paper-card result-comparison">
          <div class="rc-title">📈 So sánh với lần trước</div>
          <div class="rc-bars">
            <div
              v-if="!result.comparison"
              style="font-size:0.8rem;color:var(--text-secondary);font-style:italic;padding:8px 0;"
            >Bài kiểm tra lần đầu — Chưa có dữ liệu cơ sở để so sánh.</div>
            <div v-for="bar in (result.comparison || [])" :key="bar.key" class="rcb-item" style="margin-bottom:8px;">
              <div class="rcb-label">{{ bar.label }}</div>
              <div class="rcb-bars">
                <div class="rcb-bar-wrap">
                  <div class="rcb-date">Hiện tại</div>
                  <div class="rcb-bar"><div class="rcb-fill" :style="{ width: bar.currPct + '%', background: 'var(--mint-dark)' }"></div></div>
                  <div class="rcb-val">{{ bar.currentSc }}</div>
                </div>
                <div class="rcb-bar-wrap">
                  <div class="rcb-date">Lần trước</div>
                  <div class="rcb-bar"><div class="rcb-fill" :style="{ width: bar.prevPct + '%', background: 'var(--kraft-dark)' }"></div></div>
                  <div class="rcb-val">{{ bar.prevSc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="expert-recommend" v-show="result.isWarning">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:1.4rem;">🩺</span>
            <div>
              <div style="font-size:0.9rem;font-weight:700;">Nên tham khảo chuyên gia</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);">Kết quả cho thấy bạn có thể cần hỗ
                trợ chuyên sâu hơn</div>
            </div>
          </div>
          <router-link to="/experts" class="btn-primary" style="width:100%;justify-content:center;">📅 Đặt lịch tư vấn
            ngay</router-link>
        </div>

        <div style="padding:12px 16px;background:rgba(255,203,164,0.15);border:1.5px solid var(--peach);border-radius:var(--border-radius-sm);font-size:0.75rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;">
          ⚠️ <strong>Tuyên bố miễn trách:</strong> Kết quả này chỉ mang tính tham khảo và <strong>không phải chẩn
            đoán y khoa</strong>. Chỉ bác sĩ hoặc chuyên gia tâm lý lâm sàng mới có thể đưa ra chẩn đoán chính
          thức. Nếu bạn lo lắng về sức khỏe tâm thần, hãy liên hệ chuyên gia hoặc gọi
          <strong>0931773637</strong>.
        </div>

        <div class="result-actions">
          <router-link to="/tasks" class="btn-primary">🎮 Bắt đầu nhiệm vụ</router-link>
          <router-link to="/mood-chat" class="btn-outline">💬 Chat với PeaceCat</router-link>
          <router-link to="/experts" class="btn-outline">🩺 Kết nối chuyên gia</router-link>
          <router-link to="/dashboard" class="btn-outline">🏡 Dashboard</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { TESTS } from '../lib/assessmentTests';
import { ASSESSMENT_META } from '../lib/assessmentMeta';

const RESPONDENT_STORAGE_KEY = 'peaceflow_respondent_info';

const auth = useAuthStore();
const router = useRouter();

// ============================================================
// STATE
// ============================================================
const view = ref('selector'); // 'selector' | 'test' | 'result'
const emergencyOpen = ref(false);
const currentTestId = ref(null);
const currentQIndex = ref(0);
const answers = ref([]);
const result = ref(null);
const resultSaveNote = ref('');
const aiSummaryText = ref('');
const aiSummaryLoading = ref(false);
const aiRecommendedTasks = ref([]);
const resultSubtitleBase = ref('');

const assessments = ref([]);
const history = ref([]);

const respondent = reactive({ name: '', dob: '', age: '', ageMonths: '', note: '' });

let isAdvancing = false;
let hasFinishedCurrentTest = false;

// Ở câu cuối, thanh tiến độ được đẩy lên 100% trước khi chuyển sang màn kết quả.
const forceFullProgress = ref(false);

const currentTest = computed(() => (currentTestId.value ? TESTS[currentTestId.value] : null));
const currentQuestion = computed(() => currentTest.value?.questions[currentQIndex.value] || null);
const currentOptions = computed(() => currentQuestion.value?.likertOptions || currentTest.value?.likertOptions || []);
const progressPct = computed(() => (currentTest.value ? Math.round((currentQIndex.value / currentTest.value.totalQ) * 100) : 0));
const displayedProgressPct = computed(() => (forceFullProgress.value ? 100 : progressPct.value));
const resultSubtitle = computed(() => `${resultSubtitleBase.value}${resultSaveNote.value}`);

function printResult() {
  window.print();
}

// ============================================================
// RESPONDENT INFO
// ============================================================
function loadRespondentFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(RESPONDENT_STORAGE_KEY) || 'null');
    if (saved) {
      respondent.name = saved.name || '';
      respondent.dob = saved.dob || '';
      respondent.age = saved.age || '';
      respondent.ageMonths = saved.ageMonths || '';
      respondent.note = saved.note || '';
    }
  } catch (_error) { /* ignore corrupted storage */ }
}

function readRespondentInfo() {
  return {
    name: String(respondent.name || '').trim(),
    dob: String(respondent.dob || '').trim(),
    age: String(respondent.age || '').trim(),
    ageMonths: String(respondent.ageMonths || '').trim(),
    note: String(respondent.note || '').trim()
  };
}

function saveRespondentInfo(info) {
  localStorage.setItem(RESPONDENT_STORAGE_KEY, JSON.stringify(info));
}

// Tính tuổi (năm + tháng lẻ) từ ngày sinh, dùng để tự điền 2 ô Tuổi/Tháng lẻ
// khi người dùng chọn cách điền ngày sinh thay vì điền tuổi trực tiếp.
function calcAgeFromDob(dobStr) {
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  if (today.getDate() < dob.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years < 0) return null;
  return { years, months };
}

function onDobInput(event) {
  const computedAge = calcAgeFromDob(event.target.value);
  if (computedAge) {
    respondent.age = String(computedAge.years);
    respondent.ageMonths = String(computedAge.months);
  }
}

watch(respondent, () => saveRespondentInfo(readRespondentInfo()), { deep: true });

function getAccountOwnerName() {
  const user = auth.user;
  return (user && (user.display_name || user.full_name)) || 'Chủ tài khoản';
}

// ============================================================
// SELECTOR / HISTORY RENDERING
// ============================================================
function formatDate(value) {
  if (!value) return 'Chưa làm lần nào';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  if (!value) return 'Chưa có dữ liệu';

  const target = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now - target) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return `Hôm nay — ${formatDate(value)}`;
  if (diffDays === 1) return `1 ngày trước — ${formatDate(value)}`;
  return `${diffDays} ngày trước — ${formatDate(value)}`;
}

function getAssessmentKeyByCode(code) {
  return Object.keys(ASSESSMENT_META).find((key) => ASSESSMENT_META[key].apiCode === code) || null;
}

function getSeverityBadgeStyle(severity) {
  const value = String(severity || '').toLowerCase();
  if (value.includes('nghiêm') || value.includes('severe') || value.includes('nặng')) {
    return 'background:var(--coral-light);color:#c05050;';
  }
  if (value.includes('vừa') || value.includes('moderate') || value.includes('poor')) {
    return 'background:var(--peach-light);color:var(--peach-dark);';
  }
  return 'background:var(--mint-light);color:var(--mint-dark);';
}

const testCards = computed(() => Object.entries(ASSESSMENT_META).map(([key, meta]) => {
  const apiRow = assessments.value.find((item) => item.code === meta.apiCode);
  return {
    key,
    meta,
    latestLabel: apiRow?.latest_taken_at ? formatRelativeDate(apiRow.latest_taken_at) : 'Chưa làm lần nào',
    scorePill: apiRow?.latest_total_score !== null && apiRow?.latest_total_score !== undefined
      ? apiRow.latest_total_score
      : null
  };
}));

const historyCards = computed(() => history.value.map((item) => {
  const key = getAssessmentKeyByCode(item.code);
  const meta = key ? ASSESSMENT_META[key] : null;
  const dimensions = item.dimension_scores && typeof item.dimension_scores === 'object'
    ? Object.entries(item.dimension_scores)
    : [];
  const pills = dimensions.length
    ? dimensions.slice(0, 3).map(([dimension, data]) => ({
      style: getSeverityBadgeStyle(data?.severity),
      text: `${dimension}: ${data?.score ?? '--'}`
    }))
    : [{
      style: getSeverityBadgeStyle(item.severity),
      text: `${item.severity || 'Đã hoàn thành'} • ${item.total_score}`
    }];

  return {
    startKey: key || 'dass21',
    name: meta?.name || item.code,
    dateLabel: formatRelativeDate(item.created_at),
    pills,
    raw: item,
    testKey: key
  };
}));

// ===== Xem lại kết quả cũ =====
// Trước đây bấm vào thẻ lịch sử lại mở ra bài test MỚI (hành vi này có từ bản cũ:
// onclick="startTest('dass21')"), nên khách tưởng mất kết quả cũ. Giờ bấm vào sẽ mở
// modal xem lại chính kết quả đó, muốn làm lại thì bấm nút riêng trong modal.
const reviewCard = ref(null);

function openHistoryReview(card) {
  reviewCard.value = card;
}

function closeHistoryReview() {
  reviewCard.value = null;
}

function retakeFromReview() {
  const key = reviewCard.value?.startKey || 'dass21';
  closeHistoryReview();
  startTest(key);
}

// Nhãn đọc được cho từng khía cạnh: lấy catLabel trong định nghĩa bài test (vd 'depression'
// -> 'Trầm cảm'); 'total' -> 'Tổng điểm'; không tìm được thì giữ nguyên key.
function getDimensionLabel(testKey, dimension) {
  if (dimension === 'total') return 'Tổng điểm';
  const test = testKey ? TESTS[testKey] : null;
  const question = test?.questions?.find((q) => q.cat === dimension);
  return question?.catLabel || dimension;
}

const reviewDetail = computed(() => {
  const card = reviewCard.value;
  if (!card) return null;
  const item = card.raw || {};
  const dims = item.dimension_scores && typeof item.dimension_scores === 'object'
    ? Object.entries(item.dimension_scores)
    : [];

  return {
    name: card.name,
    dateLabel: item.created_at
      ? new Date(item.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : card.dateLabel,
    totalScore: item.total_score,
    severity: item.severity,
    severityStyle: getSeverityBadgeStyle(item.severity),
    respondentName: item.respondent_name,
    respondentAge: item.respondent_age,
    note: item.note,
    hasAttachment: item.has_attachment,
    dimensions: dims.map(([dimension, data]) => ({
      key: dimension,
      label: getDimensionLabel(card.testKey, dimension),
      score: data?.score ?? '--',
      severity: data?.severity || '',
      style: getSeverityBadgeStyle(data?.severity)
    }))
  };
});

function syncPrevScores() {
  Object.entries(ASSESSMENT_META).forEach(([key, meta]) => {
    const latest = assessments.value.find((item) => item.code === meta.apiCode);
    if (!latest) return;

    const dimensions = latest.latest_dimension_scores;
    if (dimensions && typeof dimensions === 'object' && Object.keys(dimensions).length) {
      TESTS[key].prevScores = Object.fromEntries(
        Object.entries(dimensions).map(([dimension, value]) => [dimension, Number(value?.score ?? value ?? 0)])
      );
    } else if (latest.latest_total_score !== null && latest.latest_total_score !== undefined) {
      const firstSubscale = TESTS[key]?.subscales?.[0];
      TESTS[key].prevScores = firstSubscale
        ? { [firstSubscale]: Number(latest.latest_total_score) }
        : null;
    } else {
      TESTS[key].prevScores = null;
    }
  });
}

async function loadAssessmentData() {
  const [assessmentsData, historyData] = await Promise.all([
    apiClient.get('/assessments'),
    apiClient.get('/assessments/history?limit=6')
  ]);

  assessments.value = Array.isArray(assessmentsData) ? assessmentsData : [];
  history.value = Array.isArray(historyData) ? historyData : [];
  syncPrevScores();
}

// ============================================================
// TEST FLOW
// ============================================================
// Thông tin người làm bài dùng chung cho MỌI bài test trong trang này — chỉ
// cần điền một lần ở thẻ đầu trang, không hỏi lại mỗi khi bắt đầu bài mới.
// Nếu chưa điền, KHÔNG chặn làm bài — mặc định lấy tên chủ tài khoản đang
// đăng nhập, người dùng có thể sửa lại bất cứ lúc nào ở thẻ này.
function startTest(testId) {
  let info = readRespondentInfo();
  if (!info.name) {
    info = { ...info, name: getAccountOwnerName() };
    respondent.name = info.name;
  }
  saveRespondentInfo(info);
  beginTestFlow(testId);
}

function beginTestFlow(testId) {
  currentTestId.value = testId;
  currentQIndex.value = 0;
  answers.value = [];
  isAdvancing = false;
  hasFinishedCurrentTest = false;
  forceFullProgress.value = false;

  view.value = 'test';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion(index) {
  const testData = currentTest.value;
  if (index < 0 || index >= testData.totalQ) return;
  currentQIndex.value = index;
}

function selectAnswer(score) {
  // Chặn bấm liên tục/nhiều lần trong lúc đang chuyển câu — tránh xếp chồng
  // nhiều setTimeout(finishTest) dẫn đến nộp bài trùng lặp ở câu cuối.
  if (isAdvancing) return;
  isAdvancing = true;

  const next = [...answers.value];
  next[currentQIndex.value] = score;
  answers.value = next;

  // EMERGENCY TRIGGER: PHQ-9 Question 9 (Suicidal thoughts)
  const isSpecialPHQ9 = (currentTestId.value === 'phq9' && currentQIndex.value === 8 && score > 0);
  if (isSpecialPHQ9) {
    emergencyOpen.value = true;
  }

  // Auto-advance
  setTimeout(() => {
    if (currentQIndex.value < TESTS[currentTestId.value].totalQ - 1) {
      nextQuestion();
      isAdvancing = false;
    } else {
      // Completed -> ensure Progress hits 100%
      forceFullProgress.value = true;
      setTimeout(finishTest, 400);
    }
  }, 350); // slight delay for visual UX
}

function nextQuestion() {
  renderQuestion(currentQIndex.value + 1);
}

function prevQuestion() {
  renderQuestion(currentQIndex.value - 1);
}

function getSeverityRank(className) {
  if (className === 'level-4') return 4;
  if (className === 'level-3') return 3;
  if (className === 'level-2') return 2;
  if (className === 'level-1') return 1;
  return 0;
}

function finishTest() {
  // Chốt chặn cuối: dù có gọi finishTest() nhiều lần do race-condition nào khác,
  // chỉ xử lý và nộp bài đúng 1 lần cho mỗi lượt làm test.
  if (hasFinishedCurrentTest) return;
  hasFinishedCurrentTest = true;

  const testData = currentTest.value;
  const answerList = answers.value;

  const now = new Date();
  resultSubtitleBase.value = `Hoàn thành lúc ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} — ${now.toLocaleDateString('vi-VN')}`;
  resultSaveNote.value = '';
  aiSummaryText.value = '';
  aiSummaryLoading.value = false;
  aiRecommendedTasks.value = [];

  // Evaluate logic
  const subScores = {};
  Object.keys(testData.scoring).forEach((key) => {
    const sc = testData.scoring[key];
    let rawSum = 0;
    sc.indices.forEach((idx) => {
      rawSum += (answerList[idx] || 0);
    });
    const finalScore = rawSum * sc.multiplier;
    subScores[key] = { score: finalScore, config: sc };
  });

  const keys = Object.keys(subScores);
  let isWarning = false;
  const cards = [];
  const interpretation = [];
  let analysisStr = '';

  keys.forEach((key) => {
    const s = subScores[key];
    const levelConfig = s.config.levels.find((l) => s.score <= l.max) || s.config.levels[s.config.levels.length - 1];

    let icon = '📊';
    if (levelConfig.class === 'level-0' || levelConfig.class === 'level-1') icon = '✅';
    else if (levelConfig.class === 'level-2') icon = '⚠️';
    else {
      icon = '🚨';
      if (key !== 'somatic' && key !== 'psychic') isWarning = true;
    }

    // For general tests, if label is specifically psychic or somatic, adapt it
    const displayLabel = levelConfig.label === 'Tâm lý' || levelConfig.label === 'Thể chất'
      ? levelConfig.label
      : (testData.questions.find((q) => q.cat === key)?.catLabel || key);

    cards.push({
      key,
      icon,
      displayLabel,
      score: s.score,
      levelClass: levelConfig.class,
      levelLabel: levelConfig.label
    });

    const tone = levelConfig.class === 'level-0' || levelConfig.class === 'level-1'
      ? 'good'
      : (levelConfig.class === 'level-2' ? 'medium' : 'bad');
    const note = isWarning
      ? 'Mức độ này có ảnh hưởng đáng kể tới chất lượng cuộc sống của bạn.'
      : 'Hãy tiếp tục giữ vững tâm lý theo nhịp độ này nhé.';

    interpretation.push({ key, tone, icon, displayLabel, score: s.score, levelLabel: levelConfig.label, note });

    analysisStr += `<li class="ri-item ${tone}">
                <span class="ri-icon">${icon}</span>
                <div><strong>${displayLabel}:</strong> Mức điểm ${s.score} — thuộc nhóm <strong>${levelConfig.label}</strong>. ${note}</div>
            </li>`;
  });

  // Previous Comparison Logic
  let comparison = null;
  if (testData.prevScores) {
    comparison = [];
    keys.forEach((key) => {
      const currentSc = subScores[key].score;
      const prevSc = testData.prevScores[key];
      if (prevSc === undefined) return;

      const maxLvl = testData.scoring[key].levels.slice(-1)[0].max;
      const maxSc = maxLvl > 100 ? testData.maxScore : maxLvl;

      const currPct = Math.min(100, Math.max(0, Math.round((currentSc / maxSc) * 100)));
      const prevPct = Math.min(100, Math.max(0, Math.round((prevSc / maxSc) * 100)));

      const label = testData.questions.find((q) => q.cat === key)?.catLabel || key;

      comparison.push({ key, label, currentSc, prevSc, currPct, prevPct });
    });
  }

  result.value = {
    testId: currentTestId.value,
    testName: testData.name,
    icon: testData.icon,
    maxScore: testData.maxScore,
    cards,
    interpretation,
    comparison,
    isWarning
  };
  view.value = 'result';

  const overallSeverity = keys
    .map((key) => {
      const s = subScores[key];
      const levelConfig = s.config.levels.find((l) => s.score <= l.max) || s.config.levels[s.config.levels.length - 1];
      return { key, score: s.score, label: levelConfig.label, className: levelConfig.class };
    })
    .sort((left, right) => getSeverityRank(right.className) - getSeverityRank(left.className))[0];

  onAssessmentFinished({
    testId: currentTestId.value,
    testName: testData.name,
    rawAnswers: answerList.map((score, index) => {
      const q = testData.questions[index];
      const opts = q.likertOptions || testData.likertOptions;
      const chosen = opts.find((opt) => opt.score === score);
      return {
        question_no: index + 1,
        question: q.text,
        category: q.catLabel || null,
        answer: chosen ? chosen.label : null,
        score
      };
    }),
    totalScore: subScores.total
      ? subScores.total.score
      : keys.reduce((sum, key) => sum + (subScores[key]?.score || 0), 0),
    severity: overallSeverity?.label || null,
    dimensionScores: Object.fromEntries(keys.map((key) => {
      const s = subScores[key];
      const levelConfig = s.config.levels.find((l) => s.score <= l.max) || s.config.levels[s.config.levels.length - 1];
      return [key, { score: s.score, severity: levelConfig.label, className: levelConfig.class }];
    })),
    interpretedResult: {
      is_warning: isWarning,
      summary_html: analysisStr,
      dominant_dimension: overallSeverity?.key || null
    }
  });
}

async function loadAiSummary(resultId) {
  if (!resultId) return;
  aiSummaryLoading.value = true;
  try {
    const data = await apiClient.post(`/assessments/results/${resultId}/ai-summary`, {});
    aiSummaryText.value = data?.summary || '';
    aiRecommendedTasks.value = Array.isArray(data?.recommended_tasks) ? data.recommended_tasks : [];
  } catch (error) {
    console.error('Assessment AI summary load failed:', error);
    aiSummaryText.value = '';
    aiRecommendedTasks.value = [];
  } finally {
    aiSummaryLoading.value = false;
  }
}

async function onAssessmentFinished(payload) {
  const meta = ASSESSMENT_META[payload.testId];
  if (!meta) return;

  try {
    const savedRespondent = JSON.parse(localStorage.getItem(RESPONDENT_STORAGE_KEY) || 'null') || {};
    const saved = await apiClient.post(`/assessments/${meta.apiCode}/submit`, {
      raw_answers: payload.rawAnswers,
      total_score: payload.totalScore,
      severity: payload.severity,
      dimension_scores: payload.dimensionScores,
      interpreted_result: payload.interpretedResult,
      respondent_name: savedRespondent.name || null,
      respondent_age: savedRespondent.age ? Number(savedRespondent.age) : null,
      note: savedRespondent.note || null
    });

    resultSaveNote.value = ' • Đã lưu vào hồ sơ';

    await Promise.all([
      loadAssessmentData(),
      loadAiSummary(saved?.id)
    ]);
  } catch (error) {
    console.error('Assessment submit failed:', error);
    resultSaveNote.value = ' • Chưa lưu được vào hồ sơ';
  }
}

function retakeTest() {
  beginTestFlow(currentTestId.value);
}

function backToSelector() {
  view.value = 'selector';
}

onMounted(() => {
  loadRespondentFromStorage();

  loadAssessmentData().catch((error) => {
    console.error('Assessment page init failed:', error);
  });
});
</script>

<style scoped src="../assets/assessment.css"></style>
