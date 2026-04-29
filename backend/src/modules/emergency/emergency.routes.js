import { Router } from 'express';
import * as emergencyController from './emergency.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.get('/emergency/resources', requireAuth, emergencyController.getEmergencyResources);
router.get('/emergency/recommendations', requireAuth, emergencyController.getEmergencyRecommendations);
router.post('/emergency/log', requireAuth, emergencyController.logEmergency);
router.post('/emergency/escalate', requireAuth, emergencyController.escalateEmergency);

export default router;
