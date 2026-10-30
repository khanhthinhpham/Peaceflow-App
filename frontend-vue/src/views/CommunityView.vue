<template>
  <div class="community-page">
    <div class="toast" :class="{ show: toastVisible }"><span>{{ toastText }}</span></div>

    <!-- Report Modal -->
    <div class="modal-overlay" :class="{ show: reportOpen }" @click="closeReportIfOutside">
      <div v-if="reportOpen" class="report-modal">
        <div class="rm-title">{{ t('community.reportModal.title') }}</div>
        <div class="report-option"><label><input type="radio" name="report" value="spam" v-model="reportReason"> {{ t('community.reportModal.reasonSpam') }}</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="harmful" v-model="reportReason"> {{ t('community.reportModal.reasonHarmful') }}</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="crisis" v-model="reportReason"> {{ t('community.reportModal.reasonCrisis') }}</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="inappropriate" v-model="reportReason"> {{ t('community.reportModal.reasonInappropriate') }}</label></div>
        <div class="report-option"><label><input type="radio" name="report" value="other" v-model="reportReason"> {{ t('community.reportModal.reasonOther') }}</label></div>
        <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">
          <button class="btn-outline" @click="reportOpen = false">{{ t('community.reportModal.cancelBtn') }}</button>
          <button class="btn-primary" @click="submitReport">{{ t('community.reportModal.submitBtn') }}</button>
        </div>
      </div>
    </div>

    <main class="main-content" style="margin-left: 0;" >
      <div class="comm-header">
        <div>
          <div class="comm-stats-line">
            <span><strong>{{ formatCompactNumber(summary?.members) }}</strong> {{ t('community.stats.members') }}</span>
            <span><strong>{{ formatCompactNumber(summary?.posts) }}</strong> {{ t('community.stats.posts') }}</span>
            <span><strong>{{ formatCompactNumber(summary?.reactions) }}</strong> {{ t('community.stats.reactions') }}</span>
            <span><strong>{{ formatPercent(summary?.positive_rate ?? 100) }}</strong> {{ t('community.stats.positive') }}</span>
          </div>
        </div>
      </div>

      <!-- Thử thách tuần: trái = nhãn + tên + mô tả, phải = nút hành động; dưới = tiến độ kèm số liệu. -->
      <div v-if="challenge" class="paper-card challenge-banner">
        <div class="cb-head">
          <div class="cb-head-text">
            <div class="cb-badge">{{ t('community.challengeBanner.badge') }}</div>
            <div class="cb-title">{{ challenge.title }}</div>
            <div class="cb-desc">{{ challenge.description }}</div>
          </div>
          <div class="cb-actions">
            <router-link v-for="cta in challengeCtaLinks" :key="cta.to" :to="cta.to" class="cb-cta-btn">{{ cta.label }}</router-link>
            <button class="cb-join-btn" :disabled="joinedChallenge" @click="joinChallenge">{{ joinedChallenge ? t('community.challengeBanner.joined') : t('community.challengeBanner.joinNow') }}</button>
          </div>
        </div>
        <div class="cb-progress-wrap">
          <div class="cb-progress-label">
            <span><strong>{{ formatCompactNumber(challenge.current_value) }}</strong> / {{ formatCompactNumber(challenge.goal) }} {{ challenge.unit_label }}</span>
            <span class="cb-progress-pct">{{ t('community.challengeBanner.progressPercent', { pct: challenge.progress_percent }) }}</span>
          </div>
          <div class="cb-progress-bar"><div class="cb-progress-fill" :style="{ width: Math.min(100, Number(challenge.progress_percent || 0)) + '%' }"></div></div>
        </div>
        <div class="cb-stats">
          <div class="cb-stat"><strong>{{ formatCompactNumber(challenge.participants) }}</strong> {{ t('community.challengeBanner.participants') }}</div>
          <div class="cb-stat">{{ t('community.challengeBanner.daysActiveLabel') }} <strong>{{ formatCompactNumber(challenge.days_active) }}</strong> {{ t('community.challengeBanner.daysActiveUnit') }}</div>
          <div class="cb-stat cb-stat-reward">{{ t('community.challengeBanner.rewardLabel') }} <strong>+{{ challenge.reward_xp ?? 0 }} XP</strong></div>
          <div v-if="challengeRewarded" class="cb-stat cb-stat-rewarded">{{ t('community.challengeBanner.rewardedLabel') }}</div>
        </div>
        <div v-if="joinedChallenge && !challengeRewarded" class="cb-reward-note">{{ challenge.reward_note }}</div>
      </div>

      <div class="community-layout">
        <!-- LEFT: Feed -->
        <div>
          <div class="mod-note">{{ t('community.modNote') }}</div>

          <!-- Post Composer -->
          <div class="paper-card post-composer" id="postComposer">
            <div class="pc-header">
              <div class="pc-avatar">{{ anonymousPosting ? '🌿' : '🐱' }}</div>
              <div style="flex:1;font-size:0.82rem;font-weight:700;">{{ t('community.composer.title') }}</div>
              <div class="pc-anon-toggle" :class="{ active: anonymousPosting }" @click="anonymousPosting = !anonymousPosting">
                <span>{{ anonymousPosting ? t('community.composer.anonOn') : t('community.composer.anonOff') }}</span>
              </div>
            </div>
            <textarea ref="postTextareaEl" class="pc-textarea" v-model="postContent" :placeholder="t('community.composer.placeholder')" maxlength="2000"></textarea>
            <div style="font-size:0.65rem;color:var(--text-light);text-align:right;margin-top:2px;"><span>{{ postContent.length }}</span>/2000</div>
            <div class="pc-footer">
              <div class="pc-tags">
                <span style="font-size:0.68rem;color:var(--text-light);">{{ t('community.composer.tagsLabel') }}</span>
                <div v-for="tag in POST_TAG_OPTIONS" :key="tag.id" class="pc-tag" :class="{ active: selectedTags.includes(tag.id) }" @click="toggleSelectedTag(tag.id)">{{ t(tag.labelKey) }}</div>
              </div>
              <div class="pc-actions">
                <div class="pc-anon-note">{{ anonymousPosting ? t('community.composer.postingAnon') : t('community.composer.postingAs', { name: currentUserName }) }}</div>
                <button class="btn-primary" style="padding:8px 18px;font-size:0.82rem;" @click="handleSubmitPost">{{ t('community.composer.submitBtn') }}</button>
              </div>
            </div>
          </div>

          <div class="feed-filters">
            <button v-for="f in FEED_FILTERS" :key="f.id" class="ff-btn" :class="{ active: currentFilter === f.id }" @click="currentFilter = f.id">{{ t(f.labelKey) }}</button>
          </div>

          <div class="post-feed">
            <div v-if="!filteredPosts.length" class="feed-empty">
              <div class="feed-empty-title">{{ currentFilter === 'all' ? t('community.feed.emptyAllTitle') : t('community.feed.emptyFilterTitle') }}</div>
              <div class="feed-empty-desc">{{ currentFilter === 'all' ? t('community.feed.emptyAllDesc') : t('community.feed.emptyFilterDesc') }}</div>
              <button class="btn-outline" @click="scrollToComposer">{{ t('community.feed.writeNowBtn') }}</button>
            </div>

            <article v-for="post in filteredPosts" :key="post.id" class="post-card">
              <div class="post-header">
                <div class="post-author">
                  <div class="pa-avatar" :class="post.anon ? 'anon' : 'user'">{{ post.avatar || '🌿' }}</div>
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <div class="pa-name">{{ post.name || t('community.post.defaultAuthor') }}</div>
                      <span v-if="post.isAdmin" style="font-size:0.6rem;font-weight:800;background:var(--coral);color:#fff;padding:1px 6px;border-radius:6px;border:1px solid var(--coral-dark);white-space:nowrap;">{{ t('community.post.adminBadge') }}</span>
                      <span v-if="post.isExpert" style="font-size:0.6rem;font-weight:800;background:var(--mint);color:var(--text-primary);padding:1px 6px;border-radius:6px;border:1px solid var(--mint-dark);white-space:nowrap;">{{ t('community.post.expertBadge') }}</span>
                      <span v-if="post.level" class="pa-level">{{ post.level }}</span>
                    </div>
                    <div class="pa-meta">{{ post.time || t('community.post.justNow') }}</div>
                  </div>
                </div>
                <div class="post-menu-wrapper">
                  <button class="post-menu" :title="t('community.post.optionsTitle')" @click="togglePostMenu(post.id)">⋯</button>
                  <div class="post-menu-dropdown" :class="{ open: openMenuPostId === post.id }">
                    <template v-if="isOwnPost(post)">
                      <button @click="editPost(post)">{{ t('community.post.editBtn') }}</button>
                      <button @click="deletePost(post.id)">{{ t('community.post.deleteBtn') }}</button>
                    </template>
                    <button v-else @click="openReportModal(post.id)">{{ t('community.post.reportBtn') }}</button>
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <div class="post-tag" :class="post.tagClass || ''">{{ FEED_FILTERS.some((f) => f.id === post.tag && f.id !== 'all') ? t(`community.filters.${post.tag}`) : t('community.post.defaultTag') }}</div>
                <span v-if="isOwnPost(post) && post.moderationStatus === 'pending'" style="font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(255,193,7,.16);color:#8a6d00;border:1px solid rgba(255,193,7,.5);">{{ t('community.post.pendingBadge') }}</span>
                <span v-else-if="isOwnPost(post) && post.moderationStatus === 'rejected'" style="font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(255,139,139,.14);color:var(--coral-dark,#e05555);border:1px solid var(--coral,#ff8b8b);">{{ t('community.post.rejectedBadge') }}</span>
              </div>

              <template v-if="editingPostId === post.id">
                <textarea class="post-edit-input" v-model="postEditText" maxlength="1000"></textarea>
                <div class="post-edit-actions">
                  <button class="comment-send" @click="savePostEdit(post.id)">{{ t('community.post.saveBtn') }}</button>
                  <button class="btn-ghost" style="font-size:0.8rem;padding:4px 12px;" @click="editingPostId = null">{{ t('community.post.cancelBtn') }}</button>
                </div>
              </template>
              <template v-else>
                <div class="post-content" :class="{ collapsed: isLongPost(post.content) && !expandedPosts.has(post.id) }">{{ post.content || '' }}</div>
                <div v-if="isLongPost(post.content)" class="read-more" @click="togglePostExpand(post.id)">{{ expandedPosts.has(post.id) ? t('community.post.collapseBtn') : t('community.post.expandBtn') }}</div>
              </template>

              <div class="post-reactions">
                <div
                  class="like-wrap"
                  @pointerenter="$event.pointerType === 'mouse' && onLikeHoverStart(post.id)"
                  @pointerleave="$event.pointerType === 'mouse' && onLikeHoverEnd()"
                  @touchstart.passive="onLikeTouchStart(post.id)"
                  @touchend="onLikeTouchEnd"
                  @touchcancel="onLikeTouchEnd"
                  @focusin="onLikeFocusIn($event, post.id)"
                  @focusout="onLikeFocusOut"
                >
                  <button
                    type="button"
                    class="react-btn"
                    :class="myReactionOf(post) ? ['reacted', myReactionOf(post)] : ''"
                    :aria-pressed="Boolean(myReactionOf(post))"
                    :aria-label="t(REACTION_META[myReactionOf(post) || 'heart'].labelKey)"
                    :title="t(REACTION_META[myReactionOf(post) || 'heart'].labelKey)"
                    @click="onLikeClick(post)"
                    @contextmenu.prevent
                  >
                    <span v-if="myReactionOf(post)" class="react-emoji" aria-hidden="true">{{ REACTION_META[myReactionOf(post)].icon }}</span>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    <span v-if="totalReactions(post)">{{ formatCompactNumber(totalReactions(post)) }}</span>
                  </button>
                  <div v-if="pickerPostId === post.id" class="react-picker" role="toolbar">
                    <button
                      v-for="(meta, key) in REACTION_META"
                      :key="key"
                      type="button"
                      class="react-option"
                      :class="{ active: myReactionOf(post) === key }"
                      :title="t(meta.labelKey)"
                      :aria-label="t(meta.labelKey)"
                      @click="pickReaction(post, key)"
                    >{{ meta.icon }}</button>
                  </div>
                </div>

                <button
                  type="button"
                  class="react-btn"
                  :aria-label="t('community.post.commentsBtn', { n: formatCompactNumber(post.comments?.length || 0) })"
                  :title="t('community.post.commentsBtn', { n: formatCompactNumber(post.comments?.length || 0) })"
                  @click="toggleComments(post.id)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                  <span v-if="post.comments?.length">{{ formatCompactNumber(post.comments.length) }}</span>
                </button>

                <div v-if="reactionSummary(post).length" class="reaction-summary">
                  <span
                    v-for="key in reactionSummary(post)"
                    :key="key"
                    class="summary-item"
                    :title="t(REACTION_META[key].labelKey)"
                    @mouseenter="onReactorHoverStart(post.id, key)"
                    @mouseleave="onReactorHoverEnd"
                    @click="showReactorPopover(post.id, key)"
                  >
                    {{ REACTION_META[key].icon }}
                    <div v-if="isReactorPopoverOpen(post.id, key)" class="reactor-popover">
                      <div v-if="reactorPopover.loading" class="reactor-popover-loading">{{ t('community.post.reactorsLoading') }}</div>
                      <div v-else-if="reactorPopover.error" class="reactor-popover-error">{{ t('community.post.reactorsError') }}</div>
                      <div v-else-if="!reactorPopover.names?.length" class="reactor-popover-empty">{{ t('community.post.reactorsEmpty') }}</div>
                      <div v-else class="reactor-popover-list">{{ reactorPopover.names.join(', ') }}</div>
                    </div>
                  </span>
                </div>
              </div>

              <div class="comments-section" :class="{ show: openComments.has(post.id) }">
                <template v-if="!topLevelComments(post).length">
                  <div style="font-size:0.72rem;color:var(--text-light);margin-bottom:8px;">{{ t('community.post.noComments') }}</div>
                </template>
                <template v-for="comment in topLevelComments(post)" :key="comment.id">
                  <CommunityComment :post="post" :comment="comment" :is-reply="false" :state="commentUiState(comment)" @edit="editComment(post.id, comment)" @save-edit="saveCommentEdit(post.id, comment.id, $event)" @cancel-edit="editingCommentId = null" @delete="deleteComment(post.id, comment.id)" @toggle-reply="toggleReply(post.id, comment.id)" @submit-reply="submitReply(post.id, comment.id, $event)" @toggle-reaction="handleToggleCommentReaction(post.id, comment.id, $event)" />
                  <CommunityComment v-for="reply in repliesFor(post, comment.id)" :key="reply.id" :post="post" :comment="reply" :is-reply="true" :reply-to-name="replyToName(post, reply)" :state="commentUiState(reply)" @edit="editComment(post.id, reply)" @save-edit="saveCommentEdit(post.id, reply.id, $event)" @cancel-edit="editingCommentId = null" @delete="deleteComment(post.id, reply.id)" @toggle-reply="toggleReply(post.id, reply.id)" @submit-reply="submitReply(post.id, reply.id, $event)" @toggle-reaction="handleToggleCommentReaction(post.id, reply.id, $event)" />
                </template>
                <div class="comment-input-row">
                  <input class="comment-input" v-model="newCommentDraft[post.id]" :placeholder="t('community.post.commentPlaceholder')" maxlength="2000">
                  <button class="comment-send" @click="handleSubmitComment(post.id)">{{ t('community.post.sendBtn') }}</button>
                </div>
                <div style="font-size:0.65rem;color:var(--text-light);text-align:right;margin-top:2px;">{{ (newCommentDraft[post.id] || '').length }}/2000</div>
              </div>
            </article>
          </div>
        </div>

        <!-- RIGHT: Sidebar -->
        <aside class="comm-aside">
          <section class="aside-section leaderboard-card">
            <div class="lc-title">{{ t('community.leaderboard.title') }}</div>
            <div class="lb-tabs">
              <div class="lb-tab" :class="{ active: leaderboardTab === 'xp' }" @click="leaderboardTab = 'xp'">{{ t('community.leaderboard.xpTab') }}</div>
              <div class="lb-tab" :class="{ active: leaderboardTab === 'streak' }" @click="leaderboardTab = 'streak'">{{ t('community.leaderboard.streakTab') }}</div>
              <div class="lb-tab" :class="{ active: leaderboardTab === 'tasks' }" @click="leaderboardTab = 'tasks'">{{ t('community.leaderboard.tasksTab') }}</div>
            </div>
            <div class="lb-list">
              <div v-if="leaderboardHidden" style="font-size:0.75rem;color:var(--text-secondary);padding:8px 0;">{{ t('community.leaderboard.hidden') }}</div>
              <template v-else>
                <div v-if="!currentLeaderboard.length" style="font-size:0.75rem;color:var(--text-secondary);padding:8px 0;">{{ t('community.leaderboard.noData') }}</div>
                <div v-for="(item, index) in currentLeaderboard" :key="index" class="lb-item" :class="{ me: isMe(item) }">
                  <div class="lb-rank" :class="index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''">{{ index + 1 }}</div>
                  <div style="flex:1;">
                    <div style="font-size:0.76rem;font-weight:700;">{{ item.name || t('community.leaderboard.defaultName') }}</div>
                    <div style="font-size:0.66rem;color:var(--text-light);">{{ item.subtitle || '' }}</div>
                  </div>
                  <div style="font-size:0.78rem;font-weight:800;color:var(--mint-dark);">{{ formatCompactNumber(item.value) }}</div>
                </div>
              </template>
            </div>
            <div class="lb-hide-toggle" @click="toggleLeaderboardHidden">{{ leaderboardHidden ? t('community.leaderboard.showBtn') : t('community.leaderboard.hideBtn') }}</div>
          </section>

          <section class="aside-section challenges-card">
            <div class="cc-title">{{ t('community.challengesCard.title') }}</div>
            <div
              v-for="(pc, idx) in personalChallenges"
              :key="pc.code"
              class="challenge-item"
              :class="{ 'ci-clickable': pc.status === 'active', 'ci-upcoming': pc.status !== 'active' }"
              @click="pc.status === 'active' && goToChallengeCta(pc.metric_type)"
            >
              <div class="ci-header">
                <div class="ci-name">{{ pc.title }}</div>
                <div class="ci-xp">+{{ pc.xp }} XP</div>
              </div>
              <div class="ci-progress"><div class="ci-fill" :style="{ width: pc.progress_percent + '%' }"></div></div>
              <div class="ci-meta">
                <template v-if="pc.status === 'active'">
                  {{ formatCompactNumber(pc.current) }}/{{ formatCompactNumber(pc.target) }} {{ pc.unit_label }} · {{ t('community.challengesCard.goLabel') }} ›
                </template>
                <template v-else>
                  {{ t('community.challengesCard.upcomingLabel', { position: idx }) }} · {{ t('community.challengesCard.goalLabel', { target: formatCompactNumber(pc.target), unit: pc.unit_label }) }}
                </template>
              </div>
            </div>
            <div v-if="!personalChallenges.length" style="font-size:0.78rem;color:var(--text-light);padding:6px 2px;">{{ t('community.challengesCard.empty') }}</div>
          </section>

          <section class="aside-section mentor-card">
            <div class="mc-title">{{ t('community.mentor.title') }}</div>
            <div>
              <div v-if="!mentors.length" style="font-size:0.72rem;color:var(--text-secondary);">{{ t('community.mentor.noMentors') }}</div>
              <div v-for="(mentor, index) in mentors" :key="index" class="mentor-item">
                <div class="mi-avatar">{{ (mentor.name || t('community.mentor.defaultName')).trim().charAt(0).toUpperCase() }}</div>
                <div class="mi-info">
                  <div class="mi-name">{{ mentor.name || t('community.mentor.defaultName') }}</div>
                  <div class="mi-level">{{ t('community.mentor.statsLabel', { level: mentor.current_level || 5, xp: formatCompactNumber(mentor.total_xp || 0), streak: formatCompactNumber(mentor.current_streak || 0) }) }}</div>
                </div>
                <button class="mi-btn" @click="showToast(t('community.toast.mentorMessageComingSoon'))">{{ t('community.mentor.messageBtn') }}</button>
              </div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-light);margin-top:6px;text-align:center;">{{ t('community.mentor.footerHint') }}</div>
          </section>

          <section class="aside-section">
            <div class="lc-title">{{ t('community.rules.title') }}</div>
            <ol class="rules-list">
              <li>{{ t('community.rules.rule1') }}</li>
              <li>{{ t('community.rules.rule2') }}</li>
              <li>{{ t('community.rules.rule3') }}</li>
              <li>{{ t('community.rules.rule4') }}</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/auth';

