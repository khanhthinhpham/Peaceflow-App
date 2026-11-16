// The map: a small round one in the top left corner that follows you, and, when it is clicked (or M is pressed),
// the whole valley laid out with the edge of the walk and the names of its places. It is painted once from the
// same plain functions the land is made of (world.js, floor.js), a little at a time so the walk never stutters.
import { along, FARMS, MILL, ROADS } from './floor.js';
import { fieldsAt, forestAt, fromValley, HAMLET, heightAt, riverDistance, smooth, SPAWN, START, TARN, tarnDistance, TREE, VILLAGE } from './world.js';

/** Metres from the middle to the edge of the picture: wide enough for the village, the mill and the near farms. */
const HALF = 1050;
const RES = 896; // the picture, pixels across
const COARSE = RES / 2; // the slow sums (heights, woods, fields) are done at half that
const NEAR = 170; // metres round you that the small map shows
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const CSS = `
#mm{position:fixed;top:14px;left:14px;width:168px;height:168px;padding:0;border:0;border-radius:50%;background:none;cursor:pointer;z-index:5;filter:drop-shadow(0 2px 8px rgba(20,50,80,.35))}
#mm canvas{width:100%;height:100%;border-radius:50%}
#mm-full{position:fixed;inset:0;display:none;place-items:center;background:rgba(18,32,44,.5);z-index:6;font:13px/1.45 ${FONT};color:#1c2a33;cursor:pointer}
#mm-full.on{display:grid}
#mm-card{display:flex;gap:16px;align-items:stretch;background:#f7f5ee;border-radius:8px;padding:14px;box-shadow:0 10px 40px rgba(10,25,40,.45);cursor:default;max-width:96vw;max-height:96vh}
#mm-card canvas{display:block;border-radius:6px;width:min(78vh,62vw);height:min(78vh,62vw)}
#mm-side{width:232px;display:flex;flex-direction:column;gap:10px;overflow:auto}
#mm-side h2{margin:0;font:700 17px/1.2 ${FONT}}
#mm-side p{margin:0;color:#4d5b66}
#mm-side ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
#mm-side li{display:flex;gap:8px;align-items:center}
#mm-side i{flex:none;width:22px;height:12px;border-radius:2px;display:block}
#mm-side b{font-weight:600}
#mm-side .where{background:#e9efe2;border-radius:6px;padding:8px 10px}
#mm-side .close{margin-top:auto;min-height:40px;border:0;border-radius:6px;background:#2c5d86;color:#fff;font:600 14px ${FONT};cursor:pointer}
#mm-opts{background:#eef1f4;border-radius:6px;padding:8px 10px;display:grid;gap:7px}
#mm-opts .row{display:grid;gap:3px}
#mm-opts .row>span{color:#4d5b66;font-size:12px}
#mm-opts .set{display:flex;gap:4px}
#mm-opts .set button{flex:1;min-height:30px;border:1px solid #c3ccd4;border-radius:5px;background:#fff;color:#1c2a33;font:600 12.5px ${FONT};cursor:pointer}
#mm-opts .set button.on{background:#2c5d86;border-color:#2c5d86;color:#fff}
#mm-fps{font-variant-numeric:tabular-nums}
@media (max-width:820px){#mm{width:120px;height:120px}#mm-card{flex-direction:column}#mm-card canvas{width:min(92vw,58vh);height:min(92vw,58vh)}#mm-side{width:auto}}
`;

const LEGEND = [
  ['#9dc873', 'Đồng cỏ đi bộ được'],
  ['#d6d9c2', 'Ngoài vùng đi bộ (chỉ ngắm)'],
  ['border:2px dashed #c0392b;background:none;height:8px', 'Ranh giới vùng đi bộ'],
  ['border:1px solid #5b6b78;background:none;height:10px', 'Mép mặt đất chi tiết'],
  ['#5aa7d6', 'Hồ và sông'],
  ['#3f7a45', 'Rừng, cây'],
  ['#d9cf8a', 'Ruộng đồng'],
  ['#a67c52;height:4px', 'Đường mòn'],
  ['#e9dfc2;height:5px;outline:1px solid #8b7d5c', 'Đường làng'],
  ['#b5533c', 'Nhà: xóm ven hồ (đi tới được), làng, trang trại, cối xay'],
];

