import { apiClient } from './api-client.js';
import { EventLogger } from './event-logger.js';

window.__communityApiMode = true;

const REACTION_META = {
    heart: { icon: '❤️', label: 'Thương' },
    hug: { icon: '🤗', label: 'Ôm' },
    strong: { icon: '💪', label: 'Cố lên' },
    star: { icon: '⭐', label: 'Hay quá' }
};

const CATEGORY_LABELS = {
    gratitude: '#biếton',
    story: '#câuchuyện',
    milestone: '#milestone',
    question: '#hỏiđáp',
    tip: '#mẹohay'
};

const state = {
    loading: false,
    posts: [],
    summary: null,
    challenge: null,
    leaderboard: {
        xp: [],
        streak: [],
        tasks: []
    },
    mentors: [],
    currentFilter: 'all',
    leaderboardTab: 'xp',
    leaderboardHidden: localStorage.getItem('peaceflow_lb_hidden') === '1',
    anonymousPosting: false,
    joinedChallenge: localStorage.getItem('peaceflow_joined_community_challenge') === '1',
    selectedTags: [],
    openComments: new Set(),
    expandedPosts: new Set(),
    reportPostId: null,
    currentUser: parseStoredUser(),
    progress: null
};

const refs = {
    postFeed: document.getElementById('postFeed'),
    postTextarea: document.getElementById('postTextarea'),
    postCharCount: document.getElementById('postCharCount'),
    anonToggle: document.getElementById('anonToggle'),
    anonIcon: document.getElementById('anonIcon'),
    anonLabel: document.getElementById('anonLabel'),
    anonNote: document.getElementById('anonNote'),
    composerAvatar: document.getElementById('composerAvatar'),
    leaderboardList: document.getElementById('leaderboardList'),
    mentorList: document.getElementById('mentorList'),
    statMembers: document.getElementById('communityStatMembers'),
    statPosts: document.getElementById('communityStatPosts'),
    statReactions: document.getElementById('communityStatReactions'),
    statPositive: document.getElementById('communityStatPositive'),
    challengeTitle: document.getElementById('communityChallengeTitle'),
    challengeDesc: document.getElementById('communityChallengeDesc'),
    challengeLabel: document.getElementById('communityChallengeLabel'),
    challengeFill: document.getElementById('communityChallengeFill'),
    challengeStats: document.getElementById('communityChallengeStats'),
    joinButton: document.getElementById('joinChallengeBtn'),
    reportOverlay: document.getElementById('reportModalOverlay'),
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText')
};

function parseStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
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

function showToast(message) {
    if (!refs.toast || !refs.toastText) {
        return;
    }

    refs.toastText.textContent = message;
    refs.toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        refs.toast.classList.remove('show');
    }, 2400);
}

function normalizeVietnamese(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replaceAll('đ', 'd')
        .replaceAll('#', '')
        .replaceAll(' ', '');
}

function mapTagToCategory(value) {
    const normalized = normalizeVietnamese(value);

    if (normalized.includes('bieton')) return 'gratitude';
    if (normalized.includes('cauchuyen')) return 'story';
    if (normalized.includes('milestone')) return 'milestone';
    if (normalized.includes('hoidap')) return 'question';
    if (normalized.includes('meohay')) return 'tip';
    return 'story';
}

function getCurrentUserName() {
    return state.currentUser?.display_name || state.currentUser?.full_name || state.currentUser?.email || 'Bạn';
}

function getCurrentUserAvatar() {
    return state.anonymousPosting ? '🌿' : '🐱';
}

function getSelectedCategory() {
    if (!state.selectedTags.length) {
        return 'story';
    }
    return mapTagToCategory(state.selectedTags[0]);
}

function formatCompactNumber(value) {
    return Number(value || 0).toLocaleString('vi-VN');
}

function formatPercent(value) {
    return `${Math.round(Number(value || 0))}%`;
}

function updateSidebarUser() {
    const nameNode = document.querySelector('[data-user-field="display_name"]');
    if (nameNode) {
        nameNode.textContent = getCurrentUserName();
    }

    const levelNode = document.querySelector('.sidebar-bottom .user-level');
    if (levelNode && state.progress) {
        levelNode.textContent = `⭐ ${state.progress.total_xp || 0} XP · Level ${state.progress.current_level || 1}`;
    }
}

