import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { sendPushToUser } from '../notifications/notification.routes.js';
import { buildNotificationMessage } from '../notifications/notification-messages.js';
import { sendCommunityPostToAdmin } from '../../common/services/email.service.js';
import { computeMetricValue, computeParticipants, METRIC_TYPES } from './challenge-metrics.js';

// Ngôn ngữ ưa thích đã lưu của người NHẬN thông báo — không dùng req.locale ở đây vì
// req.locale phản ánh ngôn ngữ của người ĐANG bình luận/thả cảm xúc, không phải người
// nhận thông báo (2 người khác nhau).
async function getUserLocale(userId) {
  const { rows } = await db.query(`select locale from users where id = $1 limit 1`, [userId]);
  return rows[0]?.locale === 'en' ? 'en' : 'vi';
}

const router = Router();

async function insertNotification(recipientId, actorName, type, postId, message, params = null) {
  const groupKey = `${type}:${postId}:${recipientId}`;
  await db.query(
    `insert into notifications (recipient_id, actor_name, type, post_id, message, group_key, params)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [recipientId, actorName, type, postId, message, groupKey, params ? JSON.stringify(params) : null]
  );
}
const CATEGORY_MAP = {
  gratitude: { label: '🙏 Biết ơn', className: 'pt-gratitude' },
  story: { label: '📖 Câu chuyện', className: 'pt-story' },
  milestone: { label: '🏆 Cột mốc', className: 'pt-milestone' },
  question: { label: '❓ Hỏi đáp', className: 'pt-question' },
  tip: { label: '💡 Mẹo hay', className: 'pt-tip' }
};

router.get('/community', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    // Lay truoc thu thach dang active — joined/rewarded query ben duoi can id + started_at
    // cua no, nen phai biet truoc khi chay Promise.all con lai.
    const challengeRes = await db.query(
      `select c.id, c.title, c.description, c.icon, c.metric_type, c.unit_label, c.goal_amount,
              c.reward_xp, c.personal_threshold, c.task_ids, s.started_at
       from community_weekly_challenge_state s
       join community_weekly_challenges c on c.id = s.current_challenge_id
       where s.id = true`
    ).catch((e) => { console.error('[COMMUNITY_QUERY] challenge:', e.message); return { rows: [] }; });
    const currentChallenge = challengeRes.rows[0] || null;

    const [postsRes, membersRes, reactionsRes, leaderboardRes, mentorRes, challengeJoinedRes, challengeRewardedRes] = await Promise.all([
      db.query(
        `select
           p.*,
           u.display_name,
           u.full_name,
           (select exists(select 1 from experts e where e.user_id = p.user_id)) as author_is_expert,
           (u.role = 'admin' or u.is_admin) as author_is_admin,
           coalesce(
             json_agg(
               distinct jsonb_build_object(
                 'id', c.id,
                 'user_id', c.user_id,
                 'parent_id', c.parent_id,
                 'content', c.content,
                 'author_name',
                   case
                     when c.is_anonymous then coalesce(c.author_name, 'Người ẩn danh')
                     else coalesce(c.author_name, cu.display_name, cu.full_name, 'Người dùng')
                   end,
                 'author_avatar', c.author_avatar,
                 'author_is_expert', (select exists(select 1 from experts e where e.user_id = c.user_id)),
                 'author_is_admin', (cu.role = 'admin' or cu.is_admin),
                 'is_anonymous', c.is_anonymous,
                 'created_at', c.created_at
               )
             ) filter (where c.id is not null),
             '[]'::json
           ) as comments,
           coalesce(
             json_object_agg(r.reaction_type, r.count_value) filter (where r.reaction_type is not null),
             '{}'::json
           ) as reactions,
           coalesce(
             json_object_agg(mr.reaction_type, mr.reacted) filter (where mr.reaction_type is not null),
             '{}'::json
           ) as my_reactions
         from community_posts p
         left join users u on u.id = p.user_id
         left join community_comments c on c.post_id = p.id
         left join users cu on cu.id = c.user_id
         left join lateral (
           select reaction_type, count(*)::int as count_value
           from community_reactions
           where post_id = p.id
           group by reaction_type
         ) r on true
         left join lateral (
           select reaction_type, true as reacted
           from community_reactions
           where post_id = p.id and user_id = $1
         ) mr on true
         where p.is_hidden = false
           -- Chỉ hiện bài đã được admin duyệt trên feed công khai; riêng bài của CHÍNH
           -- người đang xem thì vẫn hiện dù đang "pending" (kèm badge "Đang chờ duyệt" ở
           -- frontend) để họ biết bài mình đã gửi đi, không bị mất tích khó hiểu.
           and (p.moderation_status = 'approved' or (p.moderation_status = 'pending' and p.user_id = $1))
         group by p.id, u.display_name, u.full_name, u.role, u.is_admin
         order by p.created_at desc`,
        [userId]
      ).catch((e) => { console.error('[COMMUNITY_QUERY] community_posts:', e.message); return { rows: [] }; }),
      db.query(`select count(*)::int as members from users where status = 'active'`)
        .catch((e) => { console.error('[COMMUNITY_QUERY] users count:', e.message); return { rows: [] }; }),
      db.query(`select count(*)::int as reactions from community_reactions`)
        .catch((e) => { console.error('[COMMUNITY_QUERY] community_reactions:', e.message); return { rows: [] }; }),
      db.query(
        `select
           u.id,
           coalesce(u.display_name, u.full_name, 'Người dùng') as name,
           up.total_xp,
           up.current_streak,
           (
             select count(*)::int
             from task_completions tc
             where tc.user_id = u.id
           ) as tasks_completed
         from users u
         join user_progress up on up.user_id = u.id
         where u.status = 'active'
         order by up.total_xp desc
         limit 5`
      ).catch((e) => { console.error('[COMMUNITY_QUERY] leaderboard:', e.message); return { rows: [] }; }),
      db.query(
        `select
           coalesce(u.display_name, u.full_name, 'Người dùng') as name,
           up.current_level,
           up.total_xp,
           up.current_streak
         from users u
         join user_progress up on up.user_id = u.id
         where u.status = 'active'
           and up.current_level >= 5
         order by up.total_xp desc
         limit 3`
      ).catch((e) => { console.error('[COMMUNITY_QUERY] mentors:', e.message); return { rows: [] }; }),
      currentChallenge
        ? db.query(
            `select 1 from community_challenge_participants
             where user_id = $1 and challenge_id = $2 and cycle_started_at = $3`,
            [userId, currentChallenge.id, currentChallenge.started_at]
          ).catch((e) => { console.error('[COMMUNITY_QUERY] challenge_joined:', e.message); return { rows: [] }; })
        : Promise.resolve({ rows: [] }),
      currentChallenge
        ? db.query(
            `select 1 from community_challenge_rewards
             where user_id = $1 and challenge_id = $2 and cycle_started_at = $3`,
            [userId, currentChallenge.id, currentChallenge.started_at]
          ).catch((e) => { console.error('[COMMUNITY_QUERY] challenge_rewarded:', e.message); return { rows: [] }; })
        : Promise.resolve({ rows: [] })
    ]);

    const posts = postsRes.rows.map((row) => mapPost(row));
    const challenge = await buildChallenge(currentChallenge, {
      joined: challengeJoinedRes.rows.length > 0,
      rewarded: challengeRewardedRes.rows.length > 0
    });
    const personalChallenges = await buildPersonalChallenges(userId, currentChallenge);
    const summary = {
      members: membersRes.rows[0]?.members || 0,
      posts: posts.length,
      reactions: reactionsRes.rows[0]?.reactions || 0,
      positive_rate: posts.length
        ? Math.round((posts.filter((post) => post.is_positive).length / posts.length) * 100)
        : 100
    };

    return res.json({
      success: true,
      data: {
        summary,
        posts,
        challenge,
        personal_challenges: personalChallenges,
        leaderboard: {
          xp: leaderboardRes.rows.map((row) => ({
            name: row.name,
            value: row.total_xp || 0,
            subtitle: `${row.total_xp || 0} XP`
          })),
          streak: leaderboardRes.rows
            .slice()
            .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
            .map((row) => ({
              name: row.name,
              value: row.current_streak || 0,
              subtitle: `${row.current_streak || 0} ngày`
            })),
          tasks: leaderboardRes.rows
            .slice()
            .sort((a, b) => (b.tasks_completed || 0) - (a.tasks_completed || 0))
            .map((row) => ({
              name: row.name,
              value: row.tasks_completed || 0,
              subtitle: `${row.tasks_completed || 0} nhiệm vụ`
            }))
        },
        mentors: mentorRes.rows
      }
    });
  } catch (error) {
    console.error('Community fetch error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch community data' });
  }
});

router.post('/community/challenge/join', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const stateRes = await db.query(
      `select current_challenge_id, started_at from community_weekly_challenge_state where id = true`
    );
    const state = stateRes.rows[0];
    if (!state?.current_challenge_id) {
      return res.status(400).json({ success: false, message: 'Hiện chưa có thử thách cộng đồng nào đang diễn ra.' });
    }
    await db.query(
      `insert into community_challenge_participants (user_id, challenge_id, cycle_started_at)
       values ($1, $2, $3)
       on conflict (user_id, challenge_id, cycle_started_at) do nothing`,
      [userId, state.current_challenge_id, state.started_at]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Community challenge join error:', error);
    return res.status(500).json({ success: false, message: 'Could not join challenge' });
  }
});

router.post('/community/posts', requireAuth, async (req, res) => {
  try {
    const { content, tags, category, is_anonymous } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const userRes = await db.query(
      `select coalesce(display_name, full_name, 'Người dùng') as name
       from users
       where id = $1
       limit 1`,
      [req.user.sub]
    );

    const authorName = userRes.rows[0]?.name || 'Người dùng';
    const row = await db.query(
      `insert into community_posts (
         user_id, author_name, author_avatar, content, category, tags, is_anonymous, is_positive,
         moderation_status
       )
       values ($1, $2, $3, $4, $5, $6, $7, true, 'pending')
       returning *`,
      [
        req.user.sub,
        authorName,
        is_anonymous ? '🌿' : '🐱',
        String(content).trim(),
        normalizeCategory(category),
        JSON.stringify(tags || []),
        Boolean(is_anonymous)
      ]
    );
    const post = row.rows[0];

    // Bài mới luôn ở trạng thái "pending" (chờ admin duyệt mới hiển thị công khai) — báo cho
    // TOÀN BỘ admin qua cả 3 kênh: in-app, push, và email (không dùng magic-link 1-click như
    // duyệt hồ sơ chuyên gia vì admin thường đã đăng nhập sẵn, chỉ cần điều hướng vào trang
    // duyệt bài trong app). Chạy nền, không chặn response trả về cho người vừa đăng bài.
    ;(async () => {
      const adminsRes = await db.query(`select id from users where role = 'admin' or is_admin = true`);
      const notifyName = Boolean(is_anonymous) ? 'Người ẩn danh' : authorName;
      const msg = `${notifyName} vừa đăng 1 bài viết mới trên Cộng đồng, đang chờ duyệt.`;
      for (const admin of adminsRes.rows) {
        insertNotification(admin.id, notifyName, 'community_post_pending', post.id, msg, {
          code: 'community_post_pending_admin'
        }).catch(() => {});
        sendPushToUser(admin.id, '📝 Bài viết chờ duyệt', msg, '/admin/community').catch(() => {});
      }
      sendCommunityPostToAdmin({
        postId: post.id,
        authorName,
        content: post.content,
        category: post.category,
        isAnonymous: Boolean(is_anonymous)
      }).catch((e) => console.error('[MAIL_FAIL] community post to admin:', e.message));
    })().catch((e) => console.error('[BG] community post admin notify:', e.message));

    return res.json({
      success: true,
      data: mapPost({
        ...post,
        display_name: authorName,
        comments: [],
        reactions: {},
        my_reactions: {}
      })
    });
  } catch (error) {
    console.error('Community create post error:', error);
    return res.status(500).json({ success: false, message: 'Could not create post' });
  }
});

router.post('/community/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content, is_anonymous, parent_id } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const userRes = await db.query(
      `select coalesce(display_name, full_name, 'Người dùng') as name
       from users
       where id = $1
       limit 1`,
      [req.user.sub]
    );

    const result = await db.query(
      `insert into community_comments (
         post_id, user_id, author_name, author_avatar, content, is_anonymous, parent_id
       )
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        req.params.id,
        req.user.sub,
        userRes.rows[0]?.name || 'Người dùng',
        is_anonymous ? '🌿' : '🐱',
        String(content).trim(),
        Boolean(is_anonymous),
        parent_id || null
      ]
    );

    // Kick off notification work — floating promise, không block response
    const commenterName = Boolean(is_anonymous) ? 'Ai đó' : (userRes.rows[0]?.name || 'Ai đó');
    const postId = req.params.id;
    const commenterId = req.user.sub;
    ;(async () => {
      const [postRes, prevCommenters, parentRes] = await Promise.all([
        db.query(`select user_id from community_posts where id = $1 limit 1`, [postId]),
        db.query(`select distinct user_id from community_comments where post_id = $1 and user_id != $2 limit 20`, [postId, commenterId]),
        parent_id
          ? db.query(`select user_id from community_comments where id = $1 limit 1`, [parent_id])
          : Promise.resolve({ rows: [] })
      ]);
      const postOwnerId = postRes.rows[0]?.user_id;
      // Chủ của comment CHA (nếu đây là reply) — người này cần biết rõ "ai đó đã TRẢ LỜI
      // bình luận của họ", khác hẳn "có bình luận mới trong bài" chung chung, dù họ vẫn
      // nằm trong danh sách recipients thông thường (vì họ đã từng comment/là chủ bài).
      const parentOwnerId = parentRes.rows[0]?.user_id;
      const recipients = new Set();
      if (postOwnerId && postOwnerId !== commenterId) recipients.add(postOwnerId);
      prevCommenters.rows.forEach(r => { if (r.user_id !== commenterId) recipients.add(r.user_id); });
      for (const recipientId of recipients) {
        let code, msg;
        if (parentOwnerId && recipientId === parentOwnerId) {
          code = 'reply_comment';
          msg = `${commenterName} đã trả lời bình luận của bạn.`;
        } else {
          const isOwnPost = recipientId === postOwnerId;
          code = isOwnPost ? 'comment_own_post' : 'comment_participant_post';
          msg = isOwnPost
            ? `${commenterName} đã bình luận bài viết của bạn.`
            : `${commenterName} cũng đã bình luận trong bài viết bạn tham gia.`;
        }
        getUserLocale(recipientId).then((pushLocale) => {
          const pushBody = buildNotificationMessage(code, { actorName: commenterName }, pushLocale) || msg;
          const pushTitle = code === 'reply_comment'
            ? (pushLocale === 'en' ? '↩️ New reply' : '↩️ Có người trả lời')
            : (pushLocale === 'en' ? '💬 New comment' : '💬 Bình luận mới');
          sendPushToUser(recipientId, pushTitle, pushBody, '/community').catch(() => {});
        }).catch(() => {});
        insertNotification(recipientId, commenterName, code === 'reply_comment' ? 'reply' : 'comment', postId, msg, {
          code,
          actorName: commenterName
        }).catch(() => {});
      }
    })().catch(e => console.error('[BG] comment notify:', e.message));

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        author_name: Boolean(is_anonymous) ? 'Người ẩn danh' : (userRes.rows[0]?.name || 'Người dùng')
      }
    });
  } catch (error) {
    console.error('Community add comment error:', error);
    return res.status(500).json({ success: false, message: 'Could not add comment' });
  }
});

