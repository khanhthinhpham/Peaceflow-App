<template>
  <svg class="garden-scene-svg" viewBox="0 0 400 220" :preserveAspectRatio="variant === 'hero' ? 'xMaxYMax slice' : 'xMidYMax slice'" aria-hidden="true">
    <defs>
      <linearGradient :id="`gs-sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E7EFEC" />
        <stop offset="1" stop-color="#F7F0E2" />
      </linearGradient>
      <linearGradient :id="`gs-hill-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#A9C98A" />
        <stop offset="1" stop-color="#7FA866" />
      </linearGradient>
      <linearGradient :id="`gs-meadow-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#BFD7A2" />
        <stop offset="1" stop-color="#93B878" />
      </linearGradient>
    </defs>

    <rect v-if="variant !== 'hero'" width="400" height="220" :fill="`url(#gs-sky-${uid})`" />

    <!-- mặt trời + mây -->
    <circle cx="292" cy="58" r="34" fill="#F7E6C1" opacity="0.9" />
    <g fill="#FFFFFF" opacity="0.75">
      <ellipse cx="88" cy="52" rx="34" ry="11" />
      <ellipse cx="112" cy="46" rx="22" ry="10" />
      <ellipse cx="350" cy="96" rx="26" ry="8" />
    </g>

    <!-- núi xa -->
    <path d="M0 150 L60 108 L110 132 L170 96 L232 138 L290 104 L350 130 L400 112 L400 220 L0 220 Z" fill="#C7D2D3" opacity="0.8" />
    <path d="M0 168 Q80 132 160 152 T320 140 T400 150 L400 220 L0 220 Z" fill="#B8CFA4" />

    <!-- đồi chính -->
    <path d="M70 220 Q170 138 280 128 Q350 124 400 146 L400 220 Z" :fill="`url(#gs-hill-${uid})`" />
    <path d="M0 196 Q90 170 190 188 Q260 200 400 186 L400 220 L0 220 Z" :fill="`url(#gs-meadow-${uid})`" />

    <!-- hàng rào -->
    <g stroke="#9A7553" stroke-width="2.4" stroke-linecap="round">
      <path d="M318 142 L318 158 M334 140 L334 157 M350 141 L350 158 M366 143 L366 160 M382 146 L382 162" />
      <path d="M312 147 L388 151 M312 154 L388 157" stroke-width="1.8" />
    </g>

    <!-- cây lớn -->
    <path d="M284 132 Q288 110 284 92 L294 92 Q292 112 300 132 Z" fill="#8A6648" />
    <path d="M287 104 Q276 96 268 98 M291 100 Q302 92 312 94" stroke="#8A6648" stroke-width="3" fill="none" stroke-linecap="round" />
    <g>
      <circle cx="262" cy="86" r="20" fill="#6F9A57" />
      <circle cx="318" cy="84" r="22" fill="#6F9A57" />
      <circle cx="290" cy="64" r="26" fill="#7DAA63" />
      <circle cx="270" cy="66" r="18" fill="#8DB86F" />
      <circle cx="312" cy="62" r="18" fill="#8DB86F" />
      <circle cx="290" cy="86" r="20" fill="#86B26A" />
      <circle cx="292" cy="44" r="15" fill="#9CC57D" />
      <circle cx="248" cy="76" r="12" fill="#86B26A" />
      <circle cx="334" cy="72" r="12" fill="#7DAA63" />
    </g>

    <!-- cây nhỏ xa -->
    <g fill="#7FA866">
      <circle cx="44" cy="166" r="11" />
      <circle cx="56" cy="160" r="9" />
      <rect x="47" y="168" width="3" height="10" fill="#8A6648" />
    </g>

    <!-- hoa -->
    <g>
      <circle v-for="(f, i) in flowers" :key="i" :cx="f[0]" :cy="f[1]" :r="f[2]" :fill="f[3]" />
    </g>
  </svg>
</template>

<script setup>
// Cảnh khu vườn vẽ bằng SVG (repo chưa có ảnh minh hoạ) — dùng cho đầu panel phải và card
// "Khu vườn tâm hồn" ở trang Tổng quan. variant="hero": nền trong suốt, neo góc phải-dưới.
defineProps({ variant: { type: String, default: 'wide' } });
const uid = Math.random().toString(36).slice(2, 8);
const flowers = [
  [24, 204, 3, '#FFFFFF'], [40, 198, 2.5, '#F4C6C6'], [62, 206, 3, '#FFFFFF'], [84, 200, 2.5, '#F4C6C6'],
  [108, 208, 3, '#FFFFFF'], [132, 198, 2.5, '#F6DDA5'], [156, 206, 3, '#FFFFFF'], [180, 200, 2.5, '#F4C6C6'],
  [214, 162, 2.5, '#FFFFFF'], [236, 150, 2.5, '#FFFFFF'], [258, 156, 2, '#F6DDA5'], [340, 176, 3, '#FFFFFF'],
  [362, 182, 2.5, '#F4C6C6'], [384, 174, 3, '#FFFFFF'], [300, 150, 2, '#FFFFFF']
];
</script>

<style scoped>
.garden-scene-svg { display: block; width: 100%; height: 100%; }
</style>
