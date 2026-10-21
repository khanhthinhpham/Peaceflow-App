<template>
  <div class="erc">
    <div class="erc-header">
      <button type="button" class="erc-nav" @click="changeMonth(-1)">‹</button>
      <div class="erc-month">{{ monthLabel }}</div>
      <button type="button" class="erc-nav" @click="changeMonth(1)">›</button>
    </div>

    <div class="erc-grid">
      <div v-for="d in WEEKDAY_HEADER" :key="d" class="erc-day-h">{{ d }}</div>
      <div v-for="n in leadingBlanks" :key="`b${n}`" class="erc-day empty"></div>
      <button
        v-for="cell in cells"
        :key="cell.day"
        type="button"
        class="erc-day"
        :class="{ 'has-data': cell.items.length, selected: selectedDay === cell.day, today: cell.isToday }"
        @click="cell.items.length && (selectedDay = selectedDay === cell.day ? null : cell.day)"
      >
        <span class="erc-day-num">{{ cell.day }}</span>
        <span class="erc-day-dots">
          <span v-for="cat in cell.categories" :key="cat" class="erc-dot" :style="{ background: CATEGORY_META[cat].color }"></span>
        </span>
      </button>
    </div>

    <div class="erc-legend">
      <span v-for="(meta, key) in CATEGORY_META" :key="key"><span class="erc-dot" :style="{ background: meta.color }"></span> {{ meta.icon }} {{ meta.label }}</span>
    </div>

    <div v-if="selectedDayItems.length" class="erc-day-detail">
      <div class="erc-day-detail-title">{{ selectedDayLabel }}</div>

      <div v-for="item in selectedDayItems" :key="`${item.category}-${item.id}`" class="erc-item" :style="{ borderColor: CATEGORY_META[item.category].color }">
        <div class="erc-item-head">
          <span>{{ CATEGORY_META[item.category].icon }} {{ CATEGORY_META[item.category].label }}</span>
          <span class="erc-item-meta">{{ formatTime(item.date) }}</span>
        </div>

        <template v-if="item.category === 'booking'">
          <div class="erc-item-name">{{ SESSION_TYPE_LABELS[item.data.session_type] || item.data.session_type }} — {{ BOOKING_STATUS_LABELS[item.data.status] || item.data.status }}</div>
          <p v-if="item.data.notes" class="erc-item-content">{{ item.data.notes }}</p>
          <p v-else class="erc-item-content" style="color:var(--text-light);">Thân chủ chưa để lại mô tả tình trạng.</p>
          <MedicalRecordsViewer :booking-id="item.data.id" />
        </template>

        <template v-else-if="item.category === 'journal'">
          <div class="erc-item-name">{{ item.data.title || '(Không có tiêu đề)' }}</div>
          <p class="erc-item-content">{{ item.data.content }}</p>
        </template>

        <template v-else-if="item.category === 'mood'">
          <div class="erc-item-name">{{ item.data.dominant_emotion || '—' }} ({{ item.data.mood_score }}/10)</div>
          <p v-if="item.data.notes" class="erc-item-content">{{ item.data.notes }}</p>
        </template>

        <template v-else-if="item.category === 'test'">
          <div class="erc-item-name">{{ item.data.assessment_name }} — {{ item.data.severity || '—' }} ({{ item.data.total_score }})</div>
        </template>

        <template v-else-if="item.category === 'response'">
          <p class="erc-item-content">{{ item.data.content }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import MedicalRecordsViewer from './MedicalRecordsViewer.vue';

const props = defineProps({
  bookings: { type: Array, default: () => [] },
  journalEntries: { type: Array, default: () => [] },
  moodCheckins: { type: Array, default: () => [] },
  assessmentResults: { type: Array, default: () => [] },
  responses: { type: Array, default: () => [] }
});

const SESSION_TYPE_LABELS = { voice: '📞 Gọi thoại', video: '🎥 Video call' };
const BOOKING_STATUS_LABELS = {
  awaiting_expert: 'Chờ bạn nhận', confirmed: 'Đã xác nhận', completed: 'Đã hoàn thành',
  cancelled: 'Đã huỷ', expired: 'Đã hết hạn'
};

// Gộp cả 5 loại dữ liệu vào CÙNG 1 lịch — mỗi loại 1 màu/icon cố định, không đổi theo nội
// dung (khác với ExpertMoodCalendar vốn tô theo điểm tâm trạng) vì giờ 1 ô ngày có thể có
// nhiều loại khác nhau cùng lúc, cần phân biệt LOẠI chứ không phải mức độ.
const CATEGORY_META = {
  booking: { label: 'Lịch hẹn', icon: '📅', color: '#4a90aa' },
  journal: { label: 'Nhật ký', icon: '📔', color: '#8a6aaa' },
  mood: { label: 'Check-in', icon: '🌤️', color: '#e0a92d' },
  test: { label: 'Kết quả test', icon: '🩺', color: '#e05c5c' },
  response: { label: 'Phản hồi', icon: '💬', color: '#4caf7d' }
};

function formatTime(value) {
  return new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(value));
}

