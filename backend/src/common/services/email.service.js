import { env } from '../../config/env.js';
import { sendMail, getConfiguredMailProviders } from './mail-transport.js';

const FROM = env.emailFrom;
const APP_URL = env.frontendUrl;

export async function sendVerificationEmail(user, token, locale = 'vi') {
  ensureMailConfigured();
  const link = `${APP_URL}/verify-email?token=${token}`;
  const name = user.display_name || user.full_name;

  await sendMail({
    from: FROM,
    to: user.email,
    subject: locale === 'en' ? '✉️ Confirm your email — PeaceFlow' : '✉️ Xác nhận email — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Hi ${name} 👋</h2>
        <p style="color:#555;line-height:1.6;">
          Thanks for signing up for PeaceFlow. Please confirm your email address to activate your account.
        </p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Confirm email
        </a>
        <p style="color:#999;font-size:0.85rem;">
          This link expires in 24 hours. If you didn't sign up, you can ignore this email.
        </p>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Xin chào ${name} 👋</h2>
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
  ensureMailConfigured();
  const apiBase = `${env.apiPublicUrl}${env.apiPrefix || '/api/v1'}`;
  const approveLink = `${apiBase}/auth/expert-application/approve?token=${application.approval_token}`;
  const rejectLink = `${apiBase}/auth/expert-application/reject?token=${application.approval_token}`;
  const credentialLink = `${apiBase}/auth/expert-application/credential?token=${application.approval_token}`;

  const specialties = Array.isArray(application.specialties)
    ? application.specialties.join(', ')
    : '';

  await sendMail({
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

export async function sendCommunityPostToAdmin({ postId, authorName, content, category, isAnonymous }) {
  ensureMailConfigured();
  const adminLink = `${APP_URL}/admin/community`;
  const preview = String(content || '').slice(0, 300);
  await sendMail({
    from: FROM,
    to: env.adminEmail,
    subject: `📝 Bài viết Cộng đồng mới cần duyệt — ${authorName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Bài viết Cộng đồng mới đang chờ duyệt</h2>
        <p style="color:#555;line-height:1.6;">Có bài viết mới trên Cộng đồng PeaceFlow cần bạn xem xét trước khi hiển thị công khai.</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.92rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:120px;">Tác giả</td><td><strong>${isAnonymous ? 'Ẩn danh' : authorName}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Chuyên mục</td><td>${category || '-'}</td></tr>
        </table>
        <div style="padding:14px 16px;background:#F8F4EC;border:1.5px solid #E8CBA7;border-radius:10px;color:#4A3728;line-height:1.6;white-space:pre-wrap;">${preview}${content && content.length > 300 ? '…' : ''}</div>
        <div style="margin:24px 0;">
          <a href="${adminLink}" style="display:inline-block;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Vào trang duyệt bài</a>
        </div>
        <p style="color:#999;font-size:0.8rem;">Mã bài viết: ${postId}</p>
      </div>
    `
  });
}

export async function sendExpertApprovedEmail(user, locale = 'vi') {
  ensureMailConfigured();
  const link = `${APP_URL}/login`;
  const name = user.display_name || user.full_name;
  await sendMail({
    from: FROM,
    to: user.email,
    subject: locale === 'en' ? '🎉 Your expert application was approved — PeaceFlow' : '🎉 Hồ sơ chuyên gia đã được duyệt — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Congratulations ${name} 🎉</h2>
        <p style="color:#555;line-height:1.6;">
          Your expert application has been approved. You can log in now to get started.
        </p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Log in
        </a>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Chúc mừng ${name} 🎉</h2>
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

export async function sendExpertRejectedEmail(user, locale = 'vi') {
  ensureMailConfigured();
  const name = user.display_name || user.full_name;
  await sendMail({
    from: FROM,
    to: user.email,
    subject: locale === 'en' ? 'Expert application result — PeaceFlow' : 'Kết quả đăng ký chuyên gia — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Hi ${name}</h2>
        <p style="color:#555;line-height:1.6;">
          We're sorry, your expert application was not approved this time.
          If you think this is a mistake or need to add more information, please contact the PeaceFlow team.
        </p>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Xin chào ${name}</h2>
        <p style="color:#555;line-height:1.6;">
          Rất tiếc, hồ sơ đăng ký chuyên gia của bạn chưa được duyệt lần này.
          Nếu bạn cho rằng có nhầm lẫn hoặc cần bổ sung, vui lòng liên hệ đội ngũ PeaceFlow.
        </p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(user, token, locale = 'vi') {
  ensureMailConfigured();
  const link = `${APP_URL}/reset-password?token=${token}`;

  await sendMail({
    from: FROM,
    to: user.email,
    subject: locale === 'en' ? '🔐 Reset your password — PeaceFlow' : '🔐 Đặt lại mật khẩu — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#555;line-height:1.6;">
          You just requested a password reset for the account <strong>${user.email}</strong>.
        </p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
          Reset password
        </a>
        <p style="color:#999;font-size:0.85rem;">
          This link expires in 1 hour. If you didn't request this, you can ignore this email.
        </p>
      </div>
    ` : `
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

const SESSION_LABELS = { chat: 'Chat text', voice: 'Gọi thoại', video: 'Video call', inperson: 'Gặp trực tiếp' };
const SESSION_LABELS_EN = { chat: 'Text chat', voice: 'Voice call', video: 'Video call', inperson: 'In person' };

function formatBookingTime(value, locale = 'vi') {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
    }).format(new Date(value));
  } catch (_error) {
    return String(value);
  }
}

// Gửi cho chuyên gia khi có thân chủ đặt lịch mới (chờ xác nhận).
export async function sendBookingRequestEmail({ to, expertName, clientName, sessionType, startsAt, locale = 'vi' }) {
  if (!hasMailProvider() || !to) return;
  const portalLink = `${APP_URL}/expert/dashboard`;
  const sessionLabel = (locale === 'en' ? SESSION_LABELS_EN : SESSION_LABELS)[sessionType] || sessionType;
  await sendMail({
    from: FROM,
    to,
    subject: locale === 'en' ? '🗓️ New booking request — PeaceFlow' : '🗓️ Yêu cầu đặt lịch mới — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">You have a new booking request</h2>
        <p style="color:#555;line-height:1.6;">Hi ${expertName || 'there'},</p>
        <p style="color:#555;line-height:1.6;"><strong>${clientName || 'A client'}</strong> just booked a session and is waiting for your confirmation:</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:140px;">Format</td><td><strong>${sessionLabel}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Time</td><td><strong>${formatBookingTime(startsAt, locale)}</strong></td></tr>
        </table>
        <a href="${portalLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">View & confirm</a>
        <p style="color:#999;font-size:0.85rem;">You can also confirm it from "Needs confirmation" on your expert dashboard.</p>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Bạn có một yêu cầu đặt lịch mới</h2>
        <p style="color:#555;line-height:1.6;">Xin chào ${expertName || 'chuyên gia'},</p>
        <p style="color:#555;line-height:1.6;"><strong>${clientName || 'Một thân chủ'}</strong> vừa đặt một buổi tư vấn và đang chờ bạn xác nhận:</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:140px;">Hình thức</td><td><strong>${sessionLabel}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Thời gian</td><td><strong>${formatBookingTime(startsAt, locale)}</strong></td></tr>
        </table>
        <a href="${portalLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Xem & xác nhận</a>
        <p style="color:#999;font-size:0.85rem;">Bạn cũng có thể xác nhận trong mục "Cần xác nhận" trên dashboard chuyên gia.</p>
      </div>
    `
  });
}

// Gửi cho admin ngay khi một booking mới được tạo, trước khi thanh toán được xác nhận.
export async function sendBookingCreatedAdminEmail({
  to, clientName, clientEmail, expertName, sessionType, startsAt,
  amount, orderCode, expiresAt
}) {
  if (!hasMailProvider() || !to) return;
  const adminLink = `${APP_URL}/expert/app.html?page=dashboard.html`;
  await sendMail({
    from: FROM,
    to,
    subject: '🆕 Booking mới đang chờ thanh toán — PeaceFlow',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Có booking mới đang chờ thanh toán</h2>
        <p style="color:#555;line-height:1.6;">Một thân chủ vừa tạo booking trên PeaceFlow. Vui lòng theo dõi trạng thái thanh toán.</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:160px;">Thân chủ</td><td><strong>${clientName || '-'}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Email thân chủ</td><td>${clientEmail || '-'}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Chuyên gia</td><td><strong>${expertName || '-'}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Hình thức</td><td>${SESSION_LABELS[sessionType] || sessionType || '-'}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Thời gian gọi</td><td><strong>${formatBookingTime(startsAt)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Số tiền</td><td><strong>${Number(amount || 0).toLocaleString('vi-VN')}đ</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Mã thanh toán</td><td>${orderCode || '-'}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Hạn thanh toán</td><td><strong>${formatBookingTime(expiresAt)}</strong></td></tr>
        </table>
        <a href="${adminLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Mở trang quản trị</a>
      </div>
    `
  });
}

// Gửi cho thân chủ khi chuyên gia cập nhật trạng thái lịch hẹn.
export async function sendBookingStatusEmail({ to, clientName, expertName, sessionType, startsAt, status, locale = 'vi' }) {
  if (!hasMailProvider() || !to) return;
  const info = (locale === 'en' ? {
    confirmed: {
      subject: '✅ Booking confirmed — PeaceFlow',
      title: 'Your booking has been confirmed',
      body: `Expert <strong>${expertName}</strong> has confirmed your session.`
    },
    cancelled: {
      subject: '❌ Booking cancelled — PeaceFlow',
      title: 'Booking cancelled',
      body: `We're sorry, expert <strong>${expertName}</strong> has cancelled this session. You can book another time slot.`
    },
    completed: {
      subject: '🎉 Session completed — PeaceFlow',
      title: 'Session completed',
      body: `Your session with <strong>${expertName}</strong> has been completed. Please take a moment to leave a review to help the community.`
    }
  } : {
    confirmed: {
      subject: '✅ Lịch hẹn đã được xác nhận — PeaceFlow',
      title: 'Lịch hẹn của bạn đã được xác nhận',
      body: `Chuyên gia <strong>${expertName}</strong> đã xác nhận buổi tư vấn của bạn.`
    },
    cancelled: {
      subject: '❌ Lịch hẹn đã bị hủy — PeaceFlow',
      title: 'Lịch hẹn đã bị hủy',
      body: `Rất tiếc, chuyên gia <strong>${expertName}</strong> đã hủy buổi tư vấn này. Bạn có thể đặt lại một khung giờ khác.`
    },
    completed: {
      subject: '🎉 Buổi tư vấn đã hoàn thành — PeaceFlow',
      title: 'Buổi tư vấn đã hoàn thành',
      body: `Buổi tư vấn với <strong>${expertName}</strong> đã hoàn thành. Hãy dành chút thời gian đánh giá để giúp cộng đồng nhé.`
    }
  })[status];
  if (!info) return;

  const sessionLabel = (locale === 'en' ? SESSION_LABELS_EN : SESSION_LABELS)[sessionType] || sessionType;
  const link = `${APP_URL}/experts`;
  await sendMail({
    from: FROM,
    to,
    subject: info.subject,
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">${info.title}</h2>
        <p style="color:#555;line-height:1.6;">Hi ${clientName || 'there'},</p>
        <p style="color:#555;line-height:1.6;">${info.body}</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:140px;">Format</td><td><strong>${sessionLabel}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Time</td><td><strong>${formatBookingTime(startsAt, locale)}</strong></td></tr>
        </table>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">View my bookings</a>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">${info.title}</h2>
        <p style="color:#555;line-height:1.6;">Xin chào ${clientName || 'bạn'},</p>
        <p style="color:#555;line-height:1.6;">${info.body}</p>
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:140px;">Hình thức</td><td><strong>${sessionLabel}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Thời gian</td><td><strong>${formatBookingTime(startsAt, locale)}</strong></td></tr>
        </table>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Xem lịch hẹn của tôi</a>
      </div>
    `
  });
}

export async function sendBookingConfirmedEmail({ to, recipientName, expertName, clientName, sessionType, startsAt, durationMinutes, joinUrl, startUrl, isExpert, locale = 'vi' }) {
  if (!hasMailProvider() || !to || !joinUrl) return;
  const portalLink = isExpert
    ? `${APP_URL}/expert/dashboard`
    : `${APP_URL}/experts`;
  const actionUrl = startUrl || joinUrl;
  const sessionLabel = (locale === 'en' ? SESSION_LABELS_EN : SESSION_LABELS)[sessionType] || sessionType;
  await sendMail({
    from: FROM,
    to,
    subject: locale === 'en' ? '🎥 Your Zoom link is ready — PeaceFlow' : '🎥 Link Zoom lịch hẹn đã sẵn sàng — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;">Your session now has a Zoom room</h2>
        <p style="color:#555;line-height:1.6;">Hi ${recipientName || 'there'}, expert <strong>${expertName}</strong> has confirmed the session with <strong>${clientName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:140px;">Format</td><td><strong>${sessionLabel}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Time</td><td><strong>${formatBookingTime(startsAt, locale)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Duration</td><td><strong>${durationMinutes} min</strong></td></tr>
        </table>
        <a href="${actionUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">${isExpert ? 'Start / join Zoom' : 'Join Zoom room'}</a>
        <p style="color:#777;font-size:.9rem;line-height:1.6;">You can also reopen this booking in PeaceFlow: <a href="${portalLink}">${portalLink}</a>.</p>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;">Lịch hẹn đã có phòng Zoom</h2>
        <p style="color:#555;line-height:1.6;">Xin chào ${recipientName || 'bạn'}, chuyên gia <strong>${expertName}</strong> đã xác nhận lịch tư vấn với <strong>${clientName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;color:#333;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#888;width:140px;">Hình thức</td><td><strong>${sessionLabel}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Thời gian</td><td><strong>${formatBookingTime(startsAt, locale)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Thời lượng</td><td><strong>${durationMinutes} phút</strong></td></tr>
        </table>
        <a href="${actionUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#52B788;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">${isExpert ? 'Bắt đầu / vào Zoom' : 'Vào phòng Zoom'}</a>
        <p style="color:#777;font-size:.9rem;line-height:1.6;">Bạn cũng có thể mở lại lịch hẹn trong PeaceFlow: <a href="${portalLink}">${portalLink}</a>.</p>
      </div>
    `
  });
}

function hasMailProvider() {
  return getConfiguredMailProviders().length > 0;
}

function ensureMailConfigured() {
  if (!hasMailProvider()) {
    throw new Error('Chua cau hinh nha cung cap email nao (RESEND_API_KEY / BREVO_API_KEY).');
  }
}

// Cảnh báo bảo mật: phương thức nhận thanh toán (payout) vừa thay đổi.
export async function sendPayoutMethodChangedEmail({ to, name, bankName, accountMasked, locale = 'vi' }) {
  ensureMailConfigured();
  await sendMail({
    from: FROM,
    to,
    subject: locale === 'en' ? '🔔 Your payout method has changed — PeaceFlow' : '🔔 Phương thức nhận thanh toán đã thay đổi — PeaceFlow',
    html: locale === 'en' ? `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Hi ${name || 'there'}</h2>
        <p style="color:#555;line-height:1.6;">
          Your PeaceFlow payout account has just been updated:
        </p>
        <div style="background:#F6F4EF;border:1px solid #E8CBA7;border-radius:10px;padding:14px 16px;margin:14px 0;color:#4A3728;">
          🏦 <strong>${bankName || ''}</strong><br>Account number: <strong>${accountMasked || ''}</strong>
        </div>
        <p style="color:#999;font-size:0.85rem;line-height:1.6;">
          If this <strong>wasn't you</strong>, change your password immediately and contact the PeaceFlow team —
          this could be a sign your account has been compromised.
        </p>
      </div>
    ` : `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#2D6A4F;margin-bottom:8px;">Xin chào ${name || 'bạn'}</h2>
        <p style="color:#555;line-height:1.6;">
          Tài khoản nhận thanh toán (payout) trên PeaceFlow của bạn vừa được cập nhật:
        </p>
        <div style="background:#F6F4EF;border:1px solid #E8CBA7;border-radius:10px;padding:14px 16px;margin:14px 0;color:#4A3728;">
          🏦 <strong>${bankName || ''}</strong><br>Số tài khoản: <strong>${accountMasked || ''}</strong>
        </div>
        <p style="color:#999;font-size:0.85rem;line-height:1.6;">
          Nếu <strong>không phải bạn</strong> thực hiện thay đổi này, hãy đổi mật khẩu ngay và liên hệ đội ngũ PeaceFlow —
          đây có thể là dấu hiệu tài khoản bị xâm nhập.
        </p>
      </div>
    `
  });
}
