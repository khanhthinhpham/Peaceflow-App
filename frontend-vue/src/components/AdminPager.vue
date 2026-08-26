<template>
  <div v-if="totalPages > 1" class="admin-pager">
    <button type="button" class="admin-page-btn" :disabled="page === 0" title="Trang đầu" @click="$emit('go', 0)">« Đầu</button>
    <button type="button" class="admin-page-btn" :disabled="page === 0" @click="$emit('go', page - 1)">‹ Trước</button>
    <template v-for="(p, idx) in windowPages" :key="idx">
      <span v-if="p === '…'" class="admin-page-ellipsis">…</span>
      <button v-else type="button" class="admin-page-btn" :class="{ active: p === page }" @click="$emit('go', p)">{{ p + 1 }}</button>
    </template>
    <button type="button" class="admin-page-btn" :disabled="page >= totalPages - 1" @click="$emit('go', page + 1)">Sau ›</button>
    <button type="button" class="admin-page-btn" :disabled="page >= totalPages - 1" title="Trang cuối" @click="$emit('go', totalPages - 1)">Cuối »</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true }
});
defineEmits(['go']);

function pageWindow(current, total) {
  const pages = new Set([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const out = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

const windowPages = computed(() => pageWindow(props.page, props.totalPages));
</script>
