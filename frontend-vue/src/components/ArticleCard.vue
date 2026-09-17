<template>
  <router-link
    :to="{ name: 'inspire-detail', params: { id: article.id } }"
    class="paper-card ins-card"
    :class="`ins-card-${variant}`"
  >
    <div v-if="variant !== 'headline'" class="ins-cover" :class="{ 'ins-cover-featured': variant === 'featured' }">
      <img v-if="coverSrc" :src="coverSrc" :alt="article.title" loading="lazy" decoding="async">
      <span v-else class="ins-cover-fallback">📖</span>
    </div>
    <div class="ins-body">
      <span v-if="variant !== 'row' && variant !== 'headline' && variant !== 'sidebar-row'" class="ins-tag">{{ article.categoryLabel }}</span>
      <div class="ins-title">{{ article.title }}</div>
      <div v-if="variant === 'row' || variant === 'sidebar-row' || variant === 'headline'" class="ins-meta">{{ article.categoryLabel }} · {{ metaLine }}</div>
      <div v-else-if="variant !== 'side'" class="ins-meta">{{ metaLine }}</div>
      <p v-if="(variant === 'featured-side' || variant === 'row') && article.excerpt" class="ins-excerpt">{{ article.excerpt }}</p>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { API_BASE_URL } from '../lib/apiClient';

const props = defineProps({
  article: { type: Object, required: true },
  variant: { type: String, default: 'grid' }
});

const { locale } = useI18n();

// Ảnh bìa dùng thẳng URL (endpoint /articles/:id/cover không cần đăng nhập) + loading="lazy"
// của trình duyệt — trước đây trang danh sách tự fetch blob cho TẤT CẢ bài viết ngay khi vào
// trang (dù chưa cuộn tới), tải rất nặng/chậm. Giờ ảnh chỉ thực sự tải khi trình duyệt thấy
// nó sắp lọt vào khung nhìn khi cuộn.
const coverSrc = computed(() => (props.article.hasCover ? `${API_BASE_URL}/articles/${props.article.id}/cover` : ''));

function formatDate(v) {
  if (!v) return '';
  try {
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v));
  } catch (_e) { return ''; }
}

const metaLine = computed(() => `${formatDate(props.article.publishedAt || props.article.createdAt)} · ${props.article.authorName}`);
</script>

<style scoped>
.ins-card-featured {
  flex: 2 1 0;
  min-width: 0;
}
/* Lưới 3 ảnh nhỏ (biến thể mặc định, đang chỉ dùng riêng ở đó) — bỏ khung viền, chỉ còn
   ảnh + chữ. */
