export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LEVELS = [
  { level: 1, title: 'Người Bắt Đầu', minXP: 0, maxXP: 100 },
  { level: 2, title: 'Người Khám Phá', minXP: 100, maxXP: 300 },
  { level: 3, title: 'Người Kiên Cường', minXP: 300, maxXP: 600 },
  { level: 4, title: 'Người Truyền Cảm Hứng', minXP: 600, maxXP: 1000 },
  { level: 5, title: 'Bậc Thầy Bình Yên', minXP: 1000, maxXP: Infinity }
];

export function getLevelInfo(xp) {
  return LEVELS.slice().reverse().find((level) => xp >= level.minXP) || LEVELS[0];
}

export function getLevelProgress(xp) {
  const level = getLevelInfo(xp);
  if (level.maxXP === Infinity) return 100;
  return Math.max(0, Math.min(100, Math.round(((xp - level.minXP) / (level.maxXP - level.minXP)) * 100)));
}

export function getTaskEmoji(category) {
  if (!category) return '✨';
  const emojis = {
    breathing: '💨',
    meditation: '🧘',
    journal: '✍️',
    emergency: '🚨',
    sleep: '😴',
    reflection: '🙏'
  };
  return emojis[String(category).toLowerCase()] || '✨';
}

export function getGardenTone(status) {
  if (status === 'excellent') return '#7BBF95';
  if (status === 'good') return '#A8D5BA';
  if (status === 'fair') return '#C5E8D2';
  if (status === 'needs-care') return '#FFCBA4';
  return '#E8CBA7';
}

export function getRiskLabel(level) {
  if (level === 'critical') return 'Rủi ro rất cao';
  if (level === 'high') return 'Rủi ro cao';
  if (level === 'moderate') return 'Cần theo dõi';
  return 'Ổn định';
}

export function getRiskBadgeClass(level) {
  if (level === 'critical' || level === 'high') return 'badge-coral';
  if (level === 'moderate') return 'badge-peach';
  return 'badge-mint';
}

export function buildStreakDays(streak) {
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date().getDay();
  const activeIndexes = new Set();

  for (let offset = 0; offset < Math.min(streak, 7); offset += 1) {
    activeIndexes.add((today - offset + 7) % 7);
  }

  return labels.map((label, index) => {
    let className = '';
    if (activeIndexes.has(index)) className = 'done';
    if (index === today) className = streak > 0 ? 'today done' : 'today';
    return { label, className };
  });
}

export function renderChartSvg(chartData) {
  const points = chartData?.points || [];
  const numericPoints = points.filter((point) => point.value !== null && point.value !== undefined);

  if (!numericPoints.length) {
    return `
      <div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--text-light);padding:0 18px;">
        Chưa có đủ dữ liệu mood check-in để vẽ biểu đồ.
      </div>
    `;
  }

  const width = 500;
  const height = 140;
  const left = 30;
  const right = 470;
  const bottom = 130;
  const top = 18;
  const step = points.length > 1 ? (right - left) / (points.length - 1) : 0;

  const plotted = points.map((point, index) => {
    const value = point.value === null || point.value === undefined ? null : Number(point.value);
    const x = left + (step * index);
    const y = value === null ? null : bottom - (((value - 1) / 9) * (bottom - top));
    return { ...point, x, y, value };
  });

  const filled = plotted.map((point, index) => {
    if (point.y !== null) return point;
    const prev = [...plotted].slice(0, index).reverse().find((item) => item.y !== null);
    const next = plotted.slice(index + 1).find((item) => item.y !== null);
    return { ...point, y: prev?.y ?? next?.y ?? bottom };
  });

  const linePoints = filled.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${linePoints} ${right},${bottom} ${left},${bottom}`;
  const lastPoint = plotted.filter((point) => point.value !== null).slice(-1)[0];

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <line x1="0" y1="28" x2="${width}" y2="28" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4" />
      <line x1="0" y1="70" x2="${width}" y2="70" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4" />
      <line x1="0" y1="112" x2="${width}" y2="112" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4" />
      <text x="4" y="26" font-size="10" fill="#A89585" font-family="Nunito">10</text>
      <text x="4" y="68" font-size="10" fill="#A89585" font-family="Nunito">5</text>
      <text x="4" y="110" font-size="10" fill="#A89585" font-family="Nunito">1</text>
      <defs>
        <linearGradient id="moodGradDynamic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#A8D5BA" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#A8D5BA" stop-opacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#moodGradDynamic)" />
      <polyline points="${linePoints}" fill="none" stroke="#7BBF95" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${plotted.map((point) => {
        if (point.value === null) return '';
        const isLast = lastPoint && lastPoint.date === point.date;
        return `<circle cx="${point.x}" cy="${point.y}" r="${isLast ? 6 : 5}" fill="${isLast ? '#FFCBA4' : '#7BBF95'}" stroke="${isLast ? '#E8A876' : 'white'}" stroke-width="2" />`;
      }).join('')}
      ${lastPoint ? `
        <rect x="${Math.max(0, lastPoint.x - 26)}" y="${Math.max(0, lastPoint.y - 22)}" width="52" height="18" rx="6" fill="#4A3728" opacity="0.85" />
        <text x="${lastPoint.x}" y="${Math.max(12, lastPoint.y - 10)}" font-size="10" fill="white" font-family="Nunito" font-weight="700" text-anchor="middle">${lastPoint.value}/10</text>
      ` : ''}
    </svg>
  `;
}

