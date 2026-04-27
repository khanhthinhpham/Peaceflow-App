import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

const router = Router();

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `select * from user_profiles where user_id = $1 limit 1`,
      [req.user.sub]
    );

    return res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      occupation,
      relationship_status,
      sleep_target_hours,
      preferred_task_duration,
      stress_triggers,
      support_preferences,
      goals,
      onboarding_answers,
      personalization_weights
    } = req.body;

    console.log(`Updating profile for user ${req.user.sub}`);

    const result = await db.query(
      `update user_profiles
       set occupation = coalesce($2, occupation),
           relationship_status = coalesce($3, relationship_status),
           sleep_target_hours = coalesce($4, sleep_target_hours),
           preferred_task_duration = coalesce($5, preferred_task_duration),
           stress_triggers = case when $6 is null then stress_triggers else coalesce(stress_triggers, '[]'::jsonb) || $6::jsonb end,
           support_preferences = case when $7 is null then support_preferences else coalesce(support_preferences, '{}'::jsonb) || $7::jsonb end,
           goals = case when $8 is null then goals else $8::jsonb end,
           onboarding_answers = case when $9 is null then onboarding_answers else coalesce(onboarding_answers, '{}'::jsonb) || $9::jsonb end,
           personalization_weights = case when $10 is null then personalization_weights else coalesce(personalization_weights, '{}'::jsonb) || $10::jsonb end,
           updated_at = now()
       where user_id = $1
       returning *`,
      [
        req.user.sub,
        occupation || null,
        relationship_status || null,
        sleep_target_hours || null,
        preferred_task_duration || null,
        stress_triggers ? JSON.stringify(stress_triggers) : null,
        support_preferences ? JSON.stringify(support_preferences) : null,
        goals ? JSON.stringify(goals) : null,
        onboarding_answers ? JSON.stringify(onboarding_answers) : null,
        personalization_weights ? JSON.stringify(personalization_weights) : null
      ]
    );

    if (result.rowCount === 0) {
      console.warn(`Profile for user ${req.user.sub} not found for update`);
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    console.log('Profile update successful');

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
