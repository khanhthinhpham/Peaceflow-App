import { db } from '../../config/db.js';

export async function findUserByEmail(email) {
  const result = await db.query(
    `select * from public.users where lower(email) = lower($1) limit 1`,
    [String(email || '').trim()]
  );
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await db.query(
    `select id, email, full_name, display_name, avatar_url, city, country, status, created_at
     from public.users
     where id = $1
     limit 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser(payload) {
  const {
    email,
    password_hash = null,
    full_name,
    display_name,
    consent_privacy,
    consent_terms,
    consent_sensitive_data,
    email_verified = false,
    avatar_url = null
  } = payload;

  const result = await db.query(
    `insert into public.users
      (email, password_hash, full_name, display_name, avatar_url, consent_privacy, consent_terms, consent_sensitive_data, email_verified)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id, email, full_name, display_name, avatar_url, created_at`,
    [
      String(email || '').trim().toLowerCase(),
      password_hash,
      full_name,
      display_name || null,
      avatar_url,
      consent_privacy || false,
      consent_terms || false,
      consent_sensitive_data || false,
      email_verified
    ]
  );

  return result.rows[0];
}

export async function findUserByGoogleEmail(email) {
  const result = await db.query(
    `select * from public.users where lower(email) = lower($1) limit 1`,
    [String(email || '').trim()]
  );
  return result.rows[0] || null;
}

export async function createEmailVerificationToken(userId, token) {
  await db.query(
    `insert into email_verification_tokens (user_id, token) values ($1, $2)`,
    [userId, token]
  );
}

export async function findEmailVerificationToken(token) {
  const result = await db.query(
    `select evt.*, u.email, u.display_name, u.full_name
     from email_verification_tokens evt
     join users u on u.id = evt.user_id
     where evt.token = $1
       and evt.used_at is null
       and evt.expires_at > now()
     limit 1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function markEmailVerified(userId, tokenId) {
  await db.query(`update users set email_verified = true where id = $1`, [userId]);
  await db.query(`update email_verification_tokens set used_at = now() where id = $1`, [tokenId]);
}

export async function createPasswordResetToken(userId, token) {
  await db.query(
    `update password_reset_tokens set used_at = now()
     where user_id = $1 and used_at is null`,
    [userId]
  );
  await db.query(
    `insert into password_reset_tokens (user_id, token) values ($1, $2)`,
    [userId, token]
  );
}

export async function findPasswordResetToken(token) {
  const result = await db.query(
    `select prt.*, u.email, u.display_name, u.full_name
     from password_reset_tokens prt
     join users u on u.id = prt.user_id
     where prt.token = $1
       and prt.used_at is null
       and prt.expires_at > now()
     limit 1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function updatePasswordAndMarkTokenUsed(userId, passwordHash, tokenId) {
  await db.query(`update users set password_hash = $1 where id = $2`, [passwordHash, userId]);
  await db.query(`update password_reset_tokens set used_at = now() where id = $1`, [tokenId]);
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

export async function findValidRefreshToken(userId, tokenHash) {
  const result = await db.query(
    `select *
     from refresh_tokens
     where user_id = $1
       and token_hash = $2
       and revoked_at is null
       and expires_at > now()
     order by created_at desc
     limit 1`,
    [userId, tokenHash]
  );

  return result.rows[0] || null;
}

export async function revokeRefreshTokenById(id) {
  await db.query(
    `update refresh_tokens
     set revoked_at = now()
     where id = $1
       and revoked_at is null`,
    [id]
  );
}

export async function revokeRefreshTokenByHash(tokenHash) {
  await db.query(
    `update refresh_tokens
     set revoked_at = now()
     where token_hash = $1
       and revoked_at is null`,
    [tokenHash]
  );
}
