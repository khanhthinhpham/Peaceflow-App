<template>
  <main class="main-content ins-page" style="margin-left:0;">
    <h1 class="ins-page-title" style="margin-bottom:6px;">{{ t('inspire.pageTitle') }}</h1>
    <p class="ins-page-desc" style="margin-bottom:20px;">{{ t('inspire.pageDesc') }}</p>
    <div v-if="!auth.isAuthenticated" class="ins-guest-bar">
      <span>{{ t('inspire.guestBar') }}</span>
      <div class="ins-guest-bar-actions">
        <router-link to="/signup" class="ins-guest-bar-primary">{{ t('inspire.guestSignup') }}</router-link>
        <router-link to="/login" class="ins-guest-bar-secondary" @click="rememberReturn">{{ t('inspire.guestLogin') }}</router-link>
      </div>
    </div>

    <!-- Thanh tab danh mục kiểu báo chí (gạch chân dưới tab đang chọn) -->
    <nav class="ins-tabbar">
      <button
        type="button"
        class="ins-tab"
        :class="{ active: activeCategory === null && !showFullList && !showSaved }"
        @click="activeCategory = null; showFullList = false; showSaved = false"
      >{{ t('inspire.filterAll') }}</button>
      <button
        v-if="auth.isAuthenticated"
        type="button"
        class="ins-tab"
        :class="{ active: showSaved }"
        @click="activeCategory = null; showFullList = false; showSaved = true"
      >🔖 {{ t('inspire.savedTab') }}</button>
      <button
        v-for="(label, key) in categories"
        :key="key"
        type="button"
        class="ins-tab"
        :class="{ active: activeCategory === key }"
        @click="activeCategory = key; showFullList = false; showSaved = false"
      >{{ label }}</button>
    </nav>
    <div class="ins-category-filter-wrap">
      <button type="button" class="ins-category-filter-btn" data-ins-filter-btn @click="categoryFilterOpen = !categoryFilterOpen">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        {{ activeCategory ? categories[activeCategory] : t('inspire.filterAll') }}
        <span class="fd-caret">▾</span>
      </button>
      <div v-if="categoryFilterOpen" ref="categoryFilterDropdownEl" class="ins-category-filter-menu">
        <button type="button" class="icfm-item" :class="{ active: activeCategory === null }" @click="activeCategory = null; showFullList = false; categoryFilterOpen = false">{{ t('inspire.filterAll') }}</button>
        <button
          v-for="(label, key) in categories"
          :key="key"
          type="button"
          class="icfm-item"
          :class="{ active: activeCategory === key }"
          @click="activeCategory = key; showFullList = false; categoryFilterOpen = false"
        >{{ label }}</button>
      </div>
    </div>

    <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ t('inspire.loading') }}</div>
    <div v-else-if="loadError" style="text-align:center;padding:40px;color:var(--coral);">{{ loadError }}</div>
    <div v-else-if="listMode ? !list.items.length : !latest.length" class="paper-card" style="text-align:center;padding:40px;color:var(--text-secondary);">{{ showSaved ? t('inspire.savedEmpty') : t('inspire.empty') }}</div>

    <!-- Lọc 1 danh mục / "Xem tất cả": danh sách dạng dòng, cuộn tới đâu tải tới đó (20 bài / lần) -->
    <template v-else-if="listMode">
      <div v-if="showFullList && !activeCategory" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 style="font-size:1.1rem;font-weight:800;margin:0;">{{ t('inspire.fullListTitle', { n: list.total }) }}</h2>
        <button type="button" class="ins-see-all" @click="showFullList = false">{{ t('inspire.backToCurated') }}</button>
      </div>
      <div class="ins-row-list">
        <ArticleCard v-for="a in list.items" :key="a.id" :article="a" variant="row" />
      </div>
      <div ref="moreSentinel" class="ins-more" aria-live="polite">
        <span v-if="list.loading">{{ t('inspire.loadingMore') }}</span>
        <button v-else-if="list.error" type="button" class="ins-see-all" @click="loadMore">{{ t('inspire.retryMore') }}</button>
        <span v-else-if="list.done">{{ showSaved ? t('inspire.savedAll', { n: list.total }) : t('inspire.allLoaded', { n: list.total }) }}</span>
        <button v-else type="button" class="ins-see-all" @click="loadMore">{{ t('inspire.loadMore') }}</button>
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

          <button type="button" class="ins-view-full-btn" @click="showFullList = true">📚 {{ t('inspire.viewFullListBtn', { n: homeTotal }) }}</button>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import ArticleCard from '../components/ArticleCard.vue';
import { useAuthStore } from '../stores/auth';
import { loadSavedIds } from '../lib/savedArticles';

