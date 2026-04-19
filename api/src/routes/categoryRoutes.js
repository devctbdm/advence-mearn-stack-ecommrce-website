import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { admin, protect } from '../middleware/auth.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', param('id').isMongoId(), validate, getCategoryById);

router.post(
  '/',
  protect,
  admin,
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);

router.put(
  '/:id',
  protect,
  admin,
  [param('id').isMongoId(), body('name').optional().trim().notEmpty()],
  validate,
  updateCategory
);

router.delete('/:id', protect, admin, param('id').isMongoId(), validate, deleteCategory);

export default router;
