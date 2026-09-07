<template>
  <div class="rv-wrap">
    <div class="rv-top">
      <div class="rv-title">🧩 Coloured Progressive Matrices</div>
      <router-link class="rv-back" to="/mood-assessment">{{ t('ravenTest.back') }}</router-link>
    </div>

    <div class="rv-disclaimer" v-html="t('ravenTest.disclaimer')"></div>

    <div v-if="phase === 'test'" class="rv-card">
      <div class="rv-progress-row">
        <span>{{ t('ravenTest.questionLabel', { n: index + 1, total: ITEMS.length }) }}</span>
        <span>{{ progressPct }}%</span>
      </div>
      <div class="rv-progress-bar"><div class="rv-progress-fill" :style="{ width: progressPct + '%' }"></div></div>

      <div class="rv-image-box">
        <img :src="currentItem.image" :alt="t('ravenTest.imageAlt', { key: currentItem.key })">
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
      <div v-show="answers[index] === 'skip'" style="color:var(--text-secondary);font-style:italic;margin-top:8px;">{{ t('ravenTest.skippedNote') }}</div>

      <div class="rv-nav">
        <button class="rv-btn" :disabled="index === 0" @click="rvPrev">{{ t('ravenTest.nav.prevBtn') }}</button>
        <button class="rv-btn" @click="rvSkip">{{ t('ravenTest.nav.skipBtn') }}</button>
        <button class="rv-btn primary" :disabled="answers[index] === null" @click="rvNext">{{ index === ITEMS.length - 1 ? t('ravenTest.nav.finishBtn') : t('ravenTest.nav.nextBtn') }}</button>
      </div>
    </div>

    <div class="rv-result" :class="{ active: phase === 'result' }">
      <div class="emoji">✅</div>
      <h2>{{ t('ravenTest.result.completedTitle') }}</h2>
      <div class="rv-card" style="text-align:left;">
        <div><strong>{{ t('ravenTest.result.rawScoreLabel') }}</strong> {{ t('ravenTest.result.rawScoreDetail', { total: scored?.rawTotal, a: scored?.bySet.A, ab: scored?.bySet.AB, b: scored?.bySet.B }) }}</div>
        <template v-if="scored?.standardScore !== null">
          <div style="margin-top:8px;"><strong>{{ t('ravenTest.result.standardScoreLabel') }}</strong> {{ scored?.standardScore }}{{ t('ravenTest.result.percentileSuffix', { pct: scored?.percentile }) }}</div>
          <div style="margin-top:4px;"><strong>{{ t('ravenTest.result.classificationLabel') }}</strong> {{ scored?.iqLabel }}</div>
        </template>
        <div v-else-if="scored?.ageBracketNote" style="margin-top:8px;color:var(--text-secondary);font-style:italic;">{{ scored?.ageBracketNote }}</div>
      </div>
      <p style="font-style: italic;">{{ saveStatus }}</p>

      <div v-if="aiSummaryLoading || aiSummaryText" class="rv-ai-summary" style="text-align:left;margin:20px 0;">
        <div class="rv-ai-summary-header">
          <span class="rv-ai-summary-icon">🤖</span>
          <span class="rv-ai-summary-title">{{ t('ravenTest.aiSummary.title') }}</span>
        </div>
        <p v-if="aiSummaryLoading" class="rv-ai-summary-loading">{{ t('ravenTest.aiSummary.loading') }}</p>
        <p v-else class="rv-ai-summary-text">{{ aiSummaryText }}</p>
        <template v-if="aiInterpretation">
          <div class="rv-ai-summary-title" style="margin-top:14px;">{{ t('ravenTest.aiSummary.judgmentTitle') }}</div>
          <p class="rv-ai-summary-text">{{ aiInterpretation }}</p>
        </template>
      </div>

      <div v-if="showAttachCard" class="rv-card" style="text-align:left;margin:20px 0;">
        <h3 style="margin-top:0;">{{ t('ravenTest.attach.title') }}</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem;">{{ t('ravenTest.attach.desc') }}</p>
        <div class="rv-field">
          <input type="file" ref="attachInputEl" accept="image/*">
        </div>
        <button class="rv-btn primary" :disabled="attachUploading" @click="rvUploadAttachment">{{ t('ravenTest.attach.uploadBtn') }}</button>
        <p style="font-style: italic; font-size: 0.85rem;">{{ attachStatus }}</p>
      </div>

      <router-link class="rv-btn primary" to="/mood-assessment">{{ t('ravenTest.backToList') }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';
import { ITEMS, RAVEN_ANSWER_KEY, scoreRavenTest } from '../lib/ravenTest';

const RESPONDENT_STORAGE_KEY = 'peaceflow_respondent_info';

const auth = useAuthStore();
const router = useRouter();
const { t, locale } = useI18n();

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
const aiInterpretation = ref('');

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
  return (user && (user.display_name || user.full_name)) || t('ravenTest.defaultOwnerName');
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
  scored.value = scoreRavenTest(answers.value, info.age, info.ageMonths, locale.value);

  // severity/answerLabel/note dưới đây là dữ liệu LƯU VÀO HỒ SƠ cho chuyên gia (người Việt) xem
  // khi chấm bài — không phải text hiển thị trên trang này, nên cố ý giữ nguyên tiếng Việt bất kể
  // ngôn ngữ giao diện, giống cách đã xử lý ở ExpertsView.vue (chủ đề/mức độ đặt lịch).
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
    saveStatus.value = t('ravenTest.status.savedToProfile');
    loadAiSummary(savedResultId.value);
  } catch (error) {
    console.error('Raven submit failed:', error);
    saveStatus.value = t('ravenTest.status.saveFailed');
    showAttachCard.value = false;
  }
}

async function loadAiSummary(resultId) {
  if (!resultId) return;
  aiSummaryLoading.value = true;
  try {
    const data = await apiClient.post(`/assessments/results/${resultId}/ai-summary`, {});
    aiSummaryText.value = data?.summary || '';
    aiInterpretation.value = data?.interpretation || '';
  } catch (error) {
    console.error('Raven AI summary load failed:', error);
    aiSummaryText.value = '';
    aiInterpretation.value = '';
  } finally {
    aiSummaryLoading.value = false;
  }
}

async function rvUploadAttachment() {
  const file = attachInputEl.value?.files?.[0];
  if (!file) {
    attachStatus.value = t('ravenTest.status.chooseImageFirst');
    return;
  }
  if (!savedResultId.value) {
    attachStatus.value = t('ravenTest.status.notSubmittedYet');
    return;
  }

  attachUploading.value = true;
  attachStatus.value = t('ravenTest.status.uploading');
  try {
    const formData = new FormData();
    formData.set('image', file);
    await apiClient.postForm(`/assessments/results/${savedResultId.value}/attachment`, formData);
    attachStatus.value = t('ravenTest.status.uploadSuccess');
  } catch (error) {
    console.error('Raven attachment upload failed:', error);
    attachStatus.value = t('ravenTest.status.uploadFailed');
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
