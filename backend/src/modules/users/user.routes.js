import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select u.id, u.email, u.full_name, u.display_name, u.phone, u.gender, u.avatar_url, u.city, u.country, u.role, u.email_verified, u.status, u.created_at,
              exists(select 1 from experts e where e.user_id = u.id) as is_expert,
              (u.role = 'admin' or u.is_admin) as is_admin
       from users u where u.id = $1`,
      [req.user.sub]
    );

    return res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { display_name, phone, gender, avatar_url } = req.body;
    
    // Use NULLIF to treat empty strings as null so COALESCE picks the old value if needed
    // OR just use the values directly if we want to allow empty strings
    const result = await db.query(
      `update users
       set display_name = coalesce($2, display_name),
           phone = coalesce($3, phone),
           gender = coalesce($4, gender),
           avatar_url = coalesce($5, avatar_url),
           updated_at = now()
       where id = $1
       returning id, email, full_name, display_name, phone, gender, avatar_url, city, country, status`,
      [req.user.sub, display_name, phone, gender, avatar_url]
    );

    if (result.rowCount === 0) {
      console.warn(`User ${req.user.sub} not found for update`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.info(`[USER_PROFILE] updated user_id=${req.user.sub}`);

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Could not update user profile' });
  }
});

// GET /api/v1/me/export — xuất toàn bộ dữ liệu cá nhân (GDPR)
router.get('/me/export', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const [userRes, profileRes, moodsRes, journalsRes, tasksRes, progressRes, badgesRes] = await Promise.all([
      db.query(`select id, email, full_name, display_name, phone, gender, city, country, created_at from users where id = $1`, [userId]),
      db.query(`select * from user_profiles where user_id = $1`, [userId]).catch(() => ({ rows: [] })),
      db.query(`select mood_score, anxiety_score, stress_score, energy_score, dominant_emotion, notes, created_at from mood_checkins where user_id = $1 order by created_at desc`, [userId]).catch(() => ({ rows: [] })),
      db.query(`select title, content, tags, sentiment_score, created_at from journal_entries where user_id = $1 and is_private = false order by created_at desc`, [userId]).catch(() => ({ rows: [] })),
      db.query(`select t.title, t.category, tc.xp_earned, tc.created_at from task_completions tc join tasks t on t.id = tc.task_id where tc.user_id = $1 order by tc.created_at desc`, [userId]).catch(() => ({ rows: [] })),
      db.query(`select total_xp, current_level, current_streak, longest_streak from user_progress where user_id = $1`, [userId]).catch(() => ({ rows: [] })),
      db.query(`select b.name, b.code, ub.earned_at from user_badges ub join badges b on b.id = ub.badge_id where ub.user_id = $1`, [userId]).catch(() => ({ rows: [] }))
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: userRes.rows[0] || null,
      profile: profileRes.rows[0] || null,
      progress: progressRes.rows[0] || null,
      mood_checkins: moodsRes.rows,
      journal_entries: journalsRes.rows,
      completed_tasks: tasksRes.rows,
      badges: badgesRes.rows
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="peaceflow-data-${userId.slice(0, 8)}.json"`);
    return res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not export data' });
  }
});

// DELETE /api/v1/me — xóa tài khoản (soft delete)
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    await db.query(
      `update users set status = 'deleted', updated_at = now() where id = $1`,
      [userId]
    );

    // Revoke tất cả refresh tokens
    await db.query(
      `update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null`,
      [userId]
    ).catch(() => {});

    return res.json({ success: true, data: { message: 'Tài khoản đã được xóa.' } });
  } catch (error) {
    console.error('Delete account error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not delete account' });
  }
});

export default router;
