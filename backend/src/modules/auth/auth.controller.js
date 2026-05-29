import { ZodError } from 'zod';
import { registerSchema, loginSchema, logoutSchema, refreshSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

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