router.post('/community/posts/:id/reactions', requireAuth, async (req, res) => {
  try {
    const reactionType = String(req.body.reaction_type || '').toLowerCase();
    if (!['heart', 'hug', 'strong', 'star'].includes(reactionType)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction type' });
    }

    const existing = await db.query(
      `select id
       from community_reactions
       where post_id = $1
         and user_id = $2
         and reaction_type = $3
       limit 1`,
      [req.params.id, req.user.sub, reactionType]
    );

    let reacted = false;
    if (existing.rows[0]) {
      await db.query(`delete from community_reactions where id = $1`, [existing.rows[0].id]);
      reacted = false;
    } else {
      await db.query(
        `delete from community_reactions where post_id = $1 and user_id = $2`,
        [req.params.id, req.user.sub]
      );
      await db.query(
        `insert into community_reactions (post_id, user_id, reaction_type)
         values ($1, $2, $3)`,
        [req.params.id, req.user.sub, reactionType]
      );
      reacted = true;

      // Kick off notification work — floating promise, không block response
      const postId = req.params.id;
      const actorId = req.user.sub;
      ;(async () => {
        const [postRes, actorRes] = await Promise.all([
          db.query(`select user_id from community_posts where id = $1 limit 1`, [postId]),
          db.query(`select coalesce(display_name, full_name, 'Ai đó') as name from users where id = $1 limit 1`, [actorId])
        ]);
        const postOwnerId = postRes.rows[0]?.user_id;
        if (!postOwnerId || postOwnerId === actorId) return;
        const emojiMap = { heart: '❤️', hug: '🤗', strong: '💪', star: '⭐' };
        const actorName = actorRes.rows[0]?.name || 'Ai đó';
        const emoji = emojiMap[reactionType] || '👍';
        const msg = `${actorName} đã thả ${emoji} vào bài viết của bạn.`;
        getUserLocale(postOwnerId).then((pushLocale) => {
          const pushBody = buildNotificationMessage('reaction_post', { actorName, emoji }, pushLocale) || msg;
          sendPushToUser(postOwnerId, pushLocale === 'en' ? `${emoji} New reaction` : `${emoji} Cảm xúc mới`, pushBody, '/community').catch(() => {});
        }).catch(() => {});
        insertNotification(postOwnerId, actorName, 'reaction', postId, msg, { code: 'reaction_post', actorName, emoji }).catch(() => {});
      })().catch(e => console.error('[BG] reaction notify:', e.message));
    }

    const counts = await db.query(
      `select reaction_type, count(*)::int as count_value
       from community_reactions
       where post_id = $1
       group by reaction_type`,
      [req.params.id]
    );

    return res.json({
      success: true,
      data: {
        reaction_type: reactionType,
        reacted,
        reactions: counts.rows.reduce((acc, row) => {
          acc[row.reaction_type] = row.count_value;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Community reaction error:', error);
    return res.status(500).json({ success: false, message: 'Could not update reaction' });
  }
});

// POST /api/v1/community/posts/:id/report — báo cáo bài viết
router.post('/community/posts/:id/report', requireAuth, async (req, res) => {
  try {
    const { reason = 'inappropriate' } = req.body;
    const postId = req.params.id;
    const userId = req.user.sub;

    // Insert report (unique per user+post)
    await db.query(
      `insert into community_reports (post_id, user_id, reason)
       values ($1, $2, $3)
       on conflict (post_id, user_id) do nothing`,
      [postId, userId, reason]
    );

    // Tăng count và auto-hide nếu >= 5 reports
    const result = await db.query(
      `update community_posts
       set reports_count = (
         select count(*) from community_reports where post_id = $1
       ),
       is_hidden = (
         select count(*) from community_reports where post_id = $1
       ) >= 5
       where id = $1
       returning reports_count, is_hidden`,
      [postId]
    );

    if (result.rows[0]?.is_hidden) {
      console.warn(`[MODERATION] post_id=${postId} auto-hidden after ${result.rows[0].reports_count} reports`);
    }

    return res.json({ success: true, data: { message: 'Đã ghi nhận báo cáo.' } });
  } catch (error) {
    console.error('Community report error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not submit report' });
  }
});

router.put('/community/posts/:id', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' });
    const result = await db.query(
      `update community_posts set content = $1, updated_at = now() where id = $2 and user_id = $3 returning id`,
      [String(content).trim(), req.params.id, req.user.sub]
    );
    if (!result.rows[0]) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Edit post error:', error);
    return res.status(500).json({ success: false });
  }
});

router.delete('/community/posts/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `delete from community_posts where id = $1 and user_id = $2 returning id`,
      [req.params.id, req.user.sub]
    );
    if (!result.rows[0]) return res.status(403).json({ success: false, message: 'Không có quyền xóa.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ success: false });
  }
});

router.put('/community/posts/:postId/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' });
    const result = await db.query(
      `update community_comments set content = $1 where id = $2 and post_id = $3 and user_id = $4 returning id`,
      [String(content).trim(), req.params.commentId, req.params.postId, req.user.sub]
    );
    if (!result.rows[0]) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Edit comment error:', error);
    return res.status(500).json({ success: false });
  }
});

