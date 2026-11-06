<template>
  <!-- Avatar người dùng dùng chung: ảnh thật (tự tải lên R2 / ảnh Google) hoặc biểu tượng (emoji:🐱).
       Đặt bên trong khung avatar có sẵn của từng màn (khung lo kích thước, nền, bo tròn). -->
  <img
    v-if="photo && !failed"
    :src="photo"
    alt=""
    class="ua-img"
    referrerpolicy="no-referrer"
    loading="lazy"
    @error="failed = true"
  >
  <template v-else>{{ text }}</template>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { avatarPhotoUrl, avatarEmojiOf } from '../lib/avatar';

const props = defineProps({
  // users.avatar_url ('emoji:🐱' | 'https://…') hoặc một biểu tượng thuần ('🌿')
  value: { type: String, default: '' },
  // chữ hiện khi không có ảnh/biểu tượng (vd chữ cái đầu tên)
  fallback: { type: String, default: '🐱' },
  // 'sm' = bản 96px cho avatar nhỏ (danh sách, bình luận); 'md' = 256px
  size: { type: String, default: 'sm' }
});

const failed = ref(false);
watch(() => props.value, () => { failed.value = false; });
const photo = computed(() => avatarPhotoUrl(props.value, props.size));
const text = computed(() => {
  const v = props.value || '';
  if (v.startsWith('emoji:')) return avatarEmojiOf(v, props.fallback);
  if (v && !/^https?:\/\//i.test(v)) return v; // biểu tượng thuần
  return props.fallback;
});
</script>

<style scoped>
.ua-img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block; }
</style>
