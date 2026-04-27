const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// GET /api/v1/assessments
router.get('/', (req, res) => {
  if (req.baseUrl.includes('assessment-results')) {
    // Handle GET /api/v1/assessment-results
    return sendMock(req, res, [
      { id: 1, code: "pss", score: 15, created_at: new Date() }
    ]);
  }
  // Handle GET /api/v1/assessments
  sendMock(req, res, [
    { code: "pss", name: "Perceived Stress Scale" }
  ]);
});

// GET /api/v1/assessments/latest OR /api/v1/assessment-results/latest
router.get('/latest', (req, res) => {
  if (req.baseUrl.includes('assessment-results')) {
    return sendMock(req, res, { id: 1, code: "pss", score: 15, created_at: new Date() });
  }
  // This route is typically for results, but just in case
  sendMock(req, res, { message: "No latest assessment" });
});

// GET /api/v1/assessments/:code
router.get('/:code', (req, res) => {
  sendMock(req, res, {
    code: req.params.code,
    name: "Mock Assessment",
    questions: []
  });
});

// POST /api/v1/assessments/:code/submit
router.post('/:code/submit', (req, res) => {
  sendMock(req, res, {
    message: "Assessment submitted",
    code: req.params.code,
    result: { score: 20, interpretation: "Moderate stress" }
  });
});

module.exports = router;