router.delete('/community/posts/:postId/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `delete from community_comments where id = $1 and post_id = $2 and user_id = $3 returning id`,
      [req.params.commentId, req.params.postId, req.user.sub]
    );
    if (!result.rows[0]) return res.status(403).json({ success: false, message: 'Không có quyền xóa.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false });
  }
});

function normalizeCategory(category) {
  const normalized = String(category || 'story').toLowerCase();
  return Object.prototype.hasOwnProperty.call(CATEGORY_MAP, normalized) ? normalized : 'story';
}

function mapPost(row) {
  const category = normalizeCategory(row.category);
  const meta = CATEGORY_MAP[category];
  const reactions = {
    heart: 0,
    hug: 0,
    strong: 0,
    star: 0,
    ...(row.reactions || {})
  };
  const myReactions = {
    heart: false,
    hug: false,
    strong: false,
    star: false,
    ...(row.my_reactions || {})
  };

  return {
    id: row.id,
    userId: row.user_id,
    moderationStatus: row.moderation_status || 'approved',
    anon: Boolean(row.is_anonymous),
    avatar: row.author_avatar || '🌿',
    name: row.is_anonymous
      ? row.author_name || 'Người ẩn danh'
      : row.author_name || row.display_name || row.full_name || 'Người dùng',
    isExpert: !row.is_anonymous && Boolean(row.author_is_expert),
    isAdmin: !row.is_anonymous && Boolean(row.author_is_admin),
    level: null,
    time: formatRelativeTime(row.created_at),
    tag: category,
    tagLabel: meta.label,
    tagClass: meta.className,
    content: row.content,
    reactions,
    myReactions,
    comments: Array.isArray(row.comments) ? row.comments.map((comment) => ({
      id: comment.id,
      userId: comment.user_id,
      parentId: comment.parent_id || null,
      avatar: comment.author_avatar || '🌿',
      name: comment.author_name || 'Người dùng',
      isExpert: !comment.is_anonymous && Boolean(comment.author_is_expert),
      isAdmin: !comment.is_anonymous && Boolean(comment.author_is_admin),
      text: comment.content
    })) : [],
    showComments: false,
    collapsed: false,
    is_positive: Boolean(row.is_positive)
  };
}

