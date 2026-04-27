const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// POST /api/v1/emergency/log
router.post('/log', (req, res) => {
  sendMock(req, res, { message: "Emergency action logged", log: req.body });
});

// GET /api/v1/emergency/resources
router.get('/resources', (req, res) => {
  sendMock(req, res, [
    { title: "Hotline 111", phone: "111" },
    { title: "Tư vấn tâm lý miễn phí", phone: "19001234" }
  ]);
});

module.exports = router;
