<template>
  <div class="journal-page">
    <div class="xp-toast" :class="{ show: toastVisible }">⭐ <span>{{ toastText }}</span></div>

    <!-- Entry Detail Modal -->
    <div class="modal-overlay" :class="{ show: activeEntry }" @click="closeEntryModal($event)">
      <div class="entry-modal" v-if="activeEntry">
        <div class="em-header">
          <div>
            <div class="em-title">{{ activeEntry.title || 'Nhật ký không tiêu đề' }}</div>
            <div class="em-meta">{{ activeEntryPresentation.emoji }} {{ activeEntryPresentation.moodMeta.label }} · {{ formatDateTime(activeEntry.created_at) }}</div>
          </div>
          <button class="em-close" @click="activeEntry = null">✕</button>
        </div>
        <div class="em-body">
          <div class="em-content">{{ activeEntry.content || '' }}</div>
          <div class="em-ai-section" style="display:block;">
            <div class="em-ai-title">🐱 Phân tích của PeaceCat</div>
            <div class="em-ai-text">{{ activeEntryInsight }}</div>
          </div>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <span>📝 Nhật ký cảm xúc</span>
      </div>

      <div class="page-header">
        <div>
          <div class="page-title">📝 Nhật Ký Cảm Xúc</div>
          <div class="page-subtitle">Không gian riêng tư — mã hóa AES-256 — chỉ bạn mới có thể đọc</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-outline" @click="showHistory">📚 Xem lại</button>
          <button class="btn-primary" @click="showEditor">✏️ Viết mới</button>
        </div>
      </div>

      <div class="view-tabs">
        <div class="view-tab" :class="{ active: view === 'editor' }" @click="showEditor">✏️ Viết nhật ký</div>
        <div class="view-tab" :class="{ active: view === 'history' }" @click="showHistory">📚 Thư viện</div>
      </div>

      <div class="journal-layout">
        <!-- LEFT COLUMN -->
        <div>
          <!-- EDITOR VIEW -->
          <div v-show="view === 'editor'">
            <div class="paper-card editor-card">
              <div class="editor-top-bar">
                <div class="etb-left">
                  <div class="etb-date">{{ editorDateLabel }}</div>
                  <div style="font-size:0.72rem;color:var(--text-secondary);">Cảm xúc hôm nay:</div>
                  <div class="etb-mood">
                    <div
                      v-for="mood in MOOD_LIST"
                      :key="mood"
                      class="mood-btn"
                      :class="{ selected: selectedMood === mood }"
                      :title="MOOD_META[mood].label"
                      @click="selectMood(mood)"
                    >{{ mood }}</div>
                  </div>
                </div>
                <div class="etb-right">
                  <div class="privacy-toggle" @click="togglePrivacy">
                    <span class="privacy-icon">{{ isPrivate ? '🔒' : '🔓' }}</span>
                    <span>{{ isPrivate ? 'Riêng tư' : 'Công khai' }}</span>
                  </div>
                </div>
              </div>

              <div class="prompt-bar">
                <span class="pb-label">💡 Gợi ý:</span>
                <span class="pb-prompt">{{ JOURNAL_PROMPTS[currentPromptIndex] }}</span>
                <button class="pb-refresh" title="Gợi ý khác" @click="refreshPrompt">🔄</button>
              </div>

              <div class="editor-toolbar">
                <button class="tb-btn" title="Đậm" @click="formatText('bold')"><strong>B</strong></button>
                <button class="tb-btn" title="Nghiêng" @click="formatText('italic')"><em>I</em></button>
                <button class="tb-btn" title="Gạch chân" @click="formatText('underline')"><u>U</u></button>
                <div class="tb-sep"></div>
                <button class="tb-btn" title="Emoji vui" @click="insertEmoji('😊')">😊</button>
                <button class="tb-btn" title="Suy nghĩ" @click="insertEmoji('💭')">💭</button>
                <button class="tb-btn" title="Tăng trưởng" @click="insertEmoji('🌱')">🌱</button>
                <button class="tb-btn" title="Yêu thương" @click="insertEmoji('❤️')">❤️</button>
                <button class="tb-btn" title="Tuyệt vời" @click="insertEmoji('✨')">✨</button>
                <div class="tb-sep"></div>
                <button class="tb-btn" title="Giấy kẻ dòng" @click="linedPaper = !linedPaper">📄</button>
                <button class="tb-btn" title="Chữ lớn hơn" @click="increaseFontSize">A+</button>
                <button class="tb-btn" title="Chữ nhỏ hơn" @click="decreaseFontSize">A-</button>
              </div>

              <div class="writing-area-wrap" :class="{ 'lined-paper': linedPaper }">
                <input type="text" class="journal-title-input" v-model="title" placeholder="Tiêu đề bài viết... (tùy chọn)">
                <textarea
                  ref="textareaEl"
                  class="journal-textarea"
                  v-model="content"
                  :style="{ fontSize: fontSize + 'px' }"
                  placeholder="Bắt đầu viết... Đây là không gian hoàn toàn của bạn. Không có gì là đúng hay sai. Hãy để cảm xúc chảy tự nhiên qua những con chữ... 🌿"
                  rows="12"
                ></textarea>
              </div>

              <div class="editor-bottom">
                <div class="eb-meta">
                  <span class="eb-wordcount">{{ wordCount }} từ · {{ content.length }} ký tự</span>
                  <div class="eb-tags">
                    <span style="font-size:0.68rem;color:var(--text-light);">Tags:</span>
                    <div
                      v-for="tag in TAG_LIST"
                      :key="tag"
                      class="tag-chip"
                      :class="{ selected: selectedTags.has(tag) }"
                      @click="toggleTag(tag)"
                    >{{ tag }}</div>
                  </div>
                </div>
                <div class="eb-actions">
                  <button class="btn-outline" @click="clearEditor">🗑️ Xóa</button>
                  <button class="btn-primary" @click="saveEntry">💾 Lưu nhật ký (+15 XP)</button>
                </div>
              </div>
            </div>

            <!-- AI Analysis Card -->
            <div class="paper-card ai-analysis-card" :class="{ show: analysis }">
              <div class="aac-header">
                <span class="aac-mascot">🐱</span>
                <div>
                  <div class="aac-title">PeaceCat đang phân tích cảm xúc của bạn...</div>
                  <div style="font-size:0.72rem;color:var(--text-secondary);">Phân tích NLP realtime — hoàn toàn riêng tư</div>
                </div>
              </div>
              <template v-if="analysis">
                <div class="aac-sentiment">
                  <div class="sent-bar">
                    <div class="sb-label">Tích cực</div>
                    <div class="sb-track"><div class="sb-fill" :style="{ width: analysis.normalized + '%', background: 'var(--mint-dark)' }"></div></div>
                  </div>
                  <div class="sent-bar">
                    <div class="sb-label">Căng thẳng</div>
                    <div class="sb-track"><div class="sb-fill" :style="{ width: analysis.stress + '%', background: 'var(--coral)' }"></div></div>
                  </div>
                  <div class="sent-bar">
                    <div class="sb-label">Rõ ràng</div>
                    <div class="sb-track"><div class="sb-fill" :style="{ width: analysis.clarity + '%', background: 'var(--sky)' }"></div></div>
                  </div>
                </div>
                <div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">🏷️ Từ khóa cảm xúc phát hiện:</div>
                <div class="aac-keywords">
                  <span v-if="!analysis.keywords.length" class="keyword-tag">đang lắng nghe</span>
                  <span v-for="kw in analysis.keywords" :key="kw" class="keyword-tag">{{ kw }}</span>
                </div>
                <div class="aac-insight">{{ analysis.insightText }}</div>
                <div class="aac-suggestion" :style="{ display: analysis.recommendedTasks.length ? 'block' : 'none' }">
                  <div class="as-title">💡 PeaceCat gợi ý bài tập phù hợp:</div>
                  <div class="as-tasks">
                    <a
                      v-for="task in analysis.recommendedTasks"
                      :key="task.id"
                      href="#"
                      class="tag-chip"
                      style="text-decoration:none;"
                      @click.prevent="goToTask(task)"
                    >{{ task.title }}</a>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- HISTORY VIEW -->
          <div v-show="view === 'history'">
            <div class="history-filters">
              <button v-for="f in FILTERS" :key="f.id" class="hf-btn" :class="{ active: activeFilter === f.id }" @click="filterEntries(f.id)">{{ f.label }}</button>
            </div>
            <div class="search-bar">
              <input type="text" class="search-input" placeholder="🔍 Tìm kiếm trong nhật ký..." :value="searchQuery" @input="searchQuery = $event.target.value">
            </div>
            <div class="entry-list">
              <div v-if="!filteredEntries.length" style="padding:32px;text-align:center;color:var(--text-secondary);">Chưa có bài nhật ký phù hợp với bộ lọc hiện tại.</div>
              <div
                v-for="entry in filteredEntries"
                :key="entry.id"
                class="entry-card paper-card"
                :class="getEntryPresentation(entry).moodMeta.className"
                @click="viewEntry(entry.id)"
              >
                <div class="ec-header">
                  <div>
                    <div class="ec-title">{{ entry.title || 'Nhật ký không tiêu đề' }}</div>
                    <div class="ec-date">{{ formatDateTime(entry.created_at) }}</div>
                  </div>
                  <div class="ec-mood-emoji">{{ getEntryPresentation(entry).emoji }}</div>
                </div>
                <div class="ec-meta-row">
                  <span class="ec-sentiment" :class="getEntryPresentation(entry).sentiment">{{ getEntryPresentation(entry).sentimentLabel }}</span>
                  <span class="ec-wordcount">{{ getEntryPresentation(entry).wordCount }} từ</span>
                </div>
                <div class="ec-preview">{{ getEntryPresentation(entry).preview }}{{ getEntryPresentation(entry).preview.length >= 180 ? '…' : '' }}</div>
                <div class="ec-tags-row">
                  <span v-for="tag in normalizeArray(entry.tags).slice(0, 4)" :key="tag" class="ec-tag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div>
          <div class="paper-card mini-calendar">
            <div class="mc-header">
              <button class="mc-nav" @click="changeMiniMonth(-1)">‹</button>
              <div class="mc-month">{{ calendarMonthLabel }}</div>
              <button class="mc-nav" @click="changeMiniMonth(1)">›</button>
            </div>
            <div class="mc-grid">
              <div v-for="d in ['T2','T3','T4','T5','T6','T7','CN']" :key="d" class="mc-day-h">{{ d }}</div>
              <div v-for="n in calendarLeadingBlanks" :key="`b${n}`" class="mc-day empty"></div>
              <div
                v-for="cell in calendarCells"
                :key="cell.day"
                class="mc-day"
                :class="{ 'has-entry': cell.hasEntry, today: cell.isToday }"
              >{{ cell.day }}</div>
            </div>
            <div style="font-size:0.68rem;color:var(--text-light);margin-top:6px;text-align:center;">● Có bài viết</div>
          </div>

          <div class="paper-card stats-card">
            <div class="sc-title">📊 Thống kê nhật ký</div>
            <div class="stats-grid">
              <div class="stat-item"><div class="si-num">{{ stats.totalEntries }}</div><div class="si-label">Bài viết</div></div>
              <div class="stat-item"><div class="si-num">{{ stats.streak }} 🔥</div><div class="si-label">Streak viết</div></div>
              <div class="stat-item"><div class="si-num">{{ stats.totalWords.toLocaleString('vi-VN') }}</div><div class="si-label">Tổng từ</div></div>
              <div class="stat-item"><div class="si-num">{{ stats.positiveRate }}%</div><div class="si-label">Tích cực</div></div>
            </div>
          </div>

          <div class="paper-card mood-trend-card">
            <div class="mt-title">📈 Tâm trạng 7 ngày</div>
            <div class="mood-trend-chart">
              <div v-if="!moodTrendPoints.length" style="font-size:0.72rem;color:var(--text-light);">Chưa có đủ dữ liệu mood 7 ngày.</div>
              <div
                v-for="(point, idx) in moodTrendPoints"
                :key="idx"
                class="mtc-bar"
                :title="`${point.label}: ${point.value || '--'}/10`"
                :style="{ height: Math.max(6, (point.value ?? 0) * 6) + 'px', background: (point.value ?? 0) >= 7 ? 'var(--mint-dark)' : (point.value ?? 0) >= 5 ? 'var(--gold)' : 'var(--coral)' }"
              ></div>
            </div>
            <div class="mood-days">
              <div v-for="(point, idx) in moodTrendPoints" :key="idx" class="md-label">{{ point.label }}</div>
            </div>
          </div>

          <div class="paper-card prompts-card">
            <div class="pc-title">💡 Gợi ý viết hôm nay</div>
            <div class="prompt-list">
              <div v-for="(prompt, idx) in JOURNAL_PROMPTS.slice(0, 5)" :key="idx" class="prompt-item" @click="usePrompt(idx)">{{ prompt }}</div>
            </div>
          </div>

          <div class="paper-card" style="padding:14px;margin-bottom:14px;">
            <div style="display:flex;gap:8px;align-items:flex-start;">
              <span style="font-size:1.2rem;">🐱</span>
              <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">Viết nhật ký đều đặn giúp giảm lo âu 25% và tăng khả năng xử lý cảm xúc. Chỉ cần 10 phút mỗi ngày! 💚</div>
            </div>
          </div>

          <div class="paper-card" style="padding:14px;">
            <div style="font-size:0.72rem;color:var(--text-secondary);line-height:1.6;">
              🔒 <strong>Bảo mật tuyệt đối:</strong> Nhật ký của bạn được mã hóa AES-256. Ngay cả đội ngũ PeaceFlow cũng không thể đọc. Bạn có thể xóa toàn bộ bất kỳ lúc nào.
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';