// row: dong tu community_weekly_challenges + state (id, title, description, icon,
// metric_type, unit_label, goal_amount, reward_xp, personal_threshold, started_at). Thu
// thach gio la hang doi do admin quan ly (/admin/community-challenges) — het thu thach nay
// (dat 100%) thi TU DONG chuyen sang cai tiep theo (xem community-weekly-challenge.job.js),
// khong con gioi han theo tuan lich nua nen KHONG con "days_left" dem nguoc — thay bang
// "days_active" (da chay bao nhieu ngay) cho trung thuc.
async function buildChallenge(row, { joined = false, rewarded = false } = {}) {
  if (!row) {
    return {
      title: '🎯 Chưa có thử thách nào', description: 'Admin chưa thiết lập thử thách cộng đồng.',
      current_value: 0, goal: 0, unit_label: '', participants: 0, days_active: 0, progress_percent: 0,
      joined: false, rewarded: false, reward_note: ''
    };
  }
  const currentValue = await computeMetricValue(row.metric_type, row.started_at, null, row.task_ids);
  const participants = await computeParticipants(row.metric_type, row.started_at, row.task_ids);
  const progressPercent = Math.min(100, Math.round((currentValue / row.goal_amount) * 1000) / 10);
  const daysActive = Math.max(0, Math.floor((Date.now() - new Date(row.started_at).getTime()) / 86400000));

  return {
    title: row.title,
    description: row.description,
    icon: row.icon,
    metric_type: row.metric_type,
    current_value: currentValue,
    goal: row.goal_amount,
    unit_label: row.unit_label,
    reward_xp: row.reward_xp,
    participants,
    days_active: daysActive,
    progress_percent: progressPercent,
    joined,
    rewarded,
    reward_note: row.personal_threshold
      ? `Bạn phải bấm "Tham gia" và tự mình đóng góp tối thiểu ${row.personal_threshold} ${row.unit_label} để nhận +${row.reward_xp} XP.`
      : `Bấm "Tham gia" — khi cả cộng đồng đạt mục tiêu, bạn sẽ nhận +${row.reward_xp} XP.`
  };
}

