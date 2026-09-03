import dotenv from 'dotenv';

dotenv.config();

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const configuredOrigins = parseOrigins(
  process.env.CORS_ORIGINS || process.env.APP_URLS || process.env.APP_URL || 'http://localhost:5500'
);

export const env = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: configuredOrigins[0] || 'http://localhost:5500',
  appUrls: configuredOrigins,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '7d',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  resendApiKey: process.env.RESEND_API_KEY,
  // Nguồn gửi mail dự phòng khi Resend hết quota (gói free Resend chỉ 100 mail/ngày,
  // Brevo cho thêm 300/ngày). Xem src/common/services/mail-transport.js.
  brevoApiKey: process.env.BREVO_API_KEY,
  // Khoá AES-256 (32 byte, base64) mã hoá hồ sơ y tế cũ bệnh nhân đính kèm khi đặt lịch.
  // Xem src/common/services/crypto.service.js. Sinh bằng: crypto.randomBytes(32).toString('base64')
  medicalRecordsEncryptionKey: process.env.MEDICAL_RECORDS_ENCRYPTION_KEY,
  // Chỉ cần khi domain chưa xác thực xong ở Brevo — xem mail-transport.js.
  brevoFrom: process.env.BREVO_FROM,
  emailFrom: process.env.EMAIL_FROM || 'PeaceFlow <onboarding@resend.dev>',
  adminEmail: process.env.ADMIN_EMAIL || 'peaceflow.vn@gmail.com',
  apiPublicUrl: (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/+$/, ''),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  frontendUrl: process.env.FRONTEND_URL || 'https://peaceflow.vn',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  ragBaseUrl: process.env.RAG_BASE_URL  || 'https://noetic-edda-sometimes.ngrok-free.dev',
  ragApiKey: process.env.RAG_API_KEY,
  ragAdminKey: process.env.RAG_ADMIN_KEY,
  ragTenantId: process.env.RAG_TENANT_ID || 'peaceflow',
  // Tenant riêng cho tài liệu chuyên môn (PSS, CARS, SDQ-25, RAVEN...) — PeaceCat tra cứu
  // qua tool-calling khi cần, tách biệt hoàn toàn với RAG bài tập ở trên.
  ragKbBaseUrl: process.env.RAG_KB_BASE_URL || 'http://localhost:8888/api',
  ragKbApiKey: process.env.RAG_KB_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'BBmum3N-lH6Ig9bGbellDDyTeSxZHQbYBmbXwtQGyMguftr1YOBsonHfT3JFJfvLMYpV-O-g57qC_IFg85rWrbE',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidEmail: process.env.VAPID_EMAIL || 'mailto:admin@peaceflow.vn',

  // Zoom Server-to-Server OAuth (dùng một tài khoản Zoom của PeaceFlow làm host)
  zoomAccountId: process.env.ZOOM_ACCOUNT_ID,
  zoomClientId: process.env.ZOOM_CLIENT_ID,
  zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
  zoomHostUserId: process.env.ZOOM_HOST_USER_ID || 'me',
  zoomWebhookSecretToken: process.env.ZOOM_WEBHOOK_SECRET_TOKEN,

  // Thanh toán giữ chỗ — VietQR (miễn phí) + xác nhận thủ công
  platformBankId: process.env.PLATFORM_BANK_ID || 'MB',
  platformBankAccount: process.env.PLATFORM_BANK_ACCOUNT || '0000000000',
  platformBankName: process.env.PLATFORM_BANK_NAME || 'PEACEFLOW',
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT || 25),
  paymentExpireMinutes: Number(process.env.PAYMENT_EXPIRE_MINUTES || 30),

  // PayOS — tự động xác nhận thanh toán qua webhook
  payosClientId: process.env.PAYOS_CLIENT_ID,
  payosApiKey: process.env.PAYOS_API_KEY,
  payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY,

  // VietQR — tra cứu tên chủ tài khoản (lookup). Đăng ký tại my.vietqr.io
  vietqrClientId: process.env.VIETQR_CLIENT_ID,
  vietqrApiKey: process.env.VIETQR_API_KEY
};
