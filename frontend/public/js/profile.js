import { apiClient } from './api-client.js';
import { EventLogger } from './event-logger.js';

const AVATARS = ['🐱', '🌱', '🌿', '🧘', '🌤️', '🌙', '💚', '🦋', '🍀', '☁️', '🌸', '⭐'];
const LOCAL_SETTINGS_KEY = 'peaceflow_profile_settings';

const state = {
    user: null,
    profile: null,
    progress: null,
    achievements: null,
    report: null,
    activeTab: 'info',
    selectedAvatar: '🐱',
    selectedGoals: new Set(),
    localSettings: loadLocalSettings()
};

const refs = {
    displayName: document.getElementById('displayName'),
    nickname: document.getElementById('nickname'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    ageGroup: document.getElementById('ageGroup'),
    gender: document.getElementById('gender'),
    tagline: document.getElementById('tagline'),
    bio: document.getElementById('bio'),
    avatarGrid: document.getElementById('avatarGrid'),
    goalChips: document.getElementById('goalChips'),
    goalDuration: document.getElementById('goalDuration'),
    reminderTime: document.getElementById('reminderTime'),
    badgesGrid: document.getElementById('badgesGrid'),
    levelProgress: document.getElementById('levelProgress'),
    activityTimeline: document.getElementById('activityTimeline'),
    activityStatsGrid: document.getElementById('activityStatsGrid'),
    notifSettings: document.getElementById('notifSettings'),
    privacySettings: document.getElementById('privacySettings'),
    deviceList: document.getElementById('deviceList'),
    heroName: document.querySelector('.ph-name'),
    heroTagline: document.querySelector('.ph-tagline'),
    heroMeta: document.getElementById('profileHeroMeta'),
    heroLevelBadge: document.querySelector('.ph-level-badge'),
    heroXpLabel: document.querySelector('.ph-xp-label'),
    heroXpFill: document.querySelector('.ph-xp-fill'),
    heroAvatar: document.querySelector('.ph-avatar'),
    sidebarMiniAvatar: document.querySelector('.user-avatar-mini'),
    sidebarUserLevel: document.querySelector('.user-level'),
    streakCard: document.getElementById('profileStreakCard'),
    tipCard: document.getElementById('profileTipCard'),
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText')
};

function loadLocalSettings() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY) || '{}');
    } catch {
        return {};
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function mapGenderToDisplay(value) {
    if (value === 'male') return 'Nam';
    if (value === 'female') return 'Nữ';
    if (value === 'other') return 'Khác';
    return 'Không muốn tiết lộ';
}

function mapDisplayToGender(value) {
    if (value === 'Nam') return 'male';
    if (value === 'Nữ') return 'female';
    if (value === 'Khác') return 'other';
    return 'prefer_not_to_say';
}

function formatDate(value) {
    if (!value) return 'Chưa có';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Bangkok'
    }).format(new Date(value));
}

function formatRelativeDate(value) {
    if (!value) return 'Chưa có hoạt động';
    const target = new Date(value);
    const diff = Math.floor((Date.now() - target.getTime()) / (24 * 60 * 60 * 1000));
    if (diff <= 0) return 'Hôm nay';
    if (diff === 1) return '1 ngày trước';
    return `${diff} ngày trước`;
}

function getLevelInfo() {
    return state.achievements?.progress?.level_info || {
        level: 1,
        title: 'Người Bắt Đầu',
        progress_percent: 0,
        xp_to_next: 100,
        maxXP: 100
    };
}

function getDisplayName() {
    const onboarding = state.profile?.onboarding_answers || {};
    return state.user?.display_name || onboarding.nickname || state.user?.full_name || 'Người dùng';
}

function getAvatarEmoji() {
    return state.selectedAvatar || state.profile?.onboarding_answers?.avatar_emoji || '🐱';
}

function syncStoredUser() {
    if (!state.user) return;
    localStorage.setItem('user', JSON.stringify(state.user));
    window.dispatchEvent(new Event('user-profile-updated'));
}

function showToast(message, type = 'success') {
    if (!refs.toast || !refs.toastText) {
        alert(message);
        return;
    }

    refs.toastText.textContent = message;
    refs.toast.className = `toast show ${type}`;
    setTimeout(() => {
        refs.toast.classList.remove('show');
    }, 2600);
}