const { t, locale } = useI18n();

const REACTION_META = {
  heart: { icon: '❤️', labelKey: 'community.reactions.heart' },
  hug: { icon: '🤗', labelKey: 'community.reactions.hug' },
  strong: { icon: '💪', labelKey: 'community.reactions.strong' },
  star: { icon: '⭐', labelKey: 'community.reactions.star' }
};
// id giữ nguyên hashtag tiếng Việt gốc — đây là giá trị thật sự được lưu vào selectedTags rồi
// gửi lên backend (tags[]) và dùng để suy ra category qua mapTagToCategory()/normalizeVietnamese()
// bên dưới; chỉ labelKey đổi theo ngôn ngữ hiển thị.
const POST_TAG_OPTIONS = [
  { id: '#biếtơn', labelKey: 'community.tags.gratitude' },
  { id: '#câuchuyện', labelKey: 'community.tags.story' },
  { id: '#milestone', labelKey: 'community.tags.milestone' },
  { id: '#hỏiđáp', labelKey: 'community.tags.qa' },
  { id: '#mẹohay', labelKey: 'community.tags.tip' }
];
const FEED_FILTERS = [
  { id: 'all', labelKey: 'community.filters.all' },
  { id: 'gratitude', labelKey: 'community.filters.gratitude' },
  { id: 'story', labelKey: 'community.filters.story' },
  { id: 'milestone', labelKey: 'community.filters.milestone' },
  { id: 'question', labelKey: 'community.filters.question' },
  { id: 'tip', labelKey: 'community.filters.tip' }
];

