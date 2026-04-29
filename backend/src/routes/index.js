import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import profileRoutes from '../modules/profiles/profile.routes.js';
import moodRoutes from '../modules/moods/mood.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import taskRoutes from '../modules/tasks/task.routes.js';
import progressRoutes from '../modules/progress/progress.routes.js';
import journalRoutes from '../modules/journals/journal.routes.js';
import badgeRoutes from '../modules/badges/badge.routes.js';
import assessmentRoutes from '../modules/assessments/assessment.routes.js';
import emergencyRoutes from '../modules/emergency/emergency.routes.js';
import riskRoutes from '../modules/risk/risk.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', userRoutes);
router.use('/', profileRoutes);
router.use('/', moodRoutes);
router.use('/', reportRoutes);
router.use('/', taskRoutes);
router.use('/', progressRoutes);
router.use('/', journalRoutes);
router.use('/', badgeRoutes);
router.use('/', assessmentRoutes);
router.use('/', emergencyRoutes);
router.use('/', riskRoutes);

export default router;

