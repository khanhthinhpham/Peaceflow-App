<template>
  <router-link
    :to="{ name: 'inspire-detail', params: { id: article.id } }"
    class="paper-card ins-card"
    :class="`ins-card-${variant}`"
  >
    <div class="ins-cover" :class="{ 'ins-cover-featured': variant === 'featured' }">
      <img v-if="cover" :src="cover" :alt="article.title" loading="lazy">
      <span v-else class="ins-cover-fallback">📖</span>
    </div>
    <div class="ins-body">
      <span class="ins-tag">{{ article.categoryLabel }}</span>
      <div class="ins-title">{{ article.title }}</div>
      <div v-if="variant !== 'side'" class="ins-meta">{{ metaLine }}</div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  article: { type: Object, required: true },
  cover: { type: String, default: '' },
  variant: { type: String, default: 'grid' }
});

const { locale } = useI18n();

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
@media (max-width: 700px) {
  .ins-cover-featured {
    aspect-ratio: 16 / 9;
  }
}
</style>
