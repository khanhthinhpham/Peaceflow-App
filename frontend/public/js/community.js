import { apiClient } from './api-client.js';
import { EventLogger } from './event-logger.js';

window.__communityApiMode = true;

// Badge "Chuyên gia" hiển thị cạnh tên tác giả (bài viết & bình luận) khi tác giả là chuyên gia đã duyệt.
function expertBadgeHtml(isExpert) {
    if (!isExpert) return '';
    return '<span style="font-size:0.6rem;font-weight:800;background:var(--mint);color:var(--text-primary);padding:1px 6px;border-radius:6px;border:1px solid var(--mint-dark);white-space:nowrap;">🩺 Chuyên gia</span>';
}

function adminBadgeHtml(isAdmin) {
    if (!isAdmin) return '';
    return '<span style="font-size:0.6rem;font-weight:800;background:var(--coral,#FF8B8B);color:#fff;padding:1px 6px;border-radius:6px;border:1px solid var(--coral-dark,#E05555);white-space:nowrap;">🛡️ Admin</span>';
}

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
    progress: null,
    editingPostId: null,
    editingCommentId: null,
    replyingTo: null,
    openMenuPostId: null
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

function renderSingleComment(post, comment, isReply = false) {
    const myId = state.currentUser?.id;
    const isOwn = comment.userId && myId && comment.userId === myId;
    const isEditing = state.editingCommentId === comment.id;

    const contentHtml = isEditing
        ? `<textarea class="comment-edit-input" id="comment-edit-${comment.id}" maxlength="240">${escapeHtml(comment.text || '')}</textarea>
           <div class="comment-edit-actions">
               <button class="comment-send" onclick="saveCommentEdit('${post.id}','${comment.id}')">Lưu</button>
               <button class="btn-ghost" style="font-size:0.75rem;padding:3px 8px;" onclick="cancelCommentEdit()">Hủy</button>
           </div>`
        : `<div class="ci-text">${escapeHtml(comment.text || '')}</div>`;

    const actions = isEditing ? '' : `
        <div class="ci-actions">
            ${!isReply ? `<button class="ci-action-btn" onclick="toggleReply('${post.id}','${comment.id}')">Trả lời</button>` : ''}
            ${isOwn ? `<button class="ci-action-btn" onclick="editComment('${post.id}','${comment.id}')">Sửa</button>
                       <button class="ci-action-btn danger" onclick="deleteComment('${post.id}','${comment.id}')">Xóa</button>` : ''}
        </div>`;

    const replyInputHtml = (!isReply && state.replyingTo === comment.id) ? `
        <div class="reply-input-row">
            <input class="comment-input" id="reply-input-${comment.id}" placeholder="Trả lời ${escapeHtml(comment.name || '')}..." maxlength="240"/>
            <button class="comment-send" onclick="submitReply('${post.id}','${comment.id}')">Gửi</button>
        </div>` : '';

    return `
        <div class="comment-item ${isReply ? 'comment-reply' : ''}">
            <div class="ci-avatar">${escapeHtml(comment.avatar || '🌿')}</div>
            <div class="ci-bubble">
                <div class="ci-name" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${escapeHtml(comment.name || 'Người dùng')}${adminBadgeHtml(comment.isAdmin)}${expertBadgeHtml(comment.isExpert)}</div>
                ${contentHtml}
                ${actions}
            </div>
        </div>
        ${replyInputHtml}`;
}

