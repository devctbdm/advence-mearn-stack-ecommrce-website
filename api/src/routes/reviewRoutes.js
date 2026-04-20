import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import {
  getReviews,
  getReviewById,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  approveReview,
  rejectReview,
  replyToReview,
  getPendingReviewsCount,
} from '../controllers/reviewController.js';
import { admin, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/pending-count', protect, admin, getPendingReviewsCount);

router.get('/product/:productId', getProductReviews);

router.get('/', protect, getReviews);

router.get('/:id', protect, admin, param('id').isMongoId(), validate, getReviewById);

router.post(
  '/',
  protect,
  [
    body('product').notEmpty().trim(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty().isLength({ min: 3, max: 1000 }),
  ],
  validate,
  createReview
);

router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().notEmpty().isLength({ min: 3, max: 1000 }),
  ],
  validate,
  updateReview
);

router.delete('/:id', protect, param('id').isMongoId(), validate, deleteReview);

router.put('/:id/approve', protect, admin, param('id').isMongoId(), validate, approveReview);

router.put('/:id/reject', protect, admin, param('id').isMongoId(), validate, rejectReview);

router.put(
  '/:id/reply',
  protect,
  admin,
  [param('id').isMongoId(), body('message').trim().notEmpty().isLength({ max: 1000 })],
  validate,
  replyToReview
);

export default router;
