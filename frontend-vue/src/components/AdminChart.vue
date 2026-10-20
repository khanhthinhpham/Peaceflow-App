<template>
  <div class="admin-chart-wrap" :style="{ height: height + 'px' }">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  type: { type: String, required: true }, // 'bar' | 'pie' | 'line'
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  colors: { type: Array, default: () => [] },
  height: { type: Number, default: 220 }
});

const canvasEl = ref(null);
let chartInstance = null;

const PALETTE = ['#4a9e8e', '#e0955a', '#8a6aaa', '#4a90aa', '#e05c5c', '#e0a92d', '#4caf7d', '#b9b2a4'];

function buildConfig() {
  const colors = props.colors.length ? props.colors : props.labels.map((_, i) => PALETTE[i % PALETTE.length]);
  const isPie = props.type === 'pie';
  return {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [{
        data: props.values,
        backgroundColor: isPie ? colors : colors[0] || PALETTE[0],
        borderRadius: isPie ? 0 : 4,
        borderWidth: isPie ? 2 : 0,
        borderColor: isPie ? '#fffdf7' : undefined
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: props.type === 'bar' ? 'y' : undefined,
      plugins: {
        legend: { display: isPie, position: 'right', labels: { font: { size: 11 } } },
        tooltip: { enabled: true }
      },
      scales: isPie ? undefined : {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { ticks: { font: { size: 11 } } }
      }
    }
  };
}

function render() {
  if (!canvasEl.value) return;
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvasEl.value, buildConfig());
}

onMounted(render);
watch(() => [props.type, props.labels, props.values], render, { deep: true });
onBeforeUnmount(() => chartInstance?.destroy());

defineExpose({
  getImage: () => chartInstance?.toBase64Image('image/png', 1) || null
});
</script>

<style scoped>
.admin-chart-wrap {
  position: relative;
  width: 100%;
}
</style>
