import { db } from '../../config/db.js';

export async function findCurrentUserById(userId) {
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
        u.updated_at,
        up.occupation,
        up.relationship_status,
        up.sleep_target_hours,
        up.preferred_task_duration,
        up.stress_triggers,
        up.support_preferences,
        up.goals,
        p.total_xp,
        p.current_level,
        p.current_streak,
        p.longest_streak,
        p.badges_count
     from public.users u
     left join public.user_profiles up on up.user_id = u.id
     left join public.user_progress p on p.user_id = u.id
     where u.id = $1
     limit 1`,
    [userId]
  );

  return result.rows[0] || null;
}

export async function updateCurrentUser(userId, payload) {
  const result = await db.query(
    `update public.users
     set
       full_name = coalesce($2, full_name),
       display_name = coalesce($3, display_name),
       avatar_url = coalesce($4, avatar_url),
       phone = coalesce($5, phone),
       city = coalesce($6, city),
       country = coalesce($7, country),
       updated_at = now()
     where id = $1
     returning *`,
    [
      userId,
      payload.full_name ?? null,
      payload.display_name ?? null,
      payload.avatar_url ?? null,
      payload.phone ?? null,
      payload.city ?? null,
      payload.country ?? null
    ]
  );

  return result.rows[0] || null;
}
