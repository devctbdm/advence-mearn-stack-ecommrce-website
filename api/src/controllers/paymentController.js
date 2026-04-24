import { validationResult } from 'express-validator';
import getSslcz from '../config/sslcommerz.js';
import Order from '../models/Order.js';

const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

const buildSslCommerzPayload = (order, user) => ({
  store_id: process.env.SSLCOMMERZ_STORE_ID,
  store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
  total_amount: order.totalPrice,
  currency: order.currency?.code || 'BDT',
  tran_id: `ORDER_${order._id}_${Date.now()}`,
  success_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/sslcommerz/success`,
  fail_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/sslcommerz/fail`,
  cancel_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/sslcommerz/cancel`,
  ipn_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/sslcommerz/ipn`,
  shipping_method: order.shippingMethod?.name || 'Courier',
  product_name: order.items
    .map((item) => item.name)
    .join(', ')
    .substring(0, 255),
  product_category: 'General',
  product_profile: 'general',
  cus_name: user?.name || 'Guest',
  cus_email: user?.email || 'guest@example.com',
  cus_add1: order.shippingAddress?.street || 'N/A',
  cus_city: order.shippingAddress?.city || 'N/A',
  cus_postcode: order.shippingAddress?.zipCode || 'N/A',
  cus_country: order.shippingAddress?.country || 'Bangladesh',
  cus_phone: user?.phone || '01700000000',
  ship_name: user?.name || 'Guest',
  ship_add1: order.shippingAddress?.street || 'N/A',
  ship_city: order.shippingAddress?.city || 'N/A',
  ship_postcode: order.shippingAddress?.zipCode || 'N/A',
  ship_country: order.shippingAddress?.country || 'Bangladesh',
});

export const initiateSslcommerzPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const sslPayload = buildSslCommerzPayload(order, order.user);

    const response = await getSslcz().init(sslPayload);

    if (response?.status === 'SUCCESS') {
      order.paymentTransactionId = sslPayload.tran_id;
      order.paymentMethod = 'sslcommerz';
      await order.save();

      return res.json({
        success: true,
        gatewayUrl: response.GatewayPageURL,
        transactionId: sslPayload.tran_id,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Failed to initiate payment',
      details: response,
    });
  } catch (error) {
    next(error);
  }
};

export const sslcommerzSuccess = async (req, res, next) => {
  try {
    const { tran_id, val_id } = req.body;

    const order = await Order.findOne({ paymentTransactionId: tran_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const validationResponse = await getSslcz().validate({ val_id });

    if (validationResponse?.status === 'VALID' || validationResponse?.status === 'VALIDATED') {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: tran_id,
        status: 'completed',
        updateTime: new Date().toISOString(),
        emailAddress: validationResponse?.value_b || order.user?.email,
      };
      order.status = 'processing';
      await order.save();

      return res.redirect(`${frontendUrl}/payment/success?tran_id=${tran_id}`);
    }

    return res.redirect(`${frontendUrl}/payment/fail?tran_id=${tran_id}`);
  } catch (error) {
    next(error);
  }
};

export const sslcommerzFail = async (req, res, next) => {
  try {
    const { tran_id } = req.body;

    const order = await Order.findOne({ paymentTransactionId: tran_id });
    if (order) {
      order.paymentResult = {
        id: tran_id,
        status: 'failed',
        updateTime: new Date().toISOString(),
      };
      await order.save();
    }

    return res.redirect(`${frontendUrl}/payment/fail?tran_id=${tran_id}`);
  } catch (error) {
    next(error);
  }
};

export const sslcommerzCancel = async (req, res, next) => {
  try {
    const { tran_id } = req.body;

    const order = await Order.findOne({ paymentTransactionId: tran_id });
    if (order) {
      order.paymentResult = {
        id: tran_id,
        status: 'cancelled',
        updateTime: new Date().toISOString(),
      };
      await order.save();
    }

    return res.redirect(`${frontendUrl}/payment/cancel?tran_id=${tran_id}`);
  } catch (error) {
    next(error);
  }
};

export const sslcommerzIpn = async (req, res, next) => {
  try {
    const { tran_id, status } = req.body;

    const order = await Order.findOne({ paymentTransactionId: tran_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status === 'VALID' || status === 'VALIDATED') {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: tran_id,
        status: 'completed',
        updateTime: new Date().toISOString(),
      };
      order.status = 'processing';
    } else if (status === 'FAILED') {
      order.paymentResult = {
        id: tran_id,
        status: 'failed',
        updateTime: new Date().toISOString(),
      };
    }

    await order.save();
    return res.status(200).json({ message: 'IPN processed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({
      orderId: order._id,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentResult?.status || 'pending',
      transactionId: order.paymentTransactionId,
    });
  } catch (error) {
    next(error);
  }
};
