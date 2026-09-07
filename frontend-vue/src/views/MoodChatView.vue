<template>
  <!-- Emergency Overlay -->
  <div class="emergency-overlay mood-chat-page" :class="{ show: emergencyOpen }">
    <div class="emergency-popup">
      <div class="ep-icon">❤️</div>
      <div class="ep-title">{{ t('moodChat.emergency.title') }}</div>
      <p class="ep-text">{{ t('moodChat.emergency.text') }}</p>
      <div class="ep-hotline">
        <div class="eph-num">📞 0931773637</div>
        <div class="eph-label">{{ t('moodChat.emergency.hotlineLabel') }}</div>
      </div>
      <div class="ep-actions">
        <a href="tel:0931773637" class="ep-btn ep-btn-red">{{ t('moodChat.emergency.callHotline') }}</a>
        <router-link to="/experts" class="ep-btn ep-btn-green">{{ t('moodChat.emergency.chatExpert') }}</router-link>
        <a href="tel:115" class="ep-btn ep-btn-green" style="background:var(--coral-light);color:#c05050;border-color:var(--coral);">{{ t('moodChat.emergency.callRescue') }}</a>
        <button class="ep-btn ep-btn-ghost" @click="closeEmergency">{{ t('moodChat.emergency.imOk') }}</button>
      </div>
      <p style="text-align:center;font-size:0.72rem;color:var(--text-light);margin-top:10px;font-style:italic;">{{ t('moodChat.emergency.quote') }}</p>
    </div>
  </div>

  <!-- Result Overlay -->
  <div class="result-overlay mood-chat-page" :class="{ show: resultOpen }">
    <div class="result-popup">
      <div class="rp-header">
        <div class="rp-mascot">🐱</div>
        <div class="rp-title">{{ t('moodChat.result.mascotTitle') }}</div>
        <div class="rp-subtitle">{{ t('moodChat.result.subtitle') }}</div>
      </div>
      <div class="rp-body">
        <div class="rp-section-title">{{ t('moodChat.result.scoresTitle') }}</div>
        <div class="rp-scores">
          <div v-for="item in resultScores" :key="item.key" class="rps-item" :class="item.level">
            <div class="rps-icon">{{ item.icon }}</div>
            <div class="rps-score">{{ Math.round(item.value) }}%</div>
            <div class="rps-label">{{ item.label }}</div>
            <div class="rps-level">{{ item.levelLabel }}</div>
          </div>
        </div>
        <div class="rp-insight paper-card" style="margin-bottom:14px;">
          <div class="rp-section-title">{{ t('moodChat.result.aiInsightTitle') }}</div>
          <div class="rp-insight-text">{{ resultInsight }}</div>
        </div>
        <div class="rp-tasks">
          <div class="rp-section-title">{{ t('moodChat.result.tasksTitle') }}</div>
          <div>
            <div v-if="!suggestedTasks.length" style="font-size:0.75rem;color:var(--text-light);font-style:italic;">{{ t('moodChat.result.noTasks') }}</div>
            <div v-for="task in suggestedTasks" :key="task.id" class="rp-task-item" @click="goToTask(task.id)">
              <div class="ts-icon">🎯</div>
              <div class="ts-info">
                <div class="ts-name">{{ task.title || t('moodChat.result.taskDefaultTitle') }}</div>
                <div class="ts-meta">{{ task.category || t('moodChat.result.taskDefaultCategory') }} · {{ task.difficulty || t('moodChat.result.taskDefaultDifficulty') }}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="padding:10px 12px;background:rgba(255,203,164,0.2);border:1.5px solid var(--peach);border-radius:var(--border-radius-sm);font-size:0.75rem;color:var(--text-secondary);margin-bottom:14px;" v-html="t('moodChat.result.disclaimer')"></div>
        <div class="rp-actions">
          <router-link to="/tasks" class="btn-primary">{{ t('moodChat.result.startTasksBtn') }}</router-link>
          <button class="btn-outline" @click="closeResult">{{ t('moodChat.result.continueChatBtn') }}</button>
          <router-link to="/dashboard" class="btn-outline">{{ t('moodChat.result.dashboardBtn') }}</router-link>
        </div>
      </div>
    </div>
  </div>

  <main class="main-content mood-chat-page" style="margin-left: 0;">
    <!-- Chat Topbar -->
    <div class="chat-topbar">
      <router-link to="/mood-checkin" class="ct-back">{{ t('moodChat.topbar.back') }}</router-link>
      <div class="ct-mascot">{{ topbarMascot }}</div>
      <div class="ct-info">
        <div class="ct-name">{{ t('moodChat.topbar.mascotName') }}</div>
        <div class="ct-status">
          <span class="status-dot"></span>
          <span>{{ statusText }}</span>
        </div>
      </div>
      <div class="ct-actions">
        <span class="badge-pill badge-mint">{{ t('moodChat.topbar.messageCountLabel', { n: userMessageCount }) }}</span>
        <button class="ct-action-btn" @click="showResult">{{ t('moodChat.topbar.viewResultBtn') }}</button>
        <button class="ct-action-btn" @click="clearChat">{{ t('moodChat.topbar.clearChatBtn') }}</button>
        <button class="ct-action-btn danger" @click="showEmergency">{{ t('moodChat.topbar.emergencyBtn') }}</button>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body">
      <!-- Left: Messages -->
      <div class="chat-main">
        <div class="chat-messages" ref="chatMessagesEl">
          <div v-for="(item, idx) in conversation" :key="idx" class="msg" :class="item.role === 'user' ? 'msg-user' : 'msg-bot'">
            <div v-if="item.role !== 'user'" class="msg-avatar">🐱</div>
            <div class="msg-content">
              <div class="msg-bubble" v-html="item.html"></div>
              <div v-if="item.suggestedTask" class="msg-suggestion" @click="goToTask(item.suggestedTask.id)">
                <span class="msg-suggestion-icon">{{ item.suggestedTask.icon || '🎯' }}</span>
                <div class="msg-suggestion-info">
                  <div class="msg-suggestion-title">{{ item.suggestedTask.title }}</div>
                  <div class="msg-suggestion-meta">{{ t('moodChat.chat.minutesUnit', { n: item.suggestedTask.duration_minutes || 0 }) }}</div>
                </div>
              </div>
              <div v-if="item.suggestedExpert" class="msg-suggestion" @click="router.push('/experts')">
                <span class="msg-suggestion-icon">🩺</span>
                <div class="msg-suggestion-info">
                  <div class="msg-suggestion-title">{{ item.suggestedExpert.name }}</div>
                  <div class="msg-suggestion-meta">{{ item.suggestedExpert.degree || t('moodChat.chat.defaultExpertDegree') }} · ⭐ {{ item.suggestedExpert.rating || '?' }}/5</div>
                </div>
              </div>
              <div class="msg-time">{{ item.time }}</div>
            </div>
          </div>
          <div v-if="isTyping" class="msg msg-bot">
            <div class="msg-avatar">🐱</div>
            <div class="msg-content">
              <div class="typing-wrap">
                <div class="typing-bubble"><span class="td"></span><span class="td"></span><span class="td"></span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Replies -->
        <div class="quick-replies-area">
          <button v-for="text in quickReplies" :key="text" class="qr-btn" @click="sendQuickReply(text)">{{ text }}</button>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <button class="voice-btn" :class="{ recording: isRecording }" :title="t('moodChat.chat.voiceTitle')" @click="toggleVoice">🎤</button>
          <div class="input-wrap">
            <textarea
              class="chat-input"
              :placeholder="t('moodChat.chat.inputPlaceholder')"
              rows="1"
              ref="chatInputEl"
              v-model="chatInputValue"
              @keydown="handleKey"
              @input="handleInputResize"
            ></textarea>
            <span class="char-count">{{ chatInputValue.length }}/{{ MAX_MESSAGE_LENGTH }}</span>
          </div>
          <button class="send-btn" :title="t('moodChat.chat.sendTitle')" @click="sendMessage">➤</button>
        </div>
      </div>

      <!-- Right: Analysis Sidebar -->
      <div class="chat-sidebar">
        <!-- Realtime Analysis -->
        <div class="paper-card cs-card">
          <div class="cs-title">{{ t('moodChat.sidebar.realtimeTitle') }}</div>
          <div style="font-size:0.7rem;color:var(--text-light);margin-bottom:10px;">{{ t('moodChat.sidebar.realtimeDesc') }}</div>

          <div class="sent-bar-wrap">
            <div class="sb-row"><span class="sb-label">{{ t('moodChat.sidebar.anxietyLabel') }}</span><span class="sb-val" style="color:var(--coral);">{{ Math.round(analysis.anxiety) }}%</span></div>
            <div class="sb-bar"><div class="sb-fill sb-anxiety" :style="{ width: analysis.anxiety + '%' }"></div></div>
          </div>
          <div class="sent-bar-wrap">
            <div class="sb-row"><span class="sb-label">{{ t('moodChat.sidebar.stressLabel') }}</span><span class="sb-val" style="color:#8a6aaa;">{{ Math.round(analysis.stress) }}%</span></div>
            <div class="sb-bar"><div class="sb-fill sb-stress" :style="{ width: analysis.stress + '%' }"></div></div>
          </div>
          <div class="sent-bar-wrap">
            <div class="sb-row"><span class="sb-label">{{ t('moodChat.sidebar.moodLabel') }}</span><span class="sb-val" style="color:var(--mint-dark);">{{ Math.round(analysis.mood) }}%</span></div>
            <div class="sb-bar"><div class="sb-fill sb-mood" :style="{ width: analysis.mood + '%' }"></div></div>
          </div>
          <div class="sent-bar-wrap">
            <div class="sb-row"><span class="sb-label">{{ t('moodChat.sidebar.depressionLabel') }}</span><span class="sb-val" style="color:#8a6aaa;">{{ Math.round(analysis.depression) }}%</span></div>
            <div class="sb-bar"><div class="sb-fill sb-depression" :style="{ width: analysis.depression + '%' }"></div></div>
          </div>
        </div>

        <!-- Keywords -->
        <div class="paper-card cs-card">
          <div class="cs-title">{{ t('moodChat.sidebar.keywordsTitle') }}</div>
          <div class="kw-grid">
            <span v-if="!keywords.length" style="font-size:0.72rem;color:var(--text-light);font-style:italic;">{{ t('moodChat.sidebar.noKeywords') }}</span>
            <div
              v-for="keyword in keywords.slice(0, 10)"
              :key="keyword"
              class="kw-tag"
              :class="isPositiveKeyword(keyword) ? 'pos' : 'neg'"
              :style="{
                padding: '4px 10px',
                background: isPositiveKeyword(keyword) ? 'var(--mint-light)' : 'var(--coral-light)',
                color: isPositiveKeyword(keyword) ? 'var(--mint-dark)' : 'var(--coral)',
                borderRadius: '20px',
                fontSize: '0.7rem',
                border: '1px solid ' + (isPositiveKeyword(keyword) ? 'var(--mint)' : 'var(--coral)')
              }"
            >{{ keyword }}</div>
          </div>
        </div>

        <!-- Mood Portrait -->
        <div class="paper-card portrait-card">
          <div class="portrait-title">{{ t('moodChat.sidebar.portraitTitle') }}</div>
          <div class="portrait-bars">
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.emotionLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.emotion + '%', background: 'var(--mint-dark)' }"></div></div>
            </div>
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.physicalLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.physical + '%', background: 'var(--sky)' }"></div></div>
            </div>
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.socialLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.social + '%', background: 'var(--lavender)' }"></div></div>
            </div>
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.cognitiveLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.cognitive + '%', background: 'var(--peach-dark)' }"></div></div>
            </div>
          </div>
          <div style="margin-top:10px;">
            <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:9px 16px;" @click="showResult">
              {{ t('moodChat.sidebar.fullReportBtn') }}
            </button>
          </div>
        </div>

        <!-- Suggested Tasks -->
        <div class="paper-card cs-card">
          <div class="cs-title">{{ t('moodChat.sidebar.suggestedTasksTitle') }}</div>
          <div>
            <div v-if="!suggestedTasks.length" style="font-size:0.75rem;color:var(--text-light);font-style:italic;">{{ t('moodChat.sidebar.noSuggestedTasksYet') }}</div>
            <div
              v-for="task in suggestedTasks"
              :key="task.id"
              class="task-suggest"
              @click="goToTask(task.id)"
            >
              <div class="ts-icon">🎯</div>
              <div class="ts-info">
                <div class="ts-name">{{ task.title || t('moodChat.result.taskDefaultTitle') }}</div>
                <div class="ts-meta">{{ task.category || t('moodChat.result.taskDefaultCategory') }} · {{ task.difficulty || t('moodChat.result.taskDefaultDifficulty') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Safety Note -->
        <div class="paper-card cs-card" style="background:rgba(255,139,139,0.05);border-color:var(--coral);">
          <div class="cs-title" style="color:var(--coral);">{{ t('moodChat.sidebar.safetyTitle') }}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.6;margin-bottom:8px;" v-html="t('moodChat.sidebar.safetyText')"></div>
          <button class="emergency-btn-side" style="width:100%;justify-content:center;" @click="showEmergency">{{ t('moodChat.sidebar.safetyBtn') }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const { t, tm, locale } = useI18n();

const STORAGE_KEY = 'peaceflow_mood_chat_state_v1';
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONVERSATION_ITEMS = 20;

// Các bộ từ khoá này so khớp trực tiếp trên NỘI DUNG người dùng gõ (tiếng Việt), không phải
// text giao diện — không thể "dịch" mà không phá vỡ khả năng phát hiện. DANGER_KEYWORDS đặc
// biệt quan trọng vì dùng để tự động mở popup hỗ trợ khẩn cấp. Đây là khoảng trống tính năng
// thật với người dùng viết tiếng Anh (client-side sẽ không bắt được, nhưng server có bộ từ
// khoá riêng rộng hơn kiểm tra lại — xem comment ở sendMessage()). Cần một bộ từ khoá tiếng Anh
// riêng để xử lý đầy đủ, nằm ngoài phạm vi dịch giao diện tĩnh lần này.
const DANGER_KEYWORDS = ['tự tử', 'muốn chết', 'không muốn sống', 'tự hại', 'cắt tay', 'kết thúc tất cả', 'tuyệt vọng hoàn toàn', 'không còn lý do'];
const NEGATIVE_KW = ['căng thẳng', 'lo lắng', 'mệt mỏi', 'buồn', 'tức giận', 'kiệt sức', 'áp lực', 'mất ngủ', 'chán nản', 'sợ hãi', 'cô đơn', 'thất bại', 'khóc', 'đau', 'bế tắc', 'không ngủ được', 'deadline', 'sếp', 'công việc'];
const POSITIVE_KW = ['vui', 'hạnh phúc', 'tốt', 'ổn', 'bình tĩnh', 'thư giãn', 'hy vọng', 'cảm ơn', 'biết ơn', 'yêu', 'tự hào', 'tiến bộ'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTimeLabel() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  const numeric = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!numeric.length) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function scoreToPercent(value) {
  return value === null || value === undefined ? null : clamp(Math.round(Number(value) * 10), 0, 100);
}

const dashboard = ref(null);
const report = ref(null);
const tasks = ref([]);
const conversation = ref([]);
const isTyping = ref(false);
const isRecording = ref(false);
const topbarMascot = ref('🐱');
// Trạng thái thuần, không phải chuỗi đã dịch — computed bên dưới tự dịch lại khi đổi ngôn ngữ.
const statusKind = ref('listening'); // 'listening' | 'typing' | 'recording' | 'error'
const statusText = computed(() => {
  if (statusKind.value === 'typing') return t('moodChat.topbar.statusTyping');
  if (statusKind.value === 'recording') return t('moodChat.topbar.statusRecording');
  if (statusKind.value === 'error') return t('moodChat.loadFailedStatus');
  return t('moodChat.topbar.statusListening');
});
const chatInputValue = ref('');
const chatMessagesEl = ref(null);
const chatInputEl = ref(null);

const analysis = reactive({
  anxiety: 0, stress: 0, mood: 50, depression: 0,
  emotion: 50, physical: 50, social: 50, cognitive: 50
});
const keywords = ref([]);

const userMessageCount = ref(0);

function getUserName() {
  const user = report.value?.user || dashboard.value?.user || auth.user || {};
  return user.display_name || user.full_name || t('moodChat.defaultUserName');
}

const quickReplies = computed(() => tm('moodChat.quickReplies'));

function getLatestPhqAssessment() {
  return (report.value?.assessments || []).find((item) => String(item.code || '').toLowerCase().includes('phq')) || null;
}

function buildBaseAnalysis() {
  const latestMood = dashboard.value?.latest_mood || report.value?.latest_mood || null;
  const moodHistory = Array.isArray(report.value?.mood_history) ? report.value.mood_history : [];
  const journalHistory = Array.isArray(report.value?.journal_history) ? report.value.journal_history : [];

  const moodAvg = latestMood?.mood_score ?? average(moodHistory.map((item) => item.mood_score)) ?? 5;
  const anxietyAvg = latestMood?.anxiety_score ?? average(moodHistory.map((item) => item.anxiety_score)) ?? 4;
  const stressAvg = latestMood?.stress_score ?? average(moodHistory.map((item) => item.stress_score)) ?? 4;
  const energyAvg = latestMood?.energy_score ?? average(moodHistory.map((item) => item.energy_score)) ?? 5;
  const sleepAvg = latestMood?.sleep_quality_score ?? average(moodHistory.map((item) => item.sleep_quality_score)) ?? 5;
  const sentimentAvg = average(journalHistory.slice(0, 5).map((item) => item.sentiment_score));
  const phq = getLatestPhqAssessment();

  const moodPercent = scoreToPercent(moodAvg) ?? 50;
  const anxietyPercent = scoreToPercent(anxietyAvg) ?? 40;
  const stressPercent = scoreToPercent(stressAvg) ?? 40;
  const physicalPercent = scoreToPercent(average([energyAvg, sleepAvg])) ?? 50;
  const socialPercent = clamp(Math.round(((dashboard.value?.summary?.badges_count || 0) * 8) + ((dashboard.value?.progress?.weekly_tasks_completed || 0) * 5)), 20, 100);
  const cognitivePercent = clamp(Math.round(100 - ((anxietyPercent + stressPercent) / 2)), 10, 100);
  const depressionPercent = phq?.total_score
    ? clamp(Math.round((Number(phq.total_score) / 27) * 100), 0, 100)
    : clamp(Math.round(100 - moodPercent + (stressPercent * 0.15)), 5, 95);

  const sentimentBonus = sentimentAvg === null || !Number.isFinite(sentimentAvg)
    ? 0
    : clamp(Math.round((Number(sentimentAvg) - 0.5) * 30), -12, 12);

  return {
    anxiety: clamp(anxietyPercent, 5, 95),
    stress: clamp(stressPercent, 5, 95),
    mood: clamp(moodPercent + sentimentBonus, 5, 95),
    depression: clamp(depressionPercent, 5, 95),
    emotion: clamp(moodPercent, 5, 95),
    physical: clamp(physicalPercent, 5, 95),
    social: clamp(socialPercent, 5, 95),
    cognitive: clamp(cognitivePercent, 5, 95)
  };
}

function collectRealKeywords() {
  const tags = new Set();
  const primaryTrigger = dashboard.value?.summary?.primary_trigger || report.value?.summary?.primary_trigger;
  if (primaryTrigger) tags.add(primaryTrigger);

  (report.value?.journal_history || []).slice(0, 8).forEach((entry) => {
    (Array.isArray(entry.tags) ? entry.tags : []).forEach((tag) => {
      if (tag) tags.add(String(tag).trim());
    });
  });

  const latestMood = dashboard.value?.latest_mood || report.value?.latest_mood;
  if (latestMood?.stress_score >= 7) tags.add('stress cao');
  if (latestMood?.anxiety_score >= 7) tags.add('lo âu cao');
  if (latestMood?.mood_score <= 4) tags.add('mood thấp');

  return Array.from(tags).slice(0, 10);
}

function isPositiveKeyword(keyword) {
  return POSITIVE_KW.includes(String(keyword).toLowerCase());
}

function saveConversation() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    conversation: conversation.value.slice(-MAX_CONVERSATION_ITEMS),
    analysis: { ...analysis },
    keywords: keywords.value
  }));
}

