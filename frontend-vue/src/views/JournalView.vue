<template>
  <div class="journal-page">
    <div class="xp-toast" :class="{ show: toastVisible }"><span>{{ toastText }}</span></div>

    <!-- Entry Detail Modal -->
    <div class="modal-overlay" :class="{ show: activeEntry }" @click="closeEntryModal($event)">
      <div class="entry-modal" v-if="activeEntry">
        <div class="em-header">
          <div>
            <div class="em-title">{{ activeEntry.title || t('journal.untitled') }}</div>
            <div class="em-meta">{{ activeEntryPresentation.emoji }} {{ activeEntryPresentation.moodMeta.labelKey ? t(activeEntryPresentation.moodMeta.labelKey) : '' }} · {{ formatDateTime(activeEntry.created_at) }}</div>
          </div>
          <button class="em-close" @click="activeEntry = null">✕</button>
        </div>
        <div class="em-body">
          <div class="em-content">{{ activeEntry.content || '' }}</div>
          <div class="em-ai-section" style="display:block;">
            <div class="em-ai-title">{{ t('journal.modal.aiAnalysisTitle') }}</div>
            <div class="em-ai-text">{{ activeEntryInsight }}</div>
          </div>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="view-tabs">
        <div class="view-tab" :class="{ active: view === 'editor' }" @click="showEditor">{{ t('journal.tabEditor') }}</div>
        <div class="view-tab" :class="{ active: view === 'history' }" @click="showHistory">{{ t('journal.tabHistory') }}</div>
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
                  <div style="font-size:0.72rem;color:var(--text-secondary);">{{ t('journal.editor.todayMoodLabel') }}</div>
                  <div class="etb-mood">
                    <div
                      v-for="mood in MOOD_LIST"
                      :key="mood"
                      class="mood-btn"
                      :class="{ selected: selectedMood === mood }"
                      :title="t(MOOD_META[mood].labelKey)"
                      @click="selectMood(mood)"
                    >{{ mood }}</div>
                  </div>
                </div>
                <div class="etb-right">
                  <div class="privacy-toggle" @click="togglePrivacy">
                    <span>{{ isPrivate ? t('journal.editor.private') : t('journal.editor.public') }}</span>
                  </div>
                </div>
              </div>

              <div class="prompt-bar">
                <span class="pb-label">{{ t('journal.editor.promptLabel') }}</span>
                <span class="pb-prompt">{{ currentPrompt }}</span>
                <button class="pb-refresh" :title="t('journal.editor.refreshPromptTitle')" @click="refreshPrompt">🔄</button>
              </div>

              <div class="editor-toolbar">
                <button class="tb-btn" :title="t('journal.editor.bold')" @click="formatText('bold')"><strong>B</strong></button>
                <button class="tb-btn" :title="t('journal.editor.italic')" @click="formatText('italic')"><em>I</em></button>
                <button class="tb-btn" :title="t('journal.editor.underline')" @click="formatText('underline')"><u>U</u></button>
                <div class="tb-sep"></div>
                <button class="tb-btn" :title="t('journal.editor.emojiFun')" @click="insertEmoji('😊')">😊</button>
                <button class="tb-btn" :title="t('journal.editor.emojiThought')" @click="insertEmoji('💭')">💭</button>
                <button class="tb-btn" :title="t('journal.editor.emojiGrowth')" @click="insertEmoji('🌱')">🌱</button>
                <button class="tb-btn" :title="t('journal.editor.emojiLove')" @click="insertEmoji('❤️')">❤️</button>
                <button class="tb-btn" :title="t('journal.editor.emojiAmazing')" @click="insertEmoji('✨')">✨</button>
                <div class="tb-sep"></div>
                <button class="tb-btn" :title="t('journal.editor.linedPaper')" @click="linedPaper = !linedPaper">📄</button>
                <button class="tb-btn" :title="t('journal.editor.fontBigger')" @click="increaseFontSize">A+</button>
                <button class="tb-btn" :title="t('journal.editor.fontSmaller')" @click="decreaseFontSize">A-</button>
              </div>

              <div class="writing-area-wrap" :class="{ 'lined-paper': linedPaper }">
                <input type="text" class="journal-title-input" v-model="title" :placeholder="t('journal.editor.titlePlaceholder')">
                <textarea
                  ref="textareaEl"
                  class="journal-textarea"
                  v-model="content"
                  :style="{ fontSize: fontSize + 'px' }"
                  :placeholder="t('journal.editor.contentPlaceholder')"
                  rows="12"
                ></textarea>
              </div>

              <div class="editor-bottom">
                <div class="eb-meta">
                  <span class="eb-wordcount">{{ t('journal.editor.wordCountLabel', { n: wordCount, m: content.length }) }}</span>
                  <div class="eb-tags">
                    <span style="font-size:0.68rem;color:var(--text-light);">{{ t('journal.editor.tagsLabel') }}</span>
                    <div
                      v-for="tag in TAG_LIST"
                      :key="tag.id"
                      class="tag-chip"
                      :class="{ selected: selectedTags.has(tag.id) }"
                      @click="toggleTag(tag.id)"
                    >{{ t(tag.labelKey) }}</div>
                  </div>
                </div>
                <div class="eb-actions">
                  <button class="btn-outline" @click="clearEditor">{{ t('journal.editor.clearBtn') }}</button>
                  <button class="btn-primary" @click="saveEntry">{{ t('journal.editor.saveBtn') }}</button>
                </div>
              </div>
            </div>

            <!-- AI Analysis Card -->
            <div class="paper-card ai-analysis-card" :class="{ show: analysis }">
              <div class="aac-header">
                <div>
                  <div class="aac-title">{{ t('journal.ai.analyzingTitle') }}</div>
                  <div style="font-size:0.72rem;color:var(--text-secondary);">{{ t('journal.ai.analyzingSub') }}</div>
                </div>
              </div>
              <template v-if="analysis">
                <div class="aac-sentiment">
                  <div class="sent-bar">
                    <div class="sb-label">{{ t('journal.ai.positive') }}</div>
                    <div class="sb-track"><div class="sb-fill" :style="{ width: analysis.normalized + '%', background: 'var(--mint-dark)' }"></div></div>
                  </div>
                  <div class="sent-bar">
                    <div class="sb-label">{{ t('journal.ai.stress') }}</div>
                    <div class="sb-track"><div class="sb-fill" :style="{ width: analysis.stress + '%', background: 'var(--coral)' }"></div></div>
                  </div>
                  <div class="sent-bar">
                    <div class="sb-label">{{ t('journal.ai.clarity') }}</div>
                    <div class="sb-track"><div class="sb-fill" :style="{ width: analysis.clarity + '%', background: 'var(--sky)' }"></div></div>
                  </div>
                </div>
                <div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">{{ t('journal.ai.keywordsLabel') }}</div>
                <div class="aac-keywords">
                  <span v-if="!analysis.keywords.length" class="keyword-tag">{{ t('journal.ai.listening') }}</span>
                  <span v-for="kw in analysis.keywords" :key="kw" class="keyword-tag">{{ kw }}</span>
                </div>
                <div class="aac-insight">{{ analysis.insightText }}</div>
                <div class="aac-suggestion" :style="{ display: analysis.recommendedTasks.length ? 'block' : 'none' }">
                  <div class="as-title">{{ t('journal.ai.suggestionTitle') }}</div>
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
              <button v-for="f in FILTERS" :key="f.id" class="hf-btn" :class="{ active: activeFilter === f.id }" @click="filterEntries(f.id)">{{ t(f.labelKey) }}</button>
            </div>
            <div class="search-bar">
              <input type="text" class="search-input" :placeholder="t('journal.history.searchPlaceholder')" :value="searchQuery" @input="searchQuery = $event.target.value">
            </div>
            <div class="entry-list">
              <div v-if="!filteredEntries.length" style="padding:32px;text-align:center;color:var(--text-secondary);">{{ t('journal.history.noEntries') }}</div>
              <div
                v-for="entry in filteredEntries"
                :key="entry.id"
                class="entry-card paper-card"
                :class="getEntryPresentation(entry).moodMeta.className"
                @click="viewEntry(entry.id)"
              >
                <div class="ec-header">
                  <div>
                    <div class="ec-title">{{ entry.title || t('journal.untitled') }}</div>
                    <div class="ec-date">{{ formatDateTime(entry.created_at) }}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <button
                      type="button"
                      class="ec-share-btn"
                      :class="{ 'is-shared': entry.shared_with_experts }"
                      :title="entry.shared_with_experts ? t('journal.shareWithExperts.onTitle') : t('journal.shareWithExperts.offTitle')"
                      @click.stop="toggleEntryShare(entry)"
                    >🩺</button>
                    <div class="ec-mood-emoji">{{ getEntryPresentation(entry).emoji }}</div>
                  </div>
                </div>
                <div class="ec-meta-row">
                  <span class="ec-sentiment" :class="getEntryPresentation(entry).sentiment">{{ getEntryPresentation(entry).sentimentLabel }}</span>
                  <span class="ec-wordcount">{{ getEntryPresentation(entry).wordCount }} {{ t('journal.history.wordsUnit') }}</span>
                </div>
                <div class="ec-preview">{{ getEntryPresentation(entry).preview }}{{ getEntryPresentation(entry).preview.length >= 180 ? '…' : '' }}</div>
                <div class="ec-tags-row">
                  <span v-for="tag in normalizeArray(entry.tags).slice(0, 4)" :key="tag" class="ec-tag">{{ tagDisplayLabel(tag) }}</span>
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
              <div v-for="d in weekdayHeader" :key="d" class="mc-day-h">{{ d }}</div>
              <div v-for="n in calendarLeadingBlanks" :key="`b${n}`" class="mc-day empty"></div>
              <div
                v-for="cell in calendarCells"
                :key="cell.day"
                class="mc-day"
                :class="{ 'has-entry': cell.hasEntry, today: cell.isToday }"
              >{{ cell.day }}</div>
            </div>
            <div style="font-size:0.68rem;color:var(--text-light);margin-top:6px;text-align:center;">{{ t('journal.sidebar.calendarLegend') }}</div>
          </div>

          <div class="paper-card stats-card">
            <div class="sc-title">{{ t('journal.sidebar.statsTitle') }}</div>
            <div class="stats-grid">
              <div class="stat-item"><div class="si-num">{{ stats.totalEntries }}</div><div class="si-label">{{ t('journal.sidebar.statEntries') }}</div></div>
              <div class="stat-item"><div class="si-num">{{ stats.streak }}</div><div class="si-label">{{ t('journal.sidebar.statStreak') }}</div></div>
              <div class="stat-item"><div class="si-num">{{ stats.totalWords.toLocaleString(intlLocale) }}</div><div class="si-label">{{ t('journal.sidebar.statTotalWords') }}</div></div>
              <div class="stat-item"><div class="si-num">{{ stats.positiveRate }}%</div><div class="si-label">{{ t('journal.sidebar.statPositive') }}</div></div>
            </div>
          </div>

          <div class="paper-card mood-trend-card">
            <div class="mt-title">{{ t('journal.sidebar.moodTrendTitle') }}</div>
            <div class="mood-trend-chart">
              <div v-if="!moodTrendPoints.length" style="font-size:0.72rem;color:var(--text-light);">{{ t('journal.sidebar.noMoodData') }}</div>
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
            <div class="pc-title">{{ t('journal.sidebar.promptsTitle') }}</div>
            <div class="prompt-list">
              <div v-for="(prompt, idx) in journalPrompts.slice(0, 5)" :key="idx" class="prompt-item" @click="usePrompt(idx)">{{ prompt }}</div>
            </div>
          </div>

          <div class="paper-card" style="padding:14px;margin-bottom:14px;">
            <div style="display:flex;gap:8px;align-items:flex-start;">
              <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">{{ t('journal.sidebar.tipText') }}</div>
            </div>
          </div>

          <div class="paper-card" style="padding:14px;">
            <div style="font-size:0.72rem;color:var(--text-secondary);line-height:1.6;">
              <strong>{{ t('journal.sidebar.securityTitle') }}</strong> {{ t('journal.sidebar.securityText') }}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const { t, tm, locale } = useI18n();
