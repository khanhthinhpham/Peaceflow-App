export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// `labelKey` thay vì chuỗi tiếng Việt cứng — hàm này không có quyền truy cập i18n (thuần
// dữ liệu), nên chỉ trả về khoá; nơi gọi (DashboardView.vue, đã có t() qua useI18n()) tự
// dịch bằng t(levelInfo.labelKey).
const LEVELS = [
  { level: 1, labelKey: 'dashboard.levels.l1', minXP: 0, maxXP: 100 },
  { level: 2, labelKey: 'dashboard.levels.l2', minXP: 100, maxXP: 300 },
  { level: 3, labelKey: 'dashboard.levels.l3', minXP: 300, maxXP: 600 },
  { level: 4, labelKey: 'dashboard.levels.l4', minXP: 600, maxXP: 1000 },
  { level: 5, labelKey: 'dashboard.levels.l5', minXP: 1000, maxXP: Infinity }
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
  // Không dùng màu "báo động" cho trạng thái cần chăm sóc: cây chỉ trầm và dịu đi, không bị phạt.
  if (status === 'excellent') return 'var(--color-brand)';
  if (status === 'good') return 'var(--color-success)';
  if (status === 'fair') return 'var(--color-sage)';
  if (status === 'needs-care') return 'var(--color-olive)';
  return 'var(--color-surface-muted)';
}

// `t` truyền vào từ nơi gọi (DashboardView.vue có sẵn qua useI18n()) — hàm này thuần dữ
// liệu, không tự có quyền truy cập i18n.
export function getRiskLabel(level, t) {
  if (level === 'critical') return t('dashboard.risk.critical');
  if (level === 'high') return t('dashboard.risk.high');
  if (level === 'moderate') return t('dashboard.risk.moderate');
  return t('dashboard.risk.stable');
}

export function getRiskBadgeClass(level) {
  if (level === 'critical' || level === 'high') return 'badge-coral';
  if (level === 'moderate') return 'badge-peach';
  return 'badge-mint';
}

// Nhãn thứ trong tuần CỐ Ý không dùng Intl.DateTimeFormat({weekday:'short'}) — đã thử
// (verify thật): 'vi' ra "Th 2".."Th 7" (dài hơn thiết kế gốc "T2".."T7"), 'en' ra
// "Sun".."Sat" (3 ký tự) — cả hai đều dễ tràn khỏi ô 26x26px đang thiết kế cho 2 ký tự.
// Giữ bảng tra cứu ngắn gọn thủ công để đúng ý đồ thiết kế.
const WEEKDAY_LABELS = {
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
};

