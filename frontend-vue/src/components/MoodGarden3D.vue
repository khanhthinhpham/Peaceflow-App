<template>
  <div ref="host" class="mg3d" :style="{ background: skyGradient }" role="img" :aria-label="label">
    <!-- Máy không có WebGL: dùng bản vẽ 2D -->
    <MoodGarden v-if="failed" :health="health" :label="label" />
    <!-- lời nhắn bám theo một vật trong cảnh (đèn lồng đang bay): vị trí cập nhật mỗi khung hình -->
    <div ref="bubbleEl" class="mg3d-bubble" :class="{ 'is-on': bubbleOn }"><slot name="bubble" /></div>
  </div>
</template>

<script setup>
// Khu vườn tâm hồn 3D (three.js, tải lười): khối diorama vuông có hồ + thác nước, nổi trên biển mây
// hồng tím, đom đóm và hoa phát sáng. `health` 0..1 quyết định vườn tươi tốt hay héo úa —
// đổi mượt theo thời gian. Tự dừng vẽ khi card khuất màn hình / tab ẩn; tôn trọng giảm chuyển động.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import MoodGarden from './MoodGarden.vue';

const props = defineProps({
  health: { type: Number, default: 0.6 },
  label: { type: String, default: '' },
  // true: kéo chuột / ngón tay để xoay, cuộn / chụm để phóng to (dùng ở chế độ mở toàn màn hình)
  interactive: { type: Boolean, default: false },
  // giờ trong ngày để xem thử (0–24); null = theo giờ thật của máy
  hour: { type: Number, default: null },
  // đang mở bài "cùng thở" với một con vật (DashboardView điều khiển); false → con vật thôi thở, nhảy mừng
  breathing: { type: Boolean, default: false },
  // đảo người dùng tự trang trí: { v, removed, moved, added } (null = đảo mặc định)
  layout: { type: Object, default: null },
  // Vườn ký ức: [{ day, emotion, score }] cũ → mới · Đèn lồng biết ơn: [{ id, text, created_at }]
  memories: { type: Array, default: () => [] },
  lanterns: { type: Array, default: () => [] },
  // id đèn lồng đang hiện lời nhắn bên cạnh (null = không)
  bubbleFor: { type: [String, Number], default: null }
});
// garden-event: { type: 'voice', kind } | 'select' | 'deselect' | 'breathe-start' — để phát âm thanh & hiện lớp hướng dẫn
const emit = defineEmits(['garden-event']);
// điều khiển chế độ trang trí đảo (DashboardView gọi qua ref): enter/exit/setTool/rotate/scale/remove/undo/reset/thumb…
let editorApi = null;
defineExpose({ editor: Object.fromEntries(['enter', 'exit', 'setTool', 'setBrush', 'boostGrowth', 'setTrimMode', 'setEraseMode', 'clearAll', 'ghostRotate', 'ghostFlip', 'ghostScale', 'placeGhost', 'flip', 'endPath', 'duplicate', 'trim', 'rotate', 'scale', 'remove', 'undo', 'reset', 'catalog', 'thumb'].map((k) => [k, (...a) => editorApi?.[k]?.(...a)])) });

/* Sáng / chiều / tối theo giờ thật: night 0..1 (đêm), golden 0..1 (nắng vàng bình minh / hoàng hôn) */
function timeOfDay(hr) {
  const night = hr < 4.5 || hr > 20.5 ? 1 : hr < 6 ? (6 - hr) / 1.5 : hr > 18.5 ? (hr - 18.5) / 2 : 0;
  const golden = Math.max(Math.exp(-(((hr - 6.6) / 1.2) ** 2)) * 0.7, Math.exp(-(((hr - 18) / 1.3) ** 2)));
  return { night: Math.min(1, Math.max(0, night)), golden: Math.min(1, golden) };
}
const nowHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const realHour = ref(nowHour());
const hourNow = computed(() => (props.hour ?? realHour.value));
let hourTimer = null;

const host = ref(null);
const failed = ref(false);
const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));

function mixHex(a, b, t) {
  const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16));
  const pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const skyGradient = computed(() => {
  const t = clamp01(props.health); const { night, golden } = timeOfDay(hourNow.value);
  const stop = (dull, fresh, gold, dark) => mixHex(mixHex(mixHex(dull, fresh, t), gold, golden * 0.8), dark, night);
  return `linear-gradient(180deg, ${stop('#A9ADB8', '#B9AAEA', '#9C8CD0', '#1C2148')} 0%, ${stop('#C8C3C8', '#F3C3DC', '#F4A48C', '#3A3D6C')} 55%, ${stop('#DDD7D2', '#FDE5D8', '#FFD29E', '#665A82')} 100%)`;
});

let stop = () => {};
let setTarget = () => {};
let setHour = () => {};
let endBreath = () => {};

