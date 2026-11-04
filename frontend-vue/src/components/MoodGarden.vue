<template>
  <svg class="mood-garden" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" :aria-label="label">
    <defs>
      <linearGradient :id="id('sky')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="pal.skyTop" />
        <stop offset="1" :stop-color="pal.skyBottom" />
      </linearGradient>
      <radialGradient :id="id('sun')" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" :stop-color="pal.sun" stop-opacity="0.95" />
        <stop offset="1" :stop-color="pal.sun" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="id('grass')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="pal.grassLight" />
        <stop offset="1" :stop-color="pal.grass" />
      </linearGradient>
      <linearGradient :id="id('earth')" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#C9A27E" />
        <stop offset="0.55" stop-color="#A9805F" />
        <stop offset="1" stop-color="#8E6A55" />
      </linearGradient>
      <linearGradient :id="id('water')" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" :stop-color="pal.waterLight" />
        <stop offset="1" :stop-color="pal.water" />
      </linearGradient>
      <filter :id="id('sat')" x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix type="saturate" :values="saturation" />
      </filter>
      <filter :id="id('glow')" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>

    <!-- Bầu trời, nắng, tia sáng -->
    <rect width="400" height="250" :fill="`url(#${id('sky')})`" />
    <circle cx="326" cy="54" r="70" :fill="`url(#${id('sun')})`" :opacity="0.35 + 0.6 * h" />
    <g v-if="h >= 0.5" fill="#FFFFFF" :opacity="(h - 0.4) * 0.35">
      <path d="M326 54 L210 250 L250 250 Z" />
      <path d="M326 54 L290 250 L318 250 Z" />
      <path d="M326 54 L120 250 L150 250 Z" />
    </g>

    <!-- Mây trôi -->
    <g class="mg-cloud" fill="#FFFFFF" :opacity="0.55 + 0.3 * h">
      <ellipse cx="96" cy="58" rx="30" ry="10" /><ellipse cx="116" cy="51" rx="20" ry="10" />
      <ellipse cx="268" cy="30" rx="22" ry="7" />
    </g>
    <g class="mg-cloud mg-cloud-slow" fill="#FFFFFF" :opacity="0.5 + 0.3 * h">
      <ellipse cx="370" cy="118" rx="26" ry="8" /><ellipse cx="30" cy="186" rx="28" ry="8" />
    </g>

    <!-- Mây mưa khi khu vườn cần chăm sóc -->
    <g v-if="h < 0.3" class="mg-rain">
      <g fill="#A9A6AE">
        <ellipse cx="200" cy="40" rx="42" ry="13" /><ellipse cx="178" cy="34" rx="22" ry="13" /><ellipse cx="222" cy="31" rx="24" ry="15" />
      </g>
      <g stroke="#A9B8C6" stroke-width="1.6" stroke-linecap="round">
        <path v-for="(x, i) in [168, 184, 200, 216, 232]" :key="i" class="mg-drop" :style="{ animationDelay: `${i * 0.18}s` }" :d="`M${x} 56 l-3 9`" />
      </g>
    </g>

    <!-- Đảo nhỏ trôi xa -->
    <g class="mg-bob mg-bob-alt" :filter="`url(#${id('sat')})`">
      <path d="M30 148 Q48 140 66 148 Q58 166 48 172 Q38 164 30 148 Z" fill="#B08463" />
      <ellipse cx="48" cy="147" rx="18" ry="5" :fill="pal.grass" />
      <circle cx="44" cy="138" r="7" :fill="pal.canopy" /><rect x="43" y="141" width="2" height="6" fill="#8A6648" />
      <path d="M344 92 Q358 86 372 92 Q366 106 358 110 Q350 104 344 92 Z" fill="#B08463" />
      <ellipse cx="358" cy="91" rx="14" ry="4" :fill="pal.grass" />
      <circle v-if="h >= 0.4" cx="362" cy="86" r="3" :fill="pal.petalA" />
    </g>

    <!-- Đảo chính -->
    <g class="mg-bob" :filter="`url(#${id('sat')})`">
      <!-- thác nước rơi từ mép đảo -->
      <path v-if="h >= 0.35" class="mg-fall" d="M300 176 Q306 200 304 246" :stroke="pal.waterLight" :stroke-width="2 + 5 * h" fill="none" stroke-linecap="round" opacity="0.85" />

      <!-- thân đất bên dưới -->
      <path d="M72 156 Q86 196 140 220 Q178 246 204 246 Q232 240 262 220 Q314 196 328 156 Q300 192 200 194 Q100 192 72 156 Z" :fill="`url(#${id('earth')})`" />
      <path d="M96 182 Q150 204 200 204 Q262 204 308 180" stroke="#B88D6B" stroke-width="3" fill="none" opacity="0.6" />
      <path d="M140 220 Q200 232 262 220" stroke="#8C6650" stroke-width="2" fill="none" opacity="0.5" />
      <g fill="#D9C6E6" opacity="0.8"><circle cx="150" cy="208" r="3" /><circle cx="236" cy="214" r="2.5" /><circle cx="196" cy="230" r="2" /></g>
      <!-- rễ, dây leo -->
      <g :stroke="pal.grass" stroke-width="1.6" fill="none" stroke-linecap="round">
        <path d="M110 186 Q106 204 112 218" /><path d="M276 196 Q282 212 276 226" /><path d="M188 198 Q184 220 190 236" />
      </g>

      <!-- mặt cỏ -->
      <path d="M68 154 Q66 114 200 108 Q334 114 332 154 Q330 196 200 198 Q70 196 68 154 Z" :fill="pal.grassSide" />
      <path d="M68 150 Q66 112 200 106 Q334 112 332 150 Q330 186 200 190 Q70 186 68 150 Z" :fill="`url(#${id('grass')})`" />

      <!-- lối đá -->
      <g fill="#EFE6DA" opacity="0.9">
        <ellipse cx="176" cy="180" rx="8" ry="3" /><ellipse cx="190" cy="172" rx="7" ry="2.6" /><ellipse cx="202" cy="165" rx="6" ry="2.3" />
      </g>

      <!-- hồ sen -->
      <ellipse cx="248" cy="164" rx="42" ry="13" fill="#D7CBBE" />
      <ellipse cx="248" cy="163" rx="38" ry="11" :fill="`url(#${id('water')})`" />
      <g v-if="h >= 0.3">
        <ellipse cx="232" cy="164" rx="7" ry="2.4" fill="#7FB37A" /><ellipse cx="262" cy="160" rx="6" ry="2.2" fill="#7FB37A" />
        <ellipse cx="270" cy="167" rx="5" ry="1.8" fill="#8CC285" />
      </g>
      <g v-if="h >= 0.55">
        <path d="M262 156 q-3 -6 0 -9 q3 3 0 9 z M262 156 q-6 -3 -6 -7 q4 0 6 7 z M262 156 q6 -3 6 -7 q-4 0 -6 7 z" fill="#F2A7BE" />
        <path d="M232 160 q-2 -5 0 -7 q2 2 0 7 z M232 160 q-5 -2 -5 -5 q3 0 5 5 z M232 160 q5 -2 5 -5 q-3 0 -5 5 z" fill="#F7C0D0" />
      </g>

      <!-- cây nhỏ -->
      <g>
        <rect x="279" y="128" width="4" height="18" rx="1" fill="#8A6648" />
        <ellipse cx="281" cy="114" :rx="10 + 3 * h" :ry="18 + 6 * h" :fill="pal.canopyDark" />
        <ellipse cx="278" cy="110" :rx="6 + 2 * h" :ry="12 + 4 * h" :fill="pal.canopyLight" opacity="0.7" />
      </g>
      <g>
        <rect x="95" y="146" width="3" height="12" fill="#8A6648" />
        <circle cx="96" cy="140" :r="9 + 3 * h" :fill="pal.canopy" /><circle cx="105" cy="146" :r="7 + 2 * h" :fill="pal.canopyDark" />
      </g>

      <!-- cây lớn -->
      <path d="M143 154 Q147 128 144 104 L156 104 Q153 128 159 154 Z" fill="#8A6648" />
      <path d="M147 118 Q136 110 128 112 M153 114 Q164 106 172 108" stroke="#8A6648" stroke-width="3" fill="none" stroke-linecap="round" />
      <g :transform="`translate(150 104) scale(${0.72 + 0.28 * h}) translate(-150 -104)`">
        <circle cx="126" cy="92" r="18" :fill="pal.canopyDark" />
        <circle cx="174" cy="92" r="19" :fill="pal.canopyDark" />
        <circle cx="150" cy="78" r="27" :fill="pal.canopy" />
        <circle cx="134" cy="66" r="16" :fill="pal.canopyLight" />
        <circle cx="166" cy="64" r="17" :fill="pal.canopyLight" />
        <circle cx="150" cy="50" r="14" :fill="pal.canopyLight" />
        <circle cx="150" cy="96" r="16" :fill="pal.canopy" />
        <g v-if="h >= 0.6" fill="#F8C9D6">
          <circle cx="132" cy="80" r="2.4" /><circle cx="160" cy="58" r="2.4" /><circle cx="172" cy="84" r="2.4" /><circle cx="146" cy="68" r="2" /><circle cx="122" cy="96" r="2" />
        </g>
      </g>

      <!-- hoa khổng lồ -->
      <g :transform="`rotate(${droop} 210 152)`">
        <path d="M210 152 Q204 128 206 104" :stroke="pal.stem" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M207 132 q-12 -4 -16 -12 q12 0 16 12 z" :fill="pal.canopy" />
        <g :transform="`translate(206 100) scale(${0.6 + 0.4 * h})`">
          <ellipse v-for="a in [0, 60, 120, 180, 240, 300]" :key="a" cx="0" cy="-9" rx="6" ry="10" :fill="pal.petalA" :transform="`rotate(${a})`" />
          <circle r="5.5" fill="#F6D58A" />
        </g>
      </g>

      <!-- nấm -->
      <g>
        <rect x="118" y="172" width="3" height="6" fill="#F3E8DA" /><path d="M113 173 q6 -9 13 0 z" fill="#E8A3A8" />
        <rect x="128" y="176" width="2" height="4" fill="#F3E8DA" /><path d="M125 177 q4 -6 8 0 z" fill="#E8A3A8" />
      </g>

      <!-- hoa nhỏ: càng khoẻ càng nhiều -->
      <g v-for="(f, i) in visibleFlowers" :key="i" :transform="`rotate(${droop * 0.6} ${f[0]} ${f[1]})`">
        <path :d="`M${f[0]} ${f[1]} l0 -7`" :stroke="pal.stem" stroke-width="1.2" />
        <circle :cx="f[0]" :cy="f[1] - 8" r="3" :fill="f[2] ? pal.petalB : pal.petalA" />
        <circle :cx="f[0]" :cy="f[1] - 8" r="1.1" fill="#F6D58A" />
      </g>

      <!-- lá rụng khi héo -->
      <g fill="#B98B5A" opacity="0.85">
        <ellipse v-for="(l, i) in fallenLeaves" :key="i" :cx="l[0]" :cy="l[1]" rx="3" ry="1.5" :transform="`rotate(${l[2]} ${l[0]} ${l[1]})`" />
      </g>
    </g>

    <!-- đom đóm / ánh sáng lấp lánh -->
    <g v-if="h >= 0.55">
      <circle v-for="(s, i) in sparkles" :key="i" class="mg-spark" :style="{ animationDelay: `${i * 0.6}s` }" :cx="s[0]" :cy="s[1]" r="1.8" fill="#FFF3C4" :filter="`url(#${id('glow')})`" />
      <circle v-for="(s, i) in sparkles" :key="`c${i}`" class="mg-spark" :style="{ animationDelay: `${i * 0.6}s` }" :cx="s[0]" :cy="s[1]" r="0.9" fill="#FFFFFF" />
    </g>
  </svg>
