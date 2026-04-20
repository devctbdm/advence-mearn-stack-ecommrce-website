import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { admin, protect } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  getCurrencies,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/', getAllUsers);
router.get('/:id', param('id').isMongoId(), validate, getUserById);
router.get('/currencies', getCurrencies);
router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']),
  ],
  validate,
  updateUser
);
router.delete('/:id', param('id').isMongoId(), validate, deleteUser);

export default router;
