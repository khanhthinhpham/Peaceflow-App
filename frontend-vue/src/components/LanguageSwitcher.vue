<template>
  <div class="lang-switcher" role="group" aria-label="Language">
    <button
      type="button"
      class="lang-btn"
      :class="{ active: locale === 'vi' }"
      @click="chooseLocale('vi')"
    >
      <svg class="lang-flag" viewBox="0 0 60 40" aria-hidden="true">
        <rect width="60" height="40" fill="#DA251D"/>
        <polygon fill="#FFFF00" points="30,8 32.7,16.28 41.42,16.3 34.38,21.42 37.06,29.7 30,24.6 22.94,29.7 25.62,21.42 18.58,16.3 27.3,16.28"/>
      </svg>
      Tiếng Việt
    </button>
    <button
      type="button"
      class="lang-btn"
      :class="{ active: locale === 'en' }"
      @click="chooseLocale('en')"
    >
      <svg class="lang-flag" viewBox="0 0 60 40" aria-hidden="true">
        <rect width="60" height="40" fill="#00247D"/>
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/>
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#CF142B" stroke-width="3.2"/>
        <path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="13"/>
        <path d="M30,0 V40 M0,20 H60" stroke="#CF142B" stroke-width="7.8"/>
      </svg>
      English
    </button>
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
  // Xoá SWR cache (apiClient.js, TTL "fresh" 30s) ngay khi đổi ngôn ngữ — nếu không, dữ liệu
  // đã fetch gần đây (vd /notifications) vẫn được trả nguyên bản CŨ theo locale trước đó
  // trong tối đa 30s tiếp theo, vì cache key không tính tới locale. Ảnh hưởng mọi GET đã
  // cache trên toàn app (không riêng gì trang đang mở component này).
  apiClient.clearCache();
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
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 2px solid var(--kraft-light, #d9c9a8);
  border-radius: 999px;
  background: #fff;
  padding: 6px 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-secondary, #7a6555);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.lang-flag {
  width: 20px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}
.lang-btn.active {
  background: var(--mint, #A8D5BA);
  border-color: var(--mint-dark, #7BBF95);
  color: var(--text-primary, #2d1f14);
}
</style>