</template>

<script setup>
// Khu vườn tâm hồn dạng đảo nổi thu nhỏ (fantasy / diorama / dreamcore).
// `health` 0..1: càng cao cây càng tán to, nhiều hoa, sen nở, thác chảy mạnh, có đom đóm;
// càng thấp thì màu nhạt dần, hoa rủ xuống, lá rụng và có mây mưa.
import { computed } from 'vue';

const props = defineProps({
  health: { type: Number, default: 0.6 },
  label: { type: String, default: '' }
});

const uid = Math.random().toString(36).slice(2, 8);
const id = (name) => `mg-${name}-${uid}`;

const h = computed(() => Math.min(1, Math.max(0, Number(props.health) || 0)));

function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16));
  const pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// Màu "héo" → màu "tươi" theo health
const pal = computed(() => {
  const t = h.value;
  return {
    skyTop: mix('#DEDCE0', '#EADFF3', t),
    skyBottom: mix('#EEEAE4', '#FDF1E3', t),
    sun: mix('#EFE6D6', '#FFE2B0', t),
    grassLight: mix('#CFC38E', '#B5E09A', t),
    grass: mix('#A99C68', '#7FBF6E', t),
    grassSide: mix('#8E8456', '#5E9E58', t),
    canopyLight: mix('#C9B87C', '#A6D98C', t),
    canopy: mix('#AE9C62', '#82BD6C', t),
    canopyDark: mix('#93834F', '#5F9F5A', t),
    stem: mix('#9C8F5E', '#6FA85E', t),
    petalA: mix('#C9B3A8', '#F4A9C4', t),
    petalB: mix('#C8BDB0', '#C9B4F0', t),
    water: mix('#9DA9A8', '#7CC4D6', t),
    waterLight: mix('#C3CACA', '#BDE8F0', t)
  };
});

