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
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default app;
