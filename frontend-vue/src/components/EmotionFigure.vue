<template>
  <svg ref="svgEl" viewBox="0 0 240 240" aria-hidden="true" class="ef">
    <g v-if="fx.rays" :transform="fx.rays.tf" :opacity="fx.rays.o"><path :d="RAYS_D" class="ef-ray" /></g>
    <circle :cx="fig.cx" :cy="fig.cy" :r="fig.auraR" :fill="fig.bodyColor" :opacity="fig.auraOpacity" />
    <ellipse class="ef-shadow" :cx="fig.cx" cy="214" :rx="fig.shadowRx" ry="7" :opacity="fig.shadowOpacity" />
    <g v-for="f in fx.flowers" :key="'f' + f.i" :transform="f.tf" :opacity="f.o">
      <path d="M0,0 Q3,-8 0,-16" class="ef-stem" />
      <circle v-for="(pt, n) in PETALS" :key="n" :cx="pt[0]" :cy="pt[1]" r="4" :fill="f.color" />
      <circle cx="0" cy="-19" r="3" class="ef-flower-core" />
    </g>
    <g :transform="fig.bodyTransform">
      <path :d="fig.bodyPath" :fill="fig.bodyColor" />
      <ellipse cx="-30" cy="-44" rx="24" ry="14" transform="rotate(-28 -30 -44)" class="ef-gloss" />
      <g :transform="fig.faceTransform">
        <path :d="fig.browL" class="ef-line" />
        <path :d="fig.browR" class="ef-line" />
        <g :transform="fig.eyeTransform">
          <path :d="fig.eyeL" class="ef-fill" />
          <path :d="fig.eyeR" class="ef-fill" />
          <circle :cx="-27.5" :cy="fig.sparkY" r="2" class="ef-sparkle" :opacity="fig.sparkOpacity" />
          <circle :cx="32.5" :cy="fig.sparkY" r="2" class="ef-sparkle" :opacity="fig.sparkOpacity" />
        </g>
        <ellipse cx="-36" cy="22" rx="11" ry="6" class="ef-cheek" :opacity="fig.cheekOpacity" />
        <ellipse cx="36" cy="22" rx="11" ry="6" class="ef-cheek" :opacity="fig.cheekOpacity" />
        <path :d="fig.mouth" class="ef-line ef-mouth" :fill-opacity="fig.mouthFill" />
        <path v-if="fx.sweat > 0" d="M0,-6 Q5,1 0,5 Q-5,1 0,-6Z" :transform="'translate(52 ' + fx.sweatY + ')'" class="ef-sweat" :opacity="fx.sweat" />
      </g>
    </g>
    <g v-for="b in fx.butterflies" :key="'b' + b.i" :transform="b.tf" :opacity="b.o">
      <g :transform="'scale(' + b.flap + ' 1)'" :fill="b.color">
        <ellipse cx="-6" cy="-3" rx="6" ry="5" /><ellipse cx="6" cy="-3" rx="6" ry="5" />
        <ellipse cx="-4.5" cy="4" rx="4" ry="3.5" /><ellipse cx="4.5" cy="4" rx="4" ry="3.5" />
      </g>
      <line x1="0" y1="-6" x2="0" y2="6" class="ef-bug" />
    </g>
    <g v-if="fx.cloud" :transform="fx.cloud.tf" :opacity="fx.cloud.o" :fill="fx.cloud.color">
      <circle cx="-18" cy="2" r="12" /><circle cx="0" cy="-6" r="16" /><circle cx="18" cy="2" r="12" />
      <rect x="-30" y="0" width="60" height="14" rx="7" />
    </g>
    <path v-for="r in fx.drops" :key="'r' + r.i" :d="r.d" class="ef-drop" :opacity="r.o" />
    <path v-if="fx.bolt" :d="fx.bolt.d" class="ef-bolt" :opacity="fx.bolt.o" />
    <path v-for="l in fx.leaves" :key="'l' + l.i" d="M0,-6 Q6,0 0,6 Q-6,0 0,-6Z" :transform="l.tf" :fill="l.color" :opacity="l.o" />
    <circle v-for="c in fx.bubbles" :key="'c' + c.i" :cx="c.cx" :cy="c.cy" :r="c.r" class="ef-bubble" :opacity="c.o" />
    <text v-for="n in fx.notes" :key="'n' + n.i" :x="n.x" :y="n.y" class="ef-note" :opacity="n.o">{{ n.glyph }}</text>
    <path v-for="st in fx.stars" :key="'s' + st.i" d="M0,-8 Q1.5,-1.5 8,0 Q1.5,1.5 0,8 Q-1.5,1.5 -8,0 Q-1.5,-1.5 0,-8Z" :transform="st.tf" class="ef-star" :opacity="st.o" />
  </svg>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';

