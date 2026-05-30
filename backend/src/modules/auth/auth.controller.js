import { ZodError } from 'zod';
import { registerSchema, loginSchema, logoutSchema, refreshSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';
import { z } from 'zod';

function sendAuthError(res, error, fallbackStatus = 400) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: error.issues?.[0]?.message || 'Invalid request payload'
    });
  }

  if (error?.status && error?.message) {
    return res.status(error.status).json({
      success: false,
      message: error.message
    });
  }

  console.error('[auth]', error);

  return res.status(fallbackStatus).json({
    success: false,
    message: error?.message || 'Authentication request failed'
  });
}

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendAuthError(res, error, 500);
  }
}

export async function refresh(req, res) {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await authService.refreshSession(payload.refresh_token);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendAuthError(res, error, 401);
  }
}

export async function logout(req, res) {
  try {
    const payload = logoutSchema.parse(req.body);
    await authService.logout(payload.refresh_token);

    return res.json({
      success: true,
      data: { message: 'Logged out' }
    });
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function googleLogin(req, res) {
  try {
    const { id_token } = z.object({ id_token: z.string().min(1) }).parse(req.body);
    const result = await authService.loginWithGoogle(id_token);
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendAuthError(res, error, 401);
  }
}

export async function verifyEmail(req, res) {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.query);
    await authService.verifyEmail(token);
    return res.json({ success: true, data: { message: 'Email đã được xác nhận.' } });
  } catch (error) {
    return sendAuthError(res, error, 400);
  }
}

export async function resendVerification(req, res) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await authService.resendVerificationEmail(email);
    return res.json({ success: true, data: { message: 'Email xác nhận đã được gửi lại.' } });
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await authService.forgotPassword(email);
    // Luôn trả về success để tránh email enumeration
    return res.json({ success: true, data: { message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' } });
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = z.object({
      token: z.string().min(1),
      password: z.string().min(8)
    }).parse(req.body);
    await authService.resetPassword(token, password);
    return res.json({ success: true, data: { message: 'Mật khẩu đã được đặt lại thành công.' } });
  } catch (error) {
    return sendAuthError(res, error, 400);
  }
}
