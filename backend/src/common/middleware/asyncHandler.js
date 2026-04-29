/**
 * asyncHandler — wrapper tự động bắt errors trong async route handlers
 * Loại bỏ nhu cầu try/catch trong mỗi controller
 *
 * Usage:
 *   import { asyncHandler } from '../../common/middleware/asyncHandler.js';
 *   router.get('/path', requireAuth, asyncHandler(myController));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
