<template>
  <main class="main-content" style="margin-left:0;padding:28px;">
    <div class="breadcrumb" style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:0.8rem;color:var(--text-light);">
      <router-link to="/dashboard" style="color:var(--text-light);text-decoration:none;">{{ t('inspire.breadcrumbDashboard') }}</router-link>
      <span>›</span>
      <span style="color:var(--text-secondary);font-weight:600;">{{ t('inspire.breadcrumbCurrent') }}</span>
    </div>

    <h1 style="font-size:1.5rem;font-weight:800;margin-bottom:6px;">{{ t('inspire.pageTitle') }}</h1>
    <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:20px;">{{ t('inspire.pageDesc') }}</p>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;">
      <button
        type="button"
        class="ins-filter-btn"
        :class="{ active: activeCategory === null }"
        @click="activeCategory = null"
      >{{ t('inspire.filterAll') }}</button>
      <button
        v-for="(label, key) in categories"
        :key="key"
        type="button"
        class="ins-filter-btn"
        :class="{ active: activeCategory === key }"
        @click="activeCategory = key"
      >{{ label }}</button>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('inspire.loading') }}</div>
    <div v-else-if="loadError" style="text-align:center;padding:40px;color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!articles.length" class="paper-card" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('inspire.empty') }}</div>

    <!-- Bộ lọc = 1 danh mục cụ thể: chỉ hiện lưới bài của đúng danh mục đó -->
    <div v-else-if="activeCategory" class="ins-grid">
      <ArticleCard v-for="a in articles" :key="a.id" :article="a" :cover="coverUrls[a.id]" />
    </div>

    <!-- "Tất cả": 4 bài mới nhất nổi bật ở trên, bên dưới xếp theo từng danh mục riêng -->
    <template v-else>
      <div v-if="featured || sideItems.length" class="ins-hero-row" style="margin-bottom:36px;">
        <ArticleCard v-if="featured" :article="featured" :cover="coverUrls[featured.id]" variant="featured" />
        <div v-if="sideItems.length" class="ins-side-col">
          <ArticleCard v-for="a in sideItems" :key="a.id" :article="a" :cover="coverUrls[a.id]" variant="side" />
        </div>
      </div>

      <section v-for="group in categoryGroups" :key="group.key" style="margin-bottom:36px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <h2 style="font-size:1.1rem;font-weight:800;margin:0;">{{ group.label }}</h2>
          <button type="button" class="ins-see-all" @click="activeCategory = group.key">{{ t('inspire.seeAll') }}</button>
        </div>
        <div class="ins-grid ins-grid-cat">
          <ArticleCard v-for="a in group.items" :key="a.id" :article="a" :cover="coverUrls[a.id]" />
        </div>
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import ArticleCard from '../components/ArticleCard.vue';

const { t } = useI18n();

const articles = ref([]);
const categories = ref({});
const loading = ref(true);
const loadError = ref('');
const activeCategory = ref(null);
const coverUrls = reactive({});

const TOP_COUNT = 4;
// 1 bài nổi bật bên trái + tối đa 3 bài nhỏ xếp cột bên phải.
const featured = computed(() => (!activeCategory.value && articles.value.length ? articles.value[0] : null));
const sideItems = computed(() => (!activeCategory.value ? articles.value.slice(1, TOP_COUNT) : []));

const PER_CATEGORY_COUNT = 3;
// Mỗi danh mục hiện riêng 3 bài nổi bật nhất của nó (không loại trừ 4 bài đã hiện ở
// trên) — để đủ mặt mọi danh mục dù bài của nó đã lọt vào top 4 mới nhất phía trên.
const categoryGroups = computed(() => {
  if (activeCategory.value) return [];
  const groups = [];
  for (const [key, label] of Object.entries(categories.value)) {
    const items = articles.value.filter((a) => a.category === key).slice(0, PER_CATEGORY_COUNT);
    if (items.length) groups.push({ key, label, items });
  }
  return groups;
});

async function preloadCovers(list) {
  await Promise.all(list.filter((a) => a.hasCover).map(async (a) => {
    try {
      const blob = await apiClient.getBlob(`/articles/${a.id}/cover`);
      coverUrls[a.id] = URL.createObjectURL(blob);
    } catch (_e) { /* giữ fallback icon */ }
  }));
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const qs = activeCategory.value ? `?category=${encodeURIComponent(activeCategory.value)}` : '';
    const data = await apiClient.get(`/articles${qs}`, { noCache: true });
    articles.value = data?.articles || [];
    categories.value = data?.categories || {};
    preloadCovers(articles.value);
  } catch (_e) {
    loadError.value = t('inspire.loadError');
  } finally {
    loading.value = false;
  }
}

watch(activeCategory, load);
onMounted(load);
</script>

<style scoped>
.ins-filter-btn {
  padding: 8px 16px;
  border-radius: 50px;
  border: 1.5px solid var(--kraft-light);
  background: var(--warm-white);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.ins-filter-btn.active {
  background: var(--mint-dark);
  border-color: var(--mint-dark);
  color: white;
}
.ins-see-all {
  border: none;
  background: none;
  color: var(--mint-dark);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.ins-hero-row {
  display: flex;
  align-items: stretch;
  gap: 20px;
}
.ins-side-col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ins-side-col > * {
  flex: 1 1 0;
  min-height: 0;
}
.ins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.ins-grid-cat {
  grid-template-columns: repeat(3, 1fr);
}
@media (max-width: 700px) {
  .ins-hero-row {
    flex-direction: column;
  }
}
@media (max-width: 600px) {
  .ins-grid {
    grid-template-columns: 1fr;
  }
}
</style>