function renderComposerState() {
    if (refs.composerAvatar) {
        refs.composerAvatar.textContent = getCurrentUserAvatar();
    }

    if (refs.anonToggle) {
        refs.anonToggle.classList.toggle('active', state.anonymousPosting);
    }

    if (refs.anonIcon) {
        refs.anonIcon.textContent = state.anonymousPosting ? '🌿' : '👤';
    }

    if (refs.anonLabel) {
        refs.anonLabel.textContent = state.anonymousPosting ? 'Ẩn danh: Bật' : 'Ẩn danh';
    }

    if (refs.anonNote) {
        refs.anonNote.textContent = state.anonymousPosting
            ? 'Đang đăng ẩn danh'
            : `Đăng với tên ${getCurrentUserName()}`;
    }
}

function renderSummary() {
    if (refs.statMembers) refs.statMembers.textContent = formatCompactNumber(state.summary?.members);
    if (refs.statPosts) refs.statPosts.textContent = formatCompactNumber(state.summary?.posts);
    if (refs.statReactions) refs.statReactions.textContent = formatCompactNumber(state.summary?.reactions);
    if (refs.statPositive) refs.statPositive.textContent = formatPercent(state.summary?.positive_rate ?? 100);
}

function renderChallenge() {
    const challenge = state.challenge;
    if (!challenge) return;

    if (refs.challengeTitle) refs.challengeTitle.textContent = challenge.title;
    if (refs.challengeDesc) refs.challengeDesc.textContent = challenge.description;
    if (refs.challengeLabel) {
        refs.challengeLabel.innerHTML = `
            <span>⏱ ${formatCompactNumber(challenge.total_minutes)} / ${formatCompactNumber(challenge.goal)} phút</span>
            <span>${challenge.progress_percent}% hoàn thành</span>
        `;
    }
    if (refs.challengeFill) {
        refs.challengeFill.style.width = `${Math.min(100, Number(challenge.progress_percent || 0))}%`;
    }
    if (refs.challengeStats) {
        refs.challengeStats.innerHTML = `
            <div class="cb-stat">👥 <strong>${formatCompactNumber(challenge.participants)}</strong> người tham gia</div>
            <div class="cb-stat">⏰ Còn <strong>${formatCompactNumber(challenge.days_left)}</strong> ngày</div>
            <div class="cb-stat">🏆 Phần thưởng: <strong>+100 XP</strong> + huy hiệu cộng đồng</div>
        `;
    }
    if (refs.joinButton) {
        refs.joinButton.textContent = state.joinedChallenge ? 'Đã tham gia' : 'Tham gia ngay';
        refs.joinButton.disabled = state.joinedChallenge;
        refs.joinButton.style.opacity = state.joinedChallenge ? '0.8' : '1';
    }
}

function postMatchesFilter(post) {
    return state.currentFilter === 'all' || post.tag === state.currentFilter;
}

function isLongPost(content) {
    return String(content || '').length > 220;
}

function renderComments(post) {
    const comments = Array.isArray(post.comments) ? post.comments : [];

    return `
        <div class="comments-section ${state.openComments.has(post.id) ? 'show' : ''}" id="comments-${post.id}">
            ${comments.length
                ? comments.map((comment) => `
                    <div class="comment-item">
                        <div class="ci-avatar">${escapeHtml(comment.avatar || '🌿')}</div>
                        <div class="ci-bubble">
                            <div class="ci-name">${escapeHtml(comment.name || 'Người dùng')}</div>
                            <div class="ci-text">${escapeHtml(comment.text || '')}</div>
                        </div>
                    </div>
                `).join('')
                : '<div style="font-size:0.72rem;color:var(--text-light);margin-bottom:8px;">Chưa có bình luận nào. Bạn có thể mở lời trước.</div>'}
            <div class="comment-input-row">
                <input
                    class="comment-input"
                    id="comment-input-${post.id}"
                    placeholder="Viết lời nhắn dịu dàng..."
                    maxlength="240"
                />
                <button class="comment-send" onclick="submitComment('${post.id}')">Gửi</button>
            </div>
        </div>
    `;
}

