import crypto from 'crypto';
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
    `select id, email, full_name, display_name, avatar_url, city, country, phone, role, status, email_verified, created_at
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
  // Vô hiệu hoá token cũ chưa dùng để mỗi lúc chỉ có một link còn sống,
  // tránh việc người dùng bấm nhầm link cũ trong hộp thư.
  await db.query(
    `update email_verification_tokens set used_at = now()
     where user_id = $1 and used_at is null`,
    [userId]
  );
  await db.query(
    `insert into email_verification_tokens (user_id, token) values ($1, $2)`,
    [userId, token]
  );
}

// Lấy token bất kể đã dùng hay hết hạn, để tầng service phân biệt được
// từng nguyên nhân và trả về thông báo đúng cho người dùng.
export async function findEmailVerificationTokenAny(token) {
  const result = await db.query(
    `select evt.*, u.email, u.display_name, u.full_name,
            u.email_verified as user_email_verified
     from email_verification_tokens evt
     join users u on u.id = evt.user_id
     where evt.token = $1
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

export async function createExpertUser(payload) {
  const {
    email,
    password_hash,
    full_name,
    display_name,
    phone = null,
    consent_privacy = false,
    consent_terms = false
  } = payload;

  const result = await db.query(
    `insert into public.users
      (email, password_hash, full_name, display_name, phone, role, status, email_verified, consent_privacy, consent_terms)
     values ($1, $2, $3, $4, $5, 'expert', 'active', false, $6, $7)
     returning id, email, full_name, display_name, phone, role, status, created_at`,
    [
      String(email || '').trim().toLowerCase(),
      password_hash,
      full_name,
      display_name || full_name,
      phone,
      consent_privacy || false,
      consent_terms || false
    ]
  );

  return result.rows[0];
}

export async function createExpertApplication(data) {
  const result = await db.query(
    `insert into expert_applications
      (user_id, full_name, phone, degree, specialties, experience_years, location, bio,
       credential_file, credential_filename, credential_mime, approval_token)
     values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
     returning id, user_id, full_name, phone, degree, specialties, experience_years,
               location, bio, credential_filename, credential_mime, approval_token, status, created_at`,
    [
      data.user_id,
      data.full_name,
      data.phone,
      data.degree,
      JSON.stringify(data.specialties || []),
      data.experience_years || 0,
      data.location || null,
      data.bio || null,
      data.credential_file,
      data.credential_filename,
      data.credential_mime,
      data.approval_token
    ]
  );
  return result.rows[0];
}

export async function findApplicationByToken(token) {
  const result = await db.query(
    `select a.*, u.email, u.display_name, u.full_name as user_full_name
     from expert_applications a
     join users u on u.id = a.user_id
     where a.approval_token = $1
     limit 1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function findLatestApplicationByUserId(userId) {
  const result = await db.query(
    `select id, user_id, status, full_name, degree, phone, specialties, experience_years,
            location, bio, credential_filename, expert_id, created_at, reviewed_at
     from expert_applications
     where user_id = $1
     order by created_at desc
     limit 1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function listApplicationsByUserId(userId) {
  const result = await db.query(
    `select id, user_id, status, full_name, phone, degree, specialties, experience_years,
            location, bio, credential_filename, expert_id, created_at, reviewed_at
     from expert_applications
     where user_id = $1
     order by created_at desc`,
    [userId]
  );
  return result.rows;
}

export async function findExpertByUserId(userId) {
  const result = await db.query(
    `select id, code, full_name, degree, phone, avatar_emoji, status, rating, sessions_count,
            satisfaction_rate, base_price, location, experience_years, specialties, bio,
            credentials, approaches, next_slot_label, active, user_id, created_at, updated_at
     from experts
     where user_id = $1
     limit 1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function getCredentialByToken(token) {
  const result = await db.query(
    `select credential_file, credential_filename, credential_mime
     from expert_applications
     where approval_token = $1
     limit 1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function approveApplication(application) {
  const client = await db.connect();
  try {
    await client.query('begin');

    await client.query(
      `update users
       set status = 'active', email_verified = true, role = 'expert', phone = coalesce(phone, $2)
       where id = $1`,
      [application.user_id, application.phone]
    );

    const existingExpertRes = await client.query(
      `select id from experts where user_id = $1 limit 1`,
      [application.user_id]
    );

    let expertId;
    if (existingExpertRes.rows[0]) {
      expertId = existingExpertRes.rows[0].id;
      await client.query(
        `update experts
         set full_name = $2,
             degree = $3,
             phone = $4,
             location = $5,
             experience_years = $6,
             specialties = $7::jsonb,
             bio = $8,
             active = true,
             updated_at = now()
         where id = $1`,
        [
          expertId,
          application.full_name,
          application.degree,
          application.phone,
          application.location || null,
          application.experience_years || 0,
          JSON.stringify(application.specialties || []),
          application.bio || null
        ]
      );
    } else {
      const code = `EXP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expertRes = await client.query(
        `insert into experts
          (code, full_name, degree, phone, location, experience_years, specialties, bio, user_id, status, active)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, 'offline', true)
         returning id`,
        [
          code,
          application.full_name,
          application.degree,
          application.phone,
          application.location || null,
          application.experience_years || 0,
          JSON.stringify(application.specialties || []),
          application.bio || null,
          application.user_id
        ]
      );
      expertId = expertRes.rows[0].id;
    }

    await client.query(
      `update expert_applications
       set status = 'approved', reviewed_at = now(), expert_id = $2
       where id = $1`,
      [application.id, expertId]
    );

    await client.query('commit');
    return { expertId };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectApplication(application) {
  const client = await db.connect();
  try {
    await client.query('begin');
    await client.query(
      `update expert_applications set status = 'rejected', reviewed_at = now() where id = $1`,
      [application.id]
    );
    await client.query(
      `update users set status = 'active' where id = $1`,
      [application.user_id]
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserStatus(userId, status) {
  await db.query(`update users set status = $2 where id = $1`, [userId, status]);
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
