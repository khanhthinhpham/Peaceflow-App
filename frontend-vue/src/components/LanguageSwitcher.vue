<template>
  <div class="lang-switcher" role="group" aria-label="Language">
    <button
      type="button"
      class="lang-btn"
      :class="{ active: locale === 'vi' }"
      @click="chooseLocale('vi')"
    >🇻🇳 Tiếng Việt</button>
    <button
      type="button"
      class="lang-btn"
      :class="{ active: locale === 'en' }"
      @click="chooseLocale('en')"
    >🇬🇧 English</button>
  </div>
</template>

<script setup>
// Component dùng chung, tự mang style riêng (không phụ thuộc CSS của trang chứa nó) — gắn
// được ở bất cứ đâu: Login/Signup (trước khi có tài khoản) và Settings (sau khi đăng nhập).
// `locale` từ useI18n() không truyền `useScope` -> mặc định dùng chung global scope (đúng
// cái main.js cài qua app.use(i18n)), nên đổi ở đây phản ánh ngay lập tức trên toàn app,
// không cần props/emit qua lại.
import { useI18n } from 'vue-i18n';
import { setExplicitLocale } from '../locales';
import { apiClient } from '../lib/apiClient';

const { locale } = useI18n();

function chooseLocale(value) {
  setExplicitLocale(value);
  // Lưu bền lựa chọn vào users.locale (best-effort, không chặn UI) — cần cho email/push
  // gửi từ webhook/cron sau này, lúc đó không còn request nào của user để đọc x-locale.
  // Bỏ qua lỗi lặng lẽ: hay gặp nhất là chưa đăng nhập (nút này cũng dùng ở trang Login).
  apiClient.patch('/me/locale', { locale: value }).catch(() => {});
}
</script>

<style scoped>
.lang-switcher {
  display: inline-flex;
  gap: 8px;
}
.lang-btn {
  border: 2px solid var(--kraft-light, #d9c9a8);
  border-radius: 999px;
  background: #fff;
  padding: 8px 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-secondary, #7a6555);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.lang-btn.active {
  background: var(--mint, #A8D5BA);
  border-color: var(--mint-dark, #7BBF95);
  color: var(--text-primary, #2d1f14);
}
</style>
