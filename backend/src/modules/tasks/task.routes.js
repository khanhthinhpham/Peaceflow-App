import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as taskController from './task.controller.js';

const router = Router();

// GET /api/v1/tasks — Danh sách tất cả tasks (filter: ?category=&difficulty=)
router.get('/tasks', requireAuth, taskController.getAllTasks);

// GET /api/v1/tasks/recommended — Gợi ý tasks chưa gán
router.get('/tasks/recommended', requireAuth, taskController.getRecommendedTasks);

// GET /api/v1/tasks/assignments — Nhiệm vụ đã gán cho user (?status=pending|completed|skipped)
router.get('/tasks/assignments', requireAuth, taskController.getUserAssignments);

// GET /api/v1/tasks/:id — Chi tiết task
router.get('/tasks/:id', requireAuth, taskController.getTaskById);

// POST /api/v1/tasks/:id/assign — Gán nhiệm vụ cho user
router.post('/tasks/:id/assign', requireAuth, taskController.assignTask);

// POST /api/v1/tasks/:id/complete — Hoàn thành nhiệm vụ
router.post('/tasks/:id/complete', requireAuth, taskController.completeTask);

// POST /api/v1/tasks/assignments/:id/skip — Bỏ qua nhiệm vụ
router.post('/tasks/assignments/:id/skip', requireAuth, taskController.skipAssignment);

export default router;
