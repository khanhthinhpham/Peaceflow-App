import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { RecommendationEngineService } from '../risk/recommendation-engine.service.js';
import { BadgeAwardService } from '../progress/badge-award.service.js';
import { getActiveTasks } from './tasks.cache.js';

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aEmergency = a.category === 'emergency' ? 0 : 1;
    const bEmergency = b.category === 'emergency' ? 0 : 1;
    if (aEmergency !== bEmergency) return aEmergency - bEmergency;
    if (a.difficulty !== b.difficulty) return (a.difficulty ?? 0) - (b.difficulty ?? 0);
    return (a.duration_minutes ?? 0) - (b.duration_minutes ?? 0);
  });
}

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
  try {
    const userId = req.user.sub;
    const [tasks, completionsRes, inProgressRes] = await Promise.all([
      getActiveTasks(),
      db.query(
        `select task_id, count(*)::int as completion_count
         from task_completions where user_id = $1 group by task_id`,
        [userId]
      ),
      db.query(
        `select task_id from user_task_assignments where user_id = $1 and status = 'in_progress'`,
        [userId]
      )
    ]);
    const completionMap = new Map(completionsRes.rows.map((r) => [r.task_id, r.completion_count]));
    const inProgressSet = new Set(inProgressRes.rows.map((r) => r.task_id));

    const data = sortTasks(tasks.map((t) => ({
      ...t,
      completed: completionMap.has(t.id),
      in_progress: inProgressSet.has(t.id),
      completion_count: completionMap.get(t.id) || 0
    })));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Tasks list error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch tasks' });
  }
});

// GET /api/v1/tasks/public-emergency
router.get('/tasks/public-emergency', async (_req, res) => {
  try {
    const tasks = await getActiveTasks();
    const isEmergency = (t) => {
      if (t.category === 'emergency') return true;
      if (typeof t.code === 'string' && t.code.startsWith('E')) return true;
      const tags = Array.isArray(t.tags) ? t.tags : [];
      return tags.some((tag) => String(tag).toLowerCase() === 'emergency');
    };

    const data = sortTasks(
      tasks.filter(isEmergency).map((t) => ({ ...t, completed: false, in_progress: false, completion_count: 0 }))
    ).sort((a, b) => {
      // sortTasks không so sánh theo code — giữ đúng tie-break gốc cho danh sách công khai này.
      const primary = (a.category === 'emergency' ? 0 : 1) - (b.category === 'emergency' ? 0 : 1)
        || (a.difficulty ?? 0) - (b.difficulty ?? 0)
        || (a.duration_minutes ?? 0) - (b.duration_minutes ?? 0);
      if (primary !== 0) return primary;
      return String(a.code).localeCompare(String(b.code));
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Public emergency tasks error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch emergency tasks' });
  }
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
  try {
    const taskId = req.params.id;
    const userId = req.user.sub;

    const existing = await db.query(
      `select * from user_task_assignments
       where user_id = $1 and task_id = $2 and status = 'in_progress'
       limit 1`,
      [userId, taskId]
    );

    if (existing.rows[0]) {
      return res.json({ success: true, data: existing.rows[0] });
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
  } catch (error) {
    console.error('Task start error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not start task' });
  }
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
      `select total_xp, current_level, current_streak, longest_streak,
              to_char(last_activity_date, 'YYYY-MM-DD') as last_activity_iso
       from user_progress
       where user_id = $1
       limit 1`,
      [userId]
    );

    // Ngay hom nay / hom qua tinh trong Postgres theo gio VN (tranh lech timezone Node).
    const dateRes = await client.query(
      `select (now() at time zone 'Asia/Ho_Chi_Minh')::date::text as today,
              ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1)::text as yesterday`
    );
    const todayIso = dateRes.rows[0].today;
    const yesterdayIso = dateRes.rows[0].yesterday;

    const currentProgress = progressResult.rows[0] || {
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      longest_streak: 0,
      last_activity_iso: null
    };

    let nextStreak = currentProgress.current_streak || 0;
    const lastActivityDate = currentProgress.last_activity_iso || null;

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
