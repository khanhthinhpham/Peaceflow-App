/*
 * Âm thanh thiên nhiên cho Khu vườn tâm hồn — tạo hoàn toàn bằng Web Audio (không tải file, không vướng bản quyền):
 *  - suối róc rách: nhiễu nâu qua lọc dải, âm lượng gợn theo nhịp chậm
 *  - gió nhẹ: nhiễu hồng qua lọc thấp, lúc mạnh lúc dịu
 *  - mưa nhẹ: nhiễu trắng qua lọc cao — chỉ khi vườn kém tươi
 *  - chim hót (ban ngày) / dế kêu (ban đêm): phát ngẫu nhiên, vườn càng khoẻ chim càng ríu rít
 * Dùng: const s = createNatureSound(); s.start() (phải gọi trong thao tác của người dùng); s.setMood(0..1); s.setHour(0..24); s.stop()
 */
export function createNatureSound() {
  let ctx = null; let master = null; let running = false;
  let streamGain = null; let windGain = null; let rainGain = null; let lfoTimer = null; let chirpTimer = null;
  let mood = 0.7; let night = 0;

  function noise(kind, seconds = 3) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    let last = 0; let b0 = 0; let b1 = 0; let b2 = 0;
    for (let i = 0; i < len; i += 1) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.05) * 0.9; }
      else d[i] = w;
    }
    return buf;
  }
  function loop(buf, ...chain) {
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    let node = src; chain.forEach((n) => { node.connect(n); node = n; });
    src.start();
    return src;
  }
  const filt = (type, freq, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
  const gainNode = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };

  // tiếng chim: chuỗi 3–7 nốt huýt ngắn, tần số trượt, đặt lệch trái/phải ngẫu nhiên
  function bird() {
    const t0 = ctx.currentTime; const base = 2300 + Math.random() * 1900; const notes = 3 + Math.floor(Math.random() * 5);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(master); }
    for (let i = 0; i < notes; i += 1) {
      const st = t0 + i * (0.09 + Math.random() * 0.07); const dur = 0.06 + Math.random() * 0.08;
      const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine';
      const f = base * (0.85 + Math.random() * 0.4);
      o.frequency.setValueAtTime(f, st); o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.35 : 0.7), st + dur);
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.13 + mood * 0.08, st + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, st + dur); // tiếng chim rõ hơn
      o.connect(g); g.connect(pan || master); o.start(st); o.stop(st + dur + 0.02);
    }
  }
  // tiếng dế: nhịp rung nhanh ở tần số cao, 3–5 tràng
  function cricket() {
    const t0 = ctx.currentTime; const f = 4300 + Math.random() * 500;
    for (let r = 0; r < 3 + Math.floor(Math.random() * 3); r += 1) {
      const st = t0 + r * 0.32;
      const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = f; o.type = 'sine';
      const am = ctx.createOscillator(); const amG = ctx.createGain(); am.frequency.value = 42; amG.gain.value = 0.02;
      am.connect(amG); amG.connect(g.gain);
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.022, st + 0.03); g.gain.linearRampToValueAtTime(0, st + 0.2);
      o.connect(g); g.connect(master); o.start(st); am.start(st); o.stop(st + 0.22); am.stop(st + 0.22);
    }
  }
  function scheduleChirp() {
    if (!running) return;
    const busy = night > 0.5 ? 0.55 : 0.25 + mood * 0.75; // ngày: vườn khoẻ thì chim hót dày hơn
    const wait = (1.8 + Math.random() * 4.5) / Math.max(0.2, busy);
    chirpTimer = setTimeout(() => {
      if (!running) return;
      if (Math.random() < night) cricket(); else if (Math.random() < 0.35 + mood * 0.6) bird();
      scheduleChirp();
    }, wait * 1000);
  }
  function applyLevels() {
    if (!ctx) return;
    const t = ctx.currentTime;
    streamGain.gain.setTargetAtTime(0.1 + 0.22 * mood, t, 0.8);
    rainGain.gain.setTargetAtTime(Math.max(0, (0.38 - mood) / 0.38) * 0.22, t, 1.2); // mưa nhẹ khi vườn kém tươi
  }

  return {
    get running() { return running; },
    start() {
      if (running) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); running = true;
      master = gainNode(0); master.connect(ctx.destination);
      master.gain.setTargetAtTime(0.75, ctx.currentTime, 0.8); // vào êm
      streamGain = gainNode(0.2); loop(noise('brown'), filt('bandpass', 1100, 0.6), streamGain, master);
      windGain = gainNode(0.06); loop(noise('pink', 4), filt('lowpass', 520), windGain, master);
      rainGain = gainNode(0); loop(noise('white', 2), filt('highpass', 2600), filt('lowpass', 9000), rainGain, master);
      // nhịp gợn chậm cho suối & gió
      lfoTimer = setInterval(() => {
        if (!ctx) return; const t = ctx.currentTime;
        windGain.gain.setTargetAtTime(0.03 + Math.random() * 0.09, t, 1.5);
        streamGain.gain.setTargetAtTime((0.1 + 0.22 * mood) * (0.85 + Math.random() * 0.3), t, 0.6);
      }, 2500);
      applyLevels(); scheduleChirp();
    },
    stop() {
      if (!running) return;
      running = false; clearTimeout(chirpTimer); clearInterval(lfoTimer);
      const c = ctx; const m = master; ctx = null;
      try { m.gain.setTargetAtTime(0, c.currentTime, 0.25); } catch { /* bỏ qua */ }
      setTimeout(() => { c.close().catch(() => {}); }, 900); // tắt êm rồi đóng
    },
    setMood(v) { mood = Math.min(1, Math.max(0, Number(v) || 0)); applyLevels(); },
    setHour(hr) { night = hr < 4.5 || hr > 20.5 ? 1 : hr < 6 ? (6 - hr) / 1.5 : hr > 18.5 ? (hr - 18.5) / 2 : 0; }
  };
}
