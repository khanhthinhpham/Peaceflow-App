<template>
  <div class="shared-result-page">
    <div class="srp-card paper-card">
      <div class="srp-logo">🕊️ PeaceFlow</div>

      <div v-if="loading" class="srp-state">{{ t('sharedResult.loading') }}</div>

      <div v-else-if="error" class="srp-state">
        <div class="srp-state-icon">🙈</div>
        <p>{{ t('sharedResult.notFound') }}</p>
        <router-link to="/mood-assessment" class="btn-primary">{{ t('sharedResult.tryTestsBtn') }}</router-link>
      </div>

      <template v-else-if="result">
        <img v-if="result.imageUrl && !brokenImage" :src="result.imageUrl" :alt="result.testName" class="srp-banner" @error="brokenImage = true">
        <div class="srp-title">{{ t('sharedResult.title', { testName: result.testName }) }}</div>
        <div class="srp-date">{{ formattedDate }}</div>

        <div class="srp-score-grid">
          <div v-for="card in cards" :key="card.key" class="srp-score-card" :class="card.className">
            <div class="srp-score-icon">{{ card.icon }}</div>
            <div class="srp-score-label">{{ card.label }}</div>
            <div><span class="srp-score">{{ card.score }}</span><span v-if="testMaxScore" class="srp-score-max">/ {{ testMaxScore }}</span></div>
            <div class="srp-badge">{{ card.severity }}</div>
          </div>
        </div>

        <div class="srp-interpretation">
          <div class="srp-interpretation-title">{{ t('moodAssessment.result.interpretationTitle') }}</div>
          <ul class="srp-interpretation-list">
            <li v-for="card in cards" :key="card.key" class="srp-interpretation-item">
              <span>{{ card.icon }}</span>
              <div>
                <strong>{{ card.label }}:</strong>
                <span v-html="t('moodAssessment.result.interpretationText', { score: card.score, level: card.severity })"></span>
                {{ result.isWarning ? t('moodAssessment.result.noteWarning') : t('moodAssessment.result.noteGood') }}
              </div>
            </li>
          </ul>
        </div>

        <div class="srp-disclaimer">{{ t('sharedResult.disclaimer') }}</div>

        <div class="srp-actions">
          <router-link :to="`/mood-assessment?test=${encodeURIComponent((result.testCode || '').toLowerCase())}`" class="btn-primary">
            {{ t('sharedResult.tryThisTestBtn', { testName: result.testName }) }}
          </router-link>
          <router-link to="/" class="btn-outline">{{ t('sharedResult.homeBtn') }}</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { TESTS as TESTS_VI } from '../lib/assessmentTests';
import { TESTS as TESTS_EN } from '../lib/assessmentTests.en';

const route = useRoute();
const { t, locale } = useI18n();

const loading = ref(true);
const error = ref(false);
const result = ref(null);
const brokenImage = ref(false);

const formattedDate = computed(() => {
  if (!result.value?.createdAt) return '';
  return new Date(result.value.createdAt).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'vi-VN');
});

function iconFor(className) {
  if (className === 'level-0' || className === 'level-1') return '✅';
  if (className === 'level-2') return '⚠️';
  return '🚨';
}

// Nhãn hiển thị từng chiều điểm (vd "Lo âu", "Trầm cảm") + điểm tối đa lấy từ đúng bộ câu
// hỏi của bài test đó (catalog tĩnh, không cần gọi API riêng) — khớp hệt cách trang kết
// quả thật hiển thị (xem displayLabel/maxScore trong MoodAssessmentView.vue).
const testData = computed(() => (locale.value === 'en' ? TESTS_EN : TESTS_VI)[(result.value?.testCode || '').toLowerCase()]);
const testMaxScore = computed(() => testData.value?.maxScore || null);
const cards = computed(() => {
  const dims = result.value?.dimensionScores || {};
  return Object.keys(dims).map((key) => {
    const d = dims[key];
    const label = testData.value?.questions?.find((q) => q.cat === key)?.catLabel || key;
    return { key, label, score: d.score, severity: d.severity, className: d.className, icon: iconFor(d.className) };
  });
});

onMounted(async () => {
  try {
    const data = await apiClient.get(`/assessments/results/${encodeURIComponent(route.params.id)}/public`, { noCache: true });
    result.value = data;
  } catch (_e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.shared-result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--warm-white, #fdfaf4);
}
.srp-card {
  max-width: 460px;
  width: 100%;
  padding: 32px 24px;
  text-align: center;
}
.srp-logo {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--mint-dark, #2f7d52);
  margin-bottom: 18px;
}
.srp-state {
  padding: 20px 0;
  color: var(--text-secondary);
}
.srp-state-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}
.srp-banner {
  width: 100%;
  border-radius: 14px;
  margin-bottom: 16px;
  display: block;
}
.srp-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin-bottom: 4px;
}
.srp-date {
  font-size: 0.75rem;
  color: var(--text-light, #9a9488);
  margin-bottom: 18px;
}
.srp-score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}
.srp-score-card {
  padding: 14px 10px;
  border-radius: 14px;
  background: var(--cream, #faf3e7);
  border: 1.5px solid var(--kraft-light, #e4d9c4);
}
.srp-score-card.level-2 { background: rgba(255, 203, 164, 0.3); }
.srp-score-card.level-3, .srp-score-card.level-4 { background: rgba(247, 150, 150, 0.2); }
.srp-score-icon { font-size: 1.3rem; margin-bottom: 4px; }
.srp-score-label { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; }
.srp-score { font-size: 1.5rem; font-weight: 900; }
.srp-score-max { font-size: 0.75rem; color: var(--text-light, #9a9488); }
.srp-badge {
  margin-top: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid currentColor;
  display: inline-block;
}
.srp-interpretation {
  text-align: left;
  margin-bottom: 18px;
}
.srp-interpretation-title {
  font-weight: 800;
  font-size: 0.9rem;
  margin-bottom: 10px;
}
.srp-interpretation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.srp-interpretation-item {
  display: flex;
  gap: 10px;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--text-secondary);
}
.srp-disclaimer {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.6;
  background: rgba(255, 203, 164, 0.15);
  border: 1.5px solid var(--peach, #f7c4a3);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 20px;
  text-align: left;
}
.srp-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
