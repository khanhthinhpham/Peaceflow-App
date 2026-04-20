/**
 * ============================================================
 * PeaceFlow — Main JavaScript (app.js)
 * Paper Craft Stop Motion Mental Health Platform
 * Version: 1.0.0
 *
 * TABLE OF CONTENTS:
 * 01. App Configuration & Constants
 * 02. State Management (LocalStorage)
 * 03. User Profile & Auth
 * 04. Navigation & Sidebar
 * 05. Toast Notifications
 * 06. Modal System
 * 07. Emergency Safety System
 * 08. Mood Check-in Module
 * 09. Gamification (XP, Levels, Badges, Streaks)
 * 10. Task System
 * 11. Breathing Exercise Engine
 * 12. Meditation Timer
 * 13. Journal Module
 * 14. Community Module
 * 15. Report & Charts
 * 16. Settings Module
 * 17. Confetti & Animations
 * 18. Utility Helpers
 * 19. App Initialization
 * ============================================================
 */

'use strict';

/* ============================================================
   01. APP CONFIGURATION & CONSTANTS
============================================================ */
const PeaceFlow = {
  version: '1.0.0',
  appName: 'PeaceFlow',
  hotline: '1800-599-920',
  emergencyNumber: '115',

  // XP thresholds per level
  LEVELS: [
    { level: 1, title: 'Người Bắt Đầu',       minXP: 0,    maxXP: 100  },
    { level: 2, title: 'Người Khám Phá',       minXP: 100,  maxXP: 300  },
    { level: 3, title: 'Người Kiên Cường',     minXP: 300,  maxXP: 600  },
    { level: 4, title: 'Người Truyền Cảm Hứng',minXP: 600,  maxXP: 1000 },
    { level: 5, title: 'Bậc Thầy Bình Yên',   minXP: 1000, maxXP: Infinity },
  ],

  // Badge definitions
  BADGES: [
    { id: 'first_task',   icon: '🌱', name: 'Mầm Non',         condition: 'Hoàn thành nhiệm vụ đầu tiên' },
    { id: 'streak_7',     icon: '🌿', name: 'Cây Con',          condition: '7 ngày streak liên tục' },
    { id: 'streak_30',    icon: '🌳', name: 'Cây Lớn',          condition: '30 ngày streak liên tục' },
    { id: 'meditate_10',  icon: '🧘', name: 'Thiền Sư Giấy',    condition: 'Thiền 10 lần' },
    { id: 'hard_5',       icon: '💪', name: 'Chiến Binh',       condition: 'Hoàn thành 5 nhiệm vụ khó' },
    { id: 'kind_10',      icon: '❤️', name: 'Người Tử Tế',      condition: '10 hành động tử tế' },
    { id: 'crisis_over',  icon: '🏔️', name: 'Người Leo Núi',    condition: 'Vượt qua khủng hoảng' },
    { id: 'xp_500',       icon: '🌟', name: 'Ngôi Sao',         condition: 'Tích lũy 500 XP' },
  ],

  // Warning keywords (Module 6 — Safety)
  WARNING_KEYWORDS: [
    'tự tử', 'muốn chết', 'không muốn sống', 'kết thúc tất cả',
    'tự hại', 'cắt tay', 'uống thuốc ngủ', 'tuyệt vọng',
    'không còn ý nghĩa', 'biến mất', 'chấm dứt',
  ],

  // Motivational messages
  MOTIVATIONAL_MESSAGES: [
    'Ai cũng gặp stress ở một mức độ nào đó. Bạn không hề đơn độc. 🌿',
    'Rồi chuyện này sẽ qua. Hãy bình tâm. 💚',
    'Hạnh phúc của bạn được tạo ra bởi chính bạn. ✨',
    'Mỗi hơi thở là một khởi đầu mới. 🌸',
    'Bạn đang làm rất tốt — từng bước nhỏ thôi nhé. 🐱',
    'Không hoàn hảo mới là hoàn hảo. 🌱',
  ],

  // PeaceCat AI messages
  PeaceCat_MESSAGES: [
    '"Mình ở đây bên bạn. Hãy thở chậm lại — bạn đang làm rất tốt! 💚"',
    '"Cảm xúc của bạn hoàn toàn hợp lệ. Hãy để mình đồng hành cùng bạn. 🌿"',
    '"Bạn không cần phải mạnh mẽ một mình. Nhận sự giúp đỡ là dũng cảm nhất. ❤️"',
    '"Từng hơi thở là một bước nhỏ về phía bình yên. 🌸"',
  ],
};

