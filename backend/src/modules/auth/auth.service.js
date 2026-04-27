import crypto from 'crypto';
import dayjs from 'dayjs';
import {
  createDefaultProfile,
  createDefaultProgress,
  createUser,
  findUserByEmail
} from './auth.repository.js';
import { hashPassword, verifyPassword } from '../../common/utils/hash.js';
import { signAccessToken, signRefreshToken } from '../../common/utils/jwt.js';
import { env } from '../../config/env.js';
import { db } from '../../config/db.js';

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function register(data) {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  const password_hash = await hashPassword(data.password);

  const user = await createUser({
    ...data,
    password_hash
  });

  await createDefaultProfile(user.id);
  await createDefaultProgress(user.id);

  const access_token = signAccessToken({ sub: user.id, email: user.email });
  const refresh_token = signRefreshToken({ sub: user.id, email: user.email });

  const expiresAt = dayjs().add(30, 'day').toDate();
  await db.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [user.id, sha256(refresh_token), expiresAt]
  );

  return {
    user,
    access_token,
    refresh_token
  };
}

export async function login(data) {
  const user = await findUserByEmail(data.email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(user.password_hash, data.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const access_token = signAccessToken({ sub: user.id, email: user.email });
  const refresh_token = signRefreshToken({ sub: user.id, email: user.email });

  const expiresAt = dayjs().add(30, 'day').toDate();
  await db.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [user.id, sha256(refresh_token), expiresAt]
  );

  await db.query(
    `update users set last_login_at = now() where id = $1`,
    [user.id]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      display_name: user.display_name
    },
    access_token,
    refresh_token
  };
}

export async function syncGoogle(supabaseToken) {
  // 1. Verify token with Supabase API
  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'apikey': env.supabaseServiceRoleKey || env.supabaseUrl // Might need public key if service role is missing, but usually supabaseUrl has anon key in frontend. Let's rely on standard fetch.
    }
  });

  if (!response.ok) {
    throw new Error('Invalid Supabase token');
  }

  const supabaseUser = await response.json();
  const email = supabaseUser.email;

  if (!email) {
    throw new Error('Email not found in Supabase user');
  }

  // 2. Find user in our public.users (should be created by trigger)
  // If trigger hasn't fired yet or failed, we can wait a bit or create them manually. 
  // Let's retry a few times if they are not there yet (trigger race condition).
  let user = null;
  for (let i = 0; i < 3; i++) {
    user = await findUserByEmail(email);
    if (user) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (!user) {
    // Fallback: manually insert if trigger failed
    const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'Người dùng Google';
    const avatarUrl = supabaseUser.user_metadata?.avatar_url;
    
    const dbRes = await db.query(
      `INSERT INTO users (id, email, full_name, display_name, avatar_url, password_hash)
       VALUES ($1, $2, $3, $4, $5, 'oauth')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url
       RETURNING *`,
       [supabaseUser.id, email, fullName, fullName, avatarUrl]
    );
    user = dbRes.rows[0];
    
    await db.query(`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]);
    await db.query(`INSERT INTO user_progress (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]);
  }

  // 3. Issue custom tokens
  const access_token = signAccessToken({ sub: user.id, email: user.email });
  const refresh_token = signRefreshToken({ sub: user.id, email: user.email });

  const expiresAt = dayjs().add(30, 'day').toDate();
  await db.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [user.id, sha256(refresh_token), expiresAt]
  );

  await db.query(
    `update users set last_login_at = now() where id = $1`,
    [user.id]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    },
    access_token,
    refresh_token
  };
}
