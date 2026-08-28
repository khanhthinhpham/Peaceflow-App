import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/style.css';
import App from './App.vue';
import router from './router';
import { initNativeApp } from './lib/native';

createApp(App).use(createPinia()).use(router).mount('#app');
initNativeApp(router);
