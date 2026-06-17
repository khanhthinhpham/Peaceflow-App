import { Resend } from 'resend';
import { env } from '../../config/env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;
const FROM = env.emailFrom;
const APP_URL = env.frontendUrl;

export async function sendVerificationEmail(user, token) {
  ensureResendConfigured();
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

export async function sendExpertApplicationToAdmin({ application, fileBuffer }) {
  ensureResendConfigured();
  const apiBase = `${env.apiPublicUrl}${env.apiPrefix || '/api/v1'}`;
  const approveLink = `${apiBase}/auth/expert-application/approve?token=${application.approval_token}`;
  const rejectLink = `${apiBase}/auth/expert-application/reject?token=${application.approval_token}`;
  const credentialLink = `${apiBase}/auth/expert-application/credential?token=${application.approval_token}`;

  const specialties = Array.isArray(application.specialties)
    ? application.specialties.join(', ')
    : '';

  await resend.emails.send({
    from: FROM,
    to: env.adminEmail,
    subject: `🩺 Hồ sơ chuyên gia mới — ${application.full_name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Hồ sơ đăng ký chuyên gia mới</h2>
        <p style="color:#555;line-height:1.6;">Một người vừa đăng ký làm chuyên gia trên PeaceFlow. Vui lòng xem xét và duyệt.</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.92rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:160px;">Họ tên</td><td><strong>${application.full_name}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Email</td><td>${application.email || '-'}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Số điện thoại</td><td>${application.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Bằng cấp</td><td>${application.degree}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Chuyên môn</td><td>${specialties || '-'}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Kinh nghiệm</td><td>${application.experience_years || 0} năm</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Nơi công tác</td><td>${application.location || '-'}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Giới thiệu</td><td>${application.bio || '-'}</td></tr>
        </table>
        <p style="margin:8px 0;">
          📎 File bằng cấp đính kèm trong email này.
          <a href="${credentialLink}" style="color:#2D6A4F;font-weight:700;">Hoặc xem online</a>.
        </p>
        <div style="margin:24px 0;">
          <a href="${approveLink}" style="display:inline-block;margin-right:12px;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">✅ Duyệt</a>
          <a href="${rejectLink}" style="display:inline-block;padding:12px 28px;background:#E76F51;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">❌ Từ chối</a>
        </div>
        <p style="color:#999;font-size:0.8rem;">Hành động này yêu cầu token bí mật trong link, chỉ có trong email này.</p>
      </div>
    `,
    attachments: [
      {
        filename: application.credential_filename || 'bang-cap',
        content: fileBuffer
      }
    ]
  });
}

export async function sendExpertApprovedEmail(user) {
  ensureResendConfigured();
  const link = `${APP_URL}/pages/login.html`;
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: '🎉 Hồ sơ chuyên gia đã được duyệt — PeaceFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Chúc mừng ${user.display_name || user.full_name} 🎉</h2>
        <p style="color:#555;line-height:1.6;">
          Hồ sơ chuyên gia của bạn đã được duyệt. Bạn có thể đăng nhập ngay để bắt đầu.
        </p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Đăng nhập
        </a>
      </div>
    `
  });
}

export async function sendExpertRejectedEmail(user) {
  ensureResendConfigured();
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Kết quả đăng ký chuyên gia — PeaceFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Xin chào ${user.display_name || user.full_name}</h2>
        <p style="color:#555;line-height:1.6;">
          Rất tiếc, hồ sơ đăng ký chuyên gia của bạn chưa được duyệt lần này.
          Nếu bạn cho rằng có nhầm lẫn hoặc cần bổ sung, vui lòng liên hệ đội ngũ PeaceFlow.
        </p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(user, token) {
  ensureResendConfigured();
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

function ensureResendConfigured() {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured.');
  }
}