const JOURNAL_PROMPTS = [
  'Hôm nay điều gì khiến bạn thấy mình đã cố gắng đủ tốt?',
  'Có cảm xúc nào đang ở lại rất lâu trong bạn hôm nay không?',
  'Nếu phải gọi tên năng lượng của hôm nay bằng một câu, bạn sẽ viết gì?',
  'Điều gì đang làm bạn nhẹ hơn một chút so với hôm qua?',
  'Có điều gì bạn muốn tha thứ cho chính mình hôm nay không?',
  'Một khoảnh khắc nhỏ nhưng đáng nhớ trong ngày là gì?',
  'Nếu mai thức dậy nhẹ lòng hơn, bạn nghĩ điều gì đã thay đổi?',
  'Bạn đang thật sự cần nghỉ, cần giúp đỡ, hay cần rõ ràng hơn?'
];

const MOOD_META = {
  '😊': { label: 'Vui vẻ', category: 'happy', score: 8, className: 'mood-happy' },
  '😌': { label: 'Thoải mái', category: 'calm', score: 7, className: 'mood-calm' },
  '😐': { label: 'Bình thường', category: 'neutral', score: 5, className: 'mood-neutral' },
  '😟': { label: 'Lo lắng', category: 'anxious', score: 3, className: 'mood-anxious' },
  '😢': { label: 'Buồn', category: 'sad', score: 2, className: 'mood-sad' },
  '😡': { label: 'Tức giận', category: 'angry', score: 2, className: 'mood-anxious' }
};
const MOOD_LIST = Object.keys(MOOD_META);
const TAG_LIST = ['#cảmxúc', '#biếtơn', '#suyngẫm', '#mụctiêu', '#tứcgiận', '#hạnhphúc'];
const FILTERS = [
  { id: 'all', label: '📚 Tất cả' },
  { id: 'happy', label: '😊 Vui vẻ' },
  { id: 'calm', label: '😌 Thoải mái' },
  { id: 'sad', label: '😢 Buồn' },
  { id: 'anxious', label: '😟 Lo lắng' },
  { id: 'grateful', label: '🙏 Biết ơn' }
];

