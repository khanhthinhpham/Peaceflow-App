const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// GET /api/v1/risk-profile
router.get('/risk-profile', (req, res) => {
  sendMock(req, res, {
    level: "moderate",
    indicators: ["sleep_deprivation"]
  });
});

// GET /api/v1/recommendations/today
router.get('/recommendations/today', (req, res) => {
  sendMock(req, res, [
    { id: "task-rec-1", type: "breathing", title: "5 phút thở đều" }
  ]);
});

// GET /api/v1/recommendations/emergency
router.get('/recommendations/emergency', (req, res) => {
  sendMock(req, res, [
    { id: "task-em-1", type: "grounding", title: "Kỹ thuật 5-4-3-2-1" }
  ]);
});

module.exports = router;
