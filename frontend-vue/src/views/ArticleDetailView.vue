<template>
  <main class="main-content article-detail-page">
    <div class="breadcrumb" style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:0.8rem;color:var(--text-light);">
      <router-link to="/dashboard" style="color:var(--text-light);text-decoration:none;">{{ t('inspire.breadcrumbDashboard') }}</router-link>
      <span>›</span>
      <router-link to="/inspire" style="color:var(--text-light);text-decoration:none;">{{ t('inspire.breadcrumbCurrent') }}</router-link>
      <span>›</span>
      <span style="color:var(--text-secondary);font-weight:600;">{{ article?.title || '' }}</span>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('inspire.loading') }}</div>
    <div v-else-if="loadError" style="text-align:center;padding:40px;color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="article" class="article-detail-layout">
    <article class="paper-card article-detail-main" style="padding:0;overflow:hidden;">
      <div v-if="coverUrl" style="width:100%;">
        <img :src="coverUrl" :alt="article.title" style="display:block;width:100%;height:auto;">
      </div>
      <div style="padding:28px;">
        <span class="ins-tag">{{ article.categoryLabel }}</span>
        <h1 style="font-size:1.6rem;font-weight:800;margin:12px 0 6px;line-height:1.35;">{{ article.title }}</h1>
        <div style="font-size:0.8rem;color:var(--text-light);margin-bottom:24px;">{{ formatDate(article.publishedAt || article.createdAt) }} · {{ article.authorName }}</div>
        <div class="ins-article-body" v-html="renderedContent"></div>
      </div>
    </article>
    <aside v-if="latestArticles.length" class="article-detail-sidebar">
      <div class="article-latest-box">
        <h2>{{ t('inspire.latestTitle') }}</h2>
        <ArticleCard
          v-for="latest in latestArticles"
          :key="latest.id"
          :article="latest"
          variant="sidebar-row"
        />
      </div>
    </aside>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import ArticleCard from '../components/ArticleCard.vue';

const { t, locale } = useI18n();
const route = useRoute();

const article = ref(null);
const coverUrl = ref('');
const latestArticles = ref([]);
const loading = ref(true);
const loadError = ref('');

function formatDate(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v));
  } catch (_e) { return ''; }
}

// Nội dung là plain text nhập từ textarea admin (không phải HTML tuỳ ý người dùng) — chỉ
// escape rồi giữ xuống dòng, tránh phải nhúng thư viện rich-text editor cho MVP này.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const renderedContent = computed(() => {
  if (!article.value?.content) return '';
  return escapeHtml(article.value.content).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
});

async function loadLatestArticles(currentArticleId) {
  try {
    const data = await apiClient.get('/articles?limit=8', { noCache: true });
    latestArticles.value = (data?.articles || [])
      .filter((item) => item.id !== currentArticleId)
      .slice(0, 6);
  } catch (_e) {
    latestArticles.value = [];
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  coverUrl.value = '';
  latestArticles.value = [];
  try {
    const data = await apiClient.get(`/articles/${route.params.id}`, { noCache: true });
    article.value = data;
    void loadLatestArticles(data.id);
    if (data?.hasCover) {
      try {
        const blob = await apiClient.getBlob(`/articles/${route.params.id}/cover`);
        coverUrl.value = URL.createObjectURL(blob);
      } catch (_e) { /* bỏ qua, không hiện ảnh bìa */ }
    }
  } catch (_e) {
    loadError.value = t('inspire.notFound');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<style scoped>
.article-detail-page {
  margin-left: 0;
  min-height: 100vh;
  padding: 28px;
}
.article-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: 28px;
  align-items: start;
}
.article-detail-main {
  min-width: 0;
}
.article-detail-sidebar {
  position: sticky;
  top: 20px;
  align-self: start;
  height: fit-content;
  min-width: 0;
}
.article-latest-box {
  padding: 16px;
  border: 2px solid var(--kraft-light);
  border-radius: var(--radius-md);
  background: var(--warm-white);
}
.article-latest-box h2 {
  margin: 0 0 10px;
  font-size: 0.92rem;
  font-weight: 800;
}
.ins-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 50px;
  background: var(--sky-light);
  color: #4a90aa;
  border: 1.5px solid var(--sky);
}
.ins-article-body :deep(p) {
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .article-detail-layout {
    grid-template-columns: 1fr;
  }
  .article-detail-sidebar {
    position: static;
  }
}
@media (max-width: 600px) {
  .article-detail-page {
    padding: 16px 16px 20px;
  }
}
</style>
