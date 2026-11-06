<template>
  <div class="lg-page">
    <div class="lg-page-inner">
      <div class="lg-page-nav">
        <button type="button" class="lg-btn" @click="goBack">← {{ t('legal.back') }}</button>
      </div>
      <div class="lg-page-card">
        <TermsContent :article="initialArticle" />
      </div>
    </div>
  </div>
</template>

<script setup>
// Trang công khai /dieu-khoan — ai cũng xem được, kể cả chưa đăng nhập. /dieu-khoan#dieu-7 mở thẳng Điều 7.
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import TermsContent from '../components/legal/TermsContent.vue';
import '../assets/legal.css';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const initialArticle = computed(() => {
  const m = /^#dieu-(\d+)$/.exec(route.hash || '');
  return m ? Number(m[1]) : null;
});
function goBack() {
  if (window.history.length > 1) router.back();
  else router.push('/');
}
</script>