function renderTabs() {
    document.querySelectorAll('.profile-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.id === `tab-${state.activeTab}`);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `panel-${state.activeTab}`);
    });
}

function renderForm() {
    const onboarding = state.profile?.onboarding_answers || {};
    const support = state.profile?.support_preferences || {};

    if (refs.displayName) refs.displayName.value = state.user?.display_name || state.user?.full_name || '';
    if (refs.nickname) refs.nickname.value = onboarding.nickname || '';
    if (refs.email) refs.email.value = state.user?.email || '';
    if (refs.phone) refs.phone.value = state.user?.phone || '';
    if (refs.ageGroup) refs.ageGroup.value = onboarding.ageGroup || '25-34 tuổi';
    if (refs.gender) refs.gender.value = mapGenderToDisplay(state.user?.gender);
    if (refs.tagline) refs.tagline.value = onboarding.tagline || 'Hôm nay là một ngày mới để tiến bộ 🌱';
    if (refs.bio) refs.bio.value = onboarding.bio || '';
    if (refs.goalDuration) refs.goalDuration.value = `${support.goal_duration_minutes || 10} phút`;
    if (refs.reminderTime) refs.reminderTime.value = support.reminder_time || '08:00';
}

function renderHero() {
    const levelInfo = getLevelInfo();
    const totalXp = state.progress?.total_xp || 0;
    const currentLevel = state.progress?.current_level || levelInfo.level || 1;
    const streak = state.progress?.current_streak || 0;
    const location = [state.user?.city, state.user?.country].filter(Boolean).join(', ') || 'Chưa cập nhật vị trí';
    const avatar = getAvatarEmoji();

    if (refs.heroAvatar) refs.heroAvatar.textContent = avatar;
    if (refs.sidebarMiniAvatar) refs.sidebarMiniAvatar.textContent = avatar;
    if (refs.heroName) refs.heroName.textContent = getDisplayName();
    if (refs.heroTagline) refs.heroTagline.textContent = `"${refs.tagline?.value || 'Hôm nay là một ngày mới để tiến bộ 🌱'}"`;
    if (refs.heroMeta) {
        refs.heroMeta.innerHTML = `
            <div class="ph-meta-item">📅 Tham gia: ${escapeHtml(formatDate(state.user?.created_at))}</div>
            <div class="ph-meta-item">📍 ${escapeHtml(location)}</div>
            <div class="ph-meta-item">🔥 Streak: ${escapeHtml(String(streak))} ngày</div>
        `;
    }
    if (refs.heroLevelBadge) {
        refs.heroLevelBadge.textContent = `⭐ Level ${currentLevel} — ${levelInfo.title || 'Hành trình'}`;
    }
    if (refs.heroXpLabel) {
        const target = Number.isFinite(levelInfo.maxXP) ? levelInfo.maxXP : totalXp;
        refs.heroXpLabel.innerHTML = `
            <span>${totalXp} XP</span>
            <span>${levelInfo.xp_to_next > 0 ? `Còn ${levelInfo.xp_to_next} XP → Level ${currentLevel + 1}` : 'Đang ở mốc cao nhất hiện tại'}</span>
        `;
        if (!Number.isFinite(levelInfo.maxXP) && target === totalXp) {
            refs.heroXpLabel.firstElementChild.textContent = `${totalXp} XP • MAX`;
        }
    }
    if (refs.heroXpFill) refs.heroXpFill.style.width = `${levelInfo.progress_percent || 0}%`;
    if (refs.sidebarUserLevel) refs.sidebarUserLevel.textContent = `⭐ ${totalXp} XP · Level ${currentLevel}`;
}

function renderAvatarGrid() {
    if (!refs.avatarGrid) return;
    refs.avatarGrid.innerHTML = AVATARS.map((avatar) => `
        <div class="avatar-option ${avatar === getAvatarEmoji() ? 'selected' : ''}" data-avatar="${escapeHtml(avatar)}">${escapeHtml(avatar)}</div>
    `).join('');
}

