import { Router } from 'express';

import {
  deleteUserAccount,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
} from '../controllers/auth.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyToken, logoutUser);
router.route('/me').get(verifyToken, getCurrentUser).delete(verifyToken, deleteUserAccount);
router.route('/profile').patch(verifyToken, updateUserProfile);

export default router;
