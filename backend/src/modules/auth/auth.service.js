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
  updatePasswordAndMarkTokenUsed,
  createExpertUser,
  createExpertApplication,
  findApplicationByToken,
  findExpertByUserId,
  findLatestApplicationByUserId,
  listApplicationsByUserId,
  getCredentialByToken,
  approveApplication,
  rejectApplication,
  updateUserStatus
} from './auth.repository.js';
import crypto from 'crypto';
import { db } from '../../config/db.js';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../common/utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendExpertApplicationToAdmin,
  sendExpertApprovedEmail,
  sendExpertRejectedEmail
} from '../../common/services/email.service.js';

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

  const verifyToken = generateSecureToken();
  await createEmailVerificationToken(user.id, verifyToken);
  try {
    await sendVerificationEmail(user, verifyToken);
  } catch (e) {
    console.error('Failed to send verification email:', e.message);
  }

  return { user };
}

export async function registerExpert(data) {
  const normalizedEmail = String(data.email || '').trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw createAuthError('Email đã được đăng ký.', 409);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await createExpertUser({
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: data.full_name,
    display_name: data.display_name || data.full_name,
    consent_privacy: data.consent_privacy,
    consent_terms: data.consent_terms
  });

  await createDefaultProfile(user.id);
  await createDefaultProgress(user.id);

  const verifyToken = generateSecureToken();
  await createEmailVerificationToken(user.id, verifyToken);
  try {
    await sendVerificationEmail(user, verifyToken);
  } catch (e) {
    console.error('Failed to send expert verification email:', e.message);
  }

  return { user };
}

export async function submitExpertApplication(userId, data, file) {
  if (!file || !file.buffer || !file.size) {
    throw createAuthError('Vui lòng tải lên file bằng cấp.', 400);
  }

  const user = await findUserById(userId);
  if (!user) {
    throw createAuthError('Không tìm thấy tài khoản.', 404);
  }
  if (user.role !== 'expert') {
    throw createAuthError('Chỉ tài khoản chuyên gia mới có thể gửi hồ sơ.', 403);
  }
  if (!user.email_verified) {
    throw createAuthError('Vui lòng xác minh email trước khi gửi hồ sơ.', 403);
  }

  const latestApplication = await findLatestApplicationByUserId(userId);
  if (latestApplication?.status === 'pending') {
    throw createAuthError('Hồ sơ chuyên gia của bạn đang chờ admin duyệt.', 409);
  }

  const existingExpert = await findExpertByUserId(userId);

  const approvalToken = generateSecureToken();
  const application = await createExpertApplication({
    user_id: user.id,
    full_name: data.full_name || user.full_name,
    phone: data.phone || user.phone || '',
    degree: data.degree,
    specialties: data.specialties || [],
    experience_years: data.experience_years || 0,
    location: data.location || null,
    bio: data.bio || null,
    credential_file: file.buffer,
    credential_filename: file.originalname || 'bang-cap',
    credential_mime: file.mimetype || 'application/octet-stream',
    approval_token: approvalToken
  });

  // Giữ status = 'active' để chuyên gia chưa duyệt vẫn đăng nhập & dùng app user
  // bình thường. Trạng thái duyệt được theo dõi qua expert_applications + bảng experts.

  try {
    await sendExpertApplicationToAdmin({
      application: { ...application, email: user.email },
      fileBuffer: file.buffer
    });
  } catch (e) {
    console.error('Failed to send expert application email to admin:', e.message);
  }

  return {
    application: {
      id: application.id,
      status: application.status,
      created_at: application.created_at
    }
  };
}

export async function getMyExpertApplication(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw createAuthError('Không tìm thấy tài khoản.', 404);
  }

  return {
    role: user.role,
    email_verified: user.email_verified,
    user_status: user.status,
    application: await findLatestApplicationByUserId(userId),
    applications: await listApplicationsByUserId(userId),
    has_expert_profile: !!(await findExpertByUserId(userId))
  };
}

export async function approveExpertApplication(token) {
  const application = await findApplicationByToken(token);
  if (!application) {
    throw createAuthError('Link duyệt không hợp lệ.', 400);
  }
  if (application.status !== 'pending') {
    return { alreadyHandled: true, status: application.status, fullName: application.full_name };
  }

  await approveApplication(application);

  try {
    await sendExpertApprovedEmail({
      email: application.email,
      display_name: application.display_name,
      full_name: application.user_full_name || application.full_name
    });
  } catch (e) {
    console.error('Failed to send expert approved email:', e.message);
  }

  return { status: 'approved', fullName: application.full_name };
}

export async function rejectExpertApplication(token) {
  const application = await findApplicationByToken(token);
  if (!application) {
    throw createAuthError('Link từ chối không hợp lệ.', 400);
  }
  if (application.status !== 'pending') {
    return { alreadyHandled: true, status: application.status, fullName: application.full_name };
  }

  await rejectApplication(application);

  try {
    await sendExpertRejectedEmail({
      email: application.email,
      display_name: application.display_name,
      full_name: application.user_full_name || application.full_name
    });
  } catch (e) {
    console.error('Failed to send expert rejected email:', e.message);
  }

  return { status: 'rejected', fullName: application.full_name };
}

export async function getExpertCredential(token) {
  const record = await getCredentialByToken(token);
  if (!record) {
    throw createAuthError('Không tìm thấy file bằng cấp.', 404);
  }
  return record;
}

export async function loginWithGoogle(idToken) {
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

  if (!user.email_verified) {
    throw createAuthError('EMAIL_NOT_VERIFIED', 403);
  }

  // Cho phép 'active' và 'pending' (chuyên gia chờ duyệt vẫn dùng app user bình thường).
  // Chỉ chặn tài khoản bị khoá/vô hiệu hoá.
  if (['suspended', 'deleted', 'inactive'].includes(user.status)) {
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
    role: user.role,
    email_verified: user.email_verified,
    status: user.status,
    created_at: user.created_at
  };
}

function createAuthError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}
