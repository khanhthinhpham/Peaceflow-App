import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { BadgeAwardService } from '../progress/badge-award.service.js';

const router = Router();

const LEVELS = [
  { level: 1, minXP: 0, maxXP: 100 },
  { level: 2, minXP: 100, maxXP: 300 },
  { level: 3, minXP: 300, maxXP: 600 },
  { level: 4, minXP: 600, maxXP: 1000 },
  { level: 5, minXP: 1000, maxXP: Infinity }
];

const JOURNAL_XP_REWARD = 15;

// GET /api/v1/journal
router.get('/journal', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select
         id,
         title,
         content,
         tags,
         created_at,
         updated_at,
         mood_before,
         mood_after,
         sentiment_score,
         is_private,
         null::text as mood
       from journal_entries
       where user_id = $1
       order by created_at desc`,
      [req.user.sub]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Journal list error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch journal entries' });
  }
});

// POST /api/v1/journal
router.post('/journal', requireAuth, async (req, res) => {
  const { title, content, mood_before, mood_after, sentiment_score, tags, is_private } = req.body;
  const client = await db.connect();

  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Content is required'
    });
  }

  try {
    await client.query('begin');

    const result = await client.query(
      `insert into journal_entries
        (user_id, title, content, mood_before, mood_after, sentiment_score, tags, is_private)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        req.user.sub,
        title || null,
        content.trim(),
        mood_before || null,
        mood_after || null,
        sentiment_score || null,
        JSON.stringify(tags || []),
        is_private !== undefined ? Boolean(is_private) : true
      ]
    );

    const progressResult = await client.query(
      `select total_xp, current_level, current_streak, longest_streak,
              to_char(last_activity_date, 'YYYY-MM-DD') as last_activity_iso
       from user_progress
       where user_id = $1
       limit 1`,
      [req.user.sub]
    );

    const currentProgress = progressResult.rows[0] || {
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      longest_streak: 0,
      last_activity_iso: null
    };

    // Ngay hom nay / hom qua tinh trong Postgres theo gio VN (tranh lech timezone Node).
    const dateRes = await client.query(
      `select (now() at time zone 'Asia/Ho_Chi_Minh')::date::text as today,
              ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1)::text as yesterday`
    );
    const todayIso = dateRes.rows[0].today;
    const yesterdayIso = dateRes.rows[0].yesterday;
    const lastActivityDate = currentProgress.last_activity_iso || null;

    let nextStreak = currentProgress.current_streak || 0;
    if (lastActivityDate === todayIso) {
      nextStreak = currentProgress.current_streak || 0;
    } else if (lastActivityDate === yesterdayIso) {
      nextStreak = (currentProgress.current_streak || 0) + 1;
    } else {
      nextStreak = 1;
    }

    const totalXp = (currentProgress.total_xp || 0) + JOURNAL_XP_REWARD;
    const currentLevel = getLevelInfo(totalXp).level;
    const longestStreak = Math.max(currentProgress.longest_streak || 0, nextStreak);

    await client.query(
      `insert into user_progress (
         user_id,
         total_xp,
         current_level,
         current_streak,
         longest_streak,
         last_activity_date
       )
       values ($1, $2, $3, $4, $5, $6)
       on conflict (user_id)
       do update set
         total_xp = excluded.total_xp,
         current_level = excluded.current_level,
         current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak,
         last_activity_date = excluded.last_activity_date`,
      [req.user.sub, totalXp, currentLevel, nextStreak, longestStreak, todayIso]
    );

    const badgeSync = await BadgeAwardService.syncUserBadges(client, req.user.sub);

    await client.query('commit');

    return res.json({
      success: true,
      data: {
        ...result.rows[0],
        xp_earned: JOURNAL_XP_REWARD,
        awarded_badges: badgeSync.awardedBadges,
        progress: {
          total_xp: totalXp,
          current_level: currentLevel,
          current_streak: nextStreak,
          longest_streak: longestStreak,
          last_activity_date: todayIso,
          badges_count: badgeSync.badgesCount
        }
      }
    });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
});

function getLevelInfo(xp) {
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (xp >= LEVELS[index].minXP) return LEVELS[index];
  }
  return LEVELS[0];
}

function formatDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);

  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default router;
