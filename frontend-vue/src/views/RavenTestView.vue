<template>
  <div class="rv-wrap">
    <div class="rv-top">
      <div class="rv-title">🧩 Coloured Progressive Matrices</div>
      <router-link class="rv-back" to="/mood-assessment">← Quay lại</router-link>
    </div>

    <div class="rv-disclaimer">
      <strong>Lưu ý:</strong> Đây là trắc nghiệm phi ngôn ngữ (Raven). Ứng dụng tự chấm điểm theo đáp án gốc và quy đổi
      ra chỉ số IQ (nếu có đủ tuổi, áp dụng cho trẻ 4-11 tuổi), nhưng kết quả chỉ mang tính <strong>sàng lọc tham
      khảo</strong> — hãy để <strong>chuyên gia</strong> xác nhận và đưa ra kết luận cuối cùng.
    </div>

    <div v-if="phase === 'test'" class="rv-card">
      <div class="rv-progress-row">
        <span>Câu {{ index + 1 }} / {{ ITEMS.length }}</span>
        <span>{{ progressPct }}%</span>
      </div>
      <div class="rv-progress-bar"><div class="rv-progress-fill" :style="{ width: progressPct + '%' }"></div></div>

      <div class="rv-image-box">
        <img :src="currentItem.image" :alt="`Câu ${currentItem.key}`">
      </div>

      <div class="rv-options">
        <div
          v-for="n in 6"
          :key="n"
          class="rv-opt"
          :class="{ selected: answers[index] === n }"
          @click="selectOption(n)"
        >{{ n }}</div>
      </div>
      <div v-show="answers[index] === 'skip'" style="color:var(--text-secondary);font-style:italic;margin-top:8px;">Câu này đã được bỏ qua — không tính điểm.</div>

      <div class="rv-nav">
        <button class="rv-btn" :disabled="index === 0" @click="rvPrev">← Câu trước</button>
        <button class="rv-btn" @click="rvSkip">Bỏ qua câu này</button>
        <button class="rv-btn primary" :disabled="answers[index] === null" @click="rvNext">{{ index === ITEMS.length - 1 ? 'Hoàn thành' : 'Câu tiếp →' }}</button>
      </div>
    </div>

    <div class="rv-result" :class="{ active: phase === 'result' }">
      <div class="emoji">✅</div>
      <h2>Đã hoàn thành bài làm</h2>
      <div class="rv-card" style="text-align:left;">
        <div><strong>Điểm thô:</strong> {{ scored?.rawTotal }} / 36 (Tập A: {{ scored?.bySet.A }}/12, Tập AB: {{ scored?.bySet.AB }}/12, Tập B: {{ scored?.bySet.B }}/12)</div>
        <template v-if="scored?.standardScore !== null">
          <div style="margin-top:8px;"><strong>Chỉ số chuẩn hoá (Standard Score):</strong> {{ scored?.standardScore }} — Percentile {{ scored?.percentile }}</div>
          <div style="margin-top:4px;"><strong>Xếp loại:</strong> {{ scored?.iqLabel }}</div>
        </template>
        <div v-else-if="scored?.ageBracketNote" style="margin-top:8px;color:var(--text-secondary);font-style:italic;">{{ scored?.ageBracketNote }}</div>
      </div>
      <p style="font-style: italic;">{{ saveStatus }}</p>

      <div v-if="aiSummaryLoading || aiSummaryText" class="rv-ai-summary" style="text-align:left;margin:20px 0;">
        <div class="rv-ai-summary-header">
          <span class="rv-ai-summary-icon">🤖</span>
          <span class="rv-ai-summary-title">Nhận xét từ AI</span>
        </div>
        <p v-if="aiSummaryLoading" class="rv-ai-summary-loading">Đang phân tích kết quả...</p>
        <p v-else class="rv-ai-summary-text">{{ aiSummaryText }}</p>
        <div
          v-for="task in aiRecommendedTasks"
          :key="task.id"
          class="rv-ai-task"
          @click="router.push({ path: '/task-detail', query: { id: task.id } })"
        >
          <div class="rv-ai-task-icon">{{ task.icon || '🧩' }}</div>
          <div class="rv-ai-task-info">
            <div class="rv-ai-task-name">{{ task.title }}</div>
            <div class="rv-ai-task-reason">{{ task.reason }}</div>
          </div>
          <div class="rv-ai-task-xp" v-if="task.xp_reward">+{{ task.xp_reward }} XP</div>
        </div>
      </div>

      <div v-if="showAttachCard" class="rv-card" style="text-align:left;margin:20px 0;">
        <h3 style="margin-top:0;">📷 Đính kèm ảnh (nếu có)</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem;">Nếu bạn làm bài trên phiếu giấy gốc, hãy chụp/tải ảnh phiếu trả lời lên đây để chuyên gia xem khi chấm điểm.</p>
        <div class="rv-field">
          <input type="file" ref="attachInputEl" accept="image/*">
        </div>
        <button class="rv-btn primary" :disabled="attachUploading" @click="rvUploadAttachment">Tải ảnh lên</button>
        <p style="font-style: italic; font-size: 0.85rem;">{{ attachStatus }}</p>
      </div>

      <router-link class="rv-btn primary" to="/mood-assessment">Về danh sách bài test</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { ITEMS, RAVEN_ANSWER_KEY, scoreRavenTest } from '../lib/ravenTest';

