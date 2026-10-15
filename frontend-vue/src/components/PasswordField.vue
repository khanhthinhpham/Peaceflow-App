<template>
  <div class="pwd-field">
    <input
      :type="visible ? 'text' : 'password'"
      class="form-input pwd-field-input"
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    >
    <button
      type="button"
      class="pwd-field-toggle"
      :aria-label="visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
      tabindex="-1"
      @click="visible = !visible"
    >
      <svg v-if="!visible" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// `modelValue` KHÔNG có default — để trống (undefined) thì :value không được set, input
// chạy uncontrolled bình thường (vd 3 ô mật khẩu trong ProfileView hiện chưa gắn v-model).
defineProps({ modelValue: { type: String, default: undefined } });
defineEmits(['update:modelValue']);
defineOptions({ inheritAttrs: false });

const visible = ref(false);
</script>

<style scoped>
.pwd-field {
  position: relative;
}
.pwd-field-input {
  padding-right: 42px;
}
.pwd-field-toggle {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: none;
  background: none;
  padding: 0;
  color: var(--text-light);
  cursor: pointer;
}
.pwd-field-toggle:hover {
  color: var(--text-secondary);
}
</style>
