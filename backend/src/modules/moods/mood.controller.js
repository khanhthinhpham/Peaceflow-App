import * as moodService from './mood.service.js';

/**
 * POST /api/v1/moods — Tạo mood check-in
 */
export async function createCheckin(req, res, next) {
  try {
    const data = await moodService.createCheckin(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/v1/moods — Danh sách mood check-ins
 */
export async function getCheckins(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const data = await moodService.getCheckins(req.user.id, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/moods/latest — Check-in gần nhất
 */
export async function getLatestCheckin(req, res, next) {
  try {
    const data = await moodService.getLatestCheckin(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/moods/:id — Xóa check-in
 */
export async function deleteCheckin(req, res, next) {
  try {
    await moodService.deleteCheckin(req.user.id, req.params.id);
    res.json({ success: true, message: 'Đã xóa mood check-in' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}
