import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select id, email, full_name, display_name, phone, gender, avatar_url, city, country, status, created_at
       from users where id = $1`,
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
    
    console.log(`Updating user ${req.user.sub} with:`, { display_name, phone, gender, avatar_url });

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

    console.log('Update successful, new data:', result.rows[0]);

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