// Nhân vật cảm xúc của luồng check-in. `value` 0–100 là cảm xúc (rất tệ → rất tốt).
// `intensity` 0–1 (tuỳ chọn, dùng ở bước "mức độ"): giữ nguyên cảm xúc đã chọn, cường độ
// thấp thì biểu cảm nhạt dần về trung tính và chuyển động chậm, cường độ cao thì biểu cảm
// đậm hơn, thở/đung đưa nhanh hơn và quầng sáng phía sau lan rộng.
// `scene` (tuỳ chọn, đi kèm intensity): vùng cảm xúc đã chọn, quyết định hiệu ứng nền —
// càng mạnh càng nhiều. veryBad: mây đen, mưa, sấm chớp · notGood: lá rơi, giọt mồ hôi ·
// neutral: bong bóng nhẹ trôi lên · good: nốt nhạc, lấp lánh · veryGood: tia nắng, hoa, bướm.
const props = defineProps({
  value: { type: Number, required: true },
  intensity: { type: Number, default: null },
  scene: { type: String, default: null }
});

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smoothstep = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };
// Nội suy qua nhiều mốc [[x, giá trị], ...] — đoạn giữa hai mốc dùng smoothstep cho mềm.
function ramp(stops, x) {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [x1, y1] = stops[i];
    const [x0, y0] = stops[i - 1];
    if (x <= x1) return lerp(y0, y1, smoothstep(x0, x1, x));
  }
  return stops[stops.length - 1][1];
}
// Pastel sáng theo bảng màu app: xanh lơ nhạt (buồn) → mint (bình thường) → vàng cam nắng (vui).
const BODY_COLORS = [[0, [190, 212, 232]], [0.5, [176, 226, 194]], [1, [255, 210, 140]]];
function bodyColor(d) {
  const rgb = [0, 1, 2].map((i) => Math.round(ramp(BODY_COLORS.map(([x, c]) => [x, c[i]]), d)));
  return `rgb(${rgb.join(',')})`;
}
const f1 = (n) => n.toFixed(1);
// Thân dạng hữu cơ: 10 điểm quanh tâm, bán kính dao động nhẹ, nối bằng Catmull-Rom → Bézier.
function blobPath(R, wobble) {
  const N = 10;
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const r = R * (1 + 0.035 * Math.sin(2 * a + 0.6) + 0.025 * Math.sin(3 * a + wobble));
    const y = Math.sin(a) * r;
    return [Math.cos(a) * r, y > 0 ? y * 0.93 : y];
  });
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N]; const p1 = pts[i]; const p2 = pts[(i + 1) % N]; const p3 = pts[(i + 2) % N];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)}`
      + ` ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return `${d}Z`;
}
const eyePath = (x, y, rx, top, bottom) => `M${f1(x - rx)},${f1(y)} Q${f1(x)},${f1(y - 2 * top)} ${f1(x + rx)},${f1(y)} Q${f1(x)},${f1(y + 2 * bottom)} ${f1(x - rx)},${f1(y)}Z`;
function browPath(s, sad, happy) {
  const iy = -30 - 9 * sad - 3 * happy;
  const oy = -30 + 2 * sad - 3 * happy;
  const my = (iy + oy) / 2 - 3 * happy + sad;
  return `M${s * 15},${f1(iy)} Q${s * 28},${f1(my)} ${s * 41},${f1(oy)}`;
}

