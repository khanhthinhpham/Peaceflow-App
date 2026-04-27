const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// GET /api/v1/progress
router.get('/progress', (req, res) => {
  sendMock(req, res, {
    xp: 1500,
    level: 5,
    streak: 12
  });
});

// GET /api/v1/badges
router.get('/badges', (req, res) => {
  sendMock(req, res, [
    { code: "first_task", name: "Mầm Non" }
  ]);
});

// GET /api/v1/badges/me
router.get('/badges/me', (req, res) => {
  sendMock(req, res, [
    { code: "first_task", unlocked_at: new Date() }
  ]);
});

module.exports = router;