const router = useRouter();

const view = ref('editor');
const entries = ref([]);
const dashboard = ref(null);
const selectedMood = ref(null);
const selectedTags = reactive(new Set());
const isPrivate = ref(true);
const activeFilter = ref('all');
const searchQuery = ref('');
const currentPromptIndex = ref(0);
const calendarMonth = ref(new Date());
const fontSize = ref(16);
const linedPaper = ref(false);
const title = ref('');
const content = ref('');
const textareaEl = ref(null);
const activeEntry = ref(null);
const toastVisible = ref(false);
const toastText = ref('+15 XP đã được cộng!');

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }
  return [];
}
function countWords(text) {
  const c = String(text || '').trim();
  return c ? c.split(/\s+/).length : 0;
}
function formatDateTime(value) {
  return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}
function deriveMoodEmoji(entry) {
  const tags = normalizeArray(entry.tags);
  const emojiTag = tags.find((tag) => Object.prototype.hasOwnProperty.call(MOOD_META, tag));
  if (emojiTag) return emojiTag;

  if (typeof entry.mood_before === 'number') {
    if (entry.mood_before >= 8) return '😊';
    if (entry.mood_before >= 6) return '😌';
    if (entry.mood_before >= 4) return '😐';
    if (entry.mood_before >= 3) return '😟';
    return '😢';
  }

  const sentiment = Number(entry.sentiment_score || 0);
  if (sentiment >= 1.5) return '😊';
  if (sentiment >= 0.5) return '😌';
  if (sentiment <= -1.5) return '😢';
  if (sentiment <= -0.5) return '😟';
  return '😐';
}
function getEntryPresentation(entry) {
  const emoji = deriveMoodEmoji(entry);
  const moodMeta = MOOD_META[emoji] || MOOD_META['😐'];
  const sentimentScore = Number(entry.sentiment_score || 0);
  const sentiment = sentimentScore > 0.5 ? 'positive' : sentimentScore < -0.5 ? 'negative' : 'neutral';
  const sentimentLabel = sentiment === 'positive' ? 'Tích cực' : sentiment === 'negative' ? 'Nặng lòng' : 'Trung tính';
  return {
    emoji,
    moodMeta,
    sentiment,
    sentimentLabel,
    wordCount: countWords(entry.content),
    preview: String(entry.content || '').trim().slice(0, 180)
  };
}

