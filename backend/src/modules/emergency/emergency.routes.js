import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

const VALID_EVENT_TYPES = [
  'hotline_view', 'breathing_tool', 'panic_mode',
  'trusted_contact', 'expert_request', 'crisis_flag'
];

// POST /api/v1/emergency/log — frontend gọi khi user trigger emergency
router.post('/emergency/log', requireAuth, async (req, res) => {
  try {
    const { event_type, payload = {} } = req.body;

    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return res.status(400).json({ success: false, message: 'Invalid event_type' });
    }

    const result = await db.query(
      `insert into emergency_logs (user_id, event_type, payload)
       values ($1, $2, $3)
       returning id, event_type, payload, created_at`,
      [req.user.sub, event_type, JSON.stringify(payload)]
    );

    // Nếu crisis_flag → log rõ để admin có thể theo dõi
    if (event_type === 'crisis_flag') {
      console.warn(`[CRISIS_FLAG] user_id=${req.user.sub} event_received=true`);
    }

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Emergency log error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not log emergency event' });
  }
});

// GET /api/v1/emergency/logs — lấy lịch sử emergency của user
router.get('/emergency/logs', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await db.query(
      `select id, event_type, payload, created_at
       from emergency_logs
       where user_id = $1
       order by created_at desc
       limit $2`,
      [req.user.sub, limit]
    ).catch((e) => { console.error('[EMERGENCY_QUERY] logs:', e.message); return { rows: [] }; });

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Emergency logs error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch emergency logs' });
  }
});

// GET /api/v1/emergency/summary — tổng hợp crisis events (dùng cho admin sau)
router.get('/emergency/summary', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select
         event_type,
         count(*)::int as count,
         max(created_at) as last_at
       from emergency_logs
       where user_id = $1
       group by event_type
       order by count desc`,
      [req.user.sub]
    ).catch((e) => { console.error('[EMERGENCY_QUERY] summary:', e.message); return { rows: [] }; });

    const crisisCount = await db.query(
      `select count(*)::int as total
       from emergency_logs
       where user_id = $1
         and event_type = 'crisis_flag'
         and created_at >= now() - interval '30 days'`,
      [req.user.sub]
    ).catch(() => ({ rows: [{ total: 0 }] }));

    return res.json({
      success: true,
      data: {
        by_type: result.rows,
        crisis_last_30d: crisisCount.rows[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Emergency summary error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not fetch emergency summary' });
  }
});

export default router;
