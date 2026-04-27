import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import profileRoutes from '../modules/profiles/profile.routes.js';
import moodRoutes from '../modules/moods/mood.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import taskRoutes from '../modules/tasks/task.routes.js';
import progressRoutes from '../modules/progress/progress.routes.js';
import journalRoutes from '../modules/journals/journal.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', userRoutes);
router.use('/', profileRoutes);
router.use('/', moodRoutes);
router.use('/', reportRoutes);
router.use('/', taskRoutes);
router.use('/', progressRoutes);
router.use('/', journalRoutes);

export default router;
