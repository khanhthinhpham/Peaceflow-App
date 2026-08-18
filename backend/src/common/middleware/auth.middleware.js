import { findUserById } from '../../modules/auth/auth.repository.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { isUsableStatus } from '../utils/user-status.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);

    if (!user || !isUsableStatus(user.status)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = {
      id: user.id,
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      display_name: user.display_name,
      role: user.role,
      email_verified: user.email_verified,
      status: user.status
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}
