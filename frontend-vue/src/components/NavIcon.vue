<template>
  <svg viewBox="0 0 24 24" class="nav-icon" aria-hidden="true">
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<script setup>
import { computed } from 'vue';

// Icon nét đơn sắc (stroke = currentColor) cho menu sidebar — thay emoji nhiều màu để đồng bộ
// với trang tổng quan. Tên không có trong bảng thì vẽ chấm tròn nhỏ.
const props = defineProps({ name: { type: String, default: '' } });

const ICONS = {
  dashboard: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5', 'M10 20v-5h4v5'],
  mood: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8.5 14.5a4.5 4.5 0 0 0 7 0', 'M9 9.5h.01', 'M15 9.5h.01'],
  tests: ['M9 4h6v3H9z', 'M15 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2', 'M9 12h6', 'M9 16h4'],
  tasks: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 12h.01'],
  journal: ['M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z', 'M5 18a2 2 0 0 1 2-2h11', 'M9 8h5'],
  experts: ['M6 3v5a4 4 0 0 0 8 0V3', 'M10 12v3a5 5 0 0 0 10 0v-2', 'M20 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  messages: ['M4 5h16v11H9l-5 4z', 'M8 10h8', 'M8 13h5'],
  community: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M3 20a6 6 0 0 1 12 0', 'M16 5.5a3 3 0 0 1 0 5.5', 'M18 14a5 5 0 0 1 3 6'],
  inspire: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  report: ['M4 20h16', 'M7 16v-5', 'M12 16V6', 'M17 16v-8'],
  achievements: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M8.5 14l-1.5 7 5-3 5 3-1.5-7'],
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
  expert: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0', 'M12 15v4', 'M10 17h4'],
  admin: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'],
  logout: ['M15 4h4v16h-4', 'M10 8l-4 4 4 4', 'M6 12h10'],
  login: ['M9 4H5v16h4', 'M14 8l4 4-4 4', 'M18 12H8'],
  lifebuoy: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M5.6 5.6l3.6 3.6', 'M14.8 14.8l3.6 3.6', 'M18.4 5.6l-3.6 3.6', 'M9.2 14.8l-3.6 3.6'],
  wallet: ['M4 7a2 2 0 0 1 2-2h11v4', 'M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z', 'M16 14.5h.01'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  send: ['M21 3L10 14', 'M21 3l-7 18-4-7-7-4z'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
  compass: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M15.5 8.5l-2 5-5 2 2-5z'],
  video: ['M3 7h12v10H3z', 'M15 10.5l6-3.5v10l-6-3.5'],
  more: ['M12 5.5h.01', 'M12 12h.01', 'M12 18.5h.01'],
  card: ['M3 6h18v12H3z', 'M3 10h18', 'M7 15h3'],
  star: ['M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'],
  play: ['M7 4.5v15l12-7.5z'],
  heart: ['M12 20s-7-4.4-9-8.6C1.6 8.3 3.6 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.2 0 5.2 3.3 3.8 6.4C19 15.6 12 20 12 20z'],
  share: ['M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M8.6 13.5l6.8 4', 'M15.4 6.5l-6.8 4'],
  close: ['M6 6l12 12', 'M18 6L6 18']
};
const paths = computed(() => ICONS[props.name] || ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z']);
</script>

<style scoped>
.nav-icon { width: 20px; height: 20px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