// "Thử thách cá nhân" hiển thị ở sidebar trang Community — TRƯỚC ĐÂY là 3 thử thách cố định
// hardcode (thiền tháng/nhật ký tuần/thở streak), tách biệt hoàn toàn với banner thử thách ở
// đầu trang, khiến admin không quản lý được và người dùng không biết thứ tự thử thách nào
// chạy trước/sau. GIỜ lấy trực tiếp từ hàng đợi community_weekly_challenges (cùng nguồn với
// banner): thử thách ĐANG active hiện tiến độ thật, các thử thách TIẾP THEO trong hàng đợi
// hiện ở trạng thái "sắp diễn ra" để người dùng biết trước thứ tự.
async function buildPersonalChallenges(userId, currentChallenge) {
  const listRes = await db.query(
    `select id, title, icon, metric_type, unit_label, goal_amount, reward_xp, personal_threshold, task_ids, queue_order
     from community_weekly_challenges
     where active = true
     order by queue_order asc, created_at asc`
  );
  const all = listRes.rows;
  if (!all.length) return [];

  const currentIndex = currentChallenge ? all.findIndex((c) => c.id === currentChallenge.id) : -1;
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  // Lay toi da 3 thu thach: cai dang active + 2 cai tiep theo trong hang doi, vong lai tu
  // dau neu can (giong dung logic cua job tu dong chuyen thu thach).
  const ordered = [];
  for (let i = 0; i < Math.min(3, all.length); i += 1) {
    ordered.push(all[(startIndex + i) % all.length]);
  }

  return Promise.all(ordered.map(async (c, idx) => {
    const isActive = idx === 0 && currentChallenge && c.id === currentChallenge.id;
    const current = isActive
      ? await computeMetricValue(c.metric_type, currentChallenge.started_at, userId, c.task_ids)
      : 0;
    return {
      code: c.id,
      icon: c.icon,
      title: c.title,
      metric_type: c.metric_type,
      unit_label: c.unit_label,
      current: Math.min(current, c.goal_amount),
      target: c.goal_amount,
      xp: c.reward_xp,
      progress_percent: isActive ? Math.min(100, Math.round((current / c.goal_amount) * 100)) : 0,
      completed: isActive && current >= c.goal_amount,
      status: isActive ? 'active' : 'upcoming'
    };
  }));
}