// Đích cần đạt theo props: d = biểu cảm hiển thị (0–1), energy = hệ số nhịp chuyển động,
// aura = độ lan của quầng sáng, boost = phóng to thêm theo cường độ.
function targets() {
  const base = clamp(props.value / 100, 0, 1);
  if (props.intensity === null) return { d: base, energy: 1, aura: 0, boost: 1 };
  const k = clamp(props.intensity, 0, 1);
  return {
    d: clamp(0.5 + (base - 0.5) * lerp(0.35, 1.15, k), 0, 1),
    energy: lerp(0.55, 1.7, k),
    aura: k,
    boost: lerp(0.97, 1.05, k)
  };
}

const fig = reactive({});
const fx = reactive({});
// 16 tia dài/ngắn xen kẽ, bắt đầu ngoài mép quầng sáng (bán kính tối đa ~116) để không bị che.
const RAYS_D = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const [r0, r1] = i % 2 ? [124, 146] : [120, 166];
  return `M${f1(120 + Math.cos(a) * r0)},${f1(128 + Math.sin(a) * r0)} L${f1(120 + Math.cos(a) * r1)},${f1(128 + Math.sin(a) * r1)}`;
}).join(' ');
const PETALS = Array.from({ length: 5 }, (_, i) => [f1(Math.cos((i / 5) * Math.PI * 2) * 4.5), f1(Math.sin((i / 5) * Math.PI * 2) * 4.5 - 19)]);
const BLOOM = ['#FF9EC4', '#FFC46B', '#FF8F8F', '#C3A6F2', '#FFD45C', '#9AD0F5'];
// n hạt tối đa, số hạt hiện = n·k (hạt cuối mờ dần theo phần lẻ) nên kéo cường độ thì hạt
// xuất hiện/biến mất từ từ; vị trí tính thẳng từ thời gian nên không cần lưu trạng thái hạt.
function particles(n, k, make) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const vis = clamp(n * k - i, 0, 1);
    if (vis <= 0) break;
    const p = make(i);
    p.i = i;
    p.o = (vis * clamp(p.o ?? 1, 0, 1)).toFixed(2);
    out.push(p);
  }
  return out;
}
function renderFx(t) {
  const k = props.scene ? motion.aura : 0;
  const next = { rays: null, flowers: [], butterflies: [], cloud: null, drops: [], bolt: null, leaves: [], sweat: 0, sweatY: 0, bubbles: [], notes: [], stars: [] };
  if (k > 0.01) {
    if (props.scene === 'veryBad') {
      const cx = 120 + Math.sin(t * 0.4) * 6;
      const cy = 24;
      const shade = Math.round(lerp(205, 105, k));
      next.cloud = { tf: `translate(${f1(cx)} ${cy}) scale(${lerp(0.75, 1.2, k).toFixed(3)})`, color: `rgb(${shade},${shade + 8},${Math.min(255, shade + 24)})`, o: smoothstep(0, 0.12, k).toFixed(2) };
      next.drops = particles(16, smoothstep(0.12, 1, k), (i) => {
        const fall = (t * (130 + 60 * k) + i * 37) % 78;
        const x = cx - 32 + ((i * 29) % 64);
        return { d: `M${f1(x)},${f1(cy + 16 + fall)} l-2,8`, o: 1 - fall / 78 };
      });
      const ph = (t + 0.7) % 2.6;
      if (ph < 0.1 || (ph > 0.18 && ph < 0.26)) {
        next.bolt = { d: `M${f1(cx + 6)},${cy + 12} L${f1(cx - 5)},${cy + 34} L${f1(cx + 4)},${cy + 34} L${f1(cx - 7)},${cy + 58}`, o: smoothstep(0.5, 0.85, k).toFixed(2) };
      }
    } else if (props.scene === 'notGood') {
      next.leaves = particles(9, k, (i) => {
        const fall = (t * (18 + 10 * k) + i * 29) % 230;
        const x = 16 + ((i * 53) % 208) + Math.sin(t * 1.3 + i) * 12;
        return { tf: `translate(${f1(x)} ${f1(fall - 6)}) rotate(${f1(t * 50 + i * 40)})`, color: i % 2 ? '#E8B07A' : '#F2C77E', o: Math.min(1, (230 - fall) / 30) };
      });
      next.sweat = smoothstep(0.25, 0.7, k).toFixed(2);
      next.sweatY = f1(-30 + ((t * 5) % 10));
    } else if (props.scene === 'neutral') {
      next.bubbles = particles(9, k, (i) => {
        const rise = (t * (14 + 8 * k) + i * 27) % 210;
        return { cx: f1(24 + ((i * 47) % 192) + Math.sin(t * 0.9 + i) * 6), cy: f1(226 - rise), r: 3 + (i % 3) * 2, o: Math.min(1, rise / 30) * Math.min(1, (210 - rise) / 40) };
      });
    } else if (props.scene === 'good') {
      next.notes = particles(4, k, (i) => {
        const rise = (t * (20 + 10 * k) + i * 30) % 120;
        const x = (i % 2 ? 200 : 30) + (i > 1 ? (i % 2 ? -14 : 14) : 0) + Math.sin(t * 2 + i) * 8;
        return { x: f1(x), y: f1(150 - rise), glyph: i % 2 ? '♪' : '♫', o: Math.min(1, rise / 20) * Math.min(1, (120 - rise) / 30) };
      });
      next.stars = particles(8, k, (i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r = 104 + (i % 2) * 8;
        const tw = Math.max(0, Math.sin(t * 2.6 + i * 1.7));
        return { tf: `translate(${f1(120 + Math.cos(a) * r)} ${f1(126 + Math.sin(a) * r * 0.8)}) scale(${(0.4 + tw * 0.8).toFixed(2)})`, o: tw };
      });
    } else if (props.scene === 'veryGood') {
      next.rays = { tf: `rotate(${f1(t * 8)} 120 128)`, o: (smoothstep(0.3, 1, k) * 0.8).toFixed(2) };
      const xs = [30, 54, 78, 162, 186, 210];
      next.flowers = particles(6, k, (i) => ({
        tf: `translate(${xs[i]} ${212 - (i % 2) * 4}) rotate(${f1(Math.sin(t * 1.5 + i) * 8)}) scale(${(0.8 + (i % 3) * 0.15).toFixed(2)})`,
        color: BLOOM[i]
      }));
      next.butterflies = particles(4, k, (i) => {
        const a = t * (0.55 + 0.12 * i) + i * 1.7;
        const x = 120 + Math.cos(a) * (100 - (i % 2) * 10);
        const y = 112 + Math.sin(a) * 70 + Math.sin(t * 3 + i) * 6;
        return { tf: `translate(${f1(x)} ${f1(y)}) rotate(${f1(Math.sin(t * 2 + i) * 15)})`, flap: (0.25 + 0.75 * Math.abs(Math.sin(t * 14 + i * 2))).toFixed(2), color: BLOOM[[0, 1, 5, 3][i]] };
      });
    }
  }
  Object.assign(fx, next);
}
// Giá trị hiển thị đuổi theo đích cho mượt; các pha chuyển động tích luỹ theo thời gian nên
// đổi tốc độ giữa chừng không bị giật/reset.
const motion = { ...targets(), breath: 0, bounce: 0, sway: 0, wobble: 0, nextBlink: 2.5, blinkAt: -1, ox: 0, oy: 0, lx: 0, ly: 0 };

