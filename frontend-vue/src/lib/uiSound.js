// Âm thanh + rung nhẹ cho thao tác giao diện (bấm nút, kéo thanh cảm xúc, hoàn thành).
// Tự tổng hợp bằng Web Audio — không tải file âm thanh nào. Âm lượng rất nhỏ, mềm (hợp app
// chăm sóc tinh thần); tắt được trong Cài đặt → Giao diện → Âm thanh. Không phát gì khi
// người dùng chưa chạm vào trang (trình duyệt chặn tự phát âm thanh).
import { Capacitor } from '@capacitor/core';

const TAP_KEY = 'pf.uiSound'; // '0' = tắt
let ctx = null;
let lastTapAt = 0;

export function uiSoundEnabled() {
  try { return localStorage.getItem(TAP_KEY) !== '0'; } catch (_e) { return true; }
}
export function setUiSoundEnabled(on) {
  try { localStorage.setItem(TAP_KEY, on ? '1' : '0'); } catch (_e) { /* bỏ qua */ }
}

function audio() {
  if (!uiSoundEnabled()) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (_e) { return null; }
}

// Một nốt sine mềm: lên nhanh, tắt dần (không "bíp" gắt)
function note(ac, freq, { at = 0, dur = 0.12, gain = 0.05, type = 'sine', slideTo = null } = {}) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

async function haptic(kind = 'light') {
  if (!uiSoundEnabled()) return; // tắt "Âm thanh khi chạm" thì tắt luôn rung
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      if (kind === 'select') await Haptics.selectionChanged();
      else await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) {
      navigator.vibrate(kind === 'medium' ? 12 : 6);
    }
  } catch (_e) { /* thiết bị không hỗ trợ rung */ }
}

// Bấm nút: "tách" gỗ nhẹ
export function uiTap() {
  const now = performance.now();
  if (now - lastTapAt < 60) return; // chống dồn tiếng khi bấm liên tục
  lastTapAt = now;
  const ac = audio();
  if (ac) note(ac, 1180, { dur: 0.05, gain: 0.035, type: 'triangle', slideTo: 760 });
  haptic('light');
}

// Kéo thanh cảm xúc qua một nấc: cao độ theo giá trị (0 → 1), thang ngũ cung dễ nghe
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
export function uiTick(level = 0.5) {
  const ac = audio();
  const i = Math.max(0, Math.min(PENTA.length - 1, Math.round(level * (PENTA.length - 1))));
  if (ac) note(ac, PENTA[i], { dur: 0.09, gain: 0.04 });
  haptic('select');
}

// Hoàn thành / lưu xong: hai nốt chuông ấm
export function uiSuccess() {
  const ac = audio();
  if (ac) {
    note(ac, 659.25, { dur: 0.35, gain: 0.05 });
    note(ac, 987.77, { at: 0.11, dur: 0.5, gain: 0.045 });
  }
  haptic('medium');
}

// Mèo PeaceCat "rừ rừ" (trang 404 và các chi tiết nhỏ)
export function uiPurr() {
  const ac = audio();
  if (!ac) return;
  for (let k = 0; k < 5; k += 1) note(ac, 95 + (k % 2) * 8, { at: k * 0.11, dur: 0.1, gain: 0.05, type: 'triangle' });
  haptic('light');
}

// Gắn 1 lần (main.js): mọi nút trong app có tiếng "tách" + rung nhẹ khi bấm
export function installTapFeedback() {
  const SEL = 'button, [role="button"], .btn, .btn-primary, .btn-outline, a.nav-item, a.btn';
  window.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const el = e.target.closest?.(SEL);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[data-no-tap-sound]')) return;
    uiTap();
  }, { passive: true, capture: true });
}