// Component con hiển thị 1 bình luận (dùng lại cho cả top-level & reply, khớp renderSingleComment gốc).
// Đây là component object thuần (không phải <script setup>) nên tự gọi useI18n() riêng trong setup().
const COMMENT_REACTION_META = {
  heart: '❤️', hug: '🤗', strong: '💪', star: '⭐'
};

const CommunityComment = {
  props: ['post', 'comment', 'isReply', 'replyToName', 'state'],
  emits: ['edit', 'save-edit', 'cancel-edit', 'delete', 'toggle-reply', 'submit-reply', 'toggle-reaction'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const draft = ref(props.comment.text || '');
    const replyDraft = ref('');
    // Đọc reactions/myReactions NGAY TRONG hàm render (không destructure ngoài setup) để phản
    // ứng đúng khi handleToggleCommentReaction cập nhật lại mảng post.comments — nếu lấy ra
    // ngoài này, giá trị sẽ bị đóng băng ở lần render đầu tiên dù props.comment đã đổi.
    return () => {
    const reactions = props.comment.reactions || {};
    const myReactions = props.comment.myReactions || {};
    return h('div', null, [
      h('div', { class: ['comment-item', props.isReply ? 'comment-reply' : ''] }, [
        h('div', { class: 'ci-avatar' }, props.comment.avatar || '🌿'),
        h('div', { class: 'ci-bubble' }, [
          h('div', { class: 'ci-name', style: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;' }, [
            props.comment.name || t('community.comment.defaultAuthor'),
            props.comment.isAdmin ? h('span', { style: 'font-size:0.6rem;font-weight:800;background:var(--coral);color:#fff;padding:1px 6px;border-radius:6px;border:1px solid var(--coral-dark);white-space:nowrap;' }, t('community.comment.adminBadge')) : null,
            props.comment.isExpert ? h('span', { style: 'font-size:0.6rem;font-weight:800;background:var(--mint);color:var(--text-primary);padding:1px 6px;border-radius:6px;border:1px solid var(--mint-dark);white-space:nowrap;' }, t('community.comment.expertBadge')) : null
          ]),
          props.replyToName ? h('div', { class: 'ci-reply-to' }, `↪ ${t('community.comment.replyingToLabel', { name: props.replyToName })}`) : null,
          props.state.editing
            ? h('div', null, [
              h('textarea', { class: 'comment-edit-input', maxlength: 2000, value: draft.value, onInput: (e) => { draft.value = e.target.value; } }),
              h('div', { style: 'font-size:0.65rem;color:var(--text-light);text-align:right;margin-top:2px;' }, `${draft.value.length}/2000`),
              h('div', { class: 'comment-edit-actions' }, [
                h('button', { class: 'comment-send', onClick: () => emit('save-edit', draft.value) }, t('community.comment.saveBtn')),
                h('button', { class: 'btn-ghost', style: 'font-size:0.75rem;padding:3px 8px;', onClick: () => emit('cancel-edit') }, t('community.comment.cancelBtn'))
              ])
            ])
            : h('div', { class: 'ci-text' }, props.comment.text || ''),
          !props.state.editing ? h('div', { class: 'ci-reactions' },
            Object.entries(COMMENT_REACTION_META).map(([key, icon]) => h('button', {
              key,
              class: ['ci-reaction-btn', myReactions[key] ? `reacted ${key}` : ''],
              onClick: () => emit('toggle-reaction', key)
            }, [icon, (reactions[key] || 0) > 0 ? h('span', { class: 'ci-reaction-count' }, String(reactions[key])) : null]))
          ) : null,
          !props.state.editing ? h('div', { class: 'ci-actions' }, [
            h('button', { class: 'ci-action-btn', onClick: () => emit('toggle-reply') }, t('community.comment.replyBtn')),
            props.state.isOwn ? h('button', { class: 'ci-action-btn', onClick: () => emit('edit') }, t('community.comment.editBtn')) : null,
            props.state.isOwn ? h('button', { class: 'ci-action-btn danger', onClick: () => emit('delete') }, t('community.comment.deleteBtn')) : null
          ]) : null
        ])
      ]),
      props.state.replying
        ? h('div', { class: props.isReply ? 'comment-reply' : '' }, [
          h('div', { class: 'reply-input-row' }, [
            h('input', { class: 'comment-input', placeholder: t('community.comment.replyPlaceholder', { name: props.comment.name || '' }), maxlength: 2000, value: replyDraft.value, onInput: (e) => { replyDraft.value = e.target.value; } }),
            h('button', { class: 'comment-send', onClick: () => emit('submit-reply', replyDraft.value) }, t('community.comment.sendBtn'))
          ]),
          h('div', { style: 'font-size:0.65rem;color:var(--text-light);text-align:right;margin-top:2px;' }, `${replyDraft.value.length}/2000`)
        ])
        : null
    ]);
    };
  }
};