const lerp = (a, b, t) => a + (b - a) * t;
const toUV = (x, z) => [x * 0.6 + z * 0.8, -x * 0.8 + z * 0.6]; // (the valley's own axes: HERO is [0.6, 0.8])

/**
 * @param {object} o
 * @param {Array} o.trees     [x, z, kind, scale] of every tree, the solid ones first
 * @param {Array} o.stones    [x, z, gap] of the big stones
 * @param {number} o.reach    metres from the middle you can walk
 * @param {number} o.extent   metres across of the ground made in full
 * @param {object} [o.settings] things to try for speed: { quality, dpr, paint, setQuality(q), setDpr(n), setPaint(on) }
 */
export function createMinimap({ trees = [], stones = [], reach, extent, settings = null }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const small = document.createElement('button');
  small.id = 'mm';
  small.type = 'button';
  small.title = 'Bản đồ (phím M)';
  small.setAttribute('aria-label', 'Mở bản đồ');
  const smallCanvas = document.createElement('canvas');
  small.append(smallCanvas);

  const full = document.createElement('div');
  full.id = 'mm-full';
  full.innerHTML = `<div id="mm-card"><canvas></canvas><div id="mm-side">
    <h2>Bản đồ thung lũng</h2>
    <p>Vùng đi bộ là hình tròn bán kính <b>${Math.round(reach)} m</b> (đường kính khoảng ${(reach / 500).toFixed(2).replace('.', ',')} km) quanh đồi ngắm cảnh. Mặt đất chi tiết rộng ${extent} × ${extent} m; xa hơn là phong cảnh để ngắm.</p>
    <div class="where" id="mm-where"></div>
    <div id="mm-opts">
      <div><b>Thử cấu hình cho đỡ giật</b> · <span id="mm-fps">— khung/giây</span></div>
      <div class="row"><span>Chất lượng (đổi sẽ tải lại cảnh)</span><div class="set" data-set="quality"><button type="button" data-v="low">Thấp</button><button type="button" data-v="medium">Vừa</button><button type="button" data-v="high">Cao</button></div></div>
      <div class="row"><span>Độ nét khung hình (đổi ngay)</span><div class="set" data-set="dpr"><button type="button" data-v="0.75">Thấp</button><button type="button" data-v="1">Vừa</button><button type="button" data-v="1.5">Cao</button></div></div>
      <div class="row"><span>Hiệu ứng nét cọ (đổi ngay, phím P)</span><div class="set" data-set="paint"><button type="button" data-v="1">Bật</button><button type="button" data-v="0">Tắt</button></div></div>
    </div>
    <ul>${LEGEND.map(([c, t]) => `<li><i style="${c.startsWith('border') ? c : 'background:' + c}"></i>${t}</li>`).join('')}</ul>
    <button type="button" class="close">Đóng (M)</button></div></div>`;
  const fullCanvas = full.querySelector('canvas');
  const where = full.querySelector('#mm-where');
  document.body.append(small, full);

  let open = false;
  const setOpen = (on) => {
    open = on;
    full.classList.toggle('on', on);
    // (the mouse is needed to read a map: let go of it)
    if (on && document.pointerLockElement) document.exitPointerLock();
  };
  small.addEventListener('click', () => setOpen(!open));
  full.addEventListener('click', (e) => {
    if (e.target === full || e.target.classList.contains('close')) return setOpen(false);
    // one of the settings to try
    const set = e.target.closest?.('[data-set]')?.dataset.set;
    const value = e.target.dataset?.v;
    if (!set || value === undefined || !settings) return;
    if (set === 'quality' && value !== settings.quality) settings.setQuality(value);
    if (set === 'dpr') settings.setDpr(Number(value));
    if (set === 'paint') settings.setPaint(value === '1');
    showSettings();
  });
  const fpsLabel = full.querySelector('#mm-fps');
  /** Marks, in each row, the setting that is in force now. */
  function showSettings() {
    if (!settings) return;
    const now = { quality: settings.quality, paint: settings.paint ? '1' : '0' };
    // (the sharpness asked for may be more than the screen has: mark the nearest to what is drawn)
    const drawn = settings.dpr;
    now.dpr = ['0.75', '1', '1.5'].reduce((a, b) => (Math.abs(Number(b) - drawn) < Math.abs(Number(a) - drawn) ? b : a));
    for (const row of full.querySelectorAll('[data-set]')) for (const button of row.children) button.classList.toggle('on', button.dataset.v === now[row.dataset.set]);
  }
  if (!settings) full.querySelector('#mm-opts').remove();
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') setOpen(!open);
    else if (e.code === 'Escape' && open) setOpen(false);
  });

  // ---- the picture ------------------------------------------------------------------------------------------
  const picture = document.createElement('canvas');
  picture.width = picture.height = RES;
  const pctx = picture.getContext('2d');
  pctx.fillStyle = '#cfd8c4';
  pctx.fillRect(0, 0, RES, RES);
  const px = (x) => ((x + HALF) / (2 * HALF)) * RES; // metres to pixels of the picture, either way
  const scale = RES / (2 * HALF);
  let riverAt = null; // somewhere on the river, for its name

  const coarse = { h: new Float32Array(COARSE * COARSE), fields: new Float32Array(COARSE * COARSE), forest: new Float32Array(COARSE * COARSE) };
  const sample = (grid, fx, fy) => {
    const x = Math.min(COARSE - 1.001, Math.max(0, fx));
    const y = Math.min(COARSE - 1.001, Math.max(0, fy));
    const i = Math.floor(x);
    const j = Math.floor(y);
    const a = x - i;
    const b = y - j;
    const k = i + j * COARSE;
    return lerp(lerp(grid[k], grid[k + 1], a), lerp(grid[k + COARSE], grid[k + COARSE + 1], a), b);
  };

  function* paintPicture() {
    // the slow sums first, at half size
    const step = (2 * HALF) / COARSE;
    for (let j = 0; j < COARSE; j++) {
      const z = -HALF + (j + 0.5) * step;
      for (let i = 0; i < COARSE; i++) {
        const x = -HALF + (i + 0.5) * step;
        const k = i + j * COARSE;
        const r = Math.hypot(x, z);
        coarse.h[k] = heightAt(x, z);
        coarse.fields[k] = r > 540 ? fieldsAt(x, z) : 0;
        coarse.forest[k] = r > 815 ? forestAt(x, z) : 0;
      }
      if (j % 4 === 3) yield;
    }
    // then the colours, a band at a time
    const BAND = 32;
    const m = (2 * HALF) / RES;
    for (let j0 = 0; j0 < RES; j0 += BAND) {
      const image = pctx.createImageData(RES, BAND);
      for (let dj = 0; dj < BAND; dj++) {
        const j = j0 + dj;
        const z = -HALF + (j + 0.5) * m;
        for (let i = 0; i < RES; i++) {
          const x = -HALF + (i + 0.5) * m;
          const fx = (i + 0.5) / 2 - 0.5;
          const fy = (j + 0.5) / 2 - 0.5;
          const h = sample(coarse.h, fx, fy);
          const r = Math.hypot(x, z);
          // meadow: paler low down, deeper on the hills
          const t = smooth(-12, 90, h);
          let c = [lerp(166, 96, t), lerp(206, 150, t), lerp(118, 84, t)];
          const fields = sample(coarse.fields, fx, fy);
          if (fields > 0.02) {
            const [u, v] = toUV(x, z);
            const patch = [[217, 207, 138], [186, 212, 124], [205, 190, 120], [160, 200, 112]][(Math.floor(u / 150) * 3 + Math.floor(v / 150)) & 3];
            c = c.map((q, n) => lerp(q, patch[n], Math.min(1, fields)));
          }
          const forest = sample(coarse.forest, fx, fy);
          if (forest > 0.02) c = c.map((q, n) => lerp(q, [58, 112, 68][n], Math.min(1, forest) * 0.9));
          // the lie of the land, lit from the top left
          const light = 1 + Math.max(-0.3, Math.min(0.28, (sample(coarse.h, fx - 1, fy - 1) - sample(coarse.h, fx + 1, fy + 1)) * 0.02));
          c = c.map((q) => q * light);
          // water: the tarn, and the river where it lies on low ground
          const river = riverDistance(x, z);
          if (tarnDistance(x, z) < 1) c = [90, 167, 214];
          else if (river < 9 && h < -9 - toUV(x, z)[0] * 0.0035 + 3) {
            c = [90, 167, 214];
            if (!riverAt || Math.abs(r - 720) < Math.abs(Math.hypot(...riverAt) - 720)) riverAt = [x, z];
          }
          // beyond the walk the land is only to be looked at: paler
          if (r > reach) c = c.map((q, n) => lerp(q, [236, 232, 220][n], 0.4));
          const k = (i + dj * RES) * 4;
          image.data[k] = c[0];
          image.data[k + 1] = c[1];
          image.data[k + 2] = c[2];
          image.data[k + 3] = 255;
        }
      }
      pctx.putImageData(image, 0, j0);
      yield;
    }
    drawPlan();
  }

  /** What stands on the land, and its edges: drawn over the colours once they are done. */
  function drawPlan() {
    const c = pctx;
    const line = (points, close = false) => {
      c.beginPath();
      points.forEach(([x, z], n) => (n ? c.lineTo(px(x), px(z)) : c.moveTo(px(x), px(z))));
      if (close) c.closePath();
      c.stroke();
    };
    c.lineJoin = c.lineCap = 'round';
    // the road to the village and the lane to the mill
    for (const road of ROADS) {
      const points = along(road, 12).map(([u, v]) => fromValley(u, v));
      c.strokeStyle = '#8b7d5c';
      c.lineWidth = 4;
      line(points);
      c.strokeStyle = '#e9dfc2';
      c.lineWidth = 2.4;
      line(points);
    }
    // the three footpaths (the same curves the ground is worn along: world.js, pathDistance)
    const paths = [[], [], []];
    for (let u = -60; u <= 372; u += 6) paths[0].push(fromValley(u, -4 + 30 * Math.sin(u / 95) + 9 * Math.sin(u / 37 + 1.3) + (u / 372) * 22));
    for (let v = -250; v <= 280; v += 6) paths[1].push(fromValley(236 + 34 * Math.sin(v / 80 + 0.6) + 10 * Math.sin(v / 29), v));
    for (let u = 428; u <= 640; u += 6) paths[2].push(fromValley(u, -30 - (u - 428) * 0.7 + 9 * Math.sin(u / 24)));
    c.strokeStyle = '#a67c52';
    c.lineWidth = 1.6;
    c.setLineDash([4, 3]);
    paths.forEach((p) => line(p));
    c.setLineDash([]);
    // trees and stones
    for (const [x, z, kind, size = 1] of trees) {
      c.fillStyle = kind === 0 ? '#2f6a3a' : '#3f7a45';
      c.beginPath();
      c.arc(px(x), px(z), Math.max(1.1, (kind === 0 ? 9 : kind > 3 ? 1.6 : 3.2) * size * scale), 0, 7);
      c.fill();
    }
    c.fillStyle = '#8d9499';
    for (const [x, z, gap] of stones) {
      c.beginPath();
      c.arc(px(x), px(z), Math.max(1, gap * scale), 0, 7);
      c.fill();
    }
    // houses: the village as a huddle of roofs, a roof for each farm, and the mill
    const roof = (x, z, w) => {
      c.fillStyle = '#b5533c';
      c.strokeStyle = '#6e2f20';
      c.lineWidth = 0.8;
      c.fillRect(px(x) - w / 2, px(z) - w / 2, w, w);
      c.strokeRect(px(x) - w / 2, px(z) - w / 2, w, w);
    };
    for (let n = 0; n < 16; n++) {
      const a = n * 2.4;
      const d = 0.25 + 0.7 * ((n * 7) % 10) / 10;
      roof(...fromValley(VILLAGE[0] + Math.cos(a) * d * 60, VILLAGE[1] + Math.sin(a) * d * 74), 6);
    }
    for (const [u, v] of FARMS) roof(...fromValley(u, v), 7);
    // the hamlet by the tarn, each house to its true size and turn
    for (const house of HAMLET) {
      c.save();
      c.translate(px(house.x), px(house.z));
      c.rotate(-house.turn);
      c.fillStyle = '#b5533c';
      c.strokeStyle = '#6e2f20';
      c.lineWidth = 0.6;
      for (const [cx, cz, w, d] of house.boxes) {
        c.fillRect((cx - w / 2) * scale, (cz - d / 2) * scale, w * scale, d * scale);
        c.strokeRect((cx - w / 2) * scale, (cz - d / 2) * scale, w * scale, d * scale);
      }
      c.restore();
    }
    roof(...fromValley(MILL[0], MILL[1]), 8);
    // the edges: the ground made in full, and how far the walk goes
    c.strokeStyle = '#5b6b78';
    c.lineWidth = 1.2;
    c.strokeRect(px(-extent / 2), px(-extent / 2), extent * scale, extent * scale);
    c.strokeStyle = '#c0392b';
    c.lineWidth = 2.6;
    c.setLineDash([9, 6]);
    c.beginPath();
    c.arc(px(0), px(0), reach * scale, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }

  // a few milliseconds of painting between frames, until it is done
  const painting = paintPicture();
  const paintSome = () => {
    const until = performance.now() + 5;
    while (performance.now() < until) if (painting.next().done) return;
    setTimeout(paintSome, 30);
  };
  setTimeout(paintSome, 400);

  // ---- drawing it -------------------------------------------------------------------------------------------
  const fit = (canvas) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    if (w && canvas.width !== w) canvas.width = canvas.height = w;
    return canvas.width;
  };
  /** You: an arrow that points where you look. */
  const arrow = (c, x, y, yaw, size) => {
    c.save();
    c.translate(x, y);
    c.rotate(-yaw);
    c.beginPath();
    c.moveTo(0, -size);
    c.lineTo(size * 0.72, size * 0.85);
    c.lineTo(0, size * 0.4);
    c.lineTo(-size * 0.72, size * 0.85);
    c.closePath();
    c.fillStyle = '#fff';
    c.strokeStyle = '#1d3f5e';
    c.lineWidth = Math.max(1.5, size * 0.22);
    c.lineJoin = 'round';
    c.stroke();
    c.fill();
    c.restore();
  };
  const label = (c, text, x, y, size, { bold = false, align = 'center', colour = '#16242e' } = {}) => {
    c.font = `${bold ? 700 : 600} ${size}px ${FONT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.lineWidth = size * 0.28;
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineJoin = 'round';
    c.strokeText(text, x, y);
    c.fillStyle = colour;
    c.fillText(text, x, y);
  };

  function drawSmall(player) {
    const w = fit(smallCanvas);
    if (!w) return;
    const c = smallCanvas.getContext('2d');
    c.save();
    c.beginPath();
    c.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = '#cfd8c4';
    c.fillRect(0, 0, w, w);
    const side = 2 * NEAR * scale;
    c.imageSmoothingQuality = 'high';
    c.drawImage(picture, px(player.x) - side / 2, px(player.z) - side / 2, side, side, 0, 0, w, w);
    c.restore();
    arrow(c, w / 2, w / 2, player.yaw, w * 0.062);
    // the rim, and which way is up
    c.beginPath();
    c.arc(w / 2, w / 2, w / 2 - w * 0.012, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,255,255,.92)';
    c.lineWidth = w * 0.024;
    c.stroke();
    label(c, 'B', w / 2, w * 0.09, w * 0.085, { bold: true, colour: '#b03324' });
  }

  function drawFull(player) {
    const w = fit(fullCanvas);
    if (!w) return;
    const c = fullCanvas.getContext('2d');
    const k = w / RES;
    const at = (x) => px(x) * k;
    c.imageSmoothingQuality = 'high';
    c.drawImage(picture, 0, 0, w, w);
    const s = w / 60; // a size to draw names at
    const dot = (x, z) => {
      c.beginPath();
      c.arc(at(x), at(z), s * 0.32, 0, 7);
      c.fillStyle = '#16242e';
      c.fill();
    };
    const place = (text, [x, z], dx = 0, dy = -1.1, marked = true) => {
      if (marked) dot(x, z);
      label(c, text, at(x) + dx * s, at(z) + dy * s, s);
    };
    place('Đồi ngắm cảnh', START, 0, 1.2);
    place('Điểm xuất phát', SPAWN, -4.2, 0.2);
    place('Xóm ven hồ', [HAMLET[0].x, HAMLET[0].z], 3.6, 1.4, false);
    place('Cây cổ thụ', TREE, 0, -1.2, false);
    place('Hồ nước', TARN.at, 0, -2.6, false);
    place('Làng', fromValley(VILLAGE[0], VILLAGE[1]), 0, -3.4, false);
    place('Cối xay', fromValley(MILL[0], MILL[1]), 0, 1.5, false);
    for (const [u, v] of FARMS) {
      const [x, z] = fromValley(u, v);
      if (Math.max(Math.abs(x), Math.abs(z)) < HALF - 70) place('Trang trại', [x, z], 0, 1.4, false);
    }
    if (riverAt) place('Sông', riverAt, 2.2, 0, false);
    for (const [u, v] of [[300, -720], [300, 720], [-650, 0]]) {
      const [x, z] = fromValley(u, v);
      label(c, 'Đồi rừng', at(x), at(z), s * 1.05, { colour: '#24492c' });
    }
    label(c, `Ranh giới đi bộ · bán kính ${Math.round(reach)} m`, at(0), at(-reach) - s * 1.1, s * 0.95, { bold: true, colour: '#a52c1d' });
    label(c, `Mặt đất chi tiết ${extent} × ${extent} m`, at(-extent / 2) + s * 0.6, at(extent / 2) - s * 0.9, s * 0.85, { align: 'left', colour: '#3d4c58' });
    // north, and a measure
    label(c, 'B ↑', w - s * 2.2, s * 1.6, s * 1.2, { bold: true, colour: '#b03324' });
    const bar = 200 * scale * k;
    c.fillStyle = '#16242e';
    c.fillRect(s * 1.2, w - s * 1.6, bar, s * 0.22);
    c.fillRect(s * 1.2, w - s * 1.9, s * 0.12, s * 0.52);
    c.fillRect(s * 1.2 + bar - s * 0.12, w - s * 1.9, s * 0.12, s * 0.52);
    label(c, '200 m', s * 1.2 + bar / 2, w - s * 2.5, s * 0.9);
    // you
    arrow(c, at(player.x), at(player.z), player.yaw, s * 0.95);
    label(c, 'Bạn', at(player.x), at(player.z) + s * 1.9, s, { bold: true, colour: '#1d3f5e' });

    const r = Math.hypot(player.x, player.z);
    const lake = Math.hypot(player.x - TARN.at[0], player.z - TARN.at[1]);
    where.innerHTML = `<b>Vị trí của bạn</b><br>Cách tâm bản đồ ${Math.round(r)} m<br>Còn ${Math.max(0, Math.round(reach - r))} m nữa tới ranh giới<br>Cách hồ ${Math.round(lake)} m`;
  }

  let frame = 0;
  let before = performance.now();
  let pace = 0; // ms a frame, smoothed
  return {
    /** Each frame: where you are (x, z) and which way you look (yaw). */
    update(player) {
      frame++;
      const now = performance.now();
      pace += (Math.min(250, now - before) - pace) * (pace ? 0.05 : 1);
      before = now;
      drawSmall(player);
      if (!open) return;
      if (frame % 3 === 0) drawFull(player);
      if (frame % 20 === 0 && settings) {
        fpsLabel.textContent = `${Math.round(1000 / Math.max(1, pace))} khung/giây`;
        showSettings();
      }
    },
    get open() {
      return open;
    },
    setOpen,
  };
}