function renderGoals() {
    const goals = Array.isArray(state.profile?.goals) ? state.profile.goals : [];
    state.selectedGoals = new Set(goals);

    refs.goalChips?.querySelectorAll('.goal-chip').forEach((chip) => {
        chip.classList.toggle('selected', state.selectedGoals.has(chip.textContent.trim()));
    });
}

function renderBadges() {
    if (!refs.badgesGrid) return;
    const badges = state.achievements?.badges || [];

    refs.badgesGrid.innerHTML = badges.length
        ? badges.map((badge) => `
            <div class="badge-item ${badge.earned ? 'earned' : 'locked'}">
                <div class="bi-icon">${escapeHtml(badge.icon || '🏅')}</div>
                <div class="bi-name">${escapeHtml(badge.name)}</div>
                <div class="bi-desc">${badge.earned ? (badge.earned_at ? `Đạt ${escapeHtml(formatDate(badge.earned_at))}` : 'Đã đạt') : `${badge.current_value}/${badge.target_value}`}</div>
            </div>
        `).join('')
        : '<div style="grid-column:1/-1;color:var(--text-secondary);">Chưa có badge nào trong hồ sơ.</div>';

    const title = refs.badgesGrid.closest('.section-card')?.querySelector('.sc-title');
    if (title) {
        title.textContent = `🏅 Huy hiệu đã đạt được (${state.achievements?.summary?.badges_earned || 0}/${state.achievements?.summary?.badges_total || 0})`;
    }
}

