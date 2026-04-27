const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const moodRoutes = require('./mood.routes');
const assessmentsRoutes = require('./assessments.routes');
const tasksRoutes = require('./tasks.routes');
const journalRoutes = require('./journal.routes');
const reportsRoutes = require('./reports.routes');
const progressRoutes = require('./progress.routes');
const riskRoutes = require('./risk.routes');
const emergencyRoutes = require('./emergency.routes');
const adminRoutes = require('./admin.routes');

router.use('/auth', authRoutes);
router.use('/', userRoutes); // Using /me and /profile at root of v1 or under /users? Requirements: /api/v1/me, /api/v1/profile -> So root is fine
router.use('/moods', moodRoutes);
router.use('/assessments', assessmentsRoutes); // Actually requirements have /api/v1/assessments and /api/v1/assessment-results
router.use('/tasks', tasksRoutes);
router.use('/journal', journalRoutes);
router.use('/reports', reportsRoutes);
router.use('/', progressRoutes); // /api/v1/progress, /api/v1/badges
router.use('/', riskRoutes); // /api/v1/risk-profile, /api/v1/recommendations
router.use('/emergency', emergencyRoutes);
router.use('/admin', adminRoutes);

// Fallback for assessment-results, we can map it here or in assessments.routes
// Let's map it to assessmentsRoutes but with a specific path
router.use('/assessment-results', assessmentsRoutes);

module.exports = router;
