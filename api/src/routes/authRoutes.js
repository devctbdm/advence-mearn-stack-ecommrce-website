import express from 'express';
import { body } from 'express-validator';
import {
  changePassword,
  forgotPassword,
  getMe,
  loginUser,
  logout,
  refreshToken,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';
import { updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { getCurrencies } from '../controllers/userController.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  loginUser
);

router.post('/refresh', [body('refreshToken').notEmpty()], validate, refreshToken);

router.post('/logout', protect, logout);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [body('resetToken').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  resetPassword
);

router.post('/verify-email', [body('verificationToken').notEmpty()], validate, verifyEmail);

router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  validate,
  resendVerification
);

router.get('/me', protect, getMe);

router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

router.get('/check-admin', protect, (req, res) => {
  res.json({ isAdmin: req.user.role === 'admin' });
});

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.zipCode').optional().trim(),
    body('address.country').optional().trim(),
    body('preferredCurrency').optional().isMongoId(),
  ],
  validate,
  updateProfile
);

// GET /api/auth/currencies - Get active currencies for user selection
router.get('/currencies', protect, getCurrencies);

router.put(
  '/change-password',
  protect,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  changePassword
);

export default router;
