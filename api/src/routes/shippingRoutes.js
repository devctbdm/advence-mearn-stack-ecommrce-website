import express from 'express';
import {
  calculateShipping,
  createShippingMethod,
  deleteShippingMethod,
  getAllShippingMethodsAdmin,
  getShippingMethod,
  getShippingMethods,
  updateShippingMethod,
} from '../controllers/shippingController.js';
import { admin, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/methods', getShippingMethods);
router.get('/calculate', calculateShipping);
router.get('/admin', protect, admin, getAllShippingMethodsAdmin);
router.get('/:id', getShippingMethod);

router.post('/', protect, admin, createShippingMethod);
router.put('/:id', protect, admin, updateShippingMethod);
router.delete('/:id', protect, admin, deleteShippingMethod);

export default router;