const editorDateLabel = computed(() => `📅 ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`);
const wordCount = computed(() => countWords(content.value));

function selectMood(mood) {
  selectedMood.value = mood;
}
function toggleTag(tag) {
  if (selectedTags.has(tag)) selectedTags.delete(tag);
  else selectedTags.add(tag);
}
function togglePrivacy() {
  isPrivate.value = !isPrivate.value;
}
function refreshPrompt() {
  currentPromptIndex.value = (currentPromptIndex.value + 1) % JOURNAL_PROMPTS.length;
}
function usePrompt(index) {
  const prompt = JOURNAL_PROMPTS[index];
  if (!prompt) return;
  content.value = content.value.trim() ? `${content.value.trim()}\n\n${prompt}\n` : `${prompt}\n\n`;
  nextTick(() => textareaEl.value?.focus());
}
function formatText(command) {
  const el = textareaEl.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selectedText = content.value.slice(start, end);
  let wrapper = '**';
  if (command === 'italic') wrapper = '_';
  if (command === 'underline') wrapper = '__';
  const replacement = `${wrapper}${selectedText}${wrapper}`;
  content.value = content.value.slice(0, start) + replacement + content.value.slice(end);
  nextTick(() => {
    const pos = start + replacement.length;
    el.focus();
    el.setSelectionRange(pos, pos);
  });
}
function insertEmoji(emoji) {
  const el = textareaEl.value;
  if (!el) return;
  const pos = el.selectionStart;
  content.value = content.value.slice(0, pos) + emoji + content.value.slice(pos);
  nextTick(() => {
    const next = pos + emoji.length;
    el.focus();
    el.setSelectionRange(next, next);
  });
}
function increaseFontSize() {
  fontSize.value = Math.min(24, fontSize.value + 1);
}
function decreaseFontSize() {
  fontSize.value = Math.max(12, fontSize.value - 1);
}

