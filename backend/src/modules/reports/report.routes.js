import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { RiskEngineService } from '../risk/risk-engine.service.js';

const router = Router();

router.get('/reports/summary', requireAuth, async (req, res) => {
  const userId = req.user.sub;

  const [progressRes, latestMoodRes, totalTasksRes, badgesRes, riskRes] = await Promise.all([
    db.query(`select * from user_progress where user_id = $1 limit 1`, [userId]),
    db.query(`select * from mood_checkins where user_id = $1 order by created_at desc limit 1`, [userId]),
    db.query(`select count(*)::int as completed_tasks from task_completions where user_id = $1`, [userId]),
    db.query(`select count(*)::int as badges_count from user_badges where user_id = $1`, [userId]),
    RiskEngineService.calculateStressIndex(userId).catch(() => ({ stress_index: 0 }))
  ]);

  return res.json({
    success: true,
    data: {
      progress: progressRes.rows[0] || null,
      latest_mood: latestMoodRes.rows[0] || null,
      completed_tasks: totalTasksRes.rows[0]?.completed_tasks || 0,
      badges_count: badgesRes.rows[0]?.badges_count || 0,
      stress_index: riskRes.stress_index,
      risk_level: riskRes.risk_level
    }
  });
});

export default router;
