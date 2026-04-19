import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'cash_on_delivery'],
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    emailAddress: String,
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  discountAmount: {
    type: Number,
    default: 0.0,
  },
  promoCode: {
    code: String,
    discountType: String,
    discountValue: Number,
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxName: {
    type: String,
    default: "Tax",
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingMethod: {
    methodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShippingMethod',
    },
    name: String,
    description: String,
    estimatedDays: Number,
  },
  trackingNumber: {
    type: String,
  },
  trackingUrl: {
    type: String,
  },
  shippedAt: {
    type: Date,
  },
  // Currency used for this order
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
    required: true,
  },
  exchangeRateToUSD: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model.Order || mongoose.model('Order', orderSchema);

export default Order;