.ins-card-grid {
  border: none;
  box-shadow: none;
}
.ins-card-grid:hover {
  transform: none;
}
.ins-cover-featured {
  aspect-ratio: 21 / 9;
}
.ins-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  padding: 0;
  transition: var(--transition);
}
.ins-card:hover {
  transform: translateY(-3px);
}
.ins-cover {
  width: 100%;
  flex-shrink: 0;
  aspect-ratio: 16 / 9;
  background: var(--mint-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ins-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ins-cover-fallback {
  font-size: 2.4rem;
}
.ins-body {
  flex: 1 1 auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}

/* Card nhỏ bên cạnh nổi bật: 3 card chia đều chiều cao card nổi bật (ở InspireView.vue),
   nên ảnh ở đây KHÔNG dùng aspect-ratio cố định (dễ lệch, tràn) mà co giãn lấp đầy hết
   phần còn lại sau khi trừ khối chữ — ảnh luôn chiếm phần lớn, chữ chỉ 1 dòng nhỏ cố định. */
.ins-card-side .ins-cover {
  flex: 1 1 auto;
  aspect-ratio: auto;
  min-height: 0;
}
.ins-card-side .ins-cover-fallback {
  font-size: 1.8rem;
}
.ins-card-side .ins-body {
  flex: 0 0 auto;
  padding: 8px 12px;
}
.ins-card-side .ins-title {
  font-size: 0.85rem;
  margin: 4px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ins-card-side .ins-tag {
  font-size: 0.6rem;
  padding: 1px 8px;
}
.ins-card-featured .ins-body {
  padding: 18px 20px;
}
.ins-tag {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 50px;
  background: var(--sky-light);
  color: #4a90aa;
  border: 1.5px solid var(--sky);
}
.ins-title {
  font-weight: 800;
  font-size: 1rem;
  margin: 8px 0 4px;
  line-height: 1.35;
}
.ins-card-featured .ins-title {
  font-size: 1.35rem;
  margin: 10px 0 6px;
}
.ins-meta {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-top: auto;
}
.ins-card-featured .ins-meta {
  font-size: 0.8rem;
}
/* Danh sách dạng dòng kiểu báo chí: ảnh nhỏ vuông bên trái, tiêu đề + meta bên phải — luôn
   nằm ngang ở mọi kích thước màn hình (khác .ins-card-side chỉ nằm ngang khi màn hẹp). */
.ins-card-row {
  flex-direction: row;
  align-items: center;
  gap: 18px;
  padding: 10px 0;
  border-radius: 0;
  box-shadow: none;
  border-left: none;
  border-right: none;
  border-top: 1.5px solid var(--kraft-light);
  border-bottom: 1.5px solid var(--kraft-light);
}
.ins-card-row:hover {
  transform: none;
  background: var(--cream);
}
.ins-card-row .ins-cover {
  flex: none;
  width: 128px;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
}
.ins-card-row .ins-cover-fallback {
  font-size: 2.2rem;
}
.ins-card-row .ins-body {
  padding: 16px 20px 16px 0;
  min-width: 0;
}
.ins-card-row .ins-title {
  font-size: 1.15rem;
  margin: 0 0 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ins-card-row .ins-meta {
  font-size: 0.85rem;
}
.ins-card-row .ins-excerpt {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 6px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (max-width: 600px) {
  .ins-card-row .ins-cover {
    width: 84px;
  }
  .ins-card-row .ins-title {
    font-size: 0.95rem;
  }
  .ins-card-row .ins-meta {
    font-size: 0.75rem;
  }
}

/* Headline thuần chữ (không ảnh) — dùng cạnh khối ảnh nổi bật, giống danh sách tiêu đề bên
   phải ảnh hero trên trang báo. */
.ins-card-headline {
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 0;
}
.ins-card-headline:hover .ins-title {
  color: var(--mint-dark);
}
.ins-card-headline .ins-body {
  padding: 10px 0;
  border-bottom: 1px dashed var(--kraft-light);
}
.ins-card-headline:last-child .ins-body {
  border-bottom: none;
}
.ins-card-headline .ins-title {
  font-size: 1.25rem;
  line-height: 1.35;
  font-weight: 700;
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: var(--transition);
}
.ins-card-headline .ins-meta {
  font-size: 0.85rem;
}

/* Danh sách sidebar (cột hẹp): KHÔNG bọc khung/thẻ riêng từng bài — chỉ ngăn cách bằng 1
   gạch ngang, ảnh thu nhỏ lại để còn đủ chỗ cho chữ trong cột hẹp. */
.ins-card-sidebar-row {
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  border-bottom: 1px solid var(--kraft-light);
  padding-bottom: 14px;
  margin-bottom: 14px;
}
.ins-card-sidebar-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.ins-card-sidebar-row:hover {
  transform: none;
}
.ins-card-sidebar-row:hover .ins-title {
  color: var(--mint-dark);
}
.ins-card-sidebar-row .ins-cover {
  flex: none;
  width: 120px;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
}
.ins-card-sidebar-row .ins-cover-fallback {
  font-size: 1.8rem;
}
.ins-card-sidebar-row .ins-body {
  padding: 0;
  min-width: 0;
}
.ins-card-sidebar-row .ins-title {
  font-size: 1rem;
  margin: 0 0 5px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: var(--transition);
}
.ins-card-sidebar-row .ins-meta {
  font-size: 0.74rem;
}

/* Bài dẫn đầu của hero/mỗi mục danh mục: chữ (tiêu đề + mô tả) bên trái, ảnh to bên phải —
   dùng flex-direction: row-reverse để giữ nguyên thứ tự DOM (ảnh trước, chữ sau) mà vẫn
   đảo chiều hiển thị, không phải sửa lại template riêng cho biến thể này. */
.ins-card-featured-side {
  flex-direction: row-reverse;
  align-items: stretch;
  gap: 24px;
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}
.ins-card-featured-side:hover {
  transform: none;
}
.ins-card-featured-side .ins-cover {
  /* Bằng đúng chiều rộng 2 trong 3 card của .ins-thumb-grid bên dưới (tỉ lệ 2:1 so với phần
     chữ). */
  flex: 2 1 0;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
}
.ins-card-featured-side .ins-cover-fallback {
  font-size: 3rem;
}
.ins-card-featured-side .ins-body {
  flex: 1 1 0;
  min-width: 0;
  padding: 4px 0;
  justify-content: flex-start;
}
.ins-card-featured-side .ins-title {
  font-size: 1.5rem;
  line-height: 1.3;
  margin: 10px 0 8px;
}
/* .ins-meta gốc có margin-top:auto (để đẩy xuống đáy card ảnh-trên-chữ-dưới của biến thể
   grid mặc định) — ở đây chữ xếp dọc theo cột riêng, giữ margin-top:auto sẽ đẩy meta+excerpt
   xuống tít đáy, để hở khoảng trắng rất to ngay dưới tiêu đề. Bỏ lại về sát tiêu đề. */
.ins-card-featured-side .ins-meta {
  margin-top: 0;
}
.ins-card-featured-side .ins-excerpt {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (max-width: 700px) {
  .ins-card-featured-side {
    flex-direction: column;
    overflow: visible;
  }
  .ins-card-featured-side .ins-cover {
    /* Màn hẹp đổi sang cột dọc -> flex:2 1 0 (dành cho lúc nằm NGANG cạnh phần chữ) tính theo
       trục dọc luôn, kết hợp overflow:hidden ở .ins-card làm ảnh collapse gần về 0 chiều cao
       (mất hẳn ảnh) — lỗi giống hệt từng gặp ở .ins-hero-row trên mobile. Trả về kích thước
       tự nhiên theo aspect-ratio, không ép theo flex-basis:0 nữa. */
    flex: none;
    aspect-ratio: 16 / 9;
    /* Tràn lề ra sát mép màn hình — bù lại đúng phần padding 28px của <main> (page cha). */
    margin: 0 -28px;
    border-radius: 0;
    width: calc(100% + 56px);
  }
}

@media (max-width: 700px) {
  .ins-cover-featured {
    aspect-ratio: 16 / 9;
  }
  /* .ins-hero-row đổi sang cột dọc trên mobile -> flex:2 1 0 (dành riêng cho lúc nằm NGANG
     cạnh cột 3 card nhỏ) hết tác dụng đúng, còn khiến card này collapse gần về 0 chiều cao
     (basis 0 + overflow:hidden làm mất luôn mốc tối thiểu theo nội dung) — reset lại. */
  .ins-card-featured {
    flex: none;
  }
  /* Không còn bị ép chia đều theo chiều cao card nổi bật ở màn hẹp (xem InspireView.vue)
     -> quay về ảnh thumbnail vuông nhỏ NẰM NGANG cạnh chữ, tự cao theo nội dung, an toàn
     với mọi chiều rộng màn hình. */
  .ins-card-side {
    flex-direction: row;
    align-items: stretch;
  }
  .ins-card-side .ins-cover {
    flex: none;
    width: 84px;
    aspect-ratio: 1 / 1;
  }
  .ins-card-side .ins-body {
    flex: 1 1 auto;
    justify-content: center;
  }
}
</style>
