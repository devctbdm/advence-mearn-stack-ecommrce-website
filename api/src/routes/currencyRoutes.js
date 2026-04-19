import { Router } from 'express';
import {
  createCurrency,
  deleteCurrency,
  getActiveCurrencies,
  getCurrencies,
  getCurrencyById,
  getDefaultCurrency,
  toggleCurrency,
  updateCurrency,
} from '../controllers/currencyController.js';
import { admin, protect } from '../middleware/auth.js';

const router = Router();

// GET /api/currencies/active - Public active currencies
router.get('/active', getActiveCurrencies);

// GET /api/currencies/default - Public default currency
router.get('/default', getDefaultCurrency);

// Admin Routes (protected)
router.use(protect);
router.use(admin);

// GET /api/currencies - Admin: list all
router.get('/', getCurrencies);

// GET /api/currencies/:id - Admin: single currency
router.get('/:id', getCurrencyById);

// POST /api/currencies - Admin: create
router.post('/', createCurrency);

// PUT /api/currencies/:id - Admin: update
router.put('/:id', updateCurrency);

// DELETE /api/currencies/:id - Admin: delete
router.delete('/:id', deleteCurrency);

// PUT /api/currencies/:id/toggle - Admin: toggle active status
router.put('/:id/toggle', toggleCurrency);

export default router;
