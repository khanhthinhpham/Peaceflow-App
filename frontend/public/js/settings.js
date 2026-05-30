import { apiClient, getApiBaseUrl } from './api-client.js';
import { EventLogger } from './event-logger.js';

const LOCAL_SETTINGS_KEY = 'peaceflow_profile_settings';
const APP_VERSION = '1.0.0';

const THEMES = {
    paper: {
        '--cream': '#FFF8F0',
        '--warm-white': '#FFFDF7',
        '--kraft': '#D4A574',
        '--kraft-light': '#E8CBA7',
        '--mint': '#A8D5BA',
        '--mint-light': '#C5E8D2',
        '--mint-dark': '#7BBF95',
        '--peach-light': '#FFE0C4',
        '--sky-light': '#C5E8F5',
        '--lavender-light': '#DDD1EB',
        '--text-primary': '#4A3728',
        '--text-secondary': '#7A6555'
    },
    ocean: {
        '--cream': '#F2F8FF',
        '--warm-white': '#FAFDFF',
        '--kraft': '#86B7E3',
        '--kraft-light': '#C7DDF2',
        '--mint': '#8FD3F4',
        '--mint-light': '#D8F0FB',
        '--mint-dark': '#4EA5D9',
        '--peach-light': '#E6F4FF',
        '--sky-light': '#D8EEFF',
        '--lavender-light': '#DDEAFE',
        '--text-primary': '#23405B',
        '--text-secondary': '#4F6E89'
    },
    sunset: {
        '--cream': '#FFF5EE',
        '--warm-white': '#FFFDF9',
        '--kraft': '#F0A66E',
        '--kraft-light': '#F7D3B5',
        '--mint': '#FFC2A8',
        '--mint-light': '#FFE5D6',
        '--mint-dark': '#E9886A',
        '--peach-light': '#FFE4D6',
        '--sky-light': '#FFE8D8',
        '--lavender-light': '#F7D8D1',
        '--text-primary': '#5A3525',
        '--text-secondary': '#8A5F4A'
    },
    forest: {
        '--cream': '#F4FAF4',
        '--warm-white': '#FCFEFC',
        '--kraft': '#8DB892',
        '--kraft-light': '#CFE3D0',
        '--mint': '#7BC47F',
        '--mint-light': '#DDF2DF',
        '--mint-dark': '#4F9656',
        '--peach-light': '#E3F4E4',
        '--sky-light': '#DDF1E1',
        '--lavender-light': '#D8EBD8',
        '--text-primary': '#26442A',
        '--text-secondary': '#4F6C53'
    },
    lavender: {
        '--cream': '#FBF7FF',
        '--warm-white': '#FFFDFF',
        '--kraft': '#B99AD9',
        '--kraft-light': '#E4D7F2',
        '--mint': '#D0B7EA',
        '--mint-light': '#F0E7FA',
        '--mint-dark': '#8E6FB3',
        '--peach-light': '#F4E6FB',
        '--sky-light': '#EEE3FA',
        '--lavender-light': '#EADAF7',
        '--text-primary': '#47315C',
        '--text-secondary': '#72588C'
    }
};

const FONT_SIZES = {
    small: '14px',
    medium: '16px',
    large: '18px'
};

const state = {
    user: null,
    profile: null,
    progress: null,
    local: loadLocalSettings(),
    currentSection: 'notifications'
};

