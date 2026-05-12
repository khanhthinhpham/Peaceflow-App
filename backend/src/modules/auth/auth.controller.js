import { registerSchema, loginSchema, logoutSchema, refreshSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
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
    return res.status(400).json({
      success: false,
      message: error.message
    });
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
    return res.status(401).json({
      success: false,
      message: error.message
    });
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
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
