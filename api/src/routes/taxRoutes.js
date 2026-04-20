import express from 'express';
import {
  getAllTaxes,
  getActiveTaxes,
  getTax,
  createTax,
  updateTax,
  deleteTax,
  getDefaultTax,
} from '../controllers/taxController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllTaxes);
router.get('/active', getActiveTaxes);
router.get('/default', getDefaultTax);
router.get('/:id', getTax);
router.post('/', protect, admin, createTax);
router.put('/:id', protect, admin, updateTax);
router.delete('/:id', protect, admin, deleteTax);

export default router;
