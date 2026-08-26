<template>
  <div class="expert-status-banner" :class="{ show: !!message, [type]: !!message }">{{ message }}</div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }
});
</script>