/* ============================================================
   02. STATE MANAGEMENT (LocalStorage)
============================================================ */
const Store = {
  PREFIX: 'PeaceFlow_',

  get(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },

  // Default user state
  getUser() {
    return this.get('user') || {
      name: 'Minh Anh',
      avatar: '🐱',
      level: 2,
      xp: 295,
      streak: 7,
      lastActive: new Date().toDateString(),
      badges: ['first_task', 'streak_7', 'meditate_10'],
      tasksCompleted: 47,
      meditationCount: 12,
      kindnessCount: 3,
      hardTasksCount: 1,
      journalCount: 23,
    };
  },

  saveUser(userData) {
    this.set('user', userData);
  },

  getMoodHistory() {
    return this.get('mood_history') || [];
  },

  addMoodEntry(entry) {
    const history = this.getMoodHistory();
    history.unshift({ ...entry, id: Date.now(), timestamp: new Date().toISOString() });
    this.set('mood_history', history.slice(0, 365)); // keep 1 year
  },

  getSettings() {
    return this.get('settings') || {
      notifications: { master: true, morning: true, evening: true, tasks: true, streak: true, achievements: true },
      morningTime: '08:00',
      eveningTime: '21:30',
      theme: 'paper',
      fontSize: 'medium',
      animations: true,
      sounds: true,
      language: 'vi',
      aiStyle: 'friendly',
      aiInsights: true,
      aiTaskSuggestions: true,
      journalAnalysis: true,
      privacy: { shareData: false, anonymousAnalytics: true },
    };
  },

  saveSettings(settings) {
    this.set('settings', settings);
  },
};

/* ============================================================
   03. USER PROFILE & AUTH
============================================================ */
const UserModule = {
  current: null,

  init() {
    this.current = Store.getUser();
    this.updateStreak();
    this.renderUserInfo();
  },

  updateStreak() {
    const today = new Date().toDateString();
    const user = this.current;
    if (user.lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (user.lastActive === yesterday) {
        user.streak = (user.streak || 0) + 1;
      } else if (user.lastActive !== today) {
        // streak broken — don't reset, just note
      }
      user.lastActive = today;
      Store.saveUser(user);
    }
  },

  getLevelInfo(xp) {
    for (let i = PeaceFlow.LEVELS.length - 1; i >= 0; i--) {
      if (xp >= PeaceFlow.LEVELS[i].minXP) return PeaceFlow.LEVELS[i];
    }
    return PeaceFlow.LEVELS[0];
  },

  getXPProgress(xp) {
    const lvl = this.getLevelInfo(xp);
    if (lvl.maxXP === Infinity) return 100;
    const range = lvl.maxXP - lvl.minXP;
    const progress = xp - lvl.minXP;
    return Math.min(100, Math.round((progress / range) * 100));
  },

  addXP(amount, reason = '') {
    const user = Store.getUser();
    const oldLevel = this.getLevelInfo(user.xp).level;
    user.xp += amount;
    const newLevel = this.getLevelInfo(user.xp).level;
    Store.saveUser(user);
    this.current = user;

    // Show XP animation
    AnimationModule.showXPGain(amount);

    // Level up check
    if (newLevel > oldLevel) {
      const lvlInfo = this.getLevelInfo(user.xp);
      setTimeout(() => {
        Toast.show(`🎉 Chúc mừng! Bạn lên Level ${newLevel} — ${lvlInfo.title}!`, 4000);
        AnimationModule.triggerConfetti();
      }, 800);
    }

    // Badge checks
    BadgeModule.checkAll(user);
    this.renderUserInfo();
    return user.xp;
  },

  renderUserInfo() {
    const user = this.current || Store.getUser();
    const lvl = this.getLevelInfo(user.xp);
    const progress = this.getXPProgress(user.xp);

    // Update all XP displays on page
    document.querySelectorAll('[data-xp]').forEach(el => {
      el.textContent = `⭐ ${user.xp} XP`;
    });
    document.querySelectorAll('[data-level]').forEach(el => {
      el.textContent = `Level ${lvl.level} — ${lvl.title}`;
    });
    document.querySelectorAll('[data-xp-bar]').forEach(el => {
      el.style.width = progress + '%';
    });
    document.querySelectorAll('[data-streak]').forEach(el => {
      el.textContent = `🔥 ${user.streak} ngày`;
    });
  },
};

/* ============================================================
   04. NAVIGATION & SIDEBAR
============================================================ */
const NavModule = {
  sidebarOpen: false,

  init() {
    this.bindEvents();
    this.highlightCurrentPage();
  },

  bindEvents() {
    // Mobile menu button
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', () => this.toggleSidebar());

    // Overlay click to close
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.addEventListener('click', () => this.closeSidebar());

    // Keyboard: Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
        ModalModule.closeAll();
      }
    });
  },

  toggleSidebar() {
    this.sidebarOpen ? this.closeSidebar() : this.openSidebar();
  },

  openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    this.sidebarOpen = true;
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    this.sidebarOpen = false;
  },

  highlightCurrentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href && href === path) {
        item.classList.add('active');
      }
    });
  },

  // Tab switching (used across multiple pages)
  switchTab(tabId, panelPrefix = 'panel', tabPrefix = 'tab') {
    document.querySelectorAll(`[id^="${tabPrefix}-"]`).forEach(t => t.classList.remove('active'));
    document.querySelectorAll(`[id^="${panelPrefix}-"]`).forEach(p => p.classList.remove('active'));
    const tab = document.getElementById(`${tabPrefix}-${tabId}`);
    const panel = document.getElementById(`${panelPrefix}-${tabId}`);
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
  },
};

// Global shorthand functions for inline HTML usage
function toggleSidebar() { NavModule.toggleSidebar(); }
function closeSidebar()   { NavModule.closeSidebar(); }
function switchTab(id, pp, tp) { NavModule.switchTab(id, pp, tp); }

