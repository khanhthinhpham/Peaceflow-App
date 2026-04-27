import { db } from '../../config/db.js';

export async function findUserByEmail(email) {
  const result = await db.query(
    `select * from public.users where email = $1 limit 1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await db.query(
    `select id, email, full_name, display_name, avatar_url, city, country, status, role, created_at
     from public.users
     where id = $1
     limit 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser(payload) {
  const {
    id,
    email,
    full_name,
    display_name,
    consent_privacy,
    consent_terms,
    consent_sensitive_data
  } = payload;

  const result = await db.query(
    `insert into public.users
      (id, email, full_name, display_name, consent_privacy, consent_terms, consent_sensitive_data)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, email, full_name, display_name, created_at`,
    [
      id,
      email,
      full_name,
      display_name || null,
      consent_privacy || false,
      consent_terms || false,
      consent_sensitive_data || false
    ]
  );

  return result.rows[0];
}

export async function createDefaultProfile(userId) {
  await db.query(
    `insert into user_profiles (user_id) values ($1)
     on conflict (user_id) do nothing`,
    [userId]
  );
}

export async function createDefaultProgress(userId) {
  await db.query(
    `insert into user_progress (user_id) values ($1)
     on conflict (user_id) do nothing`,
    [userId]
  );
}

export async function saveRefreshToken(userId, tokenHash, expiresAt) {
  await db.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}
