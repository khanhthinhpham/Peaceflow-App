import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as journalController from './journal.controller.js';

const router = Router();

// GET /api/v1/journal — Danh sách nhật ký
router.get('/journal', requireAuth, journalController.getEntries);

// GET /api/v1/journal/:id — Chi tiết nhật ký
router.get('/journal/:id', requireAuth, journalController.getEntryById);

// POST /api/v1/journal — Tạo nhật ký mới
router.post('/journal', requireAuth, journalController.createEntry);

// PUT /api/v1/journal/:id — Cập nhật nhật ký
router.put('/journal/:id', requireAuth, journalController.updateEntry);

// DELETE /api/v1/journal/:id — Xóa nhật ký
router.delete('/journal/:id', requireAuth, journalController.deleteEntry);

export default router;