function renderPostCard(post) {
    const collapsed = isLongPost(post.content) && !state.expandedPosts.has(post.id);
    const reactionButtons = Object.entries(REACTION_META).map(([key, meta]) => `
        <button
            class="reaction-btn ${post.myReactions?.[key] ? `reacted ${key}` : ''}"
            onclick="toggleReaction('${post.id}','${key}')"
        >
            <span>${meta.icon}</span>
            <span>${meta.label}</span>
            <span class="reaction-count">${formatCompactNumber(post.reactions?.[key] || 0)}</span>
        </button>
    `).join('');

    return `
        <article class="paper-card post-card">
            <div class="post-header">
                <div class="post-author">
                    <div class="pa-avatar ${post.anon ? 'anon' : 'user'}">${escapeHtml(post.avatar || '🌿')}</div>
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <div class="pa-name">${escapeHtml(post.name || 'Người dùng')}</div>
                            ${post.level ? `<span class="pa-level">${escapeHtml(post.level)}</span>` : ''}
                        </div>
                        <div class="pa-meta">${escapeHtml(post.time || 'Vừa xong')}</div>
                    </div>
                </div>
                <button class="post-menu" onclick="openReportModal('${post.id}')" title="Báo cáo bài viết">⋯</button>
            </div>
            <div class="post-tag ${escapeHtml(post.tagClass || '')}">${escapeHtml(post.tagLabel || '📖 Câu chuyện')}</div>
            <div class="post-content ${collapsed ? 'collapsed' : ''}" id="post-content-${post.id}">
                ${escapeHtml(post.content || '')}
            </div>
            ${isLongPost(post.content)
                ? `<div class="read-more" onclick="togglePostExpand('${post.id}')">${collapsed ? 'Xem thêm' : 'Thu gọn'}</div>`
                : ''}
            <div class="post-reactions">
                ${reactionButtons}
                <button class="comment-btn" onclick="toggleComments('${post.id}')">
                    💬 ${formatCompactNumber(post.comments?.length || 0)} bình luận
                </button>
            </div>
            ${renderComments(post)}
        </article>
    `;
}

function renderPosts() {
    if (!refs.postFeed) return;

    const posts = state.posts.filter(postMatchesFilter);
    if (!posts.length) {
        const isAllFilter = !state.activeFilter || state.activeFilter === 'all';
        refs.postFeed.innerHTML = `
            <div class="paper-card post-card" style="text-align:center;padding:32px 20px;">
                <div style="font-size:2rem;margin-bottom:10px;">💬</div>
                <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">
                    ${isAllFilter ? 'Cộng đồng chưa có bài viết nào' : 'Chưa có bài viết cho bộ lọc này'}
                </div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;">
                    ${isAllFilter ? 'Hãy là người đầu tiên chia sẻ cảm xúc, câu chuyện hoặc mẹo hay với cộng đồng!' : 'Thử chọn bộ lọc khác hoặc đăng bài mới.'}
                </div>
                <button onclick="window.scrollToComposer && window.scrollToComposer()" style="padding:10px 22px;background:var(--mint-dark);color:white;border:none;border-radius:50px;font-weight:700;font-size:0.85rem;cursor:pointer;">
                    ✍️ Viết bài ngay
                </button>
            </div>
        `;
        return;
    }

    refs.postFeed.innerHTML = posts.map(renderPostCard).join('');
}

function renderLeaderboard() {
    if (!refs.leaderboardList) return;

    if (state.leaderboardHidden) {
        refs.leaderboardList.innerHTML = `
            <div style="font-size:0.75rem;color:var(--text-secondary);padding:8px 0;">
                Bảng xếp hạng đang được ẩn trên thiết bị này.
            </div>
        `;
        return;
    }

    const items = state.leaderboard[state.leaderboardTab] || [];
    if (!items.length) {
        refs.leaderboardList.innerHTML = `
            <div style="font-size:0.75rem;color:var(--text-secondary);padding:8px 0;">
                Chưa có dữ liệu xếp hạng.
            </div>
        `;
        return;
    }

    const myName = getCurrentUserName().toLowerCase();
    refs.leaderboardList.innerHTML = items.map((item, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const isMe = String(item.name || '').toLowerCase() === myName;

        return `
            <div class="lb-item ${isMe ? 'me' : ''}">
                <div class="lb-rank ${rankClass}">${index + 1}</div>
                <div style="flex:1;">
                    <div style="font-size:0.76rem;font-weight:700;">${escapeHtml(item.name || 'Người dùng')}</div>
                    <div style="font-size:0.66rem;color:var(--text-light);">${escapeHtml(item.subtitle || '')}</div>
                </div>
                <div style="font-size:0.78rem;font-weight:800;color:var(--mint-dark);">${formatCompactNumber(item.value)}</div>
            </div>
        `;
    }).join('');
}

