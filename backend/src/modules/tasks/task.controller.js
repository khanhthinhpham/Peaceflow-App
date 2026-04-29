import * as taskService from './task.service.js';

/**
 * GET /api/v1/tasks
 */
export async function getAllTasks(req, res, next) {
  try {
    const filters = {
      category: req.query.category || null,
      difficulty: req.query.difficulty || null
    };
    const data = await taskService.getTasks(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks/:id
 */
export async function getTaskById(req, res, next) {
  try {
    const data = await taskService.getTaskById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks/recommended
 */
export async function getRecommendedTasks(req, res, next) {
  try {
    const data = await taskService.getRecommendedTasks(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/tasks/:id/assign — Gán nhiệm vụ cho user
 */
export async function assignTask(req, res, next) {
  try {
    const data = await taskService.assignTask(req.user.id, req.params.id);
    res.status(201).json({
      success: true,
      message: 'Đã gán nhiệm vụ',
      data
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}

/**
 * GET /api/v1/tasks/assignments — Danh sách nhiệm vụ đã gán
 */
export async function getUserAssignments(req, res, next) {
  try {
    const status = req.query.status || null;
    const data = await taskService.getUserAssignments(req.user.id, status);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/tasks/assignments/:id/skip — Bỏ qua nhiệm vụ
 */
export async function skipAssignment(req, res, next) {
  try {
    const data = await taskService.skipAssignment(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã bỏ qua nhiệm vụ', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}

/**
 * POST /api/v1/tasks/:id/complete — Hoàn thành nhiệm vụ
 */
export async function completeTask(req, res, next) {
  try {
    const result = await taskService.completeTask({
      userId: req.user.id,
      taskId: req.params.id,
      assignmentId: req.body.assignment_id || null,
      completionNotes: req.body.completion_notes || null,
      selfRatingBefore: req.body.self_rating_before ?? null,
      selfRatingAfter: req.body.self_rating_after ?? null,
      durationActual: req.body.duration_actual ?? null
    });

    res.status(201).json({
      success: true,
      message: 'Hoàn thành nhiệm vụ thành công',
      data: result
    });
  } catch (err) {
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
    }
    next(err);
  }
}