const RESPONDENT_STORAGE_KEY = 'peaceflow_respondent_info';

const auth = useAuthStore();
const router = useRouter();

const phase = ref('loading'); // 'loading' | 'test' | 'result'
const index = ref(0);
const answers = ref(new Array(ITEMS.length).fill(null));
const respondentInfo = ref({ name: '', age: '', note: '' });

const scored = ref(null);
const saveStatus = ref('');
const showAttachCard = ref(true);
const attachStatus = ref('');
const attachUploading = ref(false);
const attachInputEl = ref(null);
const savedResultId = ref(null);
const aiSummaryText = ref('');
const aiSummaryLoading = ref(false);
const aiRecommendedTasks = ref([]);

const currentItem = computed(() => ITEMS[index.value]);
const progressPct = computed(() => Math.round((index.value / ITEMS.length) * 100));

function getSavedRespondentInfo() {
  try {
    return JSON.parse(localStorage.getItem(RESPONDENT_STORAGE_KEY) || 'null');
  } catch (_error) {
    return null;
  }
}

function getAccountOwnerName() {
  const user = auth.user;
  return (user && (user.display_name || user.full_name)) || 'Chủ tài khoản';
}

function selectOption(n) {
  answers.value[index.value] = n;
}

function rvSkip() {
  answers.value[index.value] = 'skip';
  if (index.value === ITEMS.length - 1) {
    finish();
    return;
  }
  index.value += 1;
}

function rvNext() {
  if (answers.value[index.value] === null) return;
  if (index.value === ITEMS.length - 1) {
    finish();
    return;
  }
  index.value += 1;
}

function rvPrev() {
  if (index.value === 0) return;
  index.value -= 1;
}