function renderLevelProgress() {
    if (!refs.levelProgress) return;
    const levels = state.achievements?.levels || [];
    refs.levelProgress.innerHTML = levels.map((level) => `
        <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px dashed var(--kraft-light);">
            <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid ${level.is_current ? 'var(--mint-dark)' : level.is_completed ? 'var(--gold)' : 'var(--kraft-light)'};background:${level.is_current ? 'var(--mint-light)' : level.is_completed ? 'var(--gold-light)' : 'var(--cream)'};font-weight:800;">
                ${level.is_completed ? '✓' : level.level}
            </div>
            <div style="flex:1;">
                <div style="font-size:0.86rem;font-weight:800;">Level ${level.level} — ${escapeHtml(level.title)}</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);margin:4px 0 6px;">
                    ${Number.isFinite(level.maxXP) ? `${level.minXP} - ${level.maxXP} XP` : `${level.minXP}+ XP`}
                </div>
                <div class="ph-xp-bar" style="height:8px;">
                    <div class="ph-xp-fill" style="width:${level.progress_percent}%;"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderActivity() {
    if (refs.activityStatsGrid) {
        const tasks = state.report?.task_history?.length || 0;
        const journals = state.report?.journal_history?.length || 0;
        const assessments = state.report?.assessments?.length || 0;
        const streak = state.progress?.current_streak || 0;

        refs.activityStatsGrid.innerHTML = `
            <div class="paper-card stat-box">
                <div class="sb-num">${tasks}</div>
                <div class="sb-label">Nhiệm vụ hoàn thành</div>
            </div>
            <div class="paper-card stat-box">
                <div class="sb-num">${journals}</div>
                <div class="sb-label">Bài nhật ký</div>
            </div>
            <div class="paper-card stat-box">
                <div class="sb-num">${assessments}</div>
                <div class="sb-label">Bài test tâm lý</div>
            </div>
            <div class="paper-card stat-box">
                <div class="sb-num">${streak} 🔥</div>
                <div class="sb-label">Streak hiện tại</div>
            </div>
        `;
    }

    if (!refs.activityTimeline) return;

    const timeline = [
        ...(state.report?.task_history || []).slice(0, 6).map((item) => ({
            type: 'task',
            date: item.created_at,
            title: item.title,
            meta: `+${item.xp_earned || 0} XP • ${item.category || 'Nhiệm vụ'}`
        })),
        ...(state.report?.journal_history || []).slice(0, 6).map((item) => ({
            type: 'journal',
            date: item.created_at,
            title: item.title || 'Nhật ký cảm xúc',
            meta: 'Đã lưu vào hồ sơ cảm xúc'
        })),
        ...(state.report?.assessments || []).slice(0, 6).map((item) => ({
            type: 'assessment',
            date: item.created_at,
            title: item.name,
            meta: `${item.severity || 'Đã hoàn thành'} • ${item.total_score || 0} điểm`
        }))
    ].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 8);

    refs.activityTimeline.innerHTML = timeline.length
        ? timeline.map((item) => `
            <div style="display:flex;gap:10px;padding:12px 0;border-bottom:1px dashed var(--kraft-light);">
                <div style="width:34px;height:34px;border-radius:12px;background:var(--cream);border:1.5px solid var(--kraft-light);display:flex;align-items:center;justify-content:center;">
                    ${item.type === 'task' ? '🧩' : item.type === 'journal' ? '📝' : '📊'}
                </div>
                <div style="flex:1;">
                    <div style="font-size:0.8rem;font-weight:800;">${escapeHtml(item.title)}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">${escapeHtml(item.meta)}</div>
                </div>
                <div style="font-size:0.68rem;color:var(--text-light);white-space:nowrap;">${escapeHtml(formatRelativeDate(item.date))}</div>
            </div>
        `).join('')
        : '<div style="color:var(--text-secondary);">Chưa có hoạt động nào được ghi nhận.</div>';
}

function renderSettings() {
    if (refs.notifSettings) {
        refs.notifSettings.innerHTML = `
            ${makeToggleRow('Nhắc mood check-in', 'Lưu cục bộ trên thiết bị này.', state.localSettings.moodReminder ?? true, 'moodReminder')}
            ${makeToggleRow('Nhắc viết nhật ký', 'Hiện chưa có bảng settings riêng trên backend.', state.localSettings.journalReminder ?? false, 'journalReminder')}
            ${makeToggleRow('Thông báo badge mới', 'Hiển thị khi hệ thống award badge.', state.localSettings.badgeAlerts ?? true, 'badgeAlerts')}
        `;
    }

    if (refs.privacySettings) {
        refs.privacySettings.innerHTML = `
            ${makeToggleRow('Ẩn hồ sơ khỏi cộng đồng', 'Chưa có backend settings riêng, hiện lưu cục bộ.', state.localSettings.hideCommunity ?? true, 'hideCommunity')}
            ${makeToggleRow('Ẩn thành tích công khai', 'Ảnh hưởng tới cách hiển thị hồ sơ về sau.', state.localSettings.hideAchievements ?? false, 'hideAchievements')}
        `;
    }

    if (refs.deviceList) {
        refs.deviceList.innerHTML = `
            <div style="padding:10px 0;border-bottom:1px dashed var(--kraft-light);">
                <div style="font-size:0.8rem;font-weight:800;">Trình duyệt hiện tại</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);">Đã đăng nhập gần đây • Đồng bộ qua session hiện tại</div>
            </div>
            <div style="padding-top:10px;font-size:0.74rem;color:var(--text-light);">
                Danh sách thiết bị chi tiết chưa có bảng quản lý riêng trên backend.
            </div>
        `;
    }
}

function makeToggleRow(title, desc, checked, settingKey) {
    return `
        <div class="toggle-row">
            <div class="tr-left">
                <div class="tr-title">${escapeHtml(title)}</div>
                <div class="tr-desc">${escapeHtml(desc)}</div>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" data-setting-key="${escapeHtml(settingKey)}" ${checked ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        </div>
    `;
}

function renderRightRail() {
    if (refs.streakCard) {
        const totalXp = state.progress?.total_xp || 0;
        const level = state.progress?.current_level || 1;
        const streak = state.progress?.current_streak || 0;
        refs.streakCard.innerHTML = `
            <div class="rc-title">🔥 Chuỗi hoạt động</div>
            <div class="streak-display">
                <div class="sd-num">${streak} 🔥</div>
                <div class="sd-label">ngày liên tục</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div style="text-align:center;padding:8px;background:var(--cream);border-radius:var(--border-radius-sm);border:1.5px solid var(--kraft-light);">
                    <div style="font-size:1rem;font-weight:800;color:var(--mint-dark);">${totalXp}</div>
                    <div style="font-size:0.62rem;color:var(--text-secondary);">Tổng XP</div>
                </div>
                <div style="text-align:center;padding:8px;background:var(--cream);border-radius:var(--border-radius-sm);border:1.5px solid var(--kraft-light);">
                    <div style="font-size:1rem;font-weight:800;color:var(--lavender);">Level ${level}</div>
                    <div style="font-size:0.62rem;color:var(--text-secondary);">Cấp độ</div>
                </div>
            </div>
        `;
    }

    if (refs.tipCard) {
        const nextBadge = state.achievements?.next_badge;
        refs.tipCard.innerHTML = `
            <div style="display:flex;gap:8px;align-items:flex-start;">
                <span style="font-size:1.2rem;">🐱</span>
                <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">
                    ${nextBadge
                        ? `Hồ sơ của bạn đang khá đồng bộ. Mốc gần nhất là ${escapeHtml(nextBadge.name)} với tiến độ ${nextBadge.current_value}/${nextBadge.target_value}.`
                        : 'Hồ sơ của bạn đã được đồng bộ với tiến trình hiện tại trên hệ thống.'}
                </div>
            </div>
        `;
    }
}

function renderPage() {
    renderTabs();
    renderForm();
    renderAvatarGrid();
    renderGoals();
    renderHero();
    renderBadges();
    renderLevelProgress();
    renderActivity();
    renderSettings();
    renderRightRail();
}

async function loadData() {
    const [user, profile, progress, achievements, report] = await Promise.all([
        apiClient.get('/me'),
        apiClient.get('/profile'),
        apiClient.get('/progress'),
        apiClient.get('/achievements'),
        apiClient.get('/reports/detail')
    ]);

    state.user = user;
    state.profile = profile || {};
    state.progress = progress || {};
    state.achievements = achievements || {};
    state.report = report || {};
    state.selectedAvatar = state.profile?.onboarding_answers?.avatar_emoji || '🐱';
    syncStoredUser();
}

async function saveProfile() {
    // Người dùng lưu thông tin hồ sơ cá nhân (tên, giới tính, tagline, avatar...)
    EventLogger.log('profile', 'save:attempt', {
        displayName: refs.displayName?.value?.trim(),
        avatar: state.selectedAvatar
    });
    const saveBtn = document.querySelector('.btn-primary[onclick*="saveProfile"]');
    if (saveBtn) saveBtn.textContent = 'Đang lưu...';

    try {
        const onboardingAnswers = {
            ...(state.profile?.onboarding_answers || {}),
            nickname: refs.nickname?.value?.trim() || '',
            tagline: refs.tagline?.value?.trim() || '',
            bio: refs.bio?.value?.trim() || '',
            ageGroup: refs.ageGroup?.value || '',
            avatar_emoji: state.selectedAvatar
        };

        const [user, profile] = await Promise.all([
            apiClient.put('/me', {
                display_name: refs.displayName?.value?.trim() || null,
                phone: refs.phone?.value?.trim() || null,
                gender: mapDisplayToGender(refs.gender?.value || '')
            }),
            apiClient.put('/profile', {
                onboarding_answers: onboardingAnswers
            })
        ]);

        state.user = user;
        state.profile = profile;
        syncStoredUser();
        EventLogger.log('profile', 'save:success', { userId: state.user?.id, avatar: state.selectedAvatar });
        renderPage();
        showToast('Đã lưu thông tin hồ sơ.');
    } catch (error) {
        EventLogger.error('profile', 'save:failed', error);
        console.error('Profile save failed:', error);
        showToast('Không lưu được hồ sơ.', 'error');
    } finally {
        if (saveBtn) saveBtn.textContent = '💾 Lưu thay đổi';
    }
}

async function saveGoals() {
    // Người dùng lưu danh sách mục tiêu sức khỏe tâm thần đã chọn
    EventLogger.log('profile', 'goals:save:attempt', { goals: Array.from(state.selectedGoals) });
    const saveBtn = document.querySelector('.btn-primary[onclick*="saveGoals"]');
    if (saveBtn) saveBtn.textContent = 'Đang lưu...';

    try {
        const profile = await apiClient.put('/profile', {
            goals: Array.from(state.selectedGoals),
            support_preferences: {
                goal_duration_minutes: Number((refs.goalDuration?.value || '10').replace(/\D+/g, '')) || 10,
                reminder_time: refs.reminderTime?.value || '08:00'
            }
        });

        state.profile = profile;
        EventLogger.log('profile', 'goals:save:success', { goals: Array.from(state.selectedGoals) });
        renderPage();
        showToast('Đã lưu mục tiêu.');
    } catch (error) {
        EventLogger.error('profile', 'goals:save:failed', error, { goals: Array.from(state.selectedGoals) });
        console.error('Goals save failed:', error);
        showToast('Không lưu được mục tiêu.', 'error');
    } finally {
        if (saveBtn) saveBtn.textContent = '💾 Lưu mục tiêu';
    }
}

function resetForm() {
    renderForm();
    renderGoals();
    renderAvatarGrid();
    showToast('Đã khôi phục dữ liệu từ hồ sơ hiện tại.', 'info');
}

function toggleGoal(chip) {
    const label = chip?.textContent?.trim();
    if (!label) return;

    // Người dùng chọn/bỏ chọn một mục tiêu sức khỏe tâm thần
    const wasSelected = state.selectedGoals.has(label);
    EventLogger.log('profile', 'goal:toggle', { goal: label, active: !wasSelected });
    if (state.selectedGoals.has(label)) state.selectedGoals.delete(label);
    else state.selectedGoals.add(label);

    chip.classList.toggle('selected', state.selectedGoals.has(label));
}

function switchTab(tab) {
    // Người dùng chuyển tab trong trang hồ sơ (Thông tin, Huy hiệu, Hoạt động, Cài đặt)
    EventLogger.log('profile', 'tab:switch', { tab, previous: state.activeTab });
    state.activeTab = tab;
    renderTabs();
}

function saveSettings() {
    // Người dùng lưu cài đặt riêng tư/thông báo trên trang hồ sơ
    EventLogger.log('profile', 'settings:save:local');
    document.querySelectorAll('[data-setting-key]').forEach((input) => {
        state.localSettings[input.dataset.settingKey] = Boolean(input.checked);
    });
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(state.localSettings));
    showToast('Đã lưu cài đặt cục bộ trên thiết bị này.', 'info');
}

function savePassword() {
    showToast('Backend hiện chưa có endpoint đổi mật khẩu trên trang này.', 'info');
}

function exportData(format) {
    // Người dùng xuất dữ liệu hồ sơ ra file
    EventLogger.log('profile', 'data:export', { format });
    if (format === 'json') {
        const payload = {
            user: state.user,
            profile: state.profile,
            progress: state.progress,
            achievements: {
                summary: state.achievements?.summary,
                recent_badges: state.achievements?.recent_badges
            }
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'peaceflow-profile-export.json';
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('Đã xuất dữ liệu JSON.');
        return;
    }

    showToast('Xuất PDF chưa được nối backend ở trang này.', 'info');
}

function confirmAction(action, _icon, title, message) {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (!confirmed) return;
    showToast(`Chức năng ${action} chưa được backend hỗ trợ trực tiếp trên trang này.`, 'info');
}

function bindEvents() {
    refs.avatarGrid?.addEventListener('click', (event) => {
        const option = event.target.closest('[data-avatar]');
        if (!option) return;
        // Người dùng chọn avatar emoji mới cho hồ sơ
        EventLogger.log('profile', 'avatar:select', { avatar: option.dataset.avatar, previous: state.selectedAvatar });
        state.selectedAvatar = option.dataset.avatar;
        renderAvatarGrid();
        renderHero();
    });
}

async function init() {
    await loadData();
    bindEvents();
    renderPage();
}

document.addEventListener('DOMContentLoaded', () => {
    init().catch((error) => {
        console.error('Profile init failed:', error);
        showToast('Không tải được hồ sơ từ máy chủ.', 'error');
    });
});

window.saveProfile = saveProfile;
window.resetForm = resetForm;
window.saveGoals = saveGoals;
window.toggleGoal = toggleGoal;
window.switchTab = switchTab;
window.saveSettings = saveSettings;
window.savePassword = savePassword;
window.exportData = exportData;
window.confirmAction = confirmAction;
window.showToast = showToast;
