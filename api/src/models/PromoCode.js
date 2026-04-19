import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a promo code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, 'Please add discount value'],
    min: 0,
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    default: null,
  },
  usageLimit: {
    type: Number,
    default: null,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  applicableCategories: [{
    type: String,
  }],
  isOneTime: {
    type: Boolean,
    default: false,
  },
  usedByUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PromoCode = mongoose.model.PromoCode || mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
