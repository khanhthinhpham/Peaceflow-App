import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();
const allowAllOrigins = env.appUrls.includes('*');
const allowedOrigins = new Set(env.appUrls);

app.use(helmet());
// Đưa CORS lên TRÊN Helmet và dùng origin: true (tự động chấp nhận mọi nguồn)
app.use(cors({
    origin: true, 
    credentials: true
}));
// Tắt tính năng chặn tài nguyên chéo của Helmet để không đánh nhau với CORS
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PeaceFlow API is running'
  });
});

app.use(env.apiPrefix, routes);

// Keep `/api/*` working for older clients while the main API stays on `/api/v1/*`.
if (env.apiPrefix !== '/api') {
  app.use('/api', routes);
}

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default app;