const auth = useAuthStore();

const loading = ref(true);
const posts = ref([]);
const summary = ref(null);
const challenge = ref(null);
const personalChallenges = ref([]);
const leaderboard = reactive({ xp: [], streak: [], tasks: [] });
const mentors = ref([]);
const progress = ref(null);

const currentFilter = ref('all');
const leaderboardTab = ref('xp');
const leaderboardHidden = ref(localStorage.getItem('peaceflow_lb_hidden') === '1');
const anonymousPosting = ref(false);
// Trang thai "tham gia" nay giu theo TAI KHOAN o server (community_challenge_participants),
// khong con dung localStorage nua — vi gio thuong that (+100 XP) tinh theo tai khoan da tham
// gia + tu dong gop du phut trong tuan, phai dong bo dung theo user chu khong theo thiet bi.
const joinedChallenge = computed(() => Boolean(challenge.value?.joined));
// Nut CTA duoi banner thu thach doi theo metric_type — thu thach do phut thien/tho thi dan
// toi trang thien/tho, do nhat ky thi dan toi trang nhat ky, do nhiem vu thi dan toi trang
// nhiem vu. Admin them loai chi so moi trong tuong lai se can bo sung them 1 nhanh o day.
const CHALLENGE_CTA_BY_METRIC = {
  meditation_minutes: [
    { to: '/task-meditation', labelKey: 'ctaMeditation' },
    { to: '/task-breathing', labelKey: 'ctaBreathing' }
  ],
  journal_entries: [{ to: '/journal', labelKey: 'ctaJournal' }],
  task_completions: [{ to: '/tasks', labelKey: 'ctaTasks' }]
};
const challengeCtaLinks = computed(() => {
  const defs = CHALLENGE_CTA_BY_METRIC[challenge.value?.metric_type] || [];
  return defs.map((d) => ({ to: d.to, label: t(`community.challengeBanner.${d.labelKey}`) }));
});
const challengeRewarded = computed(() => Boolean(challenge.value?.rewarded));
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
  return Number(value || 0).toLocaleString(locale.value === 'en' ? 'en-US' : 'vi-VN');
}
function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}
function goToChallengeCta(metricType) {
  const cta = (CHALLENGE_CTA_BY_METRIC[metricType] || [])[0];
  if (cta) router.push(cta.to);
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

const currentUserName = computed(() => auth.user?.display_name || auth.user?.full_name || auth.user?.email || t('community.defaultUserName'));

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
function findComment(post, id) {
  return (post.comments || []).find((c) => c.id === id);
}
// Reply có thể là reply-của-reply (DB cho phép parent_id lồng bao nhiêu cấp cũng được) — đi
// ngược chuỗi parentId để tìm bình luận gốc (top-level) mà 1 reply thuộc về, rồi gom phẳng
// TẤT CẢ hậu duệ của 1 bình luận gốc vào chung 1 danh sách hiển thị (kiểu Messenger/Facebook:
// không thụt lề vô hạn, chỉ 2 tầng — gốc & reply — kèm nhãn "Trả lời {tên}" khi cần biết rõ
// đang nói với ai).
function rootIdOf(post, comment) {
  let current = comment;
  const seen = new Set();
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = findComment(post, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.id;
}
function repliesFor(post, topLevelId) {
  return (post.comments || []).filter((c) => c.parentId && rootIdOf(post, c) === topLevelId);
}
function replyToName(post, comment) {
  if (!comment.parentId) return null;
  const parent = findComment(post, comment.parentId);
  // Không hiện nhãn khi parent chính là bình luận gốc (đã rõ ràng vì nằm ngay dưới nó) — chỉ
  // hiện khi đây là reply-của-reply, cần ghi rõ đang trả lời ai giữa danh sách phẳng.
  return parent?.parentId ? parent.name : null;
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
    showToast(t('community.toast.emptyPost'));
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
    showToast(t('community.toast.postSuccess'));
  } catch (error) {
    showToast(error.message || t('community.toast.postFailed'));
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
    showToast(error.message || t('community.toast.reactionFailed'));
  }
}

// Hiện danh sách người đã thả 1 loại cảm xúc — hover trên desktop, giữ đè 1 lát trên mobile.
// Cache theo "postId:type" để không gọi lại API khi hover qua hover lại cùng 1 nút.
const reactorPopover = reactive({ postId: null, type: null, names: null, loading: false, error: false });
const reactorCache = new Map();

function isReactorPopoverOpen(postId, type) {
  return reactorPopover.postId === postId && reactorPopover.type === type;
}

async function loadReactors(postId, type) {
  const cacheKey = `${postId}:${type}`;
  if (reactorCache.has(cacheKey)) {
    reactorPopover.names = reactorCache.get(cacheKey);
    reactorPopover.loading = false;
    reactorPopover.error = false;
    return;
  }
  reactorPopover.loading = true;
  reactorPopover.error = false;
  reactorPopover.names = null;
  try {
    const names = await apiClient.get(`/community/posts/${postId}/reactions?type=${encodeURIComponent(type)}`, { noCache: true });
    reactorCache.set(cacheKey, names);
    if (isReactorPopoverOpen(postId, type)) {
      reactorPopover.names = names;
      reactorPopover.loading = false;
    }
  } catch (_error) {
    if (isReactorPopoverOpen(postId, type)) {
      reactorPopover.error = true;
      reactorPopover.loading = false;
    }
  }
}

function showReactorPopover(postId, type) {
  reactorPopover.postId = postId;
  reactorPopover.type = type;
  loadReactors(postId, type);
}
function hideReactorPopover() {
  reactorPopover.postId = null;
  reactorPopover.type = null;
}

function onReactorHoverStart(postId, type) {
  showReactorPopover(postId, type);
}
function onReactorHoverEnd() {
  hideReactorPopover();
}
// Nút cảm xúc kiểu Facebook: bấm = thả/gỡ (mặc định "heart"), rê chuột hoặc giữ lâu = mở thanh chọn.
const pickerPostId = ref(null);
let pickerOpenTimer = null;
let pickerCloseTimer = null;
let likeLongPressTimer = null;
let likeSuppressClick = false;

function myReactionOf(post) {
  return Object.keys(REACTION_META).find((key) => post.myReactions?.[key]) || null;
}
function totalReactions(post) {
  return Object.keys(REACTION_META).reduce((sum, key) => sum + Number(post.reactions?.[key] || 0), 0);
}
function reactionSummary(post) {
  return Object.keys(REACTION_META)
    .filter((key) => Number(post.reactions?.[key] || 0) > 0)
    .sort((a, b) => Number(post.reactions[b]) - Number(post.reactions[a]))
    .slice(0, 3);
}
function clearPickerTimers() {
  clearTimeout(pickerOpenTimer);
  clearTimeout(pickerCloseTimer);
}
function closePicker() {
  clearPickerTimers();
  pickerPostId.value = null;
}
function onLikeHoverStart(postId) {
  clearPickerTimers();
  if (pickerPostId.value === postId) return;
  pickerOpenTimer = setTimeout(() => { pickerPostId.value = postId; }, 450);
}
function onLikeHoverEnd() {
  clearPickerTimers();
  pickerCloseTimer = setTimeout(() => { pickerPostId.value = null; }, 300);
}
function onLikeTouchStart(postId) {
  clearTimeout(likeLongPressTimer);
  likeLongPressTimer = setTimeout(() => {
    likeLongPressTimer = null;
    likeSuppressClick = true;
    pickerPostId.value = postId;
  }, 450);
}
function onLikeTouchEnd() {
  clearTimeout(likeLongPressTimer);
  likeLongPressTimer = null;
}
function onLikeFocusIn(event, postId) {
  if (event.target.matches(':focus-visible')) pickerPostId.value = postId;
}
function onLikeFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) closePicker();
}
function onLikeClick(post) {
  // Giữ lâu để mở thanh chọn thì nhả tay ra vẫn bắn click — bỏ qua đúng lần đó.
  if (likeSuppressClick) {
    likeSuppressClick = false;
    return;
  }
  closePicker();
  handleToggleReaction(post.id, myReactionOf(post) || 'heart');
}
function pickReaction(post, key) {
  closePicker();
  if (myReactionOf(post) !== key) handleToggleReaction(post.id, key);
}
function onDocumentPointerDown(event) {
  if (!event.target.closest?.('.like-wrap')) closePicker();
  if (!event.target.closest?.('.reaction-summary')) hideReactorPopover();
}
function onDocumentKeydown(event) {
  if (event.key === 'Escape') {
    closePicker();
    hideReactorPopover();
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
  if (!content) { showToast(t('community.toast.emptyEdit')); return; }
  try {
    await apiClient.put(`/community/posts/${postId}`, { content });
    updatePostState(postId, (post) => ({ ...post, content }));
    editingPostId.value = null;
    showToast(t('community.toast.editSaved'));
  } catch (error) {
    showToast(error.message || t('community.toast.editFailed'));
  }
}
async function deletePost(postId) {
  if (!confirm(t('community.confirm.deletePost'))) return;
  try {
    await apiClient.delete(`/community/posts/${postId}`);
    posts.value = posts.value.filter((p) => p.id !== postId);
    openMenuPostId.value = null;
    showToast(t('community.toast.postDeleted'));
  } catch (error) {
    showToast(error.message || t('community.toast.postDeleteFailed'));
  }
}

async function handleSubmitComment(postId) {
  const content = (newCommentDraft[postId] || '').trim();
  if (!content) { showToast(t('community.toast.emptyComment')); return; }

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
    showToast(error.message || t('community.toast.commentFailed'));
  }
}

