<template>
  <div class="community-page">
    <div class="toast" :class="{ show: toastVisible }">⭐ <span>{{ toastText }}</span></div>

    <!-- Report Modal -->
    <div class="modal-overlay" :class="{ show: reportOpen }" @click="closeReportIfOutside">
      <div v-if="reportOpen" class="report-modal">
        <div class="rm-title">🚩 Báo cáo bài viết</div>
        <div class="report-option"><label><input type="radio" name="report" value="spam" v-model="reportReason"> Spam hoặc quảng cáo</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="harmful" v-model="reportReason"> Nội dung có hại / tiêu cực</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="crisis" v-model="reportReason"> ⚠️ Người dùng có thể đang trong khủng hoảng</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="inappropriate" v-model="reportReason"> Nội dung không phù hợp</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="other" v-model="reportReason"> Lý do khác</label></div>
        <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">
          <button class="btn-outline" @click="reportOpen = false">Hủy</button>
          <button class="btn-primary" @click="submitReport">Gửi báo cáo</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="breadcrumb">
        <router-link to="/dashboard">🏡 Tổng quan</router-link><span>›</span>
        <span>👥 Cộng đồng</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:1.5rem;font-weight:800;">👥 Cộng Đồng PeaceFlow</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);">Không gian chia sẻ ẩn danh — không phán xét — chỉ có yêu thương 💚</div>
        </div>
        <button class="btn-primary" @click="scrollToComposer">✏️ Chia sẻ ngay</button>
      </div>

      <div class="comm-stats">
        <div class="paper-card cs-item"><div class="cs-num">{{ formatCompactNumber(summary?.members) }}</div><div class="cs-label">Thành viên</div></div>
        <div class="paper-card cs-item"><div class="cs-num">{{ formatCompactNumber(summary?.posts) }}</div><div class="cs-label">Bài chia sẻ</div></div>
        <div class="paper-card cs-item"><div class="cs-num">{{ formatCompactNumber(summary?.reactions) }}</div><div class="cs-label">Lượt reaction ❤️</div></div>
        <div class="paper-card cs-item"><div class="cs-num">{{ formatPercent(summary?.positive_rate ?? 100) }}</div><div class="cs-label">Tích cực</div></div>
      </div>

      <div v-if="challenge" class="paper-card challenge-banner">
        <div class="cb-deco">🧘</div>
        <div class="cb-top">
          <div><div class="cb-badge">🔥 Thử thách tuần này</div></div>
          <button class="cb-join-btn" :disabled="joinedChallenge" :style="{ opacity: joinedChallenge ? 0.8 : 1 }" @click="joinChallenge">{{ joinedChallenge ? 'Đã tham gia' : 'Tham gia ngay' }}</button>
        </div>
        <div class="cb-title">{{ challenge.title }}</div>
        <div class="cb-desc">{{ challenge.description }}</div>
        <div class="cb-progress-wrap">
          <div class="cb-progress-label">
            <span>⏱ {{ formatCompactNumber(challenge.total_minutes) }} / {{ formatCompactNumber(challenge.goal) }} phút</span>
            <span>{{ challenge.progress_percent }}% hoàn thành</span>
          </div>
          <div class="cb-progress-bar"><div class="cb-progress-fill" :style="{ width: Math.min(100, Number(challenge.progress_percent || 0)) + '%' }"></div></div>
        </div>
        <div class="cb-stats">
          <div class="cb-stat">👥 <strong>{{ formatCompactNumber(challenge.participants) }}</strong> người tham gia</div>
          <div class="cb-stat">⏰ Còn <strong>{{ formatCompactNumber(challenge.days_left) }}</strong> ngày</div>
          <div class="cb-stat">🏆 Phần thưởng: <strong>+100 XP</strong> + huy hiệu cộng đồng</div>
        </div>
      </div>

      <div class="community-layout">
        <!-- LEFT: Feed -->
        <div>
          <div class="mod-note">
            <span>🤖</span>
            <span>Cộng đồng này được AI và moderator giám sát 24/7. Mọi nội dung tiêu cực, có hại hoặc vi phạm quy tắc sẽ bị gỡ bỏ. Hãy chia sẻ với tình yêu thương! 💚</span>
          </div>

          <!-- Post Composer -->
          <div class="paper-card post-composer" id="postComposer">
            <div class="pc-header">
              <div class="pc-avatar">{{ anonymousPosting ? '🌿' : '🐱' }}</div>
              <div style="flex:1;">
                <div style="font-size:0.82rem;font-weight:700;margin-bottom:2px;">Chia sẻ với cộng đồng</div>
                <div style="font-size:0.68rem;color:var(--text-light);">Câu chuyện của bạn có thể truyền cảm hứng cho ai đó</div>
              </div>
              <div class="pc-anon-toggle" :class="{ active: anonymousPosting }" @click="anonymousPosting = !anonymousPosting">
                <span>{{ anonymousPosting ? '🌿' : '👤' }}</span>
                <span>{{ anonymousPosting ? 'Ẩn danh: Bật' : 'Ẩn danh' }}</span>
              </div>
            </div>
            <textarea ref="postTextareaEl" class="pc-textarea" v-model="postContent" placeholder="Hôm nay bạn muốn chia sẻ điều gì? Một câu chuyện, một cảm xúc, một bài học, hay đơn giản là 'Tôi vẫn ổn'... 🌿" maxlength="500"></textarea>
            <div style="font-size:0.65rem;color:var(--text-light);text-align:right;margin-top:2px;"><span>{{ postContent.length }}</span>/500</div>
            <div class="pc-footer">
              <div class="pc-tags">
                <span style="font-size:0.68rem;color:var(--text-light);">Chủ đề:</span>
                <div v-for="tag in POST_TAGS" :key="tag" class="pc-tag" :class="{ active: selectedTags.includes(tag) }" @click="toggleSelectedTag(tag)">{{ tag }}</div>
              </div>
              <div class="pc-actions">
                <div class="pc-anon-note">{{ anonymousPosting ? 'Đang đăng ẩn danh' : `Đăng với tên ${currentUserName}` }}</div>
                <button class="btn-primary" style="padding:8px 18px;font-size:0.82rem;" @click="handleSubmitPost">📤 Đăng bài</button>
              </div>
            </div>
          </div>

          <div class="feed-filters">
            <button v-for="f in FEED_FILTERS" :key="f.id" class="ff-btn" :class="{ active: currentFilter === f.id }" @click="currentFilter = f.id">{{ f.label }}</button>
          </div>

          <div class="post-feed">
            <div v-if="!filteredPosts.length" class="paper-card post-card" style="text-align:center;padding:32px 20px;">
              <div style="font-size:2rem;margin-bottom:10px;">💬</div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">{{ currentFilter === 'all' ? 'Cộng đồng chưa có bài viết nào' : 'Chưa có bài viết cho bộ lọc này' }}</div>
              <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;">{{ currentFilter === 'all' ? 'Hãy là người đầu tiên chia sẻ cảm xúc, câu chuyện hoặc mẹo hay với cộng đồng!' : 'Thử chọn bộ lọc khác hoặc đăng bài mới.' }}</div>
              <button style="padding:10px 22px;background:var(--mint-dark);color:white;border:none;border-radius:50px;font-weight:700;font-size:0.85rem;cursor:pointer;" @click="scrollToComposer">✍️ Viết bài ngay</button>
            </div>

            <article v-for="post in filteredPosts" :key="post.id" class="paper-card post-card">
              <div class="post-header">
                <div class="post-author">
                  <div class="pa-avatar" :class="post.anon ? 'anon' : 'user'">{{ post.avatar || '🌿' }}</div>
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <div class="pa-name">{{ post.name || 'Người dùng' }}</div>
                      <span v-if="post.isAdmin" style="font-size:0.6rem;font-weight:800;background:var(--coral);color:#fff;padding:1px 6px;border-radius:6px;border:1px solid var(--coral-dark);white-space:nowrap;">🛡️ Admin</span>
                      <span v-if="post.isExpert" style="font-size:0.6rem;font-weight:800;background:var(--mint);color:var(--text-primary);padding:1px 6px;border-radius:6px;border:1px solid var(--mint-dark);white-space:nowrap;">🩺 Chuyên gia</span>
                      <span v-if="post.level" class="pa-level">{{ post.level }}</span>
                    </div>
                    <div class="pa-meta">{{ post.time || 'Vừa xong' }}</div>
                  </div>
                </div>
                <div class="post-menu-wrapper">
                  <button class="post-menu" title="Tùy chọn" @click="togglePostMenu(post.id)">⋯</button>
                  <div class="post-menu-dropdown" :class="{ open: openMenuPostId === post.id }">
                    <template v-if="isOwnPost(post)">
                      <button @click="editPost(post)">✏️ Sửa bài</button>
                      <button @click="deletePost(post.id)">🗑️ Xóa bài</button>
                    </template>
                    <button v-else @click="openReportModal(post.id)">🚩 Báo cáo</button>
                  </div>
                </div>
              </div>
              <div class="post-tag" :class="post.tagClass || ''">{{ post.tagLabel || '📖 Câu chuyện' }}</div>

              <template v-if="editingPostId === post.id">
                <textarea class="post-edit-input" v-model="postEditText" maxlength="1000"></textarea>
                <div class="post-edit-actions">
                  <button class="comment-send" @click="savePostEdit(post.id)">Lưu</button>
                  <button class="btn-ghost" style="font-size:0.8rem;padding:4px 12px;" @click="editingPostId = null">Hủy</button>
                </div>
              </template>
              <template v-else>
                <div class="post-content" :class="{ collapsed: isLongPost(post.content) && !expandedPosts.has(post.id) }">{{ post.content || '' }}</div>
                <div v-if="isLongPost(post.content)" class="read-more" @click="togglePostExpand(post.id)">{{ expandedPosts.has(post.id) ? 'Thu gọn' : 'Xem thêm' }}</div>
              </template>

              <div class="post-reactions">
                <button
                  v-for="(meta, key) in REACTION_META"
                  :key="key"
                  class="reaction-btn"
                  :class="{ reacted: post.myReactions?.[key], [key]: post.myReactions?.[key] }"
                  @click="handleToggleReaction(post.id, key)"
                >
                  <span>{{ meta.icon }}</span>
                  <span>{{ meta.label }}</span>
                  <span class="reaction-count">{{ formatCompactNumber(post.reactions?.[key] || 0) }}</span>
                </button>
                <button class="comment-btn" @click="toggleComments(post.id)">💬 {{ formatCompactNumber(post.comments?.length || 0) }} bình luận</button>
              </div>

              <div class="comments-section" :class="{ show: openComments.has(post.id) }">
                <template v-if="!topLevelComments(post).length">
                  <div style="font-size:0.72rem;color:var(--text-light);margin-bottom:8px;">Chưa có bình luận nào. Bạn có thể mở lời trước.</div>
                </template>
                <template v-for="comment in topLevelComments(post)" :key="comment.id">
                  <CommunityComment :post="post" :comment="comment" :is-reply="false" :state="commentUiState(comment)" @edit="editComment(post.id, comment)" @save-edit="saveCommentEdit(post.id, comment.id, $event)" @cancel-edit="editingCommentId = null" @delete="deleteComment(post.id, comment.id)" @toggle-reply="toggleReply(post.id, comment.id)" @submit-reply="submitReply(post.id, comment.id, $event)" />
                  <CommunityComment v-for="reply in repliesFor(post, comment.id)" :key="reply.id" :post="post" :comment="reply" :is-reply="true" :state="commentUiState(reply)" @edit="editComment(post.id, reply)" @save-edit="saveCommentEdit(post.id, reply.id, $event)" @cancel-edit="editingCommentId = null" @delete="deleteComment(post.id, reply.id)" />
                </template>
                <div class="comment-input-row">
                  <input class="comment-input" v-model="newCommentDraft[post.id]" placeholder="Viết lời nhắn dịu dàng..." maxlength="240">
                  <button class="comment-send" @click="handleSubmitComment(post.id)">Gửi</button>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- RIGHT: Sidebar -->
        <div>
          <div class="paper-card leaderboard-card">
            <div class="lc-title">🏆 Bảng xếp hạng</div>
            <div class="lb-tabs">
              <div class="lb-tab" :class="{ active: leaderboardTab === 'xp' }" @click="leaderboardTab = 'xp'">⭐ XP</div>
              <div class="lb-tab" :class="{ active: leaderboardTab === 'streak' }" @click="leaderboardTab = 'streak'">🔥 Streak</div>
              <div class="lb-tab" :class="{ active: leaderboardTab === 'tasks' }" @click="leaderboardTab = 'tasks'">✅ Tasks</div>
            </div>
            <div class="lb-list">
              <div v-if="leaderboardHidden" style="font-size:0.75rem;color:var(--text-secondary);padding:8px 0;">Bảng xếp hạng đang được ẩn trên thiết bị này.</div>
              <template v-else>
                <div v-if="!currentLeaderboard.length" style="font-size:0.75rem;color:var(--text-secondary);padding:8px 0;">Chưa có dữ liệu xếp hạng.</div>
                <div v-for="(item, index) in currentLeaderboard" :key="index" class="lb-item" :class="{ me: isMe(item) }">
                  <div class="lb-rank" :class="index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''">{{ index + 1 }}</div>
                  <div style="flex:1;">
                    <div style="font-size:0.76rem;font-weight:700;">{{ item.name || 'Người dùng' }}</div>
                    <div style="font-size:0.66rem;color:var(--text-light);">{{ item.subtitle || '' }}</div>
                  </div>
                  <div style="font-size:0.78rem;font-weight:800;color:var(--mint-dark);">{{ formatCompactNumber(item.value) }}</div>
                </div>
              </template>
            </div>
            <div class="lb-hide-toggle" @click="toggleLeaderboardHidden">{{ leaderboardHidden ? '👁 Hiện lại bảng xếp hạng' : '👁 Ẩn khỏi bảng xếp hạng' }}</div>
          </div>

          <div class="paper-card challenges-card">
            <div class="cc-title">🎯 Thử thách đang diễn ra</div>
            <div class="challenge-item">
              <div class="ci-header"><div class="ci-name">🧘 Thiền 1,000 phút</div><div class="ci-xp">+100 XP</div></div>
              <div class="ci-progress"><div class="ci-fill" style="width:74%"></div></div>
              <div class="ci-meta">742/1,000 phút · 4 ngày còn lại</div>
            </div>
            <div class="challenge-item">
              <div class="ci-header"><div class="ci-name">📝 7 ngày viết nhật ký</div><div class="ci-xp">+80 XP</div></div>
              <div class="ci-progress"><div class="ci-fill" style="width:57%"></div></div>
              <div class="ci-meta">4/7 ngày · Cá nhân</div>
            </div>
            <div class="challenge-item">
              <div class="ci-header"><div class="ci-name">💨 Thở 5 ngày liên tục</div><div class="ci-xp">+50 XP</div></div>
              <div class="ci-progress"><div class="ci-fill" style="width:40%"></div></div>
              <div class="ci-meta">2/5 ngày · Cá nhân</div>
            </div>
          </div>

          <div class="paper-card mentor-card">
            <div class="mc-title">🌟 Mentor cộng đồng</div>
            <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">Những thành viên Level 5+ sẵn sàng đồng hành cùng bạn</div>
            <div>
              <div v-if="!mentors.length" style="font-size:0.72rem;color:var(--text-secondary);">Chưa có mentor cộng đồng khả dụng.</div>
              <div v-for="(mentor, index) in mentors" :key="index" class="mentor-item">
                <div class="mi-avatar">{{ ['🌟', '🧘', '🌿'][index % 3] }}</div>
                <div class="mi-info">
                  <div class="mi-name">{{ mentor.name || 'Mentor' }}</div>
                  <div class="mi-level">Level {{ mentor.current_level || 5 }} · {{ formatCompactNumber(mentor.total_xp || 0) }} XP · streak {{ formatCompactNumber(mentor.current_streak || 0) }}</div>
                </div>
                <button class="mi-btn" @click="showToast('Tính năng nhắn mentor sẽ được nối ở bước sau.')">Nhắn</button>
              </div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-light);margin-top:6px;text-align:center;">Đạt Level 5 để trở thành Mentor 🌟</div>
          </div>

          <div class="paper-card" style="padding:14px;margin-bottom:14px;">
            <div style="font-size:0.82rem;font-weight:700;margin-bottom:8px;">📜 Quy tắc cộng đồng</div>
            <div style="display:flex;flex-direction:column;gap:5px;">
              <div style="font-size:0.72rem;color:var(--text-secondary);display:flex;gap:5px;"><span>💚</span><span>Chia sẻ với tình yêu thương, không phán xét</span></div>
              <div style="font-size:0.72rem;color:var(--text-secondary);display:flex;gap:5px;"><span>🔒</span><span>Tôn trọng sự riêng tư của người khác</span></div>
              <div style="font-size:0.72rem;color:var(--text-secondary);display:flex;gap:5px;"><span>🚫</span><span>Không spam, quảng cáo, nội dung tiêu cực</span></div>
              <div style="font-size:0.72rem;color:var(--text-secondary);display:flex;gap:5px;"><span>🆘</span><span>Nếu ai đó cần giúp đỡ khẩn cấp, hãy báo cáo ngay</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, h } from 'vue';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const REACTION_META = {
  heart: { icon: '❤️', label: 'Thương' },
  hug: { icon: '🤗', label: 'Ôm' },
  strong: { icon: '💪', label: 'Cố lên' },
  star: { icon: '⭐', label: 'Hay quá' }
};
const POST_TAGS = ['#biếtơn', '#câuchuyện', '#milestone', '#hỏiđáp', '#mẹohay'];
const FEED_FILTERS = [
  { id: 'all', label: '🌿 Tất cả' },
  { id: 'gratitude', label: '🙏 Biết ơn' },
  { id: 'story', label: '📖 Câu chuyện' },
  { id: 'milestone', label: '🏆 Cột mốc' },
  { id: 'question', label: '❓ Hỏi đáp' },
  { id: 'tip', label: '💡 Mẹo hay' }
];

