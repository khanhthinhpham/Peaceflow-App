import * as userService from './user.service.js';

/**
 * GET /api/v1/me
 */
export async function getCurrentUser(req, res, next) {
  try {
    const data = await userService.getCurrentUser(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/me
 */
export async function updateCurrentUser(req, res, next) {
  try {
    const data = await userService.updateCurrentUser(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}
