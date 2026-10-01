<template>
  <nav class="bottom-nav">
    <!-- Toàn bộ viền trên của thanh (đoạn thẳng 2 bên + đường cong ở giữa) vẽ bằng DUY NHẤT
         1 svg, không còn CSS border riêng — tránh việc 2 hệ vẽ khác nhau (border thật vs svg
         riêng) bị trình duyệt rasterize lệch nhau vài pixel như cách cũ. viewBox rộng 100 đơn
         vị + preserveAspectRatio="none" để tự giãn khớp đúng chiều rộng thanh thật. -->
    <svg class="bn-border-svg" viewBox="0 0 100 44" preserveAspectRatio="none">
      <path class="bn-border-fill" :d="fillPath" />
      <path class="bn-border-stroke" :d="strokePath" vector-effect="non-scaling-stroke" />
    </svg>

    <router-link
      v-for="item in NAV_ITEMS"
      :key="item.key"
      :to="{ name: item.route }"
      class="bn-item"
      :class="{ active: activeKey === item.key }"
    >
      <span class="bn-icon-static">{{ item.icon }}</span>
      <span class="bn-label">{{ t(item.labelKey) }}</span>
    </router-link>

    <!-- Vòng tròn icon nổi — dùng CHUNG 1 giá trị animatedPercent với đường cong (SVG ở trên)
         nên luôn trượt y hệt nhau theo từng khung hình, không bao giờ lệch nhịp. -->
    <div v-if="activeIndex > -1" class="bn-floating-circle" :style="{ left: animatedPercent + '%' }">
      <span class="bn-floating-icon">{{ activeItem?.icon }}</span>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

// Đồng bộ đúng 5 mục "CHÍNH" của Sidebar.vue (cùng route/navKey) — bottom nav chỉ là
// lối tắt nhanh cho các tính năng dùng hằng ngày, sidebar/drawer vẫn giữ đủ mọi mục.
const NAV_ITEMS = [
  { key: 'mood', icon: '💭', labelKey: 'nav.mood', route: 'mood-checkin' },
  { key: 'tests', icon: '📋', labelKey: 'nav.tests', route: 'mood-assessment' },
  { key: 'dashboard', icon: '🏡', labelKey: 'nav.dashboard', route: 'dashboard' },
  { key: 'tasks', icon: '🎮', labelKey: 'nav.tasks', route: 'tasks' },
  { key: 'journal', icon: '📝', labelKey: 'nav.journal', route: 'journal' }
];
const NOTCH_HALF_WIDTH = 19; // % chiều rộng thanh — độ rộng nửa đường cong mỗi bên

const { t } = useI18n();
const route = useRoute();
const activeKey = computed(() => route.meta?.navKey || null);
const activeIndex = computed(() => NAV_ITEMS.findIndex((item) => item.key === activeKey.value));
const activeItem = computed(() => NAV_ITEMS[activeIndex.value] || null);
const targetPercent = computed(() => (
  activeIndex.value > -1 ? ((activeIndex.value + 0.5) / NAV_ITEMS.length) * 100 : null
));

// Tự animate bằng requestAnimationFrame thay vì CSS transition trên "left" — vì đường cong
// (path "d" của svg) không thể CSS-transition được, nên cả vòng tròn lẫn đường cong đều lấy
// vị trí từ CHUNG 1 giá trị animatedPercent này mỗi khung hình, đảm bảo luôn khớp tuyệt đối.
const animatedPercent = ref(targetPercent.value ?? 50);
let rafId = null;
function animateTo(target) {
  const start = animatedPercent.value;
  const duration = 400;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    animatedPercent.value = start + (target - start) * eased;
    if (t < 1) rafId = requestAnimationFrame(step);
  }
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(step);
}
watch(targetPercent, (val) => {
  if (val != null) animateTo(val);
});
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
});

function buildBorderPaths(centerPercent) {
  if (centerPercent == null) {
    return { fillPath: '', strokePath: 'M0,42 L100,42' };
  }
  const left = centerPercent - NOTCH_HALF_WIDTH;
  const right = centerPercent + NOTCH_HALF_WIDTH;
  const ctrl = NOTCH_HALF_WIDTH / 2;
  const bump = `${left + ctrl},42 ${left + ctrl},2 ${centerPercent},2 S${right - ctrl},42 ${right},42`;
  return {
    fillPath: `M${left},44 L${left},42 C${bump} L${right},44 Z`,
    strokePath: `M0,42 L${left},42 C${bump} L100,42`
  };
}
const paths = computed(() => buildBorderPaths(animatedPercent.value));
const fillPath = computed(() => paths.value.fillPath);
const strokePath = computed(() => paths.value.strokePath);
</script>

<style scoped>
.bottom-nav {
  display: none;
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: var(--warm-white);
  z-index: 300;
  align-items: stretch;
  justify-content: space-around;
  /* Android 15+ edge-to-edge: chừa vùng thanh điều hướng hệ thống. Trên web = 0px. */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.bn-border-svg {
  position: absolute;
  top: -42px;
  left: 0;
  width: 100%;
  height: 44px;
  display: block;
  max-width: none;
  pointer-events: none;
}
.bn-border-fill {
  fill: var(--warm-white);
}
.bn-border-stroke {
  fill: none;
  stroke: var(--kraft-light);
  stroke-width: 2;
}
.bn-item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-light);
  transition: color 0.3s ease, opacity 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  padding: 6px 4px;
}
.bn-icon-static {
  font-size: 1.1rem;
  line-height: 1;
}
.bn-label {
  font-size: 0.6rem;
  font-weight: 700;
}
.bn-item.active {
  color: var(--mint-dark);
}
/* Icon riêng của tab đang active bị vòng tròn nổi che mất rồi (hiện icon to hơn ở trên) —
   ẩn icon nhỏ gốc đi, chỉ còn label, tránh hiện 2 icon chồng nhau. */
.bn-item.active .bn-icon-static {
  opacity: 0;
}
.bn-floating-circle {
  position: absolute;
  top: -30px;
  transform: translateX(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--mint-dark);
  box-shadow: 0 6px 14px rgba(74, 163, 120, 0.45), 0 0 0 4px var(--warm-white);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
}
.bn-floating-icon {
  font-size: 1.65rem;
  line-height: 1;
}
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .bottom-nav { display: flex; }
}
</style>
