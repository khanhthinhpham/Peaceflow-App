const express = require('express');
const router = express.Router();

const sendMock = (req, res, data = {}) => {
  res.json({ success: true, data });
};

// GET /api/v1/tasks
router.get('/', (req, res) => {
  sendMock(req, res, [
    { id: "task-1", title: "Standard Task 1" }
  ]);
});

// GET /api/v1/tasks/recommended
router.get('/recommended', (req, res) => {
  sendMock(req, res, [
    { id: "task-rec-1", title: "Recommended Task 1" }
  ]);
});

// GET /api/v1/tasks/:id
router.get('/:id', (req, res) => {
  sendMock(req, res, {
    id: req.params.id,
    title: "Task Details"
  });
});

// POST /api/v1/tasks/:id/start
router.post('/:id/start', (req, res) => {
  sendMock(req, res, {
    message: "Task started",
    taskId: req.params.id
  });
});

// POST /api/v1/tasks/:id/complete
router.post('/:id/complete', (req, res) => {
  sendMock(req, res, {
    message: "Task completed",
    taskId: req.params.id,
    completion_data: req.body
  });
});

// POST /api/v1/tasks/:id/skip
router.post('/:id/skip', (req, res) => {
  sendMock(req, res, {
    message: "Task skipped",
    taskId: req.params.id
  });
});

module.exports = router;