const { t } = useI18n();

// Trang gợi ý: dữ liệu từ /articles/home (bài mới nhất + vài bài đầu mỗi danh mục)
const latest = ref([]);
const byCategory = ref({});
const homeTotal = ref(0);
const categories = ref({});
// Danh sách phân trang (lọc danh mục / xem tất cả): mỗi lần 20 bài, cuộn gần cuối thì tải tiếp
const PAGE_SIZE = 20;
const list = reactive({ items: [], total: 0, offset: 0, loading: false, done: false, error: false, key: '' });
const moreSentinel = ref(null);
let moreObserver = null;
const loading = ref(true);
const loadError = ref('');
const activeCategory = ref(null);
const showFullList = ref(false);
const showSaved = ref(false); // tab "Đã lưu" (chỉ khi đã đăng nhập)
const auth = useAuthStore();
const rememberReturn = () => sessionStorage.setItem('peaceflow_post_login_redirect', `${window.location.pathname}${window.location.search}`);
const categoryFilterOpen = ref(false);
const categoryFilterDropdownEl = ref(null);
function handleCategoryFilterOutsideClick(event) {
  if (!categoryFilterOpen.value) return;
  if (categoryFilterDropdownEl.value && categoryFilterDropdownEl.value.contains(event.target)) return;
  if (event.target.closest('[data-ins-filter-btn]')) return;
  categoryFilterOpen.value = false;
}

// 1 bài nổi bật (ảnh lớn) + 5 tiêu đề chỉ-chữ bên cạnh + 3 ảnh nhỏ xếp lưới bên dưới —
// giống bố cục trang chủ báo chí (hero + danh sách headline + lưới ảnh nhỏ).
const listMode = computed(() => !!activeCategory.value || showFullList.value || showSaved.value);
const featured = computed(() => (!activeCategory.value && latest.value.length ? latest.value[0] : null));
const headlineItems = computed(() => (!activeCategory.value ? latest.value.slice(1, 8) : []));
const thumbGridItems = computed(() => (!activeCategory.value ? latest.value.slice(8, 11) : []));
// Sidebar "Mới đăng" lấy lại từ đầu danh sách (đã sắp theo mới nhất) — trùng một phần với
// hero/lưới phía trên là chủ ý, giống cách các trang báo vẫn lặp lại tin nổi bật ở sidebar.
const sidebarLatestItems = computed(() => (!activeCategory.value ? latest.value.slice(0, 8) : []));

const PER_CATEGORY_COUNT = 6;
// Mỗi danh mục hiện riêng 6 bài mới nhất của nó (không loại trừ các bài đã hiện ở hero/lưới
// phía trên) — để đủ mặt mọi danh mục dù bài của nó đã lọt vào top mới nhất phía trên.
const categoryGroups = computed(() => {
  if (activeCategory.value) return [];
  const groups = [];
  for (const [key, label] of Object.entries(categories.value)) {
    const items = (byCategory.value[key] || []).slice(0, PER_CATEGORY_COUNT);
    if (items.length) groups.push({ key, label, items });
  }
  return groups;
});

async function loadHome() {
  loading.value = true; loadError.value = '';
  try {
    const data = await apiClient.get(`/articles/home?per=${PER_CATEGORY_COUNT}`, { noCache: true });
    latest.value = data?.latest || []; byCategory.value = data?.byCategory || {};
    homeTotal.value = data?.total || 0; categories.value = data?.categories || {};
  } catch (_e) {
    loadError.value = t('inspire.loadError');
  } finally {
    loading.value = false;
  }
}
// tải trang kế tiếp của danh sách (bỏ qua nếu đang tải / đã hết; kết quả về muộn của bộ lọc cũ thì bỏ)
async function loadMore() {
  if (list.loading || list.done) return;
  const key = list.key; list.loading = true; list.error = false;
  try {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(list.offset) });
    if (activeCategory.value && !showSaved.value) params.set('category', activeCategory.value);
    const data = await apiClient.get(`${showSaved.value ? '/articles/saved' : '/articles'}?${params.toString()}`, { noCache: true });
    if (key !== list.key) return;
    const got = data?.articles || [];
    const seen = new Set(list.items.map((a) => a.id));
    list.items.push(...got.filter((a) => !seen.has(a.id)));
    list.offset += got.length; list.total = data?.total ?? list.total;
    if (data?.categories) categories.value = data.categories;
    list.done = got.length < PAGE_SIZE || list.offset >= list.total;
  } catch (_e) {
    if (key === list.key) list.error = true;
  } finally {
    if (key === list.key) list.loading = false;
  }
  await nextTick(); checkSentinel(); // màn hình cao: tải tiếp tới khi lấp đầy
}
async function startList() {
  list.key = `${activeCategory.value || 'all'}:${Date.now()}`;
  Object.assign(list, { items: [], total: 0, offset: 0, loading: false, done: false, error: false });
  loading.value = true; loadError.value = '';
  await loadMore();
  if (list.error && !list.items.length) loadError.value = t('inspire.loadError');
  loading.value = false;
  await nextTick(); observeSentinel();
}
function checkSentinel() {
  const el = moreSentinel.value; if (!el || list.loading || list.done || list.error) return;
  if (el.getBoundingClientRect().top < window.innerHeight + 400) loadMore();
}
function observeSentinel() {
  moreObserver?.disconnect();
  if (!moreSentinel.value || typeof IntersectionObserver === 'undefined') return;
  moreObserver = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) loadMore(); }, { rootMargin: '400px 0px' });
  moreObserver.observe(moreSentinel.value);
}
function refresh() {
  if (listMode.value) startList();
  else { moreObserver?.disconnect(); if (!latest.value.length) loadHome(); }
}

