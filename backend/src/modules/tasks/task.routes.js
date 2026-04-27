import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { RecommendationEngineService } from '../risk/recommendation-engine.service.js';

const router = Router();

// GET /api/v1/tasks
router.get('/tasks', requireAuth, async (req, res) => {
  const result = await db.query(
    `select * from tasks where active = true order by category, duration_minutes`
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

  const result = await db.query(
    `insert into user_task_assignments (user_id, task_id, status, assigned_at)
     values ($1, $2, 'in_progress', now())
     on conflict (user_id, task_id) where status = 'in_progress' do nothing
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

  const result = await db.query(
    `insert into task_completions (user_id, task_id, self_rating_before, self_rating_after, notes)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [userId, taskId, self_rating_before, self_rating_after, notes]
  );

  // Update assignment status
  await db.query(
    `update user_task_assignments set status = 'completed', completed_at = now()
     where user_id = $1 and task_id = $2 and status = 'in_progress'`,
    [userId, taskId]
  );

  return res.json({
    success: true,
    data: result.rows[0]
  });
});

export default router;
