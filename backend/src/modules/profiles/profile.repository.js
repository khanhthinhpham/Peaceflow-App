import { db } from '../../config/db.js';

/**
 * Lấy profile đầy đủ theo user ID
 */
export async function findByUserId(userId) {
  const result = await db.query(
    `select
        u.id,
        u.email,
        u.phone,
        u.full_name,
        u.display_name,
        u.avatar_url,
        u.date_of_birth,
        u.gender,
        u.city,
        u.country,
        u.status,
        u.role,
        u.email_verified,
        u.created_at,
        u.updated_at as user_updated_at,
        up.occupation,
        up.relationship_status,
        up.sleep_target_hours,
        up.preferred_task_duration,
        up.stress_triggers,
        up.support_preferences,
        up.goals,
        up.onboarding_answers,
        up.personalization_weights,
        up.baseline_stress_score,
        up.baseline_anxiety_score,
        up.baseline_mood_score,
        up.updated_at as profile_updated_at
     from public.users u
     left join public.user_profiles up on up.user_id = u.id
     where u.id = $1
     limit 1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Cập nhật profile đầy đủ:
 * - public.users
 * - public.user_profiles
 */
export async function update(userId, data) {
  const client = await db.connect();

  try {
    await client.query('begin');

    const userResult = await client.query(
      `update public.users
       set
         full_name = coalesce($2, full_name),
         display_name = coalesce($3, display_name),
         avatar_url = coalesce($4, avatar_url),
         phone = coalesce($5, phone),
         date_of_birth = coalesce($6, date_of_birth),
         gender = coalesce($7, gender),
         city = coalesce($8, city),
         country = coalesce($9, country),
         updated_at = now()
       where id = $1
       returning
         id,
         email,
         phone,
         full_name,
         display_name,
         avatar_url,
         date_of_birth,
         gender,
         city,
         country,
         status,
         role,
         email_verified,
         created_at,
         updated_at`,
      [
        userId,
        data.full_name ?? null,
        data.display_name ?? null,
        data.avatar_url ?? null,
        data.phone ?? null,
        data.date_of_birth ?? null,
        data.gender ?? null,
        data.city ?? null,
        data.country ?? null
      ]
    );

    await client.query(
      `insert into public.user_profiles (user_id)
       values ($1)
       on conflict (user_id) do nothing`,
      [userId]
    );

    const profileResult = await client.query(
      `update public.user_profiles
       set
         occupation = coalesce($2, occupation),
         relationship_status = coalesce($3, relationship_status),
         sleep_target_hours = coalesce($4, sleep_target_hours),
         preferred_task_duration = coalesce($5, preferred_task_duration),
         stress_triggers = case
           when $6 is null then stress_triggers
           else $6::jsonb
         end,
         support_preferences = case
           when $7 is null then support_preferences
           else coalesce(support_preferences, '{}'::jsonb) || $7::jsonb
         end,
         goals = case
           when $8 is null then goals
           else $8::jsonb
         end,
         onboarding_answers = case
           when $9 is null then onboarding_answers
           else coalesce(onboarding_answers, '{}'::jsonb) || $9::jsonb
         end,
         personalization_weights = case
           when $10 is null then personalization_weights
           else coalesce(personalization_weights, '{}'::jsonb) || $10::jsonb
         end,
         updated_at = now()
       where user_id = $1
       returning
         occupation,
         relationship_status,
         sleep_target_hours,
         preferred_task_duration,
         stress_triggers,
         support_preferences,
         goals,
         onboarding_answers,
         personalization_weights,
         baseline_stress_score,
         baseline_anxiety_score,
         baseline_mood_score,
         updated_at as profile_updated_at`,
      [
        userId,
        data.occupation ?? null,
        data.relationship_status ?? null,
        data.sleep_target_hours ?? null,
        data.preferred_task_duration ?? null,
        data.stress_triggers ? JSON.stringify(data.stress_triggers) : null,
        data.support_preferences ? JSON.stringify(data.support_preferences) : null,
        data.goals ? JSON.stringify(data.goals) : null,
        data.onboarding_answers ? JSON.stringify(data.onboarding_answers) : null,
        data.personalization_weights ? JSON.stringify(data.personalization_weights) : null
      ]
    );

    await client.query('commit');

    return {
      ...userResult.rows[0],
      ...profileResult.rows[0]
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