watch([activeCategory, showFullList, showSaved], refresh);
onMounted(() => {
  loadHome();
  auth.waitForAuth?.().then(() => loadSavedIds()); // đánh dấu các bài đã lưu trên thẻ
  document.addEventListener('click', handleCategoryFilterOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleCategoryFilterOutsideClick);
  moreObserver?.disconnect();
});
</script>

<style scoped>
.ins-guest-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px 16px; margin: 0 0 20px; padding: 12px 16px; border-radius: 16px; background: linear-gradient(135deg, #EEF4E8, #FBF6EE); font-size: 0.9rem; color: var(--text-secondary); }
.ins-guest-bar-actions { display: flex; gap: 8px; }
.ins-guest-bar-primary, .ins-guest-bar-secondary { display: inline-flex; align-items: center; min-height: 38px; padding: 6px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 700; text-decoration: none; }
.ins-guest-bar-primary { background: #6F8F5E; color: #fff; }
.ins-guest-bar-secondary { border: 1.5px solid #6F8F5E; color: #4F6B42; }
.ins-more { display: flex; justify-content: center; padding: 18px 0 8px; min-height: 48px; font-size: 0.85rem; color: var(--text-secondary); }
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
.ins-category-filter-wrap {
  display: none;
  position: relative;
  margin-bottom: 24px;
}
.ins-category-filter-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--kraft-light);
  border-radius: 50px;
  background: var(--warm-white);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}
.ins-category-filter-btn:hover {
  background: var(--mint-light);
  border-color: var(--mint);
}
.ins-category-filter-btn .fd-caret {
  margin-left: auto;
}
.ins-category-filter-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: var(--warm-white);
  border: 1.5px solid var(--kraft-light);
  border-radius: var(--radius-md);
  box-shadow: 3px 3px 0px rgba(74, 55, 40, 0.15);
  max-height: 320px;
  overflow-y: auto;
}
.icfm-item {
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  background: none;
  color: var(--text-secondary);
  transition: var(--transition);
}
.icfm-item:hover {
  background: var(--kraft-light);
}
.icfm-item.active {
  background: var(--mint-light);
  color: var(--text-primary);
}
@media (max-width: 700px) {
  .ins-tabbar {
    display: none;
  }
  .ins-category-filter-wrap {
    display: block;
  }
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

@media (max-width: 900px), (hover: none) and (pointer: coarse) {
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

/* ---- Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, khối nội dung là thẻ
   trắng bo mềm không viền/bóng giấy, chữ Inter + tiêu đề --font-heading, nhãn/nút phẳng, đường
   kẻ mảnh liền nét. Thẻ bài viết (ArticleCard) chỉ có gốc nhận scope của trang này nên phần
   bên trong chỉnh qua :deep(). ---- */
.ins-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; min-height: 100vh;
  padding: 20px 20px 32px !important;
}
.ins-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.ins-page :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.ins-page-title { font-family: var(--font-heading); font-size: 26px !important; font-weight: 800; letter-spacing: -0.01em; color: var(--color-text); }
.ins-page-desc { font-size: 14px !important; color: var(--color-text-muted) !important; }
.ins-page .breadcrumb, .ins-page .breadcrumb a { color: var(--color-text-subtle) !important; font-size: 13px !important; }

/* Tab danh mục: gạch chân xanh thương hiệu, đường kẻ mảnh. */
.ins-tabbar { border-bottom: 1px solid var(--color-surface-muted); }
.ins-tab { font-size: 14px; font-weight: 600; color: var(--color-text-muted); }
.ins-tab:hover { color: var(--color-brand); }
.ins-tab.active { color: var(--color-brand); border-bottom-color: var(--color-brand); }
.ins-category-filter-btn { border: none; border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-text); font-size: 14px; font-weight: 600; }
.ins-category-filter-btn:hover { background: var(--color-brand-soft); color: var(--color-brand); border: none; }
.ins-category-filter-menu { border: none; border-radius: var(--radius-card); background: var(--color-surface); box-shadow: var(--shadow-soft); }
.icfm-item { font-size: 14px; color: var(--color-text); border-radius: var(--radius-control); }
.icfm-item:hover { background: var(--color-canvas); }
.icfm-item.active { background: var(--color-brand-soft); color: var(--color-brand); }