// Theo chuột: mắt luôn nhìn về con trỏ; con trỏ lại gần thì nhân vật né ra (đẩy thân cách con
// trỏ DODGE_R đơn vị, tối đa DODGE_MAX), con trỏ đi xa thì về chỗ cũ. Toạ độ theo viewBox 240.
const svgEl = ref(null);
const pointer = { x: 0, y: 0, active: false };
const DODGE_R = 104;
const DODGE_MAX = 92;
function onPointerMove(e) {
  if (e.pointerType === 'touch' || !svgEl.value) return;
  const r = svgEl.value.getBoundingClientRect();
  const k = Math.min(r.width, r.height) / 240;
  if (!k) return;
  pointer.x = (e.clientX - (r.left + r.width / 2)) / k + 120;
  pointer.y = (e.clientY - (r.top + r.height / 2)) / k + 120;
  pointer.active = true;
}
function onPointerOut(e) { if (!e.relatedTarget) pointer.active = false; }
function followPointer(dt) {
  let tx = 0; let ty = 0; let lx = 0; let ly = 0;
  if (pointer.active) {
    const cx = 120 + motion.ox; const cy = 128 + motion.oy;
    let vx = cx - pointer.x; let vy = cy - pointer.y;
    let dist = Math.hypot(vx, vy);
    if (Math.hypot(120 - pointer.x, 128 - pointer.y) < DODGE_R) {
      if (dist < 0.5) { vx = motion.ox >= 0 ? 1 : -1; vy = 0; dist = 1; }
      tx = pointer.x + (vx / dist) * DODGE_R - 120;
      ty = pointer.y + (vy / dist) * DODGE_R - 128;
      const len = Math.hypot(tx, ty);
      if (len > DODGE_MAX) { tx *= DODGE_MAX / len; ty *= DODGE_MAX / len; }
    }
    lx = clamp(-vx / 70, -1, 1) * 6;
    ly = clamp(-vy / 70, -1, 1) * 4.5;
  }
  const e1 = 1 - Math.exp(-dt * 9);
  const e2 = 1 - Math.exp(-dt * 14);
  motion.ox += (tx - motion.ox) * e1;
  motion.oy += (ty - motion.oy) * e1;
  motion.lx += (lx - motion.lx) * e2;
  motion.ly += (ly - motion.ly) * e2;
}

