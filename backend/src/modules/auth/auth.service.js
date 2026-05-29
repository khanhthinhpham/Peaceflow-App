import {
  createDefaultProfile,
  createDefaultProgress,
  createUser,
  findUserByEmail,
  findUserById,
  findValidRefreshToken,
  revokeRefreshTokenByHash,
  revokeRefreshTokenById,
  saveRefreshToken
} from './auth.repository.js';
import crypto from 'crypto';
import { db } from '../../config/db.js';
import { hashPassword, verifyPassword } from '../../common/utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.js';

export async function register(data) {
  const normalizedEmail = String(data.email || '').trim().toLowerCase();
  const { password, full_name, display_name, ...consents } = data;

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw createAuthError('Email đã được đăng ký.', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name,
    display_name: display_name || full_name,
    ...consents
  });

  await createDefaultProfile(user.id);
  await createDefaultProgress(user.id);

  return {
    user,
    session: await createSession(user)
  };
}

export async function login(data) {
  const email = String(data.email || '').trim();
  const password = String(data.password || '');

  const user = await findUserByEmail(email);
  if (!user) {
    throw createAuthError('Không tìm thấy tài khoản.', 404);
  }

  if (user.status !== 'active') {
    throw createAuthError('Tài khoản hiện đang bị vô hiệu hóa.', 403);
  }

  const passwordMatches = await verifyPassword(user.password_hash, password);
  if (!passwordMatches) {
    throw createAuthError('Sai mật khẩu.', 401);
  }

  await db.query(
    `update public.users set last_login_at = now() where id = $1`,
    [user.id]
  );

  return {
    user: sanitizeUser(user),
    session: await createSession(user)
  };
}

export async function refreshSession(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await findValidRefreshToken(payload.sub, tokenHash);

  if (!storedToken) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await findUserById(payload.sub);
  if (!user || user.status !== 'active') {
    await revokeRefreshTokenById(storedToken.id);
    throw new Error('Invalid or expired refresh token');
  }

  await revokeRefreshTokenById(storedToken.id);

  return {
    user: sanitizeUser(user),
    session: await createSession(user)
  };
}

export async function logout(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  await revokeRefreshTokenByHash(tokenHash);
}

async function createSession(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    full_name: user.full_name,
    display_name: user.display_name
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshPayload = verifyRefreshToken(refreshToken);

  await saveRefreshToken(
    user.id,
    hashRefreshToken(refreshToken),
    new Date(refreshPayload.exp * 1000)
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer'
  };
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    city: user.city,
    country: user.country,
    status: user.status,
    created_at: user.created_at
  };
}

function createAuthError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}