export function buildRadarSvg(metrics) {
  const centerX = 80;
  const centerY = 80;
  const radius = 58;
  const axisCount = metrics.length;
  const gridLevels = [1, 0.75, 0.5];

  const polarPoint = (index, scale) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / axisCount);
    return {
      x: centerX + (Math.cos(angle) * radius * scale),
      y: centerY + (Math.sin(angle) * radius * scale)
    };
  };

  const grid = gridLevels.map((level, levelIndex) => {
    const points = metrics.map((_, index) => {
      const point = polarPoint(index, level);
      return `${point.x},${point.y}`;
    }).join(' ');
    return `<polygon points="${points}" fill="none" stroke="#E8CBA7" stroke-width="${levelIndex === 0 ? 1.5 : 1}" />`;
  }).join('');

  const axes = metrics.map((_, index) => {
    const point = polarPoint(index, 1);
    return `<line x1="${centerX}" y1="${centerY}" x2="${point.x}" y2="${point.y}" stroke="#E8CBA7" stroke-width="1" />`;
  }).join('');

  const polygonPoints = metrics.map((metric, index) => {
    const normalized = metric.value === null || metric.value === undefined ? 0.2 : Math.max(0.1, Number(metric.value) / 10);
    const point = polarPoint(index, normalized);
    return `${point.x},${point.y}`;
  }).join(' ');

  const dots = metrics.map((metric, index) => {
    const normalized = metric.value === null || metric.value === undefined ? 0.2 : Math.max(0.1, Number(metric.value) / 10);
    const point = polarPoint(index, normalized);
    return `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${metric.color}" />`;
  }).join('');

  const labels = metrics.map((metric, index) => {
    const point = polarPoint(index, 1.18);
    let anchor = 'middle';
    if (point.x < centerX - 8) anchor = 'end';
    if (point.x > centerX + 8) anchor = 'start';
    return `<text x="${point.x}" y="${point.y}" text-anchor="${anchor}" font-size="9" fill="#7A6555" font-family="Nunito" font-weight="700">${escapeHtml(metric.label)}</text>`;
  }).join('');

  return `
    <svg width="160" height="160" viewBox="0 0 160 160">
      ${grid}
      ${axes}
      <polygon points="${polygonPoints}" fill="rgba(168,213,186,0.35)" stroke="#7BBF95" stroke-width="2.5" />
      ${dots}
      ${labels}
    </svg>
  `;
}

export function buildGardenTreesHtml(gardenMetrics) {
  const treePositions = ['10%', '32%', '56%', '79%'];
  return gardenMetrics.map((metric, index) => {
    const tone = getGardenTone(metric.status);
    const size = 20 + Math.round((Number(metric.value || 0) / 10) * 18);
    const trunk = 16 + Math.round((Number(metric.value || 0) / 10) * 10);
    return `
      <div class="garden-tree" style="left:${treePositions[index]};">
        <div class="gt-top" style="border-left-width:${Math.round(size / 2)}px;border-right-width:${Math.round(size / 2)}px;border-bottom-width:${size}px;border-bottom-color:${tone};"></div>
        <div class="gt-trunk" style="width:8px;height:${trunk}px;"></div>
        <div class="gt-flower" style="top:-${size + 10}px;left:4px;">${escapeHtml(metric.emoji)}</div>
      </div>
    `;
  }).join('');
}
