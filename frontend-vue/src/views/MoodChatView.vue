<template>
  <!-- Emergency Overlay -->
  <div class="emergency-overlay mood-chat-page" :class="{ show: emergencyOpen }">
    <div class="emergency-popup">
      <div class="ep-title">{{ t('moodChat.emergency.title') }}</div>
      <p class="ep-text">{{ t('moodChat.emergency.text') }}</p>
      <div class="ep-hotline">
        <div class="eph-num">0931773637</div>
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
        <div class="rp-mascot"><NavIcon name="peacecat" /></div>
        <div class="rp-title">{{ t('moodChat.result.mascotTitle') }}</div>
        <div class="rp-subtitle">{{ t('moodChat.result.subtitle') }}</div>
      </div>
      <div class="rp-body">
        <div class="rp-section-title">{{ t('moodChat.result.scoresTitle') }}</div>
        <div class="rp-scores">
          <div v-for="item in resultScores" :key="item.key" class="rps-item" :class="item.level">
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
              <img v-if="taskThumbSrc(task) && !brokenTaskImages.has(task.id)" :src="taskThumbSrc(task)" alt="" class="ts-thumb" loading="lazy" @error="brokenTaskImages.add(task.id)">
              <div v-else class="ts-thumb ts-thumb-empty"><NavIcon name="tasks" /></div>
              <div class="ts-info">
                <div class="ts-name">{{ task.title || t('moodChat.result.taskDefaultTitle') }}</div>
                <div v-if="task.duration_minutes" class="ts-meta">{{ t('moodChat.chat.minutesUnit', { n: task.duration_minutes }) }}<template v-if="task.xp_reward"> · +{{ task.xp_reward }} XP</template></div>
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

  <!-- Lịch sử trò chuyện (lưu mã hoá trên server khi khách đã đồng ý xử lý Dữ liệu sức khỏe) -->
  <div v-if="historyOpen" class="chat-history-overlay" @click.self="historyOpen = false">
    <div class="chat-history" role="dialog" aria-modal="true" :aria-label="t('chatHistory.title')">
      <div class="chh-head">
        <strong>{{ t('chatHistory.title') }}</strong>
        <button type="button" class="chh-x" :aria-label="t('chatHistory.close')" @click="historyOpen = false"><NavIcon name="close" /></button>
      </div>
      <div class="chh-body">
        <p v-if="historyLoading" class="chh-note">{{ t('chatHistory.loading') }}</p>
        <p v-else-if="historyError" class="chh-note">{{ t('chatHistory.loadError') }}</p>
        <template v-else>
          <div v-if="!storageEnabled" class="chh-warn">
            {{ t('chatHistory.localOnly') }}
            <router-link to="/settings">{{ t('chatHistory.goSettings') }}</router-link>
          </div>
          <p v-else class="chh-note">{{ t('chatHistory.encryptedNote') }}</p>
          <p v-if="storageEnabled && !historySessions.length" class="chh-note">{{ t('chatHistory.empty') }}</p>
          <div v-for="s in historySessions" :key="s.id" class="chh-item" :class="{ 'is-current': s.id === sessionId }">
            <button type="button" class="chh-open" @click="openSession(s.id)">
              <span class="chh-title">{{ s.title || t('chatHistory.untitled') }}</span>
              <span class="chh-meta">{{ formatHistoryDate(s.updated_at) }} · {{ t('chatHistory.messages', { n: s.message_count }) }}<template v-if="s.id === sessionId"> · {{ t('chatHistory.current') }}</template></span>
            </button>
            <button type="button" class="chh-del" :aria-label="t('chatHistory.delete')" :title="t('chatHistory.delete')" @click="removeSession(s.id)"><NavIcon name="trash" /></button>
          </div>
          <button v-if="historySessions.length" type="button" class="chh-del-all" @click="removeAllSessions">{{ t('chatHistory.deleteAll') }}</button>
        </template>
      </div>
    </div>
  </div>

  <main class="main-content mood-chat-page" style="margin-left: 0;">
    <!-- Chat Topbar -->
    <div class="chat-topbar">
      <button type="button" class="ct-icon-btn ct-menu" :aria-label="t('moodChat.topbar.menu')" @click="openAppMenu"><NavIcon name="menu" /></button>
      <div class="ct-mascot"><NavIcon name="peacecat" /></div>
      <div class="ct-info">
        <div class="ct-name">{{ t('moodChat.topbar.mascotName') }}</div>
        <div class="ct-status">
          <span class="status-dot"></span>
          <span>{{ statusText }}</span>
        </div>
      </div>
      <!-- Tối giản: chỉ SOS + nút "thêm" (⋯); các thao tác khác nằm trong menu bật lên -->
      <div class="ct-right">
        <button type="button" class="ct-sos" :aria-label="t('moodChat.topbar.emergencyBtn')" @click="showEmergency">SOS</button>
        <div class="ct-more">
          <button type="button" class="ct-icon-btn ct-more-btn" :class="{ 'is-open': moreOpen }" :aria-label="t('moodChat.topbar.more')" :aria-expanded="moreOpen" aria-haspopup="menu" @click.stop="moreOpen = !moreOpen"><NavIcon name="more" /></button>
          <div v-if="moreOpen" class="ct-menu-pop" role="menu" @click="moreOpen = false">
            <button type="button" role="menuitem" class="ct-menu-item" @click="clearChat"><NavIcon name="plus" />{{ t('chatHistory.newChatBtn') }}</button>
            <button type="button" role="menuitem" class="ct-menu-item" @click="openHistory"><NavIcon name="clock" />{{ t('chatHistory.historyBtn') }}</button>
            <button type="button" role="menuitem" class="ct-menu-item" @click="showResult"><NavIcon name="report" />{{ t('moodChat.topbar.viewResultBtn') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body">
      <!-- Left: Messages -->
      <div class="chat-main">
        <div class="chat-messages" ref="chatMessagesEl">
          <AiNotice class="chat-ai-notice" />
          <div v-for="(item, idx) in conversation" :key="idx" class="msg" :class="item.role === 'user' ? 'msg-user' : 'msg-bot'">
            <div v-if="item.role !== 'user'" class="msg-avatar"><NavIcon name="peacecat" /></div>
            <div class="msg-content">
              <div class="msg-bubble" v-html="item.html"></div>
              <div v-if="item.suggestedTask" class="msg-suggestion" @click="goToTask(item.suggestedTask.id)">
                <span class="msg-suggestion-icon"><NavIcon name="tasks" /></span>
                <div class="msg-suggestion-info">
                  <div class="msg-suggestion-title">{{ item.suggestedTask.title }}</div>
                  <div class="msg-suggestion-meta">{{ t('moodChat.chat.minutesUnit', { n: item.suggestedTask.duration_minutes || 0 }) }}</div>
                </div>
              </div>
              <div v-if="item.suggestedExpert" class="msg-suggestion" @click="router.push('/experts')">
                <span class="msg-suggestion-icon"><NavIcon name="experts" /></span>
                <div class="msg-suggestion-info">
                  <div class="msg-suggestion-title">{{ item.suggestedExpert.name }}</div>
                  <div class="msg-suggestion-meta">{{ item.suggestedExpert.degree || t('moodChat.chat.defaultExpertDegree') }} · ★ {{ item.suggestedExpert.rating || '?' }}/5</div>
                </div>
              </div>
              <div class="msg-time">{{ item.time }}</div>
            </div>
          </div>
          <div v-if="isTyping" class="msg msg-bot">
            <div class="msg-avatar"><NavIcon name="peacecat" /></div>
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
          <button class="voice-btn" :class="{ recording: isRecording }" :title="t('moodChat.chat.voiceTitle')" @click="toggleVoice"><NavIcon name="mic" /></button>
          <div class="input-wrap">
            <textarea
              class="chat-input"
              :placeholder="isCompact ? t('moodChat.chat.inputPlaceholderShort') : t('moodChat.chat.inputPlaceholder')"
              rows="1"
              ref="chatInputEl"
              v-model="chatInputValue"
              @keydown="handleKey"
              @input="handleInputResize"
            ></textarea>
            <span class="char-count">{{ chatInputValue.length }}/{{ MAX_MESSAGE_LENGTH }}</span>
          </div>
          <button class="send-btn" :title="t('moodChat.chat.sendTitle')" @click="sendMessage"><NavIcon name="send" /></button>
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
            >{{ keyword }}</div>
          </div>
        </div>

        <!-- Mood Portrait -->
        <div class="paper-card portrait-card">
          <div class="portrait-title">{{ t('moodChat.sidebar.portraitTitle') }}</div>
          <div class="portrait-bars">
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.emotionLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.emotion + '%', background: '#6F8F5E' }"></div></div>
            </div>
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.physicalLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.physical + '%', background: '#8FB3C7' }"></div></div>
            </div>
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.socialLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.social + '%', background: '#B4A4C8' }"></div></div>
            </div>
            <div class="pb-item"><span class="pb-label">{{ t('moodChat.sidebar.cognitiveLabel') }}</span>
              <div class="pb-bar"><div class="pb-fill" :style="{ width: analysis.cognitive + '%', background: '#D9A27A' }"></div></div>
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
              <img v-if="taskThumbSrc(task) && !brokenTaskImages.has(task.id)" :src="taskThumbSrc(task)" alt="" class="ts-thumb" loading="lazy" @error="brokenTaskImages.add(task.id)">
              <div v-else class="ts-thumb ts-thumb-empty"><NavIcon name="tasks" /></div>
              <div class="ts-info">
                <div class="ts-name">{{ task.title || t('moodChat.result.taskDefaultTitle') }}</div>
                <div v-if="task.duration_minutes" class="ts-meta">{{ t('moodChat.chat.minutesUnit', { n: task.duration_minutes }) }}<template v-if="task.xp_reward"> · +{{ task.xp_reward }} XP</template></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Safety Note -->
        <div class="paper-card cs-card cs-safety">
          <div class="cs-title">{{ t('moodChat.sidebar.safetyTitle') }}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.6;margin-bottom:8px;" v-html="t('moodChat.sidebar.safetyText')"></div>
          <button class="emergency-btn-side" style="width:100%;justify-content:center;" @click="showEmergency">{{ t('moodChat.sidebar.safetyBtn') }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import AiNotice from '../components/AiNotice.vue';
import NavIcon from '../components/NavIcon.vue';
import { taskThumbSrc } from '../lib/taskImages';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const { t, tm, locale } = useI18n();

// Lưu cuộc trò chuyện đang mở trên thiết bị (theo từng tài khoản) để đóng tab/app không mất.
// Bản lưu lâu dài + xem trên mọi thiết bị nằm ở server (mã hoá) — xem ai.chat-history.js.
const storageKey = () => `peaceflow_mood_chat_state_v2:${auth.user?.id || 'anon'}`;
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONVERSATION_ITEMS = 200;
const sessionId = ref(null);
const storageEnabled = ref(false);

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
  try {
    localStorage.setItem(storageKey(), JSON.stringify({
      conversation: conversation.value.slice(-MAX_CONVERSATION_ITEMS),
      analysis: { ...analysis },
      keywords: keywords.value,
      sessionId: sessionId.value
    }));
  } catch (_e) { /* bộ nhớ đầy / chế độ riêng tư: bỏ qua, server vẫn giữ bản lưu nếu đã đồng ý */ }
}

