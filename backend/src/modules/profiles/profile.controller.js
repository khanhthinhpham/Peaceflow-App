import * as profileService from './profile.service.js';

/**
 * GET /api/v1/profile
 */
export async function getProfile(req, res, next) {
  try {
    const data = await profileService.getProfile(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/profile
 */
export async function updateProfile(req, res, next) {
  try {
    const data = await profileService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
}