const auth = useAuthStore();

// Locale cho Intl/toLocaleString — 'vi' -> 'vi-VN', 'en' -> 'en-US'. Cùng mẫu đã dùng ở
// DashboardView.vue — trước đây hardcode 'vi-VN' ở formatDateTime/editorDateLabel/
// calendarMonthLabel/toLocaleString nên đổi ngôn ngữ app không đổi được ngày giờ/số.
const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'vi-VN'));

// `id` ỔN ĐỊNH dùng để so khớp/lưu trữ; `labelKey` chỉ dùng để HIỂN THỊ. Emoji tự nó đã là
// khoá lưu trữ (mood_before tính từ score, tags lưu thẳng emoji) nên không đổi theo ngôn
// ngữ — chỉ cần dịch phần label hiển thị (tooltip, chữ trong modal).
const MOOD_META = {
  '😊': { labelKey: 'journal.moods.happy', category: 'happy', score: 8, className: 'mood-happy' },
  '😌': { labelKey: 'journal.moods.calm', category: 'calm', score: 7, className: 'mood-calm' },
  '😐': { labelKey: 'journal.moods.neutral', category: 'neutral', score: 5, className: 'mood-neutral' },
  '😟': { labelKey: 'journal.moods.anxious', category: 'anxious', score: 3, className: 'mood-anxious' },
  '😢': { labelKey: 'journal.moods.sad', category: 'sad', score: 2, className: 'mood-sad' },
  '😡': { labelKey: 'journal.moods.angry', category: 'angry', score: 2, className: 'mood-anxious' }
};
const MOOD_LIST = Object.keys(MOOD_META);