function analyzeSentiment(text) {
  const c = String(text || '').toLowerCase();
  const positive = ['biết ơn', 'vui', 'ổn', 'nhẹ', 'yên tâm', 'hạnh phúc', 'bình yên', 'tự hào'];
  const negative = ['lo', 'mệt', 'buồn', 'tức', 'áp lực', 'căng', 'kiệt sức', 'sợ', 'khó'];
  let score = 0;
  positive.forEach((w) => { if (c.includes(w)) score += 1; });
  negative.forEach((w) => { if (c.includes(w)) score -= 1; });
  return Math.max(-5, Math.min(5, score));
}
function extractKeywords(text) {
  const words = String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s#]/gu, ' ').split(/\s+/).filter((w) => w.length >= 4);
  const counts = new Map();
  words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
}

const analysis = computed(() => {
  const text = content.value;
  if (!text.trim()) return null;

  const score = analyzeSentiment(text);
  const normalized = Math.max(0, Math.min(100, 50 + (score * 10)));
  const stress = Math.max(0, Math.min(100, 65 - (score * 12)));
  const clarity = Math.max(0, Math.min(100, 55 + (score * 8)));
  const keywords = extractKeywords(text);
  const recommendedTasks = (dashboard.value?.tasks || []).slice(0, 2);

  const insightText = score >= 2
    ? 'Bài viết đang nghiêng về phía nhẹ hơn và có nhiều tín hiệu tích cực. Bạn có vẻ đang xử lý cảm xúc theo hướng rõ ràng hơn.'
    : score <= -2
      ? 'Nội dung cho thấy bạn đang mang nhiều áp lực hoặc cảm xúc nặng. Việc viết ra lúc này rất có giá trị để giảm tải nhận thức.'
      : 'Bài viết đang ở trạng thái trung tính. Hãy tiếp tục viết sâu hơn về điều khiến bạn chưa thật sự yên tâm hoặc điều đang nâng đỡ bạn.';

  return { normalized, stress, clarity, keywords, insightText, recommendedTasks };
});

