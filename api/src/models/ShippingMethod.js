import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDays: {
      type: Number,
      required: true,
      min: 1,
    },
    freeThreshold: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);

export default ShippingMethod;
