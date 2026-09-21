<template>
  <main class="main-content" style="margin-left:0;padding:28px;">
    <div class="breadcrumb" style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:0.8rem;color:var(--text-light);">
      <router-link to="/dashboard" style="color:var(--text-light);text-decoration:none;">{{ t('inspire.breadcrumbDashboard') }}</router-link>
      <span>›</span>
      <span style="color:var(--text-secondary);font-weight:600;">{{ t('inspire.breadcrumbCurrent') }}</span>
    </div>

    <h1 style="font-size:1.5rem;font-weight:800;margin-bottom:6px;">{{ t('inspire.pageTitle') }}</h1>
    <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:20px;">{{ t('inspire.pageDesc') }}</p>

    <!-- Thanh tab danh mục kiểu báo chí (gạch chân dưới tab đang chọn) -->
    <nav class="ins-tabbar">
      <button
        type="button"
        class="ins-tab"
        :class="{ active: activeCategory === null && !showFullList }"
        @click="activeCategory = null; showFullList = false"
      >{{ t('inspire.filterAll') }}</button>
      <button
        v-for="(label, key) in categories"
        :key="key"
        type="button"
        class="ins-tab"
        :class="{ active: activeCategory === key }"
        @click="activeCategory = key; showFullList = false"
      >{{ label }}</button>
    </nav>

    <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('inspire.loading') }}</div>
    <div v-else-if="loadError" style="text-align:center;padding:40px;color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="!articles.length" class="paper-card" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('inspire.empty') }}</div>

    <!-- Bộ lọc = 1 danh mục cụ thể: danh sách dạng dòng của đúng danh mục đó -->
    <div v-else-if="activeCategory" class="ins-row-list">
      <ArticleCard v-for="a in articles" :key="a.id" :article="a" variant="row" />
    </div>

    <!-- "Xem tất cả bài viết": toàn bộ bài viết, không chia theo danh mục -->
    <template v-else-if="showFullList">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 style="font-size:1.1rem;font-weight:800;margin:0;">{{ t('inspire.fullListTitle', { n: articles.length }) }}</h2>
        <button type="button" class="ins-see-all" @click="showFullList = false">{{ t('inspire.backToCurated') }}</button>
      </div>
      <div class="ins-row-list">
        <ArticleCard v-for="a in articles" :key="a.id" :article="a" variant="row" />
      </div>
    </template>

    <!-- Trang gợi ý mặc định: hero + danh sách tiêu đề, lưới ảnh nhỏ, hashtag, danh sách theo
         danh mục kèm sidebar — bố cục kiểu trang báo. -->
    <template v-else>
      <!-- Lưới 2 cột x 2 hàng DUY NHẤT cho toàn trang — cột trái/phải dùng chung 1 định nghĩa
           độ rộng (grid-template-columns) nên luôn khớp nhau ở MỌI hàng, không phụ thuộc vào
           việc 2 khối flex riêng biệt có tính ra cùng tỉ lệ hay không (từng bị lệch cạnh khi
           thử ghép 2 flex row riêng có "cùng tỉ lệ" — trên lý thuyết khớp nhưng thực tế vẫn
           lệch do nội dung bên trong ảnh hưởng khác nhau tới từng flex row). -->
      <div class="ins-page-grid">
        <div class="ins-hero-main-col">
          <ArticleCard v-if="featured" :article="featured" variant="featured-side" />
          <div v-if="thumbGridItems.length" class="ins-thumb-grid">
            <ArticleCard v-for="a in thumbGridItems" :key="a.id" :article="a" />
          </div>
        </div>
        <div v-if="headlineItems.length" class="ins-headline-col">
          <ArticleCard v-for="a in headlineItems" :key="a.id" :article="a" variant="headline" />
        </div>

        <div class="ins-main-col">
          <div v-if="Object.keys(categories).length" class="ins-tag-pills">
            <button
              v-for="(label, key) in categories"
              :key="key"
              type="button"
              class="ins-tag-pill"
              @click="activeCategory = key"
            >#{{ label }}</button>
          </div>

          <section v-for="group in categoryGroups" :key="group.key" class="ins-section">
            <div class="ins-section-head">
              <h2 class="ins-section-header">#{{ group.label.toUpperCase() }}</h2>
              <button type="button" class="ins-see-all" @click="activeCategory = group.key">{{ t('inspire.seeAll') }}</button>
            </div>
            <ArticleCard :article="group.items[0]" variant="featured-side" style="margin-bottom:16px;" />
            <div v-if="group.items.length > 1" class="ins-row-list">
              <ArticleCard v-for="a in group.items.slice(1)" :key="a.id" :article="a" variant="row" />
            </div>
          </section>

          <button type="button" class="ins-view-full-btn" @click="showFullList = true">📚 {{ t('inspire.viewFullListBtn', { n: articles.length }) }}</button>
        </div>

        <aside class="ins-side-col2">
          <div class="ins-brand-box">
            <img src="/images/peaceflow-brand-cover.png" alt="PeaceFlow" class="ins-brand-logo">
          </div>
          <div class="ins-sidebar-box">
            <h3 class="ins-sidebar-title">📌 {{ t('inspire.latestTitle') }}</h3>
            <ArticleCard v-for="a in sidebarLatestItems" :key="a.id" :article="a" variant="sidebar-row" />
          </div>
        </aside>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import ArticleCard from '../components/ArticleCard.vue';

