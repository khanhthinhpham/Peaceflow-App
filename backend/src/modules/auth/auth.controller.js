import { registerSchema, loginSchema } from './auth.schemas.js';
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

export async function syncGoogle(req, res) {
  try {
    const { supabase_token } = req.body;
    if (!supabase_token) {
      throw new Error('Missing supabase_token');
    }

    const result = await authService.syncGoogle(supabase_token);

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