/* ============================================================
   05. TOAST NOTIFICATIONS
============================================================ */
const Toast = {
  queue: [],
  showing: false,
  timeout: null,

  show(message, duration = 3000, type = 'success') {
    this.queue.push({ message, duration, type });
    if (!this.showing) this._next();
  },

  _next() {
    if (!this.queue.length) { this.showing = false; return; }
    this.showing = true;
    const { message, duration, type } = this.queue.shift();
    const el = document.getElementById('toast');
    const textEl = document.getElementById('toastText');
    if (!el) return;

    if (textEl) textEl.textContent = message;
    else el.textContent = message;

    el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
    el.classList.add('show');

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => this._next(), 400);
    }, duration);
  },

  error(msg) { this.show(msg, 4000, 'error'); },
};

// Global shorthand
function showToast(msg, duration) { Toast.show(msg, duration); }

/* ============================================================
   06. MODAL SYSTEM
============================================================ */
const ModalModule = {
  stack: [],

  open(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.add('show');
      this.stack.push(overlayId);
      document.body.style.overflow = 'hidden';
    }
  },

  close(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.classList.remove('show');
    this.stack = this.stack.filter(id => id !== overlayId);
    if (!this.stack.length) document.body.style.overflow = '';
  },

  closeAll() {
    this.stack.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
    this.stack = [];
    document.body.style.overflow = '';
  },

  // Close when clicking overlay background
  handleOverlayClick(event, overlayId) {
    if (event.target.id === overlayId) this.close(overlayId);
  },
};

/* ============================================================
   07. EMERGENCY SAFETY SYSTEM (Module 6)
============================================================ */
const EmergencyModule = {
  triggered: false,

  init() {
    // Bind emergency buttons
    document.querySelectorAll('[data-emergency-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); this.show(); });
    });
  },

  show() {
    ModalModule.open('emergencyOverlay');
    this.triggered = true;
  },

  hide() {
    ModalModule.close('emergencyOverlay');
  },

  // Scan text for warning keywords (Module 6.1)
  scanText(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return PeaceFlow.WARNING_KEYWORDS.some(kw => lower.includes(kw));
  },

  // Check and trigger if needed
  checkAndTrigger(text) {
    if (this.scanText(text)) {
      setTimeout(() => this.show(), 500);
      return true;
    }
    return false;
  },
};

// Global shorthand
function showEmergency() { EmergencyModule.show(); }
function closeEmergency() { EmergencyModule.hide(); }

/* ============================================================
   08. MOOD CHECK-IN MODULE
============================================================ */
const MoodModule = {
  selectedMood: null,
  selectedLevel: 5,
  selectedTags: new Set(),

  MOODS: [
    { emoji: '😊', label: 'Rất vui',        score: 9 },
    { emoji: '😌', label: 'Thoải mái',      score: 7 },
    { emoji: '😐', label: 'Bình thường',    score: 5 },
    { emoji: '😟', label: 'Hơi căng',       score: 4 },
    { emoji: '😰', label: 'Rất căng thẳng', score: 2 },
    { emoji: '😢', label: 'Buồn bã',        score: 2 },
    { emoji: '😡', label: 'Tức giận',       score: 2 },
  ],

  TAGS: ['Công việc', 'Gia đình', 'Tình cảm', 'Tài chính', 'Sức khỏe', 'Cô đơn', 'Mất ngủ', 'Không rõ'],

  selectMood(index) {
    this.selectedMood = this.MOODS[index];
    document.querySelectorAll('.mood-option').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
  },

  toggleTag(tag) {
    if (this.selectedTags.has(tag)) this.selectedTags.delete(tag);
    else this.selectedTags.add(tag);
    document.querySelectorAll('.mood-tag').forEach(el => {
      el.classList.toggle('active', this.selectedTags.has(el.dataset.tag));
    });
  },

  save(note = '') {
    if (!this.selectedMood) {
      Toast.error('Vui lòng chọn tâm trạng trước nhé! 😊');
      return false;
    }
    const entry = {
      mood: this.selectedMood,
      level: this.selectedLevel,
      tags: [...this.selectedTags],
      note,
      date: new Date().toLocaleDateString('vi-VN'),
    };
    Store.addMoodEntry(entry);
    UserModule.addXP(5, 'mood_checkin');
    Toast.show('✅ Đã lưu tâm trạng hôm nay! +5 XP 🌿');

    // Check if mood score is low → suggest emergency
    if (this.selectedMood.score <= 2) {
      setTimeout(() => {
        Toast.show('💚 Bạn đang không ổn — hãy thử bài tập thở nhé.', 4000);
      }, 1500);
    }
    return true;
  },
};

/* ============================================================
   09. GAMIFICATION (XP, LEVELS, BADGES, STREAKS)
============================================================ */
const BadgeModule = {
  checkAll(user) {
    const earned = user.badges || [];
    const newBadges = [];

    const check = (id, condition) => {
      if (condition && !earned.includes(id)) {
        earned.push(id);
        newBadges.push(id);
      }
    };

    check('first_task',  user.tasksCompleted >= 1);
    check('streak_7',    user.streak >= 7);
    check('streak_30',   user.streak >= 30);
    check('meditate_10', user.meditationCount >= 10);
    check('hard_5',      user.hardTasksCount >= 5);
    check('kind_10',     user.kindnessCount >= 10);
    check('xp_500',      user.xp >= 500);

    if (newBadges.length) {
      user.badges = earned;
      Store.saveUser(user);
      newBadges.forEach(id => {
        const badge = PeaceFlow.BADGES.find(b => b.id === id);
        if (badge) {
          setTimeout(() => {
            Toast.show(`🏅 Huy hiệu mới: ${badge.icon} ${badge.name}!`, 4000);
            AnimationModule.triggerConfetti();
          }, 1200);
        }
      });
    }
  },
};