const refs = {
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText'),
    notifMaster: document.getElementById('notif-master'),
    notifMorning: document.getElementById('notif-morning'),
    notifMorningTime: document.getElementById('notif-morning-time'),
    notifEvening: document.getElementById('notif-evening'),
    notifEveningTime: document.getElementById('notif-evening-time'),
    notifTasks: document.getElementById('notif-tasks'),
    notifStreak: document.getElementById('notif-streak'),
    notifAchievements: document.getElementById('notif-achievements'),
    notifInsights: document.getElementById('notif-insights'),
    notifExpert: document.getElementById('notif-expert'),
    notifCommunity: document.getElementById('notif-community'),
    notifSubSettings: document.getElementById('notif-sub-settings'),
    appearanceAnimations: document.getElementById('appearance-animations'),
    appearanceSounds: document.getElementById('appearance-sounds'),
    appearanceHaptics: document.getElementById('appearance-haptics'),
    appearanceLanguage: document.getElementById('appearance-language'),
    checkinDefaultMode: document.getElementById('checkin-default-mode'),
    checkinNotes: document.getElementById('checkin-notes'),
    checkinTags: document.getElementById('checkin-tags'),
    checkinAssessmentReminder: document.getElementById('checkin-assessment-reminder'),
    checkinReminderFrequency: document.getElementById('checkin-reminder-frequency'),
    checkinVoiceOptin: document.getElementById('checkin-voice-optin'),
    checkinSelfieOptin: document.getElementById('checkin-selfie-optin'),
    aiStyle: document.getElementById('ai-style'),
    aiTaskSuggestions: document.getElementById('ai-task-suggestions'),
    aiInsights: document.getElementById('ai-insights'),
    aiJournalAnalysis: document.getElementById('ai-journal-analysis'),
    aiMascot: document.getElementById('ai-mascot'),
    privacyShareData: document.getElementById('privacy-share-data'),
    privacyAnonAnalytics: document.getElementById('privacy-anon-analytics'),
    privacyProfileVisibility: document.getElementById('privacy-profile-visibility'),
    deviceList: document.getElementById('deviceList'),
    securitySessionCard: document.getElementById('securitySessionCard'),
    aboutAppMeta: document.getElementById('aboutAppMeta'),
    userName: document.querySelector('.user-name'),
    userLevel: document.querySelector('.user-level'),
    userAvatarMini: document.querySelector('.user-avatar-mini')
};

function loadLocalSettings() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveLocalSettings() {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(state.local));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function showToast(message, type = 'success') {
    if (window.Toast?.show) {
        window.Toast.show(message, 2200);
        return;
    }

    if (!refs.toast || !refs.toastText) {
        alert(message);
        return;
    }

    refs.toastText.textContent = message;
    refs.toast.className = `toast show ${type}`;
    setTimeout(() => refs.toast.classList.remove('show'), 2400);
}

function formatDateTime(value) {
    if (!value) return 'Chưa có';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Bangkok'
    }).format(new Date(value));
}