export function buildStreakDays(streak, locale = 'vi') {
  const labels = WEEKDAY_LABELS[locale] || WEEKDAY_LABELS.vi;
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

export function renderChartSvg(chartData, noDataText = 'Chưa có đủ dữ liệu mood check-in để vẽ biểu đồ.') {
  const points = chartData?.points || [];
  const numericPoints = points.filter((point) => point.value !== null && point.value !== undefined);

  if (!numericPoints.length) {
    return `
      <div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--text-light);padding:0 18px;">
        ${escapeHtml(noDataText)}
      </div>
    `;
  }

  const width = 700;
  const height = 220;
  const left = 40;
  const right = 680;
  const bottom = 180;
  const top = 20;
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
      <line x1="${left - 15}" y1="${top}" x2="${right + 5}" y2="${top}" style="stroke:var(--color-border)" stroke-width="1.2" stroke-dasharray="3 3" />
      <line x1="${left - 15}" y1="${(top + bottom) / 2}" x2="${right + 5}" y2="${(top + bottom) / 2}" style="stroke:var(--color-border)" stroke-width="1.2" stroke-dasharray="3 3" />
      <line x1="${left - 15}" y1="${bottom}" x2="${right + 5}" y2="${bottom}" style="stroke:var(--color-border)" stroke-width="1.2" stroke-dasharray="3 3" />
      <text x="0" y="${top + 4}" font-size="13" style="fill:var(--color-text-muted);font-family:var(--font-body)" font-weight="500">10</text>
      <text x="0" y="${(top + bottom) / 2 + 4}" font-size="13" style="fill:var(--color-text-muted);font-family:var(--font-body)" font-weight="500">5</text>
      <text x="0" y="${bottom + 4}" font-size="13" style="fill:var(--color-text-muted);font-family:var(--font-body)" font-weight="500">1</text>
      <defs>
        <linearGradient id="moodGradDynamic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color:var(--color-sage)" stop-opacity="0.45" />
          <stop offset="100%" style="stop-color:var(--color-sage)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#moodGradDynamic)" />
      <polyline points="${linePoints}" fill="none" style="stroke:var(--color-brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${plotted.map((point) => {
        if (point.value === null) return '';
        const isLast = lastPoint && lastPoint.date === point.date;
        if (isLast) {
          return `<circle cx="${point.x}" cy="${point.y}" r="6" style="fill:var(--color-terracotta)" /><circle cx="${point.x}" cy="${point.y}" r="2.5" style="fill:var(--color-surface)" />`;
        }
        return `<circle cx="${point.x}" cy="${point.y}" r="4" style="fill:var(--color-brand)" />`;
      }).join('')}
      ${lastPoint ? `
        <rect x="${Math.min(width - 66, Math.max(0, lastPoint.x - 33))}" y="${Math.max(0, lastPoint.y - 38)}" width="66" height="28" rx="8" style="fill:var(--color-text)" />
        <text x="${Math.min(width - 33, Math.max(33, lastPoint.x))}" y="${Math.max(18, lastPoint.y - 20)}" font-size="13" style="fill:var(--color-surface);font-family:var(--font-body)" font-weight="600" text-anchor="middle">${lastPoint.value} / 10</text>
      ` : ''}
    </svg>
  `;
}

export function buildRadarSvg(metrics) {
  const radius = 100;
  const axisCount = metrics.length;
  const gridLevels = [1, 2 / 3, 1 / 3];
  const hasValue = (metric) => metric.value !== null && metric.value !== undefined;

  const polarPoint = (index, scale) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / axisCount);
    return { x: Math.cos(angle) * radius * scale, y: Math.sin(angle) * radius * scale };
  };

  const grid = gridLevels.map((level, levelIndex) => {
    const points = metrics.map((_, index) => {
      const point = polarPoint(index, level);
      return `${point.x},${point.y}`;
    }).join(' ');
    return `<polygon points="${points}" fill="none" style="stroke:var(${levelIndex === 0 ? '--color-olive' : '--color-surface-muted'})" stroke-width="${levelIndex === 0 ? 1.2 : 1}" />`;
  }).join('');

  const axes = metrics.map((_, index) => {
    const point = polarPoint(index, 1);
    return `<line x1="0" y1="0" x2="${point.x}" y2="${point.y}" style="stroke:var(--color-surface-muted)" stroke-width="1.2" />`;
  }).join('');

  const valuePoint = (metric, index) => {
    const normalized = hasValue(metric) ? Math.max(0.1, Number(metric.value) / 10) : 0.15;
    return polarPoint(index, normalized);
  };

  const polygonPoints = metrics.map((metric, index) => {
    const point = valuePoint(metric, index);
    return `${point.x},${point.y}`;
  }).join(' ');

  const dots = metrics.map((metric, index) => {
    const point = valuePoint(metric, index);
    return `<circle cx="${point.x}" cy="${point.y}" r="${hasValue(metric) ? 4 : 3.5}" style="fill:var(${hasValue(metric) ? '--color-brand' : '--color-text-subtle'})" />`;
  }).join('');

  const labels = metrics.map((metric, index) => {
    const point = polarPoint(index, 1);
    let anchor = 'middle';
    let x = point.x;
    let y = point.y;
    if (point.x < -8) { anchor = 'end'; x -= 10; }
    else if (point.x > 8) { anchor = 'start'; x += 10; }
    if (Math.abs(point.x) <= 8) y += point.y < 0 ? -10 : 18;
    else y += 4;
    const fill = hasValue(metric) ? '--color-text' : '--color-text-muted';
    const weight = hasValue(metric) ? 600 : 500;
    const text = `${metric.label} (${hasValue(metric) ? metric.value : '--'})`;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="13" style="fill:var(${fill});font-family:var(--font-body)" font-weight="${weight}">${escapeHtml(text)}</text>`;
  }).join('');

  return `
    <svg class="radar-svg" viewBox="-230 -135 460 270">
      ${grid}
      ${axes}
      <polygon points="${polygonPoints}" style="fill:var(--color-sage);stroke:var(--color-brand)" fill-opacity="0.35" stroke-width="2" />
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