/* Khối nội dung chính: thẻ trắng bo mềm. */
.ins-hero-main-col, .ins-main-col { background: var(--color-surface); border-radius: var(--radius-card); padding: 16px; }
/* Cột tiêu đề cạnh bài nổi bật: không nền thẻ; rê chuột vào bài nào thì cả dòng sáng lên. */
.ins-headline-col { background: transparent; padding: 0; }
.ins-sidebar-box { border: none; border-radius: var(--radius-card); background: var(--color-surface); }
.ins-sidebar-title, .ins-section-header { font-family: var(--font-heading); }
.ins-sidebar-title { font-size: 17px; color: var(--color-text); }
.ins-section-header { font-size: 17px; color: var(--color-brand); }
.ins-see-all { color: var(--color-brand); font-size: 13px; font-weight: 600; }
.ins-tag-pills { border-top: 1px solid var(--color-surface-muted); border-bottom: 1px solid var(--color-surface-muted); }
.ins-tag-pill { border: none; border-radius: 999px; background: var(--color-brand-soft); color: var(--color-brand); font-size: 13px; font-weight: 600; }
.ins-tag-pill:hover { background: var(--color-brand); color: var(--color-on-brand); }
.ins-view-full-btn { border: none; border-radius: var(--radius-control); background: var(--color-surface-muted); color: var(--color-text); font-size: 14px; font-weight: 600; }
.ins-view-full-btn:hover { background: var(--color-brand-soft); color: var(--color-brand); border: none; }

/* Thẻ bài viết. */
.ins-page :deep(.ins-card) { border: none; box-shadow: none; background: var(--color-surface); border-radius: var(--radius-card); }
.ins-page :deep(.ins-card:hover) { box-shadow: none; }
.ins-page :deep(.ins-card-row), .ins-page :deep(.ins-card-headline), .ins-page :deep(.ins-card-sidebar-row) { background: transparent; border-radius: 0; }
.ins-page :deep(.ins-card-row) { border-top: none; border-bottom: 1px solid var(--color-surface-muted); padding: 12px 0; }
.ins-page :deep(.ins-card-row:hover) { background: transparent; }
.ins-page :deep(.ins-card-row:hover .ins-title), .ins-page :deep(.ins-card-sidebar-row:hover .ins-title), .ins-page :deep(.ins-card-grid:hover .ins-title), .ins-page :deep(.ins-card-featured-side:hover .ins-title) { color: var(--color-brand); }
.ins-page :deep(.ins-card-headline .ins-body) { border-bottom: 1px solid var(--color-surface-muted); }
.ins-page :deep(.ins-card-headline:last-child .ins-body) { border-bottom: none; }
.ins-page :deep(.ins-card-sidebar-row) { border-bottom-color: var(--color-surface-muted); }
.ins-page :deep(.ins-cover) { border-radius: var(--radius-control); overflow: hidden; }
.ins-page :deep(.ins-tag) { border: none; border-radius: 999px; background: var(--color-brand-soft); color: var(--color-brand); font-size: 12px; font-weight: 600; }
.ins-page :deep(.ins-title) { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); transition: color var(--duration-fast) var(--ease-standard); }
.ins-page :deep(.ins-meta) { font-size: 12.5px; color: var(--color-text-subtle); }
.ins-page :deep(.ins-excerpt) { color: var(--color-text-muted); }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .ins-page { padding: 16px 16px 24px !important; }
}
.ins-page :deep(.ins-card-headline) { border-radius: var(--radius-control); transition: background-color var(--duration-fast) var(--ease-standard); }
.ins-page :deep(.ins-card-headline .ins-body) { padding: 12px 14px; }
.ins-page :deep(.ins-card-headline:hover) { background: var(--color-surface); transform: none; }
.ins-page :deep(.ins-card-headline:hover .ins-body) { border-bottom-color: transparent; }
.ins-page :deep(.ins-card-headline:hover .ins-title) { color: var(--color-brand); }
</style>