// `id` giữ NGUYÊN VĂN hashtag tiếng Việt cũ ('#biếtơn'...) — đây là giá trị THẬT lưu vào
// entry.tags và backend, và getFilterMatch() bên dưới so khớp cứng '#biếtơn' cho bộ lọc
// "Biết ơn". Đổi id theo ngôn ngữ sẽ làm gãy bộ lọc + dữ liệu cũ đã lưu. labelKey chỉ dùng
// để HIỂN THỊ (xem tagDisplayLabel()).
const TAG_LIST = [
  { id: '#cảmxúc', labelKey: 'journal.tags.emotion' },
  { id: '#biếtơn', labelKey: 'journal.tags.grateful' },
  { id: '#suyngẫm', labelKey: 'journal.tags.reflection' },
  { id: '#mụctiêu', labelKey: 'journal.tags.goal' },
  { id: '#tứcgiận', labelKey: 'journal.tags.anger' },
  { id: '#hạnhphúc', labelKey: 'journal.tags.happiness' }
];
// Tra ngược id -> nhãn đã dịch để hiển thị tag của các bài viết CŨ (entry.tags từ backend
// luôn là id gốc) — không tìm thấy (tag tự do người dùng gõ thêm ở phiên bản cũ, nếu có)
// thì hiện nguyên văn thay vì mất trắng.
function tagDisplayLabel(tagId) {
  const found = TAG_LIST.find((tag) => tag.id === tagId);
  return found ? t(found.labelKey) : tagId;
}

