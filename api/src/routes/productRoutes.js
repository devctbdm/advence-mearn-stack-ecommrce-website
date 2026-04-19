import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { admin, protect } from '../middleware/auth.js';
import { uploadImages } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', param('id').isMongoId(), validate, getProductById);
router.post(
  '/',
  protect,
  admin,
  uploadImages.array('images', 5),
  [
    body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('description').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('category').trim().notEmpty(),
    body('productType').optional().isIn(['physical', 'digital']),
    body('discountType').optional().isIn(['percentage', 'fixed']),
    body('discountValue').optional().isFloat({ min: 0 }),
  ],
  validate,
  createProduct
);
router.put(
  '/:id',
  protect,
  admin,
  uploadImages.array('images', 5),
  [
    body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('price').optional().isFloat({ min: 0 }),
    body('discountType').optional().isIn(['percentage', 'fixed']),
    body('discountValue').optional().isFloat({ min: 0 }),
  ],
  validate,
  updateProduct
);
router.delete('/:id', protect, admin, param('id').isMongoId(), validate, deleteProduct);

export default router;
