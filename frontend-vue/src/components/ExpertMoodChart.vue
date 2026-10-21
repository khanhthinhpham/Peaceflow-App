<template>
  <div class="expert-mood-chart-wrap">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  checkins: { type: Array, required: true } // [{ id, mood_score, dominant_emotion, created_at, notes }]
});

// Chart.js vẽ trái->phải theo thứ tự mảng — API trả mới nhất trước (xem screenshot: 3/6
// rồi 26/8...), nên phải SẮP XẾP THEO THỜI GIAN TĂNG DẦN trước khi vẽ, nếu không trục thời
// gian sẽ chạy ngược/lộn xộn, nhìn như dao động ngẫu nhiên thay vì 1 xu hướng.
const sorted = computed(() => [...props.checkins].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));

const canvasEl = ref(null);
let chartInstance = null;

function pointColor(score) {
  if (score <= 3) return '#e05c5c';
  if (score <= 6) return '#e0a92d';
  return '#4caf7d';
}

function render() {
  if (!canvasEl.value) return;
  if (chartInstance) chartInstance.destroy();

  const labels = sorted.value.map((m) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(m.created_at)));
  const values = sorted.value.map((m) => m.mood_score);
  const colors = sorted.value.map((m) => pointColor(m.mood_score));

  chartInstance = new Chart(canvasEl.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#4a9e8e',
        backgroundColor: 'rgba(74, 158, 142, 0.12)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const m = sorted.value[ctx.dataIndex];
              return `${m.mood_score}/10${m.dominant_emotion ? ` — ${m.dominant_emotion}` : ''}`;
            }
          }
        }
      },
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 2, precision: 0 } },
        x: { ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 12 } }
      }
    }
  });
}

onMounted(render);
watch(() => props.checkins, render, { deep: true });
onBeforeUnmount(() => chartInstance?.destroy());
</script>

<style scoped>
.expert-mood-chart-wrap {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: 18px;
}
</style>
