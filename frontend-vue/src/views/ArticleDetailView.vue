<template>
  <main class="main-content article-detail-page">
    <div class="breadcrumb" style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:0.8rem;color:var(--text-light);">
      <router-link :to="auth.isAuthenticated ? '/dashboard' : '/'" style="color:var(--text-light);text-decoration:none;">{{ auth.isAuthenticated ? t('inspire.breadcrumbDashboard') : t('inspire.breadcrumbHome') }}</router-link>
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

        <div class="article-share-row">
          <button type="button" class="article-save-btn" :class="{ 'is-saved': saved }" :aria-pressed="saved" @click="toggleSaveArticle(article.id)">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
            {{ saved ? t('inspire.savedLabel') : (auth.isAuthenticated ? t('inspire.save') : t('inspire.saveLogin')) }}
          </button>
          <ShareButtons :url="shareUrl" :text="article.title" />
        </div>
        <div v-if="!auth.isAuthenticated" class="ins-guest-cta">
          <p class="ins-guest-cta-title">{{ t('inspire.guestTitle') }}</p>
          <p class="ins-guest-cta-text">{{ t('inspire.guestText') }}</p>
          <div class="ins-guest-cta-actions">
            <router-link to="/signup" class="ins-guest-cta-primary">{{ t('inspire.guestSignup') }}</router-link>
            <router-link to="/login" class="ins-guest-cta-secondary" @click="rememberReturn">{{ t('inspire.guestLogin') }}</router-link>
          </div>
        </div>
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
import DOMPurify from 'dompurify';
import { apiClient, SHARE_BASE_URL } from '../lib/apiClient';
import ArticleCard from '../components/ArticleCard.vue';
import ShareButtons from '../components/ShareButtons.vue';
import { useAuthStore } from '../stores/auth';
import { isArticleSaved, toggleSaveArticle, loadSavedIds } from '../lib/savedArticles';

const { t, locale } = useI18n();
const route = useRoute();
const auth = useAuthStore();
const saved = computed(() => !!article.value && isArticleSaved(article.value.id));
const rememberReturn = () => sessionStorage.setItem('peaceflow_post_login_redirect', `${window.location.pathname}${window.location.search}`);
auth.waitForAuth?.().then(() => loadSavedIds());

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

// Nội dung giờ là HTML thật từ trình soạn thảo rich-text của admin (RichTextEditor.vue) —
// sanitize lại lần nữa ở đây (không chỉ tin phía admin) trước khi render bằng v-html, phòng
// trường hợp dữ liệu cũ/bị can thiệp trực tiếp qua API chứa script độc hại.
const renderedContent = computed(() => DOMPurify.sanitize(article.value?.content || ''));

// Trỏ về route /articles/:id/share ở BACKEND (không phải thẳng link SPA) — route đó tự biết
// trả HTML có og:title/og:image đúng bài viết khi bot Facebook/Threads quét, và tự chuyển
// người dùng thật sang đúng trang bài viết. Xem giải thích ở article.routes.js.
// SHARE_BASE_URL (domain "share.peaceflow.vn", đọc được từ VITE_SHARE_BASE_URL nếu cần đổi)
// định nghĩa ở apiClient.js, không hardcode ở đây.
const shareUrl = computed(() => `${SHARE_BASE_URL}/articles/${article.value?.id || ''}/share`);

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
        const blob = await apiClient.getBlob(`/articles/${route.params.id}/cover`, { cache: 'default' });
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
.article-share-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.article-save-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 16px; border: 1.5px solid #6F8F5E; border-radius: 999px; background: transparent; color: #4F6B42; font-family: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: background-color 0.15s ease; }
.article-save-btn svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
.article-save-btn:hover { background: rgba(111, 143, 94, 0.08); }
.article-save-btn.is-saved { background: #6F8F5E; color: #fff; }
.article-save-btn.is-saved svg { fill: currentColor; }
.ins-guest-cta { margin-top: 24px; padding: 18px 20px; border-radius: 18px; background: linear-gradient(135deg, #EEF4E8, #FBF6EE); }
.ins-guest-cta-title { margin: 0 0 4px; font-size: 1rem; font-weight: 800; color: var(--text-primary, #46362A); }
.ins-guest-cta-text { margin: 0 0 12px; font-size: 0.88rem; line-height: 1.55; color: var(--text-secondary, #6E5D4E); }
.ins-guest-cta-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ins-guest-cta-primary, .ins-guest-cta-secondary { display: inline-flex; align-items: center; min-height: 40px; padding: 8px 18px; border-radius: 999px; font-size: 0.88rem; font-weight: 700; text-decoration: none; }
.ins-guest-cta-primary { background: #6F8F5E; color: #fff; }
.ins-guest-cta-secondary { border: 1.5px solid #6F8F5E; color: #4F6B42; }
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
.ins-article-body :deep(ul),
.ins-article-body :deep(ol) {
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-primary);
  margin: 0 0 16px;
  padding-left: 26px;
}
.ins-article-body :deep(a) {
  color: var(--sky-dark, #4a90aa);
}
.article-share-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1.5px dashed var(--kraft-light);
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
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
