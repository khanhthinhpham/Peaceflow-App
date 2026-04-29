import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as assessmentController from './assessment.controller.js';

const router = Router();

router.get('/assessments', requireAuth, assessmentController.getAllAssessments);
router.get('/assessments/results/latest', requireAuth, assessmentController.getLatestAssessmentResults);
router.get('/assessments/results', requireAuth, assessmentController.getMyAssessmentResults);
router.get('/assessments/:code', requireAuth, assessmentController.getAssessmentByCode);
router.post('/assessments/:code/submit', requireAuth, assessmentController.submitAssessment);

export default router;
