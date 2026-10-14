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
        <div class="srp-title">{{ t('sharedResult.title', { testName: result.testName }) }}</div>
        <div class="srp-score-row">
          <span class="srp-score">{{ result.totalScore }}</span>
          <span v-if="result.severity" class="srp-badge">{{ result.severity }}</span>
        </div>
        <div class="srp-date">{{ formattedDate }}</div>

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

const route = useRoute();
const { t, locale } = useI18n();

const loading = ref(true);
const error = ref(false);
const result = ref(null);

const formattedDate = computed(() => {
  if (!result.value?.createdAt) return '';
  return new Date(result.value.createdAt).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'vi-VN');
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
  max-width: 420px;
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
.srp-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin-bottom: 16px;
}
.srp-score-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 4px;
}
.srp-score {
  font-size: 2.4rem;
  font-weight: 900;
}
.srp-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--peach-light, #fde9dc);
  color: var(--text-primary);
}
.srp-date {
  font-size: 0.75rem;
  color: var(--text-light, #9a9488);
  margin-bottom: 18px;
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
}
.srp-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