/* ============================================================
   10. TASK SYSTEM
============================================================ */
const TaskModule = {
  activeTimer: null,
  activeTaskId: null,

  complete(taskId, xpAmount, category = 'general') {
    const user = Store.getUser();
    user.tasksCompleted = (user.tasksCompleted || 0) + 1;

    // Category-specific counters
    if (category === 'meditation') user.meditationCount = (user.meditationCount || 0) + 1;
    if (category === 'kindness')   user.kindnessCount   = (user.kindnessCount   || 0) + 1;
    if (category === 'hard')       user.hardTasksCount  = (user.hardTasksCount  || 0) + 1;

    Store.saveUser(user);
    UserModule.addXP(xpAmount, `task_${taskId}`);
    AnimationModule.triggerConfetti();
    Toast.show(`🎉 Nhiệm vụ hoàn thành! +${xpAmount} XP`, 3000);
  },

  startTimer(seconds, onTick, onComplete) {
    let remaining = seconds;
    this.stopTimer();
    onTick(remaining);
    this.activeTimer = setInterval(() => {
      remaining--;
      onTick(remaining);
      if (remaining <= 0) {
        this.stopTimer();
        if (onComplete) onComplete();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.activeTimer) {
      clearInterval(this.activeTimer);
      this.activeTimer = null;
    }
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  // AI Task Recommendation (simplified rule-based)
  recommend(moodScore, timeOfDay, level) {
    const hour = new Date().getHours();
    const tod = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    if (moodScore <= 2) {
      return ['task-breathing.html', 'emergency.html'];
    }
    if (moodScore <= 4 && tod === 'evening') {
      return ['task-meditation.html', 'journal.html'];
    }
    if (level >= 2) {
      return ['task-breathing.html', 'task-meditation.html', 'journal.html'];
    }
    return ['task-breathing.html', 'task-meditation.html'];
  },
};

/* ============================================================
   11. BREATHING EXERCISE ENGINE
============================================================ */
const BreathingModule = {
  isRunning: false,
  currentPhase: 0,
  currentCycle: 0,
  phaseTimeout: null,
  totalCycles: 5,

  PHASES: [
    { label: 'Hít vào...', class: 'inhale', text: 'Hít vào', duration: 4000, instruction: 'Hít vào chậm rãi qua mũi trong 4 giây' },
    { label: 'Giữ hơi...', class: 'hold',   text: 'Giữ',     duration: 4000, instruction: 'Giữ hơi thở, cảm nhận sự tĩnh lặng' },
    { label: 'Thở ra...',  class: 'exhale', text: 'Thở ra',  duration: 4000, instruction: 'Thở ra từ từ qua miệng trong 4 giây' },
    { label: 'Nghỉ...',    class: '',       text: 'Nghỉ',    duration: 2000, instruction: 'Nghỉ ngơi trước chu kỳ tiếp theo' },
  ],

  start(circleEl, labelEl, textEl, dotsEl, onComplete) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentPhase = 0;
    this.currentCycle = 0;
    this._runPhase(circleEl, labelEl, textEl, dotsEl, onComplete);
  },

  _runPhase(circleEl, labelEl, textEl, dotsEl, onComplete) {
    const phase = this.PHASES[this.currentPhase];
    if (circleEl) { circleEl.className = 'breath-circle ' + phase.class; circleEl.querySelector('span') && (circleEl.querySelector('span').textContent = phase.text); }
    if (labelEl)  labelEl.textContent = phase.label;
    if (textEl)   textEl.textContent  = phase.text;
    this._updateDots(dotsEl);

    this.phaseTimeout = setTimeout(() => {
      this.currentPhase = (this.currentPhase + 1) % this.PHASES.length;
      if (this.currentPhase === 0) {
        this.currentCycle++;
        if (this.currentCycle >= this.totalCycles) {
          this.stop(circleEl, labelEl, textEl);
          if (onComplete) onComplete();
          return;
        }
      }
      this._runPhase(circleEl, labelEl, textEl, dotsEl, onComplete);
    }, phase.duration);
  },

  stop(circleEl, labelEl, textEl) {
    clearTimeout(this.phaseTimeout);
    this.isRunning = false;
    if (circleEl) circleEl.className = 'breath-circle';
    if (labelEl)  labelEl.textContent = 'Nhấn để bắt đầu';
    if (textEl)   textEl.textContent  = 'Bắt đầu';
  },

  _updateDots(dotsEl) {
    if (!dotsEl) return;
    const dots = dotsEl.querySelectorAll('.bp-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i < this.currentCycle + 1));
  },
};

/* ============================================================
   12. MEDITATION TIMER
============================================================ */
const MeditationModule = {
  isRunning: false,
  isPaused: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  timerInterval: null,

  start(durationMinutes, onTick, onComplete) {
    this.totalSeconds = durationMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = true;
    this.isPaused = false;
    this._tick(onTick, onComplete);
  },

  _tick(onTick, onComplete) {
    if (onTick) onTick(this.remainingSeconds, this.totalSeconds);
    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;
      this.remainingSeconds--;
      if (onTick) onTick(this.remainingSeconds, this.totalSeconds);
      if (this.remainingSeconds <= 0) {
        this.stop();
        if (onComplete) onComplete();
      }
    }, 1000);
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    this.isPaused = false;
  },

  stop() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isPaused = false;
  },

  getProgress() {
    if (!this.totalSeconds) return 0;
    return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },
};

