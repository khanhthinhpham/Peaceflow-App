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
  frontendUrl: process.env.FRONTEND_URL || 'https://peaceflow.vn'
};
