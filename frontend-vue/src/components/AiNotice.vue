<template>
  <p class="ai-notice">
    {{ t(consent ? 'aiNotice.consent' : 'aiNotice.text') }}
    <a href="/privacy-policy.html#xu-ly-ai" target="_blank" rel="noopener">{{ t('aiNotice.link') }}</a>
  </p>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

// Thông báo xử lý dữ liệu tự động bằng AI (Điều 10 Nghị định 356/2025/NĐ-CP), trỏ tới
// Mục 3 của chính sách bảo mật. consent = bản dài, đặt trước khi người dùng bắt đầu dùng app.
defineProps({ consent: { type: Boolean, default: false } });
const { t } = useI18n();
</script>

<style scoped>
.ai-notice { margin: 0; font-size: 12px; line-height: 1.55; color: var(--color-text-muted, var(--text-secondary)); }
.ai-notice a { color: var(--color-brand, inherit); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; white-space: nowrap; }
</style>