async function finish() {
  phase.value = 'result';

  const info = respondentInfo.value;
  scored.value = scoreRavenTest(answers.value, info.age, info.ageMonths);

  const severity = scored.value.standardScore !== null
    ? `${scored.value.iqLabel} (SS ${scored.value.standardScore})`
    : `Điểm thô ${scored.value.rawTotal}/36 (chưa quy đổi IQ)`;

  try {
    const saved = await apiClient.post('/assessments/RAVEN_CPM/submit', {
      raw_answers: ITEMS.map((item, i) => {
        const setKey = item.key.replace(/\d+$/, '');
        const itemIndex = Number(item.key.replace(/^\D+/, '')) - 1;
        const correctAnswer = RAVEN_ANSWER_KEY[setKey][itemIndex];
        const isCorrect = answers.value[i] === correctAnswer;
        const answerLabel = answers.value[i] === 'skip'
          ? `Bỏ qua (không tính điểm — đáp án đúng: ${correctAnswer})`
          : `Chọn ${answers.value[i]}${isCorrect ? ' (đúng)' : ` (sai — đáp án đúng: ${correctAnswer})`}`;
        return { question: item.key, answer: answerLabel, score: isCorrect ? 1 : 0 };
      }),
      total_score: scored.value.rawTotal,
      severity,
      dimension_scores: {
        A: { score: scored.value.bySet.A, max: 12 },
        AB: { score: scored.value.bySet.AB, max: 12 },
        B: { score: scored.value.bySet.B, max: 12 }
      },
      interpreted_result: {
        scored: true,
        raw_total: scored.value.rawTotal,
        standard_score: scored.value.standardScore,
        percentile: scored.value.percentile,
        iq_label: scored.value.iqLabel,
        note: scored.value.ageBracketNote || 'Chấm theo Bảng khoá điểm Raven màu - Trẻ em - 2008.'
      },
      respondent_name: info.name || null,
      respondent_age: info.age ? Number(info.age) : null,
      note: info.note || null
    });
    savedResultId.value = saved?.id || null;
    saveStatus.value = 'Đã lưu vào hồ sơ.';
    loadAiSummary(savedResultId.value);
  } catch (error) {
    console.error('Raven submit failed:', error);
    saveStatus.value = 'Chưa lưu được vào hồ sơ, vui lòng thử lại sau.';
    showAttachCard.value = false;
  }
}

async function loadAiSummary(resultId) {
  if (!resultId) return;
  aiSummaryLoading.value = true;
  try {
    const data = await apiClient.post(`/assessments/results/${resultId}/ai-summary`, {});
    aiSummaryText.value = data?.summary || '';
    aiRecommendedTasks.value = Array.isArray(data?.recommended_tasks) ? data.recommended_tasks : [];
  } catch (error) {
    console.error('Raven AI summary load failed:', error);
    aiSummaryText.value = '';
    aiRecommendedTasks.value = [];
  } finally {
    aiSummaryLoading.value = false;
  }
}

async function rvUploadAttachment() {
  const file = attachInputEl.value?.files?.[0];
  if (!file) {
    attachStatus.value = 'Vui lòng chọn 1 ảnh trước.';
    return;
  }
  if (!savedResultId.value) {
    attachStatus.value = 'Chưa nộp được bài nên chưa thể đính kèm ảnh. Vui lòng thử lại.';
    return;
  }

  attachUploading.value = true;
  attachStatus.value = 'Đang tải ảnh lên...';
  try {
    const formData = new FormData();
    formData.set('image', file);
    await apiClient.postForm(`/assessments/results/${savedResultId.value}/attachment`, formData);
    attachStatus.value = '✅ Đã gửi ảnh cho chuyên gia.';
  } catch (error) {
    console.error('Raven attachment upload failed:', error);
    attachStatus.value = 'Không tải được ảnh, vui lòng thử lại.';
  } finally {
    attachUploading.value = false;
  }
}

onMounted(async () => {
  const authenticated = await auth.waitForAuth();
  if (!authenticated) {
    router.replace('/login');
    return;
  }

  // Trang này KHÔNG có form riêng — thông tin người làm bài chỉ được điền
  // ở trang Bài test (mood-assessment), dùng chung qua localStorage.
  // Chưa điền ở đó thì KHÔNG chặn — mặc định lấy tên chủ tài khoản đang
  // đăng nhập rồi cho làm bài luôn.
  const saved = getSavedRespondentInfo();
  respondentInfo.value = (saved && saved.name) ? saved : { name: getAccountOwnerName(), age: '', note: '' };
  localStorage.setItem(RESPONDENT_STORAGE_KEY, JSON.stringify(respondentInfo.value));
  phase.value = 'test';
});
</script>

