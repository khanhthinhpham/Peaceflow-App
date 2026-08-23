import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();

// Vercel đặt app sau proxy của nó. Không khai báo thì req.ip là IP của proxy, mọi
// người dùng dùng chung một khoá và rate limit sẽ chặn nhầm toàn bộ khách.
// Dùng số 1 (tin đúng một lớp proxy) thay vì true, để không ai giả được X-Forwarded-For.
app.set('trust proxy', 1);
const allowAllOrigins = env.appUrls.includes('*');
const allowedOrigins = new Set(env.appUrls);
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const DEBUG_ENABLED = LOG_LEVEL === 'debug';

const corsOptionsDelegate = (req, callback) => {
  const requestOrigin = req.header('Origin');

  if (!requestOrigin) {
    callback(null, { origin: false });
    return;
  }

  if (allowAllOrigins) {
    // Wildcard CORS must never be combined with credentials. Authentication is
    // sent via Authorization headers, so cookies do not need to be enabled here.
    callback(null, {
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-trace-id', 'ngrok-skip-browser-warning'],
      optionsSuccessStatus: 204
    });
    return;
  }

  if (allowedOrigins.has(requestOrigin)) {
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
  const isAllowedOrigin = requestOrigin && allowedOrigins.has(requestOrigin);

  if (allowAllOrigins) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-client-trace-id, ngrok-skip-browser-warning'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
  } else if (isAllowedOrigin) {
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
// Do not include query strings in access logs. Several one-time links use
// query tokens, and logging those URLs would turn a credential into a log leak.
app.use(morgan((tokens, req, res) => [
  tokens.method(req, res),
  req.path,
  tokens.status(req, res),
  tokens["response-time"](req, res) ? `${tokens["response-time"](req, res)} ms` : ''
].filter(Boolean).join(' ')));
app.use((req, res, next) => {
  const reqId = req.header('x-request-id') || crypto.randomUUID();
  const startedAt = Date.now();

  req.requestId = reqId;
  res.setHeader('x-request-id', reqId);

  console.info(
    `[API_REQ] id=${reqId} method=${req.method} path=${req.path} ip=${req.ip}`
  );

  if (DEBUG_ENABLED) {
    // Do not log query/body content. Requests can contain health records,
    // journal entries, credentials, or payment data.
    console.debug(`[API_REQ_DEBUG] id=${reqId} query_keys=${Object.keys(req.query || {}).join(',') || '-'} body_present=${Boolean(req.body && Object.keys(req.body).length)}`);
  }

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.info(
      `[API_RES] id=${reqId} method=${req.method} path=${req.path} status=${res.statusCode} duration_ms=${durationMs}`
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

app.use(env.apiPrefix, (req, res, next) => {
  // API responses include journals, assessments, profile and payment data.
  // Prevent browser/proxy caches from retaining those responses.
  res.setHeader('Cache-Control', 'no-store');
  next();
}, routes);

if (env.apiPrefix !== '/api') {
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  }, routes);
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
    `[API_ERR] id=${reqId} method=${req.method} path=${req.path} message=${err?.message || 'unknown'}`
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