const FILTERS = [
  { id: 'all', labelKey: 'journal.filters.all' },
  { id: 'happy', labelKey: 'journal.filters.happy' },
  { id: 'calm', labelKey: 'journal.filters.calm' },
  { id: 'sad', labelKey: 'journal.filters.sad' },
  { id: 'anxious', labelKey: 'journal.filters.anxious' },
  { id: 'grateful', labelKey: 'journal.filters.grateful' }
];

// Gợi ý viết — lấy từ file dịch (journal.prompts, mảng 8 câu) qua tm() thay vì giữ bản
// cứng ở đây, giống mẫu landing.slogans bên IndexView.vue.
const journalPrompts = computed(() => tm('journal.prompts'));
const currentPrompt = computed(() => journalPrompts.value[currentPromptIndex.value] || '');

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
// State + computed thay vì gán ref.value = t('...') một lần — cùng lỗi reactive đã gặp và
// sửa ở demoSaveLabel (IndexView.vue) / resultPhase (MoodCheckinView.vue): đổi ngôn ngữ lúc
// toast đang hiện sẽ không tự cập nhật nếu chỉ gán chuỗi tĩnh.
const toastXp = ref(15);
const toastText = computed(() => t('journal.toast.xpEarned', { n: toastXp.value }));

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
  return new Date(value).toLocaleString(intlLocale.value, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const sentimentLabel = t(`journal.sentiment.${sentiment}`);
  return {
    emoji,
    moodMeta,
    sentiment,
    sentimentLabel,
    wordCount: countWords(entry.content),
    preview: String(entry.content || '').trim().slice(0, 180)
  };
}

