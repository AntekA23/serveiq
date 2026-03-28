import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  acceptInvite,
  updateProfile,
  changePassword,
  deleteAccount,
  completeOnboarding,
  updateNotificationSettings,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Endpointy publiczne (z limiterem auth)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/accept-invite', authLimiter, acceptInvite);

// Endpointy wymagające autoryzacji
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.delete('/account', verifyToken, deleteAccount);
router.put('/onboarding', verifyToken, completeOnboarding);
router.put('/notification-settings', verifyToken, updateNotificationSettings);

export default router;
