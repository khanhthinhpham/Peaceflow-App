import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.appUrl,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PeaceFlow API is running'
  });
});

app.use(env.apiPrefix, routes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(status).json({
    success: false,
    message,
    ...(env.nodeEnv === 'development' && status >= 500 && { stack: err.stack })
  });
});

export default app;
