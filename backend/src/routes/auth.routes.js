import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  deleteUserAccount,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateUserProfile,
} from '../controllers/auth.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset requests. Please wait and try again.' },
});
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait and try again.' },
});

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.post('/forgot-password', forgotPasswordLimiter, requestPasswordReset);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.route('/logout').post(verifyToken, logoutUser);
router.route('/me').get(verifyToken, getCurrentUser).delete(verifyToken, deleteUserAccount);
router.route('/profile').patch(verifyToken, updateUserProfile);

export default router;