const editorDateLabel = computed(() => `${new Date().toLocaleDateString(intlLocale.value, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`);
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
  currentPromptIndex.value = (currentPromptIndex.value + 1) % journalPrompts.value.length;
}
function usePrompt(index) {
  const prompt = journalPrompts.value[index];
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

// Dò từ khóa trực tiếp trong NỘI DUNG NGƯỜI DÙNG TỰ VIẾT (không phải chuỗi giao diện) — bộ từ
// khóa phụ thuộc NGÔN NGỮ THẬT SỰ người dùng viết, không phải ngôn ngữ UI đang chọn (2 cái có
// thể khác nhau, nhưng chọn theo UI locale là suy đoán hợp lý nhất khi không có bộ nhận diện
// ngôn ngữ riêng). Luôn kiểm tra CẢ HAI bộ từ khóa (vi + en) bất kể locale, để không bỏ sót
// nếu người dùng gõ lẫn — locale chỉ quyết định thứ tự ưu tiên khi cần mở rộng thêm ngôn ngữ.
const SENTIMENT_KEYWORDS = {
  vi: {
    positive: ['biết ơn', 'vui', 'ổn', 'nhẹ', 'yên tâm', 'hạnh phúc', 'bình yên', 'tự hào'],
    negative: ['lo', 'mệt', 'buồn', 'tức', 'áp lực', 'căng', 'kiệt sức', 'sợ', 'khó']
  },
  en: {
    positive: ['grateful', 'happy', 'okay', 'relieved', 'calm', 'joy', 'peace', 'proud', 'good', 'glad'],
    negative: ['anxious', 'tired', 'sad', 'angry', 'pressure', 'stress', 'stressed', 'exhausted', 'afraid', 'hard', 'difficult', 'worried', 'overwhelmed']
  }
};
// So khớp theo TỪ TRỌN VẸN (không phải substring) — bắt buộc vì có từ khóa ASCII ngắn không
// dấu (vd 'lo') dễ khớp nhầm bên trong từ tiếng Anh không liên quan (vd 'love', 'alone',
// 'long') nếu chỉ dùng String.includes().
function containsWord(haystack, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boundary = '(?:^|[^\\p{L}\\p{N}])';
  return new RegExp(`${boundary}${escaped}${boundary}`, 'u').test(haystack);
}
function analyzeSentiment(text) {
  const c = ` ${String(text || '').toLowerCase()} `;
  let score = 0;
  Object.values(SENTIMENT_KEYWORDS).forEach(({ positive, negative }) => {
    positive.forEach((w) => { if (containsWord(c, w)) score += 1; });
    negative.forEach((w) => { if (containsWord(c, w)) score -= 1; });
  });
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
    ? t('journal.ai.insightPositive')
    : score <= -2
      ? t('journal.ai.insightNegative')
      : t('journal.ai.insightNeutral');

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

const calendarMonthLabel = computed(() => calendarMonth.value.toLocaleDateString(intlLocale.value, { month: 'long', year: 'numeric' }));
// Nhãn thứ Hai-đầu-tuần cho lịch tháng — CỐ Ý không dùng Intl.DateTimeFormat({weekday:
// 'short'}) vì đã verify thật ở dashboardHelpers.js: 'vi' ra "Th 2".."Th 7" (dài hơn thiết
// kế 2 ký tự), 'en' ra "Sun".."Sat" (3 ký tự) — dễ tràn ô lịch nhỏ. Khác thứ tự với
// WEEKDAY_LABELS bên dashboardHelpers.js (CN-đầu-tuần, theo getDay()) vì đây là lưới lịch
// tháng theo quy ước Thứ Hai-đầu-tuần, không phải cùng ngữ cảnh.
const weekdayHeader = computed(() => tm('journal.weekdaysMonFirst'));
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
  toastXp.value = xp;
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

// Chia sẻ TỪNG bài nhật ký với chuyên gia — khác mood check-in/bài test (công tắc toàn
// cục): mỗi bài tự bật/tắt riêng, không ảnh hưởng các bài khác.
async function toggleEntryShare(entry) {
  const next = !entry.shared_with_experts;
  entry.shared_with_experts = next;
  try {
    await apiClient.patch(`/journal/${entry.id}`, { shared_with_experts: next });
  } catch (_e) {
    entry.shared_with_experts = !next;
  }
}
function closeEntryModal(event) {
  if (event.target.classList.contains('modal-overlay')) activeEntry.value = null;
}
const activeEntryPresentation = computed(() => (activeEntry.value ? getEntryPresentation(activeEntry.value) : { emoji: '', moodMeta: { labelKey: '' } }));
const activeEntryInsight = computed(() => {
  if (!activeEntry.value) return '';
  const score = Number(activeEntry.value.sentiment_score || 0);
  return score >= 1
    ? t('journal.ai.detailInsightPositive')
    : score <= -1
      ? t('journal.ai.detailInsightNegative')
      : t('journal.ai.detailInsightNeutral');
});

// Khách chưa đăng nhập viết xong bấm Lưu: KHÔNG mất bài đang viết — lưu tạm vào
// localStorage rồi đưa sang /login, LoginView sẽ tự đưa họ quay lại /journal sau khi đăng
// nhập xong (dùng chung cơ chế peaceflow_post_login_redirect mà apiClient.js đã có sẵn cho
// các trang hết hạn phiên), rồi onMounted ở trên khôi phục lại đúng bài đang viết.
const JOURNAL_DRAFT_KEY = 'peaceflow_journal_draft';
function saveDraftAndRedirectToLogin() {
  localStorage.setItem(JOURNAL_DRAFT_KEY, JSON.stringify({
    title: title.value,
    content: content.value,
    selectedMood: selectedMood.value,
    selectedTags: Array.from(selectedTags),
    isPrivate: isPrivate.value
  }));
  sessionStorage.setItem('peaceflow_post_login_redirect', '/journal');
  router.push('/login');
}
function restoreDraftIfAny() {
  const raw = localStorage.getItem(JOURNAL_DRAFT_KEY);
  if (!raw) return;
  localStorage.removeItem(JOURNAL_DRAFT_KEY);
  try {
    const draft = JSON.parse(raw);
    title.value = draft.title || '';
    content.value = draft.content || '';
    selectedMood.value = draft.selectedMood || null;
    selectedTags.clear();
    (draft.selectedTags || []).forEach((tag) => selectedTags.add(tag));
    isPrivate.value = draft.isPrivate ?? true;
  } catch (_error) {
    // Nháp hỏng -> bỏ qua, không chặn trang load.
  }
}

async function saveEntry() {
  if (!content.value.trim()) {
    alert(t('journal.alerts.emptyContent'));
    return;
  }
  if (!auth.isAuthenticated) {
    saveDraftAndRedirectToLogin();
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
    alert(t('journal.alerts.saveFailed'));
  }
}

// Trang này trước đây không nghe sự kiện cập nhật nền (SWR) như DashboardView.vue —
// apiClient dùng cache stale-while-revalidate: trả bản cache cũ ngay rồi âm thầm gọi lại
// API phía sau, xong bắn 'peaceflow:swr-update'. Không nghe sự kiện này thì lịch/thống kê
// đứng yên ở bản cache cũ cho tới khi rời trang rồi quay lại (mount lại từ đầu).
function handleSwrUpdate(event) {
  if (event.detail?.endpoint === '/journal') {
    entries.value = (event.detail.data || []).map((e) => ({ ...e, tags: normalizeArray(e.tags) }));
  } else if (event.detail?.endpoint === '/dashboard') {
    dashboard.value = event.detail.data || null;
  }
}

onMounted(async () => {
  window.addEventListener('peaceflow:swr-update', handleSwrUpdate);

  // Trang xem được công khai — chỉ bắt đăng nhập lúc bấm Lưu (xem saveEntry). Khách chưa
  // đăng nhập thì KHÔNG gọi /journal, /dashboard (đều yêu cầu đăng nhập): gọi vào sẽ dính
  // 401, rồi bị apiClient tự redirect sang /login (xem redirectToLogin trong apiClient.js)
  // — đúng cái hành vi ta đang cố bỏ.
  if (!auth.isAuthenticated) {
    calendarMonth.value = new Date();
    restoreDraftIfAny();
    return;
  }

  try {
    const [entriesData, dashboardData] = await Promise.all([
      apiClient.get('/journal'),
      apiClient.get('/dashboard')
    ]);
    entries.value = (entriesData || []).map((e) => ({ ...e, tags: normalizeArray(e.tags) }));
    dashboard.value = dashboardData || null;
    calendarMonth.value = new Date();
    restoreDraftIfAny();
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('peaceflow:swr-update', handleSwrUpdate);
});
</script>

<style scoped src="../assets/journal.css"></style>
<style scoped>
/* Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, thẻ trắng bo mềm không
   viền/bóng giấy, chữ Inter + tiêu đề --font-heading, nút/tab phẳng, đường kẻ mảnh liền nét
   thay cho nét gạch kraft. Đặt SAU journal.css để thắng thứ tự nguồn. */
.journal-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; min-height: 100vh;
}
.journal-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.5; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { padding: 20px 20px 32px; }
.journal-page :is(input, textarea, button) { font-family: inherit; }

.breadcrumb, .breadcrumb a { color: var(--color-text-subtle); font-size: 13px; }
.breadcrumb a:hover { color: var(--color-brand); }
.breadcrumb span { color: var(--color-text-muted); }
.page-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); }
.page-subtitle { font-size: 14px; color: var(--color-text-muted); margin-top: 2px; }