// Component con hiển thị 1 bình luận (dùng lại cho cả top-level & reply, khớp renderSingleComment gốc).
const CommunityComment = {
  props: ['post', 'comment', 'isReply', 'state'],
  emits: ['edit', 'save-edit', 'cancel-edit', 'delete', 'toggle-reply', 'submit-reply'],
  setup(props, { emit }) {
    const draft = ref(props.comment.text || '');
    const replyDraft = ref('');
    return () => h('div', null, [
      h('div', { class: ['comment-item', props.isReply ? 'comment-reply' : ''] }, [
        h('div', { class: 'ci-avatar' }, props.comment.avatar || '🌿'),
        h('div', { class: 'ci-bubble' }, [
          h('div', { class: 'ci-name', style: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;' }, [
            props.comment.name || 'Người dùng',
            props.comment.isAdmin ? h('span', { style: 'font-size:0.6rem;font-weight:800;background:var(--coral);color:#fff;padding:1px 6px;border-radius:6px;border:1px solid var(--coral-dark);white-space:nowrap;' }, '🛡️ Admin') : null,
            props.comment.isExpert ? h('span', { style: 'font-size:0.6rem;font-weight:800;background:var(--mint);color:var(--text-primary);padding:1px 6px;border-radius:6px;border:1px solid var(--mint-dark);white-space:nowrap;' }, '🩺 Chuyên gia') : null
          ]),
          props.state.editing
            ? h('div', null, [
              h('textarea', { class: 'comment-edit-input', maxlength: 240, value: draft.value, onInput: (e) => { draft.value = e.target.value; } }),
              h('div', { class: 'comment-edit-actions' }, [
                h('button', { class: 'comment-send', onClick: () => emit('save-edit', draft.value) }, 'Lưu'),
                h('button', { class: 'btn-ghost', style: 'font-size:0.75rem;padding:3px 8px;', onClick: () => emit('cancel-edit') }, 'Hủy')
              ])
            ])
            : h('div', { class: 'ci-text' }, props.comment.text || ''),
          !props.state.editing ? h('div', { class: 'ci-actions' }, [
            !props.isReply ? h('button', { class: 'ci-action-btn', onClick: () => emit('toggle-reply') }, 'Trả lời') : null,
            props.state.isOwn ? h('button', { class: 'ci-action-btn', onClick: () => emit('edit') }, 'Sửa') : null,
            props.state.isOwn ? h('button', { class: 'ci-action-btn danger', onClick: () => emit('delete') }, 'Xóa') : null
          ]) : null
        ])
      ]),
      (!props.isReply && props.state.replying)
        ? h('div', { class: 'reply-input-row' }, [
          h('input', { class: 'comment-input', placeholder: `Trả lời ${props.comment.name || ''}...`, maxlength: 240, value: replyDraft.value, onInput: (e) => { replyDraft.value = e.target.value; } }),
          h('button', { class: 'comment-send', onClick: () => emit('submit-reply', replyDraft.value) }, 'Gửi')
        ])
        : null
    ]);
  }
};