function render(time, idle) {
  const { d, energy, aura, boost } = motion;
  const sad = smoothstep(0.5, 0, d);
  const happy = smoothstep(0.5, 1, d);
  const breath = idle ? Math.sin(motion.breath) * lerp(0.012, 0.022, d) * Math.min(energy, 1.4) : 0;
  const bounceAmp = idle ? smoothstep(0.78, 1, d) * Math.min(energy, 1.3) : 0;
  const hop = Math.abs(Math.sin(motion.bounce)) * bounceAmp;
  const squash = bounceAmp ? (1 - Math.abs(Math.sin(motion.bounce))) * 0.035 * bounceAmp : 0;
  const sway = idle ? Math.sin(motion.sway) * lerp(0.6, 2.2, happy) * energy : 0;
  let blink = 1;
  if (idle && motion.blinkAt >= 0) {
    const p = (time - motion.blinkAt) / 0.16;
    blink = p >= 0 && p <= 1 ? 1 - Math.sin(Math.PI * p) * 0.92 : 1;
  }
  const scale = lerp(0.94, 1.04, d) * boost;
  const tilt = -9 * sad + 1.5 * happy + sway + motion.ox * 0.12;
  const lift = -9 * hop;
  fig.cx = f1(120 + motion.ox);
  fig.cy = f1(128 + motion.oy);
  fig.bodyTransform = `translate(${f1(120 + motion.ox)} ${f1(134 + 8 * sad - 3 * happy + lift + motion.oy)}) rotate(${f1(tilt)}) scale(${(scale * (1 - breath * 0.5 + squash)).toFixed(3)} ${(scale * (1 + breath - squash)).toFixed(3)})`;
  fig.bodyPath = blobPath(82, motion.wobble);
  fig.bodyColor = bodyColor(d);
  fig.faceTransform = `translate(${f1(-4 * sad)} ${f1(-8 + 9 * sad - 6 * happy)}) rotate(${f1(-4 * sad)})`;
  const eyeY = -6 + 2 * sad;
  fig.eyeTransform = `translate(${f1(motion.lx)} ${f1(motion.ly)})`;
  const top = ramp([[0, 2.6], [0.5, 7], [1, 7.5]], d) * blink;
  const bottom = ramp([[0, 6.5], [0.5, 7], [0.78, 5.5], [1, -2.8]], d) * blink;
  fig.sparkY = f1(eyeY - top * 0.45);
  fig.sparkOpacity = smoothstep(3.5, 6, top).toFixed(2);
  fig.eyeL = eyePath(-30, eyeY, 7, top, bottom);
  fig.eyeR = eyePath(30, eyeY, 7, top, bottom);
  fig.browL = browPath(-1, sad, happy);
  fig.browR = browPath(1, sad, happy);
  const m = d * 2 - 1;
  const w = lerp(24, 40, d);
  const corner = 22 - m * 4;
  const open = smoothstep(0.72, 1, d) * 10;
  fig.mouth = `M${f1(-w / 2)},${f1(corner)} Q0,${f1(22 + m * 13 - open * 1.2)} ${f1(w / 2)},${f1(corner)} Q0,${f1(22 + m * 13 + open)} ${f1(-w / 2)},${f1(corner)}Z`;
  fig.mouthFill = smoothstep(0.72, 0.86, d);
  fig.cheekOpacity = smoothstep(0.5, 1, d) * 0.6;
  fig.shadowRx = f1(68 * scale * (1 - hop * 0.25));
  fig.shadowOpacity = (0.16 * (1 - hop * 0.4)).toFixed(3);
  fig.auraR = f1(lerp(84, 112, aura) + (idle ? Math.sin(motion.breath) * 4 * aura : 0));
  fig.auraOpacity = (aura * 0.35).toFixed(3);
  renderFx(time);
}