watch(() => props.health, (v) => setTarget(clamp01(v)));
watch(hourNow, (hr) => setHour(hr, props.hour == null));
watch(() => props.breathing, (v) => { if (!v) endBreath(); });
watch(() => props.layout, (l) => editorApi?.applyLayout(l));
let gardenApi = null;
watch(() => props.memories, (m) => gardenApi?.setMemories(m));
watch(() => props.lanterns, (l) => gardenApi?.setLanterns(l));
watch(() => props.bubbleFor, (id) => gardenApi?.setAnchor(id));
const bubbleEl = ref(null); const bubbleOn = ref(false);
// cảnh gọi mỗi khung hình: đặt khung chữ ngay trên vật đang bám (toạ độ điểm ảnh trong khung vườn)
function placeBubble(x, y, on) {
  if (bubbleOn.value !== on) bubbleOn.value = on;
  if (on && bubbleEl.value) bubbleEl.value.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, calc(-100% - 14px))`;
}

let mergeVertices = null;
onMounted(async () => {
  let THREE;
  try {
    THREE = await import('three');
    ({ mergeVertices } = await import('three/examples/jsm/utils/BufferGeometryUtils.js'));
  } catch {
    failed.value = true;
    return;
  }
  let gltf = null;
  try {
    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js')
    ]);
    gltf = { GLTFLoader, MeshoptDecoder };
  } catch { /* không tải được thì vườn vẫn chạy, chỉ thiếu thú */ }
  let OrbitControls = null;
  if (props.interactive) {
    try { ({ OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')); } catch { /* không xoay được thì vẫn xem */ }
  }
  if (!host.value) return;
  try {
    stop = createScene(THREE, host.value, clamp01(props.health), (fn) => { setTarget = fn; }, OrbitControls, gltf, { hour: hourNow.value, real: props.hour == null, expose: (fn) => { setHour = fn; }, onEvent: (e) => emit('garden-event', e), exposeBreath: (fn) => { endBreath = fn; }, layout: props.layout, exposeEditor: (api) => { editorApi = api; }, memories: props.memories, lanterns: props.lanterns, exposeGarden: (api) => { gardenApi = api; }, onAnchor: placeBubble, anchor: props.bubbleFor });
    hourTimer = setInterval(() => { realHour.value = nowHour(); }, 60000); // cập nhật giờ mỗi phút
  } catch (err) {
    console.warn('[MoodGarden3D] WebGL không khả dụng, dùng bản 2D', err);
    failed.value = true;
  }
});

onBeforeUnmount(() => { stop(); if (hourTimer) clearInterval(hourTimer); });

/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createScene(THREE, el, initialHealth, exposeSetTarget, OrbitControls, gltf, timeOpts = {}) {
  let tod = timeOfDay(timeOpts.hour ?? nowHour());
  let realMode = timeOpts.real !== false; // đang theo giờ thật (không phải admin xem thử) → ban ngày dịu hơn
  const rand = mulberry32(7);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'mg3d-canvas';
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1.6, 0.1, 100);
  camera.position.set(13.3, 10.6, 13.3);
  camera.lookAt(0, -0.55, 0);
  let controls = null;
  if (OrbitControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -0.55, 0);
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 10, maxDistance: 34, minPolarAngle: 0.35, maxPolarAngle: 1.45, rotateSpeed: 0.6 });
    controls.addEventListener('start', () => wake());
    controls.update();
  }

  /* ---------- màu theo health ---------- */
  const tinted = []; // { mat, a: héo, b: tươi, prop }
  const C = (hex) => new THREE.Color(hex);
  function mat(fresh, wilt, opts = {}) {
    const m = new THREE.MeshStandardMaterial({ color: fresh, roughness: 0.72, metalness: 0, flatShading: false, ...opts });
    if (wilt) tinted.push({ mat: m, a: C(wilt), b: C(fresh) });
    return m;
  }
  function mesh(geo, material, { cast = true, receive = true } = {}) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = cast; m.receiveShadow = receive;
    return m;
  }

  /* ---------- texture vẽ bằng canvas ---------- */
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,255,255,0.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function streamTexture() {
    const c = document.createElement('canvas'); c.width = 32; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#9FE3EE'; g.fillRect(0, 0, 32, 128);
    for (let i = 0; i < 26; i += 1) {
      g.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.5})`;
      g.fillRect(Math.floor(rand() * 30), Math.floor(rand() * 128), 2, 10 + rand() * 22);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 2.5); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const glowTex = glowTexture();

  /* ---------- ánh sáng ---------- */
  const hemi = new THREE.HemisphereLight('#FFE8F4', '#8AA77A', 1.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF0DA', 2.4);
  // MỘT hướng mặt trời duy nhất (bên phải khung hình): nắng chính, bóng đổ, tia nắng, vầng mặt trời đều theo hướng này
  // trục khung hình: SCREEN_R = sang phải màn hình, SCREEN_B = lùi ra sau đảo (theo hướng máy quay)
  const SCREEN_R = new THREE.Vector3(1, 0, -1).normalize(); const SCREEN_B = new THREE.Vector3(-1, 0, -1).normalize();
  // vị trí mặt trời/trăng theo giờ: góc θ chạy 0 (mọc, trái) → π/2 (đỉnh đầu) → π (lặn, phải)
  const skyTheta = (hr) => (hr >= 5 && hr <= 19.5 ? Math.PI * Math.min(1, Math.max(0, (hr - 5.5) / 13)) : Math.PI * (((hr - 19.5 + 24) % 24) / 9.5));
  // HƯỚNG ÁNH SÁNG (nắng chính, bóng đổ, tia nắng song song): luôn chiếu từ PHÍA TRƯỚC (phía người xem) —
  // sáng: trước-trái · trưa: gần đỉnh đầu · chiều: trước-phải (sáng ↔ chiều chỉ lệch ~65°, mặt đảo luôn sáng)
  function skyPos(hr, out) {
    const th = skyTheta(hr); const D = 13.5;
    const eve = Math.max(0, -Math.cos(th)); // 0 sáng/trưa → 1 chiều tà
    // chiều: nắng chếch hẳn về phía trước đảo (nhiều thành phần "phía người xem"), thấp hơn → rọi xiên lên mặt trước
    out.copy(SCREEN_R).multiplyScalar(-Math.cos(th) * D * (0.42 - 0.12 * eve)).addScaledVector(SCREEN_B, -D * (0.5 + 0.35 * eve));
    out.y = D * (0.5 + 0.5 * Math.sin(th) - 0.12 * eve);
    return out;
  }
  // MẶT TRỜI NHÌN THẤY (vầng sáng + quạt tia): đặt ở vùng trời phía trên, cùng bên với hướng nắng
  function skyPosVisual(hr, out) {
    const th = skyTheta(hr); const D = 13.5;
    const eve = Math.max(0, -Math.cos(th));
    // chiều: mặt trời dời sang phải-phía trước (ra khỏi vùng núi phía sau) → tia nắng rọi vào mặt trước đảo, không trùm lên núi
    out.copy(SCREEN_R).multiplyScalar(-Math.cos(th) * D * (0.85 + 0.2 * eve)).addScaledVector(SCREEN_B, D * (0.18 - 0.6 * eve));
    out.y = D * (0.45 + 0.55 * Math.sin(th) + 0.08 * eve);
    return out;
  }
  const SUN_POS = skyPos(timeOpts.hour ?? nowHour(), new THREE.Vector3());
  sun.position.copy(SUN_POS);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); // đủ mịn cho bóng ngọn cỏ
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#C7B5FF', 0.8);
  rim.position.set(-6, 3, -5);
  // nắng ven: mặt trời thấp sau đảo hắt viền vàng ấm lên mép cây, đảo
  const backSun = new THREE.DirectionalLight('#FFD58A', 1.4);
  backSun.position.copy(SUN_POS);
  scene.add(rim);
  scene.add(backSun);

  /* ---------- đảo chính ---------- */
  const island = new THREE.Group();
  // mã ổn định cho từng đồ vật có sẵn (theo thứ tự gọi loadModel lúc dựng cảnh) → lưu được việc dời / cất đồ
  let loadCalls = 0; let regSuppressed = false;
  scene.add(island);
  const TOP = 0.35;

  function slab(x0, x1, z0, z1, y0, y1, material, target = island) {
    const m = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    target.add(m);
    return m;
  }

  const TOP2 = 0.97; // mặt bậc thang trên cùng
  const hash = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
  const grassMat = mat('#98DC7C', '#B9AE78');
  const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- ĐỊA HÌNH ----------
     Mặt đảo là một bề mặt có độ cao H(x, z) chứ không phẳng: bờ hồ trũng → bãi cỏ gò đồi → bậc thang giữa
     → bậc thang trên → 3 mỏm núi đá phía sau. Suối khắc lòng chảy từ núi qua các bậc (thành thác) vào hồ,
     hồ tràn qua rãnh ra mép phải thành thác dài rơi khỏi đảo. Mọi thứ đặt lên đảo lấy độ cao từ H. */
  const OUTLINE = [[2.45, 0.2], [2.3, 1.3], [1.7, 2.2], [0.6, 2.55], [-0.6, 2.45], [-1.7, 2.2], [-2.4, 1.3], [-2.55, 0.1], [-2.4, -1.2], [-1.8, -2.35], [-0.5, -2.6], [0.8, -2.5], [1.9, -2.1], [2.45, -1.0]];
  const POND_C = [1.0, 0.68]; const POND_R = [0.85, 0.78];
  const pondWob = (a) => 1 + 0.07 * Math.sin(3 * a + 0.5) + 0.04 * Math.sin(5 * a + 1.3);
  const POND = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2; const r = pondWob(a);
    return [POND_C[0] + Math.cos(a) * POND_R[0] * r, POND_C[1] + Math.sin(a) * POND_R[1] * r];
  });
  const pondDist = (x, z) => {
    const dx = (x - POND_C[0]) / POND_R[0]; const dz = (z - POND_C[1]) / POND_R[1];
    return Math.hypot(dx, dz) / pondWob(Math.atan2(dz, dx));
  };
  function inPoly(pts, x, z) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      const [xi, zi] = pts[i]; const [xj, zj] = pts[j];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }
  const scalePts = (pts, k, c = [0, 0]) => pts.map(([x, z]) => [c[0] + (x - c[0]) * k, c[1] + (z - c[1]) * k]);
  function toShape(pts, holes = []) {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
    holes.forEach((h) => sh.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, z)))));
    return sh;
  }
  const smooth = (pts, n = 120) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal')
    .getPoints(n).slice(0, -1).map((v) => [v.x, v.z]);
  const flipZ = (pts) => pts.map(([x, z]) => [x, -z]);
  // mặt phẳng nằm ngang theo viền cong (có thể khoét lỗ) ở độ cao y
  function flat(pts, y, material, hole = null) {
    const g = new THREE.ShapeGeometry(toShape(flipZ(smooth(pts, 64)), hole ? [flipZ(smooth(hole, 64))] : []));
    g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
    const m = mesh(g, material, { cast: false });
    island.add(m);
    return m;
  }
  // khoảng cách từ điểm tới đường gấp khúc
  function segDist(pts, x, z) {
    let best = 1e9;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const [ax, az] = pts[i]; const [bx, bz] = pts[i + 1];
      const vx = bx - ax; const vz = bz - az; const L = vx * vx + vz * vz || 1;
      const t = Math.min(1, Math.max(0, ((x - ax) * vx + (z - az) * vz) / L));
      const d = Math.hypot(x - ax - vx * t, z - az - vz * t);
      if (d < best) best = d;
    }
    return best;
  }

  // dòng suối: mạch nước dưới chân núi → qua 2 bậc thang (thành thác) → đổ vào hồ
  const RIVER_PTS = [[-0.3, -2.0], [-0.25, -1.62], [-0.05, -1.36], [0.15, -1.1], [0.3, -0.82], [0.55, -0.6], [0.85, -0.4], [0.95, -0.12], [1.0, 0.18]];
  const riverCurve = new THREE.CatmullRomCurve3(RIVER_PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const RIVER_S = riverCurve.getSpacedPoints(90).map((v) => [v.x, v.z]);
  // khung bao suối: điểm ở xa thì trả về luôn, khỏi duyệt 90 đoạn (tính địa hình nhanh hơn nhiều)
  const RB = RIVER_S.reduce((b, [x, z]) => [Math.min(b[0], x), Math.max(b[1], x), Math.min(b[2], z), Math.max(b[3], z)], [9, -9, 9, -9]);
  const riverDist = (x, z) => {
    const ox = Math.max(RB[0] - x, 0, x - RB[1]); const oz = Math.max(RB[2] - z, 0, z - RB[3]);
    return ox > 0.6 || oz > 0.6 ? Math.hypot(ox, oz) : segDist(RIVER_S, x, z);
  };
  // rãnh hồ tràn ra mép phải
  const SPILL = [[1.7, 0.7], [1.95, 0.7], [2.2, 0.71], [2.6, 0.72]];

  const back = (x, z) => -z - 0.18 * x + 0.12 * Math.sin(x * 1.9 + 0.6); // càng về sau càng lớn (đường bậc uốn lượn)
  // gò chân núi (thấp) — núi thật là mô hình Quaternius "Mountains" đặt lên trên
  const PEAK_SCALE = 0.35;
  const peaks = (x, z) => PEAK_SCALE * peaksFull(x, z);
  const peaksFull = (x, z) => 1.25 * Math.exp(-(((x + 1.25) ** 2) / 0.3 + ((z + 2.0) ** 2) / 0.22))
    + 0.8 * Math.exp(-(((x + 0.25) ** 2) / 0.18 + ((z + 2.25) ** 2) / 0.14))
    + 0.55 * Math.exp(-(((x - 0.8) ** 2) / 0.2 + ((z + 2.15) ** 2) / 0.12));
  // Vách bậc thang gấp khúc (đường vách răng cưa theo x) + lối dốc thoải cho thú leo lên xuống
  const STEP1 = 0.23; const STEP2 = 1.12;
  const RAMPS = [[-1.0, 1.65], [-1.55, 1.55]]; // vị trí x các lối dốc ở vách 1 và vách 2
  const wallZigzag = (x) => 0.05 * Math.sin(x * 7.3 + 1.1) + 0.03 * Math.sin(x * 13.7 + 0.4);
  const backN = (x, z) => back(x, z) + wallZigzag(x);
  const rampW = (x, k) => RAMPS[k].reduce((m, rx) => Math.max(m, Math.exp(-((x - rx) ** 2) / 0.05)), 0);
  function steps(x, z) {
    const b = backN(x, z);
    const r1 = rampW(x, 0); const r2 = rampW(x, 1);
    const w1 = 0.12 + 0.62 * r1; const w2 = 0.12 + 0.62 * r2;
    const t1 = ss(STEP1 - w1 / 2, STEP1 + w1 / 2, b); const t2 = ss(STEP2 - w2 / 2, STEP2 + w2 / 2, b);
    const bump = (t) => 4 * t * (1 - t);
    return {
      y: 0.3 * t1 + 0.32 * t2,
      wall: (1 - r1) * bump(t1) + (1 - r2) * bump(t2), // trên mặt vách
      ramp: r1 * bump(t1) + r2 * bump(t2) // trên lối dốc
    };
  }
  const levelAt = (x, z) => { const b = backN(x, z); return b < STEP1 ? 0 : b < STEP2 ? 1 : 2; };
  // z của đường vách tại x (mức b cho trước)
  const wallZ = (x, bLevel) => -bLevel - 0.18 * x + 0.12 * Math.sin(x * 1.9 + 0.6) + wallZigzag(x);
  function H(x, z) {
    const st = steps(x, z);
    let y = TOP + st.y + peaks(x, z);
    // u lồi lõm trên mặt vách đá
    y += (0.05 * Math.sin(x * 11.3 + z * 3.1) * Math.sin(z * 9.7 + x * 2.3) + 0.025 * Math.sin(x * 23.0)) * st.wall;
    const pd = pondDist(x, z); const rd = riverDist(x, z); const sd = segDist(SPILL, x, z);
    // gò đồi mềm, phẳng dần gần hồ / suối / rãnh tràn
    const calm = ss(1.1, 1.5, pd) * ss(0.25, 0.5, rd) * ss(0.2, 0.4, sd);
    y += (0.07 * Math.sin(x * 2.1 + 1.3) * Math.sin(z * 1.8 + 0.4) + 0.03 * Math.sin(x * 4.3) * Math.cos(z * 3.7)) * calm;
    if (rd < 0.2) y -= 0.07 * (1 - ss(0, 0.2, rd)); // lòng suối
    if (sd < 0.22) y += (0.2 - y) * (1 - ss(0.08, 0.22, sd)); // rãnh tràn
    if (pd < 1.1) y += (0.05 - y) * (1 - ss(0.78, 1.08, pd)); // lòng hồ
    return y;
  }
  const groundY = H;
  // chân núi: mép sau đảo chạy gần song song trục x → núi nằm thẳng theo trục x, gọn trong phần đất phía sau
  const MOUNT_C = [-0.35, -1.98]; const MOUNT_HALF = [1.25, 0.4]; // nửa dài (theo x) / nửa sâu (theo z)
  const inMountain = (x, z, pad = 0) => Math.abs(x - MOUNT_C[0]) < MOUNT_HALF[0] + pad && Math.abs(z - MOUNT_C[1]) < MOUNT_HALF[1] + pad;
  const slopeAt = (x, z) => { const e = 0.03; return Math.hypot(H(x + e, z) - H(x - e, z), H(x, z + e) - H(x, z - e)) / (2 * e); };

  const EDGE = smooth(OUTLINE, 200);
  const NE = EDGE.length;

  // Hình dạng vách: tại điểm mép (x, z) có đỉnh vách `top`, ở độ cao y → hệ số bán kính (thon dần + gờ đá + u lồi)
  const CLIFF_D = 3.1;
  const cliffTaperF = (f) => (f < 0.22 ? 1 - f * 0.12 : 0.974 - Math.pow((f - 0.22) / 0.78, 1.6) * 0.86);
  function cliffScaleAt(x, z, top, y) {
    const f = Math.min(1, Math.max(0, (top - y) / (top + CLIFF_D)));
    const a = Math.atan2(z, x); const dd = top - y;
    const ledge = Math.abs(Math.sin(y * 7.5 + Math.sin(a * 5) * 0.8)) * 0.045;
    const bulge = 0.03 * Math.sin(a * 11 + y * 2.3) + 0.02 * Math.sin(a * 23 + y * 5.1);
    const amp = ss(0.0, 0.25, dd) * (1 - f * 0.6);
    return cliffTaperF(f) * (1 + (ledge + bulge) * amp);
  }
  // Thảm rêu tràn qua mép: dày thành từng thùy (chỗ rêu dày thì dây leo mọc nhiều), mỏng ở rãnh thác & dưới núi đá
  const mossLobe = (j) => Math.max(0, Math.sin(j * 0.21 + 1.3) * Math.sin(j * 0.077 + 0.4));
  const mossDepth = (j) => {
    const [x, z] = EDGE[j];
    if (segDist(SPILL, x, z) < 0.4) return 0.04;
    return 0.06 + mossLobe(j) * 0.05;
  };

  // màu đất theo độ cao / độ dốc: lòng hồ, bờ cát, cỏ (loang 2 tông), dốc đất, đá núi, lòng suối ướt
  const COL = {
    grassA: C('#B4E683'), grassB: C('#A2DB77'), dirt: C('#D9A578'), rockA: C('#E3D3C0'), rockB: C('#C2AC95'),
    sand: C('#F3DDA8'), bed: C('#3FA6A0'), wet: C('#B3AA98'),
    cliffA: C('#D9A877'), cliffB: C('#BF8C63'), path: C('#E9CB98'), shade: C('#6E9E58'), lip: C('#D8F5A0')
  };
  const tmpC = new THREE.Color();
  function groundColor(x, z, y) {
    const n = hash(Math.round(x * 9), Math.round(z * 9), 1);
    if (y < 0.27 && pondDist(x, z) < 1.12) return tmpC.copy(COL.bed).lerp(COL.sand, ss(0.08, 0.26, y));
    if (peaks(x, z) > 0.3) return tmpC.copy(COL.rockA).lerp(COL.rockB, n * 0.8);
    if (riverDist(x, z) < 0.12 || segDist(SPILL, x, z) < 0.1) return tmpC.copy(COL.wet);
    const sl = slopeAt(x, z);
    const patch = 0.5 + 0.5 * Math.sin(x * 1.3 + z * 0.9 + Math.sin(z * 1.7) * 1.1);
    tmpC.copy(COL.grassA).lerp(COL.grassB, patch * 0.45 + n * 0.06);
    // sáng dần ra phía mép đảo (đón nắng như ảnh mẫu)
    tmpC.lerp(COL.lip, ss(0.72, 1.0, Math.hypot(x, z) / 2.45) * 0.22);
    // lối dốc: đất nện sáng màu, viền cỏ
    const stc = steps(x, z);
    if (stc.ramp > 0.15) return tmpC.lerp(COL.path, ss(0.15, 0.55, stc.ramp) * 0.85);
    // vách bậc thang: đất đá xếp lớp (sọc ngang theo độ cao)
    if (sl > 0.9) {
      const strata = Math.floor(y * 16) % 2 === 0 ? COL.cliffA : COL.cliffB;
      return tmpC.lerp(strata, ss(0.9, 1.6, sl)).multiplyScalar(0.96 + n * 0.08);
    }
    // phía sau dâng cao (chân vách) → tối lại như bóng khe; phía trước hụt xuống (mép trên) → cỏ sáng lên
    const rise = H(x, z - 0.14) - y; const drop = y - H(x, z + 0.14);
    if (rise > 0.04) tmpC.lerp(COL.shade, ss(0.04, 0.24, rise) * 0.3);
    if (drop > 0.04) tmpC.lerp(COL.lip, ss(0.04, 0.22, drop) * 0.4);
    if (peaks(x, z) > 0.12) tmpC.lerp(COL.rockA, ss(0.12, 0.3, peaks(x, z)));
    return tmpC;
  }

  // vân cỏ li ti kiểu nét cọ: nền trắng + vài nghìn nét ngắn đậm/nhạt nhẹ (nhân lên màu đỉnh)
  function grassStrokeTexture() {
    const N = 256; const r = mulberry32(21);
    const c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, N, N);
    ctx.lineCap = 'round';
    for (let i = 0; i < 2600; i += 1) {
      const x = r() * N; const y = r() * N; const len = 3 + r() * 5; const a = -Math.PI / 2 + (r() - 0.5) * 1.1;
      const v = Math.round(214 + r() * 38);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.75)`; ctx.lineWidth = 1 + r() * 1.2;
      for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
        ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len); ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const grassTex = grassStrokeTexture();
  // mặt đảo: lưới vòng đồng tâm theo viền cong, mép ngoài là đệm cỏ bo tròn
  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, map: grassTex });
  tinted.push({ mat: terrainMat, a: C('#E3D19B'), b: C('#FFFFFF') });
  {
    const pos = []; const col = []; const idx = []; const uvs = [];
    const add = (x, z, y) => { pos.push(x, y, z); uvs.push(x * 1.1, z * 1.1); const c = groundColor(x, z, y); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
    const RINGS = 78;
    const center = add(0, 0, H(0, 0));
    const rings = [];
    for (let i = 1; i <= RINGS; i += 1) {
      const k = i / RINGS;
      rings.push(EDGE.map(([ex, ez]) => (i === RINGS ? add(ex * 1.01, ez * 1.01, H(ex, ez) - 0.01) : add(ex * k, ez * k, H(ex * k, ez * k)))));
    }
    for (let j = 0; j < NE; j += 1) idx.push(center, rings[0][(j + 1) % NE], rings[0][j]);
    for (let i = 0; i < RINGS - 1; i += 1) {
      for (let j = 0; j < NE; j += 1) {
        const a = rings[i][j]; const b = rings[i + 1][j]; const c = rings[i][(j + 1) % NE]; const d = rings[i + 1][(j + 1) % NE];
        idx.push(a, c, b, c, d, b);
      }
    }
    // đệm cỏ: mép cỏ cuộn tròn ra ngoài rồi úp vào vách (như lớp kem phủ bánh), viền sáng ở chỗ phồng nhất
    const RIM = C('#E2F7A6'); const UNDER = C('#5E9A47');
    const CUSH = 7; const RC = 0.075;
    let prev = rings[RINGS - 1];
    for (let m = 1; m <= CUSH; m += 1) {
      const phi = (m / CUSH) * Math.PI * 0.68; // 0 → ~122°
      const row = EDGE.map(([ex, ez], j) => {
        const R = Math.hypot(ex, ez); const top = H(ex, ez) - 0.01;
        const y = top - RC * (1 - Math.cos(phi)) - (m === CUSH ? 0.03 : 0);
        const out = RC * Math.sin(phi) + 0.004 * Math.sin(j * 1.3);
        const k = Math.max(cliffScaleAt(ex, ez, top - 0.04, y) + 0.004, 1.01 + out / R - (m === CUSH ? 0.03 : 0) / R);
        const v = add(ex * k, ez * k, y);
        const base = new THREE.Color(col[rings[RINGS - 1][j] * 3], col[rings[RINGS - 1][j] * 3 + 1], col[rings[RINGS - 1][j] * 3 + 2]);
        const deg = (phi * 180) / Math.PI;
        if (deg < 75) base.lerp(RIM, ss(10, 60, deg) * 0.75);
        else base.lerp(RIM, 0.75 * (1 - ss(75, 100, deg))).lerp(UNDER, ss(80, 122, deg) * 0.85);
        col[v * 3] = base.r; col[v * 3 + 1] = base.g; col[v * 3 + 2] = base.b;
        return v;
      });
      for (let j = 0; j < NE; j += 1) {
        const a = prev[j]; const b = row[j]; const c = prev[(j + 1) % NE]; const d = row[(j + 1) % NE];
        idx.push(a, c, b, c, d, b);
      }
      prev = row;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    island.add(mesh(g, terrainMat));
  }

  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 0.8 });
  tinted.push({ mat: rockMat, a: C('#CFC8BC'), b: C('#FFFFFF') });

  // vách đảo: từ mép mặt đảo (cao thấp theo địa hình) thon nhọn xuống đáy; dưới núi là vách đá
  {
    const K = 34;
    const CLIFF_BANDS = [[0.3, '#E6AE7C'], [0.48, '#D3926A'], [0.7, '#B97F69'], [1.01, '#9479B2']];
    const tops = EDGE.map(([x, z]) => H(x, z) - 0.06);
    const pos = []; const col = []; const idx = [];
    for (let k = 0; k <= K; k += 1) {
      const f = k / K;
      EDGE.forEach(([x, z], j) => {
        const y = tops[j] + (-CLIFF_D - tops[j]) * f;
        const a = Math.atan2(z, x); const dd = tops[j] - y;
        const ledge = Math.abs(Math.sin(y * 7.5 + Math.sin(a * 5) * 0.8)) * 0.045;
        const tpj = cliffScaleAt(x, z, tops[j], y); // thon dần + gờ đá xếp lớp + u lồi
        pos.push(x * tpj, y, z * tpj);
        const g = Math.min(1, Math.max(0, -y / CLIFF_D));
        const n = hash(j >> 2, Math.floor(y * 7.5), 4); // thớ màu theo từng lớp đá
        if (y > 0.05 && peaks(x, z) > 0.12) tmpC.copy(COL.rockA).lerp(COL.rockB, n);
        else tmpC.set(CLIFF_BANDS.find((bd) => g < bd[0])[1]).lerp(COL.cliffB, n * 0.35);
        tmpC.multiplyScalar(0.9 + n * 0.14 + ledge * 1.6);
        // bóng đổ dưới mép cỏ
        tmpC.multiplyScalar(0.62 + 0.38 * ss(0.02, 0.35, dd));
        col.push(tmpC.r, tmpC.g, tmpC.b);
      });
    }
    for (let k = 0; k < K; k += 1) {
      for (let j = 0; j < NE; j += 1) {
        const a = k * NE + j; const b = (k + 1) * NE + j; const c = k * NE + ((j + 1) % NE); const d = (k + 1) * NE + ((j + 1) % NE);
        idx.push(a, c, b, c, d, b);
      }
    }
    const tip = pos.length / 3; pos.push(0, -CLIFF_D - 0.15, 0); col.push(0.55, 0.47, 0.63);
    for (let j = 0; j < NE; j += 1) idx.push(K * NE + j, K * NE + ((j + 1) % NE), tip);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    island.add(mesh(g, rockMat));
  }

  // thêm vào đảo KHÔNG bù tỉ lệ (toạ độ đảo); được gán lại thành hàm add gốc khi bật phóng to đảo bên dưới
  let addToIslandRaw = (o) => island.add(o);
  /* Dây leo phủ kín mép đảo (CC-BY 3.0 — ghi công trong màn hình toàn màn hình):
     "Vines" (Poly by Google) ghép sát nhau gần như liền quanh đảo + xen mành "Ranking plant" (Jakob Hippe).
     Mỗi chùm treo từ chỗ phồng của đệm cỏ → phủ kín đường giao cỏ/vách, rồi nghiêng bám theo vách đi xuống.
     Mỗi loại vẽ bằng 1 InstancedMesh (1 lượt vẽ). Bỏ qua đoạn mép có rãnh thác tràn. */
  const edgeFrame = (j) => {
    const [x, z] = EDGE[j]; const [px, pz] = EDGE[(j - 1 + NE) % NE]; const [qx, qz] = EDGE[(j + 1) % NE];
    const tx = qx - px; const tz = qz - pz; const L = Math.hypot(tx, tz) || 1;
    return { x, z, tx: tx / L, tz: tz / L, nx: tz / L, nz: -tx / L, top: H(x, z) - 0.01 };
  };
  // điểm mép nội suy theo chỉ số thực (để xếp dây dày, không phụ thuộc số điểm viền)
  const edgeFrameAt = (jf) => {
    const j0 = Math.floor(jf) % NE; const t = jf - Math.floor(jf);
    const a = edgeFrame(j0); const b = edgeFrame((j0 + 1) % NE);
    const lerp = (u, v) => u + (v - u) * t;
    return { x: lerp(a.x, b.x), z: lerp(a.z, b.z), tx: lerp(a.tx, b.tx), tz: lerp(a.tz, b.tz), nx: lerp(a.nx, b.nx), nz: lerp(a.nz, b.nz), top: lerp(a.top, b.top), j: j0 };
  };
  // điểm treo: trên chỗ phồng của đệm cỏ (≈60°) → lá trên cùng phủ qua dải giao cỏ/vách
  const vineRoot = (f) => {
    const R = Math.hypot(f.x, f.z); const RC = 0.075;
    return { y: f.top - RC * 0.5, k: 1.01 + (RC * 0.87 + 0.012) / R, R };
  };
  // góc nghiêng vào trong để chân dây (dài hl, toạ độ đảo) áp vào vách
  const vineLean = (f, hl) => {
    const root = vineRoot(f);
    const kBot = cliffScaleAt(f.x, f.z, f.top - 0.05, root.y - hl);
    return Math.atan2(root.R * Math.max(0, root.k - kBot), hl) + 0.02;
  };
  // dây leo chỉ mọc thành từng mảng dọc mép (~40% chu vi), không phủ hết đảo; mép mảng thưa & ngắn dần
  const vineZone = (jf) => ss(0.12, 0.45, Math.sin(jf * 0.094 + 0.8) * 0.65 + Math.sin(jf * 0.21 + 2.1) * 0.35);
  const vineSpotAt = (f, jf = f.j) => segDist(SPILL, f.x, f.z) > 0.42 && vineZone(jf) > 0.02 && hash(Math.round(jf * 7), 1, 9) < 0.25 + vineZone(jf) * 0.9;
  // nạp 1 mô hình dây leo thành InstancedMesh: gốc toạ độ đặt ở đỉnh-giữa (treo từ trên), cao chuẩn hoá = 1
  // Uốn dây (gốc ở đỉnh, thân dọc trục -y, dài 1): gốc cắm dưới đất rồi TRỒI LÊN khỏi mặt cỏ (đoạn dốc),
  // bò ngắn ra phía mép (+z), cong 1/4 vòng qua mép, rồi rủ xuống và thu dần vào trong theo độ thon của vách.
  const VINE_A = 0.16; const VINE_R = 0.17; const VINE_SLOPE = 0.16; const VINE_ROOT = 0.11; // độ sâu gốc dưới đất
  function bendVine(geo) {
    const p = geo.attributes.position; const arcL = (Math.PI / 2) * VINE_R; const Ls = Math.hypot(1, VINE_SLOPE);
    for (let i = 0; i < p.count; i += 1) {
      const x = p.getX(i); const s = -p.getY(i); const zt = p.getZ(i);
      let py; let pz; let ty; let tz;
      if (s <= VINE_A) {
        // trồi lên từ dưới đất: y = -ROOT·(1 - s/A)² → 0 tại s = A, tiếp tuyến liền mạch với đoạn cong
        const u = 1 - s / VINE_A; pz = s; py = -VINE_ROOT * u * u;
        const dy = (2 * VINE_ROOT * u) / VINE_A; const L = Math.hypot(dy, 1); ty = dy / L; tz = 1 / L;
      }
      else if (s <= VINE_A + arcL) {
        const th = (s - VINE_A) / VINE_R;
        pz = VINE_A + VINE_R * Math.sin(th); py = -VINE_R + VINE_R * Math.cos(th); tz = Math.cos(th); ty = -Math.sin(th);
      } else {
        const d = s - VINE_A - arcL;
        pz = VINE_A + VINE_R - (VINE_SLOPE * d) / Ls; py = -VINE_R - d / Ls; tz = -VINE_SLOPE / Ls; ty = -1 / Ls;
      }
      p.setXYZ(i, x, py + zt * tz, pz - zt * ty); // độ dày lá đặt theo pháp tuyến của đường uốn
    }
    geo.computeVertexNormals();
  }
  function loadVineInstanced(file, tintHex, place, swapXZ = false) {
    if (!gltf) return;
    const ld = new gltf.GLTFLoader(); ld.setMeshoptDecoder(gltf.MeshoptDecoder);
    ld.load(`/models/garden/${file}.glb`, (res) => {
      if (disposed) return;
      res.scene.updateMatrixWorld(true);
      let src = null; res.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
      if (!src) return;
      const geo = src.geometry.clone();
      // file đã nén lưu toạ độ/pháp tuyến dạng số nguyên chuẩn hoá → đổi về số thực trước khi dời/đổi cỡ
      ['position', 'normal'].forEach((name) => {
        const at = geo.getAttribute(name); if (!at) return;
        const arr = new Float32Array(at.count * at.itemSize);
        for (let i = 0; i < at.count; i += 1) for (let c = 0; c < at.itemSize; c += 1) arr[i * at.itemSize + c] = at.getComponent(i, c);
        geo.setAttribute(name, new THREE.BufferAttribute(arr, at.itemSize));
      });
      geo.applyMatrix4(src.matrixWorld); geo.computeBoundingBox();
      const bb = geo.boundingBox; const hgt = bb.max.y - bb.min.y;
      geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.max.y, -(bb.min.z + bb.max.z) / 2);
      geo.scale(1 / hgt, 1 / hgt, 1 / hgt);
      if (swapXZ) geo.rotateY(Math.PI / 2); // mành "Ranking plant": bề ngang về trục x như "Vines"
      bendVine(geo);
      const baseMat = src.material.clone();
      baseMat.metalness = 0; baseMat.roughness = Math.max(baseMat.roughness, 0.75);
      if (baseMat.map) baseMat.alphaTest = Math.max(baseMat.alphaTest || 0, 0.4);
      baseMat.side = THREE.DoubleSide;
      const entries = place(); // [{ m: Matrix4, back: bool }]
      const addIM = (list, mat) => {
        if (!list.length) return;
        const im = new THREE.InstancedMesh(geo, mat, list.length);
        list.forEach((mx, i) => im.setMatrixAt(i, mx));
        im.castShadow = false; im.receiveShadow = true;
        addToIslandRaw(im); // toạ độ đảo, không bù tỉ lệ
      };
      // lớp sau: giữ màu gốc của mô hình
      const backMat = baseMat; const orig = backMat.color.clone();
      tinted.push({ mat: backMat, a: orig.clone().multiply(TREE_WILT), b: orig });
      addIM(entries.filter((e) => e.back).map((e) => e.m), backMat);
      // lớp trước: cùng màu cỏ nền — lấy độ sáng tối của texture làm hình lá rồi tô màu cỏ (không bị xỉn như nhân màu)
      const frontMat = baseMat.clone(); const grass = C(tintHex); frontMat.color.copy(grass);
      if (frontMat.map) {
        frontMat.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `
            #ifdef USE_MAP
              vec4 sampledDiffuseColor = texture2D( map, vMapUv );
              float lum = dot( sampledDiffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
              diffuseColor.rgb *= 0.5 + 1.25 * lum;
              diffuseColor.a *= sampledDiffuseColor.a;
            #endif`);
        };
        frontMat.customProgramCacheKey = () => 'vine-grass-tone';
      }
      tinted.push({ mat: frontMat, a: grass.clone().multiply(TREE_WILT), b: grass });
      addIM(entries.filter((e) => !e.back).map((e) => e.m), frontMat);
      applyHealth(h); wake();
    });
  }
  const VINE_ROOTS = []; // [x, z, hl] — điểm từng sợi dây trồi lên khỏi mặt đất
  const vineMatrix = (f, hl, yaw, mode, side = 0) => {
    const root = vineRoot(f);
    // điểm xa nhất của chỗ cong (VINE_A + VINE_R) nằm ngay ngoài chỗ phồng của đệm cỏ → gốc lùi vào trong trên mặt cỏ
    const reach = (VINE_A + VINE_R) * hl;
    const sx = f.x * root.k - f.nx * reach + f.tx * side; const sz = f.z * root.k - f.nz * reach + f.tz * side;
    const o = new THREE.Object3D();
    o.position.set(sx, Math.max(H(sx, sz), f.top) + 0.012, sz);
    o.rotation.set(0, Math.atan2(f.nx, f.nz) + yaw, 0); // trục +z (hướng bò ra) → ra ngoài mép
    o.scale.set(hl * 1.5, hl, hl); // chùm rộng hơn theo chiều ngang
    o.updateMatrix();
    // điểm trồi lên: thân dây y = -ROOT·hl·(1 - s/A)² cắt mặt cỏ (~0.012 dưới gốc toạ độ dây)
    const u = Math.min(1, Math.sqrt(0.012 / (VINE_ROOT * hl)));
    const e = VINE_A * (1 - u) * hl; const th = o.rotation.y;
    VINE_ROOTS.push([sx + Math.sin(th) * e, sz + Math.cos(th) * e, hl]);
    return o.matrix.clone();
  };
  // thảm lá thường xuân phủ kín đệm cỏ ở mép, lấp các khe giữa các chùm dây (cùng tông lá dây leo)
  {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.lineTo(0.42, 0.28); leafShape.lineTo(0.3, 0.55); leafShape.lineTo(0.5, 0.8);
    leafShape.lineTo(0.15, 0.85); leafShape.lineTo(0, 1.05); leafShape.lineTo(-0.15, 0.85);
    leafShape.lineTo(-0.5, 0.8); leafShape.lineTo(-0.3, 0.55); leafShape.lineTo(-0.42, 0.28); leafShape.lineTo(0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape); leafGeo.translate(0, -0.45, 0);
    const lp = leafGeo.attributes.position;
    for (let i = 0; i < lp.count; i += 1) lp.setZ(i, -0.25 * lp.getX(i) * lp.getX(i));
    leafGeo.computeVertexNormals();
    const ivyMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', side: THREE.DoubleSide, roughness: 0.75 });
    tinted.push({ mat: ivyMat, a: C('#D8C48E'), b: C('#FFFFFF') });
    const IVY_A = C('#9ED672'); const IVY_B = C('#B4E485'); const IVY_C = C('#83C25E'); // cùng tông cỏ nền
    const RC = 0.075; const N_LEAF = 1700;
    const im = new THREE.InstancedMesh(leafGeo, ivyMat, N_LEAF);
    const r = mulberry32(4242); const dummy = new THREE.Object3D(); const nrm = new THREE.Vector3(); const cc = new THREE.Color();
    let n = 0;
    for (let i = 0; i < N_LEAF * 2 && n < N_LEAF; i += 1) {
      const jfr = r() * NE; const f = edgeFrameAt(jfr);
      if (!vineSpotAt(f, jfr)) continue;
      const R = Math.hypot(f.x, f.z);
      const phi = (12 + r() * 118) * (Math.PI / 180); // từ mặt trên đệm tới mặt dưới
      const out = RC * Math.sin(phi) + 0.006; const y = f.top - RC * (1 - Math.cos(phi)) + 0.004;
      const k = 1.01 + out / R;
      dummy.position.set(f.x * k, y, f.z * k);
      nrm.set(f.nx * Math.sin(phi), Math.cos(phi), f.nz * Math.sin(phi));
      dummy.lookAt(dummy.position.x + nrm.x, dummy.position.y + nrm.y, dummy.position.z + nrm.z);
      dummy.rotateZ(r() * Math.PI * 2);
      dummy.scale.setScalar(0.045 + r() * 0.035);
      dummy.updateMatrix(); im.setMatrixAt(n, dummy.matrix);
      cc.copy(IVY_A).lerp(r() < 0.5 ? IVY_B : IVY_C, r() * 0.8); im.setColorAt(n, cc);
      n += 1;
    }
    im.count = n; im.castShadow = false; im.receiveShadow = true;
    island.add(im);
  }
  // "Vines": 2 lớp so le, rất sát nhau → phủ liền mép
  const GOOGLE_VINES = (() => {
    const out = [];
    for (let jf = 0; jf < NE; jf += 1.15) {
      const f = edgeFrameAt(jf); if (!vineSpotAt(f, jf)) continue;
      const hl = (0.22 + hash(Math.round(jf * 10), 2, 4) * 0.42) * (0.45 + 0.55 * vineZone(jf));
      out.push({ m: vineMatrix(f, hl, (hash(Math.round(jf * 10), 3, 4) - 0.5) * 0.4, 'face'), back: false });
      if (hash(Math.round(jf * 10), 5, 4) < 0.85) {
        const f2 = edgeFrameAt((jf + 0.7) % NE);
        out.push({ m: vineMatrix(f2, hl * (0.55 + hash(Math.round(jf * 10), 6, 4) * 0.4), (hash(Math.round(jf * 10), 7, 4) - 0.5) * 0.5, 'face', 0.01), back: true });
      }
    }
    return out;
  })();
  loadVineInstanced('vine_vines_google', '#A9DE7B', () => GOOGLE_VINES);
  // "Ranking plant": mành dài xen giữa
  const RANKING_VINES = (() => {
    const out = [];
    for (let jf = 4; jf < NE; jf += 9) {
      const f = edgeFrameAt(jf); if (!vineSpotAt(f, jf) || vineZone(jf) < 0.6) continue;
      const hl = 0.55 + hash(Math.round(jf), 1, 4) * 0.4;
      out.push({ m: vineMatrix(f, hl, (hash(Math.round(jf), 9, 4) - 0.5) * 0.2, 'curtain'), back: true });
    }
    return out;
  })();
  loadVineInstanced('vine_vines_ranking', '#A9DE7B', () => RANKING_VINES, true);

  /* Bóng tiếp xúc: đốm tối mềm dưới chân cây, bụi, hoa, đình, nấm, thú — để đồ vật "ngồi" hẳn trên cỏ. */
  function contactShadowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(0.55, 'rgba(0,0,0,0.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const shadowTex = contactShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, color: '#2E4A22', transparent: true, depthWrite: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 });
  const shadowGeo = new THREE.PlaneGeometry(1, 1); shadowGeo.rotateX(-Math.PI / 2);
  // r: bán kính thật (đơn vị cảnh); parent mặc định là đảo (đã phóng ×1.5 → bù tỉ lệ)
  const shadowAt = new Map(); const skey = (x, z) => `${x.toFixed(3)}|${z.toFixed(3)}`;
  function contactShadow(x, z, r, parent = null) {
    const m = new THREE.Mesh(shadowGeo, shadowMat);
    m.renderOrder = 1;
    if (parent) { m.position.set(0, 0.015, 0); m.scale.set(r * 2, 1, r * 2); parent.add(m); return m; }
    m.position.set(x, groundY(x, z) + 0.008, z); m.scale.set((r * 2) / 1.5, 1, (r * 2) / 1.5);
    addToIslandRaw(m);
    shadowAt.set(skey(x, z), m);
    return m;
  }

  // đá tảng trên sườn núi + ven suối
  const stoneMat = mat('#C9BFD2', '#B1ACB0');
  const boulderMat = mat('#CFC2B0', '#B5AEA6');
  // vị trí đá (mô hình đá CC0 nạp ở dưới): [x, z, cao]
  const PEAK_ROCKS = []; const BANK_STONES = []; const POND_STONES = []; const WALL_ROCKS = [];
  // đá chĩa ra dọc 2 vách bậc thang (bỏ qua lối dốc, suối, núi, mép đảo)
  [STEP1, STEP2].forEach((lv, k) => {
    for (let x = -2.3; x <= 2.3; x += 0.3) {
      const xx = x + (hash(Math.round(x * 10), k, 6) - 0.5) * 0.14;
      const zz = wallZ(xx, lv) + (hash(Math.round(x * 10), k, 7) - 0.5) * 0.08;
      if (rampW(xx, k) > 0.12 || riverDist(xx, zz) < 0.32 || peaks(xx, zz) > 0.18 || !inPoly(scalePts(OUTLINE, 0.9), xx, zz)) continue;
      if (Math.hypot(xx - 0.75, zz + 1.55) < 0.55) continue;
      const dzdx = (wallZ(xx + 0.01, lv) - wallZ(xx - 0.01, lv)) / 0.02; const nL = Math.hypot(dzdx, 1);
      // [x, z, cỡ, góc xuôi theo vách, pháp tuyến hướng ra phía thấp (nx, nz)]
      WALL_ROCKS.push([xx, zz, 0.15 + hash(Math.round(x * 10), k, 8) * 0.1, -Math.atan2(dzdx, 1), -dzdx / nL, 1 / nL]);
    }
  });
  for (let i = 0; i < 18; i += 1) {
    const [cx, cz] = [[-1.25, -2.0], [-0.25, -2.25], [0.8, -2.15]][i % 3];
    const x = cx + (hash(i, 1, 9) - 0.5) * 1.1; const z = cz + (hash(i, 2, 9) - 0.5) * 0.7;
    if (!inPoly(scalePts(OUTLINE, 0.95), x, z) || riverDist(x, z) < 0.15) continue;
    if (!inMountain(x, z, 0.1)) PEAK_ROCKS.push([x, z, 0.12 + hash(i, 3, 9) * 0.22]);
  }
  RIVER_S.forEach(([x, z], i) => {
    if (i % 9 !== 4 || i > 80) return;
    const side = i % 18 === 4 ? 1 : -1;
    const [nx, nz] = RIVER_S[Math.min(i + 1, RIVER_S.length - 1)];
    const tx = nx - x; const tz = nz - z; const L = Math.hypot(tx, tz) || 1;
    const sx = x - (tz / L) * 0.24 * side; const sz = z + (tx / L) * 0.24 * side;
    BANK_STONES.push([sx, sz, 0.07 + hash(i, 5, 2) * 0.07, -(tz / L) * side, (tx / L) * side]);
  });

  /* ---------- NƯỚC: hồ gợn sóng + viền bọt, suối chảy, thác nhiều bậc có bọt & nước bắn ---------- */
  // normal map gợn sóng vẽ bằng canvas (lặp liền mạch), trôi chậm theo thời gian
  function rippleTexture() {
    const N = 128; const r = mulberry32(5); const hm = new Float32Array(N * N);
    for (let k = 0; k < 46; k += 1) {
      const cx = r() * N; const cy = r() * N; const rad = 4 + r() * 13; const amp = 0.3 + r() * 0.7;
      for (let y = 0; y < N; y += 1) {
        for (let x = 0; x < N; x += 1) {
          let dx = Math.abs(x - cx); let dy = Math.abs(y - cy); dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy);
          hm[y * N + x] += amp * Math.exp(-(dx * dx + dy * dy) / (rad * rad));
        }
      }
    }
    const c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(N, N);
    const at = (x, y) => hm[((y + N) % N) * N + ((x + N) % N)];
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const nx = (at(x - 1, y) - at(x + 1, y)) * 2; const ny = (at(x, y - 1) - at(x, y + 1)) * 2; const L = Math.hypot(nx, ny, 1);
        const k = (y * N + x) * 4;
        img.data[k] = (nx / L * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / L * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / L * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.4, 1.4);
    return tex;
  }
  const rippleTex = rippleTexture();
  const WATER_Y = 0.24;
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#6FDCEB', roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.84,
    emissive: '#2FB4CF', emissiveIntensity: 0.15, normalMap: rippleTex, normalScale: new THREE.Vector2(0.45, 0.45)
  });
  tinted.push({ mat: waterMat, a: C('#9AA8A8'), b: C('#6FDCEB') });
  flat(scalePts(POND, 1.05, POND_C), WATER_Y, waterMat);
  // viền bọt trắng sát bờ hồ (bờ thật ở khoảng 0.96 bán kính hồ)
  const foamRingMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false });
  const foamRing = flat(scalePts(POND, 0.995, POND_C), WATER_Y + 0.004, foamRingMat, scalePts(POND, 0.9, POND_C));

  // dải nước chảy theo một đường (suối, rãnh tràn): bám độ cao địa hình, vân nước trôi theo dòng
  function ribbon(curvePts, width, yAt, material) {
    const pos = []; const uv = []; const idx = [];
    let dist = 0;
    curvePts.forEach(([x, z], i) => {
      const [px, pz] = curvePts[Math.max(0, i - 1)]; const [qx, qz] = curvePts[Math.min(curvePts.length - 1, i + 1)];
      const tx = qx - px; const tz = qz - pz; const L = Math.hypot(tx, tz) || 1;
      const nx = -tz / L; const nz = tx / L;
      const w = width(i / (curvePts.length - 1)) / 2; const y = yAt(x, z, i);
      if (i > 0) dist += Math.hypot(x - curvePts[i - 1][0], z - curvePts[i - 1][1], y - pos[pos.length - 2]);
      pos.push(x + nx * w, y, z + nz * w, x - nx * w, y, z - nz * w);
      uv.push(0, dist / 0.5, 1, dist / 0.5);
      if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    island.add(m);
    return m;
  }
  const flowTex = streamTexture();
  flowTex.repeat.set(1, 1);
  const riverMat = new THREE.MeshBasicMaterial({ map: flowTex, transparent: true, opacity: 0.88, depthWrite: false, side: THREE.DoubleSide });
  const RIVER_FINE = riverCurve.getSpacedPoints(150).map((v) => [v.x, v.z]);
  const riverY = RIVER_FINE.map(([x, z]) => (pondDist(x, z) < 1.02 ? Math.max(H(x, z) + 0.035, WATER_Y + 0.004) : H(x, z) + 0.035));
  const river = ribbon(RIVER_FINE, (t) => 0.11 + 0.15 * t, (x, z, i) => riverY[i], riverMat);
  const spillPts = new THREE.CatmullRomCurve3(SPILL.map(([x, z]) => new THREE.Vector3(x, 0, z))).getSpacedPoints(16).map((v) => [v.x, v.z]);
  const spill = ribbon(spillPts, () => 0.3, () => WATER_Y + 0.005, riverMat);

  // bọt + hơi nước ở chân mỗi bậc thác (chỗ suối dốc gắt rồi bằng lại), ở mạch nước và chỗ suối đổ vào hồ
  const foams = [];
  const emitters = [];
  const foamMat = new THREE.SpriteMaterial({ map: glowTex, color: '#FFFFFF', transparent: true, opacity: 0.6, depthWrite: false });
  function addFoam(x, y, z, sc) {
    const f = new THREE.Sprite(foamMat.clone()); f.scale.set(0.5 * sc, 0.25 * sc, 1); f.position.set(x, y + 0.05, z);
    island.add(f); foams.push(f); emitters.push([x, y, z]);
  }
  let steep = false;
  for (let i = 1; i < RIVER_FINE.length; i += 1) {
    const dz = Math.hypot(RIVER_FINE[i][0] - RIVER_FINE[i - 1][0], RIVER_FINE[i][1] - RIVER_FINE[i - 1][1]) || 1e-3;
    const isSteep = (riverY[i - 1] - riverY[i]) / dz > 0.7;
    if (steep && !isSteep) addFoam(RIVER_FINE[i][0], riverY[i], RIVER_FINE[i][1], 1);
    steep = isSteep;
  }
  addFoam(RIVER_FINE[0][0], riverY[0], RIVER_FINE[0][1], 0.6); // mạch nước
  { const [x, z] = RIVER_FINE[RIVER_FINE.length - 1]; addFoam(x, WATER_Y, z, 0.9); }

  // mảng bọt trắng loang (vẽ bằng canvas: nhiều bong bóng, mờ dần ra rìa) nằm trên mặt nước, xoay & phập phồng chậm
  function foamDecalTexture() {
    const N = 128; const r = mulberry32(77);
    const c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 260; i += 1) {
      const a = r() * Math.PI * 2; const d = Math.pow(r(), 0.7) * 0.46 * N;
      const x = N / 2 + Math.cos(a) * d; const y = N / 2 + Math.sin(a) * d; const rad = 2 + r() * 7 * (1 - d / (0.5 * N));
      const al = 0.35 + 0.55 * (1 - d / (0.5 * N));
      ctx.fillStyle = `rgba(255,255,255,${al.toFixed(2)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${(al * 0.8).toFixed(2)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, rad + 2, 0, Math.PI * 2); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const foamDecalTex = foamDecalTexture();
  const decals = []; const mists = [];
  function addFoamDecal(x, y, z, r) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ map: foamDecalTex, transparent: true, depthWrite: false, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.006, z); m.renderOrder = 2;
    island.add(m); decals.push({ m, phase: rand() * 6, r });
  }
  // sương: vài đám sáng mờ bốc lên từ chỗ nước đổ, to dần rồi tan
  function addMist(x, y, z, n, size) {
    for (let i = 0; i < n; i += 1) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFFFFF', transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
      island.add(sp); mists.push({ sp, x, y, z, size, phase: i / n, speed: 0.22 + rand() * 0.1, dx: (rand() - 0.5) * 0.3, dz: (rand() - 0.5) * 0.3 });
    }
  }
  // chân thác đổ vào ao: điểm dòng suối chạm mép nước
  const inflowIdx = RIVER_FINE.findIndex(([x, z]) => pondDist(x, z) < 0.97);
  const [ifx, ifz] = RIVER_FINE[Math.max(0, inflowIdx)];
  addFoamDecal(ifx, WATER_Y, ifz, 0.32); addFoamDecal(ifx + 0.12, WATER_Y, ifz + 0.14, 0.2);
  addMist(ifx, WATER_Y, ifz, 7, 0.55);
  for (let k = 0; k < 4; k += 1) emitters.push([ifx + (rand() - 0.5) * 0.15, WATER_Y, ifz + (rand() - 0.5) * 0.15]); // nhiều nước bắn hơn
  // các bậc thác trên suối
  let steep2 = false;
  for (let i = 1; i < RIVER_FINE.length; i += 1) {
    const dz = Math.hypot(RIVER_FINE[i][0] - RIVER_FINE[i - 1][0], RIVER_FINE[i][1] - RIVER_FINE[i - 1][1]) || 1e-3;
    const isSteep = (riverY[i - 1] - riverY[i]) / dz > 0.7;
    if (steep2 && !isSteep && i < inflowIdx - 4) { addFoamDecal(RIVER_FINE[i][0], riverY[i], RIVER_FINE[i][1], 0.14); addMist(RIVER_FINE[i][0], riverY[i], RIVER_FINE[i][1], 3, 0.3); }
    steep2 = isSteep;
  }
  // cửa tràn ra rãnh: đập chắn nhỏ bằng cành cây — khúc gỗ xếp so le chắn ngang rãnh, cành con chĩa ra, rêu bám;
  // nước tràn qua đỉnh đập (bọt + sương phía sau), che luôn chỗ nối ao ↔ rãnh
  {
    const DAM_X = (() => { for (let x = 1.6; x < 2.3; x += 0.01) if (pondDist(x, 0.7) > 1.0) return x; return 1.9; })();
    const DAM_Z = 0.705; const dam = new THREE.Group(); dam.position.set(DAM_X, WATER_Y, DAM_Z);
    const barkMat = mat('#7A5233', '#76695A'); const endMat = mat('#D9B98C', '#BDB3A2'); const mossMat = mat('#6FAE4E', '#9C9662');
    const logs = [[-0.012, 0.0, 0.04, 0.46], [0.022, 0.0, 0.035, 0.42], [0.005, 0.058, 0.032, 0.4], [0.03, 0.05, 0.026, 0.3]];
    logs.forEach(([dx, dy, r, len], i) => {
      const lg = new THREE.Group();
      const body = mesh(new THREE.CylinderGeometry(r, r * 1.08, len, 10), barkMat); lg.add(body);
      for (const sg of [-1, 1]) { const cap = mesh(new THREE.CircleGeometry(r * 0.96, 10), endMat, { cast: false }); cap.position.y = sg * len / 2 + sg * 0.001; cap.rotation.x = -sg * Math.PI / 2; lg.add(cap); }
      lg.rotation.set(Math.PI / 2, 0, (hash(i, 1, 4) - 0.5) * 0.25); // nằm ngang, chắn ngang rãnh (dọc trục z)
      lg.position.set(dx, dy + r * 0.6, (hash(i, 2, 4) - 0.5) * 0.05);
      dam.add(lg);
    });
    for (let i = 0; i < 6; i += 1) { // cành con chĩa ra
      const tw = mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.14 + hash(i, 3, 4) * 0.1, 5), barkMat);
      tw.position.set((hash(i, 4, 4) - 0.5) * 0.06, 0.07 + hash(i, 5, 4) * 0.04, (hash(i, 6, 4) - 0.5) * 0.36);
      tw.rotation.set((hash(i, 7, 4) - 0.5) * 1.6, hash(i, 8, 4) * 3, 0.6 + hash(i, 9, 4) * 0.8);
      dam.add(tw);
    }
    for (let i = 0; i < 4; i += 1) { // rêu bám trên đỉnh đập
      const ms = mesh(new THREE.IcosahedronGeometry(0.03 + hash(i, 1, 6) * 0.015, 1), mossMat);
      ms.scale.set(1.4, 0.45, 1); ms.position.set(0.01, 0.1, -0.15 + i * 0.1); dam.add(ms);
    }
    island.add(dam);
    addFoamDecal(DAM_X - 0.08, WATER_Y, DAM_Z, 0.13);   // nước dồn trước đập
    addFoamDecal(DAM_X + 0.1, WATER_Y, DAM_Z, 0.17);    // nước tràn qua đập
    addMist(DAM_X + 0.08, WATER_Y, DAM_Z, 3, 0.25);
    emitters.push([DAM_X + 0.06, WATER_Y + 0.02, DAM_Z]);
  }
  const edgeIdx = EDGE.reduce((best, [x, z], j) => (x > 0 && Math.abs(z - 0.71) < Math.abs(EDGE[best][1] - 0.71) ? j : best), 0);
  const edgeX = EDGE[edgeIdx][0] * 1.02;
  emitters.push([edgeX, WATER_Y, 0.71]);
  addMist(edgeX, WATER_Y - 0.15, 0.71, 4, 0.45); // sương ở chỗ thác dài rơi khỏi đảo

  // thác dài từ rãnh tràn rơi khỏi đảo xuống biển mây
  const edgeTex = streamTexture();
  edgeTex.repeat.set(1, 2.6);
  const edgeFallMat = new THREE.MeshBasicMaterial({ map: edgeTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const EDGE_H = 3.6;
  const edgeFall = new THREE.Mesh(new THREE.PlaneGeometry(0.32, EDGE_H), edgeFallMat);
  edgeFall.rotation.y = Math.PI / 2 - 0.1;
  edgeFall.position.set(edgeX + 0.03, WATER_Y - EDGE_H / 2 + 0.01, 0.71);
  island.add(edgeFall);
  const edgeMist = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false }));
  edgeMist.scale.set(0.7, 0.35, 1); edgeMist.position.set(edgeX + 0.05, WATER_Y + 0.05, 0.71);
  island.add(edgeMist);

  // hạt nước bắn lên ở các chân thác
  const SPLASH_N = 150;
  const splashPos = new Float32Array(SPLASH_N * 3); const splashVel = new Float32Array(SPLASH_N * 3); const splashLife = new Float32Array(SPLASH_N);
  for (let i = 0; i < SPLASH_N; i += 1) splashLife[i] = rand();
  const splashGeo = new THREE.BufferGeometry(); splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
  const splash = new THREE.Points(splashGeo, new THREE.PointsMaterial({ map: glowTex, color: '#FFFFFF', size: 0.07, transparent: true, opacity: 0.85, depthWrite: false }));
  island.add(splash);
  function stepSplash(dt) {
    for (let i = 0; i < SPLASH_N; i += 1) {
      const k = i * 3;
      splashLife[i] -= dt;
      if (splashLife[i] <= 0) {
        const [ex, ey, ez] = emitters[i % emitters.length];
        splashPos[k] = ex + (rand() - 0.5) * 0.12; splashPos[k + 1] = ey + 0.02; splashPos[k + 2] = ez + (rand() - 0.5) * 0.12;
        splashVel[k] = (rand() - 0.5) * 0.35; splashVel[k + 1] = 0.35 + rand() * 0.45; splashVel[k + 2] = (rand() - 0.5) * 0.35;
        splashLife[i] = 0.5 + rand() * 0.5;
      } else {
        splashVel[k + 1] -= 1.8 * dt;
        splashPos[k] += splashVel[k] * dt; splashPos[k + 1] += splashVel[k + 1] * dt; splashPos[k + 2] += splashVel[k + 2] * dt;
      }
    }
    splashGeo.attributes.position.needsUpdate = true;
  }

  // đá viền bờ hồ (chừa chỗ suối đổ vào và rãnh tràn)
  scalePts(POND, 1.1, POND_C).forEach(([x, z], i) => {
    if (riverDist(x, z) < 0.25 || segDist(SPILL, x, z) < 0.25 || i % 2) return;
    POND_STONES.push([x, z, 0.06 + hash(i, 2, 8) * 0.07]);
  });

  /* Đá: mô hình CC0 — Quaternius (Rock Medium rêu ×2), Kenney (Rock Flat, Rock Formation, Rock), Kay Lousberg (sỏi).
     Sườn núi: đá rêu + khối đá nhiều tầng + đá be; ven suối + bờ hồ: đá dẹt Kenney; sỏi ở cửa suối. */
  loadModel('stone_rock_moss', (part) => {
    const make = part();
    PEAK_ROCKS.forEach(([x, z, hh], i) => { if (i % 3 === 0) make(x, groundY(x, z) - hh * 0.2, z, hh, false); });
  });
  loadModel('stone_rock_moss2', (part) => {
    const make = part();
    PEAK_ROCKS.forEach(([x, z, hh], i) => { if (i % 3 === 1) make(x, groundY(x, z) - hh * 0.2, z, hh, false); });
  });
  /* Đá ở vách bậc thang: vùi phần lớn vào vách, nằm xuôi theo đường vách, chỉ lộ mặt trước —
     xen kẽ 3 kiểu: tảng lớn dẹt (Quaternius "Rock Large"), tảng khối (Quaternius "Rock"),
     và khối ghép = tảng "Rock" + 2–3 mảnh Kenney "Rock Formation" bám quanh. */
  const embedWall = (g, [x, z, , ang, nx, nz], { push = 0.06, sink = 0.5, hh, stretch = [1.3, 0.85, 1] }) => {
    g.position.set(x - nx * push, groundY(x, z) - hh * sink, z - nz * push); // lùi vào trong vách
    g.rotation.set((rand() - 0.5) * 0.25, ang + (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.3);
    g.scale.multiply(new THREE.Vector3(...stretch));
  };
  loadModel('stone_rock_large_red', (part) => {
    const make = part();
    WALL_ROCKS.forEach((w, i) => {
      if (i % 3 !== 0) return;
      const hh = w[2] * 1.05; embedWall(make(0, 0, 0, hh, false), w, { hh, sink: 0.55, push: 0.08, stretch: [1.25, 0.8, 0.9] });
    });
  });
  loadModel('stone_rock_red', (part) => {
    const make = part();
    WALL_ROCKS.forEach((w, i) => {
      if (i % 3 === 0) return;
      const hh = w[2] * (i % 3 === 2 ? 1.1 : 0.95); embedWall(make(0, 0, 0, hh, false), w, { hh, sink: 0.5, push: 0.06 });
    });
  });
  loadModel('stone_rock_formation', (part) => {
    const make = part();
    WALL_ROCKS.forEach((w, i) => {
      if (i % 3 !== 2) return;
      const [x, z, sz, ang, nx, nz] = w;
      const n = 2 + (i % 2);
      for (let j = 0; j < n; j += 1) {
        // mảnh nhỏ bám hai bên tảng chính, dọc theo vách
        const side = (j % 2 ? 1 : -1) * (0.09 + j * 0.04);
        const px = x + Math.cos(-ang) * side; const pz = z + Math.sin(-ang) * side;
        const hh = sz * (0.45 + hash(i, j, 3) * 0.25);
        embedWall(make(0, 0, 0, hh, false), [px, pz, sz, ang, nx, nz], { hh, sink: 0.45, push: 0.03 + j * 0.01, stretch: [1, 0.9, 1] });
      }
    });
  });
  // núi: mô hình CC0 Quaternius "Mountains" (cụm 3 mỏm), lún nhẹ vào gò chân núi, chiều dài xuôi theo mép sau đảo
  loadModel('mountains', (part) => {
    // đáy núi lún dưới điểm THẤP NHẤT của mặt đất trên cả chân núi → không hở ở chỗ đất trũng
    let baseY = Infinity;
    for (let i = -6; i <= 6; i += 1) for (let k = -3; k <= 3; k += 1) {
      baseY = Math.min(baseY, groundY(MOUNT_C[0] + (i / 6) * MOUNT_HALF[0], MOUNT_C[1] + (k / 3) * MOUNT_HALF[1]));
    }
    const g = part()(MOUNT_C[0], baseY - 0.06, MOUNT_C[1], 2.0, false);
    g.rotation.y = -0.05; // xuôi theo mép sau đảo
    g.scale.z *= 0.37; // dẹt bớt chiều sâu cho vừa phần sau đảo
    // màu gốc rất tối (đá xám đậm, đất gần đen) → đổi sang đá be ấm, tuyết kem, chân đất nâu nhạt
    const MOUNT_COLORS = { Stone: '#CBBBA6', Snow: '#FBF5EA', Dirt: '#B98D69' };
    g.traverse((o) => {
      if (!o.isMesh) return;
      const hex = MOUNT_COLORS[o.material.name]; if (!hex) return;
      const fresh = C(hex); o.material.color.copy(fresh);
      const e = tinted.find((t) => t.mat === o.material);
      if (e) { e.b = fresh; e.a = fresh.clone().multiply(TREE_WILT); }
    });
    applyHealth(h);
  });
  // cạnh núi: khối đá nhiều tầng (Kenney "Rock Formation") xen đá be (Kenney "Rock")
  loadModel('stone_rock_formation', (part) => {
    const make = part();
    PEAK_ROCKS.forEach(([x, z, hh], i) => { if (i % 3 === 2 && i % 2 === 0) make(x, groundY(x, z) - 0.04, z, 0.35 + hh * 1.2, false); });
  });
  loadModel('stone_rock_beige', (part) => {
    const make = part();
    PEAK_ROCKS.forEach(([x, z, hh], i) => { if (i % 3 === 2 && i % 2 === 1) make(x, groundY(x, z) - hh * 0.15, z, hh * 0.9, false); });
  });
  // cạnh sông + bờ ao: đá dẹt (Kenney "Rock Flat")
  loadModel('stone_rock_flat', (part) => {
    const make = part();
    // đá dẹt rộng ~9 lần chiều cao → chỉ đặt chỗ đất bằng dưới cả chân đá (không chìa ra trên mép nước / sườn dốc,
    // cũng không bị vùi). Chỗ còn dốc thì lùi dần ra xa nước tới khi gặp đất bằng.
    const footRange = (x, z, r) => {
      let lo = groundY(x, z); let hi = lo;
      for (let a = 0; a < 8; a += 1) { const y = groundY(x + Math.cos(a * 0.785) * r, z + Math.sin(a * 0.785) * r); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      return [lo, hi];
    };
    const placeFlat = (x, z, sh, ox, oz) => {
      for (let k = 0; k < 10; k += 1) {
        const px = x + ox * k * 0.04; const pz = z + oz * k * 0.04;
        const [lo, hi] = footRange(px, pz, sh * 4.5);
        if (hi - lo < sh * 1.5) { make(px, lo + (hi - lo) * 0.6 - sh * 0.1, pz, sh, false); return; }
      }
    };
    BANK_STONES.forEach(([x, z, hh, ox, oz]) => placeFlat(x, z, hh * 0.3, ox, oz));
    POND_STONES.forEach(([x, z, hh]) => {
      const dx = x - POND_C[0]; const dz = z - POND_C[1]; const L = Math.hypot(dx, dz) || 1;
      placeFlat(x, z, hh * 0.32, dx / L, dz / L); // bờ ao cũng dùng đá dẹt
    });
  });
  loadModel('stone_pebbles', (part) => {
    const make = part();
    const [mx, mz] = RIVER_FINE[RIVER_FINE.length - 12];
    [[mx + 0.22, mz + 0.05], [mx - 0.22, mz], [1.9, 0.98], [2.05, 0.46], [-1.5, 1.6], [-0.2, 1.95]].forEach(([x, z]) => {
      make(x, groundY(x, z) + 0.005, z, 0.02, false); // cụm sỏi rộng ~0.35
    });
  });
  const lotus = []; // lá sen (mô hình) — nạp ở phần hoa cỏ bên dưới

  // Đảo to gấp 1.5: địa hình (vách, mặt cỏ, tầng đá, hồ, thác) phóng theo cả nhóm; mọi thứ đặt lên đảo từ đây
  // trở đi được bù tỉ lệ để giữ nguyên kích thước thật, chỉ có khoảng cách giữa chúng giãn ra.
  const ISLAND_SCALE = 1.5;
  island.scale.setScalar(ISLAND_SCALE);
  const addToIsland = island.add.bind(island);
  addToIslandRaw = addToIsland;
  island.add = (...objs) => {
    objs.forEach((o) => o.scale.multiplyScalar(1 / ISLAND_SCALE));
    return addToIsland(...objs);
  };

  /* ---------- lối đá ---------- */
  const pathMat = mat('#F1E6D8', '#D8CFC4');
  for (let i = 0; i < 6; i += 1) {
    const s = mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.04, 7), pathMat, { cast: false });
    const px = -1.7 + i * 0.32; const pz = 1.85 - i * 0.12 - (i % 2) * 0.08;
    s.position.set(px, groundY(px, pz) + 0.01, pz);
    island.add(s);
  }

  /* ---------- đình nhỏ (kiểu ảnh mẫu 2) + đèn lồng ---------- */
  const pav = new THREE.Group();
  pav.position.set(0.75, groundY(0.75, -1.55), -1.55); // đình trên bậc thang trên cùng
  contactShadow(0.75, -1.55, 0.75);
  island.add(pav);
  slab(-0.42, 0.42, -0.42, 0.42, 0, 0.08, mat('#F2E2D2', '#D9D0C6'), pav);
  const pillarMat = mat('#F6D3BE', '#CFC2B6');
  for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) slab(x - 0.04, x + 0.04, z - 0.04, z + 0.04, 0.08, 0.62, pillarMat, pav);
  const roof = mesh(new THREE.ConeGeometry(0.66, 0.42, 4), mat('#E9967E', '#B49686'));
  roof.rotation.y = Math.PI / 4; roof.position.y = 0.83;
  pav.add(roof);
  const lanternMat = new THREE.MeshStandardMaterial({ color: '#FFD49A', emissive: '#FFB860', emissiveIntensity: 1.2 });
  const lantern = mesh(new THREE.SphereGeometry(0.07, 10, 8), lanternMat, { cast: false });
  lantern.position.y = 0.5;
  pav.add(lantern);
  const lanternLight = new THREE.PointLight('#FFC37A', 1.4, 2.6, 2);
  lanternLight.position.y = 0.5;
  pav.add(lanternLight);

  /* ---------- cây & bụi cây: mô hình CC0 của Quaternius (poly.pizza) ----------
     Bộ "Trees" (cây xanh, cây chính), bộ "Maple Trees" (phong đỏ), cây thân cao, bụi lá đỏ, bộ "Flower Bushes".
     Mỗi cây nằm trong nhóm `canopy` để co giãn theo health và đung đưa trong gió. */
  const trees = [];
  // gió: hoa/bụi cây đung đưa quanh gốc (plants), cỏ uốn ngọn bằng shader (windU = thời gian)
  const plants = []; const windU = { value: 0 };
  const TREE_WILT = C('#C9B48A');
  // đồ trang trí (ghế, rào, cầu, đèn): chỉnh màu về cùng tông gỗ ấm của đảo; không ngả màu theo tâm trạng
  const DECOR_COLORS = { decor_bench: '#9A6A43', decor_fence: '#A0714A', decor_bridge: '#B08154' };
  const decorGlow = [];
  function loadModel(file, cb) {
    if (!gltf) return;
    const callIdx = loadCalls++; let seq = 0;
    const ld = new gltf.GLTFLoader();
    ld.setMeshoptDecoder(gltf.MeshoptDecoder);
    ld.load(`/models/garden/${file}.glb`, (res) => {
      if (disposed) return;
      res.scene.updateMatrixWorld(true);
      res.scene.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        const m = o.material;
        if (m && !m.userData.tinted && file.startsWith('decor_')) {
          m.userData.tinted = true;
          m.metalness = 0; m.roughness = Math.max(m.roughness, 0.7);
          if (DECOR_COLORS[file]) m.color.set(DECOR_COLORS[file]);
          if (file === 'decor_lantern_post' && m.map) {
            // đèn lồng: phần sắt đen nâng lên nâu sẫm cho dịu; kính đèn tự sáng khi trời tối
            m.emissiveMap = m.map; m.emissive.set('#FFC77A'); m.emissiveIntensity = 0.05; decorGlow.push(m);
            m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.13, 0.095, 0.07));'); };
          }
        } else if (m && !m.userData.tinted) {
          m.userData.tinted = true;
          if (m.map) m.alphaTest = Math.max(m.alphaTest || 0, 0.4);
          m.metalness = 0; m.roughness = Math.max(m.roughness, 0.75);
          const base = m.color.clone();
          tinted.push({ mat: m, a: base.clone().multiply(TREE_WILT), b: base });
        }
      });
      // lấy một phần (theo tên) hoặc cả mô hình, đặt gốc ở chân, chuẩn hoá theo chiều cao
      const part = (name) => {
        const src = name ? res.scene.getObjectByName(name) : res.scene;
        const m = src.clone();
        if (name) src.matrixWorld.decompose(m.position, m.quaternion, m.scale);
        const holder = new THREE.Group(); holder.add(m);
        const box = new THREE.Box3().setFromObject(holder);
        const c = box.getCenter(new THREE.Vector3());
        m.position.x -= c.x; m.position.z -= c.z; m.position.y -= box.min.y;
        const height = box.max.y - box.min.y;
        return (x, y, z, targetH, sway = true, parent = island) => {
          const inner = holder.clone();
          inner.scale.setScalar(targetH / height);
          const canopy = new THREE.Group(); canopy.add(inner);
          const g = new THREE.Group(); g.add(canopy);
          g.position.set(x, y, z); g.rotation.y = rand() * Math.PI * 2;
          parent.add(g);
          if (sway) contactShadow(x, z, targetH * 0.24);
          if (sway) trees.push({ g, canopy, phase: rand() * 6 });
          else if (/^(flora|tree|bush)/.test(file) && !/lilies|nenuphar/.test(file) && !parent.userData.thumb) {
            plants.push({ canopy, phase: x * 1.7 + z * 1.1 + rand() * 0.8, amp: (targetH < 0.45 ? 0.07 : 0.035) * (0.8 + rand() * 0.4) });
          }
          // cây / bụi / hoa có sẵn trên đảo lớn: cho phép người dùng dời chỗ hoặc cất đi
          if (parent === island && !regSuppressed && /^(tree_|flora_|flora2_|decor_)/.test(file) && !/lilies|nenuphar/.test(file)) {
            registerDefault(`${file}#${callIdx}:${seq++}`, g, { r: Math.min(0.3, Math.max(0.05, targetH * 0.16)), file, part: name || null, aging: /^tree_|^flora_bush_flowers$/.test(file) });
          }
          return g;
        };
      };
      cb(part);
      applyHealth(h);
      wake();
    });
  }
  const TREE_SCALE = 1.35; // cây to hơn
  // cây phong đỏ (bộ "Maple Trees") cạnh bãi cỏ trái
  loadModel('tree_pack_maple', (part) => {
    part('MapleTree_2')(-2.05, groundY(-2.05, 1.35), 1.35, 1.45 * TREE_SCALE);
    part('MapleTree_4')(1.95, groundY(1.95, -0.35), -0.35, 0.75 * TREE_SCALE);
  });
  loadModel('tree_tree_tall', (part) => part()(2.0, groundY(2.0, -1.2), -1.2, 1.75 * TREE_SCALE));
  loadModel('tree_pack_trees', (part) => {
    part('NormalTree_2')(-1.35, groundY(-1.35, 0.55), 0.55, 1.7 * TREE_SCALE); // cây chính giữa bãi cỏ
    part('NormalTree_5')(-1.85, groundY(-1.85, -0.35), -0.35, 0.8 * TREE_SCALE);
    part('NormalTree_1')(-0.6, groundY(-0.6, -1.2), -1.2, 1.35 * TREE_SCALE);
    part('NormalTree_3')(1.3, groundY(1.3, -1.75), -1.75, 1.05 * TREE_SCALE);
    part('NormalTree_4')(-2.05, groundY(-2.05, -1.3), -1.3, 0.95 * TREE_SCALE);
  });
  // Đặt đồ vật cho "ngồi" chắc trên đất: xét cả vùng dưới tán (bán kính r, toạ độ đảo), không chỉ điểm giữa
  const footRangeAt = (x, z, r) => {
    let lo = groundY(x, z); let hi = lo;
    for (let a = 0; a < 8; a += 1) { const y = groundY(x + Math.cos(a * 0.785) * r, z + Math.sin(a * 0.785) * r); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    return [lo, hi];
  };
  const SETTLE_IN = scalePts(OUTLINE, 0.88);
  // tìm chỗ đất bằng gần (x, z) nhất (dò vòng ra xa dần) → [x, z, y đặt (lún nhẹ dưới điểm thấp nhất)] hoặc null
  function settle(x, z, r, tol = 0.06) {
    for (let ring = 0; ring <= 5; ring += 1) {
      for (let a = 0; a < (ring ? 8 : 1); a += 1) {
        const px = x + Math.cos(a * 0.785 + ring) * ring * 0.09; const pz = z + Math.sin(a * 0.785 + ring) * ring * 0.09;
        if (!inPoly(SETTLE_IN, px, pz) || inMountain(px, pz, 0.1) || riverDist(px, pz) < 0.2 || pondDist(px, pz) < 1.12 || segDist(SPILL, px, pz) < 0.2) continue;
        const [lo, hi] = footRangeAt(px, pz, r);
        if (hi - lo < tol) return [px, pz, lo - 0.012];
      }
    }
    return null;
  }
  // bụi cây: xen kẽ bụi lá xanh, bụi hoa, bụi cánh hoa và vài bụi lá đỏ
  // vị trí bụi cây: [x, z, cao] → dời vào chỗ đất bằng gần nhất (không chìa ra mép vách), bỏ nếu không có chỗ
  const BUSH_SPOTS = [[-1.7, -0.4, 0.34], [-0.6, -0.12, 0.26], [-0.3, -0.3, 0.32], [1.15, -0.25, 0.28], [2.15, -0.75, 0.34],
    [-2.15, 0.05, 0.3], [1.25, -1.35, 0.3], [-0.55, -0.75, 0.22], [0.05, -0.55, 0.26], [-2.0, 0.6, 0.3]].map(([x, z, hh]) => {
    const st = settle(x, z, hh * 0.45);
    return st ? [st[0], st[1], hh, st[2]] : null;
  });
  // bụi ở chân gốc dây leo: trên mặt cỏ ngay sau mép, chỗ dây mọc dày (giữa các mảng dây leo)
  const ROOT_BUSHES = [];
  for (let jf = 3; jf < NE; jf += 10) {
    if (vineZone(jf) < 0.45) continue;
    const f = edgeFrameAt(jf);
    const st = settle(f.x - f.nx * 0.17, f.z - f.nz * 0.17, 0.09, 0.07);
    if (!st) continue;
    ROOT_BUSHES.push([st[0], st[1], 0.17 + hash(Math.round(jf), 4, 7) * 0.12, st[2], ['Plant_2', 'Plant_Flowers', 'Plant_2', 'red'][ROOT_BUSHES.length % 4]]);
  }
  const BUSH_KINDS = ['Plant_2', 'Plant_Flowers', 'red', 'Plant_2', 'Petals_1', 'Plant_Flowers', 'Plant_2', 'red', 'Plant_Flowers', 'Petals_1'];
  loadModel('tree_pack_flower_bushes', (part) => {
    const makers = { Plant_2: part('Plant_2'), Plant_Flowers: part('Plant_Flowers'), Petals_1: part('Petals_1') };
    ROOT_BUSHES.forEach(([x, z, hgt, y, k]) => { if (makers[k]) { makers[k](x, y, z, hgt * 1.2, false); contactShadow(x, z, hgt * 0.7); } });
    BUSH_SPOTS.forEach((b, i) => { if (!b) return; const [x, z, hgt, y] = b; const k = BUSH_KINDS[i % BUSH_KINDS.length]; if (makers[k]) { makers[k](x, y, z, hgt * 1.2 * (k === 'Petals_1' ? 0.8 : 1.1), false); contactShadow(x, z, hgt * 0.75); } });
  });
  loadModel('tree_bush_red', (part) => {
    const make = part();
    ROOT_BUSHES.forEach(([x, z, hgt, y, k]) => { if (k === 'red') { make(x, y, z, hgt * 1.1, false); contactShadow(x, z, hgt * 0.7); } });
    BUSH_SPOTS.forEach((b, i) => { if (!b) return; const [x, z, hgt, y] = b; if (BUSH_KINDS[i % BUSH_KINDS.length] === 'red') { make(x, y, z, hgt * 1.2, false); contactShadow(x, z, hgt * 0.75); } });
  });

  const stemMat = mat('#5DAE5F', '#9A9462');

  /* ---------- hoa nhỏ, cỏ, nấm, lá rụng ---------- */
  const OUT_IN = scalePts(OUTLINE, 0.9); const POND_OUT = scalePts(POND, 1.2, POND_C);
  const free = (x, z) => inPoly(OUT_IN, x, z) && pondDist(x, z) > 1.15 && riverDist(x, z) > 0.22 && segDist(SPILL, x, z) > 0.22
    && slopeAt(x, z) < 0.9 && peaks(x, z) < 0.25 && !inMountain(x, z, 0.15) && Math.hypot(x - 0.75, z + 1.55) > 0.5
    && Math.hypot(x + 1.35, z + 1.4) > 0.55 && Math.hypot(x + 1.35, z - 0.55) > 0.35 && Math.abs(x - 0.85) + Math.abs(z + 0.5) > 0.4
    && (() => { const [lo, hi] = footRangeAt(x, z, 0.1); return hi - lo < 0.045; })();
  const footY = (x, z, r = 0.09) => footRangeAt(x, z, r)[0] - 0.01;
  function scatter(n) {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard < 2000) {
      guard += 1;
      const x = -2.5 + rand() * 5; const z = -2.6 + rand() * 5.2;
      if (free(x, z)) pts.push([x, z]);
    }
    return pts;
  }
  /* Hoa & cỏ: mô hình CC0 "Stylized Nature" của Quaternius (poly.pizza), nén meshopt + webp.
     Mỗi loại tải một lần rồi nhân bản; vườn càng khoẻ hoa càng nhiều, héo thì ngả vàng úa và rủ xuống. */
  const FLORA = {
    grass: { h: 0.2 }, grass_tall: { h: 0.32 }, grass_small: { h: 0.15 }, small_plant: { h: 0.07 },
    flower_single_pink: { h: 0.3 }, flower_single_yellow: { h: 0.3 }, flower_group_pink: { h: 0.34 }, flower_group_yellow: { h: 0.34 },
    plant_purple: { h: 0.14 }, plant_big_purple: { h: 0.17 }, bush_flowers: { h: 0.4 }, lilypad: { w: 0.34 }
  };
  const GRASS_KINDS = ['grass', 'grass_tall', 'grass_small', 'small_plant'];
  const FLOWER_KINDS = ['flower_single_pink', 'flower_group_pink', 'flower_single_yellow', 'plant_purple', 'flower_group_yellow', 'plant_big_purple', 'bush_flowers'];
  // khóm hoa lớn làm điểm nhấn (thay cho hoa khổng lồ cũ): [x, z, tỉ lệ, ngưỡng health]
  const FEATURE = {
    flower_group_pink: [[-0.55, 1.55, 1.2, 0.05]],
    plant_big_purple: [[-0.1, -0.95, 1, 0.3]], // hoa tím: chỉ 1 khóm điểm nhấn, không rải thêm
    flower_group_yellow: [[-1.95, 1.75, 1.1, 0.5]],
    bush_flowers: []
  };
  const flowers = [];
  const grassSpots = scatter(22);
  // hàng cây cỏ thấp sát chân gốc dây leo (che chỗ dây trồi lên khỏi đất), chỉ trong các mảng dây
  const ROOT_KINDS = ['grass', 'small_plant', 'flower_single_pink', 'grass_tall', 'flower_single_yellow', 'small_plant', 'plant_purple', 'grass'];
  // đặt đúng điểm sợi dây trồi lên khỏi đất (bỏ bớt điểm quá sát nhau)
  const ROOT_PLANTS = [];
  VINE_ROOTS.forEach(([x, z, hl], i) => {
    if (ROOT_PLANTS.some(([px, pz]) => Math.hypot(px - x, pz - z) < 0.075)) return;
    ROOT_PLANTS.push([x, z, ROOT_KINDS[i % ROOT_KINDS.length], 0.7 + Math.min(0.6, hl) * 0.8]);
  });
  const flowerSpots = scatter(9);
  const WILT = C('#CDBB8A');
  if (gltf) {
    const floraLoader = new gltf.GLTFLoader();
    floraLoader.setMeshoptDecoder(gltf.MeshoptDecoder);
    const place = (name, cb) => floraLoader.load(`/models/garden/flora_${name}.glb`, (res) => {
      if (disposed) return;
      const proto = res.scene;
      const box = new THREE.Box3().setFromObject(proto);
      const size = box.getSize(new THREE.Vector3());
      const k = FLORA[name].w ? FLORA[name].w / Math.max(size.x, size.z) : FLORA[name].h / size.y;
      proto.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        const m = o.material;
        if (m && !m.userData.tinted) {
          m.userData.tinted = true;
          if (m.map) m.alphaTest = Math.max(m.alphaTest || 0, 0.4);
          m.metalness = 0; m.roughness = Math.max(m.roughness, 0.75);
          const base = m.color.clone();
          tinted.push({ mat: m, a: base.clone().multiply(WILT), b: base });
        }
      });
      let seq = 0;
      const make = (x, y, z, sc = 1) => {
        const inner = proto.clone();
        inner.scale.setScalar(k * sc); inner.position.y = -box.min.y * k * sc;
        const g = new THREE.Group(); g.add(inner);
        g.position.set(x, y, z); g.rotation.y = rand() * Math.PI * 2;
        island.add(g);
        if (name !== 'lilypad') registerDefault(`fl:${name}:${seq++}`, g, { r: 0.06, file: `flora_${name}`, part: null, aging: name === 'bush_flowers' });
        return g;
      };
      cb(make);
      applyHealth(h);
      wake();
    });
    GRASS_KINDS.forEach((name, gi) => place(name, (make) => {
      ROOT_PLANTS.filter((r) => r[2] === name).forEach(([x, z, , sc]) => make(x, footY(x, z, 0.05), z, sc));
      grassSpots.filter((_, i) => i % GRASS_KINDS.length === gi).forEach(([x, z]) => make(x, footY(x, z), z, 0.8 + rand() * 0.5));
    }));
    FLOWER_KINDS.forEach((name, fi) => place(name, (make) => {
      ROOT_PLANTS.filter((r) => r[2] === name).forEach(([x, z, , sc]) => {
        flowers.push({ g: make(x, footY(x, z, 0.05), z, sc * 0.85), s0: 1 / ISLAND_SCALE, threshold: 0.15 + hash(Math.round(x * 50), 1, 1) * 0.4, tilt: rand() * Math.PI * 2 });
      });
      flowerSpots.filter((_, i) => i % FLOWER_KINDS.length === fi && name !== 'plant_big_purple').forEach(([x, z], j) => {
        contactShadow(x, z, 0.13);
        flowers.push({ g: make(x, footY(x, z), z, 0.85 + rand() * 0.4), s0: 1 / ISLAND_SCALE, threshold: (((fi * 3 + j * 7) % 9) / 9) * 0.85, tilt: rand() * Math.PI * 2 });
      });
      (FEATURE[name] || []).forEach(([x, z, sc, threshold]) => {
        flowers.push({ g: make(x, footY(x, z, 0.14), z, sc), s0: 1 / ISLAND_SCALE, threshold, tilt: rand() * Math.PI * 2 });
      });
    }));
    place('lilypad', (make) => {
      [[0.55, 0.45, 1], [1.3, 1.1, 0.85], [1.5, 0.35, 0.75]].forEach(([x, z, sc]) => lotus.push(make(x, 0.235, z, sc)));
    });
  }

  /* Hoa lẫn trong cỏ + hoa trên ao + bụi hoa thêm:
     - Bộ hoa li ti (Quaternius, CC0) & "Pastel Plume Flowers" (Danni Bittman, CC-BY): rải lẫn trong lớp cỏ
     - "Desert marigold", "Flower" cúc trắng (Poly by Google), "tulip 3" (Hugo Gibson) — CC-BY; thêm hoa đơn/khóm hoa Quaternius
     - Ao: "Water lilies" (Poly by Google), "Nenuphar" (Nicolas Comtois) — CC-BY
     - Bụi có hoa (Quaternius, CC0) thêm vài bụi
     Hoa nở / rủ theo tâm trạng như các hoa khác. */
  const MIX_SPOTS = scatter(64);
  const addFlower = (g, i) => flowers.push({ g, s0: g.scale.x, threshold: (((i * 7) % 13) / 13) * 0.8, tilt: rand() * Math.PI * 2 });
  const TINY_PARTS = ['Flower_5_Clump', 'Flower_4_Clump', 'Flower_3_Clump', 'Flower_2_Clump', 'Flower_2', 'Flower_1_Clump', 'Flower_1'];
  // phân loại vị trí: 0 li ti, 1 lông vũ pastel, 2 cúc vàng, 3 tulip, 4 cúc trắng, 5–7 hoa Quaternius
  const MIX_KIND = (i) => [0, 1, 0, 2, 0, 3, 1, 4, 0, 5, 1, 6, 0, 7, 4, 3][i % 16];
  const mixAt = (k, cb) => MIX_SPOTS.forEach(([x, z], i) => { if (MIX_KIND(i) === k) cb(x, z, i); });
  loadModel('flora2_tiny_flowers', (part) => {
    const makers = TINY_PARTS.map((n) => part(n));
    mixAt(0, (x, z, i) => addFlower(makers[i % makers.length](x, footY(x, z, 0.05), z, 0.12 + hash(i, 1, 6) * 0.07, false), i));
  });
  [['flora2_pastel_plume', 1, 0.3], ['flora2_marigold', 2, 0.28], ['flora2_tulip3', 3, 0.3], ['flora2_daisy_white', 4, 0.3],
    ['flora_flower_single_yellow', 5, 0.3], ['flora_flower_group_pink', 6, 0.34], ['flora_flower_single_pink', 7, 0.3]].forEach(([file, k, hh]) => {
    loadModel(file, (part) => {
      const make = part();
      mixAt(k, (x, z, i) => addFlower(make(x, footY(x, z, 0.06), z, hh * (0.8 + hash(i, 2, 6) * 0.4), false), i));
    });
  });
  // ao: cụm súng khổng lồ + hoa súng nở, nổi trên mặt nước
  loadModel('flora2_water_lilies', (part) => {
    const make = part();
    [[0.62, 1.0, 0.024], [1.42, 0.62, 0.018]].forEach(([x, z, hh]) => make(x, WATER_Y + 0.004, z, hh, false));
  });
  loadModel('flora2_nenuphar', (part) => {
    const make = part();
    [[0.95, 0.35, 0.1], [1.2, 1.2, 0.085], [0.45, 0.72, 0.075], [1.62, 0.95, 0.07]].forEach(([x, z, hh]) => make(x, WATER_Y - 0.01, z, hh, false));
  });
  // thêm bụi có hoa
  loadModel('flora_bush_flowers', (part) => {
    const make = part();
    [[-1.3, 1.85], [0.3, 1.75], [-2.1, 0.95], [1.65, -0.5], [-1.2, -0.15]].forEach(([x, z], i) => {
      const st = settle(x, z, 0.12); if (!st) return;
      make(st[0], st[2], st[1], 0.32 + hash(i, 3, 6) * 0.1, false); contactShadow(st[0], st[1], 0.22);
    });
  });

  /* Lớp cỏ phủ mặt đất: mô hình "grass mix" (Steve B, CC-BY 3.0) rải theo lưới so le phủ kín mặt đảo,
     tránh ao, suối, rãnh thác, chân núi, vách dốc, lối dốc, đình. Mỗi phần màu vẽ bằng 1 InstancedMesh. */
  if (gltf) {
    const ld = new gltf.GLTFLoader(); ld.setMeshoptDecoder(gltf.MeshoptDecoder);
    ld.load('/models/garden/grass_mix.glb', (res) => {
      if (disposed) return;
      res.scene.updateMatrixWorld(true);
      const parts = [];
      res.scene.traverse((o) => {
        if (!o.isMesh) return;
        const geo = o.geometry.clone();
        ['position', 'normal'].forEach((name) => { // số nguyên nén → số thực
          const at = geo.getAttribute(name); if (!at) return;
          const arr = new Float32Array(at.count * at.itemSize);
          for (let i = 0; i < at.count; i += 1) for (let c = 0; c < at.itemSize; c += 1) arr[i * at.itemSize + c] = at.getComponent(i, c);
          geo.setAttribute(name, new THREE.BufferAttribute(arr, at.itemSize));
        });
        geo.applyMatrix4(o.matrixWorld);
        parts.push({ geo, mat: o.material.clone() });
      });
      if (!parts.length) return;
      // chuẩn hoá chung: tâm ở giữa đáy, bề rộng lớn nhất = 1
      const box = new THREE.Box3(); parts.forEach((pt) => { pt.geo.computeBoundingBox(); box.union(pt.geo.boundingBox); });
      const wid = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      parts.forEach((pt) => { pt.geo.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2); pt.geo.scale(1 / wid, 1 / wid, 1 / wid); });
      // vị trí: lưới so le + lệch ngẫu nhiên
      const mats = []; const o3 = new THREE.Object3D(); const IN = scalePts(OUTLINE, 0.93);
      for (let gz = -2.6; gz <= 2.6; gz += 0.24) {
        for (let gx = -2.6; gx <= 2.6; gx += 0.25) {
          const k = Math.round((gx + 3) * 31 + (gz + 3) * 977);
          const x = gx + (Math.round(gz / 0.24) % 2) * 0.125 + (hash(k, 1, 3) - 0.5) * 0.14; const z = gz + (hash(k, 2, 3) - 0.5) * 0.14;
          if (!inPoly(IN, x, z) || pondDist(x, z) < 1.1 || riverDist(x, z) < 0.18 || segDist(SPILL, x, z) < 0.18) continue;
          if (inMountain(x, z, 0.05) || slopeAt(x, z) > 0.85 || steps(x, z).ramp > 0.3 || Math.hypot(x - 0.75, z + 1.55) < 0.48) continue;
          const sc = 0.32 + hash(k, 3, 3) * 0.14; // nhỏ hơn, lưới dày hơn để vẫn phủ kín
          o3.position.set(x, footRangeAt(x, z, sc * 0.35)[0] - 0.005, z);
          o3.rotation.set(0, hash(k, 4, 3) * Math.PI * 2, 0);
          o3.scale.set(sc, sc * (0.45 + hash(k, 5, 3) * 0.3), sc); // ngọn cỏ thấp xuống
          o3.updateMatrix(); mats.push(o3.matrix.clone());
        }
      }
      // cùng màu nền cỏ để lớp cỏ liền với mặt đất
      const TONES = ['#A3D96F', '#8FCB63']; // tông nền cỏ, đậm hơn một chút
      parts.forEach((pt, pi) => {
        pt.mat.metalness = 0; pt.mat.roughness = 1; pt.mat.side = THREE.DoubleSide;
        const fresh = C(TONES[pi % TONES.length]); pt.mat.color.copy(fresh);
        // ngọn cỏ đứng nghiêng nên nhận nắng ít hơn mặt đất → bù chút tự sáng cùng màu để không bị sẫm hơn nền
        pt.mat.emissive.copy(fresh); pt.mat.emissiveIntensity = 0.12;
        // gió: ngọn cỏ nghiêng theo làn sóng gió lướt qua đảo (gốc đứng yên, ngọn lắc nhiều)
        pt.mat.onBeforeCompile = (sh) => {
          sh.uniforms.uWind = windU;
          sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
            #ifdef USE_INSTANCING
              vec2 wp = instanceMatrix[3].xz;
            #else
              vec2 wp = vec2(0.0);
            #endif
            float wv = sin(uWind * 1.7 + wp.x * 1.3 + wp.y * 0.9) * 0.6 + sin(uWind * 2.9 + wp.x * 2.1) * 0.25;
            float gust = 0.65 + 0.35 * sin(uWind * 0.37 + wp.y * 0.4);
            float bendW = transformed.y * transformed.y * 0.35 * gust;
            transformed.x += wv * bendW; transformed.z += wv * bendW * 0.5;`);
        };
        tinted.push({ mat: pt.mat, a: fresh.clone().multiply(TREE_WILT), b: fresh, emissiveToo: true });
        const im = new THREE.InstancedMesh(pt.geo, pt.mat, mats.length);
        mats.forEach((m, i) => im.setMatrixAt(i, m));
        im.castShadow = true; im.receiveShadow = true; // ngọn cỏ đổ bóng xuống mặt đất
        addToIslandRaw(im);
      });
      applyHealth(h); wake();
    });
  }

  const capMat = mat('#EE8FA0', '#B89290');
  const mushStemMat = mat('#FFF3E6', '#E3DAD0');
  for (const [x, z, s] of [[-1.0, 0.95, 1], [-0.9, 1.1, 0.7], [-1.75, 0.95, 0.8]]) {
    const gy = groundY(x, z);
    contactShadow(x, z, 0.09 * s);
    const st = mesh(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.1 * s, 6), mushStemMat); st.position.set(x, gy + 0.05 * s, z); island.add(st);
    const cap = mesh(new THREE.SphereGeometry(0.08 * s, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), capMat); cap.position.set(x, gy + 0.1 * s, z); island.add(cap);
  }

  const leafMat = new THREE.MeshStandardMaterial({ color: '#C08A55', flatShading: false });
  const fallenLeaves = scatter(18).map(([x, z]) => {
    const l = mesh(new THREE.BoxGeometry(0.08, 0.01, 0.04), leafMat, { cast: false });
    l.position.set(x, groundY(x, z) + 0.01, z); l.rotation.y = rand() * 3;
    island.add(l);
    return l;
  });

  /* ---------- con vật nhỏ: thỏ, vịt, bướm, chim ----------
     Dựng bằng khối tròn mềm (cùng phong cách đảo), chuyển động bằng code: không cần tải mô hình ngoài. */
  const ball = new THREE.SphereGeometry(1, 16, 12);
  const solid = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  const eyeMat = solid('#2B2420', { roughness: 0.35 });
  const pinkMat = solid('#F6B8C8');
  function part(m, sx, sy, sz, x, y, z, parent) {
    const o = mesh(ball, m, { receive: false });
    o.scale.set(sx, sy, sz); o.position.set(x, y, z);
    parent.add(o);
    return o;
  }

  // Thú thật (mô hình CC0 "Animated Animal Pack" của Quaternius, poly.pizza) có sẵn chuyển động
  // Walk / Idle / Eating. Mỗi con tự chọn điểm đến ngẫu nhiên trên bãi cỏ, đi tới (vừa đi vừa rẽ mượt),
  // đến nơi thì đứng nghỉ hoặc cúi ăn cỏ một lúc rồi chọn chỗ khác — không đi theo đường cố định.
  // con vật quen dần: vuốt ve / cho ăn / cùng thở → lần sau mở vườn tự chạy lại gần (lưu trên máy, không có điểm số)
  const BOND_KEY = 'pf.garden.bond';
  const bond = (() => { try { return JSON.parse(localStorage.getItem(BOND_KEY)) || {}; } catch { return {}; } })();
  const addBond = (id, n = 1) => { bond[id] = Math.min(50, (bond[id] || 0) + n); try { localStorage.setItem(BOND_KEY, JSON.stringify(bond)); } catch { /* bỏ qua */ } };
  const fire = (type, data = {}) => timeOpts.onEvent?.({ type, ...data });
  const _hp = new THREE.Vector3();
  const critters = [];
  const CRITTERS = [
    { file: 'fox', length: 0.5, threshold: 0.3, spot: [-0.9, 1.6], speed: 0.22, roam: true },
    { file: 'shiba', length: 0.5, threshold: 0.45, spot: [-0.7, 0.3], speed: 0.27, roam: true },
    { file: 'deer', length: 0.7, threshold: 0.55, spot: [1.72, 1.68], speed: 0.13, roam: true },
    { file: 'sheep', length: 0.42, threshold: 0, spot: [-0.72, -0.02], face: 0.9 } // chỉ có Idle → đứng gặm cỏ, thỉnh thoảng xoay
  ];
  // chỗ đi được: trong đảo, không xuống hồ, không leo tầng đá, tránh gốc cây
  const TREE_SPOTS = [[-1.35, 0.55], [2.0, -1.2], [-1.85, -0.35], [-2.05, 1.35], [1.95, -0.35], [-0.6, -1.2], [1.3, -1.75], [-2.05, -1.3], [0.75, -1.55]];
  const walkable = (x, z) => inPoly(OUT_IN, x, z) && pondDist(x, z) > 1.12 && riverDist(x, z) > 0.2 && segDist(SPILL, x, z) > 0.2
    && slopeAt(x, z) < 1.3 && peaks(x, z) < 0.2 && !inMountain(x, z, 0.2)
    && TREE_SPOTS.every(([tx, tz]) => Math.hypot(x - tx, z - tz) > 0.24);
  function pathClear(x0, z0, x1, z1) {
    for (let i = 1; i <= 10; i += 1) {
      const k = i / 10;
      if (!walkable(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k)) return false;
    }
    return true;
  }
  // đầu dưới / đầu trên của lối dốc
  const rampEnds = (k, rx) => {
    const lv = k === 0 ? STEP1 : STEP2;
    return [[rx, wallZ(rx, lv - 0.45)], [rx, wallZ(rx, lv + 0.45)]];
  };
  // tìm đường tới (tx, tz); khác tầng thì đi vòng qua lối dốc gần nhất (mỗi vách một lần)
  function routeTo(c, tx, tz) {
    const { x, z } = c.g.position;
    if (!walkable(tx, tz)) return false;
    const route = []; let cx = x; let cz = z;
    let L = levelAt(x, z); const Lt = levelAt(tx, tz);
    while (L !== Lt) {
      const up = Lt > L; const k = up ? L : L - 1;
      const rx = RAMPS[k].reduce((best, v) => (Math.abs(v - cx) < Math.abs(best - cx) ? v : best), RAMPS[k][0]);
      const [bot, top] = rampEnds(k, rx);
      for (const [px, pz] of (up ? [bot, top] : [top, bot])) {
        if (!walkable(px, pz) || !pathClear(cx, cz, px, pz)) return false;
        route.push([px, pz]); cx = px; cz = pz;
      }
      L += up ? 1 : -1;
    }
    if (!pathClear(cx, cz, tx, tz)) return false;
    route.push([tx, tz]);
    const [fx, fz] = route.shift();
    c.tx = fx; c.tz = fz; c.route = route;
    return true;
  }
  // một chỗ trên bãi cỏ phía người xem (con vật quen thì hay lại gần đây)
  const _camI = new THREE.Vector3();
  function frontSpot(spread = 0.5) {
    island.worldToLocal(_camI.copy(camera.position)); const a0 = Math.atan2(_camI.z, _camI.x);
    for (let i = 0; i < 30; i += 1) {
      const a = a0 + (rand() - 0.5) * spread * 2; const r = 0.9 + rand() * 1.3;
      const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      if (walkable(x, z)) return [x, z];
    }
    return null;
  }
  // chọn điểm đến ngẫu nhiên trên đảo; con vật đã quen thì hay lảng vảng gần phía người xem
  function pickTarget(c) {
    const { x, z } = c.g.position; const near = Math.min(0.45, (bond[c.file] || 0) * 0.04);
    for (let tries = 0; tries < 40; tries += 1) {
      let tx; let tz;
      if (rand() < near) { const f = frontSpot(0.6); if (!f) continue; [tx, tz] = f; }
      else { const a = rand() * Math.PI * 2; const r = 0.6 + rand() * 2.4; tx = x + Math.cos(a) * r; tz = z + Math.sin(a) * r; }
      if (routeTo(c, tx, tz)) return true;
    }
    c.tx = c.spot[0]; c.tz = c.spot[1]; c.route = [];
    return false;
  }
  // tạo một con vật (mặc định hoặc người dùng thả thêm từ kho đồ); onReady(c) khi tải xong
  function spawnCritter(cfg, id, onReady) {
    if (!gltf) return;
    const loader = new gltf.GLTFLoader();
    loader.setMeshoptDecoder(gltf.MeshoptDecoder);
    {
      loader.load(`/models/garden/${cfg.file}.glb`, (res) => {
        if (disposed) return;
        const model = res.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const k = cfg.length / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(k);
        model.position.y = -box.min.y * k;
        model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; if (o.material) { o.material.metalness = 0; o.material.roughness = Math.max(o.material.roughness, 0.75); } } });
        const g = new THREE.Group(); g.add(model);
        const mixer = new THREE.AnimationMixer(model);
        const acts = {};
        res.animations.forEach((clip) => { acts[clip.name] = mixer.clipAction(clip); });
        // khách ghé thăm (thỏ, ếch, nhím) đặt tên hoạt ảnh khác → quy về tên chung
        if (!acts.Idle && acts.Frog_Idle) acts.Idle = acts.Frog_Idle;
        if (!acts.Walk && acts.Frog_Jump) acts.Walk = acts.Frog_Jump;
        if (!acts.Jump_ToIdle && (acts.Jump || acts.Frog_Jump)) acts.Jump_ToIdle = acts.Wave || acts.Jump || acts.Frog_Jump;
        const c = { ...cfg, g, mixer, acts, cur: null, state: 'eat', timer: 1 + rand() * 4, baseScale: k };
        g.position.set(cfg.spot[0], groundY(cfg.spot[0], cfg.spot[1]), cfg.spot[1]);
        g.rotation.y = cfg.face ?? rand() * Math.PI * 2;
        island.add(g);
        contactShadow(0, 0, cfg.length * 0.42, g);
        critters.push(c);
        play(c, 'Eating');
        c.id = id;
        if (onReady) onReady(c); else registerDefault(id, g, { critter: c, r: cfg.length * 0.4, cat: `animal_${cfg.file}` });
        if (controls && c.roam && (bond[c.file] || 0) >= 3) { // đã quen: thấy bạn mở vườn là chạy lại gần, ngồi chờ
          const f = frontSpot(0.35);
          if (f && routeTo(c, f[0], f[1])) { c.state = 'walk'; c.timer = 16; c.arrive = 'call'; play(c, 'Walk'); }
        }
        applyHealth(h);
        wake();
      });
    }
  }
  CRITTERS.forEach((cfg) => spawnCritter(cfg, `animal:${cfg.file}`));
  function play(c, name) {
    const next = c.acts[name] || c.acts.Idle || Object.values(c.acts)[0];
    if (!next || next === c.cur) return;
    next.setLoop(THREE.LoopRepeat, Infinity); next.clampWhenFinished = false;
    next.reset().fadeIn(0.35).play();
    if (c.cur) c.cur.fadeOut(0.35);
    c.cur = next;
  }
  const turnToward = (obj, want, rate) => {
    let d = want - obj.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    obj.rotation.y += d * Math.min(1, rate);
    return Math.abs(d);
  };
  // chơi một động tác một lần (nhảy mừng…), xong thì gọi then()
  function playOnce(c, name, then) {
    const a = c.acts[name];
    if (!a) { then?.(); return; }
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = 1; a.fadeIn(0.2).play();
    if (c.cur && c.cur !== a) c.cur.fadeOut(0.2);
    c.cur = a; c.onceT = a.getClip().duration; c.onceThen = then || null;
  }
  const _camC = new THREE.Vector3();
  const faceCam = (c, rate) => { island.worldToLocal(_camC.copy(camera.position)); return turnToward(c.g, Math.atan2(_camC.x - c.g.position.x, _camC.z - c.g.position.z), rate); };
  function rest(c) {
    c.run = false; c.arrive = null;
    const r = rand(); c.state = r < 0.35 ? 'idle' : r < 0.75 ? 'eat' : 'look'; // đứng nghỉ / gặm cỏ / ngó nghiêng
    c.timer = 2 + rand() * 4;
    play(c, c.state === 'idle' ? 'Idle' : c.state === 'eat' ? 'Eating' : 'Idle_2');
  }
  function arrive(c) {
    const why = c.arrive; c.run = false; c.arrive = null;
    if (why === 'eat') { // tới chỗ rắc hạt: cúi ăn ngon lành
      c.mode = 'feed'; c.state = 'eat'; c.timer = 4 + rand() * 2; play(c, 'Eating');
      c.g.getWorldPosition(_hp); _hp.y += 0.3; spawnHearts(_hp, 3); addBond(c.file); fire('voice', { kind: c.file });
    } else if (why === 'call') { // tới chỗ bạn gọi: nhảy mừng rồi ngồi chờ, nhìn về phía bạn
      c.mode = 'wait'; c.timer = 6;
      playOnce(c, 'Jump_ToIdle', () => play(c, 'Idle'));
      fire('voice', { kind: c.file });
    } else rest(c);
  }
  const BREATH_CYCLE = 12; // hít 4s · giữ 2s · thở ra 6s (khớp lớp hướng dẫn ở DashboardView)
  function stepCritter(c, dt, t) {
    c.mixer.update(dt);
    c.timer -= dt;
    if (c.breathT !== undefined) { // đang cùng thở: thân phồng lên / xẹp xuống theo nhịp
      const s2 = Math.max(0, t - c.breathT) % BREATH_CYCLE; const k = s2 < 4 ? s2 / 4 : s2 < 6 ? 1 : 1 - (s2 - 6) / 6;
      c.g.children[0].scale.setScalar(c.baseScale * (1 + 0.06 * k * k * (3 - 2 * k)));
    }
    if (c.onceT > 0) { c.onceT -= dt; if (c.onceT <= 0) { const f = c.onceThen; c.onceThen = null; if (f) f(); else if (!c.mode) rest(c); } return; }
    if (c.mode === 'pet' || c.mode === 'breath') { faceCam(c, dt * 2); return; }
    if (c.mode === 'wait') { faceCam(c, dt * 3); if (c.timer <= 0) { if (selected === c) c.timer = 1; else { c.mode = null; rest(c); } } return; }
    if (c.mode === 'feed') { if (c.timer <= 0) { c.mode = null; rest(c); } return; }
    if (c.boost > 0) { c.boost -= dt; if (c.cur) c.cur.timeScale = c.boost > 0 ? 1.8 : 1; }
    if (!c.roam) {
      if (c.timer <= 0) { c.timer = 4 + rand() * 5; c.face = c.g.rotation.y + (rand() - 0.5) * 2; }
      if (c.face !== undefined) turnToward(c.g, c.face, dt * 1.5);
      return;
    }
    if (c.state !== 'walk') {
      if (c.timer <= 0) { pickTarget(c); c.state = 'walk'; c.timer = 14; play(c, 'Walk'); }
      return;
    }
    const p = c.g.position;
    const dx = c.tx - p.x; const dz = c.tz - p.z; const dist = Math.hypot(dx, dz);
    if (dist < 0.06 && c.route?.length) { [c.tx, c.tz] = c.route.shift(); c.timer = 12; return; }
    if (dist < 0.06 || c.timer <= 0) { arrive(c); return; }
    const off = turnToward(c.g, Math.atan2(dx, dz), dt * (c.run ? 5 : 3.5));
    // đi theo hướng đang nhìn → đường đi cong tự nhiên; lệch hướng nhiều thì đi chậm lại để quay
    const sp = c.speed * (c.run ? 2.6 : c.boost > 0 ? 2.3 : 1);
    const step = Math.min(dist, sp * dt) * Math.max(0.15, Math.cos(Math.min(off, Math.PI / 2)));
    const nx = p.x + Math.sin(c.g.rotation.y) * step; const nz = p.z + Math.cos(c.g.rotation.y) * step;
    if (walkable(nx, nz)) p.set(nx, groundY(nx, nz), nz);
    else if (c.arrive) arrive(c);
    else if (!pickTarget(c)) rest(c);
  }

  // Vịt mẹ dẫn hai vịt con bơi vòng trong hồ
  function duck(m, scale) {
    const g = new THREE.Group();
    part(m, 0.09, 0.06, 0.12, 0, 0.03, 0, g);
    part(m, 0.05, 0.05, 0.05, 0, 0.1, 0.075, g);
    part(solid('#F4A25B'), 0.026, 0.012, 0.03, 0, 0.095, 0.125, g);
    for (const sx of [-1, 1]) part(eyeMat, 0.008, 0.009, 0.008, sx * 0.03, 0.112, 0.11, g);
    const tail = part(m, 0.03, 0.025, 0.045, 0, 0.065, -0.11, g); tail.rotation.x = 0.5;
    g.scale.setScalar(scale);
    island.add(g);
    return g;
  }
  const ducks = [
    { g: duck(solid('#FFFDF7'), 1.15), lag: 0 },
    { g: duck(solid('#FFE07A'), 0.62), lag: 0.55 },
    { g: duck(solid('#FFE07A'), 0.58), lag: 0.95 }
  ];
  const POND_SWIM = scalePts(POND, 0.72, [1.0, 0.68]);
  ducks.forEach((d, i) => { d.g.position.set(1.0 - i * 0.14, 0.24, 0.68); });
  function duckTarget(d) {
    for (let i = 0; i < 30; i += 1) {
      const x = 0.2 + rand() * 1.7; const z = -0.05 + rand() * 1.5;
      if (inPoly(POND_SWIM, x, z)) { d.tx = x; d.tz = z; return; }
    }
    d.tx = 1.0; d.tz = 0.68;
  }
  duckTarget(ducks[0]);

  /* Cá dưới ao: "Koi" ×3 & "Goldfish" ×2 (Quaternius, CC0) có sẵn chuyển động bơi (quẫy đuôi).
     Bơi lượn dưới mặt nước tới các điểm ngẫu nhiên trong ao, rẽ mượt; chạm vào thì cá quẫy nhanh lao đi. */
  const fishes = [];
  const POND_FISH = scalePts(POND, 0.68, POND_C);
  function fishTarget(f) {
    for (let i = 0; i < 30; i += 1) {
      const x = 0.25 + rand() * 1.6; const z = 0.0 + rand() * 1.4;
      if (inPoly(POND_FISH, x, z)) { f.tx = x; f.tz = z; return; }
    }
    f.tx = POND_C[0]; f.tz = POND_C[1];
  }
  if (gltf) {
    const fl = new gltf.GLTFLoader(); fl.setMeshoptDecoder(gltf.MeshoptDecoder);
    [['koi', 3, 0.2], ['goldfish', 2, 0.14]].forEach(([file, n, len]) => fl.load(`/models/garden/${file}.glb`, (res) => {
      if (disposed) return;
      // đo kích thước GỐC một lần & nhân bản TRƯỚC khi thu nhỏ (bản sao mang theo tỉ lệ → tránh phóng to sai)
      res.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(res.scene, true); const size = box.getSize(new THREE.Vector3());
      const k = len / Math.max(size.x, size.y, size.z);
      const models = [res.scene]; for (let i = 1; i < n; i += 1) models.push(cloneSkinned(res.scene));
      for (let i = 0; i < n; i += 1) {
        const model = models[i];
        model.scale.setScalar(k);
        model.position.y = -((box.min.y + box.max.y) / 2) * k;
        model.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; if (o.material) { o.material.metalness = 0; o.material.roughness = 0.6; } } });
        const g = new THREE.Group(); g.add(model);
        const mixer = new THREE.AnimationMixer(model); const acts = {};
        res.animations.forEach((clip) => { acts[clip.name.split('|').pop()] = mixer.clipAction(clip); });
        const f = { g, mixer, acts, cur: null, speed: 0.07 + rand() * 0.04, depth: 0.05 + rand() * 0.05, phase: rand() * 6, boost: 0 };
        fishTarget(f); g.position.set(f.tx, WATER_Y - f.depth, f.tz); g.rotation.y = rand() * Math.PI * 2; fishTarget(f);
        f.cur = acts.Swimming_Normal || Object.values(acts)[0]; f.cur?.play(); f.cur && (f.cur.time = rand() * 2);
        island.add(g); fishes.push(f);
      }
      wake();
    }));
  }
  // nhân bản mô hình có khung xương (giữ liên kết xương ↔ lưới) — bản rút gọn của SkeletonUtils.clone
  function cloneSkinned(src) {
    const clone = src.clone(true);
    const srcBones = []; const cloneBones = [];
    src.traverse((o) => { if (o.isBone) srcBones.push(o); }); clone.traverse((o) => { if (o.isBone) cloneBones.push(o); });
    const srcMeshes = []; const cloneMeshes = [];
    src.traverse((o) => { if (o.isSkinnedMesh) srcMeshes.push(o); }); clone.traverse((o) => { if (o.isSkinnedMesh) cloneMeshes.push(o); });
    cloneMeshes.forEach((cm, i) => {
      const sm = srcMeshes[i];
      const bones = sm.skeleton.bones.map((b) => cloneBones[srcBones.indexOf(b)]);
      cm.bind(new THREE.Skeleton(bones, sm.skeleton.boneInverses), sm.bindMatrix);
    });
    return clone;
  }
  // thả mồi: cá lượn quanh chỗ mồi rơi một lúc
  function feedTarget(f) {
    for (let i = 0; i < 12; i += 1) {
      const x = f.feed[0] + (rand() - 0.5) * 0.36; const z = f.feed[1] + (rand() - 0.5) * 0.36;
      if (inPoly(POND_FISH, x, z)) { f.tx = x; f.tz = z; return; }
    }
    fishTarget(f);
  }
  function stepFish(f, dt, t) {
    f.mixer.update(dt * (f.boost > 0 ? 2.2 : 1));
    if (f.boost > 0) { f.boost -= dt; if (f.boost <= 0 && f.acts.Swimming_Normal && f.cur !== f.acts.Swimming_Normal) { f.acts.Swimming_Normal.reset().fadeIn(0.4).play(); f.cur.fadeOut(0.4); f.cur = f.acts.Swimming_Normal; } }
    const p = f.g.position; const dx = f.tx - p.x; const dz = f.tz - p.z;
    if (f.feedT > 0) f.feedT -= dt;
    if (Math.hypot(dx, dz) < 0.06) { if (f.feedT > 0) feedTarget(f); else fishTarget(f); }
    turnToward(f.g, Math.atan2(dx, dz), dt * (f.boost > 0 ? 4 : 1.8));
    const sp = f.speed * (f.boost > 0 ? 3 : 1) * dt;
    const nx = p.x + Math.sin(f.g.rotation.y) * sp; const nz = p.z + Math.cos(f.g.rotation.y) * sp;
    if (inPoly(POND_FISH, nx, nz)) { p.x = nx; p.z = nz; } else fishTarget(f);
    p.y = WATER_Y - f.depth + Math.sin(t * 0.9 + f.phase) * 0.012;
    f.g.rotation.z = Math.sin(t * 1.4 + f.phase) * 0.06;
  }

  // Bướm: cánh tròn vỗ nhanh, bay lượn quanh các khóm hoa
  const wingGeo = new THREE.CircleGeometry(0.05, 16);
  function butterfly(color, cx, cz, phase) {
    const g = new THREE.Group();
    const wm = solid(color, { side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.3, roughness: 0.6 });
    const wings = [];
    for (const sx of [-1, 1]) {
      const w = new THREE.Group(); g.add(w);
      const a = new THREE.Mesh(wingGeo, wm); a.scale.set(1, 1.25, 1); a.position.set(sx * 0.045, 0, 0.015); a.rotation.x = -Math.PI / 2; w.add(a);
      const b = new THREE.Mesh(wingGeo, wm); b.scale.set(0.7, 0.85, 1); b.position.set(sx * 0.035, 0, -0.03); b.rotation.x = -Math.PI / 2; w.add(b);
      wings.push({ w, sx });
    }
    part(eyeMat, 0.009, 0.009, 0.045, 0, 0, 0, g);
    g.scale.setScalar(1.3);
    island.add(g);
    return { g, wings, cx, cz, phase, base: groundY(cx, cz) + 0.5 };
  }
  const butterflies = [
    butterfly('#F7A9C8', -0.6, 1.4, 0),
    butterfly('#C9B4F0', 1.7, 1.55, 1.7),
    butterfly('#FFD08A', -1.6, -0.2, 3.1),
    butterfly('#9FD8F0', 0.1, -1.3, 4.4)
  ];
  // "mồi" cho bướm & đom đóm: điểm con trỏ / ngón tay vừa lướt qua (toạ độ cảnh), t = còn hiệu lực
  const lure = { p: new THREE.Vector3(), t: 0 }; const lureL = new THREE.Vector3(); const _bo = new THREE.Vector3(); const _bp = new THREE.Vector3();
  const attract = (world) => { lure.p.copy(world); lure.t = 3; };
  const butterflyPos = (b, t) => new THREE.Vector3(
    b.cx + Math.sin(t * 0.55 + b.phase) * 0.6,
    b.base + Math.sin(t * 1.3 + b.phase) * 0.16,
    b.cz + Math.sin(t * 0.4 + b.phase * 2) * 0.5
  );

  /* Chim: mô hình "Flying seagull" & "Parrot" (Poly by Google, CC-BY 3.0) lượn vòng quanh đảo.
     Mô hình tĩnh → vỗ cánh bằng shader: thân giữ yên, mỗi cánh gập quanh gốc cánh, đầu cánh vẫy mạnh hơn;
     xen kẽ vỗ cánh và sải cánh liệng, nghiêng mình theo vòng bay. */
  const birds = [
    { file: 'bird_5', span: 0.62, radius: 5.1, height: 2.9, speed: 0.18, phase: 0 },
    { file: 'bird_2', span: 0.55, radius: 5.8, height: 3.5, speed: 0.15, phase: 2.6 },
    { file: 'bird_5', span: 0.5, radius: 4.6, height: 3.9, speed: 0.21, phase: 4.4 },
    { file: 'bird_2', span: 0.5, radius: 6.3, height: 2.5, speed: 0.13, phase: 1.3 },
    { file: 'bird_5', span: 0.56, radius: 5.4, height: 4.3, speed: -0.16, phase: 3.5 }, // bay ngược chiều
    { file: 'bird_2', span: 0.52, radius: 4.9, height: 3.1, speed: -0.19, phase: 5.6 }
  ].map((b, i) => {
    const g = new THREE.Group(); scene.add(g);
    // a: góc trên vòng lượn; state: circle | toNest | perched | leave
    return { ...b, g, flapU: { value: 0 }, a: b.phase, state: 'circle', timer: 8 + i * 6 + rand() * 8, p0: new THREE.Vector3(), nest: null };
  });
  const circlePos = (b, a, t, out) => out.set(Math.cos(a) * b.radius, b.height + Math.sin(t * 0.8 + b.phase) * 0.3, Math.sin(a) * b.radius);
  const _bv = new THREE.Vector3(); const _bv2 = new THREE.Vector3(); const _bv3 = new THREE.Vector3();
  // điểm đậu trên tổ (toạ độ cảnh)
  const perchPos = (nest, out) => nest.obj.localToWorld(out.set(0, 0.11, 0));
  // bay theo đường cong bậc 2 (vồng lên/hạ xuống mềm) từ p0 → p2 trong [0..1]
  const quad = (p0, p1, p2, u, out) => out.set(
    (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x,
    (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y,
    (1 - u) * (1 - u) * p0.z + 2 * (1 - u) * u * p1.z + u * u * p2.z);
  if (gltf) {
    const ld = new gltf.GLTFLoader(); ld.setMeshoptDecoder(gltf.MeshoptDecoder);
    ['bird_5', 'bird_2'].forEach((file) => ld.load(`/models/garden/${file}.glb`, (res) => {
      if (disposed) return;
      res.scene.updateMatrixWorld(true);
      let src = null; res.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
      if (!src) return;
      const geo = src.geometry.clone();
      ['position', 'normal'].forEach((name) => { // số nguyên nén → số thực
        const at = geo.getAttribute(name); if (!at) return;
        const arr = new Float32Array(at.count * at.itemSize);
        for (let i = 0; i < at.count; i += 1) for (let c = 0; c < at.itemSize; c += 1) arr[i * at.itemSize + c] = at.getComponent(i, c);
        geo.setAttribute(name, new THREE.BufferAttribute(arr, at.itemSize));
      });
      geo.applyMatrix4(src.matrixWorld);
      geo.rotateY(-Math.PI / 2); // mô hình: đầu hướng +x, cánh dọc z → đầu hướng +z (hướng bay), cánh dọc x
      geo.computeBoundingBox();
      const bb = geo.boundingBox; const span = bb.max.x - bb.min.x;
      geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
      geo.scale(1 / span, 1 / span, 1 / span); // sải cánh = 1, cánh nằm trong |x| ≤ 0.5
      birds.filter((b) => b.file === file).forEach((b) => {
        const m = src.material.clone(); m.metalness = 0; m.roughness = 0.85; m.side = THREE.DoubleSide;
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uFlap = b.flapU;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFlap;')
            .replace('#include <begin_vertex>', `#include <begin_vertex>
              {
                float sx = sign(transformed.x); float ax = abs(transformed.x);
                float body = 0.09;                                   // nửa bề ngang thân (không gập)
                float w = smoothstep(body, 0.5, ax);                 // càng ra đầu cánh càng gập mạnh
                float ang = uFlap * (0.35 + 0.65 * w) * step(body, ax) * sx;
                vec2 d = vec2(transformed.x - sx * body, transformed.y);
                float c = cos(ang); float s = sin(ang);
                transformed.x = sx * body + d.x * c - d.y * s;
                transformed.y = d.x * s + d.y * c;
              }`);
        };
        m.customProgramCacheKey = () => 'bird-flap';
        const birdMesh = new THREE.Mesh(geo, m); birdMesh.scale.setScalar(b.span); birdMesh.castShadow = true;
        b.g.add(birdMesh);
      });
      wake();
    }));
  }

  /* ---------- đảo nhỏ trôi quanh ---------- */
  const satellites = [];
  /* Đảo nhỏ dựng cùng kiểu đảo lớn: viền cong lệch, mặt cỏ vòm nhẹ có vân cỏ, mép cỏ bo tròn có viền sáng,
     vách đất xếp lớp cùng bảng màu, đáy thon nhọn; vài khóm cỏ; có thể có tổ chim. */
  const nests = []; // { obj, perch: Vector3 (cục bộ), busy }
  function buildMiniIsland(g, seed) {
    const R0 = 0.6; const N = 48; const rnd = mulberry32(seed);
    const ph1 = rnd() * 6; const ph2 = rnd() * 6;
    const rim = (a) => R0 * (1 + 0.09 * Math.sin(3 * a + ph1) + 0.05 * Math.sin(5 * a + ph2));
    const dome = (r) => 0.05 * (1 - r * r);
    // mặt cỏ + đệm mép
    const pos = []; const col = []; const uv = []; const idx = [];
    const add = (x, y, z, c) => { pos.push(x, y, z); uv.push(x * 1.1, z * 1.1); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
    const grassAt = (x, z) => tmpC.copy(COL.grassA).lerp(COL.grassB, 0.5 + 0.5 * Math.sin(x * 4 + z * 3 + ph1) * 0.6);
    const center = add(0, dome(0), 0, grassAt(0, 0));
    const RINGS = 6; const rows = [];
    for (let i = 1; i <= RINGS; i += 1) {
      const k = i / RINGS;
      rows.push(Array.from({ length: N }, (_, j) => {
        const a = (j / N) * Math.PI * 2; const r = rim(a) * k;
        const x = Math.cos(a) * r; const z = Math.sin(a) * r;
        return add(x, dome(k), z, grassAt(x, z).lerp(COL.lip, ss(0.6, 1, k) * 0.25));
      }));
    }
    for (let j = 0; j < N; j += 1) idx.push(center, rows[0][(j + 1) % N], rows[0][j]);
    for (let i = 0; i < RINGS - 1; i += 1) for (let j = 0; j < N; j += 1) {
      const a = rows[i][j]; const b = rows[i + 1][j]; const c = rows[i][(j + 1) % N]; const d = rows[i + 1][(j + 1) % N];
      idx.push(a, c, b, c, d, b);
    }
    const RC = 0.06; let prev = rows[RINGS - 1];
    const RIMC = C('#E2F7A6'); const UNDER = C('#5E9A47');
    for (let m = 1; m <= 5; m += 1) {
      const phi = (m / 5) * Math.PI * 0.68; const deg = (phi * 180) / Math.PI;
      const row = Array.from({ length: N }, (_, j) => {
        const a = (j / N) * Math.PI * 2; const r = rim(a) + RC * Math.sin(phi) - (m === 5 ? 0.03 : 0);
        const c = grassAt(Math.cos(a) * r, Math.sin(a) * r).clone();
        if (deg < 75) c.lerp(RIMC, ss(10, 60, deg) * 0.75); else c.lerp(RIMC, 0.75 * (1 - ss(75, 100, deg))).lerp(UNDER, ss(80, 122, deg) * 0.85);
        return add(Math.cos(a) * r, -RC * (1 - Math.cos(phi)) - (m === 5 ? 0.03 : 0), Math.sin(a) * r, c);
      });
      for (let j = 0; j < N; j += 1) { const a = prev[j]; const b = row[j]; const c = prev[(j + 1) % N]; const d = row[(j + 1) % N]; idx.push(a, c, b, c, d, b); }
      prev = row;
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    tg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    tg.setIndex(idx); tg.computeVertexNormals();
    g.add(mesh(tg, terrainMat));
    // vách đất xếp lớp, thon nhọn
    const D = 1.0; const K = 14; const cp = []; const cc = []; const ci = [];
    const BANDS = [[0.3, '#E6AE7C'], [0.48, '#D3926A'], [0.7, '#B97F69'], [1.01, '#9479B2']];
    for (let k = 0; k <= K; k += 1) {
      const f = k / K; const y = -0.06 - f * D;
      for (let j = 0; j < N; j += 1) {
        const a = (j / N) * Math.PI * 2;
        const ledge = Math.abs(Math.sin(y * 18 + Math.sin(a * 5) * 0.8)) * 0.05;
        const tp = cliffTaperF(f) * (1 + ledge * ss(0, 0.2, f) * (1 - f * 0.6));
        cp.push(Math.cos(a) * rim(a) * tp, y, Math.sin(a) * rim(a) * tp);
        const n = hash(j >> 2, Math.floor(y * 18), 5);
        tmpC.set(BANDS.find((bd) => f < bd[0])[1]).lerp(COL.cliffB, n * 0.35).multiplyScalar(0.9 + n * 0.14 + ledge * 1.6);
        tmpC.multiplyScalar(0.62 + 0.38 * ss(0.0, 0.25, f));
        cc.push(tmpC.r, tmpC.g, tmpC.b);
      }
    }
    for (let k = 0; k < K; k += 1) for (let j = 0; j < N; j += 1) {
      const a = k * N + j; const b = (k + 1) * N + j; const c = k * N + ((j + 1) % N); const d = (k + 1) * N + ((j + 1) % N);
      ci.push(a, c, b, c, d, b);
    }
    const tip = cp.length / 3; cp.push(0, -0.06 - D - 0.08, 0); cc.push(0.55, 0.47, 0.63);
    for (let j = 0; j < N; j += 1) ci.push(K * N + j, K * N + ((j + 1) % N), tip);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
    cg.setIndex(ci); cg.computeVertexNormals();
    g.add(mesh(cg, rockMat));
    return { topY: dome(0) };
  }
  // tổ chim: vành tổ đan bằng cành (vòng xuyến méo + que gác chéo), lòng tổ sẫm, 2 quả trứng xanh nhạt
  function makeNest() {
    const n = new THREE.Group();
    const twigMat = mat('#9A6A42', '#8A7A66'); const darkMat = mat('#5E3E26', '#5A4E44');
    const ring = mesh(new THREE.TorusGeometry(0.13, 0.05, 8, 24), twigMat);
    const rp = ring.geometry.attributes.position;
    for (let i = 0; i < rp.count; i += 1) { const k = 1 + (hash(i, 3, 7) - 0.5) * 0.18; rp.setXYZ(i, rp.getX(i) * k, rp.getY(i) * k, rp.getZ(i) * (0.8 + hash(i, 4, 7) * 0.3)); }
    ring.geometry.computeVertexNormals();
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.04; n.add(ring);
    const bowl = mesh(new THREE.CircleGeometry(0.13, 20), darkMat); bowl.rotation.x = -Math.PI / 2; bowl.position.y = 0.025; n.add(bowl);
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * Math.PI * 2 + hash(i, 1, 9);
      const tw = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), twigMat, { receive: false });
      tw.position.set(Math.cos(a) * 0.14, 0.05 + hash(i, 2, 9) * 0.03, Math.sin(a) * 0.14);
      tw.rotation.set(Math.PI / 2 + (hash(i, 3, 9) - 0.5) * 0.6, 0, a + Math.PI / 2 + (hash(i, 4, 9) - 0.5) * 0.8);
      n.add(tw);
    }
    const eggMat = solid('#D6EEF4');
    [[0.03, 0.02], [-0.035, -0.015]].forEach(([x, z], i) => { const e = part(eggMat, 0.028, 0.036, 0.028, x, 0.05, z, n); e.rotation.z = 0.5 - i; });
    return n;
  }
  function satellite(x, y, z, s, seed, spin = 0.12, withNest = false) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
    const { topY } = buildMiniIsland(g, seed);
    // vài khóm cỏ trên mặt đảo nhỏ
    loadModel('flora_grass', (part2) => {
      const make = part2();
      for (let i = 0; i < 5; i += 1) {
        const a = hash(seed, i, 1) * Math.PI * 2; const r = 0.15 + hash(seed, i, 2) * 0.32;
        if (withNest && r < 0.24) continue;
        make(Math.cos(a) * r, topY * (1 - r * r) - 0.005, Math.sin(a) * r, 0.16 + hash(seed, i, 3) * 0.08, false, g);
      }
    });
    // hoa cỏ trên đảo nhỏ: thảm "grass mix" cùng màu cỏ đảo lớn + hoa đơn, cây hoa tím, khóm hoa (theo tâm trạng như hoa đảo lớn)
    const isleSpots = [];
    for (let i = 0; i < 16; i += 1) {
      const a = hash(seed, i, 5) * Math.PI * 2; const r = 0.1 + Math.sqrt(hash(seed, i, 6)) * 0.4;
      if (withNest && r < 0.24) continue; // chừa chỗ tổ chim
      isleSpots.push([Math.cos(a) * r, Math.sin(a) * r, i]);
    }
    const yOn = (x, z) => topY * Math.max(0, 1 - (x * x + z * z) / 0.36) - 0.004;
    loadModel('grass_mix', (p2) => {
      const mk = p2();
      isleSpots.forEach(([x, z, i]) => {
        if (i % 3 === 2) return;
        const gg = mk(x, yOn(x, z), z, 0.07 + hash(seed, i, 7) * 0.04, false, g);
        gg.traverse((o) => { if (o.isMesh && !o.material.userData.isleTone) { // cùng tông cỏ đảo lớn
          o.material.userData.isleTone = true;
          const fresh = C(o.material.name && /10/.test(o.material.name) ? '#8FCB63' : '#A3D96F');
          const e = tinted.find((tt) => tt.mat === o.material); o.material.color.copy(fresh);
          if (e) { e.b = fresh; e.a = fresh.clone().multiply(TREE_WILT); }
        } });
      });
    });
    ['flora_flower_single_pink', 'flora_flower_single_yellow', 'flora_plant_purple', 'flora_flower_group_pink'].forEach((file, fk) => loadModel(file, (p2) => {
      const mk = p2();
      isleSpots.forEach(([x, z, i]) => {
        if (i % 3 !== 2 || (i >> 1) % 4 !== fk) return;
        const fg = mk(x, yOn(x, z), z, (fk === 3 ? 0.2 : 0.15) + hash(seed, i, 8) * 0.05, false, g);
        flowers.push({ g: fg, s0: fg.scale.x, threshold: 0.1 + hash(seed, i, 9) * 0.5, tilt: rand() * Math.PI * 2 });
      });
    }));
    if (withNest) {
      const nest = makeNest(); nest.position.set(0, topY - 0.01, 0); g.add(nest);
      nests.push({ obj: nest, sat: g, busy: null });
    }
    scene.add(g);
    satellites.push({ g, y, phase: rand() * 6, spin });
    return g;
  }
  satellite(-6.6, 0.8, -2.6, 1.5, 11, 0.06, true);
  satellite(3.4, 2.2, -6.3, 1.2, 23, 0.07, true);
  satellite(6.3, -1.2, 3.1, 0.85, 37, 0.1);
  // đảo nhỏ nhà trên cây: chính mô hình "Low Poly Tree House" (Dawid2K, CC-BY 3.0, poly.pizza/m/YUAFe6TOOa)
  // lơ lửng cạnh đảo lớn, trôi lên xuống và xoay rất chậm như các đảo nhỏ khác
  const houseIsle = new THREE.Group();
  houseIsle.position.set(-4.8, 0.2, 4.2);
  scene.add(houseIsle);
  satellites.push({ g: houseIsle, y: 0.2, phase: rand() * 6, spin: 0.03 });
  loadModel('treehouse', (part) => part()(0, 0, 0, 3.0, false, houseIsle));

  /* ---------- mây ----------
     Cách làm mây "billboard" (như drei <Clouds>): mỗi đám mây là một cụm sprite luôn quay mặt về
     máy quay, dán texture nhiễu fBm mép bông xốp, chồng nhiều lớp trong suốt. Sprite ở đáy cụm tô
     tím/hồng đậm hơn, đỉnh trắng sáng → có khối như mây thật được nắng chiếu từ trên. */
  function cloudTexture(seed) {
    const N = 128;
    const r = mulberry32(seed);
    const G = 16; const grid = new Float32Array((G + 1) * (G + 1)).map(() => r());
    const val = (x, y) => {
      const xi = Math.floor(x) % G; const yi = Math.floor(y) % G; const xf = x - Math.floor(x); const yf = y - Math.floor(y);
      const sx = xf * xf * (3 - 2 * xf); const sy = yf * yf * (3 - 2 * yf);
      const g = (i, j) => grid[((yi + j) % G) * (G + 1) + ((xi + i) % G)];
      return (g(0, 0) * (1 - sx) + g(1, 0) * sx) * (1 - sy) + (g(0, 1) * (1 - sx) + g(1, 1) * sx) * sy;
    };
    const fbm = (x, y) => { let v = 0; let a = 0.5; let f = 1; for (let o = 0; o < 5; o += 1) { v += a * val(x * f, y * f); a *= 0.5; f *= 2; } return v; };
    const c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(N, N);
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const dx = (x / N) * 2 - 1; const dy = (y / N) * 2 - 1;
        const d = Math.sqrt(dx * dx + dy * dy * 1.15);
        const fall = Math.max(0, 1 - Math.pow(Math.min(1, d), 2.2));
        const n = fbm((x / N) * 4 + 3, (y / N) * 4 + 7);
        const a = Math.min(1, Math.max(0, (n * 1.55 - (1 - fall) * 0.95 - 0.04) * 2.6)) * fall;
        const light = 0.92 + 0.08 * (1 - y / N);
        const k = (y * N + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(255 * light);
        img.data[k + 3] = Math.round(255 * a);
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const cloudTexs = [11, 23, 37].map(cloudTexture);
  // màu theo tầng trong đám mây: đáy (bóng) → giữa → đỉnh (nắng); [tươi, héo]
  const CLOUD_BANDS = [['#DDCBF1', '#A4A1AC'], ['#F9D6E7', '#C4C1C6'], ['#FFFFFF', '#E0DDE0']];
  const cloudMats = [];
  for (const tex of cloudTexs) {
    cloudMats.push(CLOUD_BANDS.map(([fresh, wilt]) => {
      const m = new THREE.SpriteMaterial({ map: tex, color: fresh, transparent: true, depthWrite: false, toneMapped: false, rotation: rand() * Math.PI * 2, opacity: 1 });
      tinted.push({ mat: m, a: C(wilt), b: C(fresh) });
      return m;
    }));
  }
  const clouds = new THREE.Group();
  scene.add(clouds);
  const cloudClusters = [];
  function cloudCluster(cx, cy, cz, w, hgt, d, count, size, parent = clouds, mats = cloudMats) {
    // mây dàn rộng theo đảo (trừ mây mưa ngay trên đảo)
    const spread = parent === clouds || parent === foreground ? 1.4 : 1;
    const g = new THREE.Group(); g.position.set(cx * spread, cy * (cy < 0 ? 1.3 : 1), cz * spread);
    for (let i = 0; i < count; i += 1) {
      // rải trong nửa ellipsoid phẳng đáy: đáy rộng, đỉnh bồng lên
      const u = rand(); const a = rand() * Math.PI * 2; const rr = Math.sqrt(rand());
      const x = Math.cos(a) * rr * w * 0.5; const z = Math.sin(a) * rr * d * 0.5;
      const y = u * hgt * (1 - rr * 0.6);
      const band = y / hgt < 0.25 ? 0 : y / hgt < 0.55 ? 1 : 2;
      const sp = new THREE.Sprite(mats[i % mats.length][band]);
      const sc = size * (0.7 + rand() * 0.6) * (1.1 - rr * 0.35);
      sp.scale.set(sc * 1.25, sc, 1);
      sp.position.set(x, y, z);
      g.add(sp);
    }
    parent.add(g);
    cloudClusters.push({ g, x: cx * spread, phase: rand() * 6 });
    return g;
  }
  // biển mây bao quanh và ôm lấy đáy đảo
  cloudCluster(0, -4.4, 0.2, 4.8, 1.5, 4.8, 28, 2.5);
  for (let i = 0; i < 22; i += 1) {
    const a = (i / 22) * Math.PI * 2 + rand() * 0.25; const r = 3.2 + rand() * 5.5;
    cloudCluster(Math.cos(a) * r, -4.0 + rand() * 0.8, Math.sin(a) * r, 3 + rand() * 2, 1.2 + rand() * 0.6, 2.6 + rand() * 1.4, 14, 2.3);
  }
  // lớp mây lót phía xa cho kín chân trời
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + 0.2; const r = 9 + rand() * 2;
    cloudCluster(Math.cos(a) * r, -3.2 + rand() * 0.6, Math.sin(a) * r, 5, 1.6, 3, 12, 3.2);
  }
  // mây xa trên trời
  cloudCluster(-5.2, 2.4, -6.2, 3.6, 1.1, 1.6, 12, 1.6);
  cloudCluster(0.6, 3.2, -7.4, 5.4, 1.3, 1.8, 18, 1.7); // gộp 2 đám xa phía sau thành 1 đám lớn
  cloudCluster(5.6, 1.8, -2.4, 3, 1, 1.4, 11, 1.5);
  // mây tiền cảnh: dâng cao lên trước mặt đảo, che một phần thân đất phía trước (không xoay theo biển mây)
  const foreground = new THREE.Group();
  foreground.position.y = 0.9;
  scene.add(foreground);
  // một đám lớn ôm góc trước (gộp 3 đám nhỏ cũ ở góc trước)
  cloudCluster(2.6, -1.8, 2.6, 4.4, 1.4, 2.8, 20, 1.85, foreground);
  // vài đám ở độ cao khác nhau → chiều sâu (gần–giữa–xa)
  cloudCluster(-1.3, -1.2, 3.5, 2.4, 0.8, 1.2, 9, 1.45, foreground);
  cloudCluster(3.7, -0.9, -0.7, 2.3, 0.8, 1.2, 9, 1.4, foreground);
  cloudCluster(-3.3, -1.4, -2.6, 2.6, 0.9, 1.4, 9, 1.5, foreground);

  /* ---------- NẮNG: vầng mặt trời sau đảo + tia nắng xiên chiếu xuống ---------- */
  function rayTexture(long = false) {
    const W = 64; const Hh = 256;
    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(W, Hh);
    for (let y = 0; y < Hh; y += 1) {
      const v = y / Hh; // 0 = phía mặt trời
      // đầu tia (sát mặt trời) mờ rồi sáng dần → nhiều tia chồng ở gốc không cộng dồn thành mảng chói
      const fadeIn = (e) => { const x = Math.min(1, v / e); return x * x * (3 - 2 * x); };
      const along = long ? fadeIn(0.18) * Math.pow(1 - v, 0.6) : fadeIn(0.2) * Math.pow(1 - v, 1.1);
      for (let x = 0; x < W; x += 1) {
        const u = (x / (W - 1)) * 2 - 1;
        const a = Math.exp(-u * u * 3.2) * along;
        const k = (y * W + x) * 4;
        img.data[k] = 255; img.data[k + 1] = 236; img.data[k + 2] = 190; img.data[k + 3] = Math.round(255 * a);
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const rayTex = rayTexture(); const rayTexLong = rayTexture(true);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFE2A8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9, toneMapped: false }));
  sunGlow.position.copy(SUN_POS).multiplyScalar(1.15); sunGlow.scale.set(9, 9, 1);
  scene.add(sunGlow);
  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFFFFF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85, toneMapped: false }));
  sunCore.position.copy(sunGlow.position); sunCore.scale.set(2.6, 2.6, 1);
  scene.add(sunCore);
  // trăng (cùng hướng với mặt trời → bóng đổ vẫn đúng) + bầu trời sao, hiện dần khi tối
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#E6ECFF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
  moon.position.copy(sunGlow.position); moon.scale.set(3.2, 3.2, 1); scene.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#8FA4FF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
  moonHalo.position.copy(sunGlow.position); moonHalo.scale.set(10, 10, 1); scene.add(moonHalo);
  const STAR_N = 220; const starPos = new Float32Array(STAR_N * 3); const starRnd = mulberry32(99);
  for (let i = 0; i < STAR_N; i += 1) {
    const a = starRnd() * Math.PI * 2; const el2 = 0.15 + starRnd() * 1.2; const R = 34;
    starPos.set([Math.cos(a) * Math.cos(el2) * R, Math.sin(el2) * R - 4, Math.sin(a) * Math.cos(el2) * R], i * 3);
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ map: glowTex, color: '#FFFFFF', size: 0.55, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false });
  const stars = new THREE.Points(starGeo, starMat); scene.add(stars);
  const rays = [];
  const rayGeo = new THREE.PlaneGeometry(1, 1); rayGeo.translate(0, -0.5, 0); // gốc ở đầu phía mặt trời
  // 5 tia chiếu xuống đảo + 6 tia lớn, mờ, xuyên qua không khí xuống tận biển mây
  [[-1.5, 0.4, 1.3, 0.55], [0.6, -0.6, 1.0, 0.45], [2.2, 1.6, 1.6, 0.5], [-0.3, 2.6, 0.8, 0.35], [3.4, -1.4, 1.1, 0.4],
    [-5.5, 3.5, 2.6, 0.3, -4.6], [5.2, 4.2, 2.2, 0.28, -4.4], [-1.2, 6.0, 3.0, 0.26, -4.8], [6.4, -0.5, 2.4, 0.24, -4.2], [-6.2, -2.4, 2.0, 0.22, -4.4], [1.8, -5.6, 2.4, 0.22, -4.6],
    // thêm: tia mảnh xen giữa trên đảo + tia lớn quanh rìa xuống biển mây
    [-0.8, -1.6, 0.6, 0.4], [1.4, 0.9, 0.7, 0.4], [-2.2, -0.6, 0.8, 0.36], [0.2, 1.5, 0.55, 0.38], [2.6, -0.2, 0.75, 0.36], [-1.0, 1.8, 0.65, 0.34],
    [-3.6, 5.4, 1.8, 0.24, -4.6], [3.6, 6.2, 2.0, 0.22, -4.8], [7.0, 2.6, 1.8, 0.22, -4.3], [-7.2, 1.0, 2.2, 0.2, -4.5], [-3.2, -5.8, 1.9, 0.2, -4.6], [4.8, -4.2, 2.1, 0.2, -4.4], [0.0, 7.4, 2.4, 0.2, -4.9], [-4.6, -4.0, 1.6, 0.18, -4.2]
  ].forEach(([tx, tz, w, op, ty = -1.5], i) => {
    const g = new THREE.Group();
    const mats = []; const planes = [];
    for (let k = 0; k < 2; k += 1) { // 2 tấm bắt chéo
      const m = new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: op, toneMapped: false });
      const pl = new THREE.Mesh(rayGeo, m); pl.rotation.y = k * (Math.PI / 2);
      g.add(pl); mats.push(m); planes.push(pl);
    }
    scene.add(g);
    rays.push({ g, mats, planes, op, w, tx, tz, ty, phase: i * 1.9 });
  });
  // Quạt tia nắng: tính theo KHUNG HÌNH người xem — mọi tia xuất phát từ mặt trời, tỏa ra ~140° hướng vào giữa
  // khung hình (phủ cả trời lẫn đảo, như nắng lọt qua mây). Cập nhật mỗi khung theo góc máy quay (xoay đảo vẫn đúng).
  const FAN_N = 17;
  for (let i = 0; i < FAN_N; i += 1) {
    const g = new THREE.Group(); const mats = []; const planes = [];
    const op = 0.26 + (i % 3 === 0 ? 0.1 : 0); const w = 2.2 + (i % 4) * 0.7;
    for (let k = 0; k < 2; k += 1) {
      const m = new THREE.MeshBasicMaterial({ map: rayTexLong, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: op, toneMapped: false });
      const pl = new THREE.Mesh(rayGeo, m); pl.rotation.y = k * (Math.PI / 2); g.add(pl); mats.push(m); planes.push(pl);
    }
    scene.add(g);
    rays.push({ g, mats, planes, op, w, fan: i, len: 20 + (i % 3) * 6, phase: i * 1.7 });
  }
  let skyEve = 0; // 0 sáng/trưa → 1 chiều tà (đặt trong placeSky)
  const _cR = new THREE.Vector3(); const _cU = new THREE.Vector3(); const _fd = new THREE.Vector3(); const _fc = new THREE.Vector3(); const DOWN = new THREE.Vector3(0, -1, 0);
  function layoutFan() {
    _cR.set(1, 0, 0).applyQuaternion(camera.quaternion); _cU.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const S = sunGlow.position;
    _fc.set(0, -0.6, 0).addScaledVector(SCREEN_B, -1.8 * skyEve).sub(S); // hướng từ mặt trời về giữa đảo (chiều: về mặt trước đảo)
    const base = Math.atan2(_fc.dot(_cU), _fc.dot(_cR)); const spread = (140 * Math.PI) / 180;
    rays.forEach((r) => {
      if (r.fan === undefined) return;
      const ph = base + ((r.fan / (FAN_N - 1)) - 0.5) * spread + Math.sin(r.phase) * 0.03;
      _fd.copy(_cR).multiplyScalar(Math.cos(ph)).addScaledVector(_cU, Math.sin(ph)).normalize();
      r.g.position.copy(S).addScaledVector(_fd, 2.5); // bắt đầu cách mặt trời một đoạn
      r.g.quaternion.setFromUnitVectors(DOWN, _fd);
      r.planes.forEach((pl) => pl.scale.set(r.w, r.len, 1));
    });
  }
  // đặt lại tia nắng, vầng mặt trời, trăng, đèn theo vị trí mặt trời hiện tại
  const _sp = new THREE.Vector3(); const _spv = new THREE.Vector3(); const _camL = new THREE.Vector3();
  function placeSky(hr) {
    skyPos(hr, _sp);
    sun.position.copy(_sp); backSun.position.copy(_sp);
    skyPosVisual(hr, _spv);
    { const th = skyTheta(hr); skyEve = th > 0 && th < Math.PI + 1e-6 && hr >= 5 && hr <= 19.5 ? Math.max(0, -Math.cos(th)) : 0; }
    sunGlow.position.copy(_spv).multiplyScalar(1.15); sunCore.position.copy(sunGlow.position);
    moon.position.copy(sunGlow.position); moonHalo.position.copy(sunGlow.position);
    rays.forEach((r) => {
      if (r.fan !== undefined) return; // tia quạt đặt theo khung hình (layoutFan)
      // nắng chiếu SONG SONG: mỗi tia bắt đầu riêng trên trời, ngược hướng nắng từ chỗ nó rọi xuống
      // (không còn tụ về một điểm cạnh mặt trời → hết cộng dồn thành mảng chói)
      const target = new THREE.Vector3(r.tx, r.ty, r.tz);
      const len = r.ty < -2 ? 17 : 12;
      const start = target.clone().addScaledVector(_spv.clone().normalize(), len); // theo mặt trời nhìn thấy (tránh tia sát máy quay)
      const dir = target.clone().sub(start).normalize();
      r.g.position.copy(start); r.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      r.planes.forEach((pl) => pl.scale.set(r.w, len, 1));
    });
  }
  placeSky(timeOpts.hour ?? nowHour());

  /* ---------- hạt: đom đóm, cánh hoa, mưa ---------- */
  function points(n, spread, color, size, blending = THREE.AdditiveBlending) {
    const base = new Float32Array(n * 3); const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      base[i * 3] = (rand() - 0.5) * spread[0];
      base[i * 3 + 1] = spread[1][0] + rand() * (spread[1][1] - spread[1][0]);
      base[i * 3 + 2] = (rand() - 0.5) * spread[2];
    }
    pos.set(base);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: glowTex, color, size, transparent: true, depthWrite: false, blending, sizeAttenuation: true });
    const p = new THREE.Points(geo, m);
    return { p, base, pos, m, n };
  }
  /* Ban đêm: đốm sáng li ti như đom đóm lượn quanh các khóm hoa (lấy vị trí hoa khi đã nạp xong) */
  const FG_N = 160; const fgPos = new Float32Array(FG_N * 3); const fgBase = []; let fgCount = 0; let fgSeenFlowers = -1;
  const fgGeo = new THREE.BufferGeometry(); fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
  const fgMat = new THREE.PointsMaterial({ map: glowTex, color: '#FFF1A8', size: 0.09, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false });
  const flowerGlow = new THREE.Points(fgGeo, fgMat); flowerGlow.visible = false; flowerGlow.frustumCulled = false; scene.add(flowerGlow);
  const _fw = new THREE.Vector3();
  function refreshFlowerGlow() { // gom vị trí hoa (toạ độ cảnh) → mỗi khóm 1–3 đốm
    fgBase.length = 0;
    for (const f of flowers) {
      if (fgBase.length >= FG_N) break;
      if (!f.g.visible || f.g.parent !== island) continue; // hoa đảo lớn (đảo nhỏ trôi nên bỏ qua)
      f.g.getWorldPosition(_fw);
      const n = 1 + (fgBase.length % 3 === 0 ? 2 : 1);
      for (let k = 0; k < n && fgBase.length < FG_N; k += 1) fgBase.push([_fw.x, _fw.y + 0.18 + rand() * 0.25, _fw.z, rand() * 6, 0.08 + rand() * 0.12]);
    }
    fgCount = fgBase.length; fgGeo.setDrawRange(0, fgCount);
  }
  const fireflies = points(55, [9, [0.6, 3.6], 9], '#FFF0A8', 0.22);
  const ffPull = new Float32Array(55); const fgPull = new Float32Array(160);
  // đốm sáng ở gần con trỏ thì bay dần lại quanh đó, rời đi thì tản về chỗ cũ
  function pullToLure(pos, n, pull, dt) {
    for (let i = 0; i < n; i += 1) {
      const k = i * 3; const dx = lure.p.x - pos[k]; const dy = lure.p.y + 0.3 - pos[k + 1]; const dz = lure.p.z - pos[k + 2];
      const want = lure.t > 0 && dx * dx + dy * dy + dz * dz < 4 ? 0.75 : 0;
      pull[i] += (want - pull[i]) * Math.min(1, dt * (want ? 1.2 : 0.6));
      if (pull[i] > 0.001) { const ph = i * 2.4; pos[k] += (dx + Math.cos(ph) * 0.35) * pull[i]; pos[k + 1] += (dy + Math.sin(ph * 1.3) * 0.2) * pull[i]; pos[k + 2] += (dz + Math.sin(ph) * 0.35) * pull[i]; }
    }
  }
  scene.add(fireflies.p);
  const petals = points(26, [3, [0.4, 3], 3], '#E9826A', 0.14, THREE.NormalBlending); // lá đỏ rơi từ cây phong
  petals.p.position.set(-2.05 * 1.5, 0.3, 1.35 * 1.5); // ngay cây phong (đảo đã phóng 1.5)
  scene.add(petals.p);
  const rainN = 140;
  const rainPos = new Float32Array(rainN * 6); const rainSpeed = new Float32Array(rainN);
  for (let i = 0; i < rainN; i += 1) {
    const x = (rand() - 0.5) * 7.5; const z = (rand() - 0.5) * 7.5; const y = rand() * 4;
    rainPos.set([x, y, z, x - 0.03, y - 0.22, z], i * 6);
    rainSpeed[i] = 3 + rand() * 2;
  }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: '#C9D6E6', transparent: true, opacity: 0 });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.position.y = 0.6;
  scene.add(rain);
  // mây đen khi vườn cần chăm sóc: cùng kiểu cụm sprite, tô xám, độ mờ theo health
  const stormMats = cloudTexs.map((tex) => {
    const shades = ['#6F6C78', '#86838E', '#A3A0AA'].map((c) => new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, depthWrite: false, toneMapped: false, rotation: rand() * Math.PI * 2, opacity: 0 }));
    return shades;
  });
  const storm = new THREE.Group();
  scene.add(storm);
  storm.position.set(0, 3.9, 0);
  cloudCluster(0, 0, 0, 3.4, 0.9, 2.6, 14, 1.6, storm, stormMats);
  cloudClusters.pop();

  /* ---------- TƯƠNG TÁC: chạm tay / bấm chuột vào con vật (chế độ toàn màn hình) ----------
     Thú: quay về phía người chạm, nhảy cẫng lên, thả tim rồi chạy tung tăng · Vịt: nhảy khỏi mặt nước rồi bơi nhanh
     · Chim: đang đậu thì cất cánh, đang bay thì nhào lộn · Bướm: giật mình vụt lên. */
  const reactions = [];
  const heartTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FF7FA6';
    ctx.beginPath(); ctx.moveTo(32, 54);
    ctx.bezierCurveTo(6, 36, 6, 12, 20, 12); ctx.bezierCurveTo(28, 12, 32, 18, 32, 22);
    ctx.bezierCurveTo(32, 18, 36, 12, 44, 12); ctx.bezierCurveTo(58, 12, 58, 36, 32, 54); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(21, 22, 5, 0, Math.PI * 2); ctx.fill();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const hearts = Array.from({ length: 18 }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false, toneMapped: false }));
    sp.visible = false; sp.renderOrder = 5; scene.add(sp);
    return { sp, life: 0, v: new THREE.Vector3() };
  });
  function spawnHearts(pos, n = 4) {
    let k = 0;
    for (const ht of hearts) {
      if (ht.life > 0 || k >= n) continue;
      ht.sp.position.copy(pos).add(new THREE.Vector3((rand() - 0.5) * 0.25, 0.1 + rand() * 0.1, (rand() - 0.5) * 0.25));
      ht.v.set((rand() - 0.5) * 0.35, 0.8 + rand() * 0.5, (rand() - 0.5) * 0.35);
      ht.life = 1.3 + rand() * 0.4; ht.sp.visible = true; k += 1;
    }
  }
  function stepHearts(dt) {
    for (const ht of hearts) {
      if (ht.life <= 0) continue;
      ht.life -= dt;
      ht.sp.position.addScaledVector(ht.v, dt); ht.v.y *= 0.985;
      const sc = 0.2 * Math.min(1, (1.7 - ht.life) * 5);
      ht.sp.scale.set(sc, sc, 1); ht.sp.material.opacity = Math.min(1, ht.life * 1.6);
      if (ht.life <= 0) ht.sp.visible = false;
    }
  }
  const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  function pickAnimal(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const roots = [
      ...critters.map((c) => ({ o: c.g, kind: 'critter', ref: c })), ...ducks.map((d) => ({ o: d.g, kind: 'duck', ref: d })),
      ...fishes.map((f) => ({ o: f.g, kind: 'fish', ref: f })),
      ...birds.map((b) => ({ o: b.g, kind: 'bird', ref: b })), ...butterflies.map((b) => ({ o: b.g, kind: 'butterfly', ref: b })),
      ...flowers.map((f) => ({ o: f.g, kind: 'flower', ref: f }))
    ].filter((r) => r.o.visible && r.o.parent);
    const hits = raycaster.intersectObjects(roots.map((r) => r.o), true);
    for (const hit of hits) {
      let o = hit.object;
      while (o) { const r = roots.find((rr) => rr.o === o); if (r) return { ...r, point: hit.point }; o = o.parent; }
    }
    return null;
  }
  // giọt nước tưới hoa: rơi từ trên xuống, lấp lánh xanh nhạt
  const drops = Array.from({ length: 30 }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#9FE3FF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.visible = false; sp.renderOrder = 5; scene.add(sp);
    return { sp, life: 0, v: new THREE.Vector3() };
  });
  function spawnDrops(pos, n = 10) {
    let k = 0;
    for (const d of drops) {
      if (d.life > 0 || k >= n) continue;
      d.sp.position.copy(pos).add(new THREE.Vector3((rand() - 0.5) * 0.3, 0.55 + rand() * 0.25, (rand() - 0.5) * 0.3));
      d.v.set((rand() - 0.5) * 0.1, -0.6 - rand() * 0.4, (rand() - 0.5) * 0.1);
      d.life = 0.7 + rand() * 0.3; d.sp.visible = true; k += 1;
    }
  }
  function stepDrops(dt) {
    for (const d of drops) {
      if (d.life <= 0) continue;
      d.life -= dt; d.v.y -= 2.2 * dt; d.sp.position.addScaledVector(d.v, dt);
      const sc = 0.07 + 0.03 * Math.sin(d.life * 30); d.sp.scale.set(sc, sc * 1.4, 1); d.sp.material.opacity = Math.min(1, d.life * 2);
      if (d.life <= 0) d.sp.visible = false;
    }
  }
  const busy = (ref) => reactions.some((r) => r.ref === ref);
  function interact(hit) {
    const { kind, ref } = hit;
    if (kind === 'flower') { // tưới hoa: giọt nước rơi → hoa rung rồi bừng nở to hơn một lúc
      spawnDrops(hit.point, 12); fire('voice', { kind: 'water' });
      if (!busy(ref)) reactions.push({ kind: 'bloom', ref, t: 0, dur: 3.2, delay: 0.55 });
      wake(); return;
    }
    spawnHearts(hit.point, kind === 'butterfly' ? 2 : 4);
    if (busy(ref)) return;
    if (kind === 'critter') {
      if (ref.mode === 'breath') return;
      const cam = island.worldToLocal(camera.position.clone());
      ref.g.rotation.y = Math.atan2(cam.x - ref.g.position.x, cam.z - ref.g.position.z); // quay về phía người chạm
      fire('voice', { kind: ref.file }); ref.run = false; ref.arrive = null;
      if (!ref.roam) { ref.mode = null; playOnce(ref, 'Jump', () => play(ref, 'Idle')); } // cừu nhảy cẫng
      else if (selected === ref) { select(null); ref.mode = null; playOnce(ref, 'Jump_ToIdle'); } // chạm lần nữa: thôi gọi
      else { select(ref); ref.mode = 'wait'; ref.timer = 8; playOnce(ref, 'Jump_ToIdle', () => play(ref, 'Idle')); } // nhảy mừng, chờ bạn gọi
    } else if (kind === 'fish') { // cá quẫy đuôi lao đi chỗ khác
      ref.boost = 2.2; ref.feedT = 0; fishTarget(ref); fire('voice', { kind: 'splash' });
      if (ref.acts.Swimming_Fast && ref.cur !== ref.acts.Swimming_Fast) { ref.acts.Swimming_Fast.reset().fadeIn(0.2).play(); ref.cur?.fadeOut(0.2); ref.cur = ref.acts.Swimming_Fast; }
      spawnDrops(hit.point, 6);
    } else if (kind === 'duck') {
      reactions.push({ kind: 'duckhop', ref, t: 0, dur: 0.5, h: 0.13 }); ref.boost = 2.5; fire('voice', { kind: 'duck' });
    } else if (kind === 'bird') {
      fire('voice', { kind: 'bird' });
      if (ref.state === 'perched') ref.timer = 0; // cất cánh ngay
      else reactions.push({ kind: 'roll', ref, t: 0, dur: 0.95 });
    } else if (kind === 'butterfly') {
      reactions.push({ kind: 'flee', ref, t: 0, dur: 1.6 }); fire('voice', { kind: 'chime' });
    }
    wake();
  }
  function stepReactions(dt) {
    for (let i = reactions.length - 1; i >= 0; i -= 1) {
      const r = reactions[i]; r.t += dt; const u = Math.min(1, r.t / r.dur);
      if (r.kind === 'hop') {
        const model = r.ref.g.children[0];
        if (r.base === undefined) r.base = model.position.y;
        model.position.y = r.base + Math.abs(Math.sin(Math.PI * u * r.hops)) * r.h; // nhảy cẫng (đơn vị cảnh)
        if (u >= 1) { model.position.y = r.base; r.done?.(); }
      } else if (r.kind === 'duckhop') r.ref.g.position.y += Math.sin(Math.PI * u) * r.h;
      else if (r.kind === 'roll') r.ref.g.rotation.z += Math.PI * 2 * (u * u * (3 - 2 * u)) * (Math.sign(r.ref.speed) || 1);
      else if (r.kind === 'flee') { r.ref.g.position.y += Math.sin(Math.PI * u) * 0.55; r.ref.g.position.x += Math.sin(Math.PI * u) * 0.25; }
      else if (r.kind === 'bloom') {
        const f = r.ref; const base = f.s0 * (0.75 + 0.25 * h);
        if (r.t < r.delay) { f.g.rotation.y += Math.sin(r.t * 40) * 0.02; } // giọt nước chạm: hoa rung
        else {
          const k = (r.t - r.delay) / (r.dur - r.delay);
          const bump = Math.sin(Math.PI * Math.min(1, k * 2.2)) * (k < 0.45 ? 1 : 0) + (k >= 0.45 ? 0.35 * (1 - (k - 0.45) / 0.55) : 0);
          f.g.scale.setScalar(base * (1 + 0.45 * bump)); // bừng nở rồi dịu lại
          f.g.visible = true;
        }
        if (u >= 1) { f.g.scale.setScalar(base); f.g.visible = h > f.threshold; }
      }
      if (u >= 1) reactions.splice(i, 1);
    }
    stepHearts(dt); stepDrops(dt);
  }
  // vòng sáng dưới chân con vật đang được chọn (chờ bạn chạm bãi cỏ để gọi tới)
  const selRing = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 40), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  selRing.rotation.x = -Math.PI / 2; selRing.renderOrder = 3; selRing.visible = false;
  let selected = null; let selT = 0;
  function select(c) {
    if (selected && selected !== c && selected.mode === 'wait') selected.timer = Math.min(selected.timer, 1.5);
    selected = c; selT = 10;
    if (c) { const r = c.length * 0.62; selRing.scale.set(r, r, r); selRing.position.set(0, 0.02, 0); c.g.add(selRing); selRing.visible = true; fire('select', { animal: c.file }); }
    else { selRing.visible = false; selRing.parent?.remove(selRing); fire('deselect'); }
  }
  // hạt rắc xuống cỏ / mồi thả xuống hồ
  const seeds = Array.from({ length: 28 }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#C9944F', transparent: true, depthWrite: false }));
    sp.visible = false; sp.renderOrder = 4; scene.add(sp);
    return { sp, life: 0, v: new THREE.Vector3(), gy: 0 };
  });
  function spawnSeeds(world, n, floorY, color = '#C9944F') {
    let k = 0;
    for (const d of seeds) {
      if (d.life > 0 || k >= n) continue;
      d.sp.material.color.set(color);
      d.sp.position.copy(world).add(_hp.set((rand() - 0.5) * 0.1, 0.45 + rand() * 0.2, (rand() - 0.5) * 0.1));
      d.v.set((rand() - 0.5) * 0.55, 0.3 + rand() * 0.3, (rand() - 0.5) * 0.55);
      d.gy = floorY; d.life = 4 + rand() * 1.5; d.sp.visible = true; k += 1;
    }
  }
  function stepSeeds(dt) {
    for (const d of seeds) {
      if (d.life <= 0) continue;
      d.life -= dt;
      if (d.sp.position.y > d.gy) { d.v.y -= 3 * dt; d.sp.position.addScaledVector(d.v, dt); if (d.sp.position.y <= d.gy) { d.sp.position.y = d.gy; d.v.set(0, 0, 0); } }
      d.sp.scale.setScalar(0.055); d.sp.material.opacity = Math.min(1, d.life);
      if (d.life <= 0) d.sp.visible = false;
    }
  }
  // vòng gợn nước loang ra chỗ thả mồi
  const ripples = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 3; scene.add(m);
    return { m, life: 0, delay: 0 };
  });
  function spawnRipple(world, delay = 0) {
    const r = ripples.find((rr) => rr.life <= 0 && rr.delay <= 0) || ripples[0];
    r.m.position.copy(world); r.m.position.y += 0.012; r.life = 1.6; r.delay = delay;
  }
  function stepRipples(dt) {
    for (const r of ripples) {
      if (r.delay > 0) { r.delay -= dt; continue; }
      if (r.life <= 0) { r.m.visible = false; continue; }
      r.life -= dt; const u = 1 - Math.max(0, r.life) / 1.6;
      const sc = 0.06 + u * 0.5; r.m.scale.set(sc, sc, sc); r.m.material.opacity = (1 - u) * 0.65; r.m.visible = true;
    }
  }
  const _lw = new THREE.Vector3();
  const toWorld = (x, y, z) => island.localToWorld(_lw.set(x, y, z)).clone();
  // chạm bãi cỏ: rắc hạt → con vật gần nhất đang rảnh chạy tới ăn; thỉnh thoảng một chú chim sà xuống mổ
  function feedGround(g) {
    const w = toWorld(g.x, g.y, g.z);
    spawnSeeds(w, 10, w.y + 0.01); attract(w); fire('voice', { kind: 'seeds' });
    const free = critters.filter((c) => c.roam && c.g.visible && !c.mode && !(c.onceT > 0))
      .sort((a, b) => Math.hypot(a.g.position.x - g.x, a.g.position.z - g.z) - Math.hypot(b.g.position.x - g.x, b.g.position.z - g.z));
    for (const c of free) {
      const dx = c.g.position.x - g.x; const dz = c.g.position.z - g.z; const d = Math.hypot(dx, dz) || 1;
      if (routeTo(c, g.x + (dx / d) * 0.14, g.z + (dz / d) * 0.14) || routeTo(c, g.x, g.z)) {
        c.state = 'walk'; c.timer = 16; c.run = true; c.arrive = 'eat'; play(c, 'Gallop'); break;
      }
    }
    if (rand() < 0.6) {
      const b = birds.find((bb) => bb.state === 'circle' && bb.g.visible && bb.g.children.length);
      if (b) {
        const obj = new THREE.Object3D(); obj.position.set(g.x + 0.22, g.y, g.z + 0.16); island.add(obj); obj.updateMatrixWorld(true);
        b.nest = { obj, busy: b, temp: true }; b.state = 'toNest'; b.timer = 4.2; b.dur = 4.2; b.p0.copy(b.g.position);
      }
    }
  }
  // chạm mặt hồ: mồi rơi, nước gợn → cá & vịt bơi lại
  function feedWater(g) {
    const w = toWorld(g.x, WATER_Y, g.z);
    spawnRipple(w); spawnRipple(w, 0.4); spawnSeeds(w, 6, w.y + 0.006); fire('voice', { kind: 'splash' });
    fishes.forEach((f) => { f.feed = [g.x, g.z]; f.feedT = 6; f.boost = 1.4; feedTarget(f); });
    const d = ducks[0];
    if (d.g.visible && inPoly(POND_SWIM, g.x, g.z)) { d.tx = g.x; d.tz = g.z; d.boost = 2; d.pause = 0; }
  }
  // gọi con vật đang chọn tới chỗ vừa chạm
  function callTo(c, g) {
    if (g.kind !== 'ground' || !routeTo(c, g.x, g.z)) { feedGround(g); return; } // không tới được → rắc hạt thay
    select(null);
    c.mode = null; c.onceT = 0; c.state = 'walk'; c.timer = 16; c.run = true; c.arrive = 'call'; play(c, 'Gallop');
    addBond(c.file); fire('voice', { kind: c.file });
  }
  // giữ tay lên con vật: vuốt ve (cúi đầu lim dim, tim bay lên); giữ lâu → rủ cùng hít thở
  let pet = null;
  function startPet(c) {
    if (selected === c) select(null);
    pet = { c, t: 0, hT: 0 }; c.mode = 'pet'; c.run = false; c.arrive = null; c.onceT = 0;
    play(c, c.acts.Idle_2_HeadLow ? 'Idle_2_HeadLow' : 'Idle');
    controls.enabled = false; fire('voice', { kind: 'purr' });
  }
  function stepPet(dt) {
    if (!pet) return;
    pet.t += dt; pet.hT -= dt;
    if (pet.hT <= 0) { pet.hT = 0.45; pet.c.g.getWorldPosition(_hp); _hp.y += 0.25; spawnHearts(_hp, 1); }
    if (pet.t > 2.6 && !pet.breath) {
      pet.breath = true; pet.c.mode = 'breath'; pet.c.breathT = clock.elapsedTime + 0.3;
      fire('breathe-start', { animal: pet.c.file }); fire('voice', { kind: 'chime' });
    }
  }
  function endPet() {
    if (!pet) return;
    controls.enabled = true;
    const c = pet.c; const breathing = pet.breath; pet = null;
    if (breathing) return; // đang cùng thở: con vật ở lại tới khi bài thở kết thúc
    c.mode = null; c.state = 'idle'; c.timer = 2 + rand() * 2; addBond(c.file);
    playOnce(c, c.roam ? 'Jump_ToIdle' : 'Jump', () => play(c, 'Idle'));
  }
  // bài thở kết thúc / bấm Dừng: con vật thôi thở, nhảy mừng, tim bay lên
  timeOpts.exposeBreath?.(() => {
    const c = critters.find((cc) => cc.mode === 'breath');
    if (!c) return;
    c.breathT = undefined; c.g.children[0].scale.setScalar(c.baseScale);
    c.mode = null; c.state = 'idle'; c.timer = 3; addBond(c.file, 2);
    c.g.getWorldPosition(_hp); _hp.y += 0.25; spawnHearts(_hp, 6);
    playOnce(c, c.roam ? 'Jump_ToIdle' : 'Jump', () => play(c, 'Idle'));
    wake();
  });
  // điểm chạm trên mặt đảo / mặt hồ: dò theo tia trong toạ độ đảo, so với địa hình H(x, z)
  const _ro = new THREE.Vector3(); const _rd = new THREE.Vector3(); const _inv = new THREE.Matrix4();
  function pickGround(ev, step = 0.02) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    island.updateMatrixWorld(); _inv.copy(island.matrixWorld).invert();
    _ro.copy(raycaster.ray.origin).applyMatrix4(_inv); _rd.copy(raycaster.ray.direction).transformDirection(_inv);
    if (_rd.y >= -1e-4) return null;
    const s0 = Math.max(0, (2.4 - _ro.y) / _rd.y); const s1 = (-1.2 - _ro.y) / _rd.y;
    for (let sd = s0; sd <= s1; sd += step) {
      const x = _ro.x + _rd.x * sd; const y = _ro.y + _rd.y * sd; const z = _ro.z + _rd.z * sd;
      if (!inPoly(OUTLINE, x, z)) continue;
      if (pondDist(x, z) < 1 && y <= WATER_Y) return { kind: 'water', x, z, y: WATER_Y };
      const gy = H(x, z);
      if (y <= gy) return { kind: 'ground', x, z, y: gy };
    }
    return null;
  }

  /* ---------- Trang trí đảo: người dùng tự dời / cất đồ có sẵn và thêm đồ từ kho ----------
     layout chỉ ghi phần khác so với đảo mặc định: removed (id cất đi), moved (id → [x, z, xoay, cỡ]),
     added ([{ i, k, p }] đồ thêm từ kho). Cây / hoa tự thêm vẫn tươi – héo theo tâm trạng như đồ có sẵn. */
  const T = TREE_SCALE;
  const CATALOG = {
    tree_normal_1: { g: 'tree', file: 'tree_pack_trees', part: 'NormalTree_1', h: 1.35 * T },
    tree_normal_2: { g: 'tree', file: 'tree_pack_trees', part: 'NormalTree_2', h: 1.5 * T },
    tree_normal_3: { g: 'tree', file: 'tree_pack_trees', part: 'NormalTree_3', h: 1.05 * T },
    tree_normal_4: { g: 'tree', file: 'tree_pack_trees', part: 'NormalTree_4', h: 0.95 * T },
    tree_normal_5: { g: 'tree', file: 'tree_pack_trees', part: 'NormalTree_5', h: 0.8 * T },
    tree_maple_1: { g: 'tree', file: 'tree_pack_maple', part: 'MapleTree_1', h: 1.2 * T },
    tree_maple_2: { g: 'tree', file: 'tree_pack_maple', part: 'MapleTree_2', h: 1.4 * T },
    tree_maple_3: { g: 'tree', file: 'tree_pack_maple', part: 'MapleTree_3', h: 1.1 * T },
    tree_maple_4: { g: 'tree', file: 'tree_pack_maple', part: 'MapleTree_4', h: 0.75 * T },
    tree_maple_5: { g: 'tree', file: 'tree_pack_maple', part: 'MapleTree_5', h: 1.0 * T },
    tree_tall: { g: 'tree', file: 'tree_tree_tall', h: 1.6 * T },
    bush_green: { g: 'bush', file: 'tree_pack_flower_bushes', part: 'Plant_2', h: 0.36 },
    bush_bloom: { g: 'bush', file: 'tree_pack_flower_bushes', part: 'Plant_Flowers', h: 0.36 },
    bush_petals: { g: 'bush', file: 'tree_pack_flower_bushes', part: 'Petals_1', h: 0.26 },
    bush_red: { g: 'bush', file: 'tree_bush_red', h: 0.36 },
    bush_flowers: { g: 'bush', file: 'flora_bush_flowers', h: 0.38 },
    flower_pink: { g: 'flower', file: 'flora_flower_single_pink', h: 0.3 },
    flower_pink_group: { g: 'flower', file: 'flora_flower_group_pink', h: 0.34 },
    flower_yellow: { g: 'flower', file: 'flora_flower_single_yellow', h: 0.3 },
    flower_yellow_group: { g: 'flower', file: 'flora_flower_group_yellow', h: 0.34 },
    flower_purple: { g: 'flower', file: 'flora_plant_purple', h: 0.18 },
    flower_purple_big: { g: 'flower', file: 'flora_plant_big_purple', h: 0.22 },
    flower_pastel: { g: 'flower', file: 'flora2_pastel_plume', h: 0.3 },
    flower_marigold: { g: 'flower', file: 'flora2_marigold', h: 0.28 },
    flower_tulip: { g: 'flower', file: 'flora2_tulip3', h: 0.3 },
    flower_daisy: { g: 'flower', file: 'flora2_daisy_white', h: 0.3 },
    flower_tiny_1: { g: 'flower', file: 'flora2_tiny_flowers', part: 'Flower_5_Clump', h: 0.17 },
    flower_tiny_2: { g: 'flower', file: 'flora2_tiny_flowers', part: 'Flower_3_Clump', h: 0.17 },
    flower_tiny_3: { g: 'flower', file: 'flora2_tiny_flowers', part: 'Flower_1_Clump', h: 0.17 },
    grass: { g: 'grass', file: 'flora_grass', h: 0.2 },
    grass_tall: { g: 'grass', file: 'flora_grass_tall', h: 0.32 },
    grass_small: { g: 'grass', file: 'flora_grass_small', h: 0.15 },
    sprout: { g: 'grass', file: 'flora_small_plant', h: 0.09 },
    rock_moss: { g: 'stone', file: 'stone_rock_moss', h: 0.3 },
    rock_moss2: { g: 'stone', file: 'stone_rock_moss2', h: 0.28 },
    rock_flat: { g: 'stone', file: 'stone_rock_flat', h: 0.1 },
    rock_beige: { g: 'stone', file: 'stone_rock_beige', h: 0.28 },
    rock_red: { g: 'stone', file: 'stone_rock_red', h: 0.3 },
    rock_large_red: { g: 'stone', file: 'stone_rock_large_red', h: 0.5 },
    rock_formation: { g: 'stone', file: 'stone_rock_formation', h: 0.6 },
    pebbles: { g: 'stone', file: 'stone_pebbles', h: 0.03 },
    decor_bench: { g: 'decor', file: 'decor_bench', h: 0.22 },
    decor_fence: { g: 'decor', file: 'decor_fence', h: 0.16 },
    decor_lantern: { g: 'decor', file: 'decor_lantern_post', h: 0.55 },
    decor_bridge: { g: 'decor', file: 'decor_bridge', h: 0.51, span: 0.42, overWater: true },
    grow_tree: { g: 'grow', file: 'tree_pack_trees', part: 'NormalTree_1', h: 1.35 * T, grow: true },
    grow_maple: { g: 'grow', file: 'tree_pack_maple', part: 'MapleTree_5', h: 1.0 * T, grow: true },
    grow_bush: { g: 'grow', file: 'tree_pack_flower_bushes', part: 'Plant_Flowers', h: 0.4, grow: true },
    grow_flowers: { g: 'grow', file: 'flora_bush_flowers', h: 0.4, grow: true },
    animal_fox: { g: 'animal', file: 'fox' },
    animal_shiba: { g: 'animal', file: 'shiba' },
    animal_deer: { g: 'animal', file: 'deer' },
    animal_sheep: { g: 'animal', file: 'sheep' }
  };
  const MAX_ADDED = 150; const MAX_ANIMALS = 6; const MAX_PATHS = 30; const MAX_PATH_PTS = 80;
  const r4 = (v) => Math.round(v * 1e4) / 1e4;
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const normLayout = (l) => ({
    v: 1,
    removed: Array.isArray(l?.removed) ? [...l.removed] : [],
    moved: Object.fromEntries(Object.entries(l?.moved || {}).map(([k, v]) => [k, [...v]])),
    added: Array.isArray(l?.added) ? l.added.filter((a) => CATALOG[a?.k] && Array.isArray(a.p))
      .map((a) => ({ i: a.i, k: a.k, p: [...a.p], ...(a.d ? { d: a.d } : {}), ...(Number.isInteger(a.tr) ? { tr: a.tr } : {}), ...(a.f ? { f: 1 } : {}) })) : [],
    flips: Object.fromEntries(Object.entries(l?.flips || {}).filter(([, v]) => v === true)),
    ...(typeof l?.gs === 'string' ? { gs: l.gs } : {}),
    trims: Object.fromEntries(Object.entries(l?.trims || {}).filter(([, v]) => Number.isInteger(v))),
    cuts: Object.fromEntries(Object.entries(l?.cuts || {}).filter(([, v]) => typeof v === 'number' && v >= 0.5 && v <= 1)),
    paths: Array.isArray(l?.paths) ? l.paths.filter((q) => (q?.k === 'stone' || q?.k === 'gravel') && Array.isArray(q.pts))
      .map((q) => ({ i: q.i, k: q.k, pts: q.pts.map((pt) => [...pt]) })) : []
  });
  let layout = normLayout(timeOpts.layout);
  const items = new Map(); const spawning = new Set(); let pendingSelect = null;
  function registerDefault(id, g, extra = {}) {
    const it = { id, g, def: true, x0: g.position.x, y0: g.position.y, z0: g.position.z, ry0: g.rotation.y, s0: g.scale.x, r: 0.08, attached: true, shadowKey: skey(g.position.x, g.position.z), ...extra };
    if (!it.cat && it.file) it.cat = Object.keys(CATALOG).find((k) => CATALOG[k].file === it.file && (CATALOG[k].part || null) === (it.part || null) && !CATALOG[k].grow) || null;
    it.pose = [it.x0, it.z0, it.ry0, 1];
    g.userData.itemId = id; items.set(id, it);
    queueMicrotask(() => applyItem(it)); // sau khi bóng tiếp đất (tạo ngay sau đó) đã có
  }
  const itemShadow = (it) => (it.shadowKey ? shadowAt.get(it.shadowKey) : null);
  function setAttached(it, on) {
    if (it.attached === on) return;
    it.attached = on;
    if (it.critter) { it.critter.removed = !on; it.g.visible = on && h > it.critter.threshold; if (!on && selected === it.critter) select(null); }
    else if (on) addToIslandRaw(it.g);
    else it.g.parent?.remove(it.g);
    const sh = itemShadow(it); if (sh) sh.visible = on;
    if (!on && editor.sel === it) selectItem(null);
  }
  // cầu: đặt theo độ cao 2 đầu cầu (trục dài của mô hình là trục x)
  const spanY = (x, z, r, span) => Math.max(H(x + Math.cos(r) * span, z - Math.sin(r) * span), H(x - Math.cos(r) * span, z + Math.sin(r) * span)) - 0.036;
  // Luống cây lớn dần: mỗi ngày check-in (kể từ ngày trồng) cây lớn thêm; ~7 ngày là trưởng thành.
  // Không cắt tỉa thì vẫn mọc tiếp thành um tùm (to, nghiêng ngả) tới giới hạn; cắt tỉa → về dáng gọn rồi lớn chậm lại. Không bao giờ héo.
  let growBoost = 0; const previewTr = new Map(); // cắt tỉa lúc đang tua nhanh: chỉ xem thử, không lưu
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function growthOf(e) {
    const n = memData.filter((m) => m.day >= (e?.d || todayStr())).length + growBoost; // growBoost: admin tua nhanh để xem thử (không lưu)
    let sz; const tr = previewTr.has(e?.i) ? previewTr.get(e.i) : e?.tr;
    if (Number.isInteger(tr)) sz = Math.min(1.7, 1 + Math.max(0, n - tr) * 0.06);
    else sz = n < 7 ? 0.3 + n * 0.1 : Math.min(1.7, 1 + (n - 7) * 0.06);
    const stage = !Number.isInteger(tr) && n < 7 ? 'young' : sz >= 1.3 ? 'overgrown' : 'grown';
    return { n, s: sz, stage };
  }
  // Cây & bụi trên đảo (có sẵn hoặc thêm từ kho) mọc rậm dần theo ngày check-in kể từ ngày bật tính năng (gs):
  // mỗi ngày to thêm ~3%, tối đa 1.4 lần, vống & nghiêng dần; cắt tỉa → về dáng gọn ban đầu.
  function ageOf(it) {
    const n = memData.filter((m) => m.day >= (layout.gs || todayStr())).length + growBoost;
    const base = previewTr.has(it.id) ? previewTr.get(it.id) : (layout.trims[it.id] ?? 0);
    const sz = Math.min(1.4, 1 + Math.max(0, n - base) * 0.03);
    return { n: Math.max(0, n - base), s: sz, stage: sz >= 1.2 ? 'overgrown' : 'grown' };
  }
  function setPose(it, p) {
    const [x, z, r, sc] = p; it.pose = [x, z, r, sc];
    const atHome = it.def && Math.abs(x - it.x0) < 1e-4 && Math.abs(z - it.z0) < 1e-4;
    it.g.position.set(x, atHome ? it.y0 : it.span ? spanY(x, z, r, it.span * sc) : (it.critter ? groundY(x, z) : footY(x, z, Math.min(0.15, it.r))), z);
    it.g.rotation.y = r; it.g.scale.setScalar(it.s0 * sc);
    if (it.grow || it.aging) { // kích thước theo độ lớn; um tùm thì cao vống & nghiêng ngả
      const gr = it.grow ? growthOf(layout.added.find((a) => a.i === it.id)) : ageOf(it); it.growth = gr;
      const k = gr.s; const wild = Math.max(0, k - (it.grow ? 1.15 : 1.08));
      it.g.scale.set(it.s0 * sc * k, it.s0 * sc * k * (1 + wild * 0.25), it.s0 * sc * k);
      it.g.rotation.x = wild * 0.22 * Math.sin(it.pose[0] * 9); it.g.rotation.z = wild * 0.22 * Math.cos(it.pose[1] * 7);
    }
    if (it.flower) it.flower.s0 = it.s0 * sc;
    if (it.critter) { const c = it.critter; c.spot = [x, z]; c.tx = x; c.tz = z; c.route = []; if (c.state === 'walk') rest(c); }
    const cut = layout.cuts[it.id]; if (cut) it.g.scale.multiplyScalar(cut); // đã cắt tỉa cho gọn
    if (it.def ? layout.flips[it.id] : layout.added.find((a) => a.i === it.id)?.f) it.g.scale.x *= -1; // lật ngang
    const sh = itemShadow(it); if (sh) sh.position.set(x, groundY(x, z) + 0.008, z);
  }
  function applyItem(it) {
    if (it.def) {
      setAttached(it, !layout.removed.includes(it.id));
      const mv = layout.moved[it.id];
      if (mv) setPose(it, mv);
      else if (it.aging || it.pose[0] !== it.x0 || it.pose[1] !== it.z0 || it.pose[2] !== it.ry0 || it.pose[3] !== 1) setPose(it, [it.x0, it.z0, it.ry0, 1]);
    } else {
      const e = layout.added.find((a) => a.i === it.id);
      if (!e) destroyItem(it); else setPose(it, e.p);
    }
  }
  function applyLayout(l) {
    layout = normLayout(l);
    if (editor.pathCur !== null && !layout.paths.some((q) => q.i === editor.pathCur)) editor.pathCur = null;
    if (editor.selPath >= layout.paths.length) editor.selPath = -1;
    rebuildPaths();
    items.forEach(applyItem);
    layout.added.forEach((e) => { if (!items.has(e.i)) spawnAdded(e); });
    wake();
  }
  // tải mô hình theo món trong kho (mỗi file tải 1 lần, mỗi phần cache 1 "máy tạo")
  const partCache = new Map(); const makerCache = new Map();
  const getPart = (file) => { if (!partCache.has(file)) partCache.set(file, new Promise((res) => loadModel(file, res))); return partCache.get(file); };
  function getMaker(spec) {
    const key = `${spec.file}/${spec.part || ''}`;
    if (!makerCache.has(key)) makerCache.set(key, getPart(spec.file).then((part) => part(spec.part)));
    return makerCache.get(key);
  }
  const CRITTER_BY_FILE = Object.fromEntries(CRITTERS.map((c) => [c.file, c]));
  function spawnAdded(e) {
    const spec = CATALOG[e.k];
    if (!spec || spawning.has(e.i)) return;
    spawning.add(e.i);
    const done = (g, extra) => {
      spawning.delete(e.i);
      const still = layout.added.find((a) => a.i === e.i);
      const it = { id: e.i, g, def: false, cat: e.k, s0: g.scale.x, r: 0.08, attached: true, pose: [...e.p], ...extra };
      g.userData.itemId = e.i; items.set(e.i, it);
      if (!still) { destroyItem(it); return; }
      setPose(it, still.p);
      if (pendingSelect === e.i) { pendingSelect = null; selectItem(it); }
      wake();
    };
    if (spec.g === 'animal') {
      const base = CRITTER_BY_FILE[spec.file];
      spawnCritter({ ...base, spot: [e.p[0], e.p[1]], threshold: 0, face: undefined }, e.i, (c) => done(c.g, { critter: c, r: base.length * 0.4 }));
      return;
    }
    getMaker(spec).then((make) => {
      if (disposed) return;
      regSuppressed = true; const g = make(e.p[0], 0, e.p[1], spec.h, false, island); regSuppressed = false;
      contactShadow(0, 0, spec.h * (spec.g === 'tree' ? 0.2 : 0.32), g);
      let flower = null;
      if (spec.g === 'flower') { flower = { g, s0: g.scale.x, threshold: -1, tilt: rand() * Math.PI * 2 }; flowers.push(flower); }
      done(g, { flower, r: Math.min(0.3, Math.max(0.05, spec.h * 0.16)), span: spec.span || 0, grow: !!spec.grow, aging: !spec.grow && (spec.g === 'tree' || spec.g === 'bush') });
    });
  }
  function destroyItem(it) {
    items.delete(it.id);
    if (editor.sel === it) selectItem(null);
    if (it.critter) { const k = critters.indexOf(it.critter); if (k >= 0) critters.splice(k, 1); if (selected === it.critter) select(null); }
    if (it.flower) { const k = flowers.indexOf(it.flower); if (k >= 0) flowers.splice(k, 1); }
    const pk = plants.findIndex((pl) => pl.canopy.parent === it.g); if (pk >= 0) plants.splice(pk, 1);
    it.g.parent?.remove(it.g);
  }

  const editor = { on: false, tool: null, sel: null, drag: null, hist: [], brush: false, pathCur: null, selPath: -1, trim: false, erase: false };
  const editRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 40), new THREE.MeshBasicMaterial({ color: '#FFE08A', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  editRing.rotation.x = -Math.PI / 2; editRing.visible = false; editRing.renderOrder = 3; addToIslandRaw(editRing);
  const placeable = (x, z, animal, spec) => (spec?.overWater ? inPoly(OUT_IN, x, z) && pondDist(x, z) > 1.05 && !inMountain(x, z, 0.1) && segDist(SPILL, x, z) > 0.2
    : animal ? walkable(x, z)
    : inPoly(OUT_IN, x, z) && pondDist(x, z) > 1.08 && riverDist(x, z) > 0.16 && segDist(SPILL, x, z) > 0.16 && !inMountain(x, z, 0.05) && slopeAt(x, z) < 1.4);
  const emitSel = () => {
    const it = editor.sel;
    if (editor.selPath >= 0) fire('editor-select', { id: `path:${editor.selPath}`, path: true });
    else fire('editor-select', it ? { id: it.id, def: it.def, cat: it.cat || null, animal: !!it.critter, scale: it.pose[3], canDup: !!it.cat,
      canTrim: trimmable(it),
      grow: it.grow || it.aging ? { n: it.growth?.n || 0, stage: it.growth?.stage || 'young', aging: !!it.aging } : null } : null);
    fire('editor-state', { canUndo: editor.hist.length > 0, added: layout.added.length, pathOpen: editor.pathCur !== null,
      edited: layout.removed.length + Object.keys(layout.moved).length + layout.added.length + layout.paths.length > 0 });
  };
  // cây / bụi / hoa / cỏ (có sẵn hay tự thêm) đều cắt tỉa được — trừ con vật, đá, đồ trang trí, cầu
  const PLANT_GROUPS = ['tree', 'bush', 'flower', 'grass', 'grow'];
  const trimmable = (it) => !!it && !it.critter && !it.span && (it.aging || it.grow || PLANT_GROUPS.includes(CATALOG[it.cat]?.g) || /^(tree_|flora)/.test(it.file || ''));
  function trimItem(it) {
    if (!trimmable(it)) { fire('editor-notice', { code: 'notPlant' }); return; }
    const gr = it.grow ? growthOf(layout.added.find((a) => a.i === it.id)) : it.aging ? ageOf(it) : null;
    const bushy = gr && gr.s > 1.02; // đang rậm → tỉa về dáng gọn
    const cut0 = layout.cuts[it.id] || 1;
    if (!bushy && cut0 <= 0.61) { fire('editor-notice', { code: 'trimMin' }); return; }
    it.g.getWorldPosition(_hp); _hp.y += 0.3; spawnSeeds(_hp, 12, _hp.y - 0.3, '#7FB26A'); fire('voice', { kind: 'trim' }); // lá vụn rơi
    if (bushy && growBoost) { previewTr.set(it.id, it.aging ? gr.n + (layout.trims[it.id] ?? 0) : gr.n); setPose(it, it.pose); emitSel(); wake(); return; } // admin đang tua nhanh: chỉ xem thử
    change((l) => {
      if (bushy && it.aging) l.trims[it.id] = gr.n + (layout.trims[it.id] ?? 0) - growBoost;
      else if (bushy) { const e = l.added.find((a) => a.i === it.id); if (e) e.tr = gr.n; }
      else l.cuts[it.id] = r4(Math.max(0.6, cut0 * 0.88)); // đang gọn → tỉa bớt cho thanh thoát hơn
    });
  }
  function eraseItem(it) {
    if (editor.sel === it) selectItem(null);
    it.g.getWorldPosition(_hp); spawnSeeds(_hp, 6, _hp.y, '#CBB79A'); fire('voice', { kind: 'seeds' });
    change((l) => { if (it.def) { if (!l.removed.includes(it.id)) l.removed.push(it.id); delete l.moved[it.id]; } else l.added = l.added.filter((a) => a.i !== it.id); });
  }
  function erasePath(qi) {
    const id = layout.paths[qi]?.i; if (!id) return;
    editor.selPath = -1; change((l) => { l.paths = l.paths.filter((q) => q.i !== id); });
  }
  function selectItem(it) { editor.sel = it; editor.selPath = -1; emitSel(); }
  function change(fn) {
    editor.hist.push(JSON.stringify(layout)); if (editor.hist.length > 40) editor.hist.shift();
    const next = normLayout(layout); fn(next); applyLayout(next);
    fire('layout-change', { layout: normLayout(layout) }); emitSel();
  }
  function commitPose(it, p) {
    const q = [r4(p[0]), r4(p[1]), r4(wrapA(p[2])), r4(p[3])];
    change((l) => { if (it.def) l.moved[it.id] = q; else { const e = l.added.find((a) => a.i === it.id); if (e) e.p = q; } });
  }
  function addAt(key, x, z, opts = {}) {
    const spec = CATALOG[key]; if (!spec) return;
    if (layout.added.length >= MAX_ADDED) { fire('editor-notice', { code: 'limit', max: MAX_ADDED }); return; }
    if (spec.g === 'animal' && layout.added.filter((a) => CATALOG[a.k]?.g === 'animal').length >= MAX_ANIMALS) { fire('editor-notice', { code: 'animalLimit', max: MAX_ANIMALS }); return; }
    const id = `u${Date.now().toString(36)}${Math.floor(rand() * 1296).toString(36)}`;
    pendingSelect = id;
    const e = { i: id, k: key, p: [r4(x), r4(z), r4(wrapA(opts.r ?? rand() * Math.PI * 2)), r4(opts.s ?? 1)] };
    if (opts.f) e.f = 1;
    if (spec.grow) e.d = todayStr();
    change((l) => l.added.push(e));
  }
  function pickItem(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const objs = []; items.forEach((it) => { if (it.attached && it.g.visible && it.g.parent) objs.push(it.g); });
    for (const ht of raycaster.intersectObjects(objs, true)) {
      let o = ht.object; while (o && !o.userData.itemId) o = o.parent;
      if (o) return items.get(o.userData.itemId) || null;
    }
    return null;
  }
  /* Lối đi: chạm lần lượt các điểm trên bãi cỏ → đá lát hoặc sỏi nối theo. Vẽ bằng InstancedMesh (2 lượt vẽ). */
  const stoneGeo = (() => { const g = new THREE.CylinderGeometry(0.055, 0.062, 0.024, 7); g.translate(0, 0.006, 0); return g; })();
  const pebbleGeo = new THREE.IcosahedronGeometry(0.013, 0);
  const pathStones = new THREE.InstancedMesh(stoneGeo, new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.85 }), 1600);
  const pathPebbles = new THREE.InstancedMesh(pebbleGeo, new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, flatShading: true }), 6000);
  [pathStones, pathPebbles].forEach((m) => { m.count = 0; m.receiveShadow = true; m.frustumCulled = false; addToIslandRaw(m); });
  const STONE_TONES = ['#DCCFB6', '#D1C3A8', '#E4D9C4']; const PEBBLE_TONES = ['#D6C9AF', '#C2B396', '#E2D8C4', '#B9A88A'];
  let stoneOwner = []; let pebbleOwner = []; const _pm = new THREE.Object3D(); const _pc = new THREE.Color();
  function rebuildPaths() {
    let ns = 0; let np = 0; stoneOwner = []; pebbleOwner = [];
    layout.paths.forEach((q, qi) => {
      const pts = q.pts; if (!pts.length) return;
      const segs = pts.length === 1 ? [[pts[0], pts[0]]] : pts.slice(1).map((b, k) => [pts[k], b]);
      let carry = 0;
      segs.forEach(([a, b], si) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const tx = L ? (b[0] - a[0]) / L : 1; const tz = L ? (b[1] - a[1]) / L : 0;
        if (q.k === 'stone') {
          for (let d = carry; d <= L + 1e-6; d += 0.13) {
            if (ns >= pathStones.instanceMatrix.count) break;
            const h1 = hash(qi * 31 + si, d * 97, 41); const side = (Math.floor(d / 0.13) % 2 ? 1 : -1) * 0.022;
            const x = a[0] + tx * d - tz * side; const z = a[1] + tz * d + tx * side;
            _pm.position.set(x, groundY(x, z) + 0.004, z); _pm.rotation.set((h1 - 0.5) * 0.08, h1 * 6.28, (hash(d, qi, 7) - 0.5) * 0.08);
            _pm.scale.set(0.85 + h1 * 0.35, 1, 0.75 + hash(d, si, 3) * 0.3); _pm.updateMatrix();
            pathStones.setMatrixAt(ns, _pm.matrix); pathStones.setColorAt(ns, _pc.set(STONE_TONES[Math.floor(h1 * 3) % 3])); stoneOwner[ns] = qi; ns += 1;
          }
          carry = Math.max(0, (carry - L) % 0.13);
        } else {
          const count = Math.max(4, Math.round(L * 90));
          for (let k = 0; k < count; k += 1) {
            if (np >= pathPebbles.instanceMatrix.count) break;
            const h1 = hash(qi * 13 + si, k, 51); const h2 = hash(k, si * 7, qi + 3); const d = (k + h2 * 0.8) / count * L;
            const off = (h1 - 0.5) * 0.12;
            const x = a[0] + tx * d - tz * off; const z = a[1] + tz * d + tx * off;
            _pm.position.set(x, groundY(x, z) + 0.004, z); _pm.rotation.set(h1 * 3, h2 * 6, 0);
            const sc = 0.7 + h2 * 0.7; _pm.scale.set(sc, sc * 0.55, sc); _pm.updateMatrix();
            pathPebbles.setMatrixAt(np, _pm.matrix); pathPebbles.setColorAt(np, _pc.set(PEBBLE_TONES[Math.floor(h2 * 4) % 4])); pebbleOwner[np] = qi; np += 1;
          }
        }
      });
    });
    pathStones.count = ns; pathPebbles.count = np;
    [pathStones, pathPebbles].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  function pickPath(ev) {
    if (!layout.paths.length) return -1;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([pathStones, pathPebbles], false)[0];
    if (!hit || hit.instanceId === undefined) return -1;
    return (hit.object === pathStones ? stoneOwner : pebbleOwner)[hit.instanceId] ?? -1;
  }
  function addPathPoint(kind, x, z) {
    const cur = editor.pathCur !== null ? layout.paths.findIndex((q) => q.i === editor.pathCur) : -1;
    if (cur < 0) {
      if (layout.paths.length >= MAX_PATHS) { fire('editor-notice', { code: 'pathLimit', max: MAX_PATHS }); return; }
      const id = `p${Date.now().toString(36)}`; editor.pathCur = id;
      change((l) => l.paths.push({ i: id, k: kind, pts: [[r4(x), r4(z)]] }));
      return;
    }
    const q = layout.paths[cur]; const last = q.pts[q.pts.length - 1];
    if (Math.hypot(last[0] - x, last[1] - z) < 0.06) return;
    if (q.pts.length >= MAX_PATH_PTS) { fire('editor-notice', { code: 'pathLong' }); return; }
    change((l) => { const qq = l.paths.find((r) => r.i === q.i); if (qq) qq.pts.push([r4(x), r4(z)]); });
  }
  // cọ trồng: giữ & quét, đồ được trồng rải theo đường quét (gộp thành 1 lần hoàn tác)
  let brushStroke = null;
  function brushPlace(x, z) {
    const st = brushStroke; const spec = CATALOG[st.key];
    if (layout.added.length >= MAX_ADDED) { if (!st.warned) { st.warned = true; fire('editor-notice', { code: 'limit', max: MAX_ADDED }); } return; }
    const jx = x + (rand() - 0.5) * 0.06; const jz = z + (rand() - 0.5) * 0.06;
    if (!placeable(jx, jz, false, spec)) return;
    const e = { i: `u${Date.now().toString(36)}${Math.floor(rand() * 46656).toString(36)}`, k: st.key, p: [r4(jx), r4(jz), r4(wrapA(rand() * Math.PI * 2)), r4(0.8 + rand() * 0.4)] };
    if (spec.grow) e.d = todayStr();
    layout.added.push(e); spawnAdded(e); st.n += 1; st.last = [x, z];
  }
  const brushGap = (key) => ({ flower: 0.11, grass: 0.1, bush: 0.2, stone: 0.18 }[CATALOG[key]?.g] || 0.25);
  /* Bóng mờ ướm vị trí: chọn một món trong kho → bản mờ của món đó chạy theo chuột / chỗ chạm; xoay, lật, đổi cỡ
     trước rồi mới đặt. Không đặt được (hồ, suối, vách…) thì bóng ánh đỏ. */
  const ghostState = { r: 0, s: 1, f: false, x: 0, z: 0, has: false, ok: false };
  let ghost = null; let ghostToken = 0;
  const isCatalogTool = () => !!editor.tool && !!CATALOG[editor.tool] && !(editor.brush && !['animal', 'decor', 'grow'].includes(CATALOG[editor.tool].g));
  function clearGhost() {
    if (ghost?.g) { ghost.g.parent?.remove(ghost.g); ghost.g.traverse((o) => { if (o.isMesh) o.material.dispose(); }); }
    ghost = null; ghostState.has = false;
  }
  function makeGhost(key) {
    clearGhost(); const token = ++ghostToken;
    const spec = CATALOG[key]; if (!spec) return;
    ghost = { key, spec, g: null };
    ghostState.r = wrapA(rand() * Math.PI * 2); ghostState.s = 1; ghostState.f = false;
    if (spec.g === 'animal') { emitGhost(); return; } // con vật: chỉ vòng sáng
    getMaker(spec).then((make) => {
      if (token !== ghostToken || disposed) return;
      const tmp = new THREE.Group(); tmp.userData.thumb = true;
      regSuppressed = true; const g = make(0, 0, 0, spec.h, false, tmp); regSuppressed = false;
      g.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; o.material.depthWrite = false;
        o.castShadow = false; o.receiveShadow = false; o.renderOrder = 4;
      });
      island.add(g); g.visible = false; ghost.g = g; ghost.s0 = g.scale.x;
      updateGhost(); wake();
    });
    emitGhost();
  }
  function updateGhost() {
    if (!ghost) return;
    const { x, z } = ghostState; const spec = ghost.spec;
    ghostState.ok = ghostState.has && placeable(x, z, spec.g === 'animal', spec);
    if (ghost.g) {
      ghost.g.visible = ghostState.has;
      if (ghostState.has) {
        const y = spec.span ? spanY(x, z, ghostState.r, spec.span * ghostState.s) : footY(x, z, 0.08);
        ghost.g.position.set(x, y, z); ghost.g.rotation.set(0, ghostState.r, 0);
        ghost.g.scale.setScalar(ghost.s0 * ghostState.s); if (ghostState.f) ghost.g.scale.x *= -1;
        ghost.g.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material.emissive.set(ghostState.ok ? '#000000' : '#FF4A3D'); o.material.emissiveIntensity = ghostState.ok ? 0 : 0.6; } });
      }
    }
  }
  const emitGhost = () => fire('ghost', { active: !!ghost, pending: ghostState.has, ok: ghostState.ok, scale: ghostState.s });
  function placeGhost() {
    if (!ghost || !ghostState.has) return;
    if (!ghostState.ok) { fire('editor-notice', { code: 'cantPlace' }); return; }
    addAt(ghost.key, ghostState.x, ghostState.z, { r: ghostState.r, s: ghostState.s, f: ghostState.f });
    pendingSelect = null; // giữ nguyên công cụ để đặt tiếp
  }
  let ed = null;
  function edDown(e) {
    if (editor.tool && editor.brush && CATALOG[editor.tool] && !['animal', 'decor', 'grow'].includes(CATALOG[editor.tool].g)) {
      const g = pickGround(e);
      if (g?.kind === 'ground') {
        brushStroke = { key: editor.tool, last: null, n: 0, hist: JSON.stringify(layout) }; controls.enabled = false;
        brushPlace(g.x, g.z); wake(); return;
      }
    }
    ed = { x: e.clientX, y: e.clientY, t: performance.now(), it: pickItem(e), moved: false };
    if (ed.it && ed.it === editor.sel && !editor.trim && !editor.erase) { editor.drag = ed.it; controls.enabled = false; } // kéo đồ đang chọn
  }
  function edMove(e) {
    if (brushStroke) {
      const g = pickGround(e, 0.03);
      if (g?.kind === 'ground' && (!brushStroke.last || Math.hypot(g.x - brushStroke.last[0], g.z - brushStroke.last[1]) > brushGap(brushStroke.key))) brushPlace(g.x, g.z);
      return;
    }
    if (!ed && ghost && e.pointerType !== 'touch') {
      const g = pickGround(e, 0.05);
      ghostState.has = g?.kind === 'ground'; if (g) { ghostState.x = g.x; ghostState.z = g.z; }
      updateGhost(); wake();
    }
    if (!ed) { if (e.pointerType !== 'touch') renderer.domElement.style.cursor = editor.tool ? 'copy' : (pickItem(e) ? (editor.trim || editor.erase ? 'crosshair' : 'pointer') : ''); return; }
    if (!ed.moved && Math.hypot(e.clientX - ed.x, e.clientY - ed.y) > 8) ed.moved = true;
    const it = editor.drag;
    if (it && ed.moved) {
      const g = pickGround(e, 0.03);
      if (g?.kind === 'ground' && placeable(g.x, g.z, !!it.critter, it.span ? { overWater: true } : null)) { setPose(it, [g.x, g.z, it.pose[2], it.pose[3]]); wake(); }
    }
  }
  function endBrush() {
    if (!brushStroke) return;
    const st = brushStroke; brushStroke = null; controls.enabled = true;
    if (!st.n) return;
    editor.hist.push(st.hist); if (editor.hist.length > 40) editor.hist.shift();
    fire('layout-change', { layout: normLayout(layout) }); emitSel();
  }
  function edUp(e) {
    if (brushStroke) { endBrush(); return; }
    const d = ed; ed = null; if (!d) return;
    const it = editor.drag;
    if (it) { editor.drag = null; controls.enabled = true; if (d.moved) { commitPose(it, it.pose); return; } }
    if (d.moved || performance.now() - d.t > 600) return; // kéo xoay đảo
    if (editor.trim) { if (d.it) trimItem(d.it); else fire('editor-notice', { code: 'notPlant' }); return; }
    if (editor.erase) { // cục tẩy: chạm món nào xoá món đó (cả lối đi)
      if (d.it) eraseItem(d.it); else { const pi = pickPath(e); if (pi >= 0) erasePath(pi); }
      return;
    }
    if (editor.tool?.startsWith('path:')) {
      const g = pickGround(e);
      if (g?.kind === 'ground' && placeable(g.x, g.z, false)) addPathPoint(editor.tool.slice(5), g.x, g.z);
      else fire('editor-notice', { code: 'cantPlace' });
      return;
    }
    if (ghost && isCatalogTool()) {
      const g = pickGround(e);
      if (g?.kind !== 'ground') { fire('editor-notice', { code: 'cantPlace' }); return; }
      ghostState.x = g.x; ghostState.z = g.z; ghostState.has = true; updateGhost();
      if (e.pointerType === 'touch') { emitGhost(); wake(); return; } // điện thoại: ướm trước, bấm "Đặt ở đây"
      placeGhost(); wake(); return;
    }
    if (editor.tool) {
      const g = pickGround(e);
      const animal = CATALOG[editor.tool]?.g === 'animal';
      if (g?.kind === 'ground' && placeable(g.x, g.z, animal, CATALOG[editor.tool])) addAt(editor.tool, g.x, g.z);
      else fire('editor-notice', { code: 'cantPlace' });
      return;
    }
    if (!d.it) { const pi = pickPath(e); if (pi >= 0) { editor.sel = null; editor.selPath = pi; emitSel(); return; } }
    selectItem(d.it);
  }
  function edCancel() { endBrush(); if (editor.drag) { const it = editor.drag; editor.drag = null; controls.enabled = true; applyItem(it); } ed = null; }

  // ảnh thu nhỏ cho kho đồ: vẽ mô hình bằng một renderer nhỏ riêng (tạo khi mở kho, giữ đến khi đóng vườn)
  let thumbR = null; let thumbScene = null; let thumbCam = null; const thumbCache = new Map();
  function renderThumb(obj) {
    if (!thumbR) {
      thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbR.setPixelRatio(1); thumbR.setSize(112, 112, false); thumbR.toneMapping = renderer.toneMapping;
      thumbScene = new THREE.Scene();
      thumbScene.add(new THREE.HemisphereLight('#FFFFFF', '#8AA77A', 1.7));
      const dl = new THREE.DirectionalLight('#FFF4E0', 2.4); dl.position.set(2, 4, 3); thumbScene.add(dl);
      thumbCam = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    }
    const holder = new THREE.Group(); holder.add(obj); thumbScene.add(holder); holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder); const size = box.getSize(new THREE.Vector3()); const c = box.getCenter(new THREE.Vector3());
    const d = Math.max(size.x, size.y, size.z) * 2.3 || 1;
    thumbCam.position.set(c.x + d * 0.55, c.y + d * 0.42, c.z + d * 0.72); thumbCam.near = d / 60; thumbCam.far = d * 10;
    thumbCam.updateProjectionMatrix(); thumbCam.lookAt(c);
    thumbR.render(thumbScene, thumbCam);
    const url = thumbR.domElement.toDataURL('image/png');
    thumbScene.remove(holder);
    return url;
  }
  function catalogThumb(key) {
    if (thumbCache.has(key)) return thumbCache.get(key);
    const spec = CATALOG[key]; if (!spec || !gltf) return Promise.resolve(null);
    let pr;
    if (spec.g === 'animal') {
      pr = new Promise((res) => {
        const ld = new gltf.GLTFLoader(); ld.setMeshoptDecoder(gltf.MeshoptDecoder);
        ld.load(`/models/garden/${spec.file}.glb`, (r) => {
          const idle = r.animations.find((a) => a.name === 'Idle');
          if (idle) { const mx = new THREE.AnimationMixer(r.scene); mx.clipAction(idle).play(); mx.update(0.05); }
          r.scene.rotation.y = 0.5; res(renderThumb(r.scene));
        }, undefined, () => res(null));
      });
    } else {
      pr = getMaker(spec).then((make) => {
        const tmp = new THREE.Group(); tmp.userData.thumb = true;
        regSuppressed = true; const g = make(0, 0, 0, 1, false, tmp); regSuppressed = false;
        g.rotation.y = 0.6;
        return renderThumb(g);
      });
    }
    thumbCache.set(key, pr);
    return pr;
  }
  timeOpts.exposeEditor?.({
    applyLayout,
    catalog: () => Object.entries(CATALOG).map(([key, v]) => ({ key, group: v.g })),
    thumb: catalogThumb,
    enter() { editor.on = true; if (selected) select(null); if (pet) endPet(); editor.hist = []; emitSel(); wake(); },
    exit() { clearGhost(); emitGhost(); editor.trim = false; editor.erase = false; if (growBoost) { growBoost = 0; previewTr.clear(); items.forEach((it) => { if ((it.grow || it.aging) && it.attached) setPose(it, it.pose); }); } endBrush(); editor.pathCur = null; editor.on = false; editor.tool = null; editor.drag = null; selectItem(null); renderer.domElement.style.cursor = ''; wake(); },
    ghostRotate(dir) { ghostState.r = wrapA(ghostState.r + (dir * Math.PI) / 8); updateGhost(); emitGhost(); wake(); },
    ghostFlip() { ghostState.f = !ghostState.f; updateGhost(); emitGhost(); wake(); },
    ghostScale(dir) { ghostState.s = Math.min(2.5, Math.max(0.4, ghostState.s * (dir > 0 ? 1.15 : 1 / 1.15))); updateGhost(); emitGhost(); wake(); },
    placeGhost() { placeGhost(); wake(); },
    flip() {
      const it = editor.sel; if (!it) return;
      change((l) => {
        if (it.def) { if (l.flips[it.id]) delete l.flips[it.id]; else l.flips[it.id] = true; } else { const e = l.added.find((a) => a.i === it.id); if (e) { if (e.f) delete e.f; else e.f = 1; } }
      });
    },
    setTool(key) {
      if (key) { editor.trim = false; editor.erase = false; }
      editor.tool = key && (CATALOG[key] || /^path:(stone|gravel)$/.test(key)) ? key : null;
      if (!editor.tool?.startsWith('path:')) editor.pathCur = null;
      if (editor.tool) selectItem(null); else emitSel();
      if (isCatalogTool()) makeGhost(editor.tool); else { clearGhost(); emitGhost(); }
    },
    setBrush(on) { editor.brush = !!on; if (isCatalogTool()) { if (!ghost || ghost.key !== editor.tool) makeGhost(editor.tool); } else { clearGhost(); emitGhost(); } },
    boostGrowth(days) { // admin xem thử: cộng thêm số ngày check-in giả cho luống cây (0 = về thật)
      growBoost = days ? growBoost + days : 0; if (!growBoost) previewTr.clear();
      items.forEach((it) => { if ((it.grow || it.aging) && it.attached) setPose(it, it.pose); });
      emitSel(); fire('editor-boost', { days: growBoost }); wake();
    },
    endPath() { editor.pathCur = null; emitSel(); },
    duplicate() {
      const it = editor.sel; if (!it?.cat) return;
      const spec = CATALOG[it.cat]; const animal = spec.g === 'animal';
      for (let k = 0; k < 16; k += 1) {
        const a = it.pose[2] + (k * Math.PI) / 4; const dd = (spec.h || 0.3) * 0.35 + 0.18 + Math.floor(k / 8) * 0.15;
        const x = it.pose[0] + Math.cos(a) * dd; const z = it.pose[1] + Math.sin(a) * dd;
        if (placeable(x, z, animal, spec)) { addAt(it.cat, x, z, { r: it.pose[2], s: it.pose[3] }); return; }
      }
      fire('editor-notice', { code: 'cantPlace' });
    },
    setTrimMode(on) { editor.trim = !!on; if (on) { clearGhost(); emitGhost(); editor.erase = false; editor.tool = null; editor.pathCur = null; selectItem(null); } },
    setEraseMode(on) { editor.erase = !!on; if (on) { clearGhost(); emitGhost(); editor.trim = false; editor.tool = null; editor.pathCur = null; selectItem(null); } },
    // dọn trống đảo: cất hết đồ có sẵn (kể cả con vật), bỏ đồ tự thêm & lối đi — chỉ còn địa hình, hồ, suối, núi, thảm cỏ
    clearAll() {
      selectItem(null); editor.pathCur = null;
      const ids = []; items.forEach((it) => { if (it.def) ids.push(it.id); });
      change((l) => { l.removed = [...new Set([...l.removed, ...ids])]; l.moved = {}; l.added = []; l.paths = []; });
    },
    trim() { trimItem(editor.sel); },
    trimOld() {
      const it = editor.sel; if (!it?.grow && !it?.aging) return;
      const gr = it.grow ? growthOf(layout.added.find((a) => a.i === it.id)) : ageOf(it); if (gr.s <= 1.02) return;
      it.g.getWorldPosition(_hp); _hp.y += 0.3; spawnSeeds(_hp, 12, _hp.y - 0.3, '#7FB26A'); fire('voice', { kind: 'trim' }); // lá vụn rơi
      const nTotal = it.aging ? gr.n + (layout.trims[it.id] ?? 0) : gr.n; // cây cũ: mốc = tổng số ngày tính từ gs
      if (growBoost) { previewTr.set(it.id, nTotal); setPose(it, it.pose); emitSel(); wake(); return; } // đang xem thử
      if (it.aging) change((l) => { l.trims[it.id] = nTotal - growBoost; });
      else change((l) => { const e = l.added.find((a) => a.i === it.id); if (e) e.tr = gr.n; });
    },
    rotate() { const it = editor.sel; if (it) commitPose(it, [it.pose[0], it.pose[1], it.pose[2] + Math.PI / 4, it.pose[3]]); },
    scale(dir) { const it = editor.sel; if (it) commitPose(it, [it.pose[0], it.pose[1], it.pose[2], Math.min(2.5, Math.max(0.4, it.pose[3] * (dir > 0 ? 1.2 : 1 / 1.2)))]); },
    remove() {
      const it = editor.sel; if (!it) { if (editor.selPath >= 0) this.removePath(); return; }
      selectItem(null);
      change((l) => { if (it.def) { if (!l.removed.includes(it.id)) l.removed.push(it.id); delete l.moved[it.id]; } else l.added = l.added.filter((a) => a.i !== it.id); });
    },
    removePath() {
      const qi = editor.selPath; if (qi < 0) return;
      editor.selPath = -1; const id = layout.paths[qi]?.i;
      change((l) => { l.paths = l.paths.filter((q) => q.i !== id); });
    },
    undo() {
      if (!editor.hist.length) return;
      selectItem(null);
      applyLayout(JSON.parse(editor.hist.pop()));
      fire('layout-change', { layout: normLayout(layout) }); emitSel();
    },
    reset() { selectItem(null); editor.pathCur = null; change((l) => { l.removed = []; l.moved = {}; l.added = []; l.paths = []; l.trims = {}; l.cuts = {}; l.flips = {}; }); }
  });
  // đồ người dùng thêm đã lưu: tạo luôn khi dựng cảnh
  layout.added.forEach((e) => spawnAdded(e));
  rebuildPaths();

  // Đồ trang trí đặt sẵn (CC0): cầu gỗ bắc qua suối, ghế gỗ bên bờ hồ nhìn ra mặt nước.
  // Gọi loadModel sau cùng trong lúc dựng cảnh → mã của các đồ có sẵn trước đó không đổi (layout đã lưu vẫn đúng).
  const fixDefaultPose = (g, extra = {}) => { const it = items.get(g.userData.itemId); if (it) { it.ry0 = g.rotation.y; it.y0 = g.position.y; it.pose = [it.x0, it.z0, it.ry0, 1]; Object.assign(it, extra); } };
  loadModel('decor_bridge', (part) => {
    let best = null;
    for (let i = 6; i < RIVER_FINE.length - 6; i += 1) {
      const [x, z] = RIVER_FINE[i]; const [x2, z2] = RIVER_FINE[i + 1];
      if (pondDist(x, z) < 1.45 || segDist(SPILL, x, z) < 0.5) continue;
      const tl = Math.hypot(x2 - x, z2 - z) || 1; const nx = -(z2 - z) / tl; const nz = (x2 - x) / tl; const S = 0.42;
      const a = [x + nx * S, z + nz * S]; const b = [x - nx * S, z - nz * S];
      if (!inPoly(OUT_IN, a[0], a[1]) || !inPoly(OUT_IN, b[0], b[1]) || riverDist(a[0], a[1]) < 0.24 || riverDist(b[0], b[1]) < 0.24) continue;
      const ha = H(a[0], a[1]); const hb = H(b[0], b[1]);
      const score = Math.abs(ha - hb) + (slopeAt(a[0], a[1]) + slopeAt(b[0], b[1])) * 0.04 + Math.abs(i / RIVER_FINE.length - 0.45) * 0.08;
      if (!best || score < best.score) best = { x, z, nx, nz, score };
    }
    if (!best) return;
    const r = Math.atan2(-best.nz, best.nx); // trục dài của cầu vuông góc với dòng suối
    const g = part()(best.x, spanY(best.x, best.z, r, 0.42), best.z, 0.51, false);
    g.rotation.y = r; fixDefaultPose(g, { span: 0.42 });
  });
  loadModel('decor_bench', (part) => {
    let best = null;
    for (let k = 0; k < 72; k += 1) {
      const a = (k / 72) * Math.PI * 2;
      for (const f of [1.22, 1.3, 1.38]) {
        const x = POND_C[0] + Math.cos(a) * POND_R[0] * f; const z = POND_C[1] + Math.sin(a) * POND_R[1] * f;
        if (!inPoly(OUT_IN, x, z) || riverDist(x, z) < 0.32 || segDist(SPILL, x, z) < 0.32 || inMountain(x, z, 0.1) || pondDist(x, z) < 1.15) continue;
        const [lo, hi] = footRangeAt(x, z, 0.12); if (hi - lo > 0.045) continue;
        const score = -((x - POND_C[0]) + (z - POND_C[1])) * 0.6 + (hi - lo) * 4 + f * 0.2; // ưu tiên phía người xem, chỗ bằng phẳng, sát bờ
        if (!best || score < best.score) best = { x, z, y: lo - 0.004, score };
      }
    }
    if (!best) return;
    const g = part()(best.x, best.y, best.z, 0.22, false);
    g.rotation.y = Math.atan2(POND_C[0] - best.x, POND_C[1] - best.z); // mặt ghế (+z) quay ra hồ
    fixDefaultPose(g); contactShadow(best.x, best.z, 0.14);
  });

  /* ---------- Vườn ký ức: mỗi ngày check-in tâm trạng = một bông hoa nhỏ, màu theo cảm xúc ----------
     Mọc theo đường xoắn ốc từ giữa bãi cỏ ra ngoài (cũ ở giữa → mới ở ngoài) như kể lại hành trình.
     3 InstancedMesh (cánh, thân, nhuỵ) cho tối đa 60 bông → 3 lượt vẽ, rất nhẹ. */
  const MEM_COLORS = { 'Rất vui': '#FFD54A', 'Thoải mái': '#86D49B', 'Bình thường': '#F6EEDC', 'Hơi căng': '#F7B98B', 'Rất căng thẳng': '#EE9C9C', 'Buồn bã': '#B7A6EE', 'Tức giận': '#E9806A' };
  const memColor = (m) => C(MEM_COLORS[m.emotion] || (m.score >= 8 ? '#FFD54A' : m.score >= 6 ? '#86D49B' : m.score >= 4.5 ? '#F6EEDC' : m.score >= 3 ? '#F7B98B' : '#B7A6EE'));
  function concatGeos(list) { // gộp vài hình nhỏ thành một
    const parts = list.map((g) => (g.index ? g.toNonIndexed() : g));
    const n = parts.reduce((a, g) => a + g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); let o = 0;
    parts.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return out;
  }
  // 4 kiểu hoa (chọn ngẫu nhiên theo ngày, cố định cho mỗi ngày); cánh tô màu cảm xúc
  const petalRing = (n, build) => concatGeos(Array.from({ length: n }, (_, i) => { const g = build(); g.rotateY((i / n) * Math.PI * 2); return g; }));
  const MEM_TYPES = [
    // cúc 5 cánh tròn
    petalRing(5, () => { const g = new THREE.SphereGeometry(0.034, 8, 6); g.scale(1, 0.32, 0.62); g.translate(0.036, 0, 0); g.rotateZ(0.35); g.translate(0, 0.15, 0); return g; }),
    // cúc nhiều cánh mảnh
    petalRing(11, () => { const g = new THREE.SphereGeometry(0.03, 6, 4); g.scale(1.45, 0.2, 0.3); g.translate(0.046, 0, 0); g.rotateZ(0.18); g.translate(0, 0.15, 0); return g; }),
    // tulip: cánh khum ôm lấy nhuỵ
    petalRing(4, () => { const g = new THREE.SphereGeometry(0.03, 8, 6); g.scale(0.6, 1.25, 0.62); g.translate(0.015, 0, 0); g.rotateZ(-0.22); g.translate(0, 0.175, 0); return g; }),
    // cụm hoa nhỏ (3 bông tròn quanh ngọn)
    concatGeos([[0.03, 0.165, 0], [-0.02, 0.185, 0.026], [-0.014, 0.15, -0.03], [0, 0.2, -0.004]].map(([x, y, z], k) => {
      const g = petalRing(5, () => { const q = new THREE.SphereGeometry(0.013, 6, 4); q.scale(1, 0.4, 0.7); q.translate(0.013, 0, 0); q.rotateZ(0.4); return q; });
      g.scale(k === 3 ? 0.8 : 1, 1, k === 3 ? 0.8 : 1); g.translate(x, y, z); return g;
    }))
  ];
  const memStemGeo = concatGeos([
    (() => { const g = new THREE.CylinderGeometry(0.005, 0.007, 0.15, 5); g.translate(0, 0.075, 0); return g; })(),
    (() => { const g = new THREE.SphereGeometry(0.022, 6, 4); g.scale(1, 0.25, 0.5); g.rotateZ(0.4); g.translate(0.022, 0.06, 0); return g; })()
  ]);
  const memCenterGeo = (() => { const g = new THREE.SphereGeometry(0.018, 8, 6); g.scale(1, 0.6, 1); g.translate(0, 0.157, 0); return g; })();
  const memPetalMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.55 });
  const memPetalMeshes = MEM_TYPES.map((geo) => new THREE.InstancedMesh(geo, memPetalMat, 60));
  const memStem = new THREE.InstancedMesh(memStemGeo, new THREE.MeshStandardMaterial({ color: '#5DAE5F', roughness: 0.8 }), 60);
  const memCenter = new THREE.InstancedMesh(memCenterGeo, new THREE.MeshStandardMaterial({ color: '#FFE9A6', roughness: 0.6, emissive: '#FFD27A', emissiveIntensity: 0.25 }), 60);
  const memMeshes = [...memPetalMeshes, memStem, memCenter];
  memMeshes.forEach((m) => { m.count = 0; m.castShadow = true; m.frustumCulled = false; addToIslandRaw(m); });
  // chỗ có thể mọc: rải khắp bãi cỏ trên đảo (tránh hồ, suối, vách, núi, gốc cây)
  let memCands = null;
  const memCandidates = () => {
    if (memCands) return memCands;
    memCands = [];
    for (let gz = -2.5; gz <= 2.5; gz += 0.13) {
      for (let gx = -2.5; gx <= 2.5; gx += 0.13) {
        const x = gx + (hash(gx * 7, gz * 3, 21) - 0.5) * 0.1; const z = gz + (hash(gx * 5, gz * 9, 23) - 0.5) * 0.1;
        if (free(x, z) && TREE_SPOTS.every(([tx, tz]) => Math.hypot(x - tx, z - tz) > 0.3)) memCands.push([x, z]);
      }
    }
    return memCands;
  };
  const dayNum = (day) => { let n = 0; for (let k = 0; k < day.length; k += 1) n = (n * 31 + day.charCodeAt(k)) % 1000003; return n; };
  let memData = []; let memPos = []; let memType = []; let memSlot = [];
  let memGrow = -1; let memGrowT = 0; const _mo = new THREE.Object3D(); const memHidden = new Set();
  // mỗi ngày: chỗ mọc & kiểu hoa "ngẫu nhiên" nhưng cố định theo ngày (mở lại vẫn ở đúng chỗ cũ)
  function layoutMemories() {
    const cands = memCandidates(); const used = [];
    memPos = []; memType = []; memSlot = []; const slots = MEM_TYPES.map(() => 0);
    memData.forEach((m) => {
      const n = dayNum(String(m.day || ''));
      let k = Math.floor(hash(n, 3, 7) * cands.length); let spot = null;
      for (let tries = 0; tries < cands.length && cands.length; tries += 1) {
        const c = cands[(k + tries * 37) % cands.length];
        if (used.every(([ux, uz]) => Math.hypot(ux - c[0], uz - c[1]) > 0.14)) { spot = c; break; }
      }
      spot = spot || cands[k % Math.max(1, cands.length)] || [0, 0];
      used.push(spot); memPos.push(spot);
      const ty = Math.floor(hash(n, 11, 5) * MEM_TYPES.length) % MEM_TYPES.length;
      memType.push(ty); memSlot.push(slots[ty]); slots[ty] += 1;
    });
    memPetalMeshes.forEach((mm, ty) => { mm.count = slots[ty]; });
    memStem.count = memData.length; memCenter.count = memData.length;
  }
  function placeMemories(growK = 1) {
    memData.forEach((_m, i) => {
      const [x, z] = memPos[i]; const k = memHidden.has(i) ? 0 : i === memGrow ? growK : 1;
      const n = dayNum(String(memData[i].day || ''));
      _mo.position.set(x, footY(x, z, 0.04), z);
      _mo.rotation.set(0, hash(n, 5, 11) * Math.PI * 2, (hash(n, 7, 11) - 0.5) * 0.25);
      _mo.scale.setScalar(Math.max(0.001, (0.95 + hash(n, 3, 11) * 0.35) * k)); _mo.updateMatrix();
      memPetalMeshes[memType[i]].setMatrixAt(memSlot[i], _mo.matrix);
      memStem.setMatrixAt(i, _mo.matrix); memCenter.setMatrixAt(i, _mo.matrix);
    });
    memMeshes.forEach((mm) => { mm.instanceMatrix.needsUpdate = true; });
  }
  function setMemories(list, quiet = false) {
    const prev = memData.length; const prevLast = memData[prev - 1];
    memData = (Array.isArray(list) ? list : []).slice(-60);
    items.forEach((it) => { if ((it.grow || it.aging) && it.attached) setPose(it, it.pose); }); // cây lớn / rậm theo số ngày check-in
    const last = memData[memData.length - 1];
    const changedToday = prev > 0 && memData.length === prev && last && prevLast && last.day === prevLast.day && (last.emotion !== prevLast.emotion || last.score !== prevLast.score);
    layoutMemories();
    memData.forEach((m, i) => memPetalMeshes[memType[i]].setColorAt(memSlot[i], memColor(m)));
    memPetalMeshes.forEach((mm) => { if (mm.instanceColor) mm.instanceColor.needsUpdate = true; });
    // bông mới (ngày mới check-in / hôm nay đổi cảm xúc): ẩn trước rồi lần lượt nở — màn lớn có máy quay lướt tới xem
    const fresh = [];
    if (prev > 0) { for (let i = prev; i < memData.length; i += 1) fresh.push(i); if (changedToday) fresh.push(memData.length - 1); }
    memHidden.clear(); memGrow = -1; memGrowT = 0;
    if (quiet || !fresh.length || reduceMotion) { placeMemories(1); if (!quiet) wake(); return; }
    fresh.forEach((i) => memHidden.add(i));
    placeMemories(1);
    startReveal(fresh, !!controls && !editor.on);
    wake();
  }
  const reveal = { on: false, q: [], cam: false, phase: '', t: 0, dur: 1, then: '', cur: -1, from: [new THREE.Vector3(), new THREE.Vector3()], to: [new THREE.Vector3(), new THREE.Vector3()] };
  const CAM_HOME = { p: camera.position.clone(), t: new THREE.Vector3(0, -0.55, 0) }; // góc nhìn mặc định
  const _rt = new THREE.Vector3();
  function startReveal(list, cam) {
    reveal.q = list.slice(); reveal.cam = cam; reveal.on = true;
    if (cam) { controls.enabled = false; if (selected) select(null); fire('reveal', { on: true }); }
    nextReveal();
  }
  function beginFly(p, tg, dur, then) {
    reveal.phase = 'fly'; reveal.t = 0; reveal.dur = dur; reveal.then = then;
    reveal.from[0].copy(camera.position); reveal.from[1].copy(controls ? controls.target : CAM_HOME.t);
    reveal.to[0].copy(p); reveal.to[1].copy(tg);
  }
  function beginGrow() { reveal.phase = 'grow'; memHidden.delete(reveal.cur); memGrow = reveal.cur; memGrowT = 0; }
  function nextReveal() {
    const i = reveal.q.shift();
    if (i === undefined) { if (reveal.cam) beginFly(CAM_HOME.p, CAM_HOME.t, 1.9, 'home'); else reveal.on = false; return; }
    reveal.cur = i;
    if (!reveal.cam) { beginGrow(); return; }
    const [x, z] = memPos[i];
    const fw = island.localToWorld(new THREE.Vector3(x, footY(x, z) + 0.1, z));
    const dir = camera.position.clone().sub(fw); dir.y = 0; dir.normalize(); // đến từ phía máy quay đang nhìn
    const p = fw.clone().addScaledVector(dir, 1.9); p.y = fw.y + 1.05;
    beginFly(p, fw, reveal.q.length || reveal.phase === '' ? 1.7 : 1.1, 'grow');
  }
  function stepReveal(dt) {
    if (!reveal.on) return;
    if (reveal.phase === 'fly') {
      reveal.t += dt; const u = Math.min(1, reveal.t / reveal.dur); const e = u * u * u * (u * (u * 6 - 15) + 10);
      camera.position.lerpVectors(reveal.from[0], reveal.to[0], e);
      _rt.lerpVectors(reveal.from[1], reveal.to[1], e); camera.lookAt(_rt); controls?.target.copy(_rt);
      if (u >= 1) {
        if (reveal.then === 'grow') beginGrow();
        else { reveal.on = false; reveal.phase = ''; controls.enabled = true; controls.update(); fire('reveal', { on: false }); }
      }
    } else if (reveal.phase === 'grow') {
      if (memGrow < 0) { reveal.phase = 'hold'; reveal.t = 0; fire('memory-bloom', { ...memData[reveal.cur] }); }
    } else if (reveal.phase === 'hold') {
      reveal.t += dt; if (reveal.t > (reveal.cam ? 1.3 : 0.3)) nextReveal();
    }
  }
  function pickMemory(ev) {
    if (!memData.length) return null;
    setNdc(ev); raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(memMeshes, false)[0];
    if (!hit || hit.instanceId === undefined) return null;
    const ty = memPetalMeshes.indexOf(hit.object);
    const idx = ty >= 0 ? memType.findIndex((t2, i) => t2 === ty && memSlot[i] === hit.instanceId) : hit.instanceId; // cánh: theo kiểu hoa · thân / nhuỵ: theo thứ tự
    return memData[idx] ? { ...memData[idx], point: hit.point } : null;
  }
  function setNdc(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  }

  /* ---------- Đèn lồng biết ơn: mỗi câu biết ơn là một chiếc đèn lồng giấy lơ lửng quanh đảo ---------- */
  const lanterns = [];
  const lanternBodyGeo = new THREE.CylinderGeometry(0.075, 0.062, 0.14, 12);
  const lanternCapGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10);
  const lanternBodyMat = new THREE.MeshStandardMaterial({ color: '#FFB46B', emissive: '#FF9440', emissiveIntensity: 0.7, roughness: 0.7 });
  const lanternCapMat = new THREE.MeshStandardMaterial({ color: '#6B4A35', roughness: 0.8 });
  function makeLantern(l, rising) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(lanternBodyGeo, lanternBodyMat));
    for (const y of [0.08, -0.08]) { const cap = new THREE.Mesh(lanternCapGeo, lanternCapMat); cap.position.y = y; g.add(cap); }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFC27A', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, toneMapped: false }));
    glow.scale.set(0.75, 0.75, 1); g.add(glow);
    g.scale.setScalar(2.2);
    const k = lanterns.length + 1;
    const rec = { id: l.id, g, glow, text: l.text, date: l.created_at, a: hash(k, 1, 13) * Math.PI * 2, r: 4.4 + hash(k, 2, 13) * 1.1, y: 2.2 + hash(k, 3, 13) * 1.3, sp: (0.025 + hash(k, 4, 13) * 0.03) * (k % 2 ? 1 : -1), phase: hash(k, 5, 13) * 6, rise: rising ? 0 : 1 };
    g.userData.lantern = rec; scene.add(g); lanterns.push(rec);
  }
  function setLanterns(list, quiet = false) {
    const arr = Array.isArray(list) ? list.slice(-12) : [];
    const ids = new Set(arr.map((l) => l.id));
    for (let i = lanterns.length - 1; i >= 0; i -= 1) {
      if (!ids.has(lanterns[i].id)) { scene.remove(lanterns[i].g); lanterns[i].glow.material.dispose(); lanterns.splice(i, 1); }
    }
    const initial = !lanternsReady; lanternsReady = true;
    arr.forEach((l) => { if (!lanterns.some((x) => x.id === l.id)) makeLantern(l, !initial); });
    if (!quiet) wake();
  }
  let lanternsReady = false;
  const _lp = new THREE.Vector3(); const LANTERN_START = new THREE.Vector3(0, 1.4, 0);
  function stepLanterns(dt, t) {
    const nt = tod.night;
    lanternBodyMat.emissiveIntensity = 0.55 + 0.9 * nt;
    for (const l of lanterns) {
      l.a += l.sp * dt;
      _lp.set(Math.cos(l.a) * l.r, l.y + Math.sin(t * 0.8 + l.phase) * 0.12, Math.sin(l.a) * l.r);
      if (l.rise < 1) { // đèn mới thả: bay lên từ giữa đảo rồi nhập vòng
        l.rise = Math.min(1, l.rise + dt / 4); const e = 1 - (1 - l.rise) ** 3;
        l.g.position.copy(LANTERN_START).lerp(_lp, e);
      } else l.g.position.copy(_lp);
      l.g.rotation.y += dt * 0.3; l.g.rotation.z = Math.sin(t * 1.1 + l.phase) * 0.06;
      l.glow.material.opacity = 0.35 + 0.45 * nt + Math.sin(t * 2.3 + l.phase) * 0.06;
    }
  }
  function pickLantern(ev) {
    if (!lanterns.length) return null;
    setNdc(ev); raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(lanterns.map((l) => l.g), true).find((h2) => !h2.object.isSprite);
    let o = hit?.object; while (o && !o.userData.lantern) o = o.parent;
    return o ? o.userData.lantern : null;
  }

  /* ---------- Sao băng ban đêm: thỉnh thoảng vụt qua, chạm vào thì nhận một lời chúc ---------- */
  const STAR_TRAIL = 12;
  const shooting = { on: false, wait: 5 + rand() * 6, life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), hist: [], caught: 0 };
  const starSprites = Array.from({ length: STAR_TRAIL }, (_, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i === 0 ? '#FFFFFF' : '#CFE0FF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    sp.visible = false; sp.renderOrder = 6; scene.add(sp);
    return sp;
  });
  const _sf = new THREE.Vector3(); const _sr = new THREE.Vector3(); const _su = new THREE.Vector3();
  function launchStar() {
    camera.getWorldDirection(_sf); _sr.crossVectors(_sf, camera.up).normalize(); _su.crossVectors(_sr, _sf).normalize();
    const side = rand() < 0.5 ? -1 : 1;
    shooting.p.copy(camera.position).addScaledVector(_sf, 30).addScaledVector(_sr, -side * (4 + rand() * 8)).addScaledVector(_su, 5 + rand() * 4);
    shooting.v.copy(_sr).multiplyScalar(side).addScaledVector(_su, -0.45).normalize().multiplyScalar(12 + rand() * 4);
    shooting.on = true; shooting.life = 1.4; shooting.hist = []; shooting.caught = 0;
  }
  function stepShooting(dt) {
    const allowed = controls && tod.night > 0.55 && !editor.on;
    if (!shooting.on) {
      starSprites.forEach((sp) => { sp.visible = false; });
      if (allowed) { shooting.wait -= dt; if (shooting.wait <= 0) launchStar(); }
      return;
    }
    shooting.life -= dt;
    if (shooting.caught > 0) { shooting.caught -= dt; shooting.v.multiplyScalar(0.9); }
    shooting.p.addScaledVector(shooting.v, dt);
    shooting.hist.unshift(shooting.p.clone()); if (shooting.hist.length > STAR_TRAIL) shooting.hist.pop();
    const fade = Math.min(1, shooting.life * 2.5);
    starSprites.forEach((sp, i) => {
      const q = shooting.hist[Math.min(i, shooting.hist.length - 1)];
      sp.visible = !!q; if (!q) return;
      sp.position.copy(q);
      const k = 1 - i / STAR_TRAIL; const big = shooting.caught > 0 ? 1 + shooting.caught * 3 : 1;
      sp.scale.setScalar((i === 0 ? 0.55 : 0.32 * k) * big); sp.material.opacity = fade * (i === 0 ? 1 : 0.7 * k);
    });
    if (shooting.life <= 0) { shooting.on = false; shooting.wait = 9 + rand() * 14; }
  }
  const _s1 = new THREE.Vector3(); const _s2 = new THREE.Vector3();
  function hitStar(ev) {
    if (!shooting.on || shooting.caught > 0 || !shooting.hist.length) return false;
    const rect = renderer.domElement.getBoundingClientRect();
    const toPx = (v) => [((v.x + 1) / 2) * rect.width + rect.left, ((1 - v.y) / 2) * rect.height + rect.top];
    const [ax, ay] = toPx(_s1.copy(shooting.hist[0]).project(camera));
    const [bx, by] = toPx(_s2.copy(shooting.hist[shooting.hist.length - 1]).project(camera));
    const vx = bx - ax; const vy = by - ay; const L2 = vx * vx + vy * vy || 1;
    const u = Math.max(0, Math.min(1, ((ev.clientX - ax) * vx + (ev.clientY - ay) * vy) / L2));
    if (Math.hypot(ev.clientX - (ax + vx * u), ev.clientY - (ay + vy * u)) > 56) return false;
    shooting.caught = 0.5; shooting.life = Math.min(shooting.life, 0.6);
    spawnHearts(shooting.p, 3);
    fire('wish', { n: Math.floor(rand() * 12) + 1 }); fire('voice', { kind: 'star' });
    return true;
  }

  /* ---------- Vị khách ghé thăm: thỉnh thoảng thỏ, ếch hoặc nhím ghé chơi một lúc rồi đi ---------- */
  const VISITORS = [
    { file: 'visitor_bunny', length: 0.3, speed: 0.22 },
    { file: 'visitor_frog', length: 0.2, speed: 0.16 },
    { file: 'visitor_hedgehog', length: 0.19, speed: 0.1 }
  ];
  const visit = { wait: 20 + rand() * 25, c: null, loading: false, last: -1 };
  function edgeSpot() {
    for (let i = 0; i < 40; i += 1) {
      const a = rand() * Math.PI * 2;
      for (let r = 2.2; r > 0.9; r -= 0.1) { const x = Math.cos(a) * r; const z = Math.sin(a) * r; if (walkable(x, z)) return [x, z]; }
    }
    return null;
  }
  function stepVisitor(dt) {
    if (visit.loading || editor.on || !gltf) return;
    const c = visit.c;
    if (!c) {
      visit.wait -= dt;
      if (visit.wait > 0 || h < 0.2) return;
      const spot = edgeSpot(); if (!spot) { visit.wait = 20; return; }
      let k = Math.floor(rand() * VISITORS.length); if (k === visit.last) k = (k + 1) % VISITORS.length; visit.last = k;
      const cfg = VISITORS[k]; visit.loading = true;
      spawnCritter({ ...cfg, threshold: 0, roam: true, spot }, `visitor:${cfg.file}`, (nc) => {
        visit.loading = false; visit.c = nc;
        nc.visitor = { age: 0, stay: 35 + rand() * 25, leaving: false, fade: 0, appear: 0 };
        nc.g.children[0].scale.setScalar(0.001);
        if (pickTarget(nc)) { nc.state = 'walk'; nc.timer = 14; play(nc, 'Walk'); }
        fire('visitor', { animal: cfg.file });
      });
      return;
    }
    const v = c.visitor; v.age += dt;
    if (v.appear < 1) { v.appear = Math.min(1, v.appear + dt * 1.4); c.g.children[0].scale.setScalar(c.baseScale * (1 - (1 - v.appear) ** 3)); }
    if (!v.leaving && v.age > v.stay && !c.mode && !(c.onceT > 0)) {
      v.leaving = true; v.leftAt = v.age;
      const e = edgeSpot();
      if (e && routeTo(c, e[0], e[1])) { c.state = 'walk'; c.timer = 20; c.arrive = 'leave'; c.run = false; play(c, 'Walk'); }
    }
    if (v.leaving && !c.mode && (c.state !== 'walk' || v.age - v.leftAt > 22)) { // tới mép đảo: nhỏ dần rồi biến mất
      v.fade = Math.min(1, v.fade + dt * 1.3);
      c.g.children[0].scale.setScalar(Math.max(0.001, c.baseScale * (1 - v.fade)));
      if (v.fade >= 1) {
        if (selected === c) select(null);
        c.g.parent?.remove(c.g); const ix = critters.indexOf(c); if (ix >= 0) critters.splice(ix, 1);
        visit.c = null; visit.wait = 45 + rand() * 60;
      }
    }
  }
  let anchorId = timeOpts.anchor ?? null; const _ap = new THREE.Vector3();
  function stepAnchor() {
    if (anchorId == null) return;
    const l = lanterns.find((x) => String(x.id) === String(anchorId));
    if (!l) { timeOpts.onAnchor?.(0, 0, false); return; }
    _ap.copy(l.g.position); _ap.y += 0.32; _ap.project(camera);
    const on = _ap.z < 1 && Math.abs(_ap.x) < 1.15 && Math.abs(_ap.y) < 1.15;
    const w = el.clientWidth; const hh = el.clientHeight;
    timeOpts.onAnchor?.(((_ap.x + 1) / 2) * w, ((1 - _ap.y) / 2) * hh, on);
  }
  timeOpts.exposeGarden?.({ setMemories, setLanterns, setAnchor(id) { anchorId = id ?? null; if (anchorId == null) timeOpts.onAnchor?.(0, 0, false); wake(); } });
  setMemories(timeOpts.memories, true); setLanterns(timeOpts.lanterns, true); // lúc dựng cảnh: vòng vẽ chưa có, chưa gọi wake

  let cleanupInteract = () => {};
  if (controls) {
    const dom = renderer.domElement; let down = null; let lastMove = 0; let holdTimer = 0;
    const onDown = (e) => {
      if (reveal.on) return;
      if (editor.on) { edDown(e); return; }
      down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, pet: false };
      clearTimeout(holdTimer);
      const hit = pickAnimal(e);
      if (hit && hit.kind === 'critter' && hit.ref.mode !== 'breath') {
        const d = down;
        holdTimer = setTimeout(() => { if (down === d && !d.moved) { d.pet = true; startPet(hit.ref); wake(); } }, 380);
      }
    };
    const onUp = (e) => {
      if (reveal.on) { down = null; return; }
      if (editor.on) { edUp(e); return; }
      clearTimeout(holdTimer);
      if (!down) return;
      const d = down; down = null;
      if (d.pet) { endPet(); wake(); return; }
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y); const held = performance.now() - d.t;
      if (moved > 8 || held > 450) return; // kéo xoay đảo → không tính là chạm
      if (hitStar(e)) { wake(); return; }
      const lan = pickLantern(e);
      if (lan) { spawnHearts(lan.g.position, 3); fire('lantern', { id: lan.id, text: lan.text, date: lan.date }); fire('voice', { kind: 'lantern' }); wake(); return; }
      const hit = pickAnimal(e);
      if (hit) { interact(hit); return; }
      const mem = pickMemory(e);
      if (mem) { spawnHearts(mem.point, 2); fire('memory', { day: mem.day, emotion: mem.emotion, score: mem.score }); fire('voice', { kind: 'chime' }); wake(); return; }
      const g = pickGround(e);
      if (!g) { if (selected) select(null); return; }
      if (g.kind === 'water') feedWater(g);
      else if (selected) callTo(selected, g);
      else feedGround(g);
      wake();
    };
    const onMove = (e) => {
      if (editor.on) { edMove(e); return; }
      if (down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down.moved = true; if (!down.pet) clearTimeout(holdTimer); }
      const now = performance.now(); if (e.pointerType === 'touch' || now - lastMove < 90) return; lastMove = now;
      const hit = pickAnimal(e) || pickLantern(e) || pickMemory(e);
      dom.style.cursor = hit ? 'pointer' : '';
      if (!down && !hit) { const g = pickGround(e, 0.05); if (g) { attract(toWorld(g.x, g.y, g.z)); wake(); } } // rê chuột: bướm, đom đóm bay theo
    };
    const onCancel = () => { clearTimeout(holdTimer); if (down?.pet) endPet(); down = null; if (editor.on) edCancel(); };
    dom.addEventListener('pointerdown', onDown); dom.addEventListener('pointerup', onUp); dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointercancel', onCancel); dom.addEventListener('pointerleave', onCancel);
    cleanupInteract = () => {
      clearTimeout(holdTimer);
      dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointerup', onUp); dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointercancel', onCancel); dom.removeEventListener('pointerleave', onCancel);
    };
  }

  /* ---------- áp health ---------- */
  let h = initialHealth;
  let target = initialHealth;
  function applyHealth(v) {
    for (const t of tinted) {
      t.mat.color.lerpColors(t.a, t.b, v);
      if (t.emissiveToo) t.mat.emissive.copy(t.mat.color);
    }
    const { night: nt, golden: gd } = tod;
    // mây nhuốm hồng cam lúc hoàng hôn, xanh tím sẫm khi đêm
    const sunlit = ss(0.35, 0.8, v) * (1 - nt);
    const cloudTint = C('#FFFFFF').lerp(C('#FFF0D2'), sunlit * 0.6).multiplyScalar(1 + 0.22 * sunlit).lerp(C('#FFC7A6'), gd * 0.55).lerp(C('#4E5788'), nt * 0.85);
    cloudMats.flat().forEach((m) => m.color.multiply(cloudTint));
    for (const tr of trees) tr.canopy.scale.setScalar(0.8 + 0.2 * v);
    lotus.forEach((l, i) => { l.visible = v > 0.2 + i * 0.15; });
    for (const f of flowers) {
      f.g.visible = v > f.threshold;
      const droop = (1 - v) * 0.45;
      f.g.rotation.x = Math.cos(f.tilt) * droop; f.g.rotation.z = Math.sin(f.tilt) * droop;
      f.g.scale.setScalar(f.s0 * (0.75 + 0.25 * v));
    }
    const nl = v >= 0.5 ? 0 : Math.round((0.5 - v) * 2 * fallenLeaves.length);
    fallenLeaves.forEach((l, i) => { l.visible = i < nl; });
    // khô hạn: suối cạn (lộ lòng suối ướt), thác & bọt tắt; vườn khoẻ: dòng chảy đầy, đục bọt
    const flowing = v > 0.25;
    river.visible = flowing; spill.visible = flowing; splash.visible = flowing;
    foams.forEach((f) => { f.visible = flowing; });
    decals.forEach((d) => { d.m.visible = flowing; }); mists.forEach((m) => { m.sp.visible = flowing; });
    riverMat.opacity = 0.5 + 0.4 * v;
    edgeFall.visible = flowing; edgeMist.visible = flowing;
    edgeFall.scale.x = 0.35 + 0.65 * v;
    edgeFallMat.opacity = 0.4 + 0.5 * v;
    // hoa tỏa sáng nhẹ về đêm (theo đúng màu cánh hoa: dùng texture làm emissiveMap)
    for (const f of flowers) {
      if (!f.mats) { f.mats = []; f.g.traverse((o) => { if (o.isMesh && o.material && !f.mats.includes(o.material)) f.mats.push(o.material); }); }
      for (const m of f.mats) {
        if (!m.emissive) continue;
        if (m.map && m.emissiveMap !== m.map) { m.emissiveMap = m.map; m.needsUpdate = true; }
        if (!m.map) m.emissive.copy(m.color); else m.emissive.set('#FFFFFF');
        m.emissiveIntensity = nt * (0.35 + 0.25 * v);
      }
    }
    fgMat.opacity = nt * (0.5 + 0.5 * v); flowerGlow.visible = nt > 0.02;
    // đom đóm: vườn khoẻ thì có; về đêm thì nhiều & sáng hơn
    fireflies.m.opacity = Math.min(1, Math.max(0, (v - 0.45) * 1.8) + nt * (0.4 + 0.6 * v));
    fireflies.p.visible = fireflies.m.opacity > 0.02;
    petals.m.opacity = Math.max(0, (v - 0.6) * 2.2);
    petals.p.visible = v > 0.6;
    const wet = Math.max(0, (0.32 - v) / 0.32);
    rainMat.opacity = wet * 0.45; rain.visible = wet > 0.01; // mưa nhẹ
    stormMats.flat().forEach((m) => { m.opacity = wet * 0.55; }); storm.visible = wet > 0.01;
    // nắng: trưa trắng ấm → bình minh/hoàng hôn vàng cam → đêm ánh trăng xanh nhạt
    const DAY_DIM = 0.72; // ban ngày dịu bớt (sáng/trưa/chiều)
    const RD = realMode ? 1 - 0.2 * (1 - nt) : 1; // theo giờ thật: ban ngày tối thêm ~20%
    sun.intensity = (1.3 + 1.7 * v) * (1 - 0.78 * nt) * (1 - 0.15 * gd) * (DAY_DIM + (1 - DAY_DIM) * nt) * RD;
    sun.color.lerpColors(C('#DCDDE6'), C('#FFE6BC'), v).lerp(C('#FFB27A'), gd * 0.8).lerp(C('#9FB2FF'), nt);
    backSun.intensity = (0.15 + 0.5 * v) * (1 - nt) * (1 + gd) * 0.75;
    backSun.color.set('#FFD58A').lerp(C('#FF9C6B'), gd * 0.6);
    const sunny = ss(0.35, 0.8, v) * (1 - nt);
    rays.forEach((r) => { r.g.visible = sunny > 0.01; r.mats.forEach((m) => { m.opacity = r.op * sunny; m.color.set('#FFFFFF').lerp(C('#FFC08A'), gd * 0.7); }); });
    sunGlow.material.opacity = (0.25 + 0.65 * v) * (1 - nt) * 0.62 * (1 - 0.4 * gd) * RD; sunCore.material.opacity = (0.2 + 0.65 * v) * (1 - nt) * 0.62 * (1 - 0.3 * gd) * RD; // chiều: vầng sáng dịu, không trùm mờ cả góc đảo
    sunGlow.scale.setScalar(9 * (1 - 0.3 * gd));
    sunGlow.material.color.set('#FFE2A8').lerp(C('#FF9E6E'), gd * 0.8);
    moon.material.opacity = 0.9 * nt; moonHalo.material.opacity = 0.35 * nt; starMat.opacity = nt; stars.visible = nt > 0.01;
    hemi.intensity = (0.9 + 0.4 * v) * (1 - 0.45 * nt) * (0.88 + 0.12 * nt) * (1 - (1 - RD) * 0.6);
    hemi.color.set('#FFE8F4').lerp(C('#FFD2B8'), gd * 0.6).lerp(C('#7480C4'), nt);
    hemi.groundColor.set('#8AA77A').lerp(C('#2F3D45'), nt);
    // đèn lồng sáng rõ lúc tối
    lanternMat.emissiveIntensity = (0.2 + 1.2 * v) * (1 + 1.6 * nt);
    lanternLight.intensity = 1.5 * v + 3 * nt;
    decorGlow.forEach((m) => { m.emissiveIntensity = 0.05 + 1.2 * nt; });
    renderer.toneMappingExposure = (0.9 + 0.24 * v) * (1 - 0.18 * nt) * (0.9 + 0.1 * nt) * (1 - (1 - RD) * 0.5);
    // vườn càng khoẻ càng nhiều con vật ra chơi
    // giảm chuyển động: con vật không di chuyển được nên ẩn đi
    critters.forEach((c) => { c.g.visible = !c.removed && v > c.threshold; });
    ducks.forEach((d, i) => { d.g.visible = !reduceMotion && (i === 0 || v > 0.2 + i * 0.15); }); // vịt mẹ luôn ở lại
    butterflies.forEach((b, i) => { b.g.visible = !reduceMotion && v > 0.4 + i * 0.12; });
    birds.forEach((b, i) => { b.g.visible = !reduceMotion && v > 0.4 + i * 0.08; });
  }
  applyHealth(h);
  exposeSetTarget((v) => { target = v; if (reduceMotion) wake(); });
  timeOpts.expose?.((hr, real) => { if (real !== undefined) realMode = real; tod = timeOfDay(hr); placeSky(hr); applyHealth(h); wake(); });

  /* ---------- kích thước ---------- */
  function resize() {
    const w = el.clientWidth || 1; const hh = el.clientHeight || 1;
    renderer.setSize(w, hh, false);
    camera.aspect = w / hh;
    // khung hẹp thì lùi máy quay để vẫn thấy trọn đảo
    camera.zoom = Math.min(1, camera.aspect / 1.45);
    camera.updateProjectionMatrix();
    if (reduceMotion) wake();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  /* ---------- vòng vẽ ---------- */
  let visible = true;
  const io = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; if (visible) wake(); }, { threshold: 0.01 });
  io.observe(el);
  const onVis = () => { if (!document.hidden) wake(); };
  document.addEventListener('visibilitychange', onVis);

  const clock = new THREE.Clock();
  let raf = 0;
  let disposed = false;
  function frame() {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = reduceMotion ? 0 : clock.elapsedTime;

    if (Math.abs(target - h) > 0.002) {
      h += (target - h) * Math.min(1, dt * 2.2);
      applyHealth(h);
    } else if (h !== target) { h = target; applyHealth(h); }

    if (!reduceMotion) {
      island.position.y = Math.sin(t * 0.8) * 0.08;
      island.rotation.y = Math.sin(t * 0.12) * 0.14;
      { // gió: lúc mạnh lúc dịu, lướt qua đảo thành từng đợt
        windU.value = t; const gust = 0.7 + 0.3 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1);
        for (const tr of trees) { tr.canopy.rotation.z = Math.sin(t * 1.1 + tr.phase) * 0.03 * gust; tr.canopy.rotation.x = Math.cos(t * 0.9 + tr.phase) * 0.02 * gust; }
        for (const pl of plants) { pl.canopy.rotation.z = Math.sin(t * 1.7 + pl.phase) * pl.amp * gust; pl.canopy.rotation.x = Math.cos(t * 1.3 + pl.phase) * pl.amp * 0.5 * gust; }
      }
      for (const s of satellites) { s.g.position.y = s.y + Math.sin(t * 0.7 + s.phase) * 0.18; s.g.rotation.y = t * s.spin + s.phase; }

      for (const c of critters) if (c.g.visible && !editor.on) stepCritter(c, dt, t); // đang trang trí: con vật đứng yên cho dễ kéo
      for (const f of fishes) stepFish(f, dt, t);
      ducks.forEach((d, i) => {
        if (!d.g.visible) return;
        const p = d.g.position;
        let tx; let tz; let speed;
        if (i === 0) {
          // vịt mẹ: bơi tới điểm ngẫu nhiên, thỉnh thoảng dừng lại thả trôi
          d.pause = (d.pause || 0) - dt;
          if (Math.hypot(d.tx - p.x, d.tz - p.z) < 0.05) { duckTarget(d); d.pause = rand() < 0.4 ? 1 + rand() * 2.5 : 0; }
          tx = d.tx; tz = d.tz; speed = d.pause > 0 ? 0 : 0.11 * (d.boost > 0 ? 2.4 : 1); d.boost = (d.boost || 0) - dt;
        } else {
          // vịt con: nối đuôi con phía trước
          const lead = ducks[i - 1].g;
          tx = lead.position.x - Math.sin(lead.rotation.y) * 0.13; tz = lead.position.z - Math.cos(lead.rotation.y) * 0.13;
          speed = Math.min(0.2, Math.hypot(tx - p.x, tz - p.z) * 1.6);
        }
        const dx = tx - p.x; const dz = tz - p.z;
        if (Math.hypot(dx, dz) > 0.01) turnToward(d.g, Math.atan2(dx, dz), dt * 3);
        const nx = p.x + Math.sin(d.g.rotation.y) * speed * dt; const nz = p.z + Math.cos(d.g.rotation.y) * speed * dt;
        if (inPoly(POND_SWIM, nx, nz) || i > 0) { p.x = nx; p.z = nz; } else if (i === 0) duckTarget(d);
        p.y = 0.24 + Math.sin(t * 2.2 + d.lag * 5) * 0.008;
        d.g.rotation.z = Math.sin(t * 1.8 + d.lag) * 0.05;
      });
      if (lure.t > 0) { lure.t -= dt; island.worldToLocal(lureL.copy(lure.p)); }
      for (const b of butterflies) {
        if (!b.g.visible) continue;
        const want = butterflyPos(b, t);
        if (!b.p) b.p = want.clone();
        const lured = lure.t > 0 && b.p.distanceTo(lureL) < 2.6;
        if (lured) want.copy(lureL).add(_bo.set(Math.cos(t * 1.4 + b.phase) * 0.24, 0.3 + Math.sin(t * 2 + b.phase) * 0.08, Math.sin(t * 1.4 + b.phase) * 0.24));
        _bp.copy(b.p); b.p.lerp(want, Math.min(1, dt * (lured ? 1.6 : 0.8)));
        b.g.position.copy(b.p);
        if (_bp.distanceToSquared(b.p) > 1e-8) b.g.rotation.y = Math.atan2(b.p.x - _bp.x, b.p.z - _bp.z);
        const flap = (Math.sin(t * 22 + b.phase) + 1) * 0.65;
        for (const w of b.wings) w.w.rotation.z = w.sx * flap;
      }
      for (const b of birds) {
        if (!b.g.visible) { if (b.nest) { b.nest.busy = null; b.nest = null; } b.state = 'circle'; continue; }
        b.a += b.speed * dt; b.timer -= dt;
        const beat = Math.sin(t * 8.5 + b.phase * 3);
        const prevPos = _bv3.copy(b.g.position);
        if (b.state === 'circle') {
          // vỗ cánh ↔ liệng chuyển mượt; khi vỗ thì thân nhấp nhô theo nhịp cánh
          const flapping = ss(-0.2, 0.3, Math.sin(t * 0.55 + b.phase));
          b.flapU.value = flapping * (beat * 0.62 - 0.08) + (1 - flapping) * (0.06 + Math.sin(t * 1.3 + b.phase) * 0.04);
          circlePos(b, b.a, t, b.g.position); b.g.position.y -= beat * 0.035 * flapping;
          const dir = Math.sign(b.speed) || 1; // bay xuôi hay ngược chiều
          b.g.rotation.y = Math.atan2(-Math.sin(b.a) * dir, Math.cos(b.a) * dir);
          b.g.rotation.z = (-0.28 + Math.sin(t * 0.5 + b.phase) * 0.06) * dir; // nghiêng mình vào tâm vòng bay
          b.g.rotation.x = -0.06 * flapping;
          // tới lúc thì chọn một tổ đang trống để đáp xuống
          if (b.timer <= 0) {
            const free = nests.filter((n) => !n.busy && n.sat.visible !== false);
            if (free.length) {
              b.nest = free[Math.floor(rand() * free.length)]; b.nest.busy = b;
              b.state = 'toNest'; b.timer = 4.2; b.dur = 4.2; b.p0.copy(b.g.position);
            } else b.timer = 6 + rand() * 6;
          }
        } else if (b.state === 'toNest') {
          const u = 1 - Math.max(0, b.timer) / b.dur; const e = u * u * (3 - 2 * u);
          perchPos(b.nest, _bv2);
          _bv.copy(b.p0).lerp(_bv2, 0.5); _bv.y = Math.max(b.p0.y, _bv2.y) + 0.8; // vồng lên rồi hạ xuống tổ
          quad(b.p0, _bv, _bv2, e, b.g.position);
          b.flapU.value = u < 0.75 ? beat * 0.6 : 0.15 + Math.sin(t * 14) * 0.25 * (1 - u); // vỗ đều → hãm cánh khi sắp đậu
          b.g.rotation.z *= 0.9; b.g.rotation.x = -0.12 * (1 - u);
          if (b.timer <= 0) { b.state = 'perched'; b.timer = 4 + rand() * 4; }
        } else if (b.state === 'perched') {
          perchPos(b.nest, b.g.position);
          b.flapU.value = -0.75 + Math.sin(t * 1.7 + b.phase) * 0.04; // xếp cánh, khẽ nhúc nhích
          b.g.rotation.z = 0; b.g.rotation.x = Math.sin(t * 2.3 + b.phase) * 0.08; // gật gù
          if (b.timer <= 0) { b.state = 'leave'; b.timer = 3.4; b.dur = 3.4; b.p0.copy(b.g.position); b.nest.busy = null; }
        } else if (b.state === 'leave') {
          const u = 1 - Math.max(0, b.timer) / b.dur; const e = u * u * (3 - 2 * u);
          circlePos(b, b.a, t, _bv2);
          _bv.copy(b.p0); _bv.y += 1.1; // bật lên khỏi tổ rồi nhập lại vòng lượn
          quad(b.p0, _bv, _bv2, e, b.g.position);
          b.flapU.value = beat * 0.7;
          b.g.rotation.z = -0.28 * e * (Math.sign(b.speed) || 1); b.g.rotation.x = -0.15 * (1 - u);
          if (b.timer <= 0) { b.state = 'circle'; b.timer = 18 + rand() * 18; if (b.nest?.temp) b.nest.obj.parent?.remove(b.nest.obj); b.nest = null; }
        }
        // hướng đầu theo hướng bay (trừ lúc đậu thì giữ hướng)
        if (b.state === 'toNest' || b.state === 'leave') {
          const dx = b.g.position.x - prevPos.x; const dz = b.g.position.z - prevPos.z;
          if (Math.hypot(dx, dz) > 1e-4) { let d = Math.atan2(dx, dz) - b.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); b.g.rotation.y += d * Math.min(1, dt * 6); }
        }
      }
      clouds.rotation.y = t * 0.01;
      if (stars.visible) starMat.size = 0.5 + Math.sin(t * 1.7) * 0.08;
      if (flowerGlow.visible) {
        if (flowers.length !== fgSeenFlowers) { fgSeenFlowers = flowers.length; refreshFlowerGlow(); }
        for (let i = 0; i < fgCount; i += 1) { // lượn vòng nhỏ, nhấp nhô quanh khóm hoa
          const [x, y, z, ph, r] = fgBase[i];
          fgPos[i * 3] = x + Math.cos(t * 0.7 + ph) * r; fgPos[i * 3 + 1] = y + Math.sin(t * 1.3 + ph * 2) * 0.08; fgPos[i * 3 + 2] = z + Math.sin(t * 0.6 + ph) * r;
        }
        pullToLure(fgPos, fgCount, fgPull, dt);
        fgGeo.attributes.position.needsUpdate = true;
        fgMat.size = 0.08 + Math.sin(t * 3.1) * 0.02;
      }
      { const sunny = ss(0.35, 0.8, h) * (1 - tod.night); rays.forEach((r) => { const k = 0.7 + 0.3 * Math.sin(t * 0.35 + r.phase); r.mats.forEach((m) => { m.opacity = r.op * sunny * k * (r.fan === undefined ? 0.95 : 1) * 0.52 * (1 - 0.25 * tod.golden) * (realMode ? 0.8 : 1); }); }); } // tia giờ quay mặt về máy quay → hạ bớt cho khỏi chói
      if (rays[0]?.g.visible) layoutFan();
      if (rays[0]?.g.visible) rays.forEach((r) => {
        r.g.worldToLocal(_camL.copy(camera.position));
        const a = Math.atan2(_camL.x, _camL.z);
        r.planes[0].rotation.y = a; r.planes[1].rotation.y = a + 0.6; // tấm chính quay về máy quay, tấm phụ lệch nhẹ cho có khối
      });
      for (const c of cloudClusters) { c.g.position.x = c.x + Math.sin(t * 0.08 + c.phase) * 0.35; }
      stepReactions(dt); stepSeeds(dt); stepRipples(dt); stepPet(dt);
      stepLanterns(dt, t); stepShooting(dt); stepVisitor(dt);
      if (memGrow >= 0) { // bông ký ức mới mọc lên
        memGrowT += dt; const k = Math.min(1, memGrowT / 1.8);
        placeMemories(1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2);
        if (k >= 1) { const [x, z] = memPos[memGrow]; spawnHearts(island.localToWorld(new THREE.Vector3(x, footY(x, z) + 0.2, z)), 4); memGrow = -1; }
      }
      if (editor.on && ghost && ghostState.has && !editor.sel) {
        const rr = (ghost.spec.g === 'animal' ? 0.32 : Math.max(0.12, (ghost.spec.h || 0.3) * 0.28)) * ghostState.s;
        editRing.position.set(ghostState.x, footY(ghostState.x, ghostState.z, 0.05) + 0.02, ghostState.z); editRing.scale.set(rr, rr, rr);
        editRing.material.color.set(ghostState.ok ? '#C8F0A0' : '#FF8A7A'); editRing.material.opacity = 0.75; editRing.visible = true;
      } else if (editor.on && editor.sel?.g.parent) {
        editRing.material.color.set('#FFE08A');
        const it = editor.sel; const rr = (it.r * 1.5 + 0.06) * it.pose[3];
        editRing.position.set(it.g.position.x, it.g.position.y + 0.02, it.g.position.z); editRing.scale.set(rr, rr, rr);
        editRing.material.opacity = 0.6 + Math.sin(t * 5) * 0.3; editRing.visible = true;
      } else editRing.visible = false;
      if (selected) {
        selT -= dt; selRing.material.opacity = 0.55 + Math.sin(t * 4) * 0.3;
        if (selT <= 0 || !selected.g.visible) select(null);
      }
      flowTex.offset.y = (flowTex.offset.y - dt * 0.9) % 1;
      rippleTex.offset.x = (rippleTex.offset.x + dt * 0.025) % 1; rippleTex.offset.y = (rippleTex.offset.y + dt * 0.018) % 1;
      foamRingMat.opacity = 0.38 + Math.sin(t * 1.6) * 0.12;
      foams.forEach((f, i) => { f.material.opacity = 0.45 + Math.sin(t * 5 + i * 1.7) * 0.15; });
      if (splash.visible) stepSplash(dt);
      decals.forEach((d) => {
        d.m.rotation.z = t * 0.12 + d.phase;
        const k = 1 + Math.sin(t * 2.2 + d.phase) * 0.06; d.m.scale.set(k, k, 1);
        d.m.material.opacity = 0.7 + Math.sin(t * 3.1 + d.phase) * 0.15;
      });
      mists.forEach((m) => {
        const u = (t * m.speed + m.phase) % 1; // 0 → 1: bốc lên, to ra, tan
        m.sp.position.set(m.x + m.dx * u, m.y + 0.05 + u * 0.55, m.z + m.dz * u);
        const sc = m.size * (0.5 + u * 0.9); m.sp.scale.set(sc * 1.4, sc, 1);
        m.sp.material.opacity = Math.sin(Math.PI * u) * 0.32;
      });
      edgeTex.offset.y = (edgeTex.offset.y + dt * 1.1) % 1;
      waterMat.emissiveIntensity = 0.12 + Math.sin(t * 2) * 0.05;

      if (fireflies.p.visible) {
        for (let i = 0; i < fireflies.n; i += 1) {
          const k = i * 3;
          fireflies.pos[k] = fireflies.base[k] + Math.sin(t * 0.6 + i) * 0.25;
          fireflies.pos[k + 1] = fireflies.base[k + 1] + Math.sin(t * 0.9 + i * 1.7) * 0.2;
          fireflies.pos[k + 2] = fireflies.base[k + 2] + Math.cos(t * 0.5 + i * 0.7) * 0.25;
        }
        pullToLure(fireflies.pos, fireflies.n, ffPull, dt);
        fireflies.p.geometry.attributes.position.needsUpdate = true;
        fireflies.m.size = 0.16 + Math.sin(t * 2.4) * 0.05;
      }
      if (petals.p.visible) {
        for (let i = 0; i < petals.n; i += 1) {
          const k = i * 3;
          petals.base[k + 1] -= dt * (0.25 + (i % 5) * 0.05);
          if (petals.base[k + 1] < -1.2) petals.base[k + 1] = 1.6 + (i % 7) * 0.2;
          petals.pos[k] = petals.base[k] + Math.sin(t + i) * 0.3 + (1.6 - petals.base[k + 1]) * 0.25;
          petals.pos[k + 1] = petals.base[k + 1];
          petals.pos[k + 2] = petals.base[k + 2] + Math.cos(t * 0.8 + i) * 0.2;
        }
        petals.p.geometry.attributes.position.needsUpdate = true;
      }
      if (rain.visible) {
        for (let i = 0; i < rainN; i += 1) {
          const k = i * 6;
          let y = rainPos[k + 1] - dt * rainSpeed[i];
          if (y < -0.4) y = 3.6;
          rainPos[k + 1] = y; rainPos[k + 4] = y - 0.22;
        }
        rainGeo.attributes.position.needsUpdate = true;
        storm.position.x = Math.sin(t * 0.2) * 0.4;
      }
    }

    if (!reduceMotion) stepReveal(dt);
    stepAnchor();
    if (!reveal.on) controls?.update();
    renderer.render(scene, camera);
    // giảm chuyển động: chỉ vẽ tiếp khi đang chuyển trạng thái health
    if (reduceMotion && h === target) return;
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (!raf && !disposed) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  }
  wake();

  return () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    if (thumbR) { thumbR.dispose(); thumbR.forceContextLoss?.(); }
    lanterns.forEach((l) => scene.remove(l.g));
    ro.disconnect(); io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
    });
    glowTex.dispose(); rayTex.dispose(); rayTexLong.dispose(); foamDecalTex.dispose(); grassTex.dispose(); shadowTex.dispose(); flowTex.dispose(); rippleTex.dispose(); edgeTex.dispose(); cloudTexs.forEach((tx) => tx.dispose());
    controls?.dispose(); cleanupInteract(); heartTex.dispose(); if (hourTimer) clearInterval(hourTimer);
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
  };
}
</script>

<style scoped>
.mg3d { position: relative; width: 100%; height: 100%; overflow: hidden; }
.mg3d-bubble { position: absolute; left: 0; top: 0; z-index: 2; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; will-change: transform; }
.mg3d-bubble.is-on { opacity: 1; }
.mg3d-bubble.is-on > * { pointer-events: auto; }
.mg3d :deep(.mg3d-canvas) { display: block; width: 100%; height: 100%; touch-action: none; }
</style>
