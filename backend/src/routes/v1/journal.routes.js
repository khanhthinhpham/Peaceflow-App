const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// POST /api/v1/journal
router.post('/', (req, res) => {
  sendMock(req, res, { message: "Journal entry created", entry: req.body });
});

// GET /api/v1/journal
router.get('/', (req, res) => {
  sendMock(req, res, [
    { id: 1, title: "Morning Thoughts", content: "..." }
  ]);
});

// GET /api/v1/journal/:id
router.get('/:id', (req, res) => {
  sendMock(req, res, {
    id: req.params.id,
    title: "Morning Thoughts",
    content: "..."
  });
});

// PUT /api/v1/journal/:id
router.put('/:id', (req, res) => {
  sendMock(req, res, {
    message: "Journal updated",
    id: req.params.id,
    updated_data: req.body
  });
});

// DELETE /api/v1/journal/:id
router.delete('/:id', (req, res) => {
  sendMock(req, res, {
    message: "Journal deleted",
    id: req.params.id
  });
});

module.exports = router;
