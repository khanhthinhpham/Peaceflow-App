const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// POST /api/v1/admin/tasks/import
router.post('/tasks/import', (req, res) => {
  sendMock(req, res, { message: "Tasks imported successfully from tasks-data.js" });
});

// POST /api/v1/admin/seed/badges
router.post('/seed/badges', (req, res) => {
  sendMock(req, res, { message: "Badges seeded successfully" });
});

// POST /api/v1/admin/seed/assessments
router.post('/seed/assessments', (req, res) => {
  sendMock(req, res, { message: "Assessments seeded successfully" });
});

module.exports = router;