const saturation = computed(() => (0.45 + 0.55 * h.value).toFixed(2));
const droop = computed(() => Math.round((1 - h.value) * 38));

const FLOWERS = [
  [110, 142, 0], [228, 140, 1], [300, 150, 0], [124, 168, 1], [186, 160, 0], [312, 162, 1],
  [88, 152, 0], [170, 176, 1], [292, 178, 0], [140, 184, 0], [270, 186, 1], [212, 182, 0],
  [318, 146, 1], [100, 170, 1]
];
const visibleFlowers = computed(() => FLOWERS.slice(0, Math.round(FLOWERS.length * (0.15 + 0.85 * h.value))));

const LEAVES = [[160, 166, 20], [120, 156, 70], [182, 150, -30], [140, 172, 110], [230, 182, 40], [104, 180, -60]];
const fallenLeaves = computed(() => (h.value >= 0.5 ? [] : LEAVES.slice(0, Math.round((0.5 - h.value) * 2 * LEAVES.length))));

const sparkles = [[118, 70], [190, 90], [236, 120], [312, 130], [92, 118], [260, 80], [170, 138]];
</script>

<style scoped>
.mood-garden { display: block; width: 100%; height: 100%; }
.mg-bob { animation: mg-bob 7s ease-in-out infinite; }
.mg-bob-alt { animation-duration: 9s; animation-delay: -3s; }
.mg-cloud { animation: mg-drift 26s ease-in-out infinite alternate; }
.mg-cloud-slow { animation-duration: 38s; }
.mg-spark { animation: mg-twinkle 3.6s ease-in-out infinite; }
.mg-fall { stroke-dasharray: 6 5; animation: mg-flow 1.2s linear infinite; }
.mg-drop { animation: mg-drop 1s linear infinite; }
@keyframes mg-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes mg-drift { from { transform: translateX(-8px); } to { transform: translateX(10px); } }
@keyframes mg-twinkle { 0%, 100% { opacity: 0.15; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-5px); } }
@keyframes mg-flow { to { stroke-dashoffset: -11; } }
@keyframes mg-drop { from { transform: translateY(0); opacity: 1; } to { transform: translateY(14px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .mg-bob, .mg-cloud, .mg-spark, .mg-fall, .mg-drop { animation: none; }
}
</style>
