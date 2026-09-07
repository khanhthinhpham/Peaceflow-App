import { createApp, watch } from 'vue';
import { createPinia } from 'pinia';
import './assets/style.css';
import App from './App.vue';
import router from './router';
import { initNativeApp } from './lib/native';
import { i18n } from './locales';

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app');
initNativeApp(router);

// index.html hardcode <html lang="vi">, tự cập nhật theo ngôn ngữ đang chọn để đúng chuẩn
// accessibility/SEO (attribute lang) — chạy ngay lúc khởi động và mỗi khi đổi ngôn ngữ.
watch(i18n.global.locale, (value) => { document.documentElement.lang = value; }, { immediate: true });