const auth = useAuthStore();

const loading = ref(true);
const posts = ref([]);
const summary = ref(null);
const challenge = ref(null);
const leaderboard = reactive({ xp: [], streak: [], tasks: [] });
const mentors = ref([]);
const progress = ref(null);

const currentFilter = ref('all');
const leaderboardTab = ref('xp');
const leaderboardHidden = ref(localStorage.getItem('peaceflow_lb_hidden') === '1');
const anonymousPosting = ref(false);
const joinedChallenge = ref(localStorage.getItem('peaceflow_joined_community_challenge') === '1');
const selectedTags = ref([]);
const openComments = reactive(new Set());
const expandedPosts = reactive(new Set());
const reportPostId = ref(null);
const reportOpen = ref(false);
const reportReason = ref('spam');
const editingPostId = ref(null);
const postEditText = ref('');
const editingCommentId = ref(null);
const replyingTo = ref(null);
const openMenuPostId = ref(null);

const postContent = ref('');
const postTextareaEl = ref(null);
const newCommentDraft = reactive({});

const toastVisible = ref(false);
const toastText = ref('');
let toastTimer = null;

function showToast(message) {
  toastText.value = message;
  toastVisible.value = true;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toastVisible.value = false; }, 2400);
}

function formatCompactNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}
function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}
function normalizeVietnamese(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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
function getSelectedCategory() {
  if (!selectedTags.value.length) return 'story';
  return mapTagToCategory(selectedTags.value[0]);
}
function isLongPost(content) {
  return String(content || '').length > 220;
}

const currentUserName = computed(() => auth.user?.display_name || auth.user?.full_name || auth.user?.email || 'Bạn');

function toggleSelectedTag(tag) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
  } else {
    selectedTags.value = [...selectedTags.value, tag];
  }
}