/* Nút phẳng như .pf-btn-* của Dashboard. */
.btn-primary, .btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 8px 16px; border: none; border-radius: var(--radius-control); box-shadow: none; transform: none;
  font-family: inherit; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn-primary { background: var(--color-brand); color: var(--color-on-brand); }
.btn-primary:hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); box-shadow: none; transform: none; }
.btn-outline { background: var(--color-surface-muted); color: var(--color-text); }
.btn-outline:hover { background: var(--color-brand-soft); color: var(--color-brand); }
.journal-page :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

/* Tab Viết / Lịch sử: thanh nền nhạt, tab đang chọn là ô trắng. */
.view-tabs { border: none; border-radius: var(--radius-control); background: var(--color-surface-muted); padding: 4px; }
.view-tab { font-family: inherit; font-size: 14px; font-weight: 600; color: var(--color-text-muted); border-radius: calc(var(--radius-control) - 2px); }
.view-tab.active { background: var(--color-surface); color: var(--color-brand); }

/* Thẻ: nền trắng, bo --radius-card, không viền/bóng giấy. */
.paper-card, .editor-card, .mood-trend-card, .entry-modal {
  background: var(--color-surface); border: none; border-radius: var(--radius-card); box-shadow: none;
}
.editor-card { overflow: hidden; }
/* Thẻ xu hướng tâm trạng bản gốc tràn lề -16px hai bên — đưa về thẳng hàng với các thẻ khác. */
.mood-trend-card { margin-left: 0; margin-right: 0; padding: 16px 18px; }
.mtc-bar { border-radius: 6px 6px 2px 2px; }
.sc-title, .mt-title, .pc-title, .aac-title, .mc-month { font-family: var(--font-heading); font-size: 16px; font-weight: 800; color: var(--color-text); }

