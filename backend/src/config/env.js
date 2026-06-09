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
  emailFrom: process.env.EMAIL_FROM || 'PeaceFlow <onboarding@resend.dev>',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  frontendUrl: process.env.FRONTEND_URL || 'https://peaceflow.vn',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  ragBaseUrl: process.env.RAG_BASE_URL  || 'https://noetic-edda-sometimes.ngrok-free.dev',
  ragApiKey: process.env.RAG_API_KEY,
  ragAdminKey: process.env.RAG_ADMIN_KEY,
  ragTenantId: process.env.RAG_TENANT_ID || 'peaceflow',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'BBmum3N-lH6Ig9bGbellDDyTeSxZHQbYBmbXwtQGyMguftr1YOBsonHfT3JFJfvLMYpV-O-g57qC_IFg85rWrbE',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidEmail: process.env.VAPID_EMAIL || 'mailto:admin@peaceflow.vn'
};