const filteredPosts = computed(() => posts.value.filter((p) => currentFilter.value === 'all' || p.tag === currentFilter.value));
const currentLeaderboard = computed(() => leaderboard[leaderboardTab.value] || []);

function isMe(item) {
  return String(item.name || '').toLowerCase() === currentUserName.value.toLowerCase();
}
function isOwnPost(post) {
  return Boolean(post.userId && auth.user?.id && post.userId === auth.user.id);
}

function topLevelComments(post) {
  return (post.comments || []).filter((c) => !c.parentId);
}
function repliesFor(post, parentId) {
  return (post.comments || []).filter((c) => c.parentId === parentId);
}
function commentUiState(comment) {
  const myId = auth.user?.id;
  return {
    isOwn: Boolean(comment.userId && myId && comment.userId === myId),
    editing: editingCommentId.value === comment.id,
    replying: replyingTo.value === comment.id
  };
}

function scrollToComposer() {
  document.getElementById('postComposer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  nextTick(() => postTextareaEl.value?.focus());
}

function updatePostState(postId, patcher) {
  posts.value = posts.value.map((p) => (p.id === postId ? patcher(p) : p));
}

async function handleSubmitPost() {
  const content = postContent.value.trim();
  if (!content) {
    showToast('Hãy viết điều bạn muốn chia sẻ trước khi đăng.');
    return;
  }

  try {
    const created = await apiClient.post('/community/posts', {
      content,
      tags: selectedTags.value,
      category: getSelectedCategory(),
      is_anonymous: anonymousPosting.value
    });

    posts.value.unshift(created);
    summary.value = { ...(summary.value || {}), posts: Number(summary.value?.posts || 0) + 1 };

    postContent.value = '';
    selectedTags.value = [];
    showToast('Bài viết đã được chia sẻ lên cộng đồng.');
  } catch (error) {
    showToast(error.message || 'Không thể đăng bài lúc này.');
  }
}

async function handleToggleReaction(postId, reactionType) {
  const post = posts.value.find((p) => p.id === postId);
  if (!post) return;

  const wasReacted = Boolean(post.myReactions?.[reactionType]);
  const prevReactionType = Object.entries(post.myReactions || {}).find(([key, val]) => val && key !== reactionType)?.[0];

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
  if (summary.value) {
    summary.value.reactions = Math.max(0, Number(summary.value.reactions || 0) + (wasReacted ? -1 : 1));
  }

  try {
    const result = await apiClient.post(`/community/posts/${postId}/reactions`, { reaction_type: reactionType });
    updatePostState(postId, (current) => ({
      ...current,
      reactions: { heart: 0, hug: 0, strong: 0, star: 0, ...(result.reactions || {}) },
      myReactions: { ...(current.myReactions || {}), [reactionType]: Boolean(result.reacted) }
    }));
  } catch (error) {
    updatePostState(postId, (current) => ({
      ...current,
      reactions: { ...current.reactions, [reactionType]: Math.max(0, (current.reactions?.[reactionType] || 0) + (wasReacted ? 1 : -1)) },
      myReactions: { ...(current.myReactions || {}), [reactionType]: wasReacted }
    }));
    showToast(error.message || 'Không thể cập nhật reaction.');
  }
}

function toggleComments(postId) {
  if (openComments.has(postId)) openComments.delete(postId);
  else openComments.add(postId);
}
function togglePostExpand(postId) {
  if (expandedPosts.has(postId)) expandedPosts.delete(postId);
  else expandedPosts.add(postId);
}
function togglePostMenu(postId) {
  openMenuPostId.value = openMenuPostId.value === postId ? null : postId;
}

function editPost(post) {
  openMenuPostId.value = null;
  editingPostId.value = post.id;
  postEditText.value = post.content || '';
}
async function savePostEdit(postId) {
  const content = postEditText.value.trim();
  if (!content) { showToast('Nội dung không được để trống.'); return; }
  try {
    await apiClient.put(`/community/posts/${postId}`, { content });
    updatePostState(postId, (post) => ({ ...post, content }));
    editingPostId.value = null;
    showToast('Đã lưu chỉnh sửa.');
  } catch (error) {
    showToast(error.message || 'Không thể lưu chỉnh sửa.');
  }
}
async function deletePost(postId) {
  if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;
  try {
    await apiClient.delete(`/community/posts/${postId}`);
    posts.value = posts.value.filter((p) => p.id !== postId);
    openMenuPostId.value = null;
    showToast('Đã xóa bài viết.');
  } catch (error) {
    showToast(error.message || 'Không thể xóa bài viết.');
  }
}

async function handleSubmitComment(postId) {
  const content = (newCommentDraft[postId] || '').trim();
  if (!content) { showToast('Hãy viết bình luận trước khi gửi.'); return; }

  const optimisticComment = {
    id: `temp-${Date.now()}`, userId: auth.user?.id, parentId: null, avatar: '🐱',
    name: currentUserName.value, isExpert: Boolean(auth.user?.is_expert), isAdmin: Boolean(auth.user?.role === 'admin' || auth.user?.is_admin), text: content
  };
  updatePostState(postId, (post) => ({ ...post, comments: [...(post.comments || []), optimisticComment] }));
  openComments.add(postId);
  newCommentDraft[postId] = '';

  try {
    const created = await apiClient.post(`/community/posts/${postId}/comments`, { content, is_anonymous: false });
    updatePostState(postId, (post) => {
      const comments = [...(post.comments || [])];
      const idx = comments.findIndex((c) => c.id === optimisticComment.id);
      if (idx !== -1) {
        comments[idx] = {
          id: created.id, userId: created.user_id, parentId: null,
          avatar: created.author_avatar || optimisticComment.avatar, name: created.author_name || optimisticComment.name,
          isExpert: Boolean(auth.user?.is_expert), isAdmin: Boolean(auth.user?.role === 'admin' || auth.user?.is_admin), text: created.content || content
        };
      }
      return { ...post, comments };
    });
  } catch (error) {
    updatePostState(postId, (post) => ({ ...post, comments: (post.comments || []).filter((c) => c.id !== optimisticComment.id) }));
    newCommentDraft[postId] = content;
    showToast(error.message || 'Không thể gửi bình luận.');
  }
}

function editComment(postId, comment) {
  editingCommentId.value = comment.id;
}
async function saveCommentEdit(postId, commentId, content) {
  const trimmed = content.trim();
  if (!trimmed) { showToast('Nội dung không được để trống.'); return; }
  try {
    await apiClient.put(`/community/posts/${postId}/comments/${commentId}`, { content: trimmed });
    updatePostState(postId, (post) => ({ ...post, comments: (post.comments || []).map((c) => c.id === commentId ? { ...c, text: trimmed } : c) }));
    editingCommentId.value = null;
    showToast('Đã lưu chỉnh sửa.');
  } catch (error) {
    showToast(error.message || 'Không thể lưu chỉnh sửa.');
  }
}
async function deleteComment(postId, commentId) {
  if (!confirm('Xóa bình luận này?')) return;
  try {
    await apiClient.delete(`/community/posts/${postId}/comments/${commentId}`);
    updatePostState(postId, (post) => ({ ...post, comments: (post.comments || []).filter((c) => c.id !== commentId && c.parentId !== commentId) }));
    showToast('Đã xóa bình luận.');
  } catch (error) {
    showToast(error.message || 'Không thể xóa bình luận.');
  }
}
function toggleReply(postId, commentId) {
  replyingTo.value = replyingTo.value === commentId ? null : commentId;
}
async function submitReply(postId, parentCommentId, content) {
  const trimmed = content.trim();
  if (!trimmed) { showToast('Hãy viết nội dung trả lời.'); return; }

  const optimisticReply = {
    id: `temp-${Date.now()}`, userId: auth.user?.id, parentId: parentCommentId, avatar: '🐱',
    name: currentUserName.value, isExpert: Boolean(auth.user?.is_expert), isAdmin: Boolean(auth.user?.role === 'admin' || auth.user?.is_admin), text: trimmed
  };
  updatePostState(postId, (post) => ({ ...post, comments: [...(post.comments || []), optimisticReply] }));
  replyingTo.value = null;

  try {
    const created = await apiClient.post(`/community/posts/${postId}/comments`, { content: trimmed, is_anonymous: false, parent_id: parentCommentId });
    updatePostState(postId, (post) => {
      const comments = [...(post.comments || [])];
      const idx = comments.findIndex((c) => c.id === optimisticReply.id);
      if (idx !== -1) {
        comments[idx] = {
          id: created.id, userId: created.user_id, parentId: created.parent_id || parentCommentId,
          avatar: created.author_avatar || optimisticReply.avatar, name: created.author_name || optimisticReply.name,
          isExpert: Boolean(auth.user?.is_expert), isAdmin: Boolean(auth.user?.role === 'admin' || auth.user?.is_admin), text: created.content || trimmed
        };
      }
      return { ...post, comments };
    });
  } catch (error) {
    updatePostState(postId, (post) => ({ ...post, comments: (post.comments || []).filter((c) => c.id !== optimisticReply.id) }));
    showToast(error.message || 'Không thể gửi trả lời.');
  }
}

function toggleLeaderboardHidden() {
  leaderboardHidden.value = !leaderboardHidden.value;
  localStorage.setItem('peaceflow_lb_hidden', leaderboardHidden.value ? '1' : '0');
}

function joinChallenge() {
  if (joinedChallenge.value) return;
  joinedChallenge.value = true;
  localStorage.setItem('peaceflow_joined_community_challenge', '1');
  showToast('Bạn đã tham gia thử thách cộng đồng tuần này.');
}

function openReportModal(postId) {
  reportPostId.value = postId;
  reportReason.value = 'spam';
  reportOpen.value = true;
}
function closeReportIfOutside(event) {
  if (event.target.classList.contains('modal-overlay')) reportOpen.value = false;
}
function submitReport() {
  reportOpen.value = false;
  if (reportPostId.value) {
    showToast('Bài viết đã được ghi nhận báo cáo để moderator xem xét.');
  }
  reportPostId.value = null;
}

async function fetchCommunity() {
  loading.value = true;
  try {
    const [community, meResult, progressResult] = await Promise.all([
      apiClient.get('/community'),
      apiClient.get('/me').catch(() => null),
      apiClient.get('/progress').catch(() => null)
    ]);

    summary.value = community.summary || null;
    posts.value = Array.isArray(community.posts) ? community.posts : [];
    challenge.value = community.challenge || null;
    Object.assign(leaderboard, community.leaderboard || {});
    mentors.value = Array.isArray(community.mentors) ? community.mentors : [];
    progress.value = progressResult || progress.value;
  } catch (error) {
    console.error('Failed to load community data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchCommunity();
});
</script>

<style scoped src="../assets/community.css"></style>
