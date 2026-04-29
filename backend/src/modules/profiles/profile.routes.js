import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as profileController from './profile.controller.js';

const router = Router();

// GET /api/v1/profile — Lấy profile
router.get('/profile', requireAuth, profileController.getProfile);

// PUT /api/v1/profile — Cập nhật profile
router.put('/profile', requireAuth, profileController.updateProfile);

export default router;