function renderMentors() {
    if (!refs.mentorList) return;

    if (!state.mentors.length) {
        refs.mentorList.innerHTML = `
            <div style="font-size:0.72rem;color:var(--text-secondary);">Chưa có mentor cộng đồng khả dụng.</div>
        `;
        return;
    }

    refs.mentorList.innerHTML = state.mentors.map((mentor, index) => `
        <div class="mentor-item">
            <div class="mi-avatar">${['🌟', '🧘', '🌿'][index % 3]}</div>
            <div class="mi-info">
                <div class="mi-name">${escapeHtml(mentor.name || 'Mentor')}</div>
                <div class="mi-level">Level ${escapeHtml(String(mentor.current_level || 5))} · ${formatCompactNumber(mentor.total_xp || 0)} XP · streak ${formatCompactNumber(mentor.current_streak || 0)}</div>
            </div>
            <button class="mi-btn" onclick="showToast('Tính năng nhắn mentor sẽ được nối DB ở bước sau.')">Nhắn</button>
        </div>
    `).join('');
}

function updateFilterButtons(activeButton) {
    const buttons = document.querySelectorAll('.ff-btn');
    buttons.forEach((button) => {
        button.classList.toggle('active', button === activeButton);
    });
}

function updateLeaderboardTabs(activeButton) {
    const tabs = document.querySelectorAll('.lb-tab');
    tabs.forEach((tab) => {
        tab.classList.toggle('active', tab === activeButton);
    });
}

async function fetchCommunity() {
    state.loading = true;

    try {
        const [community, meResult, progressResult] = await Promise.all([
            apiClient.get('/community'),
            apiClient.get('/me').catch(() => null),
            apiClient.get('/progress').catch(() => null)
        ]);

        state.summary = community.summary || null;
        state.posts = Array.isArray(community.posts) ? community.posts : [];
        state.challenge = community.challenge || null;
        state.leaderboard = community.leaderboard || state.leaderboard;
        state.mentors = Array.isArray(community.mentors) ? community.mentors : [];
        state.currentUser = meResult || state.currentUser;
        state.progress = progressResult || state.progress;

        renderSummary();
        renderChallenge();
        renderComposerState();
        renderLeaderboard();
        renderMentors();
        renderPosts();
        updateSidebarUser();
    } catch (error) {
        console.error('Failed to load community data:', error);
        if (refs.postFeed) {
            refs.postFeed.innerHTML = `
                <div class="paper-card post-card" style="text-align:center;color:var(--coral);">
                    Không tải được cộng đồng từ máy chủ. Hãy thử refresh lại trang.
                </div>
            `;
        }
    } finally {
        state.loading = false;
    }
}

function setPostCountFromElement(element) {
    if (refs.postCharCount) {
        refs.postCharCount.textContent = String(element?.value?.length || 0);
    }
}

function syncSelectedTagStyles() {
    const tags = document.querySelectorAll('.pc-tag');
    tags.forEach((tag) => {
        const key = tag.textContent?.trim() || '';
        tag.classList.toggle('active', state.selectedTags.includes(key));
    });
}

function applyPostPatch(postId, patcher) {
    state.posts = state.posts.map((post) => (
        post.id === postId ? patcher(post) : post
    ));
    renderPosts();
}

async function handleSubmitPost() {
    const content = refs.postTextarea?.value?.trim();
    if (!content) {
        showToast('Hãy viết điều bạn muốn chia sẻ trước khi đăng.');
        return;
    }

    // Người dùng gửi bài viết lên cộng đồng
    EventLogger.log('community', 'post:submit:attempt', {
        contentLength: content.length,
        tags: state.selectedTags,
        category: getSelectedCategory(),
        isAnonymous: state.anonymousPosting
    });

    try {
        const created = await apiClient.post('/community/posts', {
            content,
            tags: state.selectedTags,
            category: getSelectedCategory(),
            is_anonymous: state.anonymousPosting
        });

        EventLogger.log('community', 'post:submit:success', { postId: created?.id, isAnonymous: state.anonymousPosting });

        state.posts.unshift(created);
        state.summary = {
            ...(state.summary || {}),
            posts: Number(state.summary?.posts || 0) + 1
        };

        if (refs.postTextarea) refs.postTextarea.value = '';
        state.selectedTags = [];
        syncSelectedTagStyles();
        setPostCountFromElement(refs.postTextarea);
        renderSummary();
        renderPosts();
        showToast('Bài viết đã được chia sẻ lên cộng đồng.');
    } catch (error) {
        EventLogger.error('community', 'post:submit:failed', error, { contentLength: content.length });
        showToast(error.message || 'Không thể đăng bài lúc này.');
    }
}

