import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as moodController from './mood.controller.js';

const router = Router();

// POST /api/v1/moods — Tạo mood check-in
router.post('/moods', requireAuth, moodController.createCheckin);

// GET /api/v1/moods — Danh sách mood check-ins
router.get('/moods', requireAuth, moodController.getCheckins);

// GET /api/v1/moods/latest — Check-in gần nhất
router.get('/moods/latest', requireAuth, moodController.getLatestCheckin);

// DELETE /api/v1/moods/:id — Xóa check-in
router.delete('/moods/:id', requireAuth, moodController.deleteCheckin);

export default router;
