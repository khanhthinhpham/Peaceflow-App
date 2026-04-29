import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as progressController from './progress.controller.js';

const router = Router();

// GET /api/v1/progress — Tiến trình cá nhân
router.get('/progress', requireAuth, progressController.getProgress);

// GET /api/v1/progress/leaderboard — Bảng xếp hạng
router.get('/progress/leaderboard', requireAuth, progressController.getLeaderboard);

export default router;
