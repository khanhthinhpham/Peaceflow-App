const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// GET /api/v1/reports/summary
router.get('/summary', (req, res) => {
  sendMock(req, res, {
    total_tasks: 10,
    completed_tasks: 8,
    average_mood: 7.5
  });
});

// GET /api/v1/reports/mood-chart
router.get('/mood-chart', (req, res) => {
  sendMock(req, res, {
    labels: ["Mon", "Tue", "Wed"],
    data: [6, 7, 8]
  });
});

// GET /api/v1/reports/heatmap
router.get('/heatmap', (req, res) => {
  sendMock(req, res, [
    { date: "2026-04-26", value: 10 }
  ]);
});

// GET /api/v1/reports/assessments
router.get('/assessments', (req, res) => {
  sendMock(req, res, {
    report: "Assessment overview"
  });
});

module.exports = router;