const { t } = useI18n();

const articles = ref([]);
const categories = ref({});
const loading = ref(true);
const loadError = ref('');
const activeCategory = ref(null);
const showFullList = ref(false);

// 1 bài nổi bật (ảnh lớn) + 5 tiêu đề chỉ-chữ bên cạnh + 3 ảnh nhỏ xếp lưới bên dưới —
// giống bố cục trang chủ báo chí (hero + danh sách headline + lưới ảnh nhỏ).
const featured = computed(() => (!activeCategory.value && articles.value.length ? articles.value[0] : null));
const headlineItems = computed(() => (!activeCategory.value ? articles.value.slice(1, 8) : []));
const thumbGridItems = computed(() => (!activeCategory.value ? articles.value.slice(8, 11) : []));
// Sidebar "Mới đăng" lấy lại từ đầu danh sách (đã sắp theo mới nhất) — trùng một phần với
// hero/lưới phía trên là chủ ý, giống cách các trang báo vẫn lặp lại tin nổi bật ở sidebar.
const sidebarLatestItems = computed(() => (!activeCategory.value ? articles.value.slice(0, 8) : []));

const PER_CATEGORY_COUNT = 6;
// Mỗi danh mục hiện riêng 6 bài mới nhất của nó (không loại trừ các bài đã hiện ở hero/lưới
// phía trên) — để đủ mặt mọi danh mục dù bài của nó đã lọt vào top mới nhất phía trên.
const categoryGroups = computed(() => {
  if (activeCategory.value) return [];
  const groups = [];
  for (const [key, label] of Object.entries(categories.value)) {
    const items = articles.value.filter((a) => a.category === key).slice(0, PER_CATEGORY_COUNT);
    if (items.length) groups.push({ key, label, items });
  }
  return groups;
});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    // Backend mặc định limit=30/trang nếu không truyền — trang này tự lọc/nhóm phía client
    // (nổi bật, theo danh mục, xem tất cả) nên luôn cần lấy hết, truyền thẳng mức trần
    // backend cho phép (100) thay vì để rơi vào limit mặc định.
    const params = new URLSearchParams({ limit: '100' });
    if (activeCategory.value) params.set('category', activeCategory.value);
    const data = await apiClient.get(`/articles?${params.toString()}`, { noCache: true });
    articles.value = data?.articles || [];
    categories.value = data?.categories || {};
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
.ins-tabbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--kraft-light);
}
.ins-tab {
  border: none;
  background: none;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: var(--transition);
}
.ins-tab:hover {
  color: var(--mint-dark);
}
.ins-tab.active {
  color: var(--mint-dark);
  border-bottom-color: var(--mint-dark);
}
.ins-see-all {
  border: none;
  background: none;
  color: var(--mint-dark);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

/* Lưới 2 cột x 2 hàng DUY NHẤT cho toàn phần "gợi ý mặc định": cột trái (hero + lưới ảnh +
   hashtag + bài theo danh mục) và cột phải (tiêu đề hero + logo + sidebar) LUÔN cùng độ
   rộng ở cả 2 hàng vì cùng dùng 1 grid-template-columns — không như trước đây tách thành
   2 flex row riêng biệt rồi cố "khớp tỉ lệ", trên lý thuyết ra cùng số nhưng thực tế vẫn bị
   lệch cạnh do nội dung mỗi row ảnh hưởng khác nhau tới flex-basis. Không khai báo
   grid-column/grid-row cho từng ô — để auto-placement tự xếp theo đúng thứ tự trong DOM
   (hero-main-col, headline-col, main-col, side-col2) lấp đúng 2 hàng như ý. */
.ins-page-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  column-gap: 28px;
  row-gap: 28px;
}
.ins-hero-main-col {
  min-width: 0;
  background-color: white;
}
.ins-headline-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  /* space-between: bài đầu sát mép trên (ngang đỉnh ảnh), bài cuối sát mép dưới (ngang đáy
     ảnh) — khoảng trống chỉ chia đều vào GIỮA các bài, không còn hở ở đầu/cuối như
     space-evenly (trước đó) hay flex-start (chỉ sát trên, hở hẳn khoảng dưới). */
  justify-content: space-between;
}

