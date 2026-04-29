import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as reportController from './report.controller.js';

const router = Router();

router.get('/reports/summary', requireAuth, reportController.getSummary);
router.get('/reports/mood-trend', requireAuth, reportController.getMoodTrend);
router.get('/reports/task-breakdown', requireAuth, reportController.getTaskBreakdown);
router.get('/reports/assessment-history', requireAuth, reportController.getAssessmentHistory);
router.get('/reports/radar', requireAuth, reportController.getRadar);
router.get('/reports/insights', requireAuth, reportController.getInsights);
router.get('/reports/export.json', requireAuth, reportController.exportJson);

export default router;