function loadConversation() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    conversation.value = Array.isArray(parsed.conversation) ? parsed.conversation : [];
    if (parsed.analysis && typeof parsed.analysis === 'object') {
      Object.assign(analysis, parsed.analysis);
    }
    keywords.value = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    return conversation.value.length > 0;
  } catch (error) {
    console.error('Failed to restore mood chat state:', error);
    return false;
  }
}

function updateMessageCount() {
  userMessageCount.value = conversation.value.filter((item) => item.role === 'user').length;
}

function scrollToBottom() {
  nextTick(() => {
    setTimeout(() => {
      const el = chatMessagesEl.value;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  });
}

function renderConversation() {
  updateMessageCount();
  scrollToBottom();
}

const suggestedTasks = ref([]);

function renderSuggestedTasks() {
  suggestedTasks.value = (dashboard.value?.tasks || tasks.value || []).slice(0, 4);
}

function buildWelcomeMessage() {
  const latestMood = dashboard.value?.latest_mood || report.value?.latest_mood;
  const insight = dashboard.value?.insight;
  const moodSentence = latestMood?.mood_score !== null && latestMood?.mood_score !== undefined
    ? t('moodChat.welcome.moodSentence', { score: latestMood.mood_score })
    : t('moodChat.welcome.noMoodSentence');

  const insightSentence = (insight?.title || insight?.body)
    ? t('moodChat.welcome.recentSignal', { text: escapeHtml(insight.title || insight.body) })
    : '';

  const nameHtml = `<span data-user-field="display_name">${escapeHtml(getUserName())}</span>`;
  return `${t('moodChat.welcome.intro', { name: nameHtml })}<br><br>${moodSentence}${insightSentence}<br><br>${t('moodChat.welcome.closing')}`;
}

function addMessage(role, text, options = {}) {
  conversation.value.push({
    role,
    text,
    html: options.html || escapeHtml(text).replace(/\n/g, '<br>'),
    time: options.time || getTimeLabel(),
    suggestedTask: options.suggestedTask || null,
    suggestedExpert: options.suggestedExpert || null,
    offeredTask: Boolean(options.offeredTask)
  });

  conversation.value = conversation.value.slice(-MAX_CONVERSATION_ITEMS);
  renderConversation();
  saveConversation();
}

function showTyping() {
  if (isTyping.value) return;
  isTyping.value = true;
  statusKind.value = 'typing';
  scrollToBottom();
}

function hideTyping() {
  isTyping.value = false;
  statusKind.value = 'listening';
}

function detectMoodType(text) {
  const lower = String(text || '').toLowerCase();
  if (DANGER_KEYWORDS.some((keyword) => lower.includes(keyword))) return 'danger';
  if (lower.includes('căng thẳng') || lower.includes('áp lực') || lower.includes('deadline') || lower.includes('lo')) return 'stressed';
  if (lower.includes('buồn') || lower.includes('khóc') || lower.includes('cô đơn') || lower.includes('thất bại')) return 'sad';
  if (lower.includes('mệt') || lower.includes('kiệt sức') || lower.includes('mất ngủ') || lower.includes('không ngủ')) return 'tired';
  if (lower.includes('tức') || lower.includes('giận') || lower.includes('bực')) return 'angry';
  if (lower.includes('ổn') || lower.includes('vui') || lower.includes('tốt') || lower.includes('hạnh phúc')) return 'good';
  return 'default';
}

// Cập nhật "Phân tích realtime" từ mood_analysis do chính Gemini trả về (dựa trên
// toàn bộ cuộc trò chuyện) — thay cho cách đếm từ khóa cứng cũ (NEGATIVE_KW/POSITIVE_KW)
// vốn rất thô và dễ bị đẩy lên 90%+ chỉ sau vài từ khớp.
function applyAiMoodAnalysis(moodAnalysis) {
  if (!moodAnalysis) return;
  analysis.anxiety = clamp(moodAnalysis.anxiety, 5, 95);
  analysis.stress = clamp(moodAnalysis.stress, 5, 95);
  analysis.mood = clamp(moodAnalysis.mood, 5, 95);
  analysis.depression = clamp(moodAnalysis.depression, 5, 95);
  analysis.emotion = analysis.mood;
  analysis.cognitive = clamp(100 - Math.round((analysis.anxiety + analysis.stress) / 2), 5, 95);

  (Array.isArray(moodAnalysis.keywords) ? moodAnalysis.keywords : []).forEach((keyword) => {
    const trimmed = String(keyword || '').trim();
    if (trimmed && !keywords.value.includes(trimmed)) {
      keywords.value.unshift(trimmed);
    }
  });
  keywords.value = keywords.value.slice(0, 10);
}

function resetChat(withWelcome = true) {
  conversation.value = [];
  if (withWelcome) {
    addMessage('bot', '', { html: buildWelcomeMessage(), time: t('moodChat.welcome.justNow') });
  }
  updateMessageCount();
  saveConversation();
}

function handleInputResize() {
  const value = String(chatInputValue.value || '').slice(0, MAX_MESSAGE_LENGTH);
  if (value !== chatInputValue.value) chatInputValue.value = value;
  nextTick(() => {
    const input = chatInputEl.value;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  });
}

function handleKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function sendQuickReply(text) {
  chatInputValue.value = String(text || '').replace(/^['"]|['"]$/g, '');
  handleInputResize();
  sendMessage();
}

async function sendMessage() {
  const text = String(chatInputValue.value || '').trim();
  if (!text || isTyping.value) return;

  chatInputValue.value = '';
  handleInputResize();

  addMessage('user', text);

  const moodType = detectMoodType(text);
  if (moodType === 'danger') {
    setTimeout(() => {
      showEmergency();
    }, 250);
  }

  showTyping();
  try {
    // Gửi kèm lịch sử hội thoại (trừ tin vừa thêm — server tự nối vào cuối) để AI hiểu
    // ngữ cảnh nhiều lượt, giống cách vanilla giữ conversation trong sessionStorage.
    const history = conversation.value
      .slice(0, -1)
      .filter((item) => item.text)
      .slice(-6)
      // hadSuggestion/offeredTask: cho server biết lượt trước đã gắn thẻ hay đã hỏi ý
      // gợi ý bài tập chưa — bài tập giờ LUÔN phải hỏi trước rồi mới gợi ý, server dùng
      // 2 cờ này để quyết định lượt này có được cấp danh sách bài tập hay không.
      .map((item) => ({
        role: item.role,
        text: item.text,
        hadSuggestion: Boolean(item.suggestedTask || item.suggestedExpert),
        offeredTask: Boolean(item.offeredTask)
      }));

    const res = await apiClient.post('/ai/chat', { message: text, history });
    hideTyping();
    applyAiMoodAnalysis(res?.mood_analysis);
    addMessage('bot', res?.reply || t('moodChat.botDefaultReply'), {
      suggestedTask: res?.suggested_task || null,
      suggestedExpert: res?.suggested_expert || null,
      offeredTask: res?.offered_task || false
    });

    // Server cũng tự kiểm tra dấu hiệu tự hại (bộ từ khoá riêng, rộng hơn DANGER_KEYWORDS
    // ở đây) — nếu nó phát hiện mà bộ từ khoá phía client bỏ sót thì vẫn mở popup khẩn cấp.
    // showEmergency() chỉ bật cờ nên gọi trùng cũng vô hại.
    if (res?.crisis) showEmergency();
  } catch (error) {
    console.error('Chat AI failed:', error);
    hideTyping();
    addMessage('bot', t('moodChat.botErrorReply'));
  }
}

function clearChat() {
  sessionStorage.removeItem(STORAGE_KEY);
  Object.assign(analysis, buildBaseAnalysis());
  keywords.value = collectRealKeywords();
  resetChat(true);
}

let recognitionRef = null;

function toggleVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(t('moodChat.chat.voiceNotSupported'));
    return;
  }

  if (isRecording.value) {
    if (recognitionRef) recognitionRef.stop();
    return;
  }

  const recognition = new SpeechRecognition();
  recognitionRef = recognition;
  recognition.lang = locale.value === 'en' ? 'en-US' : 'vi-VN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecording.value = true;
    statusKind.value = 'recording';
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    chatInputValue.value = transcript;
    handleInputResize();
  };

  recognition.onerror = () => {
    statusKind.value = 'listening';
  };

  recognition.onend = () => {
    isRecording.value = false;
    statusKind.value = 'listening';
  };

  recognition.start();
}

const emergencyOpen = ref(false);
const resultOpen = ref(false);

function showResult() {
  resultOpen.value = true;
}

function closeResult() {
  resultOpen.value = false;
}

function showEmergency() {
  emergencyOpen.value = true;
}

function closeEmergency() {
  emergencyOpen.value = false;
}

function goToTask(id) {
  router.push({ name: 'task-detail', query: { id } });
}

function scoreLevel(value, { good, medium }) {
  return value <= good ? 'good' : value <= medium ? 'medium' : 'bad';
}

function scoreLevelLabel(value, { good, medium }) {
  return value <= good ? t('moodChat.scoreLevels.low') : value <= medium ? t('moodChat.scoreLevels.medium') : t('moodChat.scoreLevels.high');
}

const resultScores = computed(() => [
  { key: 'anxiety', icon: '😰', label: t('moodChat.scoreLabels.anxiety'), value: analysis.anxiety, level: scoreLevel(analysis.anxiety, { good: 35, medium: 65 }), levelLabel: scoreLevelLabel(analysis.anxiety, { good: 35, medium: 65 }) },
  { key: 'stress', icon: '🌀', label: t('moodChat.scoreLabels.stress'), value: analysis.stress, level: scoreLevel(analysis.stress, { good: 35, medium: 65 }), levelLabel: scoreLevelLabel(analysis.stress, { good: 35, medium: 65 }) },
  { key: 'mood', icon: '💚', label: t('moodChat.scoreLabels.mood'), value: analysis.mood, level: analysis.mood >= 65 ? 'good' : analysis.mood >= 35 ? 'medium' : 'bad', levelLabel: analysis.mood >= 65 ? t('moodChat.scoreLevels.positive') : analysis.mood >= 35 ? t('moodChat.scoreLevels.medium') : t('moodChat.scoreLevels.needsAttention') },
  { key: 'depression', icon: '🌧️', label: t('moodChat.scoreLabels.depression'), value: analysis.depression, level: scoreLevel(analysis.depression, { good: 35, medium: 65 }), levelLabel: scoreLevelLabel(analysis.depression, { good: 35, medium: 65 }) }
]);

const resultInsight = computed(() => {
  if (analysis.mood >= 65) {
    return t('moodChat.insight.positive');
  }
  if (analysis.anxiety >= 65 || analysis.stress >= 65) {
    return t('moodChat.insight.highStress');
  }
  if (keywords.value.length) {
    return t('moodChat.insight.keywordsFound', { keywords: keywords.value.slice(0, 3).join(', ') });
  }
  return t('moodChat.insight.defaultMessage');
});

async function initializePage() {
  const [dashboardData, reportData, tasksData] = await Promise.all([
    apiClient.get('/dashboard'),
    apiClient.get('/reports/detail'),
    apiClient.get('/tasks/recommended').catch(() => [])
  ]);

  dashboard.value = dashboardData;
  report.value = reportData;
  tasks.value = Array.isArray(tasksData) ? tasksData : [];
  Object.assign(analysis, buildBaseAnalysis());
  keywords.value = collectRealKeywords();

  renderSuggestedTasks();

  const hasStoredConversation = loadConversation();
  if (hasStoredConversation) {
    renderConversation();
  } else {
    resetChat(true);
  }

  handleInputResize();
}

onMounted(async () => {
  const authenticated = await auth.waitForAuth();
  if (!authenticated) {
    router.replace('/login');
    return;
  }

  try {
    await initializePage();
  } catch (error) {
    console.error('Failed to initialize mood chat page:', error);
    statusKind.value = 'error';
    resetChat(true);
  }
});
</script>

<style scoped src="../assets/mood-chat.css"></style>