function detectDeviceName() {
    const ua = navigator.userAgent || '';
    if (/Edg\//.test(ua)) return 'Microsoft Edge';
    if (/Chrome\//.test(ua)) return 'Google Chrome';
    if (/Firefox\//.test(ua)) return 'Mozilla Firefox';
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
    return 'Trình duyệt hiện tại';
}

function getDisplayName() {
    return state.user?.display_name || state.user?.full_name || 'Người dùng';
}

function getAvatarFallback() {
    return state.profile?.onboarding_answers?.avatar_emoji || '🐱';
}

function getSupportPreferences() {
    return state.profile?.support_preferences || {};
}

function getOnboardingAnswers() {
    return state.profile?.onboarding_answers || {};
}

function getNotificationSetting(key, fallback) {
    const notifications = getSupportPreferences().notifications || {};
    const localNotifications = state.local.notifications || {};
    return notifications[key] ?? localNotifications[key] ?? fallback;
}

function getLocalTheme() {
    return getOnboardingAnswers().theme || state.local.theme || 'paper';
}

function getLocalFontSize() {
    return getOnboardingAnswers().font_size || state.local.fontSize || 'medium';
}

function getLocalLanguage() {
    return getOnboardingAnswers().language || state.local.language || '🇻🇳 Tiếng Việt';
}

function applyTheme(theme) {
    const palette = THEMES[theme] || THEMES.paper;
    Object.entries(palette).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
    });

    document.querySelectorAll('.theme-option').forEach((option) => {
        option.classList.toggle('selected', option.dataset.theme === theme);
    });

    state.local.theme = theme;
}

function applyFontSize(size) {
    const cssValue = FONT_SIZES[size] || FONT_SIZES.medium;
    document.documentElement.style.fontSize = cssValue;
    document.querySelectorAll('.fs-btn').forEach((button) => {
        button.classList.toggle('selected', button.dataset.fontSize === size);
    });
    state.local.fontSize = size;
}

function renderSidebarUser() {
    if (refs.userName) refs.userName.textContent = getDisplayName();

    if (refs.userLevel) {
        const xp = state.progress?.total_xp || 0;
        const level = state.progress?.current_level || 1;
        refs.userLevel.textContent = `⭐ ${xp} XP · Level ${level}`;
    }

    if (!refs.userAvatarMini) return;

    const avatarUrl = state.user?.avatar_url;
    if (avatarUrl) {
        if (avatarUrl.startsWith('emoji:')) {
            refs.userAvatarMini.textContent = avatarUrl.replace('emoji:', '');
            refs.userAvatarMini.style.backgroundImage = '';
        } else {
            refs.userAvatarMini.style.backgroundImage = `url('${avatarUrl}')`;
            refs.userAvatarMini.style.backgroundSize = 'cover';
            refs.userAvatarMini.style.backgroundPosition = 'center';
            refs.userAvatarMini.textContent = '';
        }
        return;
    }

    refs.userAvatarMini.style.backgroundImage = '';
    refs.userAvatarMini.textContent = getAvatarFallback();
}

function renderNotifications() {
    refs.notifMaster.checked = getNotificationSetting('master', true);
    refs.notifMorning.checked = getNotificationSetting('morning', true);
    refs.notifEvening.checked = getNotificationSetting('evening', true);
    refs.notifTasks.checked = getNotificationSetting('tasks', true);
    refs.notifStreak.checked = getNotificationSetting('streak', true);
    refs.notifAchievements.checked = getNotificationSetting('achievements', true);
    refs.notifInsights.checked = getNotificationSetting('insights', true);
    refs.notifExpert.checked = getNotificationSetting('expert', true);
    refs.notifCommunity.checked = getNotificationSetting('community', false);
    refs.notifMorningTime.value = getSupportPreferences().morning_time || state.local.morningTime || '08:00';
    refs.notifEveningTime.value = getSupportPreferences().evening_time || state.local.eveningTime || '21:30';
    toggleMasterNotif(refs.notifMaster);
}

function renderAppearance() {
    const support = getSupportPreferences();
    refs.appearanceAnimations.checked = support.animations ?? state.local.animations ?? true;
    refs.appearanceSounds.checked = support.sounds ?? state.local.sounds ?? true;
    refs.appearanceHaptics.checked = support.haptics ?? state.local.haptics ?? true;
    refs.appearanceLanguage.value = getLocalLanguage();
    applyTheme(getLocalTheme());
    applyFontSize(getLocalFontSize());
}

function renderCheckin() {
    const support = getSupportPreferences();
    refs.checkinDefaultMode.value = support.checkin_default_mode || '😊 Chọn emoji nhanh';
    refs.checkinNotes.checked = support.checkin_notes_enabled ?? true;
    refs.checkinTags.checked = support.checkin_tag_suggestions ?? true;
    refs.checkinAssessmentReminder.checked = support.assessment_reminder_enabled ?? true;
    refs.checkinReminderFrequency.value = support.assessment_reminder_frequency || '2 tuần/lần';
    refs.checkinVoiceOptin.checked = support.voice_opt_in ?? false;
    refs.checkinSelfieOptin.checked = support.selfie_opt_in ?? false;
}

function renderAi() {
    const support = getSupportPreferences();
    refs.aiStyle.value = support.ai_style || '😊 Thân thiện, vui vẻ';
    refs.aiTaskSuggestions.checked = support.ai_task_suggestions ?? true;
    refs.aiInsights.checked = support.ai_insights ?? true;
    refs.aiJournalAnalysis.checked = support.journal_analysis ?? true;
    refs.aiMascot.checked = support.mascot_enabled ?? true;
}

function renderPrivacy() {
    const support = getSupportPreferences();
    refs.privacyShareData.checked = support.privacy_share_data ?? false;
    refs.privacyAnonAnalytics.checked = support.privacy_anonymous_analytics ?? true;
    refs.privacyProfileVisibility.value = support.profile_visibility || 'private';
}

function renderDevices() {
    if (!refs.deviceList) return;

    const deviceName = detectDeviceName();
    const currentSession = `
        <div class="device-card">
            <div class="dc-icon">💻</div>
            <div class="dc-info">
                <div class="dc-name">${escapeHtml(deviceName)}</div>
                <div class="dc-meta">Phiên hiện tại · Đăng nhập lúc ${escapeHtml(formatDateTime(state.user?.updated_at || state.user?.created_at))}</div>
            </div>
            <div class="dc-status on">Đang hoạt động</div>
            <button class="dc-btn" type="button" onclick="handleLogout()">Đăng xuất</button>
        </div>
    `;

    const integrationState = `
        <div class="device-card">
            <div class="dc-icon">⌚</div>
            <div class="dc-info">
                <div class="dc-name">Thiết bị đeo sức khỏe</div>
                <div class="dc-meta">Chưa có API kết nối thật trong backend hiện tại</div>
            </div>
            <div class="dc-status off">Chưa hỗ trợ</div>
            <button class="dc-btn disconnect" type="button" onclick="disconnectDevice(this,'wearable')">Thông tin</button>
        </div>
    `;

    refs.deviceList.innerHTML = `${currentSession}${integrationState}`;
}

function renderSecurity() {
    if (!refs.securitySessionCard) return;

    const hasAccessToken = Boolean(localStorage.getItem('access_token'));
    const hasRefreshToken = Boolean(localStorage.getItem('refresh_token'));

    refs.securitySessionCard.innerHTML = `
        <div><strong>Người dùng:</strong> ${escapeHtml(getDisplayName())}</div>
        <div><strong>Access token:</strong> ${hasAccessToken ? 'Có' : 'Thiếu'}</div>
        <div><strong>Refresh token:</strong> ${hasRefreshToken ? 'Có' : 'Thiếu'}</div>
        <div><strong>Lần cập nhật hồ sơ gần nhất:</strong> ${escapeHtml(formatDateTime(state.profile?.updated_at || state.user?.updated_at))}</div>
    `;
}

function renderAbout() {
    if (!refs.aboutAppMeta) return;

    const apiBase = getApiBaseUrl();

    refs.aboutAppMeta.innerHTML = `
        <div><strong>Phiên bản giao diện:</strong> ${escapeHtml(APP_VERSION)}</div>
        <div><strong>API:</strong> ${escapeHtml(apiBase)}</div>
        <div><strong>Múi giờ trình duyệt:</strong> ${escapeHtml(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Không xác định')}</div>
        <div><strong>Người dùng hiện tại:</strong> ${escapeHtml(getDisplayName())}</div>
    `;
}

function collectLocalSettings() {
    state.local.notifications = {
        master: refs.notifMaster.checked,
        morning: refs.notifMorning.checked,
        evening: refs.notifEvening.checked,
        tasks: refs.notifTasks.checked,
        streak: refs.notifStreak.checked,
        achievements: refs.notifAchievements.checked,
        insights: refs.notifInsights.checked,
        expert: refs.notifExpert.checked,
        community: refs.notifCommunity.checked
    };
    state.local.morningTime = refs.notifMorningTime.value || '08:00';
    state.local.eveningTime = refs.notifEveningTime.value || '21:30';
    state.local.animations = refs.appearanceAnimations.checked;
    state.local.sounds = refs.appearanceSounds.checked;
    state.local.haptics = refs.appearanceHaptics.checked;
    state.local.language = refs.appearanceLanguage.value || '🇻🇳 Tiếng Việt';
    state.local.checkin = {
        defaultMode: refs.checkinDefaultMode.value,
        notes: refs.checkinNotes.checked,
        tags: refs.checkinTags.checked,
        assessmentReminder: refs.checkinAssessmentReminder.checked,
        reminderFrequency: refs.checkinReminderFrequency.value,
        voiceOptIn: refs.checkinVoiceOptin.checked,
        selfieOptIn: refs.checkinSelfieOptin.checked
    };
    state.local.ai = {
        style: refs.aiStyle.value,
        taskSuggestions: refs.aiTaskSuggestions.checked,
        insights: refs.aiInsights.checked,
        journalAnalysis: refs.aiJournalAnalysis.checked,
        mascot: refs.aiMascot.checked
    };
    state.local.privacy = {
        shareData: refs.privacyShareData.checked,
        anonymousAnalytics: refs.privacyAnonAnalytics.checked,
        profileVisibility: refs.privacyProfileVisibility.value
    };
    saveLocalSettings();
}

function buildProfilePayload() {
    const existingSupport = getSupportPreferences();
    const existingOnboarding = getOnboardingAnswers();

    return {
        support_preferences: {
            ...existingSupport,
            notifications: {
                master: refs.notifMaster.checked,
                morning: refs.notifMorning.checked,
                evening: refs.notifEvening.checked,
                tasks: refs.notifTasks.checked,
                streak: refs.notifStreak.checked,
                achievements: refs.notifAchievements.checked,
                insights: refs.notifInsights.checked,
                expert: refs.notifExpert.checked,
                community: refs.notifCommunity.checked
            },
            morning_time: refs.notifMorningTime.value || '08:00',
            evening_time: refs.notifEveningTime.value || '21:30',
            animations: refs.appearanceAnimations.checked,
            sounds: refs.appearanceSounds.checked,
            haptics: refs.appearanceHaptics.checked,
            checkin_default_mode: refs.checkinDefaultMode.value,
            checkin_notes_enabled: refs.checkinNotes.checked,
            checkin_tag_suggestions: refs.checkinTags.checked,
            assessment_reminder_enabled: refs.checkinAssessmentReminder.checked,
            assessment_reminder_frequency: refs.checkinReminderFrequency.value,
            voice_opt_in: refs.checkinVoiceOptin.checked,
            selfie_opt_in: refs.checkinSelfieOptin.checked,
            ai_style: refs.aiStyle.value,
            ai_task_suggestions: refs.aiTaskSuggestions.checked,
            ai_insights: refs.aiInsights.checked,
            journal_analysis: refs.aiJournalAnalysis.checked,
            mascot_enabled: refs.aiMascot.checked,
            privacy_share_data: refs.privacyShareData.checked,
            privacy_anonymous_analytics: refs.privacyAnonAnalytics.checked,
            profile_visibility: refs.privacyProfileVisibility.value
        },
        onboarding_answers: {
            ...existingOnboarding,
            theme: state.local.theme || 'paper',
            font_size: state.local.fontSize || 'medium',
            language: refs.appearanceLanguage.value || '🇻🇳 Tiếng Việt'
        }
    };
}

function renderPage() {
    renderSidebarUser();
    renderNotifications();
    renderAppearance();
    renderCheckin();
    renderAi();
    renderPrivacy();
    renderDevices();
    renderSecurity();
    renderAbout();
}

async function loadData() {
    const [user, profile, progress] = await Promise.all([
        apiClient.get('/me'),
        apiClient.get('/profile'),
        apiClient.get('/progress')
    ]);

    state.user = user;
    state.profile = profile || {};
    state.progress = progress || {};

    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('user-profile-updated'));
}

