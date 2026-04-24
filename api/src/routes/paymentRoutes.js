import express from 'express';
import { body } from 'express-validator';
import {
  getPaymentStatus,
  initiateSslcommerzPayment,
  sslcommerzCancel,
  sslcommerzFail,
  sslcommerzIpn,
  sslcommerzSuccess,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/sslcommerz/initiate',
  protect,
  [body('orderId').notEmpty().withMessage('Order ID is required')],
  initiateSslcommerzPayment
);

router.post('/sslcommerz/success', sslcommerzSuccess);

router.post('/sslcommerz/fail', sslcommerzFail);

router.post('/sslcommerz/cancel', sslcommerzCancel);

router.post('/sslcommerz/ipn', sslcommerzIpn);

router.get('/status/:orderId', protect, getPaymentStatus);

export default router;
