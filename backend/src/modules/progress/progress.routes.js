import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

// GET /api/v1/progress
router.get('/progress', requireAuth, async (req, res) => {
  const result = await db.query(
    `select * from user_progress where user_id = $1 limit 1`,
    [req.user.sub]
  );

  return res.json({
    success: true,
    data: result.rows[0] || { xp: 0, level: 1, streak: 0 }
  });
});

export default router;