async function persistSettings(scope) {
    collectLocalSettings();

    try {
        state.profile = await apiClient.put('/profile', buildProfilePayload());
        EventLogger.log('settings', 'save:server:success', { scope });
        renderPage();
        showToast(scope === 'all' ? 'Đã lưu toàn bộ cài đặt.' : `Đã lưu cài đặt ${scope}.`);
    } catch (error) {
        EventLogger.error('settings', 'save:server:failed', error, { scope });
        console.error('Settings save failed:', error);
        showToast('Không lưu được cài đặt lên máy chủ.', 'error');
    }
}

function switchSection(sectionId, clickedEl) {
    // Người dùng chuyển sang nhóm cài đặt khác (thông báo, giao diện, AI, riêng tư...)
    EventLogger.log('settings', 'section:switch', { section: sectionId, previous: state.currentSection });
    state.currentSection = sectionId;
    document.querySelectorAll('.settings-section').forEach((section) => {
        section.classList.toggle('active', section.id === `section-${sectionId}`);
    });
    document.querySelectorAll('.sn-item').forEach((item) => {
        item.classList.toggle('active', item.id === `snav-${sectionId}`);
    });
    clickedEl?.classList.add('active');
}

function toggleMasterNotif(checkbox) {
    // Người dùng bật/tắt công tắc chính của toàn bộ thông báo
    EventLogger.log('settings', 'notif:master:toggle', { enabled: Boolean(checkbox?.checked) });
    if (!refs.notifSubSettings) return;

    const enabled = Boolean(checkbox?.checked);
    refs.notifSubSettings.style.opacity = enabled ? '1' : '0.45';
    refs.notifSubSettings.querySelectorAll('input, select').forEach((input) => {
        input.disabled = !enabled;
    });
}

