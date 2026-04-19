import Cart from '../models/Cart.js';
import Currency from '../models/Currency.js';
import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import User from '../models/User.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Ensure cart has currency set
    if (!cart.currency) {
      const user = await User.findById(req.user.id).populate('preferredCurrency');
      if (user?.preferredCurrency) {
        cart.currency = user.preferredCurrency._id;
      } else {
        const defaultCurrency = await Currency.findOne({ isDefault: true });
        if (defaultCurrency) {
          cart.currency = defaultCurrency._id;
        }
      }
      await cart.save();
      await cart.populate('currency');
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, color, size } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      // Create cart with user's preferred currency
      const user = await User.findById(req.user.id).populate('preferredCurrency');
      let currencyId = user?.preferredCurrency?._id;
      if (!currencyId) {
        const defaultCurrency = await Currency.findOne({ isDefault: true });
        if (defaultCurrency) {
          currencyId = defaultCurrency._id;
        }
      }
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        currency: currencyId,
      });
    }

    const itemKey = `${productId}-${color?.name || ''}-${size?.name || ''}`;
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color?.name === (color?.name || '') &&
        item.size?.name === (size?.name || '')
    );

    // Calculate effective price with product discount if applicable
    let itemPrice = product.price;
    if (product.discountType === 'percentage' && product.discountValue != null) {
      itemPrice = Math.max(0, product.price * (1 - product.discountValue / 100));
    } else if (product.discountType === 'fixed' && product.discountValue != null) {
      itemPrice = Math.max(0, product.price - product.discountValue);
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].price = itemPrice;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: itemPrice,
        color: color || null,
        size: size || null,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');
    await cart.populate('currency');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);

    await cart.save();
    await cart.populate('items.product');
    await cart.populate('currency');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (cart) {
      cart.items = [];
      cart.promoCode = null;
      await cart.save();
      await cart.populate('currency');
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply promo code to cart
// @route   POST /api/cart/apply-promo
// @access  Private
const applyPromoCode = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Promo code is required' });
    }

    // Find promo code (case-insensitive)
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Check if promo is active
    if (!promo.isActive) {
      return res.status(400).json({ message: 'This promo code is not active' });
    }

    // Check if promo has expired (date-only comparison)
    const today = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    const startDateOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (todayOnly > endDateOnly) {
      return res.status(400).json({ message: 'This promo code has expired' });
    }

    // Check if promo hasn't started yet
    if (promo.startDate && todayOnly < startDateOnly) {
      return res.status(400).json({ message: 'This promo code is not yet valid' });
    }

    // Check usage limit
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'This promo code has reached its usage limit' });
    }

    // Check if this is a one-time promo and user has already used it
    if (promo.isOneTime && promo.usedByUsers) {
      const hasUsed = promo.usedByUsers.some((userId) => userId.toString() === req.user.id);
      if (hasUsed) {
        return res.status(400).json({ message: 'You have already used this promo code' });
      }
    }

    // Get user's cart
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Ensure cart has currency (fallback to user's preferred or default)
    if (!cart.currency) {
      const user = await User.findById(req.user.id).populate('preferredCurrency');
      if (user?.preferredCurrency) {
        cart.currency = user.preferredCurrency._id;
      } else {
        const defaultCurrency = await Currency.findOne({ isDefault: true });
        if (defaultCurrency) {
          cart.currency = defaultCurrency._id;
        }
      }
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Check minimum purchase
    if (promo.minPurchase > 0 && subtotal < promo.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of $${promo.minPurchase} required for this promo`,
      });
    }

    // Save promo to cart
    cart.promoCode = {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscount: promo.maxDiscount || null,
    };

    // Update promo usage stats
    promo.usedCount = (promo.usedCount || 0) + 1;
    if (promo.isOneTime) {
      if (!promo.usedByUsers) {
        promo.usedByUsers = [];
      }
      promo.usedByUsers.push(req.user.id);
    }
    await promo.save();

    await cart.save();
    await cart.populate('items.product');
    await cart.populate('currency');

    res.json({
      cart,
      message: 'Promo code applied successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove promo code from cart
// @route   DELETE /api/cart/remove-promo
// @access  Private
const removePromoCode = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    // Use direct update to ensure it saves
    const result = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $unset: { promoCode: 1 } },
      { new: true }
    )
      .populate('items.product')
      .populate('currency');

    if (!result) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json({ cart: result, message: 'Promo code removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  addToCart,
  applyPromoCode,
  clearCart,
  getCart,
  removeFromCart,
  removePromoCode,
  updateCartItem,
};
