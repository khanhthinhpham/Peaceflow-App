const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// POST /api/v1/moods
router.post('/', (req, res) => {
  sendMock(req, res, { message: "Mood check-in created", mood: req.body });
});

// GET /api/v1/moods
router.get('/', (req, res) => {
  sendMock(req, res, [
    { id: 1, score: 7, note: "Feeling okay", created_at: new Date() }
  ]);
});

// GET /api/v1/moods/latest
router.get('/latest', (req, res) => {
  sendMock(req, res, { id: 1, score: 7, note: "Feeling okay", created_at: new Date() });
});

module.exports = router;