function formatRelativeTime(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

// ============================================================
// ADMIN: quản lý hàng đợi thử thách cộng đồng
// ============================================================
router.get('/admin/community-challenges', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const [listRes, stateRes] = await Promise.all([
      db.query(`select * from community_weekly_challenges order by queue_order asc, created_at asc`),
      db.query(`select current_challenge_id, started_at from community_weekly_challenge_state where id = true`)
    ]);
    return res.json({
      success: true,
      data: {
        challenges: listRes.rows,
        current_challenge_id: stateRes.rows[0]?.current_challenge_id || null,
        started_at: stateRes.rows[0]?.started_at || null,
        metric_types: METRIC_TYPES
      }
    });
  } catch (error) {
    console.error('Admin list community challenges error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch challenges' });
  }
});

function validateChallengePayload(body) {
  if (!body.title || !String(body.title).trim()) return 'Thiếu tên thử thách.';
  if (!METRIC_TYPES[body.metric_type]) return 'Loại chỉ số (metric_type) không hợp lệ.';
  if (!Number.isFinite(Number(body.goal_amount)) || Number(body.goal_amount) <= 0) return 'Mục tiêu phải lớn hơn 0.';
  if (body.metric_type === 'specific_tasks' && (!Array.isArray(body.task_ids) || body.task_ids.length === 0)) {
    return 'Chọn "Chỉ tính nhiệm vụ được chọn riêng" thì cần chọn ít nhất 1 nhiệm vụ.';
  }
  return null;
}