function renderComments(post) {
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const topLevel = comments.filter((c) => !c.parentId);
    const repliesMap = {};
    comments.filter((c) => c.parentId).forEach((r) => {
        if (!repliesMap[r.parentId]) repliesMap[r.parentId] = [];
        repliesMap[r.parentId].push(r);
    });

    const commentsHtml = topLevel.length
        ? topLevel.map((comment) => {
            const replies = (repliesMap[comment.id] || [])
                .map((r) => renderSingleComment(post, r, true))
                .join('');
            return renderSingleComment(post, comment, false) + replies;
        }).join('')
        : '<div style="font-size:0.72rem;color:var(--text-light);margin-bottom:8px;">Chưa có bình luận nào. Bạn có thể mở lời trước.</div>';

    return `
        <div class="comments-section ${state.openComments.has(post.id) ? 'show' : ''}" id="comments-${post.id}">
            ${commentsHtml}
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

function renderReactionButtons(post) {
    return Object.entries(REACTION_META).map(([key, meta]) => `
        <button
            class="reaction-btn ${post.myReactions?.[key] ? `reacted ${key}` : ''}"
            data-reaction="${key}"
            onclick="toggleReaction('${post.id}','${key}')"
        >
            <span>${meta.icon}</span>
            <span>${meta.label}</span>
            <span class="reaction-count">${formatCompactNumber(post.reactions?.[key] || 0)}</span>
        </button>
    `).join('') + `
        <button class="comment-btn" onclick="toggleComments('${post.id}')">
            💬 ${formatCompactNumber(post.comments?.length || 0)} bình luận
        </button>
    `;
}

function patchPostReactions(postId) {
    const post = state.posts.find((p) => p.id === postId);
    const el = document.getElementById(`post-reactions-${postId}`);
    if (!post || !el) return;

    Object.keys(REACTION_META).forEach((key) => {
        const btn = el.querySelector(`[data-reaction="${key}"]`);
        if (!btn) return;
        const reacted = Boolean(post.myReactions?.[key]);
        btn.classList.toggle('reacted', reacted);
        btn.classList.toggle(key, reacted);
        btn.querySelector('.reaction-count').textContent = formatCompactNumber(post.reactions?.[key] || 0);
    });
}

function patchCommentSection(postId) {
    const post = state.posts.find((p) => p.id === postId);
    const el = document.getElementById(`comments-${postId}`);
    if (post && el) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderComments(post);
        el.replaceWith(tmp.firstElementChild);
    }
    patchPostReactions(postId);
}

function updatePostState(postId, patcher) {
    state.posts = state.posts.map((p) => (p.id === postId ? patcher(p) : p));
}

function renderPostCard(post) {
    const collapsed = isLongPost(post.content) && !state.expandedPosts.has(post.id);
    const isOwn = post.userId && state.currentUser?.id && post.userId === state.currentUser.id;
    const isEditing = state.editingPostId === post.id;
    const menuOpen = state.openMenuPostId === post.id;

    const menuDropdown = `
        <div class="post-menu-wrapper">
            <button class="post-menu" onclick="togglePostMenu('${post.id}')" title="Tùy chọn">⋯</button>
            <div class="post-menu-dropdown ${menuOpen ? 'open' : ''}">
                ${isOwn
                    ? `<button onclick="editPost('${post.id}')">✏️ Sửa bài</button>
                       <button onclick="deletePost('${post.id}')">🗑️ Xóa bài</button>`
                    : `<button onclick="openReportModal('${post.id}')">🚩 Báo cáo</button>`}
            </div>
        </div>`;

    const contentHtml = isEditing
        ? `<textarea class="post-edit-input" id="post-edit-${post.id}" maxlength="1000">${escapeHtml(post.content || '')}</textarea>
           <div class="post-edit-actions">
               <button class="comment-send" onclick="savePostEdit('${post.id}')">Lưu</button>
               <button class="btn-ghost" style="font-size:0.8rem;padding:4px 12px;" onclick="cancelPostEdit()">Hủy</button>
           </div>`
        : `<div class="post-content ${collapsed ? 'collapsed' : ''}" id="post-content-${post.id}">
               ${escapeHtml(post.content || '')}
           </div>
           ${isLongPost(post.content)
               ? `<div class="read-more" onclick="togglePostExpand('${post.id}')">${collapsed ? 'Xem thêm' : 'Thu gọn'}</div>`
               : ''}`;

    return `
        <article class="paper-card post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-author">
                    <div class="pa-avatar ${post.anon ? 'anon' : 'user'}">${escapeHtml(post.avatar || '🌿')}</div>
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <div class="pa-name">${escapeHtml(post.name || 'Người dùng')}</div>
                            ${adminBadgeHtml(post.isAdmin)}
                            ${expertBadgeHtml(post.isExpert)}
                            ${post.level ? `<span class="pa-level">${escapeHtml(post.level)}</span>` : ''}
                        </div>
                        <div class="pa-meta">${escapeHtml(post.time || 'Vừa xong')}</div>
                    </div>
                </div>
                ${menuDropdown}
            </div>
            <div class="post-tag ${escapeHtml(post.tagClass || '')}">${escapeHtml(post.tagLabel || '📖 Câu chuyện')}</div>
            ${contentHtml}
            <div class="post-reactions" id="post-reactions-${post.id}">
                ${renderReactionButtons(post)}
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
            <button class="mi-btn" onclick="showToast('Tính năng nhắn mentor sẽ được nối ở bước sau.')">Nhắn</button>
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

    const wasReacted = Boolean(post.myReactions?.[reactionType]);
    // Reaction đang active khác loại này (để optimistic xóa nó)
    const prevReactionType = Object.entries(post.myReactions || {})
        .find(([key, val]) => val && key !== reactionType)?.[0];

    EventLogger.log('community', 'reaction:toggle', { postId, reactionType, wasReacted });

    // Optimistic update — chỉ update đúng phần reaction, không render lại cả feed
    updatePostState(postId, (current) => {
        const newReactions = { ...current.reactions };
        const newMyReactions = { ...current.myReactions };
        if (prevReactionType) {
            newMyReactions[prevReactionType] = false;
            newReactions[prevReactionType] = Math.max(0, (newReactions[prevReactionType] || 0) - 1);
        }
        newMyReactions[reactionType] = !wasReacted;
        newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 0) + (wasReacted ? -1 : 1));
        return { ...current, reactions: newReactions, myReactions: newMyReactions };
    });
    patchPostReactions(postId);
    if (state.summary) {
        state.summary.reactions = Math.max(0, Number(state.summary.reactions || 0) + (wasReacted ? -1 : 1));
        renderSummary();
    }

    try {
        const result = await apiClient.post(`/community/posts/${postId}/reactions`, {
            reaction_type: reactionType
        });
        // Sync với data thật từ server
        updatePostState(postId, (current) => ({
            ...current,
            reactions: { heart: 0, hug: 0, strong: 0, star: 0, ...(result.reactions || {}) },
            myReactions: { ...(current.myReactions || {}), [reactionType]: Boolean(result.reacted) }
        }));
        patchPostReactions(postId);
    } catch (error) {
        // Revert nếu lỗi
        updatePostState(postId, (current) => ({
            ...current,
            reactions: {
                ...current.reactions,
                [reactionType]: Math.max(0, (current.reactions?.[reactionType] || 0) + (wasReacted ? 1 : -1))
            },
            myReactions: { ...(current.myReactions || {}), [reactionType]: wasReacted }
        }));
        patchPostReactions(postId);
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

    EventLogger.log('community', 'comment:submit:attempt', { postId, contentLength: content.length });

    // Optimistic update — chỉ update comments section, không render lại cả feed
    const optimisticComment = {
        id: `temp-${Date.now()}`,
        userId: state.currentUser?.id,
        parentId: null,
        avatar: '🐱',
        name: getCurrentUserName(),
        isExpert: Boolean(state.currentUser?.is_expert),
        isAdmin: state.currentUser?.role === 'admin',
        text: content
    };
    updatePostState(postId, (post) => ({
        ...post,
        comments: [...(post.comments || []), optimisticComment]
    }));
    state.openComments.add(postId);
    if (input) input.value = '';
    patchCommentSection(postId);

    try {
        const created = await apiClient.post(`/community/posts/${postId}/comments`, {
            content,
            is_anonymous: false
        });
        EventLogger.log('community', 'comment:submit:success', { postId, commentId: created?.id });
        // Sync tên/avatar thật từ server
        updatePostState(postId, (post) => {
            const comments = [...(post.comments || [])];
            const idx = comments.findIndex((c) => c.id === optimisticComment.id);
            if (idx !== -1) {
                comments[idx] = {
                    id: created.id,
                    userId: created.user_id,
                    parentId: null,
                    avatar: created.author_avatar || optimisticComment.avatar,
                    name: created.author_name || optimisticComment.name,
                    isExpert: Boolean(state.currentUser?.is_expert),
        isAdmin: state.currentUser?.role === 'admin',
                    text: created.content || content
                };
            }
            return { ...post, comments };
        });
        patchCommentSection(postId);
    } catch (error) {
        // Revert nếu lỗi
        updatePostState(postId, (post) => {
            const comments = [...(post.comments || [])];
            const idx = comments.lastIndexOf(optimisticComment);
            if (idx !== -1) comments.splice(idx, 1);
            return { ...post, comments };
        });
        patchCommentSection(postId);
        if (input) input.value = content;
        EventLogger.error('community', 'comment:submit:failed', error, { postId });
        showToast(error.message || 'Không thể gửi bình luận.');
    }
}

