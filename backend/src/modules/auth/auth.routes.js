import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import * as authController from './auth.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/register', authController.register);
router.post('/register-expert', authController.registerExpert);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/google', authController.googleLogin);
router.get('/verify-email', authController.verifyEmail);
router.get('/expert-application/me', requireAuth, authController.getMyExpertApplication);
router.post('/expert-application', requireAuth, upload.single('credential_file'), authController.submitExpertApplication);
router.get('/expert-application/approve', authController.approveExpertApplication);
router.get('/expert-application/reject', authController.rejectExpertApplication);
router.get('/expert-application/credential', authController.getExpertCredential);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
