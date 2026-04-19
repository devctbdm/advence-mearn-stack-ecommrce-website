import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  color: {
    name: String,
    hex: String,
  },
  size: {
    name: String,
    stock: Number,
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  promoCode: {
    type: {
      code: String,
      discountType: String,
      discountValue: Number,
      maxDiscount: Number,
      discountAmount: Number,
    },
    default: null,
  },
  // Currency used for this cart (populated from User.preferredCurrency at checkout)
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cartSchema.pre('save', function () {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return total + price * qty;
  }, 0);

  // Calculate discount - only if promoCode exists and has discountValue
  let discount = 0;
  if (this.promoCode && this.promoCode.code && this.promoCode.discountValue != null) {
    const discountValue = Number(this.promoCode.discountValue);
    if (discountValue > 0) {
      if (this.promoCode.discountType === 'percentage') {
        discount = (this.subtotal * discountValue) / 100;
        // Apply max discount cap if set
        if (this.promoCode.maxDiscount && discount > Number(this.promoCode.maxDiscount)) {
          discount = Number(this.promoCode.maxDiscount);
        }
      } else {
        discount = discountValue;
        // Ensure discount doesn't exceed subtotal
        if (discount > this.subtotal) {
          discount = this.subtotal;
        }
      }
    }

    // Update promoCode with discountAmount
    this.promoCode.discountAmount = discount;
  } else {
    // No valid promo - ensure it's null
    this.promoCode = null;
  }

  this.totalPrice = this.subtotal - discount;
  this.updatedAt = Date.now();
});

const Cart = mongoose.model.Cart || mongoose.model('Cart', cartSchema);

export default Cart;
