import { db } from '../../config/db.js';

/**
 * Lấy profile theo user ID
 */
export async function findByUserId(userId) {
  const result = await db.query(
    `SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Cập nhật profile
 */
export async function update(userId, data) {
  const result = await db.query(
    `UPDATE user_profiles
     SET occupation = COALESCE($2, occupation),
         relationship_status = COALESCE($3, relationship_status),
         sleep_target_hours = COALESCE($4, sleep_target_hours),
         preferred_task_duration = COALESCE($5, preferred_task_duration),
         stress_triggers = CASE WHEN $6 IS NULL THEN stress_triggers ELSE COALESCE(stress_triggers, '[]'::jsonb) || $6::jsonb END,
         support_preferences = CASE WHEN $7 IS NULL THEN support_preferences ELSE COALESCE(support_preferences, '{}'::jsonb) || $7::jsonb END,
         goals = CASE WHEN $8 IS NULL THEN goals ELSE $8::jsonb END,
         onboarding_answers = CASE WHEN $9 IS NULL THEN onboarding_answers ELSE COALESCE(onboarding_answers, '{}'::jsonb) || $9::jsonb END,
         personalization_weights = CASE WHEN $10 IS NULL THEN personalization_weights ELSE COALESCE(personalization_weights, '{}'::jsonb) || $10::jsonb END,
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [
      userId,
      data.occupation || null,
      data.relationship_status || null,
      data.sleep_target_hours || null,
      data.preferred_task_duration || null,
      data.stress_triggers ? JSON.stringify(data.stress_triggers) : null,
      data.support_preferences ? JSON.stringify(data.support_preferences) : null,
      data.goals ? JSON.stringify(data.goals) : null,
      data.onboarding_answers ? JSON.stringify(data.onboarding_answers) : null,
      data.personalization_weights ? JSON.stringify(data.personalization_weights) : null
    ]
  );
  return result.rows[0] || null;
}
