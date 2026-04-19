import Cart from '../models/Cart.js';
import Currency from '../models/Currency.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, taxPrice, shippingPrice, shippingMethod } = req.body;

    // Get user's cart with populated products and currency
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product')
      .populate('currency');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Determine currency: use cart's currency, fallback to user's preferred
    let currency = cart.currency;
    let exchangeRateToUSD = 1;

    if (currency) {
      exchangeRateToUSD = currency.exchangeRateToUSD || 1;
    } else {
      // Fallback: get user's preferred currency or default
      const user = await User.findById(req.user.id).populate('preferredCurrency');
      if (user?.preferredCurrency) {
        currency = user.preferredCurrency;
        exchangeRateToUSD = user.preferredCurrency.exchangeRateToUSD || 1;
      } else {
        const defaultCurrency = await Currency.findOne({ isDefault: true });
        if (defaultCurrency) {
          currency = defaultCurrency;
          exchangeRateToUSD = defaultCurrency.exchangeRateToUSD || 1;
        }
      }
    }

    // Ensure we have a currency
    if (!currency) {
      return res
        .status(500)
        .json({ message: 'No currency configured. Please set a default currency.' });
    }

    // Calculate subtotal from cart items in USD
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.price || item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    // Calculate discount from applied promo code (in USD)
    let discountAmount = 0;
    let promoCode = null;

    if (cart.promoCode) {
      discountAmount = cart.promoCode.discountAmount || 0;
      promoCode = {
        code: cart.promoCode.code,
        discountType: cart.promoCode.discountType,
        discountValue: cart.promoCode.discountValue,
      };
    }

    // Check stock and prepare order items
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Product ${product.name} has insufficient stock`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price || product.price, // store price in USD
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    const itemsPrice = subtotal;
    const totalPrice = subtotal - discountAmount + (taxPrice || 0) + (shippingPrice || 0);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      discountAmount,
      promoCode,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      shippingMethod,
      totalPrice,
      currency: currency._id,
      exchangeRateToUSD,
    });

    // Clear cart after order (including promo)
    cart.items = [];
    cart.promoCode = null;
    await cart.save();

    // Return populated order
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .populate('currency', 'code symbol exchangeRateToUSD');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product', 'name images');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('items.product', 'name images');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      updateTime: req.body.updateTime,
      emailAddress: req.body.emailAddress,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    if (status === 'shipped' && trackingNumber) {
      order.trackingNumber = trackingNumber;
      order.shippedAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending orders' });
    }

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  cancelOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
};