/* Lưới 3 ảnh nhỏ ngay dưới hero */
.ins-thumb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 20px;
}

/* Hàng hashtag danh mục */
.ins-tag-pills {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 18px 0;
  margin-bottom: 28px;
  border-top: 1.5px solid var(--kraft-light);
  border-bottom: 1.5px solid var(--kraft-light);
}
.ins-tag-pill {
  flex: 1 1 0;
  border: 1.5px solid var(--sky);
  background: var(--sky-light);
  color: #4a90aa;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 50px;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  text-align: center;
}
.ins-tag-pill:hover {
  background: var(--sky);
  color: white;
}

.ins-brand-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.ins-brand-logo {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 2 cột: danh sách theo danh mục bên trái + sidebar "Mới đăng" bên phải */
.ins-main-col {
  min-width: 0;
  background-color: white;
}
.ins-section {
  margin-bottom: 32px;
}
.ins-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
.ins-section-header {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  color: var(--mint-dark);
  letter-spacing: 0.3px;
}
.ins-row-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ins-view-full-btn {
  width: 100%;
  padding: 12px;
  border-radius: 50px;
  border: 1.5px solid var(--kraft-light);
  background: var(--warm-white);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.ins-view-full-btn:hover {
  border-color: var(--mint-dark);
  color: var(--mint-dark);
}

.ins-side-col2 {
  min-width: 0;
}
.ins-sidebar-box {
  /* Chỉ riêng khối "Mới đăng" dính lại khi cuộn — logo phía trên (.ins-brand-box) vẫn cuộn
     bình thường theo trang. */
  position: sticky;
  top: 20px;
  background: var(--warm-white);
  border: 2px solid var(--kraft-light);
  border-radius: var(--radius-md);
  padding: 16px;
}
.ins-sidebar-title {
  font-size: 0.92rem;
  font-weight: 800;
  margin: 0 0 10px;
}

@media (max-width: 900px) {
  .ins-page-grid {
    grid-template-columns: 1fr;
  }
  .ins-sidebar-box {
    position: static;
  }
}
@media (max-width: 700px) {
  .ins-thumb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .ins-thumb-grid {
    grid-template-columns: 1fr;
  }
}
</style>
