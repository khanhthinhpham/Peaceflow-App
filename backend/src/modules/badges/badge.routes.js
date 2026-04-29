import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as badgeController from './badge.controller.js';

const router = Router();

router.get('/badges', requireAuth, badgeController.getAllBadges);
router.get('/badges/me', requireAuth, badgeController.getMyBadges);
router.post('/badges/evaluate', requireAuth, badgeController.evaluateMyBadges);

export default router;
