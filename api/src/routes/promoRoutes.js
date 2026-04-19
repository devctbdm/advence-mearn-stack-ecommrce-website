import express from 'express';
import { body, param } from 'express-validator';
import {
  createPromoCode,
  deletePromoCode,
  getActivePromoCodes,
  getAllPromoCodes,
  getPromoCodeById,
  togglePromoStatus,
  updatePromoCode,
} from '../controllers/promoController.js';
import { admin, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Public route - no auth required
router.get('/active', getActivePromoCodes);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(admin);

router.get('/', getAllPromoCodes);
router.get('/:id', param('id').isMongoId(), validate, getPromoCodeById);

router.post(
  '/',
  [
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Promo code is required')
      .custom((value) => {
        if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
          throw new Error('Promo code can only contain letters and numbers (A-Z, 0-9)');
        }
        return true;
      }),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('discountType')
      .trim()
      .isIn(['percentage', 'fixed'])
      .withMessage('Discount type must be percentage or fixed'),
    body('discountValue')
      .notEmpty()
      .withMessage('Discount value is required')
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
    body('minPurchase')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isFloat({ min: 0 })
      .withMessage('Minimum purchase must be a valid number'),
    body('maxDiscount')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isFloat({ min: 0 })
      .withMessage('Max discount must be a valid number'),
    body('usageLimit')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isInt({ min: 1 })
      .withMessage('Usage limit must be a positive integer'),
    body('applicableProducts').optional().isArray(),
    body('applicableCategories').optional().isArray(),
    body('isActive').optional().isBoolean(),
    body('startDate')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .trim()
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  ],
  validate,
  createPromoCode
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('code')
      .optional()
      .trim()
      .if((value) => value !== '')
      .custom((value) => {
        if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
          throw new Error('Promo code can only contain letters and numbers (A-Z, 0-9)');
        }
        return true;
      }),
    body('description').optional().trim(),
    body('discountType').optional().trim().isIn(['percentage', 'fixed']),
    body('discountValue')
      .optional()
      .trim()
      .if((value) => value !== '' && value !== null)
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
    body('minPurchase')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isFloat({ min: 0 })
      .withMessage('Minimum purchase must be a valid number'),
    body('maxDiscount')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isFloat({ min: 0 })
      .withMessage('Max discount must be a valid number'),
    body('usageLimit')
      .optional()
      .trim()
      .if((value) => value !== '' && value !== null)
      .isInt({ min: 1 })
      .withMessage('Usage limit must be a positive integer'),
    body('applicableProducts').optional().isArray(),
    body('applicableCategories').optional().isArray(),
    body('isActive').optional().isBoolean(),
    body('startDate')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .trim()
      .if((value) => value !== '')
      .isISO8601()
      .withMessage('End date must be a valid date'),
  ],
  validate,
  updatePromoCode
);

router.delete('/:id', param('id').isMongoId(), validate, deletePromoCode);
router.put('/:id/toggle', param('id').isMongoId(), validate, togglePromoStatus);

export default router;
