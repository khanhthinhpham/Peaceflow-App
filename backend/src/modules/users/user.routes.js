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

// PATCH /api/v1/me/locale — lưu bền ngôn ngữ ưa thích (khác với header x-locale chỉ có
// trong lúc user đang thao tác) — dùng cho email/push gửi từ webhook, cron, không có
// request nào của user để đọc x-locale.
router.patch('/me/locale', requireAuth, async (req, res) => {
  try {
    const locale = req.body?.locale === 'en' ? 'en' : 'vi';
    await db.query(`update users set locale = $2, updated_at = now() where id = $1`, [req.user.sub, locale]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating user locale:', error);
    return res.status(500).json({ success: false, message: 'Could not update locale' });
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

// POST /api/v1/me/anonymize — ẩn danh hồ sơ nhận dạng (Điều 10 Nghị định 356/2025/NĐ-CP).
// Xóa họ tên, email, số điện thoại, ảnh, ngày sinh, nơi ở và thay bằng mã ngẫu nhiên; dữ liệu
// sử dụng (tâm trạng, nhật ký, bài test...) giữ nguyên nhưng không còn gắn với danh tính.
// Mật khẩu bị thay bằng chuỗi ngẫu nhiên và mọi phiên bị thu hồi -> không đăng nhập lại được.
router.post('/me/anonymize', requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const client = await db.connect();
  try {
    // Chuyên gia cần giữ danh tính cho lịch hẹn/thu nhập — xử lý qua bộ phận hỗ trợ.
    const expert = await client.query('select 1 from experts where user_id = $1 limit 1', [userId]);
    if (expert.rowCount) {
      return res.status(409).json({ success: false, message: 'Tài khoản chuyên gia không thể tự ẩn danh. Vui lòng liên hệ peaceflow.vn@gmail.com.' });
    }

    await client.query('begin');
    await client.query(
      `update users
          set email = 'anon-' || replace(gen_random_uuid()::text, '-', '') || '@anonymized.invalid',
              full_name = 'Người dùng ẩn danh',
              display_name = 'Ẩn danh ' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
              phone = null, avatar_url = null, date_of_birth = null, city = null,
              gender = 'prefer_not_to_say',
              password_hash = 'anonymized:' || gen_random_uuid()::text,
              email_verified = false,
              status = 'inactive',
              updated_at = now()
        where id = $1`,
      [userId]
    );
    await client.query(
      'update user_profiles set occupation = null, relationship_status = null, updated_at = now() where user_id = $1',
      [userId]
    );
    await client.query('update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null', [userId]);
    await client.query('delete from push_subscriptions where user_id = $1', [userId]);
    await client.query('delete from email_verification_tokens where user_id = $1', [userId]);
    await client.query('delete from password_reset_tokens where user_id = $1', [userId]);
    await client.query('commit');

    return res.json({ success: true, data: { message: 'Hồ sơ đã được ẩn danh.' } });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error('Anonymize account error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Could not anonymize account' });
  } finally {
    client.release();
  }
});

export default router;