const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let rafId = 0;
let lastTime = 0;
function tick(now) {
  const time = now / 1000;
  const dt = Math.min(0.05, lastTime ? time - lastTime : 0);
  lastTime = time;
  const goal = targets();
  const ease = 1 - Math.exp(-dt * 10);
  for (const key of ['d', 'energy', 'aura', 'boost']) motion[key] += (goal[key] - motion[key]) * ease;
  followPointer(dt);
  const { d, energy } = motion;
  motion.breath += 2 * Math.PI * lerp(0.18, 0.3, d) * Math.pow(energy, 0.8) * dt;
  motion.bounce += 2 * Math.PI * 1.3 * Math.sqrt(energy) * dt;
  motion.sway += 2 * Math.PI * lerp(0.08, 0.35, d) * energy * dt;
  motion.wobble += lerp(0.15, 0.6, d) * energy * dt;
  if (time >= motion.nextBlink) { motion.blinkAt = time; motion.nextBlink = time + 2.8 + Math.random() * 2.4; }
  render(time, true);
  rafId = requestAnimationFrame(tick);
}

render(0, false);
if (reduceMotion) {
  watch(() => [props.value, props.intensity, props.scene], () => { Object.assign(motion, targets()); render(0, false); });
}
onMounted(() => {
  if (reduceMotion) return;
  rafId = requestAnimationFrame(tick);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerout', onPointerOut);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerout', onPointerOut);
});
</script>

<style scoped>
.ef { --ef-ink: #5A4334; overflow: visible; }
.ef-shadow { fill: #A08A6E; }
.ef-line { fill: none; stroke: var(--ef-ink); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
.ef-mouth { fill: var(--ef-ink); }
.ef-fill { fill: var(--ef-ink); }
.ef-cheek { fill: #FF8F8F; }
.ef-sparkle { fill: #fff; }
.ef-gloss { fill: #fff; opacity: 0.35; }
.ef-ray { stroke: #FFD45C; stroke-width: 5; stroke-linecap: round; fill: none; }
.ef-stem { fill: none; stroke: #7BBF95; stroke-width: 2; stroke-linecap: round; }
.ef-flower-core { fill: #FFF3C4; }
.ef-bug { stroke: var(--ef-ink); stroke-width: 2; stroke-linecap: round; }
.ef-drop { fill: none; stroke: #7FA9D6; stroke-width: 2.5; stroke-linecap: round; }
.ef-bolt { fill: none; stroke: #FFC93C; stroke-width: 3.5; stroke-linejoin: round; stroke-linecap: round; }
.ef-sweat { fill: #9CC8F0; }
.ef-bubble { fill: #fff; fill-opacity: 0.4; stroke: #8FD3B6; stroke-width: 2; }
.ef-note { fill: #7BBF95; font-size: 20px; font-weight: 700; font-family: system-ui, sans-serif; }
.ef-star { fill: #FFD45C; }
</style>