/* ============================================================
   13. JOURNAL MODULE
============================================================ */
const JournalModule = {
  PROMPTS: [
    'Hôm nay bạn cảm thấy thế nào? Điều gì đang chiếm nhiều tâm trí nhất?',
    'Kể về một khoảnh khắc tốt đẹp trong ngày hôm nay...',
    'Điều gì đang làm bạn lo lắng? Hãy viết ra để giải phóng nó.',
    'Ba điều bạn biết ơn hôm nay là gì?',
    'Nếu có thể nói với bản thân 1 năm trước, bạn sẽ nói gì?',
    'Bạn đã tử tế với ai hôm nay chưa? Kể về điều đó.',
    'Điều gì khiến bạn mỉm cười hôm nay?',
  ],

  MOOD_EMOJIS: ['😊', '😌', '😐', '😟', '😰', '😢'],

  getRandomPrompt() {
    return this.PROMPTS[Math.floor(Math.random() * this.PROMPTS.length)];
  },

  // Simple sentiment analysis (keyword-based)
  analyzeSentiment(text) {
    const positive = ['vui', 'hạnh phúc', 'tốt', 'tuyệt', 'yêu', 'biết ơn', 'bình yên', 'hy vọng', 'mạnh mẽ'];
    const negative = ['buồn', 'lo', 'sợ', 'tức', 'mệt', 'căng thẳng', 'khó', 'đau', 'cô đơn', 'thất vọng'];
    const lower = text.toLowerCase();
    let score = 0;
    positive.forEach(w => { if (lower.includes(w)) score += 1; });
    negative.forEach(w => { if (lower.includes(w)) score -= 1; });
    if (score > 1)  return { label: 'Tích cực 😊', color: 'var(--mint-dark)', score };
    if (score < -1) return { label: 'Cần chú ý 😟', color: 'var(--coral)', score };
    return { label: 'Trung tính 😐', color: 'var(--text-secondary)', score };
  },

  save(content, mood, tags = []) {
    if (!content.trim()) {
      Toast.error('Hãy viết gì đó trước nhé! 📝');
      return false;
    }

    // Safety check
    if (EmergencyModule.checkAndTrigger(content)) return false;

    const entries = Store.get('journal_entries') || [];
    const sentiment = this.analyzeSentiment(content);
    entries.unshift({
      id: Date.now(),
      content,
      mood,
      tags,
      sentiment,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('vi-VN'),
      wordCount: content.trim().split(/\s+/).length,
    });
    Store.set('journal_entries', entries.slice(0, 500));
    UserModule.addXP(15, 'journal');
    Toast.show('📝 Nhật ký đã được lưu! +15 XP 🌿');

    const user = Store.getUser();
    user.journalCount = (user.journalCount || 0) + 1;
    Store.saveUser(user);
    return true;
  },

  getEntries(limit = 20) {
    return (Store.get('journal_entries') || []).slice(0, limit);
  },
};

/* ============================================================
   14. COMMUNITY MODULE
============================================================ */
const CommunityModule = {
  REACTIONS: ['❤️', '🤗', '💪', '🌟'],

  react(postId, emoji) {
    const reactions = Store.get('community_reactions') || {};
    if (!reactions[postId]) reactions[postId] = {};
    reactions[postId][emoji] = (reactions[postId][emoji] || 0) + 1;
    Store.set('community_reactions', reactions);
    Toast.show(`${emoji} Đã gửi cảm xúc!`);
  },

  getReactions(postId) {
    const reactions = Store.get('community_reactions') || {};
    return reactions[postId] || {};
  },

  // Content moderation (keyword filter)
  moderateContent(text) {
    const blocked = ['spam', 'quảng cáo', 'link', 'http'];
    const lower = text.toLowerCase();
    return !blocked.some(w => lower.includes(w));
  },
};

