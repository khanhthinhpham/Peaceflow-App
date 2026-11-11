<template>
  <main class="nf">
    <div class="nf-card">
      <!-- PeaceCat: chạm để nghe "rừ rừ" + tim bay lên (chi tiết nhỏ cho người lạc đường mỉm cười) -->
      <button type="button" class="nf-cat" :class="{ purring }" :aria-label="t('notFound.petCat')" @click="pet">
        <NavIcon name="peacecat" />
        <span v-for="h in hearts" :key="h.id" class="nf-heart" :style="{ '--dx': h.dx + 'px' }" aria-hidden="true">♥</span>
      </button>
      <p class="nf-code">404</p>
      <h1 class="nf-title">{{ t('notFound.title') }}</h1>
      <p class="nf-text">{{ purrCount >= 3 ? t('notFound.textPetted') : t('notFound.text') }}</p>

      <!-- Nhân lúc lạc đường: hít thở cùng một nhịp -->
      <div class="nf-breath" aria-hidden="true"><span></span></div>
      <p class="nf-breath-label">{{ t('notFound.breathe') }}</p>

      <div class="nf-actions">
        <router-link :to="homePath" class="nf-btn nf-btn-primary">{{ t('notFound.home') }}</router-link>
        <button type="button" class="nf-btn" @click="goBack">{{ t('notFound.back') }}</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import NavIcon from '../components/NavIcon.vue';
import { useAuthStore } from '../stores/auth';
import { uiPurr } from '../lib/uiSound';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const homePath = computed(() => (auth.isAuthenticated ? '/dashboard' : '/'));

const purring = ref(false);
const purrCount = ref(0);
const hearts = ref([]);
let heartId = 0;
function pet() {
  uiPurr();
  purrCount.value += 1;
  purring.value = true;
  setTimeout(() => { purring.value = false; }, 600);
  const id = ++heartId;
  hearts.value.push({ id, dx: Math.round(Math.random() * 40 - 20) });
  setTimeout(() => { hearts.value = hearts.value.filter((h) => h.id !== id); }, 1200);
}
function goBack() {
  if (window.history.length > 1) router.back();
  else router.push(homePath.value);
}
</script>

<style scoped>
.nf { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom)); background: var(--color-canvas); font-family: var(--font-body); }
.nf-card { width: 100%; max-width: 440px; padding: 36px 28px 28px; border-radius: 24px; background: var(--color-surface); box-shadow: 0 10px 32px rgba(80, 70, 50, 0.1); text-align: center; }
.nf-cat { position: relative; width: 88px; height: 88px; margin: 0 auto; border: none; border-radius: 50%; background: #E4ECDD; color: #6F8F5E; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.nf-cat .nav-icon { width: 46px; height: 46px; }
.nf-cat.purring { animation: nf-purr 0.6s ease; }
@keyframes nf-purr { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
.nf-heart { position: absolute; left: 50%; top: 4px; color: #D9827A; font-size: 18px; pointer-events: none; animation: nf-heart 1.2s ease-out forwards; }
@keyframes nf-heart { from { opacity: 1; transform: translate(-50%, 0) scale(0.8); } to { opacity: 0; transform: translate(calc(-50% + var(--dx)), -70px) scale(1.2); } }
.nf-code { margin: 18px 0 0; font-family: var(--font-heading); font-size: 13px; font-weight: 800; letter-spacing: 0.2em; color: var(--color-text-subtle); }
.nf-title { margin: 6px 0 0; font-family: var(--font-heading); font-size: 24px; font-weight: 800; line-height: 1.3; color: var(--color-text); }
.nf-text { margin: 10px auto 0; max-width: 340px; font-size: 15px; line-height: 1.6; color: var(--color-text-muted); }
.nf-breath { width: 64px; height: 64px; margin: 24px auto 0; display: flex; align-items: center; justify-content: center; }
.nf-breath span { width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(159, 197, 125, 0.55), rgba(111, 143, 94, 0.2)); animation: nf-breath 10s ease-in-out infinite; }
@keyframes nf-breath { 0%, 100% { transform: scale(0.55); } 40%, 50% { transform: scale(1); } }
.nf-breath-label { margin: 8px 0 0; font-size: 13px; color: var(--color-text-subtle); }
.nf-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 24px; }
.nf-btn { min-height: 44px; padding: 0 20px; border: none; border-radius: 999px; background: var(--color-canvas); color: var(--color-text); font: 600 14px var(--font-body); text-decoration: none; display: inline-flex; align-items: center; cursor: pointer; }
.nf-btn:hover { background: #E4ECDD; color: #6F8F5E; }
.nf-btn-primary { background: #6F8F5E; color: #fff; }
.nf-btn-primary:hover { background: #6F8F5E; color: #fff; filter: brightness(0.94); }
@media (prefers-reduced-motion: reduce) { .nf-breath span, .nf-cat.purring, .nf-heart { animation: none; } }
</style>
