import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as userController from './user.controller.js';

const router = Router();

// GET /api/v1/me — Lấy thông tin user hiện tại
router.get('/me', requireAuth, userController.getCurrentUser);

// PUT /api/v1/me — Cập nhật thông tin user
router.put('/me', requireAuth, userController.updateCurrentUser);

export default router;