// Mọi mục quy về { category, date, id, data } để xếp chung vào lịch bất kể nguồn gốc khác
// bảng/API nhau.
const allItems = computed(() => [
  ...props.bookings.map((b) => ({ category: 'booking', date: b.starts_at, id: b.id, data: b })),
  ...props.journalEntries.map((j) => ({ category: 'journal', date: j.created_at, id: j.id, data: j })),
  ...props.moodCheckins.map((m) => ({ category: 'mood', date: m.created_at, id: m.id, data: m })),
  ...props.assessmentResults.map((a) => ({ category: 'test', date: a.created_at, id: a.id, data: a })),
  ...props.responses.map((r) => ({ category: 'response', date: r.created_at, id: r.id, data: r }))
]);

const WEEKDAY_HEADER = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Mặc định mở đúng tháng của mục GẦN NHẤT (không phải tháng hiện tại) — chuyên gia đang
// xem dữ liệu CŨ của thân chủ, tháng này nhiều khi trống trơn nếu mặc định theo hôm nay.
const latestItem = computed(() => [...allItems.value].sort((a, b) => new Date(b.date) - new Date(a.date))[0]);
const currentMonth = ref(latestItem.value ? new Date(latestItem.value.date) : new Date());
function changeMonth(delta) {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + delta, 1);
  selectedDay.value = null;
}

const monthLabel = computed(() => currentMonth.value.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }));
const leadingBlanks = computed(() => (new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1).getDay() + 6) % 7);

const cells = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const byDay = new Map();
  allItems.value.forEach((item) => {
    const d = new Date(item.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const day = d.getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(item);
  });

  const out = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayItems = byDay.get(day) || [];
    out.push({
      day,
      items: dayItems,
      categories: [...new Set(dayItems.map((i) => i.category))],
      isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
    });
  }
  return out;
});

const selectedDay = ref(null);
const selectedDayLabel = computed(() => selectedDay.value ? `Ngày ${selectedDay.value}/${currentMonth.value.getMonth() + 1}/${currentMonth.value.getFullYear()}` : '');
const selectedDayItems = computed(() => {
  if (!selectedDay.value) return [];
  const cell = cells.value.find((c) => c.day === selectedDay.value);
  return cell ? [...cell.items].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
});
</script>

<style scoped>
.erc {
    margin-bottom: 18px;
}
.erc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}
.erc-nav {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    color: var(--text-secondary);
    padding: 4px 10px;
}
.erc-month {
    font-weight: 700;
    font-size: 0.9rem;
}
.erc-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}
.erc-day-h {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-light);
    text-align: center;
    padding: 2px 0;
}
.erc-day {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    border: none;
    background: var(--cream, #fff8f0);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 0.78rem;
    font-family: inherit;
    cursor: default;
}
.erc-day.empty {
    background: none;
}
.erc-day.has-data {
    cursor: pointer;
    font-weight: 700;
    background: var(--warm-white, #fffdf7);
    border: 1.5px solid var(--kraft-light, #e8cba7);
}
.erc-day.today {
    box-shadow: inset 0 0 0 2px var(--text-primary);
}
.erc-day.selected {
    box-shadow: inset 0 0 0 2px var(--mint-dark);
    background: var(--mint-light);
}
.erc-day-dots {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 90%;
}
.erc-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
}
.erc-legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 10px;
    font-size: 0.7rem;
    color: var(--text-secondary);
}
.erc-legend .erc-dot {
    width: 7px;
    height: 7px;
    margin-right: 3px;
}
.erc-day-detail {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1.5px dashed var(--kraft-light, #e8cba7);
}
.erc-day-detail-title {
    font-weight: 800;
    font-size: 0.88rem;
    margin-bottom: 10px;
}
.erc-item {
    border: 1.5px solid;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 10px;
}
.erc-item-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    font-size: 0.82rem;
    margin-bottom: 4px;
}
.erc-item-meta {
    font-size: 0.78rem;
    color: var(--text-light);
    font-weight: 400;
}
.erc-item-name {
    font-weight: 800;
    font-size: 0.88rem;
}
.erc-item-content {
    font-size: 0.86rem;
    color: var(--text-secondary);
    margin: 4px 0 0;
    white-space: pre-wrap;
}
</style>
