import express from 'express';
import {
  cancelOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
} from '../controllers/orderController.js';
import { admin, protect } from '../middleware/auth.js';
const router = express.Router();

router.use(protect);
router.post('/', createOrder);
router.get('/myorders', getMyOrders);
router.get('/', admin, getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/pay', updateOrderToPaid);
router.put('/:id/status', admin, updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.delete('/:id', admin, deleteOrder);

export default router;
