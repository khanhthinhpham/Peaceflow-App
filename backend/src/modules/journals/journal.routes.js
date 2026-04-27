import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

// GET /api/v1/journal
router.get('/journal', requireAuth, async (req, res) => {
  const result = await db.query(
    `select * from user_journals where user_id = $1 order by created_at desc`,
    [req.user.sub]
  );
  return res.json({ success: true, data: result.rows });
});

// POST /api/v1/journal
router.post('/journal', requireAuth, async (req, res) => {
  const { content, mood, tags } = req.body;
  const result = await db.query(
    `insert into user_journals (user_id, content, mood, tags)
     values ($1, $2, $3, $4)
     returning *`,
    [req.user.sub, content, mood, JSON.stringify(tags || [])]
  );
  return res.json({ success: true, data: result.rows[0] });
});

export default router;