function editComment(postId, comment) {
  editingCommentId.value = comment.id;
}
async function saveCommentEdit(postId, commentId, content) {
  const trimmed = content.trim();
  if (!trimmed) { showToast(t('community.toast.emptyEdit')); return; }
  try {
    await apiClient.put(`/community/posts/${postId}/comments/${commentId}`, { content: trimmed });
    updatePostState(postId, (post) => ({ ...post, comments: (post.comments || []).map((c) => c.id === commentId ? { ...c, text: trimmed } : c) }));
    editingCommentId.value = null;
    showToast(t('community.toast.editSaved'));
  } catch (error) {
    showToast(error.message || t('community.toast.editFailed'));
  }
}
async function deleteComment(postId, commentId) {
  if (!confirm(t('community.confirm.deleteComment'))) return;
  try {
    await apiClient.delete(`/community/posts/${postId}/comments/${commentId}`);
    updatePostState(postId, (post) => ({ ...post, comments: (post.comments || []).filter((c) => c.id !== commentId && c.parentId !== commentId) }));
    showToast(t('community.toast.commentDeleted'));
  } catch (error) {
    showToast(error.message || t('community.toast.commentDeleteFailed'));
  }
}
async function handleToggleCommentReaction(postId, commentId, reactionType) {
  const post = posts.value.find((p) => p.id === postId);
  const comment = post && findComment(post, commentId);
  if (!comment) return;

  const wasReacted = Boolean(comment.myReactions?.[reactionType]);

  function patchComment(postCurrent, patcher) {
    return { ...postCurrent, comments: (postCurrent.comments || []).map((c) => c.id === commentId ? patcher(c) : c) };
  }

  updatePostState(postId, (current) => patchComment(current, (c) => ({
    ...c,
    reactions: { ...c.reactions, [reactionType]: Math.max(0, (c.reactions?.[reactionType] || 0) + (wasReacted ? -1 : 1)) },
    myReactions: { ...c.myReactions, [reactionType]: !wasReacted }
  })));

  try {
    const result = await apiClient.post(`/community/comments/${commentId}/reactions`, { reaction_type: reactionType });
    updatePostState(postId, (current) => patchComment(current, (c) => ({
      ...c,
      reactions: { heart: 0, hug: 0, strong: 0, star: 0, ...(result.reactions || {}) },
      myReactions: { ...c.myReactions, [reactionType]: Boolean(result.reacted) }
    })));
  } catch (error) {
    updatePostState(postId, (current) => patchComment(current, (c) => ({
      ...c,
      reactions: { ...c.reactions, [reactionType]: Math.max(0, (c.reactions?.[reactionType] || 0) + (wasReacted ? 1 : -1)) },
      myReactions: { ...c.myReactions, [reactionType]: wasReacted }
    })));
    showToast(error.message || t('community.toast.reactionFailed'));
  }
}