function loadConversation() {
  try {
    sessionStorage.removeItem('peaceflow_mood_chat_state_v1'); // bản cũ chỉ sống trong 1 tab
    const raw = localStorage.getItem(storageKey());
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    conversation.value = Array.isArray(parsed.conversation) ? parsed.conversation : [];
    sessionId.value = typeof parsed.sessionId === 'string' ? parsed.sessionId : null;
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
// Trang chat ẩn thanh trên/dưới chung của app → trên điện thoại mở sidebar bằng nút menu riêng
const moreOpen = ref(false);
function closeMoreMenu(e) { if (e.type === 'click' || e.key === 'Escape') moreOpen.value = false; }
if (typeof window !== 'undefined') {
  window.addEventListener('click', closeMoreMenu);
  window.addEventListener('keydown', closeMoreMenu);
}
onBeforeUnmount(() => {
  window.removeEventListener('click', closeMoreMenu);
  window.removeEventListener('keydown', closeMoreMenu);
});
function openAppMenu() { window.dispatchEvent(new CustomEvent('peaceflow:open-sidebar')); }
const brokenTaskImages = reactive(new Set()); // ảnh lỗi → hiện icon thay thế

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

// Điện thoại / màn hẹp: dòng gợi ý ngắn (không cần nhắc phím Enter / Shift+Enter)
const compactMq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 600px), (hover: none) and (pointer: coarse)') : null;
const isCompact = ref(Boolean(compactMq?.matches));
compactMq?.addEventListener?.('change', (e) => { isCompact.value = e.matches; });

function handleInputResize() {
  const value = String(chatInputValue.value || '').slice(0, MAX_MESSAGE_LENGTH);
  if (value !== chatInputValue.value) chatInputValue.value = value;
  nextTick(() => {
    const input = chatInputEl.value;
    if (!input) return;
    // Ô trống: luôn 1 dòng (không để dòng gợi ý dài kéo ô cao lên)
    if (!input.value) { input.style.height = ''; return; }
    input.style.height = 'auto';
    // scrollHeight không gồm viền → cộng thêm viền, nếu không ô 1 dòng cũng hiện thanh cuộn
    const border = input.offsetHeight - input.clientHeight;
    input.style.height = `${Math.min(input.scrollHeight + border, 180)}px`;
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

    const res = await apiClient.post('/ai/chat', { message: text, history, session_id: sessionId.value });
    hideTyping();
    if (res?.session_id) sessionId.value = res.session_id;
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
  try { localStorage.removeItem(storageKey()); } catch (_e) { /* bỏ qua */ }
  sessionId.value = null;
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
  { key: 'anxiety', label: t('moodChat.scoreLabels.anxiety'), value: analysis.anxiety, level: scoreLevel(analysis.anxiety, { good: 35, medium: 65 }), levelLabel: scoreLevelLabel(analysis.anxiety, { good: 35, medium: 65 }) },
  { key: 'stress', label: t('moodChat.scoreLabels.stress'), value: analysis.stress, level: scoreLevel(analysis.stress, { good: 35, medium: 65 }), levelLabel: scoreLevelLabel(analysis.stress, { good: 35, medium: 65 }) },
  { key: 'mood', label: t('moodChat.scoreLabels.mood'), value: analysis.mood, level: analysis.mood >= 65 ? 'good' : analysis.mood >= 35 ? 'medium' : 'bad', levelLabel: analysis.mood >= 65 ? t('moodChat.scoreLevels.positive') : analysis.mood >= 35 ? t('moodChat.scoreLevels.medium') : t('moodChat.scoreLevels.needsAttention') },
  { key: 'depression', label: t('moodChat.scoreLabels.depression'), value: analysis.depression, level: scoreLevel(analysis.depression, { good: 35, medium: 65 }), levelLabel: scoreLevelLabel(analysis.depression, { good: 35, medium: 65 }) }
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

// ===== Lịch sử trò chuyện =====
const historyOpen = ref(false);
const historyLoading = ref(false);
const historyError = ref(false);
const historySessions = ref([]);

function formatHistoryDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));
}

async function fetchSessions() {
  const data = await apiClient.get('/ai/chat/sessions', { noCache: true });
  storageEnabled.value = !!data?.storage_enabled;
  historySessions.value = Array.isArray(data?.sessions) ? data.sessions : [];
  return historySessions.value;
}

async function openHistory() {
  historyOpen.value = true;
  historyLoading.value = true;
  historyError.value = false;
  try { await fetchSessions(); } catch (_e) { historyError.value = true; } finally { historyLoading.value = false; }
}

function timeLabelOf(value) {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Mở một cuộc trò chuyện đã lưu: hiện lại toàn bộ tin nhắn, gửi tiếp sẽ nối vào đúng cuộc đó.
async function loadSession(id) {
  const data = await apiClient.get(`/ai/chat/sessions/${id}`, { noCache: true });
  if (!data) return false;
  const items = (data.messages || []).map((m) => ({
    role: m.role,
    text: m.text,
    html: escapeHtml(m.text).replace(/\n/g, '<br>'),
    time: timeLabelOf(m.created_at),
    suggestedTask: m.meta?.suggested_task
      ? { ...m.meta.suggested_task, title: (locale.value === 'en' && m.meta.suggested_task.title_en) || m.meta.suggested_task.title }
      : null,
    suggestedExpert: m.meta?.suggested_expert || null,
    offeredTask: Boolean(m.meta?.offered_task)
  }));
  sessionId.value = data.id;
  conversation.value = [];
  addMessage('bot', '', { html: buildWelcomeMessage(), time: t('moodChat.welcome.justNow') });
  conversation.value = [...conversation.value, ...items].slice(-MAX_CONVERSATION_ITEMS);
  renderConversation();
  saveConversation();
  return true;
}

async function openSession(id) {
  try {
    await loadSession(id);
    historyOpen.value = false;
  } catch (_e) {
    historyError.value = true;
  }
}

async function removeSession(id) {
  if (!window.confirm(t('chatHistory.confirmDelete'))) return;
  try {
    await apiClient.delete(`/ai/chat/sessions/${id}`);
    historySessions.value = historySessions.value.filter((s) => s.id !== id);
    if (sessionId.value === id) clearChat();
  } catch (_e) {
    historyError.value = true;
  }
}

async function removeAllSessions() {
  if (!window.confirm(t('chatHistory.confirmDeleteAll'))) return;
  try {
    await apiClient.delete('/ai/chat/sessions');
    historySessions.value = [];
    clearChat();
  } catch (_e) {
    historyError.value = true;
  }
}

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
  // Thiết bị này chưa có cuộc trò chuyện nào (máy mới, đã xoá dữ liệu, đăng nhập lại...):
  // mở lại cuộc gần nhất đã lưu trên server.
  try {
    const sessions = await fetchSessions();
    if (!hasStoredConversation && sessions.length) await loadSession(sessions[0].id);
  } catch (_e) { /* không có lịch sử server thì giữ màn chào */ }

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

<style scoped>
.chat-ai-notice { align-self: center; max-width: 560px; text-align: center; margin: 0 auto 12px; padding: 0 12px; }

/* ===== Đồng bộ giao diện với Dashboard: nền kem, thẻ trắng bo 20px không viền + bóng mềm,
   màu nhấn sage #6F8F5E, tiêu đề Nunito, nội dung Inter, nút phẳng dạng viên thuốc ===== */
.mood-chat-page { --pc-accent: #6F8F5E; --pc-accent-soft: #E4ECDD; --pc-line: rgba(74, 55, 40, 0.1); font-family: var(--font-body); }
.mood-chat-page.main-content { background: var(--color-canvas); }

/* Thanh trên */
.chat-topbar { background: var(--color-canvas); border-bottom: 1px solid var(--pc-line); box-shadow: none; }
.ct-mascot { border: none; background: var(--pc-accent-soft); box-shadow: none; }
/* Thanh trên tối giản: [menu (điện thoại)] [mèo] [tên + trạng thái] ……… [SOS] [⋯] */
.chat-topbar { gap: 12px; }
.ct-actions, .ct-mobile-actions, .ct-back { display: none !important; }
.ct-info { flex: 1; min-width: 0; }
.ct-name, .ct-status { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-right { display: flex; align-items: center; gap: 8px; flex: none; }
.ct-icon-btn { display: flex; flex: none; width: 40px; height: 40px; align-items: center; justify-content: center; border: none; border-radius: 50%; background: rgba(255, 255, 255, 0.85); color: var(--color-text-muted); box-shadow: 0 2px 8px rgba(80, 70, 50, 0.06); cursor: pointer; }
.ct-icon-btn:hover, .ct-icon-btn.is-open { background: var(--pc-accent-soft); color: var(--pc-accent); }
.ct-icon-btn .nav-icon { width: 20px; height: 20px; }
.ct-menu { display: none; }
.ct-sos { flex: none; min-width: 44px; height: 40px; padding: 0 14px; border: none; border-radius: 999px; background: var(--color-danger); color: #fff; font-family: var(--font-heading); font-size: 13px; font-weight: 800; letter-spacing: 0.02em; cursor: pointer; }
.ct-sos:hover { filter: brightness(0.94); }
.ct-more { position: relative; }
.ct-menu-pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: 30; min-width: 210px; padding: 6px; border-radius: 16px; background: var(--color-surface); box-shadow: 0 12px 32px rgba(80, 70, 50, 0.16); }
.ct-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 0 12px; border: none; border-radius: 10px; background: transparent; color: var(--color-text); font-family: var(--font-body); font-size: 14px; font-weight: 500; text-align: left; cursor: pointer; }
.ct-menu-item:hover { background: var(--pc-accent-soft); color: var(--pc-accent); }
.ct-menu-item .nav-icon { width: 18px; height: 18px; color: var(--color-text-muted); }
.ct-menu-item:hover .nav-icon { color: var(--pc-accent); }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .ct-menu { display: flex; }
  .ct-mobile-emergency { display: none !important; }
}
@media (max-width: 600px) {
  .chat-topbar { gap: 8px; padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 8px; position: sticky; top: 0; z-index: 5; }
  .mood-chat-page.main-content { padding-top: 0; }
  .ct-mascot { width: 36px; height: 36px; flex: none; }
  .ct-mascot .nav-icon { width: 20px; height: 20px; }
  .ct-name { font-size: 15px; }
  .ct-status { font-size: 11px; }
  .ct-icon-btn { width: 38px; height: 38px; }
  .ct-sos { height: 38px; min-width: 38px; padding: 0 10px; font-size: 11px; }
  .chat-messages { padding: 12px; }
  .msg-bubble { font-size: 14px; }
  .chat-input-area { gap: 8px; padding: 8px 10px calc(10px + env(safe-area-inset-bottom, 0px)); }
  .chat-input { font-size: 16px; } /* ≥16px: iOS không tự phóng to khi bấm vào ô nhập */
  .voice-btn, .send-btn { width: 40px; height: 40px; flex: none; }
  .quick-replies-area { padding: 6px 10px; gap: 6px; }
}
.ct-mascot, .msg-avatar, .rp-mascot { display: flex; align-items: center; justify-content: center; color: var(--pc-accent); }
.ct-mascot .nav-icon { width: 24px; height: 24px; }
.msg-avatar .nav-icon { width: 18px; height: 18px; }
.rp-mascot .nav-icon { width: 34px; height: 34px; }
.msg-suggestion-icon { display: flex; color: var(--pc-accent); }
.msg-suggestion-icon .nav-icon { width: 20px; height: 20px; }
.send-btn, .voice-btn { display: flex; align-items: center; justify-content: center; }
.send-btn .nav-icon, .voice-btn .nav-icon { width: 20px; height: 20px; }
.voice-btn { color: var(--color-text-muted); }
.voice-btn.recording { color: var(--color-danger); }
.chh-x, .chh-del { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
.chh-x .nav-icon, .chh-del .nav-icon { width: 18px; height: 18px; }
.chh-del:hover { color: var(--color-danger); }
.ct-name { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.ct-status { color: var(--pc-accent); }
.ct-actions .badge-pill { border: none; background: var(--pc-accent-soft); color: var(--pc-accent); font-weight: 600; }

/* Khung chat */
.chat-body { background: var(--color-canvas); }
.chat-main { background: transparent; border-right: none; }
.msg-avatar { border: none; background: var(--pc-accent-soft); box-shadow: none; }
.msg-bubble { font-family: var(--font-body); font-size: 14.5px; line-height: 1.6; box-shadow: none; }
.msg-bot .msg-bubble { background: var(--color-surface); border: none; border-radius: 4px 20px 20px 20px; color: var(--color-text); box-shadow: 0 6px 20px rgba(80, 70, 50, 0.07); }
.msg-user .msg-bubble { background: var(--pc-accent); border: none; border-radius: 20px 4px 20px 20px; color: #fff; }
.msg-time { color: var(--color-text-subtle); }
.msg-suggestion { border: none; border-radius: 14px; background: var(--color-surface); box-shadow: 0 2px 10px rgba(80, 70, 50, 0.06); }
.msg-suggestion:hover { background: var(--pc-accent-soft); transform: none; }

/* Gợi ý nhanh + ô nhập */
.quick-replies-area { background: transparent; border-top: none; }
.qr-btn { min-height: 36px; border: 1px solid var(--pc-line); border-radius: 999px; background: var(--color-surface); color: var(--color-text-muted); font-family: var(--font-body); font-size: 13px; font-weight: 500; box-shadow: none; }
.qr-btn:hover { border-color: transparent; background: var(--pc-accent-soft); color: var(--pc-accent); transform: none; }
.chat-input-area { background: var(--color-canvas); border-top: 1px solid var(--pc-line); }
.chat-input::placeholder { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-input { border: 1px solid var(--pc-line); border-radius: 16px; background: var(--color-surface); font-family: var(--font-body); box-shadow: none; padding-right: 64px; scrollbar-width: thin; }
.chat-input:focus { border-color: var(--pc-accent); box-shadow: 0 0 0 3px var(--pc-accent-soft); }
.send-btn { width: 44px; height: 44px; border: none; background: var(--pc-accent); color: #fff; box-shadow: 0 4px 12px rgba(79, 122, 90, 0.25); }
.send-btn:hover { background: var(--pc-accent); filter: brightness(0.94); transform: none; }
.voice-btn { width: 44px; height: 44px; border: none; background: var(--color-surface); box-shadow: 0 2px 8px rgba(80, 70, 50, 0.06); }
.voice-btn:hover { background: var(--pc-accent-soft); }

/* Cột phân tích bên phải: thẻ như cột phải Dashboard */
.chat-sidebar { background: linear-gradient(180deg, #EEF1EA 0%, #F7F1E6 38%, #FBF6EE 100%); border-left: none; }
.chat-sidebar .paper-card, .chat-sidebar .cs-card, .chat-sidebar .portrait-card { border: none; border-radius: 20px; background: rgba(255, 253, 247, 0.92); box-shadow: 0 6px 20px rgba(80, 70, 50, 0.07); }
.chat-sidebar .paper-card::before, .chat-sidebar .paper-card::after { display: none; }
.cs-title, .portrait-title { font-family: var(--font-heading); font-size: 15px; font-weight: 700; color: var(--color-text); }
.sb-label, .pb-label { color: var(--color-text-muted); }
.sb-bar, .pb-bar { height: 6px; background: rgba(74, 55, 40, 0.08); border: none; }
.sb-mood { background: var(--pc-accent); }
.kw-tag { padding: 4px 10px; border: none; border-radius: 999px; font-size: 12px; font-weight: 600; }
.kw-tag.pos { background: var(--pc-accent-soft); color: var(--pc-accent); }
.kw-tag.neg { background: #F6E3DC; color: #A65A44; }
.portrait-card .btn-primary { border: none; border-radius: 999px; background: var(--pc-accent); color: #fff; box-shadow: none; }
.task-suggest { border: none; border-radius: 14px; background: var(--color-canvas); }
.ts-thumb { flex: none; width: 48px; height: 48px; border-radius: 12px; object-fit: cover; display: block; background: var(--pc-accent-soft); }
.ts-thumb-empty { display: flex; align-items: center; justify-content: center; color: var(--pc-accent); }
.ts-thumb-empty .nav-icon { width: 22px; height: 22px; }
.ts-info { min-width: 0; }
.rp-task-item { display: flex; align-items: center; gap: 10px; }
.task-suggest:hover { background: var(--pc-accent-soft); border-color: transparent; }
.ts-icon { border: none; background: var(--pc-accent-soft); }
.cs-safety .cs-title { color: var(--color-danger); }
.cs-safety .emergency-btn-side { border: none; border-radius: 999px; background: #FBE7E4; color: var(--color-danger); min-height: 40px; }
.chat-history-overlay { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(74, 55, 40, 0.35); }
.chat-history { display: flex; flex-direction: column; width: 100%; max-width: 520px; max-height: min(80vh, 720px); border-radius: 16px; background: var(--color-surface, #fff); box-shadow: 0 24px 60px rgba(74, 55, 40, 0.22); overflow: hidden; font-family: var(--font-body); }
.chh-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 10px 10px 18px; border-bottom: 1px solid var(--color-border, #eadfce); }
.chh-head strong { font-family: var(--font-heading); font-size: 16px; color: var(--color-text); }
.chh-x { width: 44px; height: 44px; border: none; border-radius: 50%; background: transparent; color: var(--color-text-muted); font-size: 18px; cursor: pointer; }
.chh-x:hover { background: var(--color-surface-muted, #f4eee6); }
.chh-body { padding: 12px 16px 16px; overflow-y: auto; }
.chh-note { margin: 0 0 10px; font-size: 13px; color: var(--color-text-muted); }
.chh-warn { margin: 0 0 12px; padding: 10px 12px; border-radius: 10px; background: var(--color-caution-soft, #fff3e0); font-size: 13px; line-height: 1.5; color: var(--color-text); }
.chh-warn a { margin-left: 4px; font-weight: 700; color: var(--color-brand, #6F8F5E); }
.chh-item { display: flex; align-items: center; gap: 6px; border-radius: 12px; }
.chh-item + .chh-item { margin-top: 4px; }
.chh-item.is-current { background: var(--color-surface-muted, #f4eee6); }
.chh-open { flex: 1; min-width: 0; min-height: 52px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px 10px; border: none; border-radius: 12px; background: transparent; text-align: left; font: inherit; cursor: pointer; }
.chh-open:hover { background: var(--color-surface-muted, #f4eee6); }
.chh-title { width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 600; color: var(--color-text); }
.chh-meta { font-size: 12px; color: var(--color-text-muted); }
.chh-del { flex: none; width: 44px; height: 44px; border: none; border-radius: 50%; background: transparent; cursor: pointer; }
.chh-del:hover { background: var(--color-danger-soft, #fde8e6); }
.chh-del-all { margin-top: 12px; min-height: 40px; padding: 0 14px; border: none; border-radius: 999px; background: transparent; color: var(--color-danger, #c0504a); font: 600 13px var(--font-body); cursor: pointer; }
.chh-del-all:hover { background: var(--color-danger-soft, #fde8e6); }
@media (max-width: 600px) { .chat-history-overlay { align-items: flex-end; padding: 0; } .chat-history { max-height: 88vh; border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); } }
</style>
