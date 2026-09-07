import { createApp, watch } from 'vue';
import { createPinia } from 'pinia';
import './assets/style.css';
import App from './App.vue';
import router from './router';
import { initNativeApp } from './lib/native';
import { i18n, setSuggestedLocale, shouldSuggestLocaleFromIp } from './locales';
import { apiClient } from './lib/apiClient';

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app');
initNativeApp(router);

// index.html hardcode <html lang="vi">, tự cập nhật theo ngôn ngữ đang chọn để đúng chuẩn
// accessibility/SEO (attribute lang) — chạy ngay lúc khởi động và mỗi khi đổi ngôn ngữ.
watch(i18n.global.locale, (value) => { document.documentElement.lang = value; }, { immediate: true });

// Khách vãng lai (chưa đăng ký/đăng nhập) mở landing page lần đầu: trước đây phải chờ tới
// lúc đăng ký/đăng nhập mới có gợi ý ngôn ngữ theo IP (detectLocale() ở backend), nên trong
// lúc đó trang luôn hiện tiếng Việt kể cả với người nước ngoài. Gọi 1 lần duy nhất ngay lúc
// mở app để họ thấy đúng ngôn ngữ ngay từ landing page — không gọi lại nếu đã có lựa chọn
// hoặc gợi ý nào được lưu trước đó (kể cả khi họ đã đăng ký/đăng nhập rồi).
if (shouldSuggestLocaleFromIp()) {
  apiClient.get('/auth/locale-suggestion')
    .then((data) => { if (data?.locale) setSuggestedLocale(data.locale); })
    .catch(() => {});
}