function toggleReply(postId, commentId) {
  replyingTo.value = replyingTo.value === commentId ? null : commentId;
}
async function submitReply(postId, parentCommentId, content) {
  const trimmed = content.trim();
  if (!trimmed) { showToast(t('community.toast.emptyReply')); return; }

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
    showToast(error.message || t('community.toast.replyFailed'));
  }
}

function toggleLeaderboardHidden() {
  leaderboardHidden.value = !leaderboardHidden.value;
  localStorage.setItem('peaceflow_lb_hidden', leaderboardHidden.value ? '1' : '0');
}

async function joinChallenge() {
  if (joinedChallenge.value) return;
  try {
    await apiClient.post('/community/challenge/join', {});
    if (challenge.value) challenge.value = { ...challenge.value, joined: true };
    showToast(t('community.toast.challengeJoined'));
  } catch (error) {
    showToast(error.message || t('community.toast.challengeJoinFailed'));
  }
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
    showToast(t('community.toast.reportSubmitted'));
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
    personalChallenges.value = Array.isArray(community.personal_challenges) ? community.personal_challenges : [];
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
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('keydown', onDocumentKeydown);
  clearPickerTimers();
  clearTimeout(likeLongPressTimer);
});
</script>

<!-- KHÔNG scoped: CommunityComment là component JS thuần dùng h() (không qua compiler của
     file .vue này) nên các thẻ nó render không được gắn thuộc tính data-v-xxxx — nếu để scoped,
     mọi CSS của bình luận/reply (.ci-bubble, .comment-reply, nút Trả lời, ô nhập reply...) sẽ
     không khớp được selector và coi như không có style. Đã kiểm tra không có tên class nào ở
     đây trùng với file khác nên bỏ scoped an toàn. -->
<style src="../assets/community.css"></style>
<style scoped>
/* Đồng bộ với trang tổng quan (DashboardView.vue): nền ivory + ảnh lá, mỗi bài viết/khối bên
   phải là thẻ trắng bo mềm không viền/bóng giấy, chữ Inter + tiêu đề --font-heading, nút/nhãn
   phẳng, đường kẻ mảnh liền nét. community.css là CSS global (không scoped) — khối scoped này
   có thêm attribute nên thắng mà không cần sửa file gốc. */