function patchPostCard(postId) {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;
    const el = document.querySelector(`[data-post-id="${postId}"]`);
    if (!el) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderPostCard(post);
    el.replaceWith(tmp.firstElementChild);
}

async function handleEditPost(postId) {
    state.openMenuPostId = null;
    state.editingPostId = postId;
    patchPostCard(postId);
    document.getElementById(`post-edit-${postId}`)?.focus();
}

function handleCancelPostEdit() {
    state.editingPostId = null;
    renderPosts();
}

async function handleSavePostEdit(postId) {
    const textarea = document.getElementById(`post-edit-${postId}`);
    const content = textarea?.value?.trim();
    if (!content) return showToast('Nội dung không được để trống.');
    try {
        await apiClient.put(`/community/posts/${postId}`, { content });
        updatePostState(postId, (post) => ({ ...post, content }));
        state.editingPostId = null;
        patchPostCard(postId);
        showToast('Đã lưu chỉnh sửa.');
    } catch (error) {
        showToast(error.message || 'Không thể lưu chỉnh sửa.');
    }
}

async function handleDeletePost(postId) {
    if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;
    try {
        await apiClient.delete(`/community/posts/${postId}`);
        state.posts = state.posts.filter((p) => p.id !== postId);
        state.openMenuPostId = null;
        renderPosts();
        showToast('Đã xóa bài viết.');
    } catch (error) {
        showToast(error.message || 'Không thể xóa bài viết.');
    }
}