/* Trình soạn: bỏ nền gradient + nét gạch, dùng đường kẻ mảnh. */
.editor-top-bar { background: var(--color-surface); border-bottom: 1px solid var(--color-surface-muted); }
.etb-date { font-family: var(--font-heading); color: var(--color-text); }
.mood-btn { border: 1.5px solid transparent; background: var(--color-canvas); }
.mood-btn.selected { border-color: var(--color-brand); background: var(--color-brand-soft); }
.privacy-toggle { color: var(--color-text-muted); }
.prompt-bar { background: var(--color-canvas); border-bottom: 1px solid var(--color-surface-muted); }
.pb-label { color: var(--color-terracotta); }
.pb-prompt { font-family: inherit; font-style: italic; color: var(--color-text-muted); }
.pb-refresh { border: none; background: var(--color-surface-muted); }
.pb-refresh:hover { background: var(--color-brand-soft); }
.editor-toolbar { border-bottom: 1px solid var(--color-surface-muted); }
.tb-btn { border-color: transparent; border-radius: var(--radius-control); color: var(--color-text-muted); }
.tb-btn:hover { background: var(--color-brand-soft); border-color: transparent; color: var(--color-brand); }
.tb-sep { background: var(--color-surface-muted); }
.journal-title-input { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.journal-textarea { font-family: inherit; color: var(--color-text); line-height: 1.7; }
.journal-title-input::placeholder, .journal-textarea::placeholder { color: var(--color-text-subtle); }
.editor-bottom { border-top: 1px solid var(--color-surface-muted); }
.eb-wordcount { color: var(--color-text-subtle); }
.tag-chip { border: none; border-radius: 999px; background: var(--color-canvas); color: var(--color-text); }
.tag-chip:hover { background: var(--color-surface-muted); border: none; }
.tag-chip.selected { background: var(--color-brand-soft); color: var(--color-brand); border: none; }

/* Phân tích AI. */
.ai-analysis-card { background: var(--color-surface); }
.sb-label { color: var(--color-text-muted); }
.keyword-tag { border: none !important; }
.aac-insight { background: var(--color-canvas); border-radius: var(--radius-control); color: var(--color-text-muted); }
.aac-suggestion { background: var(--color-canvas); border: none; border-radius: var(--radius-control); }
.as-title { color: var(--color-text); }

/* Lịch sử: bộ lọc, tìm kiếm, thẻ bài viết (giữ vạch màu cảm xúc bên trái). */
.hf-btn { border: none; border-radius: 999px; background: var(--color-surface); font-family: inherit; color: var(--color-text-muted); }
.hf-btn:hover { background: var(--color-surface-muted); border: none; }
.hf-btn.active { background: var(--color-brand-soft); color: var(--color-brand); border: none; }
.search-input { border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-surface); font-family: inherit; color: var(--color-text); }
.search-input:focus { border-color: var(--color-brand); }
.entry-card { border: none; border-left: 4px solid var(--color-surface-muted); }
.entry-card:hover { box-shadow: none; background: color-mix(in srgb, var(--color-brand-soft) 35%, var(--color-surface)); }
.ec-title { font-family: var(--font-heading); }
.ec-date, .ec-wordcount { color: var(--color-text-subtle); }
.ec-preview { font-family: inherit; color: var(--color-text-muted); }
.ec-tag { border: none; background: var(--color-canvas); color: var(--color-text-muted); }
.ec-share-btn { border: none; background: var(--color-surface-muted); }
.ec-share-btn.is-shared { background: var(--color-brand-soft); }