function goToTask(task) {
  router.push({ path: '/task-detail', query: { id: task.id } });
}

function calculateJournalStreak(list) {
  const uniqueDays = Array.from(new Set(list.map((e) => toIsoDate(e.created_at)))).sort().reverse();
  if (!uniqueDays.length) return 0;

  let streak = 0;
  let currentDate = new Date();
  let expected = currentDate.toISOString().slice(0, 10);

  if (uniqueDays[0] !== expected) {
    currentDate.setDate(currentDate.getDate() - 1);
    expected = currentDate.toISOString().slice(0, 10);
    if (uniqueDays[0] !== expected) return 0;
  }

  for (let index = 0; index < uniqueDays.length; index += 1) {
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() - index - (uniqueDays[0] === toIsoDate(new Date()) ? 0 : 1));
    const compareIso = compareDate.toISOString().slice(0, 10);
    if (uniqueDays[index] !== compareIso) break;
    streak += 1;
  }
  return streak;
}

const stats = computed(() => {
  const totalEntries = entries.value.length;
  const totalWords = entries.value.reduce((sum, e) => sum + countWords(e.content), 0);
  const positiveEntries = entries.value.filter((e) => Number(e.sentiment_score || 0) > 0.5).length;
  const positiveRate = totalEntries ? Math.round((positiveEntries / totalEntries) * 100) : 0;
  return { totalEntries, totalWords, positiveRate, streak: calculateJournalStreak(entries.value) };
});

const moodTrendPoints = computed(() => dashboard.value?.mood_chart?.['7d']?.points || []);

const calendarMonthLabel = computed(() => calendarMonth.value.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }));
const calendarLeadingBlanks = computed(() => (calendarMonth.value.getDay() + 6) % 7);
const calendarCells = computed(() => {
  const month = calendarMonth.value.getMonth();
  const year = calendarMonth.value.getFullYear();
  const entryDays = new Set(
    entries.value
      .filter((e) => new Date(e.created_at).getMonth() === month && new Date(e.created_at).getFullYear() === year)
      .map((e) => new Date(e.created_at).getDate())
  );
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      hasEntry: entryDays.has(day),
      isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
    });
  }
  return cells;
});
function changeMiniMonth(delta) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + delta, 1);
}