async function handleToggleReaction(postId, reactionType) {
    const post = state.posts.find((item) => item.id === postId);
    if (!post) return;

    // Người dùng thả/bỏ reaction trên một bài viết (❤️ Thương, 🤗 Ôm, 💪 Cố lên, ⭐ Hay quá)
    EventLogger.log('community', 'reaction:toggle', {
        postId,
        reactionType,
        wasReacted: Boolean(post.myReactions?.[reactionType])
    });

    try {
        const result = await apiClient.post(`/community/posts/${postId}/reactions`, {
            reaction_type: reactionType
        });

        applyPostPatch(postId, (current) => ({
            ...current,
            reactions: {
                heart: 0,
                hug: 0,
                strong: 0,
                star: 0,
                ...(result.reactions || {})
            },
            myReactions: {
                ...(current.myReactions || {}),
                [reactionType]: Boolean(result.reacted)
            }
        }));

        if (state.summary) {
            const diff = result.reacted ? 1 : -1;
            state.summary.reactions = Math.max(0, Number(state.summary.reactions || 0) + diff);
            renderSummary();
        }
    } catch (error) {
        EventLogger.error('community', 'reaction:toggle:failed', error, { postId, reactionType });
        showToast(error.message || 'Không thể cập nhật reaction.');
    }
}

async function handleSubmitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input?.value?.trim();
    if (!content) {
        showToast('Hãy viết bình luận trước khi gửi.');
        return;
    }

    // Người dùng gửi bình luận dưới một bài viết
    EventLogger.log('community', 'comment:submit:attempt', { postId, contentLength: content.length });

    try {
        const created = await apiClient.post(`/community/posts/${postId}/comments`, {
            content,
            is_anonymous: false
        });

        EventLogger.log('community', 'comment:submit:success', { postId, commentId: created?.id });

        applyPostPatch(postId, (post) => ({
            ...post,
            comments: [
                ...(post.comments || []),
                {
                    avatar: created.author_avatar || '🐱',
                    name: created.author_name || getCurrentUserName(),
                    text: created.content || content
                }
            ]
        }));

        state.openComments.add(postId);
        if (input) input.value = '';
        renderPosts();
        showToast('Bình luận đã được gửi.');
    } catch (error) {
        EventLogger.error('community', 'comment:submit:failed', error, { postId });
        showToast(error.message || 'Không thể gửi bình luận.');
    }
}

