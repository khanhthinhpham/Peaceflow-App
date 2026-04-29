import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as riskController from './risk.controller.js';

const router = Router();

// POST /api/v1/risk/calculate — Tính stress index mới
router.post('/risk/calculate', requireAuth, riskController.calculateRisk);

// GET /api/v1/risk/latest — Lấy snapshot gần nhất
router.get('/risk/latest', requireAuth, riskController.getLatestRisk);

// GET /api/v1/risk/history — Lịch sử risk snapshots
router.get('/risk/history', requireAuth, riskController.getRiskHistory);

// GET /api/v1/risk/recommendations — Gợi ý task cá nhân hóa
router.get('/risk/recommendations', requireAuth, riskController.getRecommendations);

// GET /api/v1/risk/recommendation-history — Lịch sử gợi ý
router.get('/risk/recommendation-history', requireAuth, riskController.getRecommendationHistory);

export default router;