function handleTogglePostMenu(postId) {
    document.querySelectorAll('.post-menu-dropdown.open').forEach((el) => {
        if (el.closest('[data-post-id]')?.dataset.postId !== postId) el.classList.remove('open');
    });
    const dropdown = document.querySelector(`[data-post-id="${postId}"] .post-menu-dropdown`);
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('open');
    dropdown.classList.toggle('open', !isOpen);
    state.openMenuPostId = isOpen ? null : postId;
}

function handleEditComment(postId, commentId) {
    state.editingCommentId = commentId;
    patchCommentSection(postId);
    document.getElementById(`comment-edit-${commentId}`)?.focus();
}

function handleCancelCommentEdit() {
    const postId = state.posts.find((p) =>
        (p.comments || []).some((c) => c.id === state.editingCommentId)
    )?.id;
    state.editingCommentId = null;
    if (postId) patchCommentSection(postId);
}

async function handleSaveCommentEdit(postId, commentId) {
    const textarea = document.getElementById(`comment-edit-${commentId}`);
    const content = textarea?.value?.trim();
    if (!content) return showToast('Nội dung không được để trống.');
    try {
        await apiClient.put(`/community/posts/${postId}/comments/${commentId}`, { content });
        updatePostState(postId, (post) => ({
            ...post,
            comments: (post.comments || []).map((c) => c.id === commentId ? { ...c, text: content } : c)
        }));
        state.editingCommentId = null;
        patchCommentSection(postId);
        showToast('Đã lưu chỉnh sửa.');
    } catch (error) {
        showToast(error.message || 'Không thể lưu chỉnh sửa.');
    }
}

