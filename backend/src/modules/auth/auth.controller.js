import { ZodError } from 'zod';
import {
  registerSchema,
  registerExpertSchema,
  expertApplicationSchema,
  loginSchema,
  logoutSchema,
  refreshSchema
} from './auth.schemas.js';
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

export async function registerExpert(req, res) {
  try {
    const payload = registerExpertSchema.parse(req.body);
    const result = await authService.registerExpert(payload);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function submitExpertApplication(req, res) {
  try {
    const payload = expertApplicationSchema.parse(req.body);
    const result = await authService.submitExpertApplication(req.user.sub, payload, req.file);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function getMyExpertApplication(req, res) {
  try {
    const result = await authService.getMyExpertApplication(req.user.sub);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendAuthError(res, error, 400);
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

export async function approveExpertApplication(req, res) {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.query);
    const result = await authService.approveExpertApplication(token);
    return sendActionPage(
      res,
      result.alreadyHandled ? 'Hồ sơ đã được xử lý' : 'Đã duyệt hồ sơ chuyên gia',
      result.alreadyHandled
        ? `Hồ sơ của ${escapeHtml(result.fullName)} hiện ở trạng thái <strong>${escapeHtml(result.status)}</strong>.`
        : `Hồ sơ của ${escapeHtml(result.fullName)} đã được duyệt thành công.`
    );
  } catch (error) {
    return sendActionPage(
      res,
      'Không thể duyệt hồ sơ',
      escapeHtml(error?.message || 'Liên kết không hợp lệ hoặc đã hết hạn.'),
      400
    );
  }
}

export async function rejectExpertApplication(req, res) {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.query);
    const result = await authService.rejectExpertApplication(token);
    return sendActionPage(
      res,
      result.alreadyHandled ? 'Hồ sơ đã được xử lý' : 'Đã từ chối hồ sơ chuyên gia',
      result.alreadyHandled
        ? `Hồ sơ của ${escapeHtml(result.fullName)} hiện ở trạng thái <strong>${escapeHtml(result.status)}</strong>.`
        : `Hồ sơ của ${escapeHtml(result.fullName)} đã được từ chối.`
    );
  } catch (error) {
    return sendActionPage(
      res,
      'Không thể từ chối hồ sơ',
      escapeHtml(error?.message || 'Liên kết không hợp lệ hoặc đã hết hạn.'),
      400
    );
  }
}

export async function getExpertCredential(req, res) {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.query);
    const file = await authService.getExpertCredential(token);
    const safeFilename = String(file.credential_filename || 'bang-cap').replace(/"/g, '');

    res.setHeader('Content-Type', file.credential_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    return res.send(file.credential_file);
  } catch (error) {
    return sendActionPage(
      res,
      'Không tìm thấy tệp',
      escapeHtml(error?.message || 'Không thể mở file bằng cấp.'),
      error?.status || 404
    );
  }
}

function sendActionPage(res, title, message, status = 200) {
  return res.status(status).type('html').send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - PeaceFlow</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f7efe7; color: #2f3a33; margin: 0; }
    .card { max-width: 560px; margin: 64px auto; background: #fffdf9; border: 2px solid #d7b18a; border-radius: 18px; padding: 32px 28px; box-shadow: 0 14px 40px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 12px; font-size: 28px; }
    p { line-height: 1.6; color: #4f5b54; }
  </style>
</head>
<body>
  <main class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
  </main>
</body>
</html>`);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
