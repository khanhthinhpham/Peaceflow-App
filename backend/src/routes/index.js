import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import profileRoutes from '../modules/profiles/profile.routes.js';
import moodRoutes from '../modules/moods/mood.routes.js';
import assessmentRoutes from '../modules/assessments/assessment.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import taskRoutes from '../modules/tasks/task.routes.js';
import progressRoutes from '../modules/progress/progress.routes.js';
import journalRoutes from '../modules/journals/journal.routes.js';
import expertRoutes from '../modules/experts/expert.routes.js';
import communityRoutes from '../modules/community/community.routes.js';
import emergencyRoutes from '../modules/emergency/emergency.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import cronRoutes from './cron.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', userRoutes);
router.use('/', profileRoutes);
router.use('/', moodRoutes);
router.use('/', assessmentRoutes);
router.use('/', reportRoutes);
router.use('/', taskRoutes);
router.use('/', progressRoutes);
router.use('/', journalRoutes);
router.use('/', expertRoutes);
router.use('/', communityRoutes);
router.use('/', emergencyRoutes);
router.use('/', notificationRoutes);
router.use('/', cronRoutes);
router.use('/', aiRoutes);

export default router;