function selectTheme(el, themeName) {
    // Người dùng thay đổi chủ đề màu sắc giao diện
    EventLogger.log('settings', 'theme:select', { theme: themeName });
    if (themeName === 'dark') {
        showToast('Chủ đề tối chưa được triển khai.', 'info');
        return;
    }

    applyTheme(themeName);
    collectLocalSettings();
    el?.classList.add('selected');
}

function selectFontSize(el, size) {
    // Người dùng thay đổi kích thước chữ hiển thị
    EventLogger.log('settings', 'font:select', { size });
    applyFontSize(size);
    collectLocalSettings();
    el?.classList.add('selected');
}

async function saveAllSettings() {
    // Người dùng nhấn "Lưu tất cả" — đồng bộ toàn bộ cài đặt lên server
    EventLogger.log('settings', 'save:all');
    await persistSettings('all');
}

async function saveSection(section) {
    // Người dùng lưu một nhóm cài đặt cụ thể
    EventLogger.log('settings', 'save:section', { section });
    await persistSettings(section);
}

function disconnectDevice(_button, deviceName) {
    if (deviceName === 'wearable') {
        showToast('Backend chưa có kết nối wearable thật.', 'info');
        return;
    }

    showToast('Chỉ có thể đăng xuất khỏi phiên hiện tại trên trang này.', 'info');
}