/* Cột phải: lịch, thống kê, xu hướng, gợi ý viết. */
.mc-nav { color: var(--color-text-muted); }
.mc-day-h { color: var(--color-text-subtle); }
.mc-day { border-radius: var(--radius-control); }
.mc-day:hover:not(.empty):not(.disabled) { background: var(--color-brand-soft); }
.mc-day.today { background: var(--color-brand-soft); border: none; color: var(--color-brand); font-weight: 700; }
.mc-day.has-entry::after { background: var(--color-brand); }
.stat-item { background: var(--color-canvas); border: none; border-radius: var(--radius-control); }
.si-num { font-family: var(--font-heading); color: var(--color-brand); }
.si-label, .md-label { color: var(--color-text-muted); }
.prompt-item { background: var(--color-canvas); border: none; border-radius: var(--radius-control); font-family: inherit; color: var(--color-text); }
.prompt-item:hover { background: var(--color-brand-soft); color: var(--color-brand); border: none; }

/* Modal xem bài + thông báo XP. */
.entry-modal { border-radius: var(--radius-panel); }
.em-header { border-bottom: 1px solid var(--color-surface-muted); }
.em-close { border: none; background: var(--color-surface-muted); }
.em-close:hover { background: var(--color-brand-soft); }
.em-title { font-family: var(--font-heading); font-weight: 800; }
.em-meta { color: var(--color-text-subtle); }
.em-content { font-family: inherit; color: var(--color-text); line-height: 1.7; }
.em-ai-section { background: var(--color-canvas); border: none; border-radius: var(--radius-card); }
.em-ai-text { color: var(--color-text-muted); }
.xp-toast { border: none; border-radius: var(--radius-control); background: var(--color-surface); box-shadow: var(--shadow-soft); font-family: var(--font-body); }
</style>
