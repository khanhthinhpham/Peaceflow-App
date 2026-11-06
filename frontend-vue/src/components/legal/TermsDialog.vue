<template>
  <Teleport to="body">
    <div class="lg-dialog-overlay" @click.self="$emit('close')" @keydown.esc="$emit('close')">
      <div class="lg-dialog" role="dialog" aria-modal="true" :aria-label="t('legal.pageTitle')">
        <div class="lg-dialog-head">
          <strong>{{ t('legal.termsName') }}</strong>
          <button ref="closeBtn" type="button" class="lg-dialog-x" :aria-label="t('legal.close')" @click="$emit('close')">✕</button>
        </div>
        <div class="lg-dialog-body">
          <TermsContent :article="article" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Xem toàn văn điều khoản ngay tại chỗ — không rời trang (giữ nguyên form đăng ký / đặt lịch đang điền dở).
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import TermsContent from './TermsContent.vue';
import '../../assets/legal.css';

defineProps({ article: { type: Number, default: null } });
defineEmits(['close']);
const { t } = useI18n();
const closeBtn = ref(null);
onMounted(() => closeBtn.value?.focus());
</script>