async function handleDeleteComment(postId, commentId) {
    if (!confirm('Xóa bình luận này?')) return;
    try {
        await apiClient.delete(`/community/posts/${postId}/comments/${commentId}`);
        updatePostState(postId, (post) => ({
            ...post,
            comments: (post.comments || []).filter((c) => c.id !== commentId && c.parentId !== commentId)
        }));
        patchCommentSection(postId);
        showToast('Đã xóa bình luận.');
    } catch (error) {
        showToast(error.message || 'Không thể xóa bình luận.');
    }
}

function handleToggleReply(postId, commentId) {
    state.replyingTo = state.replyingTo === commentId ? null : commentId;
    patchCommentSection(postId);
    if (state.replyingTo) {
        document.getElementById(`reply-input-${commentId}`)?.focus();
    }
}

async function handleSubmitReply(postId, parentCommentId) {
    const input = document.getElementById(`reply-input-${parentCommentId}`);
    const content = input?.value?.trim();
    if (!content) return showToast('Hãy viết nội dung trả lời.');

    const optimisticReply = {
        id: `temp-${Date.now()}`,
        userId: state.currentUser?.id,
        parentId: parentCommentId,
        avatar: '🐱',
        name: getCurrentUserName(),
        isExpert: Boolean(state.currentUser?.is_expert),
        isAdmin: state.currentUser?.role === 'admin',
        text: content
    };
    updatePostState(postId, (post) => ({ ...post, comments: [...(post.comments || []), optimisticReply] }));
    state.replyingTo = null;
    if (input) input.value = '';
    patchCommentSection(postId);

    try {
        const created = await apiClient.post(`/community/posts/${postId}/comments`, {
            content,
            is_anonymous: false,
            parent_id: parentCommentId
        });
        updatePostState(postId, (post) => {
            const comments = [...(post.comments || [])];
            const idx = comments.findIndex((c) => c.id === optimisticReply.id);
            if (idx !== -1) {
                comments[idx] = {
                    id: created.id,
                    userId: created.user_id,
                    parentId: created.parent_id || parentCommentId,
                    avatar: created.author_avatar || optimisticReply.avatar,
                    name: created.author_name || optimisticReply.name,
                    isExpert: Boolean(state.currentUser?.is_expert),
        isAdmin: state.currentUser?.role === 'admin',
                    text: created.content || content
                };
            }
            return { ...post, comments };
        });
        patchCommentSection(postId);
    } catch (error) {
        updatePostState(postId, (post) => ({
            ...post,
            comments: (post.comments || []).filter((c) => c.id !== optimisticReply.id)
        }));
        patchCommentSection(postId);
        if (input) input.value = content;
        showToast(error.message || 'Không thể gửi trả lời.');
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

    window.togglePostMenu = (postId) => { handleTogglePostMenu(postId); };
    window.editPost = (postId) => { handleEditPost(postId); };
    window.savePostEdit = (postId) => { handleSavePostEdit(postId); };
    window.cancelPostEdit = () => { handleCancelPostEdit(); };
    window.deletePost = (postId) => { handleDeletePost(postId); };
    window.editComment = (postId, commentId) => { handleEditComment(postId, commentId); };
    window.saveCommentEdit = (postId, commentId) => { handleSaveCommentEdit(postId, commentId); };
    window.cancelCommentEdit = () => { handleCancelCommentEdit(); };
    window.deleteComment = (postId, commentId) => { handleDeleteComment(postId, commentId); };
    window.toggleReply = (postId, commentId) => { handleToggleReply(postId, commentId); };
    window.submitReply = (postId, parentId) => { handleSubmitReply(postId, parentId); };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.post-menu-wrapper') && state.openMenuPostId) {
            document.querySelectorAll('.post-menu-dropdown.open').forEach((el) => el.classList.remove('open'));
            state.openMenuPostId = null;
        }
    });

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
