import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as authController from './auth.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function limitMessage(message) {
  return { success: false, message };
}

const RATE_LIMIT_BASE = {
  standardHeaders: true,
  legacyHeaders: false
};

// Chống dò mật khẩu. skipSuccessfulRequests để người đăng nhập đúng không bị tính,
// nhờ vậy người dùng bình thường gần như không bao giờ chạm ngưỡng.
const loginLimiter = rateLimit({
  ...RATE_LIMIT_BASE,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: limitMessage('Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.')
});

const registerLimiter = rateLimit({
  ...RATE_LIMIT_BASE,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: limitMessage('Bạn đã tạo quá nhiều tài khoản từ thiết bị này. Vui lòng thử lại sau 1 giờ.')
});

// Hai tầng cho các endpoint gửi email:
//
//  - Theo địa chỉ email: chặn việc dội bom vào hộp thư của một người cụ thể.
//    Không gộp IP vào khoá, nếu không kẻ đổi IP vẫn dội được vào cùng một email.
//  - Theo IP (keyGenerator mặc định, đã xử lý đúng IPv6): chặn việc rải email
//    hàng loạt tới nhiều địa chỉ khác nhau.
//
// Cả hai đều bảo vệ quota Resend và uy tín domain — nếu domain bị đánh dấu spam
// thì email xác nhận của khách thật sẽ rơi vào hộp thư rác.
const emailPerAddressLimiter = rateLimit({
  ...RATE_LIMIT_BASE,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: (req) => String(req.body?.email || '').trim().toLowerCase() || 'khong-co-email',
  message: limitMessage('Địa chỉ email này đã được yêu cầu gửi thư quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.')
});

const emailPerIpLimiter = rateLimit({
  ...RATE_LIMIT_BASE,
  windowMs: 60 * 60 * 1000,
  limit: 15,
  message: limitMessage('Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau.')
});

const emailLimiters = [emailPerIpLimiter, emailPerAddressLimiter];

router.post('/register', registerLimiter, authController.register);
router.post('/register-expert', registerLimiter, authController.registerExpert);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/google', authController.googleLogin);
router.get('/verify-email', authController.verifyEmail);
router.get('/expert-application/me', requireAuth, authController.getMyExpertApplication);
router.post('/expert-application', requireAuth, upload.single('credential_file'), authController.submitExpertApplication);
router.get('/expert-application/approve', authController.approveExpertApplication);
router.get('/expert-application/reject', authController.rejectExpertApplication);
router.get('/expert-application/credential', authController.getExpertCredential);
router.post('/resend-verification', emailLimiters, authController.resendVerification);
router.post('/forgot-password', emailLimiters, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