async function exportData(format) {
    // Người dùng xuất toàn bộ dữ liệu cá nhân ra file
    EventLogger.log('settings', 'data:export:attempt', { format });
    if (format !== 'json') {
        showToast('Trang này hiện chỉ hỗ trợ xuất JSON.', 'info');
        return;
    }

    try {
        const [achievements, report] = await Promise.all([
            apiClient.get('/achievements'),
            apiClient.get('/reports/detail')
        ]);

        const payload = {
            exported_at: new Date().toISOString(),
            user: state.user,
            profile: state.profile,
            progress: state.progress,
            achievements,
            report,
            local_settings: state.local
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json'
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'peaceflow-settings-export.json';
        link.click();
        URL.revokeObjectURL(link.href);
        EventLogger.log('settings', 'data:export:success', { format });
        showToast('Đã xuất dữ liệu JSON.');
    } catch (error) {
        EventLogger.error('settings', 'data:export:failed', error, { format });
        console.error('Export failed:', error);
        showToast('Không xuất được dữ liệu.', 'error');
    }
}

function resetData() {
    // Người dùng yêu cầu xóa toàn bộ cài đặt local trên trình duyệt
    EventLogger.log('settings', 'data:reset:request');
    const confirmed = window.confirm('Xóa toàn bộ cài đặt local trên trình duyệt này? Dữ liệu trên server sẽ không bị ảnh hưởng.');
    if (!confirmed) return;

    EventLogger.log('settings', 'data:reset:confirmed');
    localStorage.removeItem(LOCAL_SETTINGS_KEY);
    localStorage.removeItem('PeaceFlow_settings');
    state.local = loadLocalSettings();
    renderPage();
    showToast('Đã xóa cài đặt cục bộ.');
}

function deleteAccount() {
    // Người dùng nhấn nút xóa tài khoản (chức năng chưa có backend)
    EventLogger.log('settings', 'account:delete:request');
    showToast('Backend chưa có endpoint xóa tài khoản.', 'info');
}

async function handleLogout() {
    // Người dùng đăng xuất từ trang cài đặt
    EventLogger.log('auth', 'logout:request', { page: 'settings' });
    try {
        await apiClient.logout();
    } finally {
        window.location.href = 'login.html';
    }
}

function bindEvents() {
    refs.notifMaster?.addEventListener('change', (event) => {
        toggleMasterNotif(event.target);
    });
}

async function init() {
    await loadData();
    bindEvents();
    renderPage();
    switchSection(state.currentSection);
}

function boot() {
    init().catch((error) => {
        console.error('Settings init failed:', error);
        showToast('Không tải được cài đặt từ máy chủ.', 'error');
    });
}

let _justBooted = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _justBooted = true; boot(); });
} else {
    _justBooted = true;
    boot();
}

window.addEventListener('peaceflow:route-mounted', (event) => {
    if ((event.detail?.page || '').split('?')[0] !== 'settings.html') return;
    if (_justBooted) { _justBooted = false; return; }
    boot();
});

window.switchSection = switchSection;
window.saveAllSettings = saveAllSettings;
window.saveSection = saveSection;
window.selectTheme = selectTheme;
window.selectFontSize = selectFontSize;
window.toggleMasterNotif = toggleMasterNotif;
window.disconnectDevice = disconnectDevice;
window.exportData = exportData;
window.resetData = resetData;
window.deleteAccount = deleteAccount;
window.handleLogout = handleLogout;