.community-page {
  font-family: var(--font-body); font-size: 15px; line-height: 1.55; color: var(--color-text);
  background: var(--color-canvas); -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; min-height: 100vh;
}
.community-page::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/dashboard-leaf-light.jpg') center / cover no-repeat;
  opacity: 0.9; mix-blend-mode: multiply;
  -webkit-mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.55) 70%, #000 100%);
  mask-image: linear-gradient(to bottom right, transparent 0%, rgba(0, 0, 0, 0.395) 70%, #000000 100%);
  pointer-events: none;
}
.main-content { padding: 20px 20px 32px; }
.community-page :is(input, textarea, button) { font-family: inherit; }
.community-page :is(a, button):focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.breadcrumb, .breadcrumb a { color: var(--color-text-subtle); font-size: 13px; }
.breadcrumb a:hover { color: var(--color-brand); }
.comm-title { font-family: var(--font-heading); font-size: 26px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; color: var(--color-text); }
.comm-subtitle { font-size: 14px; color: var(--color-text-muted); }
.comm-stats-line { color: var(--color-text-muted); font-size: 13.5px; }
.comm-stats-line strong { color: var(--color-text); }
.mod-note { font-size: 13px; color: var(--color-text-subtle); }

/* Nút phẳng như .pf-btn-* của Dashboard. */
.btn-primary, .btn-outline, .btn-ghost, .cb-join-btn, .comment-send {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: none; border-radius: var(--radius-control); box-shadow: none; transform: none;
  font-family: inherit; font-weight: 600; cursor: pointer; text-decoration: none;
  transition: background-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.btn-primary, .cb-join-btn, .comment-send { background: var(--color-brand); color: var(--color-on-brand); }
.btn-primary:hover, .cb-join-btn:hover, .comment-send:hover { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); box-shadow: none; transform: none; }
.btn-outline, .btn-ghost { background: var(--color-surface-muted); color: var(--color-text); }
.btn-outline:hover, .btn-ghost:hover { background: var(--color-brand-soft); color: var(--color-brand); border: none; }
.cb-join-btn:disabled { background: var(--color-brand-soft); color: var(--color-brand); filter: none; }

/* Thẻ: nền trắng, bo --radius-card, không viền/bóng giấy. */
.paper-card, .post-card, .comm-aside, .report-modal {
  background: var(--color-surface); border: none; border-radius: var(--radius-card); box-shadow: none;
}

/* Thử thách cộng đồng. */
.challenge-banner { background: linear-gradient(135deg, var(--color-brand-soft), var(--color-surface)); }
.cb-badge { border: none; background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.cb-title { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.cb-desc, .cb-stat, .cb-progress-label { color: var(--color-text-muted); }
.cb-stat strong { color: var(--color-text); }
.cb-progress-bar { border: none; background: var(--color-surface); }
.cb-progress-fill { background: var(--color-brand); }
.cb-cta-btn { border: none; border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-brand); font-weight: 600; }
.cb-cta-btn:hover { background: var(--color-brand); color: var(--color-on-brand); }

/* Khung viết bài. */
.pc-avatar { border: none; background: var(--color-brand-soft); }
.pc-anon-toggle { border: none; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-text-muted); }
.pc-anon-toggle:hover { background: var(--color-brand-soft); color: var(--color-brand); border: none; }
.pc-anon-toggle.active { background: var(--color-brand-soft); color: var(--color-brand); }
.pc-textarea {
  border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas);
  font-family: inherit; font-size: 15px; color: var(--color-text);
}
.pc-textarea:focus { border-color: var(--color-brand); background: var(--color-surface); }
.pc-tag { border: none; border-radius: 999px; background: var(--color-canvas); color: var(--color-text-muted); }
.pc-tag:hover { background: var(--color-surface-muted); border: none; }
.pc-tag.active, .pc-tag.selected { background: var(--color-brand-soft); color: var(--color-brand); border: none; }
.pc-anon-note { color: var(--color-text-subtle); }

/* Bộ lọc bảng tin. */
.ff-btn { border: none; border-radius: 999px; background: var(--color-surface); color: var(--color-text-muted); font-family: inherit; font-weight: 600; }
.ff-btn:hover { background: var(--color-surface-muted); color: var(--color-text); border: none; }
.ff-btn.active { background: var(--color-brand-soft); color: var(--color-brand); border: none; }

/* Bài viết: mỗi bài là một thẻ trắng riêng. */
.post-feed { gap: 12px; }
.post-card { padding: 18px 20px 14px; border-top: none; }
.pa-avatar { border: none; }
.pa-avatar.user { background: var(--color-brand-soft); }
.pa-avatar.anon { background: var(--color-surface-muted); }
.pa-name { font-weight: 600; color: var(--color-text); }
.pa-meta { color: var(--color-text-subtle); }
.pa-level { border: none; background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.post-menu { color: var(--color-text-muted); }
.post-menu:hover { background: var(--color-canvas); }
.post-menu-dropdown { border: none; border-radius: var(--radius-card); background: var(--color-surface); box-shadow: var(--shadow-soft); }
.post-menu-dropdown button { font-family: inherit; }
.post-menu-dropdown button:hover { background: var(--color-canvas); }
.post-menu-dropdown button:last-child:hover { background: var(--color-danger-soft); color: var(--color-danger); }
.post-tag { border: none !important; }
.post-content { font-family: inherit; font-size: 15px; line-height: 1.65; color: var(--color-text); }
.post-edit-input { border: 1px solid var(--color-brand); border-radius: var(--radius-control); background: var(--color-canvas); font-family: inherit; }
.read-more { color: var(--color-brand); }
.react-btn { font-family: inherit; color: var(--color-text-muted); border-radius: var(--radius-control); }
.react-btn:hover { background: var(--color-canvas); }
.react-picker { border: none; box-shadow: var(--shadow-soft); background: var(--color-surface); }
.react-option.active { background: var(--color-brand-soft); }
.summary-item { border-color: var(--color-surface); background: var(--color-canvas); }

/* Bình luận. */
.comments-section { border-top: 1px solid var(--color-surface-muted); }
.ci-avatar { border: none; background: var(--color-brand-soft); }
.ci-bubble { border: none; border-radius: 4px 14px 14px 14px; background: var(--color-canvas); }
.ci-text { font-family: inherit; font-size: 14px; color: var(--color-text); }
.ci-action-btn { font-family: inherit; }
.ci-reaction-btn { border: none; border-radius: 999px; background: var(--color-canvas); }
.ci-reaction-btn:hover { background: var(--color-brand-soft); border: none; }
.ci-reaction-btn.reacted { background: var(--color-brand-soft); border: none; }
.comment-input, .comment-edit-input {
  border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas);
  font-family: inherit; font-size: 14px; color: var(--color-text);
}
.comment-input:focus, .comment-edit-input:focus { border-color: var(--color-brand); background: var(--color-surface); }

