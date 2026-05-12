import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { RecommendationEngineService } from '../risk/recommendation-engine.service.js';
import { BadgeAwardService } from '../progress/badge-award.service.js';

const router = Router();

const LEVELS = [
  { level: 1, minXP: 0, maxXP: 100 },
  { level: 2, minXP: 100, maxXP: 300 },
  { level: 3, minXP: 300, maxXP: 600 },
  { level: 4, minXP: 600, maxXP: 1000 },
  { level: 5, minXP: 1000, maxXP: Infinity }
];

// GET /api/v1/tasks
router.get('/tasks', requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const result = await db.query(
    `select
       t.*,
       exists(
         select 1
         from task_completions tc
         where tc.user_id = $1
           and tc.task_id = t.id
       ) as completed,
       exists(
         select 1
         from user_task_assignments uta
         where uta.user_id = $1
           and uta.task_id = t.id
           and uta.status = 'in_progress'
       ) as in_progress,
       (
         select count(*)::int
         from task_completions tc
         where tc.user_id = $1
           and tc.task_id = t.id
       ) as completion_count
     from tasks t
     where t.active = true
     order by
       case when t.category = 'emergency' then 0 else 1 end,
       t.difficulty,
       t.duration_minutes`,
    [userId]
  );
  return res.json({
    success: true,
    data: result.rows
  });
});

// GET /api/v1/tasks/recommended
router.get('/tasks/recommended', requireAuth, async (req, res) => {
  try {
    const recommendations = await RecommendationEngineService.recommendTasks(req.user.sub);
    return res.json({
      success: true,
      data: recommendations.today_priority_tasks
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch recommendations' });
  }
});

// POST /api/v1/tasks/:id/start
router.post('/tasks/:id/start', requireAuth, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.sub;

  const existing = await db.query(
    `select * from user_task_assignments
     where user_id = $1 and task_id = $2 and status = 'in_progress'
     limit 1`,
    [userId, taskId]
  );

  if (existing.rows[0]) {
    return res.json({
      success: true,
      data: existing.rows[0]
    });
  }

  const result = await db.query(
    `insert into user_task_assignments (user_id, task_id, status, assigned_at)
     values ($1, $2, 'in_progress', now())
     returning *`,
    [userId, taskId]
  );

  return res.json({
    success: true,
    data: result.rows[0] || { message: 'Task already in progress' }
  });
});

// POST /api/v1/tasks/:id/complete
router.post('/tasks/:id/complete', requireAuth, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.sub;
  const { self_rating_before, self_rating_after, notes } = req.body;
  const client = await db.connect();

  try {
    await client.query('begin');

    const taskResult = await client.query(
      `select id, xp_reward
       from tasks
       where id = $1 and active = true
       limit 1`,
      [taskId]
    );

    const task = taskResult.rows[0];
    if (!task) {
      await client.query('rollback');
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const xpEarned = task.xp_reward || 0;

    const completionResult = await client.query(
      `insert into task_completions (
         user_id,
         task_id,
         self_rating_before,
         self_rating_after,
         completion_notes,
         xp_earned
       )
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [userId, taskId, self_rating_before, self_rating_after, notes, xpEarned]
    );

    await client.query(
      `update user_task_assignments
       set status = 'completed', completed_at = now()
       where user_id = $1 and task_id = $2 and status = 'in_progress'`,
      [userId, taskId]
    );

    const progressResult = await client.query(
      `select total_xp, current_level, current_streak, longest_streak, last_activity_date
       from user_progress
       where user_id = $1
       limit 1`,
      [userId]
    );

    const today = new Date();
    const todayIso = formatDateOnly(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = formatDateOnly(yesterday);

    const currentProgress = progressResult.rows[0] || {
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null
    };

    let nextStreak = currentProgress.current_streak || 0;
    const lastActivityDate = currentProgress.last_activity_date
      ? formatDateOnly(currentProgress.last_activity_date)
      : null;

    if (lastActivityDate === todayIso) {
      nextStreak = currentProgress.current_streak || 0;
    } else if (lastActivityDate === yesterdayIso) {
      nextStreak = (currentProgress.current_streak || 0) + 1;
    } else {
      nextStreak = 1;
    }

    const totalXp = (currentProgress.total_xp || 0) + xpEarned;
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
      [userId, totalXp, currentLevel, nextStreak, longestStreak, todayIso]
    );

    const badgeSync = await BadgeAwardService.syncUserBadges(client, userId);

    await client.query('commit');

    return res.json({
      success: true,
      data: {
        ...completionResult.rows[0],
        xp_earned: xpEarned,
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
