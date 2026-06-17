import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();
const allowAllOrigins = env.appUrls.includes('*');
const allowedOrigins = new Set(env.appUrls);
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const DEBUG_ENABLED = LOG_LEVEL === 'debug';

function safePreview(value, maxLength = 600) {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  } catch (_error) {
    return '[unserializable]';
  }
}

const corsOptionsDelegate = (req, callback) => {
  const requestOrigin = req.header('Origin');

  if (!requestOrigin) {
    callback(null, { origin: false });
    return;
  }

  if (allowAllOrigins || allowedOrigins.has(requestOrigin)) {
    callback(null, {
      origin: requestOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-trace-id', 'ngrok-skip-browser-warning'],
      optionsSuccessStatus: 204
    });
    return;
  }

  callback(null, { origin: false });
};

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use((req, res, next) => {
  const requestOrigin = req.header('Origin');
  const isAllowedOrigin =
    requestOrigin && (allowAllOrigins || allowedOrigins.has(requestOrigin));

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-client-trace-id, ngrok-skip-browser-warning'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});
app.use(cors(corsOptionsDelegate));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  const reqId = req.header('x-request-id') || crypto.randomUUID();
  const startedAt = Date.now();

  req.requestId = reqId;
  res.setHeader('x-request-id', reqId);

  console.info(
    `[API_REQ] id=${reqId} method=${req.method} path=${req.originalUrl} ip=${req.ip}`
  );

  if (DEBUG_ENABLED) {
    const queryPreview = safePreview(req.query);
    const bodyPreview = safePreview(req.body);
    console.debug(`[API_REQ_DEBUG] id=${reqId} query=${queryPreview}`);
    console.debug(`[API_REQ_DEBUG] id=${reqId} body=${bodyPreview}`);
  }

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.info(
      `[API_RES] id=${reqId} method=${req.method} path=${req.originalUrl} status=${res.statusCode} duration_ms=${durationMs}`
    );
  });

  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PeaceFlow API is running'
  });
});

app.use(env.apiPrefix, routes);

if (env.apiPrefix !== '/api') {
  app.use('/api', routes);
}

app.use((err, req, res, next) => {
  const reqId = req.requestId || '-';
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File bằng cấp vượt quá dung lượng cho phép 10MB.',
      request_id: reqId
    });
  }

  console.error(
    `[API_ERR] id=${reqId} method=${req.method} path=${req.originalUrl} message=${err?.message || 'unknown'}`
  );
  if (DEBUG_ENABLED && err?.stack) {
    console.error(err.stack);
  }
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    request_id: reqId
  });
});

export default app;