router.post('/admin/community-challenges', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const validationError = validateChallengePayload(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { title, description, icon, metric_type: metricType, goal_amount: goalAmount, reward_xp: rewardXp, personal_threshold: personalThreshold, queue_order: queueOrder, active, task_ids: taskIds } = req.body;
    const result = await db.query(
      `insert into community_weekly_challenges (title, description, icon, metric_type, unit_label, goal_amount, reward_xp, personal_threshold, queue_order, active, task_ids)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning id`,
      [
        title.trim(), (description || '').trim() || null, icon || '🎯', metricType,
        METRIC_TYPES[metricType].unitVi, Number(goalAmount), Number(rewardXp) || 100,
        personalThreshold === '' || personalThreshold === null || personalThreshold === undefined ? null : Number(personalThreshold),
        Number(queueOrder) || 0, active !== false,
        metricType === 'specific_tasks' && Array.isArray(taskIds) ? taskIds : null
      ]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Admin create community challenge error:', error);
    return res.status(500).json({ success: false, message: 'Could not create challenge' });
  }
});

router.put('/admin/community-challenges/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const validationError = validateChallengePayload(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { title, description, icon, metric_type: metricType, goal_amount: goalAmount, reward_xp: rewardXp, personal_threshold: personalThreshold, queue_order: queueOrder, active, task_ids: taskIds } = req.body;
    const result = await db.query(
      `update community_weekly_challenges
       set title = $2, description = $3, icon = $4, metric_type = $5, unit_label = $6,
           goal_amount = $7, reward_xp = $8, personal_threshold = $9, queue_order = $10, active = $11,
           task_ids = $12, updated_at = now()
       where id = $1
       returning id`,
      [
        req.params.id, title.trim(), (description || '').trim() || null, icon || '🎯', metricType,
        METRIC_TYPES[metricType].unitVi, Number(goalAmount), Number(rewardXp) || 100,
        personalThreshold === '' || personalThreshold === null || personalThreshold === undefined ? null : Number(personalThreshold),
        Number(queueOrder) || 0, active !== false,
        metricType === 'specific_tasks' && Array.isArray(taskIds) ? taskIds : null
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy thử thách.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin update community challenge error:', error);
    return res.status(500).json({ success: false, message: 'Could not update challenge' });
  }
});

router.delete('/admin/community-challenges/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const stateRes = await db.query(`select current_challenge_id from community_weekly_challenge_state where id = true`);
    if (stateRes.rows[0]?.current_challenge_id === req.params.id) {
      return res.status(400).json({ success: false, message: 'Không xoá được thử thách đang active — chuyển sang thử thách khác trước.' });
    }
    const r = await db.query(`delete from community_weekly_challenges where id = $1 returning id`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy thử thách.' });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Admin delete community challenge error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete challenge' });
  }
});

// Admin tu tay chuyen sang 1 thu thach khac NGAY LAP TUC, bo qua thu tu hang doi — theo
// dung yeu cau "neu thay doi thi admin muon thay doi thu thach tuan".
router.post('/admin/community-challenges/:id/activate-now', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const check = await db.query(`select id from community_weekly_challenges where id = $1 and active = true`, [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy thử thách (hoặc đang bị ẩn).' });
    await db.query(
      `update community_weekly_challenge_state set current_challenge_id = $1, started_at = now() where id = true`,
      [req.params.id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Admin activate community challenge error:', error);
    return res.status(500).json({ success: false, message: 'Could not activate challenge' });
  }
});

export default router;
