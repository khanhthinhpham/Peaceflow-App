import {
  createDefaultProfile,
  createDefaultProgress,
  createUser,
  findUserByEmail,
  findUserByGoogleEmail,
  findUserById,
  findValidRefreshToken,
  revokeRefreshTokenByHash,
  revokeRefreshTokenById,
  saveRefreshToken,
  createEmailVerificationToken,
  findEmailVerificationToken,
  markEmailVerified,
  createPasswordResetToken,
  findPasswordResetToken,
  updatePasswordAndMarkTokenUsed
} from './auth.repository.js';
import crypto from 'crypto';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../common/utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../common/services/email.service.js';

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
    email_verified: false,
    ...consents
  });

  await createDefaultProfile(user.id);
  await createDefaultProgress(user.id);

  // Gửi email xác nhận (không block response nếu lỗi)
  const verifyToken = generateSecureToken();
  await createEmailVerificationToken(user.id, verifyToken);
  sendVerificationEmail(user, verifyToken).catch((e) =>
    console.error('Failed to send verification email:', e.message)
  );

  // Không tạo session — user phải verify email trước khi login
  return { user };
}

export async function loginWithGoogle(idToken) {
  // Verify với Google tokeninfo
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  if (!res.ok) {
    throw createAuthError('Google token không hợp lệ.', 401);
  }
  const payload = await res.json();

  if (env.googleClientId && payload.aud !== env.googleClientId) {
    throw createAuthError('Google token không đúng ứng dụng.', 401);
  }

  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) throw createAuthError('Không lấy được email từ Google.', 400);

  let user = await findUserByGoogleEmail(email);

  if (!user) {
    // Tạo tài khoản mới từ Google
    const fullName = payload.name || email.split('@')[0];
    user = await createUser({
      email,
      password_hash: null,
      full_name: fullName,
      display_name: fullName,
      avatar_url: payload.picture || null,
      email_verified: true,
      consent_privacy: true,
      consent_terms: true,
      consent_sensitive_data: false
    });
    await createDefaultProfile(user.id);
    await createDefaultProgress(user.id);
  } else if (user.status !== 'active') {
    throw createAuthError('Tài khoản hiện đang bị vô hiệu hóa.', 403);
  }

  await db.query(`update users set last_login_at = now() where id = $1`, [user.id]);

  return {
    user: sanitizeUser(user),
    session: await createSession(user)
  };
}

export async function verifyEmail(token) {
  const record = await findEmailVerificationToken(token);
  if (!record) {
    throw createAuthError('Link xác nhận không hợp lệ hoặc đã hết hạn.', 400);
  }
  await markEmailVerified(record.user_id, record.id);
}

export async function resendVerificationEmail(email) {
  const user = await findUserByEmail(String(email || '').trim().toLowerCase());
  if (!user || user.email_verified) return;

  const token = generateSecureToken();
  await createEmailVerificationToken(user.id, token);
  await sendVerificationEmail(user, token);
}

export async function forgotPassword(email) {
  const user = await findUserByEmail(String(email || '').trim().toLowerCase());
  // Không báo lỗi nếu email không tồn tại (tránh email enumeration)
  if (!user) return;

  const token = generateSecureToken();
  await createPasswordResetToken(user.id, token);
  await sendPasswordResetEmail(user, token);
}

export async function resetPassword(token, newPassword) {
  const record = await findPasswordResetToken(token);
  if (!record) {
    throw createAuthError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
  }
  const passwordHash = await hashPassword(newPassword);
  await updatePasswordAndMarkTokenUsed(record.user_id, passwordHash, record.id);
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

  if (!user.email_verified) {
    throw createAuthError('EMAIL_NOT_VERIFIED', 403);
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

function generateSecureToken() {
  return crypto.randomBytes(48).toString('hex');
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
