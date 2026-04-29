import * as progressService from './progress.service.js';

/**
 * GET /api/v1/progress
 */
export async function getProgress(req, res, next) {
  try {
    const data = await progressService.getProgress(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/progress/leaderboard
 */
export async function getLeaderboard(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await progressService.getLeaderboard(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