function getFilterMatch(entry, filter) {
  if (filter === 'all') return true;
  if (filter === 'grateful') return normalizeArray(entry.tags).includes('#biếtơn');
  return getEntryPresentation(entry).moodMeta.category === filter;
}
const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return entries.value.filter((entry) => {
    if (!getFilterMatch(entry, activeFilter.value)) return false;
    if (!query) return true;
    const haystack = [entry.title, entry.content, ...normalizeArray(entry.tags)].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });
});
function filterEntries(filter) {
  activeFilter.value = filter;
}
function showEditor() { view.value = 'editor'; }
function showHistory() { view.value = 'history'; }

function showToast(xp) {
  toastText.value = `+${xp} XP đã được cộng!`;
  toastVisible.value = true;
  setTimeout(() => { toastVisible.value = false; }, 2500);
}
function clearEditor() {
  title.value = '';
  content.value = '';
  selectedMood.value = null;
  selectedTags.clear();
  isPrivate.value = true;
}
function viewEntry(id) {
  activeEntry.value = entries.value.find((e) => String(e.id) === String(id)) || null;
}
function closeEntryModal(event) {
  if (event.target.classList.contains('modal-overlay')) activeEntry.value = null;
}
const activeEntryPresentation = computed(() => (activeEntry.value ? getEntryPresentation(activeEntry.value) : { emoji: '', moodMeta: { label: '' } }));
const activeEntryInsight = computed(() => {
  if (!activeEntry.value) return '';
  const score = Number(activeEntry.value.sentiment_score || 0);
  return score >= 1
    ? 'Bài viết này mang sắc thái tích cực hoặc đã có dấu hiệu hồi phục cảm xúc.'
    : score <= -1
      ? 'Bài viết này cho thấy bạn đang mang áp lực khá rõ. Nếu cần, hãy kết hợp một bài task ngắn sau khi viết.'
      : 'Bài viết này phản ánh trạng thái trung tính và quan sát nội tâm ổn định.';
});

async function saveEntry() {
  if (!content.value.trim()) {
    alert('Vui lòng viết gì đó trước khi lưu.');
    return;
  }

  const moodMeta = selectedMood.value ? MOOD_META[selectedMood.value] : null;
  const sentimentScore = analyzeSentiment(content.value);
  const tags = Array.from(selectedTags);
  if (selectedMood.value) tags.unshift(selectedMood.value);

  try {
    const result = await apiClient.post('/journal', {
      title: title.value,
      content: content.value,
      mood_before: moodMeta?.score ?? null,
      sentiment_score: sentimentScore,
      tags,
      is_private: isPrivate.value
    });

    entries.value.unshift({ ...result, tags: normalizeArray(result.tags) });

    if (result.progress) {
      dashboard.value = {
        ...(dashboard.value || {}),
        progress: {
          ...(dashboard.value?.progress || {}),
          ...result.progress,
          xp: result.progress.total_xp,
          level: result.progress.current_level,
          streak: result.progress.current_streak
        }
      };
      window.dispatchEvent(new CustomEvent('peaceflow:progress-updated', {
        detail: { xp: result.progress.total_xp, level: result.progress.current_level }
      }));
    }

    showToast(result.xp_earned || 15);
    clearEditor();
    refreshPrompt();
    localStorage.setItem('peaceflow_dashboard_refresh', '1');
    window.dispatchEvent(new CustomEvent('peaceflow:journal-saved'));
  } catch (error) {
    console.error('Could not save journal entry:', error);
    alert('Không lưu được nhật ký lên server. Vui lòng thử lại.');
  }
}

onMounted(async () => {
  try {
    const [entriesData, dashboardData] = await Promise.all([
      apiClient.get('/journal'),
      apiClient.get('/dashboard')
    ]);
    entries.value = (entriesData || []).map((e) => ({ ...e, tags: normalizeArray(e.tags) }));
    dashboard.value = dashboardData || null;
    calendarMonth.value = new Date();
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
  }
});
</script>

<style scoped src="../assets/journal.css"></style>