/* ============================================================
   15. REPORT & CHARTS
============================================================ */
const ReportModule = {
  // Draw simple SVG line chart
  drawLineChart(svgEl, datasets, labels, config = {}) {
    if (!svgEl) return;
    const W = config.width  || 600;
    const H = config.height || 180;
    const padL = config.padL || 30;
    const padR = config.padR || 10;
    const padT = config.padT || 15;
    const padB = config.padB || 20;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const n = labels.length;
    const xStep = chartW / (n - 1 || 1);

    const colors = config.colors || ['#7BBF95', '#E8A876', '#C3AED6'];

    // Grid lines
    let html = '<defs>';
    datasets.forEach((ds, di) => {
      html += `<linearGradient id="grad${di}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colors[di]}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${colors[di]}" stop-opacity="0.02"/>
      </linearGradient>`;
    });
    html += '</defs>';

    for (let i = 0; i <= 5; i++) {
      const y = padT + (chartH / 5) * i;
      html += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#E8CBA7" stroke-width="1" stroke-dasharray="4,4"/>`;
      html += `<text x="${padL - 4}" y="${y + 4}" font-size="9" fill="#A89585" text-anchor="end">${10 - i * 2}</text>`;
    }

    datasets.forEach((data, di) => {
      const pathD = data.map((v, i) => {
        const x = padL + i * xStep;
        const y = padT + chartH - (v / 10) * chartH;
        return (i === 0 ? 'M' : 'L') + `${x} ${y}`;
      }).join(' ');

      const areaD = pathD + ` L${padL + (n-1) * xStep} ${padT + chartH} L${padL} ${padT + chartH} Z`;

      if (di === 0) html += `<path d="${areaD}" fill="url(#grad0)"/>`;
      html += `<path d="${pathD}" fill="none" stroke="${colors[di]}" stroke-width="${di === 0 ? 2.5 : 1.5}" stroke-dasharray="${di > 0 ? '5,3' : ''}" stroke-linejoin="round" stroke-linecap="round"/>`;

      if (di === 0) {
        data.forEach((v, i) => {
          const x = padL + i * xStep;
          const y = padT + chartH - (v / 10) * chartH;
          html += `<circle cx="${x}" cy="${y}" r="3.5" fill="${colors[0]}" stroke="white" stroke-width="1.5"/>`;
        });
      }
    });

    svgEl.innerHTML = html;
  },

  // Draw radar/spider chart
  drawRadarChart(svgEl, labels, values, config = {}) {
    if (!svgEl) return;
    const cx = 110, cy = 110, r = 80;
    const n = labels.length;
    const colors = config.colors || ['#FF8B8B','#C3AED6','#FFCBA4','#A8D5BA','#A8D8EA','#FFD93D'];

    function polar(angle, radius) {
      const a = (angle - 90) * Math.PI / 180;
      return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
    }

    let html = '';

    // Grid polygons
    for (let level = 1; level <= 5; level++) {
      const pts = Array.from({ length: n }, (_, i) => {
        const p = polar(i * (360 / n), r * (level / 5));
        return `${p.x},${p.y}`;
      }).join(' ');
      html += `<polygon points="${pts}" fill="none" stroke="#E8CBA7" stroke-width="${level === 5 ? 1.5 : 0.8}"/>`;
    }

    // Axes
    labels.forEach((_, i) => {
      const p = polar(i * (360 / n), r);
      html += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#E8CBA7" stroke-width="1"/>`;
    });

    // Data polygon
    const dataPts = values.map((v, i) => {
      const p = polar(i * (360 / n), r * (v / 100));
      return `${p.x},${p.y}`;
    }).join(' ');
    html += `<polygon points="${dataPts}" fill="rgba(168,213,186,0.25)" stroke="#7BBF95" stroke-width="2"/>`;

    // Labels & dots
    labels.forEach((lbl, i) => {
      const p = polar(i * (360 / n), r + 16);
      html += `<text x="${p.x}" y="${p.y}" font-size="9" fill="#7A6555" text-anchor="middle" dominant-baseline="middle" font-family="Nunito" font-weight="700">${lbl}</text>`;
      const dp = polar(i * (360 / n), r * (values[i] / 100));
      html += `<circle cx="${dp.x}" cy="${dp.y}" r="3" fill="${colors[i]}" stroke="white" stroke-width="1.5"/>`;
    });

    svgEl.innerHTML = html;
  },

  exportPDF() {
    Toast.show('📄 Đang chuẩn bị báo cáo PDF...', 2000);
    setTimeout(() => {
      window.print();
      Toast.show('✅ Đã mở hộp thoại in/xuất PDF!', 3000);
    }, 500);
  },
};