/* Cột phải: một thẻ trắng, các mục cách nhau bằng đường kẻ mảnh. */
.comm-aside { padding: 20px; border-top: none; }
.aside-section { border-bottom-color: var(--color-surface-muted); }
.lc-title, .mc-title { font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
.lb-tabs { border: none; border-radius: var(--radius-control); background: var(--color-surface-muted); padding: 3px; }
.lb-tab { border-radius: calc(var(--radius-control) - 2px); font-family: inherit; color: var(--color-text-muted); }
.lb-tab.active { background: var(--color-surface); color: var(--color-brand); }
.lb-item:hover, .challenge-item.ci-clickable:hover { background: var(--color-canvas); }
.lb-item.me { background: var(--color-brand-soft); }
.lb-avatar { border: none; }
.ci-xp { border: none; background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.ci-progress { background: var(--color-surface-muted); }
.ci-fill { background: var(--color-brand); }
.mentor-item:hover { background: var(--color-canvas); }
.mi-avatar { border: none; background: var(--color-brand-soft); }
.mi-btn { border: none; border-radius: var(--radius-control); background: var(--color-brand-soft); color: var(--color-brand); font-family: inherit; font-weight: 600; }
.mi-btn:hover { background: var(--color-brand); color: var(--color-on-brand); }

/* Báo cáo, popup khẩn cấp, thông báo. */
.report-modal { border-radius: var(--radius-panel); box-shadow: var(--shadow-soft); }
.rm-title { font-family: var(--font-heading); font-weight: 800; }
.report-option { border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas); }
.report-option:hover { background: var(--color-danger-soft); border-color: transparent; }
.emergency-popup { border: none; border-radius: var(--radius-panel); box-shadow: var(--shadow-soft); }
.ep-hotline { border: none; border-radius: var(--radius-card); background: var(--color-danger-soft); }
.ep-btn { border: none; border-radius: var(--radius-control); box-shadow: none; font-family: inherit; }
.toast { border: none; border-radius: var(--radius-control); background: var(--color-surface); box-shadow: var(--shadow-soft); font-family: var(--font-body); }
/* Bình luận do component CommunityComment (render function, không mang scope id của file này)
   vẽ ra — phải dùng :deep() từ khung bình luận thì style scoped mới áp tới. */
.comments-section :deep(.ci-avatar) { border: none; background: var(--color-brand-soft); }
.comments-section :deep(.ci-bubble) { border: none; border-radius: 4px 14px 14px 14px; background: var(--color-canvas); }
.comments-section :deep(.ci-name) { font-weight: 600; color: var(--color-text); }
.comments-section :deep(.ci-text) { font-family: inherit; font-size: 14px; color: var(--color-text); }
.comments-section :deep(.ci-action-btn) { font-family: inherit; color: var(--color-text-muted); }
.comments-section :deep(.ci-action-btn:hover) { color: var(--color-brand); }
.comments-section :deep(.ci-action-btn.danger:hover) { color: var(--color-danger); }
.comments-section :deep(.ci-reaction-btn) { border: none; border-radius: 999px; background: var(--color-canvas); }
.comments-section :deep(.ci-reaction-btn:hover), .comments-section :deep(.ci-reaction-btn.reacted) { background: var(--color-brand-soft); border: none; }
.comments-section :deep(:is(.comment-input, .comment-edit-input)) { border: 1px solid transparent; border-radius: var(--radius-control); background: var(--color-canvas); font-family: inherit; font-size: 14px; color: var(--color-text); }
.comments-section :deep(:is(.comment-input, .comment-edit-input):focus) { border-color: var(--color-brand); background: var(--color-surface); }
.comments-section :deep(.comment-send) { border: none; border-radius: var(--radius-control); background: var(--color-brand); color: var(--color-on-brand); font-family: inherit; font-weight: 600; box-shadow: none; }
.comments-section :deep(.comment-send:hover) { background: var(--color-brand); color: var(--color-on-brand); filter: brightness(0.92); }
.comments-section :deep(.btn-ghost) { border: none; border-radius: var(--radius-control); background: var(--color-surface-muted); color: var(--color-text); font-family: inherit; }
/* Thử thách tuần — bố cục: đầu (chữ trái, nút phải) · tiến độ · số liệu. */
.challenge-banner { padding: 22px 24px; display: flex; flex-direction: column; gap: 16px; }
.cb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.cb-head-text { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.cb-head-text .cb-badge { margin: 0 0 2px; }
.cb-head-text .cb-title { margin: 0; font-size: 19px; line-height: 1.3; }
.cb-head-text .cb-desc { margin: 0; font-size: 14px; }
.cb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cb-actions .cb-cta-btn, .cb-actions .cb-join-btn { min-height: 38px; padding: 8px 16px; font-size: 14px; white-space: nowrap; }
.cb-progress-wrap { margin: 0; }
.cb-progress-label { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-size: 13px; }
.cb-progress-label strong { color: var(--color-text); font-size: 15px; }
.cb-progress-pct { font-weight: 700; color: var(--color-brand); }
.cb-progress-bar { height: 8px; }
.cb-stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
.cb-stat { padding: 4px 12px; border-radius: 999px; background: var(--color-surface); font-size: 13px; }
.cb-stat-reward { background: var(--color-terracotta-soft); color: var(--color-terracotta); }
.cb-stat-reward strong { color: var(--color-terracotta); }
.cb-reward-note { margin: 0; font-size: 13px; color: var(--color-text-muted); }
@media (max-width: 700px) {
  .cb-head { flex-direction: column; gap: 14px; }
  .cb-actions { width: 100%; }
  .cb-actions > * { flex: 1; justify-content: center; }
}
/* Số liệu thử thách luôn một hàng: không xuống dòng, chật thì vuốt ngang (ẩn thanh cuộn). */
.cb-stats { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
.cb-stats::-webkit-scrollbar { display: none; }
.cb-stat { flex-shrink: 0; white-space: nowrap; }
@media (max-width: 600px) {
  .cb-stats { gap: 6px; }
  .cb-stat { padding: 4px 10px; font-size: 12px; }
}
/* Desktop: số liệu cộng đồng một hàng ở đầu trang (chừa chỗ chuông/chat nổi góc phải), rồi tới thử thách.
   Mobile: thử thách lên trên cùng, số liệu thành lưới 2×2 căn giữa, chữ to hơn. */
.comm-header { margin-bottom: 16px; margin-right: 120px; }
.comm-stats-line { margin-top: 0; font-size: 14px; }
@media (max-width: 900px), (hover: none) and (pointer: coarse) {
  .main-content { display: flex; flex-direction: column; }
  .main-content > .challenge-banner { order: -1; margin-bottom: 14px; }
  .comm-header { justify-content: center; margin: 0 0 18px; }
  .comm-header > div { width: 100%; }
  .comm-stats-line { display: grid; grid-template-columns: repeat(2, max-content); justify-content: center; gap: 6px 36px; font-size: 15px; }
  .comm-stats-line strong { font-size: 17px; }
}
</style>
