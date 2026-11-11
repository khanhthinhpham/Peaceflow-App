<template>
  <!-- Bước 1 của check-in (nhân vật cảm xúc + thanh trượt 0–100) — dùng chung cho thẻ check-in ở Home
       để giống hệt trang Check-in. Bấm "Tiếp tục" → phát 'confirm' kèm giá trị. -->
  <div class="emo-pick">
    <EmotionFigure class="emo-figure" :value="modelValue" />
    <div class="emo-control">
      <input
        :value="modelValue"
        type="range" min="0" max="100" step="1"
        class="emo-range"
        :aria-label="t('moodCheckin.step1.emotion.ariaLabel')"
        :aria-valuetext="label"
        @input="onSlide(Number($event.target.value))"
      >
      <div class="emo-ends" aria-hidden="true">
        <span>{{ t('moodCheckin.step1.emotion.low') }}</span>
        <span>{{ t('moodCheckin.step1.emotion.high') }}</span>
      </div>
    </div>
    <Transition name="emo-label" mode="out-in">
      <p :key="zone.key" class="emo-state">{{ label }}</p>
    </Transition>
    <button type="button" class="btn-primary emo-next" @click="emit('confirm', modelValue)">{{ t('moodCheckin.step1.continueBtn') }}</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import EmotionFigure from './EmotionFigure.vue';
import { emotionZoneOf } from '../lib/moodCheckinOptions';
import { uiTick } from '../lib/uiSound';

const props = defineProps({ modelValue: { type: Number, default: 50 } });
const emit = defineEmits(['update:modelValue', 'confirm']);
const { t } = useI18n();
const zone = computed(() => emotionZoneOf(props.modelValue));
const label = computed(() => t(`moodCheckin.step1.emotion.zones.${zone.value.key}`));
function onSlide(v) {
  const before = zone.value.key;
  emit('update:modelValue', v);
  if (emotionZoneOf(v).key !== before) uiTick(v / 100); // qua vùng cảm xúc mới: nốt cao/thấp theo cảm xúc
}
</script>

<style scoped>
/* Giống hệt bước 1 trang Check-in (MoodCheckinView.vue) */
.emo-pick { --emo-ink: var(--color-brand); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; width: 100%; }
.emo-figure { width: 200px; height: 200px; margin: 4px 0 0; }
.emo-control { width: 100%; max-width: 440px; }
.emo-range { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; margin: 0; background: transparent; cursor: pointer; touch-action: pan-y; }
.emo-range::-webkit-slider-runnable-track { height: 8px; border-radius: 999px; background: var(--color-surface-muted); }
.emo-range::-moz-range-track { height: 8px; border-radius: 999px; background: var(--color-surface-muted); }
.emo-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 30px; height: 30px; margin-top: -11px; border-radius: 50%;
  background: var(--color-surface); border: 3px solid var(--emo-ink); box-shadow: var(--shadow-soft);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.emo-range::-moz-range-thumb {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--color-surface); border: 3px solid var(--emo-ink); box-shadow: var(--shadow-soft);
  transition: transform var(--duration-fast) var(--ease-standard);
}
.emo-range:hover::-webkit-slider-thumb { transform: scale(1.08); }
.emo-range:hover::-moz-range-thumb { transform: scale(1.08); }
.emo-range:active { cursor: grabbing; }
.emo-range:active::-webkit-slider-thumb { transform: scale(1.14); }
.emo-range:active::-moz-range-thumb { transform: scale(1.14); }
.emo-range:focus { outline: none; }
.emo-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--color-brand-soft), var(--shadow-soft); }
.emo-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px var(--color-brand-soft), var(--shadow-soft); }
.emo-ends { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-subtle); margin-top: -4px; }
.emo-state { font-family: var(--font-heading); font-size: 21px; font-weight: 800; color: var(--emo-ink); margin: 6px 0 2px; min-height: 1.4em; }
.emo-label-enter-active, .emo-label-leave-active { transition: opacity 160ms var(--ease-standard), transform 160ms var(--ease-standard); }
.emo-label-enter-from { opacity: 0; transform: translateY(4px); }
.emo-label-leave-to { opacity: 0; transform: translateY(-4px); }
.emo-next { margin-top: 8px; min-width: 160px; }
@media (max-width: 600px) { .emo-figure { width: 160px; height: 160px; } }
@media (prefers-reduced-motion: reduce) { .emo-label-enter-active, .emo-label-leave-active { transition: none; } }
</style>