/* ============================================================
   16. SETTINGS MODULE
============================================================ */
const SettingsModule = {
  currentSection: 'notifications',

  init() {
    this.loadSettings();
  },

  switchSection(sectionId, clickedEl) {
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
    const section = document.getElementById(`section-${sectionId}`);
    if (section) section.classList.add('active');
    if (clickedEl) clickedEl.classList.add('active');
    this.currentSection = sectionId;
  },

  loadSettings() {
    const settings = Store.getSettings();
    // Apply toggles
    Object.entries(settings.notifications || {}).forEach(([key, val]) => {
      const el = document.getElementById(`notif-${key}`);
      if (el) el.checked = val;
    });
  },

  save() {
    Toast.show('✅ Đã lưu tất cả cài đặt!', 2500);
  },

  saveSection(section) {
    Toast.show(`✅ Đã lưu cài đặt ${section}!`, 2000);
  },

  selectTheme(el, themeName) {
    document.querySelectorAll('.theme-option').forEach(t => t.classList.remove('selected'));
    if (el) el.classList.add('selected');
    const settings = Store.getSettings();
    settings.theme = themeName;
    Store.saveSettings(settings);
    Toast.show(`🎨 Đã chọn chủ đề: ${themeName}`, 2000);
  },

  selectFontSize(el, size) {
    document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('selected'));
    if (el) el.classList.add('selected');
    document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px';
    Toast.show(`🔤 Cỡ chữ: ${size}`, 1500);
  },

  toggleMasterNotif(checkbox) {
    const subSettings = document.getElementById('notif-sub-settings');
    if (subSettings) subSettings.style.opacity = checkbox.checked ? '1' : '0.4';
  },

  disconnectDevice(btn, deviceName) {
    if (confirm(`Bạn có chắc muốn ngắt kết nối ${deviceName}?`)) {
      const card = btn.closest('.device-card');
      if (card) {
        const status = card.querySelector('.dc-status');
        if (status) { status.textContent = 'Đã ngắt'; status.className = 'dc-status off'; }
        btn.textContent = 'Kết nối lại';
        btn.classList.remove('disconnect');
      }
      Toast.show(`📱 Đã ngắt kết nối ${deviceName}`, 2000);
    }
  },

  showConfirm(icon, title, text, onConfirm) {
    const overlay = document.getElementById('confirmOverlay');
    if (!overlay) return;
    document.getElementById('cpIcon').textContent  = icon;
    document.getElementById('cpTitle').textContent = title;
    document.getElementById('cpText').textContent  = text;
    const btn = document.getElementById('cpConfirmBtn');
    if (btn) btn.onclick = () => { onConfirm(); ModalModule.close('confirmOverlay'); };
    ModalModule.open('confirmOverlay');
  },

  deleteAccount() {
    this.showConfirm('⚠️', 'Xóa tài khoản', 'Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn. Không thể hoàn tác!', () => {
      Store.clear();
      Toast.show('🗑️ Tài khoản đã được xóa.', 3000);
      setTimeout(() => window.location.href = 'index.html', 2000);
    });
  },

  resetData() {
    this.showConfirm('🔄', 'Đặt lại dữ liệu', 'Toàn bộ lịch sử tâm trạng, nhật ký và tiến trình sẽ bị xóa.', () => {
      ['mood_history', 'journal_entries', 'community_reactions'].forEach(k => Store.remove(k));
      Toast.show('✅ Đã đặt lại dữ liệu thành công!', 3000);
    });
  },
};

// Global shorthand for settings page
function switchSection(id, el)     { SettingsModule.switchSection(id, el); }
function saveAllSettings()         { SettingsModule.save(); }
function saveSection(s)            { SettingsModule.saveSection(s); }
function selectTheme(el, t)        { SettingsModule.selectTheme(el, t); }
function selectFontSize(el, s)     { SettingsModule.selectFontSize(el, s); }
function toggleMasterNotif(cb)     { SettingsModule.toggleMasterNotif(cb); }
function disconnectDevice(btn, d)  { SettingsModule.disconnectDevice(btn, d); }
function closeConfirm()            { ModalModule.close('confirmOverlay'); }
function deleteAccount()           { SettingsModule.deleteAccount(); }
function resetData()               { SettingsModule.resetData(); }

/* ============================================================
   17. CONFETTI & ANIMATIONS
============================================================ */
const AnimationModule = {
  CONFETTI_COLORS: ['#A8D5BA','#FFCBA4','#C3AED6','#FFD93D','#A8D8EA','#FF8B8B','#F4A0B0'],

  triggerConfetti(count = 40) {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `
          left: ${Math.random() * 100}%;
          top: -20px;
          width: ${Math.random() * 8 + 4}px;
          height: ${Math.random() * 8 + 4}px;
          background: ${this.CONFETTI_COLORS[Math.floor(Math.random() * this.CONFETTI_COLORS.length)]};
          animation: cffall ${Math.random() * 2 + 1.5}s linear forwards;
          animation-delay: ${Math.random() * 0.5}s;
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        `;
        container.appendChild(piece);
        setTimeout(() => piece.remove(), 3500);
      }, i * 30);
    }
  },

  showXPGain(amount) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.textContent = `+${amount} XP ⭐`;
    popup.style.cssText = `
      position: fixed;
      bottom: 80px; right: 24px;
      font-size: 1.1rem; font-weight: 800;
      color: var(--mint-dark);
      z-index: 800;
      pointer-events: none;
      animation: xp-float 1.5s ease forwards;
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1600);
  },

  // Animate number counting up
  countUp(el, target, duration = 1000) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(start + range * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  },

  // Animate progress bar fill
  animateProgressBar(el, targetPercent, duration = 1000) {
    if (!el) return;
    el.style.transition = `width ${duration}ms ease`;
    setTimeout(() => { el.style.width = targetPercent + '%'; }, 50);
  },

  // Fade in elements with stagger
  staggerFadeIn(selector, delay = 80) {
    const els = document.querySelectorAll(selector);
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * delay);
    });
  },
};

// Global shorthand
function triggerConfetti() { AnimationModule.triggerConfetti(); }

/* ============================================================
   18. UTILITY HELPERS
============================================================ */
const Utils = {
  // Format date to Vietnamese
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  },

  // Format relative time
  timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days} ngày trước`;
    return Utils.formatDate(dateStr);
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  },

  // Throttle
  throttle(fn, limit = 300) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= limit) { lastCall = now; fn(...args); }
    };
  },

  // Random item from array
  randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // Clamp number
  clamp(val, min, max) { return Math.min(Math.max(val, min), max); },

  // Format seconds to mm:ss
  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  // Truncate text
  truncate(text, maxLen = 100) {
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  },

  // Generate unique ID
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); },

  // Smooth scroll to element
  scrollTo(selector) {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      Toast.show('📋 Đã sao chép!', 1500);
    } catch {
      Toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  },
};

