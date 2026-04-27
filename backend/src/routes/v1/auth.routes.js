const express = require('express');
const router = express.Router();

// Mock response helper
const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
  sendMock(req, res, {
    user: {
      id: "uuid-placeholder",
      email: req.body.email || "user@example.com",
      full_name: req.body.full_name || "New User"
    },
    access_token: "mock-jwt-access-token",
    refresh_token: "mock-jwt-refresh-token"
  });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  sendMock(req, res, {
    user: {
      id: "uuid-placeholder",
      email: req.body.email || "user@example.com"
    },
    access_token: "mock-jwt-access-token",
    refresh_token: "mock-jwt-refresh-token"
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  sendMock(req, res, {
    access_token: "new-mock-jwt-access-token",
    refresh_token: "new-mock-jwt-refresh-token"
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  sendMock(req, res, { message: "Logged out successfully" });
});

module.exports = router;
