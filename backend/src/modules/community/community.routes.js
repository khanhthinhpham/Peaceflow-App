import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { sendPushToUser } from '../notifications/notification.routes.js';

const router = Router();

async function insertNotification(recipientId, actorName, type, postId, message) {
  const groupKey = `${type}:${postId}:${recipientId}`;
  await db.query(
    `insert into notifications (recipient_id, actor_name, type, post_id, message, group_key)
     values ($1, $2, $3, $4, $5, $6)`,
    [recipientId, actorName, type, postId, message, groupKey]
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

    const [postsRes, membersRes, reactionsRes, leaderboardRes, mentorRes, challengeRes] = await Promise.all([
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
         group by p.id, u.display_name, u.full_name, u.role
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
      db.query(
        `select
           count(*)::int as participants,
           coalesce(sum(tc.duration_actual), 0)::int as total_minutes
         from task_completions tc
         join tasks t on t.id = tc.task_id
         where tc.created_at >= date_trunc('week', now())
           and t.category in ('breathing', 'meditation')`
      ).catch((e) => { console.error('[COMMUNITY_QUERY] challenge:', e.message); return { rows: [] }; })
    ]);

    const posts = postsRes.rows.map((row) => mapPost(row));
    const challenge = buildChallenge(challengeRes.rows[0]);
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

    const row = await db.query(
      `insert into community_posts (
         user_id, author_name, author_avatar, content, category, tags, is_anonymous, is_positive
       )
       values ($1, $2, $3, $4, $5, $6, $7, true)
       returning *`,
      [
        req.user.sub,
        userRes.rows[0]?.name || 'Người dùng',
        is_anonymous ? '🌿' : '🐱',
        String(content).trim(),
        normalizeCategory(category),
        JSON.stringify(tags || []),
        Boolean(is_anonymous)
      ]
    );

    return res.json({
      success: true,
      data: mapPost({
        ...row.rows[0],
        display_name: userRes.rows[0]?.name,
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
      const [postRes, prevCommenters] = await Promise.all([
        db.query(`select user_id from community_posts where id = $1 limit 1`, [postId]),
        db.query(`select distinct user_id from community_comments where post_id = $1 and user_id != $2 limit 20`, [postId, commenterId])
      ]);
      const postOwnerId = postRes.rows[0]?.user_id;
      const recipients = new Set();
      if (postOwnerId && postOwnerId !== commenterId) recipients.add(postOwnerId);
      prevCommenters.rows.forEach(r => { if (r.user_id !== commenterId) recipients.add(r.user_id); });
      for (const recipientId of recipients) {
        const msg = recipientId === postOwnerId
          ? `${commenterName} đã bình luận bài viết của bạn.`
          : `${commenterName} cũng đã bình luận trong bài viết bạn tham gia.`;
        sendPushToUser(recipientId, '💬 Bình luận mới', msg, 'pages/community.html').catch(() => {});
        insertNotification(recipientId, commenterName, 'comment', postId, msg).catch(() => {});
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
        const msg = `${actorName} đã thả ${emojiMap[reactionType] || '👍'} vào bài viết của bạn.`;
        sendPushToUser(postOwnerId, `${emojiMap[reactionType] || '👍'} Cảm xúc mới`, msg, 'pages/community.html').catch(() => {});
        insertNotification(postOwnerId, actorName, 'reaction', postId, msg).catch(() => {});
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

function buildChallenge(row) {
  const totalMinutes = row?.total_minutes || 0;
  const participants = row?.participants || 0;
  const goal = 1000;
  const progressPercent = Math.min(100, Math.round((totalMinutes / goal) * 1000) / 10);
  const day = new Date().getDay();
  const daysLeft = day === 0 ? 0 : 7 - day;

  return {
    title: '🧘 Cùng nhau thiền 1,000 phút trong tuần này!',
    description: 'Mỗi phút thiền của bạn đóng góp vào mục tiêu chung của cộng đồng.',
    total_minutes: totalMinutes,
    goal,
    participants,
    days_left: daysLeft,
    progress_percent: progressPercent
  };
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

export default router;