/* ============================================================
   19. APP INITIALIZATION
============================================================ */
const App = {
  init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._boot());
    } else {
      this._boot();
    }
  },

  _boot() {
    // Core modules
    UserModule.init();
    NavModule.init();
    EmergencyModule.init();

    // Page-specific initialization
    const page = window.location.pathname.split('/').pop() || 'index.html';
    this._initPage(page);

    // Animate cards on load
    setTimeout(() => AnimationModule.staggerFadeIn('.paper-card', 60), 100);

    // Show random motivational message on dashboard
    if (page === 'dashboard.html' || page === '') {
      const msg = Utils.randomItem(PeaceFlow.MOTIVATIONAL_MESSAGES);
      console.log(`🌿 PeaceFlow: ${msg}`);
    }

    // Settings init
    if (page === 'settings.html') SettingsModule.init();

    console.log(`✅ PeaceFlow v${PeaceFlow.version} initialized — Page: ${page}`);
  },

  _initPage(page) {
    switch (page) {
      case 'index.html':
      case '':
        this._initLanding();
        break;
      case 'dashboard.html':
        this._initDashboard();
        break;
      case 'mood-checkin.html':
        this._initMoodCheckin();
        break;
      case 'mood-chat.html':
        this._initMoodChat();
        break;
      case 'report.html':
        this._initReport();
        break;
      case 'emergency.html':
        this._initEmergency();
        break;
      case 'journal.html':
        this._initJournal();
        break;
      case 'achievements.html':
        this._initAchievements();
        break;
    }
  },

  _initLanding() {
    // Rotate motivational messages
    const msgEl = document.getElementById('heroMessage');
    if (msgEl) {
      let idx = 0;
      setInterval(() => {
        idx = (idx + 1) % PeaceFlow.MOTIVATIONAL_MESSAGES.length;
        msgEl.style.opacity = '0';
        setTimeout(() => {
          msgEl.textContent = PeaceFlow.MOTIVATIONAL_MESSAGES[idx];
          msgEl.style.opacity = '1';
        }, 400);
      }, 5000);
    }
  },

  _initDashboard() {
    // Animate XP bar
    const xpBar = document.querySelector('[data-xp-bar]');
    if (xpBar) {
      const user = Store.getUser();
      const progress = UserModule.getXPProgress(user.xp);
      AnimationModule.animateProgressBar(xpBar, progress);
    }
  },

  _initMoodCheckin() {
    // Bind mood options
    document.querySelectorAll('.mood-option').forEach((el, i) => {
      el.addEventListener('click', () => MoodModule.selectMood(i));
    });
    // Bind tags
    document.querySelectorAll('.mood-tag').forEach(el => {
      el.addEventListener('click', () => MoodModule.toggleTag(el.dataset.tag));
    });
  },

  _initMoodChat() {
    // Monitor chat input for warning keywords
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('input', Utils.debounce((e) => {
        EmergencyModule.checkAndTrigger(e.target.value);
      }, 1000));
    }
  },

  _initReport() {
    // Draw charts if SVG elements exist
    const moodSvg = document.getElementById('moodChart');
    if (moodSvg) {
      ReportModule.drawLineChart(moodSvg,
        [[6,7,5,8,7,9,8], [4,3,5,3,4,2,2], [5,4,6,3,4,2,3]],
        ['T2','T3','T4','T5','T6','T7','CN']
      );
    }
    const radarSvg = document.getElementById('radarChart');
    if (radarSvg) {
      ReportModule.drawRadarChart(radarSvg,
        ['Lo âu','Trầm cảm','Stress','Giấc ngủ','Thể chất','Xã hội'],
        [72, 80, 68, 75, 65, 70]
      );
    }
  },

  _initEmergency() {
    // Auto-rotate PeaceCat messages
    const msgEl = document.getElementById('PeaceCatMessage');
    if (msgEl) {
      let idx = 0;
      setInterval(() => {
        idx = (idx + 1) % PeaceFlow.PeaceCat_MESSAGES.length;
        msgEl.style.opacity = '0';
        setTimeout(() => {
          msgEl.textContent = PeaceFlow.PeaceCat_MESSAGES[idx];
          msgEl.style.opacity = '1';
        }, 400);
      }, 6000);
    }
  },

  _initJournal() {
    // Set random prompt
    const promptEl = document.getElementById('journalPrompt');
    if (promptEl) promptEl.textContent = JournalModule.getRandomPrompt();

    // Monitor journal for warning keywords
    const editor = document.getElementById('journalEditor');
    if (editor) {
      editor.addEventListener('input', Utils.debounce((e) => {
        EmergencyModule.checkAndTrigger(e.target.value);
      }, 1500));
    }
  },

  _initAchievements() {
    // Animate XP bar in hero
    const xpFill = document.querySelector('.hb-xp-fill');
    if (xpFill) AnimationModule.animateProgressBar(xpFill, 97.5);
  },
};

/* ============================================================
   GLOBAL EXPORTS (for inline HTML event handlers)
============================================================ */
window.PeaceFlow        = PeaceFlow;
window.Store           = Store;
window.UserModule      = UserModule;
window.NavModule       = NavModule;
window.Toast           = Toast;