function initInlineApiHooks() {
    window.scrollToComposer = () => {
        // Người dùng nhấn nút "Viết gì đó" — cuộn xuống ô soạn thảo
        EventLogger.log('community', 'composer:focus');
        document.getElementById('postComposer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        refs.postTextarea?.focus();
    };

    window.toggleAnonymous = () => {
        // Người dùng bật/tắt chế độ đăng bài ẩn danh
        EventLogger.log('community', 'anonymous:toggle', { nowAnonymous: !state.anonymousPosting });
        state.anonymousPosting = !state.anonymousPosting;
        renderComposerState();
    };

    window.updatePostCount = (element) => {
        setPostCountFromElement(element);
    };

    window.togglePostTag = (element, tag) => {
        const label = (element?.textContent || tag || '').trim();
        if (!label) return;

        // Người dùng chọn/bỏ chọn hashtag cho bài viết (#biếton, #câuchuyện...)
        const wasActive = state.selectedTags.includes(label);
        EventLogger.log('community', 'post:tag:toggle', { tag: label, active: !wasActive });

        if (state.selectedTags.includes(label)) {
            state.selectedTags = state.selectedTags.filter((item) => item !== label);
        } else {
            state.selectedTags = [...state.selectedTags, label];
        }

        syncSelectedTagStyles();
    };

    window.submitPost = () => {
        handleSubmitPost();
    };

    window.filterFeed = (category, button) => {
        // Người dùng lọc bảng tin theo chủ đề (tất cả, biết ơn, câu chuyện...)
        EventLogger.log('community', 'feed:filter', { category: category || 'all', previousFilter: state.currentFilter });
        state.currentFilter = category || 'all';
        updateFilterButtons(button || null);
        renderPosts();
    };

    window.toggleReaction = (postId, reactionType) => {
        handleToggleReaction(postId, reactionType);
    };

    window.toggleComments = (postId) => {
        // Người dùng mở/đóng phần bình luận của một bài viết
        const willOpen = !state.openComments.has(postId);
        EventLogger.log('community', 'comments:toggle', { postId, open: willOpen });
        if (state.openComments.has(postId)) {
            state.openComments.delete(postId);
        } else {
            state.openComments.add(postId);
        }
        renderPosts();
    };

    window.submitComment = (postId) => {
        handleSubmitComment(postId);
    };

    window.switchLbTab = (tab, button) => {
        // Người dùng chuyển tab bảng xếp hạng (XP, Streak, Nhiệm vụ)
        EventLogger.log('community', 'leaderboard:tab:switch', { tab: tab || 'xp', previousTab: state.leaderboardTab });
        state.leaderboardTab = tab || 'xp';
        updateLeaderboardTabs(button || null);
        renderLeaderboard();
    };

    window.toggleLeaderboard = (element) => {
        // Người dùng ẩn/hiện bảng xếp hạng trên thiết bị này
        EventLogger.log('community', 'leaderboard:visibility:toggle', { willHide: !state.leaderboardHidden });
        state.leaderboardHidden = !state.leaderboardHidden;
        localStorage.setItem('peaceflow_lb_hidden', state.leaderboardHidden ? '1' : '0');
        if (element) {
            element.textContent = state.leaderboardHidden
                ? '👁 Hiện lại bảng xếp hạng'
                : '👁 Ẩn khỏi bảng xếp hạng';
        }
        renderLeaderboard();
    };

    window.joinChallenge = () => {
        if (state.joinedChallenge) return;
        // Người dùng tham gia thử thách cộng đồng tuần này
        EventLogger.log('community', 'challenge:join', { challengeTitle: state.challenge?.title });
        state.joinedChallenge = true;
        localStorage.setItem('peaceflow_joined_community_challenge', '1');
        renderChallenge();
        showToast('Bạn đã tham gia thử thách cộng đồng tuần này.');
    };

    window.togglePostExpand = (postId) => {
        // Người dùng mở rộng/thu gọn bài viết dài
        const willExpand = !state.expandedPosts.has(postId);
        EventLogger.log('community', 'post:expand:toggle', { postId, expand: willExpand });
        if (state.expandedPosts.has(postId)) {
            state.expandedPosts.delete(postId);
        } else {
            state.expandedPosts.add(postId);
        }
        renderPosts();
    };

    window.openReportModal = (postId) => {
        // Người dùng mở form báo cáo một bài viết vi phạm
        EventLogger.log('community', 'report:modal:open', { postId });
        state.reportPostId = postId;
        refs.reportOverlay?.classList.add('show');
    };

    window.closeReportModal = (event) => {
        if (event?.target === refs.reportOverlay) {
            refs.reportOverlay?.classList.remove('show');
        }
    };

    window.closeReportModalDirect = () => {
        refs.reportOverlay?.classList.remove('show');
    };

    window.submitReport = () => {
        // Người dùng gửi báo cáo vi phạm
        EventLogger.log('community', 'report:submit', { postId: state.reportPostId });
        refs.reportOverlay?.classList.remove('show');
        if (state.reportPostId) {
            showToast('Bài viết đã được ghi nhận báo cáo để moderator xem xét.');
        }
        state.reportPostId = null;
    };

    window.showToast = showToast;
}

function initStaticUiState() {
    renderComposerState();
    renderChallenge();

    const toggle = document.querySelector('.lb-hide-toggle');
    if (toggle) {
        toggle.textContent = state.leaderboardHidden
            ? '👁 Hiện lại bảng xếp hạng'
            : '👁 Ẩn khỏi bảng xếp hạng';
    }

    updateSidebarUser();
}

async function init() {
    initInlineApiHooks();
    initStaticUiState();
    setPostCountFromElement(refs.postTextarea);
    await fetchCommunity();
}

let _justBooted = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _justBooted = true; init(); }, { once: true });
} else {
    _justBooted = true;
    init();
}

window.addEventListener('peaceflow:route-mounted', (event) => {
    if ((event.detail?.page || '').split('?')[0] !== 'community.html') return;
    if (_justBooted) { _justBooted = false; return; }
    init();
});
