import express from 'express';
import {
  addToCart,
  applyPromoCode,
  clearCart,
  getCart,
  removeFromCart,
  removePromoCode,
  updateCartItem,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
const router = express.Router();

router.use(protect); // All cart routes require authentication
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

// Apply promo code
router.post(
  '/apply-promo',
  [body('code').notEmpty().trim()],
  validate,
  applyPromoCode
);

// Remove promo code
router.delete('/remove-promo', removePromoCode);

export default router;