<style scoped>
.rv-wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 60px; }
.rv-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
.rv-title { font-size: 1.3rem; font-weight: 800; }
.rv-back { text-decoration: none; color: var(--text-secondary); font-weight: 700; padding: 8px 14px; border-radius: 999px; border: 1.5px solid var(--kraft-light); background: var(--warm-white); }
.rv-disclaimer { background: var(--peach-light); border: 1.5px solid var(--peach); border-radius: var(--radius-md); padding: 14px 16px; font-size: 0.88rem; line-height: 1.5; margin-bottom: 20px; }
.rv-card { background: var(--warm-white); border: 2px solid var(--kraft-light); border-radius: var(--radius-md); box-shadow: var(--shadow-paper); padding: 18px; }
.rv-ai-summary { background: linear-gradient(135deg, var(--mint-light), var(--sky-light)); border: 2px solid var(--mint); border-radius: var(--radius-md); box-shadow: var(--shadow-paper); padding: 18px; }
.rv-ai-summary-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.rv-ai-summary-icon { font-size: 1.3rem; animation: rv-ai-bounce 3s ease-in-out infinite; }
@keyframes rv-ai-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.rv-ai-summary-title { font-weight: 700; font-size: 0.95rem; }
.rv-ai-summary-text { line-height: 1.7; font-size: 0.9rem; color: var(--text-primary); white-space: pre-line; }
.rv-ai-summary-loading { font-size: 0.85rem; color: var(--text-secondary); font-style: italic; }
.rv-ai-task { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1.5px solid var(--mint); border-radius: var(--radius-md); background: var(--warm-white); margin-top: 14px; cursor: pointer; }
.rv-ai-task:hover { background: var(--mint-light); }
.rv-ai-task-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 2px solid var(--mint); background: var(--mint-light); flex-shrink: 0; }
.rv-ai-task-info { flex: 1; }
.rv-ai-task-name { font-size: 0.85rem; font-weight: 700; }
.rv-ai-task-reason { font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px; }
.rv-ai-task-xp { font-size: 0.72rem; font-weight: 700; color: var(--peach-dark); background: var(--peach-light); padding: 2px 8px; border-radius: 50px; flex-shrink: 0; }
.rv-progress-row { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; }
.rv-progress-bar { height: 8px; border-radius: 999px; background: var(--kraft-light); overflow: hidden; margin-bottom: 18px; }
.rv-progress-fill { height: 100%; background: linear-gradient(90deg, var(--mint-dark), var(--sky)); transition: width 0.25s ease; }
.rv-image-box { display: flex; justify-content: center; margin-bottom: 18px; }
.rv-image-box img { max-width: 100%; border-radius: var(--radius-sm); border: 1.5px solid var(--kraft-light); }
.rv-options { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 18px; }
.rv-opt { padding: 14px 0; text-align: center; font-weight: 800; font-size: 1.05rem; border-radius: var(--radius-sm); border: 2px solid var(--kraft-light); background: var(--cream); cursor: pointer; transition: var(--transition); }
.rv-opt:hover { border-color: var(--mint-dark); }
.rv-opt.selected { background: var(--mint); border-color: var(--mint-dark); color: white; }
.rv-nav { display: flex; justify-content: space-between; gap: 10px; }
.rv-btn { font-family: inherit; font-weight: 800; font-size: 0.95rem; padding: 10px 20px; border-radius: 999px; border: 1.5px solid var(--kraft-light); background: var(--warm-white); cursor: pointer; }
.rv-btn.primary { background: var(--mint-dark); border-color: var(--mint-dark); color: white; }
.rv-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.rv-result { display: none; text-align: center; padding: 30px 18px; }
.rv-result.active { display: block; }
.rv-result .emoji { font-size: 3rem; margin-bottom: 10px; }
.rv-result h2 { margin: 0 0 8px; }
.rv-result p { color: var(--text-secondary); line-height: 1.6; }
@media (max-width: 480px) {
  .rv-options { grid-template-columns: repeat(3, 1fr); }
}
.rv-field { margin-bottom: 12px; }
.rv-field label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; }
.rv-field input,
.rv-field textarea { width: 100%; padding: 10px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--kraft-light); font-family: 'Nunito', sans-serif; font-size: 0.9rem; background: var(--cream); color: var(--text-primary); box-sizing: border-box; }
.rv-field textarea { resize: vertical; min-height: 60px; }
</style>
