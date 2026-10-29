<template>
  <svg viewBox="0 0 24 24" class="test-icon" aria-hidden="true">
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<script setup>
import { computed } from 'vue';

// Icon nét đơn sắc (stroke = currentColor) cho thẻ bài test — thay emoji nhiều màu để đồng bộ
// với trang tổng quan. Bài không có trong bảng (bài tự tạo từ admin) dùng icon "phiếu" mặc định.
const props = defineProps({ name: { type: String, default: '' } });

const ICONS = {
  chart: ['M4 20h16', 'M7 16v-5', 'M12 16V6', 'M17 16v-8'],
  wave: ['M3 12h3l2-5 3 10 3-8 2 3h5'],
  brain: ['M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1.7V5.7A2 2 0 0 0 9 4z', 'M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1.7'],
  rain: ['M7 15a4 4 0 1 1 1.2-7.8A5 5 0 0 1 17.5 9 3 3 0 0 1 17 15z', 'M9 18l-1 2', 'M13 18l-1 2', 'M17 18l-1 2'],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  gauge: ['M4 16a8 8 0 1 1 16 0', 'M12 16l4-5', 'M12 16h.01'],
  people: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M3 20a6 6 0 0 1 12 0', 'M16 5.5a3 3 0 0 1 0 5.5', 'M18 14a5 5 0 0 1 3 6'],
  memory: ['M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z'],
  phone: ['M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M11 18h2'],
  glass: ['M7 3h10l-1 7a4 4 0 0 1-8 0z', 'M12 14v6', 'M8.5 20h7'],
  puzzle: ['M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v3H5v-3a2 2 0 1 0 0-4z'],
  school: ['M3 9l9-5 9 5-9 5z', 'M7 11.2V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.8', 'M21 9v5'],
  clipboard: ['M9 4h6v3H9z', 'M15 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2', 'M9 12h6', 'M9 16h4'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
  alert: ['M12 4L2.5 20h19z', 'M12 10v4', 'M12 17h.01'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1']
};
const BY_TEST = {
  dass21: 'chart', gad7: 'wave', hars: 'brain', phq9: 'rain', bdi: 'rain', psqi: 'moon', isi: 'moon',
  pss: 'gauge', sdq25: 'people', mmse: 'memory', iat: 'phone', audit: 'glass', raven: 'puzzle', screening: 'school'
};
const paths = computed(() => ICONS[props.name] || ICONS[BY_TEST[props.name]] || ICONS.clipboard);
</script>

<style scoped>
.test-icon { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
