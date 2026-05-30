import { Resend } from 'resend';
import { env } from '../../config/env.js';

const resend = new Resend(env.resendApiKey);
const FROM = env.emailFrom;
const APP_URL = env.appUrl;

export async function sendVerificationEmail(user, token) {
  const link = `${APP_URL}/pages/verify-email.html?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: '✉️ Xác nhận email — PeaceFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Xin chào ${user.display_name || user.full_name} 👋</h2>
        <p style="color:#555;line-height:1.6;">
          Cảm ơn bạn đã đăng ký PeaceFlow. Hãy xác nhận địa chỉ email để kích hoạt tài khoản.
        </p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Xác nhận email
        </a>
        <p style="color:#999;font-size:0.85rem;">
          Link hết hạn sau 24 giờ. Nếu không phải bạn đăng ký, hãy bỏ qua email này.
        </p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(user, token) {
  const link = `${APP_URL}/pages/reset-password.html?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: '🔐 Đặt lại mật khẩu — PeaceFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Đặt lại mật khẩu</h2>
        <p style="color:#555;line-height:1.6;">
          Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.email}</strong>.
        </p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Đặt lại mật khẩu
        </a>
        <p style="color:#999;font-size:0.85rem;">
          Link hết hạn sau 1 giờ. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.
        </p>
      </div>
    `
  });
}
