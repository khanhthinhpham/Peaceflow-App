const express = require('express');
const router = express.Router();

// Mock response helper
const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// GET /api/v1/me
router.get('/me', (req, res) => {
  sendMock(req, res, {
    id: "uuid-placeholder",
    email: "user@example.com",
    full_name: "Mock User",
    status: "active"
  });
});

// GET /api/v1/profile
router.get('/profile', (req, res) => {
  sendMock(req, res, {
    occupation: "Mock Job",
    relationship_status: "single",
    goals: ["reduce_stress"]
  });
});

// PUT /api/v1/profile
router.put('/profile', (req, res) => {
  sendMock(req, res, {
    message: "Profile updated successfully",
    updated_fields: req.body
  });
});

module.exports = router;
